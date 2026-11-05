<script setup>
// Men yuborgan donatlar — faqat oʻqish uchun.
// Mehmon sifatida qilib, keyin "Olish" orqali hisobga bogʻlangan
// donatlar ham shu yerda (backend: GET /donations/sent).
import { ref, onMounted } from 'vue'
import { donationsApi } from '../api/donations.api'
import { fmtSom } from '@/shared/utils/money'
import { formatDate } from '@/shared/utils/format'

const loading = ref(false)
const items = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await donationsApi.sent()
    items.value = Array.isArray(data) ? data : []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="sent" data-test="sent">
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="!items.length" class="muted">
      <i class="fa-solid fa-paper-plane"></i>
      <p>Hali donat yubormagansiz.</p>
      <p class="hint">Streamer sahifasini oching va karta orqali yuboring.</p>
    </div>
    <div v-else class="list">
      <div v-for="d in items" :key="d.id" class="card">
        <div class="coin"><i class="fa-solid fa-paper-plane"></i></div>
        <div class="body">
          <div class="top-line">
            <div class="amt">
              {{ fmtSom(d.amount) }} <span class="ccy">soʻm</span>
            </div>
            <span v-if="d.created_at" class="time">{{ formatDate(d.created_at) }}</span>
          </div>
          <div class="sub">
            Streamerga: {{ fmtSom(d.net) }} soʻm · komissiya {{ fmtSom(d.commission) }} soʻm
          </div>
          <div v-if="d.message" class="msg">{{ d.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted { color: var(--c-text-dim, #9fb2c8); font-size: var(--fs-sm); text-align: center; padding: 30px 12px; }
.muted i { font-size: 28px; opacity: 0.5; }
.muted p { margin-top: 8px; }
.muted .hint { font-size: 0.8rem; opacity: 0.8; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-md, 14px); background: rgba(6, 13, 26, 0.45); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); }
.coin { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 16px; color: var(--c-accent, #00d4ff); background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.4); flex-shrink: 0; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.top-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.amt { font-weight: 900; font-size: 1rem; }
.ccy { font-size: 0.75rem; color: var(--c-text-dim, #9fb2c8); font-weight: 700; }
.time { font-size: 0.72rem; color: var(--c-text-dim, #9fb2c8); white-space: nowrap; }
.sub { font-size: 0.76rem; color: var(--c-text-dim, #9fb2c8); }
.msg { font-size: 0.84rem; overflow-wrap: anywhere; }
</style>
