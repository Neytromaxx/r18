<script setup>
// To'lov holati sahifasi — Payme'dan qaytgach ochiladi (/pay/:intentId).
// Har 2s da poll (maks 2 daqiqa): paid | cancelled/failed | timeout.
//
// Donat W (backend `reward`):
//   aʼzo donatori — "+50 W keshbek (+100 W birinchi donat bonusi)";
//   mehmon — W "ajratiladi": "Olish" faqat toʻlovni boshlagan brauzerda
//   (token localStorage da, `epd_claim:{intentId}`). Kirmagan boʻlsa —
//   login → shu sahifaga `?claim=1` bilan qaytadi va W avtomatik olinadi.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { billingApi } from '../api/billing.api'
import { donationsApi } from '@/features/donations/api/donations.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { fmtSom } from '@/shared/utils/money'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const intentId = route.params.intentId
const CLAIM_KEY = `epd_claim:${intentId}`

const state = ref('loading')   // loading | paid | cancelled | timeout | notfound
const intent = ref(null)
let timer = null
let elapsed = 0
const MAX_MS = 120000
const STEP_MS = 2000

// ── W olish ─────────────────────────────────────────────────
const claimToken = ref(readToken())
const claiming = ref(false)
const claimResult = ref(null)   // { message, ok }

function readToken() {
  try { return localStorage.getItem(CLAIM_KEY) } catch { return null }
}
function dropToken() {
  try { localStorage.removeItem(CLAIM_KEY) } catch { /* yoʻq */ }
  claimToken.value = null
}

const reward = computed(() => intent.value?.reward || null)
// "Olish" taklifi — faqat tokeni bor (toʻlovni boshlagan) brauzerda
// Aʼzo donatori oʻz W xabarini koʻradi (mehmon sahifani ochganda emas)
const intentIsMine = computed(() => auth.isAuthenticated && !claimToken.value)
const canClaim = computed(() => (
  reward.value?.status === 'pending' && !!claimToken.value && !claimResult.value
))

async function claim() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: `/pay/${intentId}?claim=1` } })
    return
  }
  claiming.value = true
  try {
    const { data } = await donationsApi.claimReward(intentId, claimToken.value)
    claimResult.value = { ok: true, message: data.message }
    dropToken()
  } catch (e) {
    const err = e.response?.data?.error
    claimResult.value = { ok: false, message: err?.message || 'W ni olib boʻlmadi.' }
    // Muddati oʻtgan yoki boshqa hisob olgan — token endi kerak emas
    if (['claim_expired', 'already_claimed', 'reward_not_found'].includes(err?.code)) dropToken()
  } finally {
    claiming.value = false
  }
}

async function poll() {
  try {
    const { data } = await billingApi.getIntent(intentId)
    intent.value = data
    if (data.status === 'paid') {
      state.value = 'paid'
      stop()
      // Login → qaytish: W avtomatik olinadi
      if (route.query.claim === '1' && auth.isAuthenticated && canClaim.value) claim()
      return
    }
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
        <h2>Toʻlov tekshirilmoqda…</h2>
        <p class="dim">Payme tasdigʻini kutyapmiz. Bu sahifani yopmang.</p>
      </template>

      <!-- Muvaffaqiyat -->
      <template v-else-if="state === 'paid'">
        <i class="fa-solid fa-circle-check big ok"></i>
        <h2 v-if="intent?.kind === 'topup'">Balans toʻldirildi!</h2>
        <h2 v-else>Donat yetkazildi! 🎉</h2>
        <p class="amount">{{ fmtSom(intent?.amount) }} soʻm</p>
        <p v-if="intent?.kind === 'topup'" class="dim">+1% W coin bonus hisobingizda.</p>

        <!-- Donat W -->
        <template v-if="intent?.kind === 'donation' && reward">
          <div v-if="claimResult" class="w-box" :class="{ bad: !claimResult.ok }" data-test="claim-result">
            <i :class="claimResult.ok ? 'fa-solid fa-coins' : 'fa-solid fa-circle-info'"></i>
            <span>{{ claimResult.message }}</span>
          </div>
          <div v-else-if="canClaim" class="w-box offer" data-test="claim-offer">
            <i class="fa-solid fa-gift"></i>
            <span>{{ reward.message }}</span>
            <button class="btn w-btn" :disabled="claiming" data-test="claim" @click="claim">
              <i class="fa-solid fa-hand-holding-dollar"></i>
              {{ claiming ? 'Olinmoqda…' : 'Olish' }}
            </button>
          </div>
          <div
            v-else-if="reward.status === 'expired' && claimToken"
            class="w-box bad"
          >
            <i class="fa-solid fa-clock"></i><span>{{ reward.message }}</span>
          </div>
          <div
            v-else-if="reward.status === 'claimed' && reward.message && intentIsMine"
            class="w-box"
            data-test="member-w"
          >
            <i class="fa-solid fa-coins"></i><span>{{ reward.message }}</span>
          </div>
        </template>

        <button class="btn" @click="router.push('/')">Davom etish</button>
      </template>

      <!-- Bekor/xato -->
      <template v-else-if="state === 'cancelled'">
        <i class="fa-solid fa-circle-xmark big err"></i>
        <h2>Toʻlov amalga oshmadi</h2>
        <p class="dim">Toʻlov bekor qilindi yoki xato yuz berdi.</p>
        <button class="btn" @click="router.back()">Qaytadan urinish</button>
      </template>

      <!-- Timeout -->
      <template v-else-if="state === 'timeout'">
        <i class="fa-solid fa-clock big warn"></i>
        <h2>Hali tasdiqlanmadi</h2>
        <p class="dim">Toʻlov hali Payme tomonidan tasdiqlanmadi. Birozdan soʻng tekshiring.</p>
        <button class="btn" @click="retryPoll">Qayta tekshirish</button>
      </template>

      <template v-else>
        <i class="fa-solid fa-circle-question big dim"></i>
        <h2>Toʻlov topilmadi</h2>
        <button class="btn" @click="router.push('/')">Bosh sahifa</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pay-root { min-height: 100dvh; display: grid; place-items: center; padding: 20px; }
.card {
  width: min(100%, 420px); padding: 32px 24px; text-align: center;
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
.w-box {
  margin-top: 16px; padding: 12px 14px; border-radius: 14px; text-align: left;
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px;
  background: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.4);
  color: #fde68a; font-size: 0.9rem; font-weight: 700; line-height: 1.4;
}
.w-box > i { color: #facc15; font-size: 1.1rem; }
.w-box > span { flex: 1; min-width: 200px; }
.w-box.bad { background: rgba(255, 255, 255, 0.04); border-color: var(--glass-border, rgba(89, 133, 189, 0.25)); color: var(--c-text-dim, #9fb2c8); }
.w-box.bad > i { color: var(--c-text-dim, #9fb2c8); }
.btn.w-btn { margin-top: 0; width: 100%; background: #facc15; color: #1f1600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn { margin-top: 18px; height: 46px; padding: 0 26px; border-radius: 12px; border: none; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; }
</style>
