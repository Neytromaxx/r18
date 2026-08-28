<script setup>
// To'lov holati sahifasi — Payme'dan qaytgach ochiladi (/pay/:intentId).
// Har 2s da poll (maks 2 daqiqa): paid | cancelled/failed | timeout.
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { billingApi } from '../api/billing.api'
import { fmtSom } from '@/shared/utils/money'

const route = useRoute()
const router = useRouter()
const intentId = route.params.intentId

const state = ref('loading')   // loading | paid | cancelled | timeout | notfound
const intent = ref(null)
let timer = null
let elapsed = 0
const MAX_MS = 120000
const STEP_MS = 2000

async function poll() {
  try {
    const { data } = await billingApi.getIntent(intentId)
    intent.value = data
    if (data.status === 'paid') { state.value = 'paid'; stop(); return }
    if (data.status === 'cancelled' || data.status === 'failed') {
      state.value = 'cancelled'; stop(); return
    }
    elapsed += STEP_MS
    if (elapsed >= MAX_MS) { state.value = 'timeout'; stop() }
  } catch (e) {
    if (e.response?.status === 404) { state.value = 'notfound'; stop() }
  }
}

function stop() { if (timer) { clearInterval(timer); timer = null } }
function retryPoll() { state.value = 'loading'; elapsed = 0; timer = setInterval(poll, STEP_MS); poll() }

onMounted(retryPoll)
onUnmounted(stop)
</script>

<template>
  <div class="pay-root">
    <div class="card">
      <!-- Kutish -->
      <template v-if="state === 'loading'">
        <i class="fa-solid fa-spinner fa-spin big accent"></i>
        <h2>To'lov tekshirilmoqda…</h2>
        <p class="dim">Payme tasdig'ini kutyapmiz. Bu sahifani yopmang.</p>
      </template>

      <!-- Muvaffaqiyat -->
      <template v-else-if="state === 'paid'">
        <i class="fa-solid fa-circle-check big ok"></i>
        <h2 v-if="intent?.kind === 'topup'">Balans to'ldirildi!</h2>
        <h2 v-else>Donat yetkazildi! 🎉</h2>
        <p class="amount">{{ fmtSom(intent?.amount) }} so'm</p>
        <p v-if="intent?.kind === 'topup'" class="dim">+1% W coin bonus hisobingizda.</p>
        <button class="btn" @click="router.push(intent?.kind === 'topup' ? '/hub' : '/')">Davom etish</button>
      </template>

      <!-- Bekor/xato -->
      <template v-else-if="state === 'cancelled'">
        <i class="fa-solid fa-circle-xmark big err"></i>
        <h2>To'lov amalga oshmadi</h2>
        <p class="dim">To'lov bekor qilindi yoki xato yuz berdi.</p>
        <button class="btn" @click="router.back()">Qaytadan urinish</button>
      </template>

      <!-- Timeout -->
      <template v-else-if="state === 'timeout'">
        <i class="fa-solid fa-clock big warn"></i>
        <h2>Hali tasdiqlanmadi</h2>
        <p class="dim">To'lov hali Payme tomonidan tasdiqlanmadi. Birozdan so'ng tekshiring.</p>
        <button class="btn" @click="retryPoll">Qayta tekshirish</button>
      </template>

      <template v-else>
        <i class="fa-solid fa-circle-question big dim"></i>
        <h2>To'lov topilmadi</h2>
        <button class="btn" @click="router.push('/')">Bosh sahifa</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pay-root { min-height: 100dvh; display: grid; place-items: center; padding: 20px; }
.card {
  width: min(94vw, 420px); padding: 32px 24px; text-align: center;
  border-radius: 20px; background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}
.big { font-size: 44px; margin-bottom: 14px; }
.accent { color: var(--c-accent, #00d4ff); }
.ok { color: var(--c-success, #22c55e); }
.err { color: #ef4444; }
.warn { color: var(--c-warning, #f59e0b); }
h2 { font-size: 1.25rem; font-weight: 900; }
.amount { font-size: 1.6rem; font-weight: 900; color: var(--c-text, #eaf2ff); margin-top: 6px; }
.dim { color: var(--c-text-dim, #9fb2c8); font-size: 0.9rem; margin-top: 6px; }
.btn { margin-top: 18px; height: 46px; padding: 0 26px; border-radius: 12px; border: none; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; }
</style>
