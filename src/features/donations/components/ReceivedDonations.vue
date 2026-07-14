<script setup>
// Menga kelgan donatlar (o'yinchi) — alert feed tarixi.
import { ref, onMounted } from 'vue'
import { donationsApi } from '../api/donations.api'
import { fmtSom } from '@/shared/utils/money'

const loading = ref(false)
const items = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await donationsApi.received()
    items.value = Array.isArray(data) ? data : []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
defineExpose({ load })
</script>

<template>
  <div class="received">
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="!items.length" class="muted">
      <i class="fa-solid fa-gift"></i>
      <p>Hali donat kelmagan.</p>
    </div>
    <div v-else class="list">
      <div v-for="d in items" :key="d.id" class="card">
        <div class="coin"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="body">
          <div class="amt">{{ fmtSom(d.net) }} <span class="ccy">so'm</span></div>
          <div v-if="d.message" class="msg">"{{ d.message }}"</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted { color: var(--c-text-dim, #9fb2c8); font-size: var(--fs-sm); text-align: center; padding: 30px 12px; }
.muted i { font-size: 28px; opacity: 0.5; }
.muted p { margin-top: 8px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-md, 14px); background: rgba(6, 13, 26, 0.4); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); }
.coin { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--c-warning, #f59e0b); background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); flex-shrink: 0; }
.amt { font-weight: 900; font-size: 1.15rem; color: var(--c-text, #eaf2ff); }
.ccy { font-size: 0.78rem; font-weight: 700; color: var(--c-text-dim); }
.msg { font-size: var(--fs-sm); color: var(--c-text); margin-top: 2px; word-break: break-word; }
</style>
