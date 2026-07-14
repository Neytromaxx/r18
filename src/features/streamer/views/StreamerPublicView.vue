<script setup>
// Public streamer donat sahifasi (DonationAlerts uslubi) — /s/:public_id.
// Har kim ko'ra oladi; donat qilish uchun tizimga kirish talab qilinadi.
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { streamerApi, STREAM_PLATFORMS } from '../api/streamer.api'
import { donationsApi } from '@/features/donations/api/donations.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { fmtSom } from '@/shared/utils/money'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const publicId = route.params.public_id
const loading = ref(true)
const notFound = ref(false)
const profile = ref(null)

const amount = ref('')
const message = ref('')
const sending = ref(false)

const platforms = STREAM_PLATFORMS

function linkList() {
  const l = profile.value?.links || {}
  return platforms.filter((p) => l[p.key]).map((p) => ({ ...p, url: l[p.key] }))
}

async function load() {
  loading.value = true
  try {
    const { data } = await streamerApi.publicProfile(publicId)
    profile.value = data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function donate() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  const amt = Number(amount.value)
  const min = Number(profile.value?.min_amount) || 1
  if (!amt || amt < min) { toast.error(`Minimal ${fmtSom(min)} so'm`); return }
  sending.value = true
  try {
    await donationsApi.donate({
      recipient_type: 'player',
      recipient_public_id: publicId,
      amount: amt,
      message: message.value.trim() || null,
    })
    toast.success(`${profile.value.display_name}'ga ${fmtSom(amt)} so'm yuborildi!`)
    amount.value = ''; message.value = ''
  } catch (e) {
    toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Yuborilmadi')
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="sp-root">
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="notFound" class="muted">
      <i class="fa-solid fa-user-slash"></i>
      <p>Streamer topilmadi.</p>
    </div>

    <div v-else class="card">
      <div class="avatar"><i class="fa-solid fa-video"></i></div>
      <h1 class="name">{{ profile.display_name }}</h1>
      <p v-if="profile.nickname" class="handle">@{{ profile.nickname }} · #{{ publicId }}</p>

      <!-- Platforma havolalari -->
      <div v-if="linkList().length" class="links">
        <a
          v-for="l in linkList()"
          :key="l.key"
          :href="l.url"
          target="_blank"
          rel="noopener"
          class="link"
          :style="{ color: l.color }"
        >
          <i :class="l.icon"></i>
        </a>
      </div>

      <!-- Donat -->
      <div class="donate">
        <h2>Donat yuborish</h2>
        <input v-model="amount" type="number" :min="profile.min_amount || 1" :placeholder="`Summa (min ${fmtSom(profile.min_amount || 0)} so'm)`" class="inp" />
        <input v-model="message" type="text" maxlength="280" placeholder="Xabar (ixtiyoriy)" class="inp" />
        <button class="btn-send" :disabled="sending" @click="donate">
          <i class="fa-solid fa-hand-holding-heart"></i>
          <template v-if="!auth.isAuthenticated">Kirish va donat</template>
          <template v-else>{{ sending ? 'Yuborilmoqda…' : 'Donat yuborish' }}</template>
        </button>
        <p class="note">Donat ichki wallet balansingizdan yechiladi.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sp-root {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(0, 212, 255, 0.14), transparent),
    var(--c-bg-base, #04101f);
}
.muted { color: var(--c-text-dim, #9fb2c8); text-align: center; }
.muted i { font-size: 32px; opacity: 0.5; }
.muted p { margin-top: 10px; }
.card {
  width: min(94vw, 440px);
  padding: 28px 22px;
  border-radius: 20px;
  text-align: center;
  background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.avatar {
  width: 84px; height: 84px; margin: 0 auto 14px;
  border-radius: 50%; display: grid; place-items: center;
  font-size: 34px; color: var(--c-accent, #00d4ff);
  background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.4);
}
.name { font-size: 1.6rem; font-weight: 900; }
.handle { color: var(--c-text-dim, #9fb2c8); font-size: var(--fs-sm, 0.85rem); margin-top: 2px; }
.links { display: flex; justify-content: center; gap: 14px; margin: 16px 0; }
.link { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); transition: transform 0.15s; }
.link:hover { transform: translateY(-3px); }
.donate { margin-top: 18px; text-align: left; }
.donate h2 { font-size: 1rem; font-weight: 800; margin-bottom: 10px; text-align: center; }
.inp { width: 100%; height: 46px; margin-bottom: 8px; padding: 0 14px; border-radius: 12px; background: rgba(6, 13, 26, 0.7); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); color: var(--c-text, #eaf2ff); }
.btn-send { width: 100%; height: 50px; margin-top: 4px; border-radius: 14px; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-send:disabled { opacity: 0.5; }
.note { text-align: center; font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); margin-top: 8px; }
</style>
