import DonationLayout from '@/shared/layouts/DonationLayout.vue'

export const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
  },
  {
    path: '/verify',
    name: 'verify-code',
    component: () => import('@/features/auth/views/VerifyCodeView.vue'),
  },
  {
    // Public OBS overlay — auth'siz, layout'siz (shaffof fon)
    path: '/overlay/:token',
    name: 'overlay',
    component: () => import('@/features/streamer/views/OverlayView.vue'),
  },
  {
    // Public streamer donat sahifasi — auth'siz ko'rish
    path: '/s/:public_id',
    name: 'streamer-public',
    component: () => import('@/features/streamer/views/StreamerPublicView.vue'),
  },

  {
    path: '/',
    component: DonationLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/features/home/views/HomeView.vue') },
      { path: 'hub', name: 'hub', component: () => import('@/features/donations/views/DonationHubView.vue'), meta: { requiresAuth: true } },
      { path: 'cabinet', name: 'cabinet', component: () => import('@/features/streamer/views/CabinetView.vue'), meta: { requiresAuth: true } },
      { path: 'profile', name: 'profile', component: () => import('@/features/profile/views/ProfileView.vue'), meta: { requiresAuth: true } },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]
