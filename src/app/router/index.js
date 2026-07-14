import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { tokenStorage } from '@/app/api/tokenStorage'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Token bor lekin user yuklanmagan → fetchMe
  if (!auth.user && tokenStorage.getAccess()) {
    await auth.init()
  }

  // Login sahifaga — agar allaqachon kirgan bo'lsa, home'ga
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'home' }
  }

  // requiresAuth=true bo'lgan sahifalar (faqat profile)
  const requiresAuth = to.meta.requiresAuth === true   // ← DEFAULT NOW FALSE
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

// Xavfsizlik-tur: deploy'dan keyin eski lazy-chunk yo'qolgan bo'lsa
// ("Failed to fetch dynamically imported module") — bir marta to'liq reload
// qilib yangi index.html + chunk'larni olamiz (cheksiz loop'dan saqlanish
// uchun sessionStorage bayrog'i bilan).
router.onError((error, to) => {
  const msg = String(error?.message || error)
  const isChunkError =
    /dynamically imported module|Loading chunk|Importing a module script failed|MIME type/i.test(msg)
  if (!isChunkError) return
  const KEY = 'chunk-reload-once'
  if (sessionStorage.getItem(KEY)) return   // allaqachon urinib ko'rildi
  sessionStorage.setItem(KEY, '1')
  window.location.assign(to?.fullPath || window.location.href)
})

// Muvaffaqiyatli navigatsiyada bayroqni tozalaymiz (keyingi safar qayta ishlasin)
router.afterEach(() => {
  sessionStorage.removeItem('chunk-reload-once')
})

export default router