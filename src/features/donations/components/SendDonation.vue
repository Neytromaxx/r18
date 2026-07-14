<script setup>
// Donat yuborish — o'yinchini qidirib tanlash + summa + xabar.
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { donationsApi } from '../api/donations.api'
import { fmtSom } from '@/shared/utils/money'

const emit = defineEmits(['sent'])

const q = ref('')
const results = ref([])
const searching = ref(false)
const selected = ref(null)     // { public_id, nickname }
const amount = ref('')
const message = ref('')
const sending = ref(false)
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  const term = q.value.trim()
  if (term.length < 2) { results.value = []; return }
  searchTimer = setTimeout(doSearch, 300)
}

async function doSearch() {
  searching.value = true
  try {
    const { data } = await donationsApi.searchPlayers(q.value.trim())
    results.value = Array.isArray(data) ? data : []
  } catch {
    results.value = []
  } finally {
    searching.value = false
  }
}

function pick(p) {
  selected.value = p
  results.value = []
  q.value = p.nickname
}

function reset() {
  selected.value = null; q.value = ''; amount.value = ''; message.value = ''; results.value = []
}

async function send() {
  if (!selected.value) { toast.error("O'yinchini tanlang"); return }
  const amt = Number(amount.value)
  if (!amt || amt < 1) { toast.error('Summani kiriting'); return }
  sending.value = true
  try {
    await donationsApi.donate({
      recipient_type: 'player',
      recipient_public_id: selected.value.public_id,
      amount: amt,
      message: message.value.trim() || null,
    })
    toast.success(`${selected.value.nickname}'ga ${fmtSom(amt)} so'm yuborildi!`)
    reset()
    emit('sent')
  } catch (e) {
    toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Yuborilmadi')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="send">
    <label class="lbl">Kimga (o'yinchi)</label>
    <div class="search-box">
      <div v-if="selected" class="chosen">
        <i class="fa-solid fa-user"></i>
        <span class="nick">{{ selected.nickname }}</span>
        <span class="pid">#{{ selected.public_id }}</span>
        <button class="clear" @click="reset"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <input
        v-else
        v-model="q"
        type="text"
        placeholder="Nick yoki ID bo'yicha qidiring…"
        class="inp"
        @input="onSearchInput"
      />
      <div v-if="!selected && results.length" class="results">
        <button v-for="p in results" :key="p.public_id" class="res" @click="pick(p)">
          <span class="nick">{{ p.nickname }}</span>
          <span class="pid">#{{ p.public_id }}</span>
        </button>
      </div>
      <div v-else-if="!selected && searching" class="muted">Qidirilmoqda…</div>
    </div>

    <label class="lbl">Summa (so'm)</label>
    <input v-model="amount" type="number" min="1" placeholder="Masalan 10000" class="inp" />

    <label class="lbl">Xabar (ixtiyoriy)</label>
    <input v-model="message" type="text" maxlength="280" placeholder="Omad!" class="inp" />

    <button class="btn-send" :disabled="sending || !selected" @click="send">
      <i class="fa-solid fa-hand-holding-heart"></i>
      {{ sending ? 'Yuborilmoqda…' : 'Donat yuborish' }}
    </button>
  </div>
</template>

<style scoped>
.send { display: flex; flex-direction: column; gap: 8px; }
.lbl { font-size: var(--fs-sm, 0.85rem); font-weight: 700; color: var(--c-text-dim, #9fb2c8); margin-top: 6px; }
.search-box { position: relative; }
.inp { width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: rgba(6, 13, 26, 0.6); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); color: var(--c-text, #eaf2ff); }
.chosen { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; border-radius: 10px; background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.4); }
.chosen .nick { font-weight: 800; color: var(--c-accent, #00d4ff); }
.chosen .pid { font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); }
.chosen .clear { margin-left: auto; color: var(--c-text-dim); background: none; border: none; }
.results { position: absolute; top: 48px; left: 0; right: 0; z-index: 20; display: flex; flex-direction: column; background: rgba(6, 13, 26, 0.96); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden; }
.res { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: none; border: none; color: var(--c-text); text-align: left; }
.res:hover { background: rgba(0, 212, 255, 0.1); }
.res .nick { font-weight: 700; }
.res .pid { margin-left: auto; font-size: var(--fs-xs); color: var(--c-text-dim); }
.muted { color: var(--c-text-dim); font-size: var(--fs-sm); padding: 8px 4px; }
.btn-send { height: 48px; margin-top: 12px; border-radius: 12px; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-send:disabled { opacity: 0.5; }
</style>
