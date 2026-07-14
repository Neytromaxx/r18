<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const buttonRef = ref(null)
const loading = ref(false)

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Google callback — id_token qaytaradi
async function handleCredentialResponse(response) {
  if (!response.credential) {
    toast.error('Google login bekor qilindi')
    return
  }

  loading.value = true
  try {
    await auth.loginWithGoogle(response.credential)
    toast.success(`Xush kelibsiz, ${auth.user?.username || ''}!`)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    const status = e.response?.status
    const errorCode = e.response?.data?.error?.code

    if (errorCode === 'INVALID_OAUTH_TOKEN') {
      toast.error('Google token noto\'g\'ri')
    } else if (status === 400) {
      toast.error('Google email tasdiqlanmagan')
    } else {
      toast.error('Google bilan kirib bo\'lmadi')
    }
  } finally {
    loading.value = false
  }
}

let interval = null
let timeout = null

function clearTimers() {
  if (interval) { clearInterval(interval); interval = null }
  if (timeout) { clearTimeout(timeout); timeout = null }
}

// GSI yuklanishini kutamiz
function waitForGoogle() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(window.google)
      return
    }
    interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearTimers()
        resolve(window.google)
      }
    }, 100)

    // Maksimal 10 sekund kuting
    timeout = setTimeout(() => {
      clearTimers()
      resolve(null)
    }, 10000)
  })
}

onMounted(async () => {
  if (!CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID o\'rnatilmagan')
    return
  }

  const google = await waitForGoogle()
  if (!google) {
    console.warn('Google Identity Services yuklanmadi')
    return
  }

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
  })

  google.accounts.id.renderButton(buttonRef.value, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',     // "Continue with Google"
    shape: 'rectangular',
    logo_alignment: 'left',
    width: buttonRef.value?.offsetWidth || '100%',
  })
})

onUnmounted(() => {
  clearTimers()
})
</script>

<template>
  <div class="google-wrap">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-sm"></div>
      <span>Kirilmoqda...</span>
    </div>
    <div ref="buttonRef" class="google-btn"></div>
  </div>
</template>

<style scoped>
.google-wrap {
  position: relative;
  width: 100%;
}

.google-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 40px;
}

/* Google rendered button uchun konteyner */
.google-btn :deep(iframe) {
  width: 100% !important;
  border-radius: var(--r-md) !important;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 13, 26, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  border-radius: var(--r-md);
  color: var(--c-text);
  font-size: var(--fs-sm);
  z-index: 10;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>