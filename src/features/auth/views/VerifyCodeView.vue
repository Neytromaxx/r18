<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '../store/auth.store'
import { useResendTimer } from '../composables/useResendTimer'
import CodeInput from '../components/CodeInput.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Query'dan: ?email=... — oqim yagona (parolsiz): kod bilan kirish
const email = computed(() => route.query.email || '')

const code = ref('')
const loading = ref(false)
const codeInputRef = ref(null)

const { seconds, canResend, start } = useResendTimer(60)

onMounted(() => {
  if (!email.value) {
    router.push('/login')
    return
  }
  start()   // 60 sekund countdown boshlash
})

async function handleVerify(submittedCode) {
  if (loading.value) return

  // CodeInput @complete orqali 6 raqam kiritilishi bilan AVTOMATIK chaqiriladi.
  const c = (submittedCode || code.value || '').toString()
  if (c.length !== 6) {
    toast.error('Kodni to\'liq kiriting')
    return
  }

  loading.value = true
  try {
    await auth.loginWithCode(email.value, c)
    toast.success('Xush kelibsiz!')
    router.push(route.query.redirect || '/hub')
  } catch (e) {
    const status = e.response?.status
    if (status === 400) {
      toast.error('Kod noto\'g\'ri yoki muddati o\'tgan')
      codeInputRef.value?.clear()
    } else {
      toast.error(e.response?.data?.detail || 'Xato yuz berdi')
    }
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (!canResend.value) return
  try {
    await auth.requestLoginCode(email.value)
    toast.success('Kod qayta yuborildi')
    start()   // countdown qayta
    codeInputRef.value?.clear()
  } catch (e) {
    toast.error('Yuborib bo\'lmadi')
  }
}

function changeEmail() {
  router.push('/login')
}
</script>

<template>
  <div class="app-bg"></div>

  <div class="verify-page">
    <!-- Brand -->
    <div class="brand">
      <div class="brand-logo"><i class="fa-solid fa-envelope"></i></div>
      <h1 class="brand-name">Kodni kiriting</h1>
    </div>

    <div class="card glass anim-rise">
      <p class="desc">
        Quyidagi email manziliga 6 xonali kod yubordik:
      </p>
      <div class="email">{{ email }}</div>

      <CodeInput
        ref="codeInputRef"
        v-model="code"
        @complete="handleVerify"
      />

      <button
        class="btn-verify press"
        :disabled="loading || code.length !== 6"
        @click="handleVerify()"
      >
        <span v-if="loading" class="spinner"></span>
        <span v-else>Tasdiqlash</span>
      </button>

      <!-- Resend -->
      <div class="resend">
        <span v-if="!canResend" class="muted">
          Qayta yuborish: <strong>{{ seconds }}s</strong>
        </span>
        <button v-else class="link" @click="handleResend">
          Kodni qayta yuborish
        </button>
      </div>

      <!-- Wrong email -->
      <button class="back" @click="changeEmail">
        <i class="fa-solid fa-arrow-left"></i> Email noto'g'rimi?
      </button>
    </div>
  </div>
</template>

<style scoped>
.verify-page {
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
  gap: var(--sp-sm);
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
  font-size: 2rem;
}
.brand-name {
  font-size: var(--fs-xl);
  font-weight: 700;
}

.card {
  width: 100%;
  max-width: 420px;
  padding: var(--sp-xl);
  text-align: center;
}

.desc {
  color: var(--c-text-dim);
  font-size: var(--fs-sm);
  margin-bottom: var(--sp-xs);
}
.email {
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: var(--sp-xl);
  word-break: break-all;
}

.btn-verify {
  width: 100%;
  height: var(--touch-min);
  margin-top: var(--sp-lg);
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
.btn-verify:hover:not(:disabled) { box-shadow: 0 0 30px rgba(0, 212, 255, 0.4); }
.btn-verify:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--c-bg-base);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.resend {
  margin-top: var(--sp-lg);
  font-size: var(--fs-sm);
}
.muted { color: var(--c-text-dim); }
.muted strong { color: var(--c-text); }
.link {
  color: var(--c-accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.back {
  display: block;
  margin: var(--sp-md) auto 0;
  color: var(--c-text-dim);
  font-size: var(--fs-xs);
  padding: var(--sp-sm);
}
.back:hover { color: var(--c-text); }
</style>