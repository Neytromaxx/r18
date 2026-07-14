<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '../store/auth.store'
import GoogleSignInButton from '../components/GoogleSignInButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const loading = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function handleSubmit() {
  const value = email.value.trim().toLowerCase()
  if (!EMAIL_RE.test(value)) {
    toast.error("Email manzilini to'g'ri kiriting")
    return
  }
  loading.value = true
  try {
    // Yangi email bo'lsa akkaunt avtomatik yaratiladi — parol kerak emas
    await auth.requestLoginCode(value)
    toast.success('Kod emailingizga yuborildi')
    router.push({
      name: 'verify-code',
      query: { email: value, redirect: route.query.redirect || undefined },
    })
  } catch (e) {
    toast.error(e.response?.data?.detail || "Kod yuborib bo'lmadi")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-bg"></div>

  <div class="login-page">
    <!-- Brand -->
    <div class="brand">
      <div class="brand-logo"><i class="fa-solid fa-bolt"></i></div>
      <h1 class="brand-name">Epsilon <b>Donation</b></h1>
      <p class="brand-sub">Streamerlar uchun donat platformasi</p>
    </div>

    <div class="card glass anim-rise">
      <p class="desc">
        Email manzilingizni kiriting — 6 xonali kod yuboramiz.
        Yangi bo'lsangiz akkaunt avtomatik ochiladi, parol kerak emas.
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="siz@example.com"
            autocomplete="email"
            inputmode="email"
            autofocus
          />
        </div>

        <button class="btn-main press" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Kod yuborish</span>
        </button>
      </form>

      <div class="divider"><span>YOKI</span></div>

      <div class="google-wrap">
        <GoogleSignInButton />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sp-lg) var(--sp-md);
  gap: var(--sp-xl);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
}
.brand-logo {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  font-size: 1.8rem;
  color: var(--c-accent);
}
.brand-name { font-size: var(--fs-xl); font-weight: 700; }
.brand-name b { color: var(--c-accent); font-weight: 800; }
.brand-sub { color: var(--c-text-dim); font-size: var(--fs-sm); }

.card {
  width: 100%;
  max-width: 420px;
  padding: var(--sp-xl);
}

.desc {
  color: var(--c-text-dim);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin-bottom: var(--sp-lg);
  text-align: center;
}

.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-md); }
.field label {
  font-size: 0.75rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field input {
  height: var(--touch-min);
  padding: 0 var(--sp-md);
  background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-md);
  color: var(--c-text);
  font-size: var(--fs-base);
}
.field input:focus { outline: none; border-color: var(--c-accent); }

.btn-main {
  width: 100%;
  height: var(--touch-min);
  background: var(--c-accent);
  color: var(--c-bg-base);
  border-radius: var(--r-md);
  font-weight: 700;
  font-size: var(--fs-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, box-shadow 0.2s;
}
.btn-main:hover:not(:disabled) { box-shadow: 0 0 30px rgba(0, 212, 255, 0.4); }
.btn-main:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--c-bg-base);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.divider {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  margin: var(--sp-lg) 0;
  color: var(--c-text-dim);
  font-size: var(--fs-xs);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--glass-border);
}

.google-wrap { display: flex; justify-content: center; }
</style>
