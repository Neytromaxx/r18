<script setup>
// Huquqiy sahifalar: /legal/offer (ommaviy oferta), /legal/privacy
// (maxfiylik siyosati). MATN EGASI VA YURIST TOMONIDAN BERILADI — bu
// yerda faqat joy. Matn kelganda `LEGAL_TEXT` ga qoʻyiladi.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteFooter from '@/shared/components/SiteFooter.vue'

const TITLES = {
  offer: 'Ommaviy oferta',
  privacy: 'Maxfiylik siyosati',
}
// Egasi beradigan matn (Markdown emas — oddiy paragraflar roʻyxati)
const LEGAL_TEXT = {
  offer: [],
  privacy: [],
}

const route = useRoute()
const doc = computed(() => (route.params.doc in TITLES ? route.params.doc : 'offer'))
const title = computed(() => TITLES[doc.value])
const paragraphs = computed(() => LEGAL_TEXT[doc.value] || [])
</script>

<template>
  <div class="legal">
    <h1>{{ title }}</h1>
    <template v-if="paragraphs.length">
      <p v-for="(t, i) in paragraphs" :key="i">{{ t }}</p>
    </template>
    <p v-else class="soon" data-test="legal-soon">Matn tez orada.</p>
    <SiteFooter />
  </div>
</template>

<style scoped>
.legal { max-width: 720px; margin: 0 auto; padding: 28px 16px 110px; display: flex; flex-direction: column; gap: 14px; }
h1 { font-size: 1.5rem; font-weight: 900; }
p { line-height: 1.6; }
.soon { color: var(--c-text-dim, #9fb2c8); padding: 24px; text-align: center; border-radius: 14px; border: 1px dashed var(--glass-border, rgba(89, 133, 189, 0.25)); }
</style>
