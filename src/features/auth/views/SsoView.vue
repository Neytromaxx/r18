<script setup>
// SSO qabul sahifasi — n20'dan ?code= bilan ochiladi. Kodni token juftligiga
// almashtirib, hub'ga o'tadi (router.replace — kod tarixdan o'chadi).
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '../store/auth.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const failed = ref(false)

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    router.replace({ name: 'login' })
    return
  }
  try {
    await auth.loginWithSsoCode(String(code))
    router.replace({ name: 'hub' })
  } catch (e) {
    failed.value = true
    toast.error('Kirish havolasi eskirgan — qaytadan kiring')
    router.replace({ name: 'login' })
  }
})
</script>

<template>
  <div class="sso-root">
    <div class="card">
      <i v-if="!failed" class="fa-solid fa-spinner fa-spin"></i>
      <p>{{ failed ? 'Havola eskirgan…' : 'Kirilmoqda…' }}</p>
    </div>
  </div>
</template>

<style scoped>
.sso-root { min-height: 100dvh; display: grid; place-items: center; }
.card { text-align: center; color: var(--c-text-dim, #9fb2c8); }
.card i { font-size: 28px; color: var(--c-accent, #00d4ff); }
.card p { margin-top: 12px; }
</style>
