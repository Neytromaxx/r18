<script setup>
// Top donatorlar / streamerlar reytingi.
import { ref, onMounted } from 'vue'
import { donationsApi } from '../api/donations.api'
import { fmtSom } from '@/shared/utils/money'

const loading = ref(false)
const tab = ref('donors')      // donors | recipients
const donors = ref([])
const recipients = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await donationsApi.leaderboard()
    donors.value = data?.top_donors || []
    recipients.value = data?.top_recipients || []
  } catch {
    donors.value = []; recipients.value = []
  } finally {
    loading.value = false
  }
}

function medal(i) {
  return ['🥇', '🥈', '🥉'][i] || `${i + 1}`
}
onMounted(load)
</script>

<template>
  <div class="top">
    <div class="switch">
      <button :class="{ active: tab === 'donors' }" @click="tab = 'donors'">Donatorlar</button>
      <button :class="{ active: tab === 'recipients' }" @click="tab = 'recipients'">Streamerlar</button>
    </div>

    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <template v-else>
      <div v-if="tab === 'donors'" class="list">
        <div v-if="!donors.length" class="muted">Hali donat yo'q.</div>
        <div v-for="(d, i) in donors" :key="d.account_id" class="row">
          <span class="rank">{{ medal(i) }}</span>
          <span class="nick">{{ d.nickname }}</span>
          <span class="total">{{ fmtSom(d.total) }} so'm</span>
        </div>
      </div>
      <div v-else class="list">
        <div v-if="!recipients.length" class="muted">Hali qabul qiluvchi yo'q.</div>
        <div v-for="(d, i) in recipients" :key="d.account_id" class="row">
          <span class="rank">{{ medal(i) }}</span>
          <span class="nick">{{ d.nickname }}<span v-if="d.public_id" class="pid"> #{{ d.public_id }}</span></span>
          <span class="total">{{ fmtSom(d.total) }} so'm</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 12px; }
.switch { display: flex; gap: 6px; padding: 4px; border-radius: 999px; background: rgba(6, 13, 26, 0.5); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); }
.switch button { flex: 1; padding: 8px; border-radius: 999px; background: none; border: none; color: var(--c-text-dim, #9fb2c8); font-weight: 700; font-size: var(--fs-sm); }
.switch button.active { background: rgba(0, 212, 255, 0.14); color: var(--c-accent, #00d4ff); }
.muted { color: var(--c-text-dim); font-size: var(--fs-sm); text-align: center; padding: 20px; }
.list { display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; background: rgba(6, 13, 26, 0.4); border: 1px solid var(--glass-border); }
.rank { width: 26px; text-align: center; font-weight: 800; }
.nick { flex: 1; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pid { font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); font-weight: 400; }
.total { font-weight: 800; color: var(--c-accent, #00d4ff); }
</style>
