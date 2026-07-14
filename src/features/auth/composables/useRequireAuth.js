import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth.store'
import { toast } from 'vue-sonner'

export function useRequireAuth() {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()

  /**
   * Aksiya bajarish oldidan login borligini tekshiradi.
   * @returns true - user login qilgan, davom etish mumkin
   * @returns false - user yo'naltirildi, davom ETMASLIK kerak
   */
  function requireAuth(message = 'Bu amal uchun tizimga kiring') {
    if (auth.isAuthenticated) return true

    toast.info(message)
    router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return false
  }

  return { requireAuth, isAuthenticated: () => auth.isAuthenticated }
}