<script setup>
// Donat yuborish (/hub ichidagi Yuborish bo'limi) —
// o'yinchini qidirib tanlash + hamyon balansi + tezkor summa chiplari + cover-fee.
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { donationsApi } from '../api/donations.api'
import { walletApi } from '@/features/wallet/api/wallet.api'
import { WALLET_DONATION_RATE } from '@/features/wallet/api/billing.api'
import { fmtSom } from '@/shared/utils/money'

const emit = defineEmits(['sent'])

const q = ref('')
const results = ref([])
const searching = ref(false)
const selected = ref(null)     // { public_id, nickname }
const amount = ref('')
const message = ref('')
const coverFee = ref(true)
const sending = ref(false)
let searchTimer = null

const balance = ref(null)
async function loadBalance() {
  try {
    const { data } = await walletApi.get()
    balance.value = Number(data?.balance) || 0
  } catch {
    balance.value = null
  }
}

const PRESETS = [2000, 5000, 10000, 25000, 50000]
function pickPreset(val) {
  amount.value = String(val)
}

function onSearchInput() {
  clearTimeout(searchTimer)
  const term = q.value.trim()
  if (term.length < 2) { results.value = []; return }
  searchTimer = setTimeout(doSearch, 280)
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
  selected.value = null
  q.value = ''
  amount.value = ''
  message.value = ''
  results.value = []
}

// Cover-fee: streamer to'liq summani oladi, 0.7% fee balansdan ustiga yechiladi
const FEE_RATE = WALLET_DONATION_RATE
const amountNum = computed(() => Math.max(0, Number(amount.value) || 0))
const feePreview = computed(() => Math.round(amountNum.value * FEE_RATE * 100) / 100)
const debitPreview = computed(() => {
  return coverFee.value ? amountNum.value + feePreview.value : amountNum.value
})
const netPreview = computed(() => {
  return coverFee.value ? amountNum.value : Math.max(0, amountNum.value - feePreview.value)
})
const notEnough = computed(() => (
  balance.value !== null && amountNum.value > 0 && debitPreview.value > balance.value
))

async function send() {
  if (!selected.value) { toast.error("O'yinchini tanlang"); return }
  const amt = Number(amount.value)
  if (!amt || amt < 1) { toast.error('Summani kiriting'); return }
  if (notEnough.value) { toast.error('Balans yetarli emas'); return }
  sending.value = true
  try {
    await donationsApi.donate({
      recipient_type: 'player',
      recipient_public_id: selected.value.public_id,
      amount: amt,
      message: message.value.trim() || null,
      cover_fee: coverFee.value,
    })
    toast.success(`${selected.value.nickname}'ga ${fmtSom(netPreview.value)} so'm yetkazildi!`)
    reset()
    await loadBalance()
    emit('sent')
  } catch (e) {
    toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Yuborilmadi')
  } finally {
    sending.value = false
  }
}

onMounted(loadBalance)
</script>

<template>
  <div class="send-card">
    <!-- Joriy hamyon balansi -->
    <div v-if="balance !== null" class="bal-bar" :class="{ low: notEnough }">
      <span><i class="fa-solid fa-wallet"></i> Mavjud balansingiz</span>
      <b>{{ fmtSom(balance) }} so'm</b>
    </div>

    <!-- 1. Qabul qiluvchi -->
    <div class="field">
      <div class="field-head">
        <label class="lbl">Kimga (streamer yoki o'yinchi)</label>
        <RouterLink
          v-if="selected"
          :to="`/s/${selected.public_id}`"
          class="pub-link"
        >
          Sahifasini ochish <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </RouterLink>
      </div>

      <div class="search-box">
        <div v-if="selected" class="chosen">
          <span class="chosen-av"><i class="fa-solid fa-user-astronaut"></i></span>
          <div class="chosen-info">
            <span class="nick">{{ selected.nickname }}</span>
            <span class="pid">#{{ selected.public_id }}</span>
          </div>
          <button type="button" class="clear" title="O'zgartirish" @click="reset">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-else class="inp-wrap">
          <i class="fa-solid fa-magnifying-glass inp-ic"></i>
          <input
            v-model="q"
            type="text"
            placeholder="Nick yoki #ID bo'yicha qidiring…"
            class="inp with-ic"
            @input="onSearchInput"
          />
        </div>

        <div v-if="!selected && results.length" class="results">
          <button
            v-for="p in results"
            :key="p.public_id"
            type="button"
            class="res"
            @click="pick(p)"
          >
            <span class="res-av"><i class="fa-solid fa-user"></i></span>
            <span class="nick">{{ p.nickname }}</span>
            <span class="pid">#{{ p.public_id }}</span>
          </button>
        </div>
        <div v-else-if="!selected && searching" class="muted">Qidirilmoqda…</div>
      </div>
    </div>

    <!-- 2. Summa -->
    <div class="field">
      <div class="field-head">
        <label class="lbl">Donat summasi</label>
        <span class="hint">Komissiya: 0.7%</span>
      </div>
      <div class="amount-box">
        <input
          v-model="amount"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="10 000"
          class="amount-inp"
        />
        <span class="ccy-tag">SO'M</span>
      </div>
      <div class="presets">
        <button
          v-for="p in PRESETS"
          :key="p"
          type="button"
          class="preset"
          :class="{ active: amountNum === p }"
          @click="pickPreset(p)"
        >
          {{ fmtSom(p) }}
        </button>
      </div>
    </div>

    <!-- 3. Xabar -->
    <div class="field">
      <div class="field-head">
        <label class="lbl">Xabar (ixtiyoriy)</label>
        <span class="hint">{{ message.length }} / 280</span>
      </div>
      <textarea
        v-model="message"
        rows="2"
        maxlength="280"
        placeholder="Omad! Efirda alert bo'lib chiqadi…"
        class="textarea"
      ></textarea>
    </div>

    <!-- 4. Cover-fee switch -->
    <div class="cover-card" :class="{ active: coverFee }" @click="coverFee = !coverFee">
      <div class="switch" :class="{ on: coverFee }">
        <span class="knob"></span>
      </div>
      <div class="cover-txt">
        <div class="cover-title">
          To'liq summa yetkazish <span class="badge">+0.7%</span>
        </div>
        <div class="cover-sub">
          <template v-if="amountNum > 0">
            Qabul qiluvchi aynan <b>{{ fmtSom(amountNum) }} so'm</b>ni to'liq oladi
          </template>
          <template v-else>
            0.7% komissiya sizning balansingizdan ustiga yechiladi
          </template>
        </div>
      </div>
    </div>

    <!-- 5. Hisob-kitob -->
    <div v-if="amountNum > 0" class="receipt">
      <div class="r-row">
        <span>Qabul qiluvchi oladi</span>
        <b class="net">{{ fmtSom(netPreview) }} so'm</b>
      </div>
      <div class="r-row">
        <span>Komissiya (0.7%)</span>
        <span>{{ fmtSom(feePreview) }} so'm</span>
      </div>
      <div class="r-row total">
        <span>Balansdan yechiladi</span>
        <b>{{ fmtSom(debitPreview) }} so'm</b>
      </div>
    </div>

    <p v-if="notEnough" class="warn">
      Balans yetarli emas — {{ fmtSom(debitPreview - balance) }} so'm yetishmayapti.
    </p>

    <button
      type="button"
      class="btn-send press"
      :disabled="sending || !selected || notEnough || amountNum <= 0"
      @click="send"
    >
      <i class="fa-solid fa-paper-plane"></i>
      {{ sending ? 'Yuborilmoqda…' : (amountNum > 0 ? `${fmtSom(debitPreview)} so'm yuborish` : 'Donat yuborish') }}
    </button>
  </div>
</template>

<style scoped>
.send-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(8, 19, 38, 0.65);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
}

.bal-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.09);
  border: 1px solid rgba(0, 212, 255, 0.3);
  font-size: 0.85rem;
  color: var(--c-text-dim, #8fa8c8);
}
.bal-bar i {
  color: var(--c-accent, #00d4ff);
  margin-right: 6px;
}
.bal-bar b {
  color: var(--c-accent, #00d4ff);
  font-size: 0.96rem;
}
.bal-bar.low {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.45);
}
.bal-bar.low b {
  color: #ef4444;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.lbl {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-dim, #8fa8c8);
}
.hint {
  font-size: 0.74rem;
  color: var(--c-text-dim, #8fa8c8);
}
.pub-link {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--c-accent, #00d4ff);
  text-decoration: none;
}

.search-box {
  position: relative;
}
.inp-wrap {
  position: relative;
}
.inp-ic {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-dim, #8fa8c8);
}
.inp {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.75);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.28));
  color: var(--c-text, #f0f8ff);
}
.inp.with-ic {
  padding-left: 38px;
}
.inp:focus,
.textarea:focus {
  outline: none;
  border-color: var(--c-accent, #00d4ff);
}

.chosen {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 0 12px;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.45);
}
.chosen-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 212, 255, 0.18);
  color: var(--c-accent, #00d4ff);
}
.chosen-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.chosen .nick {
  font-weight: 800;
  color: var(--c-text, #f0f8ff);
}
.chosen .pid {
  font-size: 0.75rem;
  color: var(--c-text-dim, #8fa8c8);
}
.chosen .clear {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--c-text-dim);
  background: rgba(255, 255, 255, 0.06);
  border: none;
  cursor: pointer;
}

.results {
  position: absolute;
  top: 52px;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: rgba(6, 13, 26, 0.98);
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55);
}
.res {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: none;
  border: none;
  color: var(--c-text);
  text-align: left;
  cursor: pointer;
}
.res:hover {
  background: rgba(0, 212, 255, 0.12);
}
.res-av {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 212, 255, 0.12);
  color: var(--c-accent, #00d4ff);
  font-size: 0.8rem;
}
.res .nick {
  font-weight: 700;
}
.res .pid {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--c-text-dim);
}
.muted {
  color: var(--c-text-dim);
  font-size: 0.82rem;
  padding: 6px 4px;
}

.amount-box {
  display: flex;
  align-items: center;
  height: 52px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.8);
  border: 1.5px solid rgba(89, 133, 189, 0.3);
}
.amount-box:focus-within {
  border-color: var(--c-accent, #00d4ff);
}
.amount-inp {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0 14px;
  background: transparent;
  border: none;
  color: var(--c-text, #f0f8ff);
  font-size: 1.25rem;
  font-weight: 900;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}
.amount-inp::-webkit-outer-spin-button,
.amount-inp::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ccy-tag {
  margin-right: 12px;
  padding: 3px 9px;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.12);
  color: var(--c-accent, #00d4ff);
  font-size: 0.72rem;
  font-weight: 800;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preset {
  flex: 1;
  min-width: 68px;
  height: 32px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(89, 133, 189, 0.24);
  color: var(--c-text-dim, #8fa8c8);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.preset.active {
  background: rgba(0, 212, 255, 0.16);
  border-color: var(--c-accent, #00d4ff);
  color: var(--c-accent, #00d4ff);
}

.textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.75);
  border: 1px solid rgba(89, 133, 189, 0.28);
  color: var(--c-text, #f0f8ff);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.cover-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(6, 13, 26, 0.55);
  border: 1px solid rgba(89, 133, 189, 0.25);
  cursor: pointer;
  user-select: none;
}
.cover-card.active {
  background: rgba(0, 212, 255, 0.09);
  border-color: rgba(0, 212, 255, 0.45);
}
.switch {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: rgba(89, 133, 189, 0.3);
  padding: 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.switch.on {
  background: var(--c-accent, #00d4ff);
}
.knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.switch.on .knob {
  transform: translateX(18px);
  background: #04101f;
}
.cover-title {
  font-size: 0.86rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 212, 255, 0.16);
  color: var(--c-accent, #00d4ff);
}
.cover-sub {
  font-size: 0.76rem;
  color: var(--c-text-dim, #8fa8c8);
  margin-top: 2px;
}
.cover-sub b {
  color: var(--c-text, #f0f8ff);
}

.receipt {
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(4, 10, 20, 0.6);
  border: 1px solid rgba(89, 133, 189, 0.24);
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.83rem;
}
.r-row {
  display: flex;
  justify-content: space-between;
  color: var(--c-text-dim, #8fa8c8);
}
.r-row .net {
  color: #4ade80;
}
.r-row.total {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba(89, 133, 189, 0.3);
  color: var(--c-text, #f0f8ff);
}
.r-row.total b {
  color: var(--c-accent, #00d4ff);
  font-size: 0.96rem;
}

.warn {
  font-size: 0.78rem;
  color: #ef4444;
}

.btn-send {
  height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d4ff, #1fb6ff);
  color: #04101f;
  font-weight: 900;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 6px 22px rgba(0, 212, 255, 0.3);
}
.btn-send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
