import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth.api'
import { tokenStorage } from '@/app/api/tokenStorage'
import { setDisplayUtcOffset } from '@/shared/utils/format'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // ── Parolsiz oqim: kod so'rash (yangi email bo'lsa akkaunt yaratiladi) ──
  async function requestLoginCode(email) {
    await authApi.requestLoginCode(email)
  }

  // ── Kod bilan kirish ──
  async function loginWithCode(email, code) {
    const { data } = await authApi.verifyLoginCode(email, code)
    tokenStorage.set(data.access_token, data.refresh_token)
    await fetchMe()
  }

  async function loginWithGoogle(idToken) {
    const { data } = await authApi.loginGoogle(idToken)
    tokenStorage.set(data.access_token, data.refresh_token)
    await fetchMe()
  }

  // ── SSO: n20 (gaming)dan kelgan bir martalik kod bilan kirish ──
  async function loginWithSsoCode(code) {
    const { data } = await authApi.ssoExchange(code)
    tokenStorage.set(data.access_token, data.refresh_token)
    await fetchMe()
  }

  async function fetchMe() {
    const { data } = await authApi.getMe()
    user.value = data.account
    // Vaqtlar foydalanuvchining profil offsetida ko'rsatiladi
    setDisplayUtcOffset(data.account?.utc_offset_minutes ?? 300)
  }

  async function logout() {
    try { await authApi.logout() } catch (e) {}
    tokenStorage.clear()
    user.value = null
  }

  async function init() {
    if (!tokenStorage.getAccess()) return
    try {
      await fetchMe()
    } catch (e) {
      tokenStorage.clear()
      user.value = null
    }
  }

  return {
    user, isAuthenticated,
    requestLoginCode, loginWithCode, loginWithGoogle, loginWithSsoCode,
    fetchMe, logout, init,
  }
})
