<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import DonationAlert from '@/features/donations/components/DonationAlert.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navItems = computed(() => {
  if (!auth.isAuthenticated) return []
  return [
    { name: 'hub',     icon: 'fa-solid fa-hand-holding-heart', label: 'Donatlar', to: '/hub' },
    { name: 'cabinet', icon: 'fa-solid fa-tower-broadcast',    label: 'Kabinet',  to: '/cabinet' },
    { name: 'profile', icon: 'fa-solid fa-user',               label: 'Profil',   to: '/profile' },
  ]
})

const isActive = (to) => route.path === to || (to !== '/' && route.path.startsWith(to))

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-bg"></div>

  <div class="donation-layout">
    <!-- App-darajali donat alerti -->
    <DonationAlert />

    <header class="topbar glass">
      <RouterLink to="/" class="brand">
        <i class="fa-solid fa-bolt"></i>
        <span>Epsilon <b>Donation</b></span>
      </RouterLink>

      <nav class="topnav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.to) }"
        >
          <i :class="item.icon"></i>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>

        <button v-if="auth.isAuthenticated" class="nav-link" title="Chiqish" @click="logout">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
        <RouterLink v-else to="/login" class="nav-link cta">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span class="nav-label">Kirish</span>
        </RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.donation-layout {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-radius: 0 0 16px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  color: var(--c-text);
  text-decoration: none;
  white-space: nowrap;
}
.brand i { color: var(--c-accent); }
.brand b { color: var(--c-accent); font-weight: 800; }

.topnav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--c-text-dim);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
}
.nav-link:hover { color: var(--c-text); border-color: var(--glass-border); }
.nav-link.active {
  background: var(--c-accent);
  color: var(--c-bg-base);
  font-weight: 700;
  box-shadow: 0 0 18px rgba(0, 212, 255, 0.4);
}
.nav-link.cta {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.main {
  min-height: calc(100dvh - 64px);
  padding: 18px 26px 40px;
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 560px) {
  .nav-label { display: none; }
  .main { padding: 14px 14px 32px; }
}
</style>
