<script setup>
// Sayt pastki qismi: aloqa, Telegram, oferta, maxfiylik.
// Aloqa va Telegram manzillari muhitdan (VITE_SUPPORT_URL, VITE_TELEGRAM_URL) —
// sozlanmagan boʻlsa havola koʻrsatilmaydi (taxminiy manzil yozilmaydi).
const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || ''
const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL || ''
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer" data-test="site-footer">
    <nav class="links">
      <a v-if="SUPPORT_URL" :href="SUPPORT_URL" target="_blank" rel="noopener">
        <i class="fa-solid fa-headset"></i> Aloqa
      </a>
      <a v-if="TELEGRAM_URL" :href="TELEGRAM_URL" target="_blank" rel="noopener">
        <i class="fa-brands fa-telegram"></i> Telegram
      </a>
      <RouterLink to="/legal/offer">Ommaviy oferta</RouterLink>
      <RouterLink to="/legal/privacy">Maxfiylik siyosati</RouterLink>
    </nav>
    <p class="copy">© {{ year }} Epsilon Donation · mydonation.uz</p>
  </footer>
</template>

<style scoped>
.site-footer { margin-top: 24px; padding: 18px 8px 8px; border-top: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25)); text-align: center; display: flex; flex-direction: column; gap: 8px; }
.links { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 16px; }
.links a { color: var(--c-text-dim, #9fb2c8); font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.links a:hover { color: var(--c-accent, #00d4ff); }
.copy { color: var(--c-text-dim, #9fb2c8); font-size: 0.74rem; opacity: 0.7; }
</style>
