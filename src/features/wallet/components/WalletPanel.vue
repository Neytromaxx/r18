<script setup>
// Mening walletim — balans + tarix + top-up so'rovi (Payme yoki chek yuklash).
import { ref, watch, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { walletApi } from '../api/wallet.api'
import { billingApi } from '../api/billing.api'
import { fmtSom } from '@/shared/utils/money'
import { formatDate } from '@/shared/utils/format'

const loading = ref(false)
const balance = ref(0)
const txs = ref([])
const topups = ref([])

const showTopup = ref(false)
const amount = ref('')
const receiptFile = ref(null)
const receiptName = ref('')
const submitting = ref(false)
const fileInput = ref(null)

const TX_LABEL = {
  topup: { t: "To'ldirish", icon: 'fa-solid fa-arrow-down', cls: 'in' },
  donation: { t: 'Donat', icon: 'fa-solid fa-hand-holding-heart', cls: 'out' },
  tournament_registration: { t: "Turnir to'lovi", icon: 'fa-solid fa-trophy', cls: 'out' },
}

function txMeta(t) {
  if (TX_LABEL[t.tx_type]) return TX_LABEL[t.tx_type]
  if (TX_LABEL[t.reference_type]) return TX_LABEL[t.reference_type]
  return {
    t: t.note || t.tx_type || 'Amal',
    icon: Number(t.amount) < 0 ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-coins',
    cls: Number(t.amount) < 0 ? 'out' : 'in',
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await walletApi.get()
    balance.value = data?.balance ?? 0
    txs.value = Array.isArray(data?.transactions) ? data.transactions : []
    const { data: tp } = await walletApi.myTopups()
    topups.value = Array.isArray(tp) ? tp : []
  } catch {
    toast.error('Wallet yuklanmadi')
  } finally {
    loading.value = false
  }
}

function pickReceipt() { fileInput.value?.click() }
function onFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) { toast.error('Faqat rasm'); return }
  if (f.size > 5 * 1024 * 1024) { toast.error('Rasm juda katta (maks 5 MB)'); return }
  receiptFile.value = f
  receiptName.value = f.name
}

async function submitTopup() {
  const amt = Number(amount.value)
  if (!amt || amt < 1000) { toast.error("Minimal 1 000 so'm"); return }
  submitting.value = true
  try {
    let receiptUrl = null
    if (receiptFile.value) {
      const { data } = await walletApi.uploadReceipt(receiptFile.value)
      receiptUrl = data?.url || null
    }
    await walletApi.createTopup(amt, receiptUrl)
    toast.success("So'rov yuborildi — admin tasdig'ini kuting")
    showTopup.value = false
    amount.value = ''; receiptFile.value = null; receiptName.value = ''
    await load()
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Yuborilmadi')
  } finally {
    submitting.value = false
  }
}

const PENDING = 'pending'

// ── PSP (Payme) orqali to'ldirish ──
const showPsp = ref(false)
const pspAmount = ref('')
const pspQuote = ref(null)
const pspBusy = ref(false)
let quoteTimer = null

const TOPUP_PRESETS = [10000, 25000, 50000, 100000]

watch(pspAmount, (v) => {
  clearTimeout(quoteTimer)
  pspQuote.value = null
  const amt = Number(v)
  if (!amt || amt < 1000) return
  quoteTimer = setTimeout(async () => {
    try {
      const { data } = await billingApi.getTopupQuote(amt)
      pspQuote.value = data
    } catch { /* jim — quote faqat ko'rsatish uchun */ }
  }, 300)
})

async function payWithPsp() {
  const amt = Number(pspAmount.value)
  if (!amt || amt < 1000) { toast.error("Minimal 1 000 so'm"); return }
  pspBusy.value = true
  try {
    const { data } = await billingApi.createTopupIntent('payme', amt)
    window.location.href = data.checkout_url
  } catch (e) {
    toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Xatolik')
    pspBusy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="wallet">
    <div class="balance-card">
      <div class="bal-label">Hamyon balansi</div>
      <div class="bal-amount">{{ fmtSom(balance) }} <span class="ccy">so'm</span></div>
      <div class="topup-btns">
        <button class="btn-topup" :class="{ active: showPsp }" @click="showPsp = !showPsp; showTopup = false">
          <i class="fa-solid fa-credit-card"></i> Payme orqali
        </button>
        <button class="btn-topup ghost" :class="{ active: showTopup }" @click="showTopup = !showTopup; showPsp = false">
          <i class="fa-solid fa-receipt"></i> Kvitansiya
        </button>
      </div>
    </div>

    <!-- PSP (Payme) to'ldirish -->
    <div v-if="showPsp" class="topup-form">
      <div class="form-title">Payme orqali hisobni to'ldirish</div>
      <input v-model="pspAmount" type="number" inputmode="numeric" min="1000" step="1000" placeholder="Summa (min 1 000 so'm)" class="inp no-spin" />
      <div class="presets">
        <button
          v-for="p in TOPUP_PRESETS"
          :key="p"
          type="button"
          class="preset"
          :class="{ active: Number(pspAmount) === p }"
          @click="pspAmount = String(p)"
        >
          +{{ fmtSom(p) }}
        </button>
      </div>
      <div v-if="pspQuote" class="quote">
        <div class="q-row"><span>Bu hafta komissiyasiz limit</span><span>{{ fmtSom(pspQuote.free_remaining) }} so'm</span></div>
        <div class="q-row"><span>Komissiya (0.5% ortiqchaga)</span><span>{{ fmtSom(pspQuote.fee) }} so'm</span></div>
        <div class="q-row total"><span>To'laysiz</span><b>{{ fmtSom(pspQuote.total_charge) }} so'm</b></div>
        <div class="q-row bonus"><span>W coin bonus (+1%)</span><span>+{{ Number(pspQuote.bonus_coins).toFixed(0) }} W</span></div>
      </div>
      <p class="hint">Balansga aynan kiritilgan summa tushadi — komissiya ustiga olinadi. Haftasiga 100 000 so'mgacha komissiyasiz.</p>
      <button class="btn-submit" :disabled="pspBusy" @click="payWithPsp">
        {{ pspBusy ? '…' : "Payme orqali to'lash" }}
      </button>
    </div>

    <!-- Manual (kvitansiya) top-up formasi -->
    <div v-if="showTopup" class="topup-form">
      <div class="form-title">Chek (kvitansiya) orqali to'ldirish</div>
      <input v-model="amount" type="number" inputmode="numeric" min="1000" placeholder="Summa (so'm)" class="inp no-spin" />
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
      <button class="btn-receipt" @click="pickReceipt">
        <i class="fa-solid fa-paperclip"></i>
        {{ receiptName || 'Chek rasmini yuklash (ixtiyoriy)' }}
      </button>
      <p class="hint">Platforma kartasiga o'tkazing, so'ng summa + chekni yuboring. Admin tasdiqlaydi. Tasdiqda +1% W bonus.</p>
      <button class="btn-submit" :disabled="submitting" @click="submitTopup">
        {{ submitting ? 'Yuborilmoqda…' : "So'rov yuborish" }}
      </button>
    </div>

    <!-- Kutilayotgan so'rovlar -->
    <div v-if="topups.some(t => t.status === PENDING)" class="pending">
      <div v-for="t in topups.filter(x => x.status === PENDING)" :key="t.id" class="pending-row">
        <i class="fa-solid fa-clock"></i>
        {{ fmtSom(t.amount) }} so'm — tasdiq kutilmoqda
      </div>
    </div>

    <!-- Tranzaksiyalar -->
    <div class="section-title">Amallar tarixi</div>
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="!txs.length" class="muted">Hali amal yo'q.</div>
    <div v-else class="tx-list">
      <div v-for="t in txs" :key="t.id" class="tx" :class="txMeta(t).cls">
        <span class="tx-ic"><i :class="txMeta(t).icon"></i></span>
        <div class="tx-body">
          <div class="tx-label">{{ txMeta(t).t }}</div>
          <div v-if="t.created_at" class="tx-time">{{ formatDate(t.created_at) }}</div>
        </div>
        <span class="tx-amt" :class="Number(t.amount) < 0 ? 'neg' : 'pos'">
          {{ Number(t.amount) < 0 ? '−' : '+' }}{{ fmtSom(Math.abs(Number(t.amount))) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet { display: flex; flex-direction: column; gap: 14px; }
.balance-card {
  padding: 22px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.16), rgba(12, 31, 65, 0.65));
  border: 1px solid rgba(0, 212, 255, 0.3);
  text-align: center;
}
.bal-label { font-size: 0.82rem; color: var(--c-text-dim, #9fb2c8); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.bal-amount { font-size: 2.15rem; font-weight: 900; color: var(--c-text, #eaf2ff); margin: 4px 0 14px; }
.ccy { font-size: 0.9rem; font-weight: 700; color: var(--c-text-dim, #9fb2c8); }
.topup-btns { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.btn-topup {
  padding: 10px 20px; border-radius: 999px; font-weight: 800;
  background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); border: none;
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
}
.btn-topup.ghost {
  background: rgba(89, 133, 189, 0.15); color: var(--c-text, #eaf2ff);
  border: 1px solid var(--glass-border, rgba(89,133,189,0.25));
}
.form-title { font-size: 0.85rem; font-weight: 800; color: var(--c-text, #eaf2ff); }
.presets { display: flex; gap: 6px; flex-wrap: wrap; }
.preset {
  flex: 1; min-width: 68px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border);
  color: var(--c-text-dim); font-size: 0.76rem; font-weight: 800; cursor: pointer;
}
.preset.active { background: rgba(0, 212, 255, 0.16); border-color: var(--c-accent); color: var(--c-accent); }
.quote { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); font-size: 0.85rem; }
.q-row { display: flex; justify-content: space-between; padding: 2px 0; color: var(--c-text-dim, #9fb2c8); }
.q-row.total { border-top: 1px dashed var(--glass-border); margin-top: 4px; padding-top: 6px; }
.q-row.total b { color: var(--c-accent, #00d4ff); }
.q-row.bonus span:last-child { color: var(--c-warning, #f59e0b); font-weight: 700; }
.topup-form { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid var(--glass-border); border-radius: 16px; background: rgba(6, 13, 26, 0.55); }
.inp { height: 44px; padding: 0 14px; border-radius: 10px; background: rgba(6, 13, 26, 0.75); border: 1px solid var(--glass-border); color: var(--c-text); font-weight: 700; }
.no-spin { appearance: textfield; -moz-appearance: textfield; }
.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.btn-receipt { height: 42px; border-radius: 10px; background: rgba(89, 133, 189, 0.15); border: 1px dashed var(--glass-border); color: var(--c-text-dim); text-align: left; padding: 0 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.hint { font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); }
.btn-submit { height: 46px; border-radius: 12px; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; border: none; cursor: pointer; }
.btn-submit:disabled { opacity: 0.5; }
.hidden { display: none; }
.pending { display: flex; flex-direction: column; gap: 6px; }
.pending-row { font-size: var(--fs-sm); color: var(--c-warning, #f59e0b); display: flex; align-items: center; gap: 8px; }
.section-title { font-weight: 800; font-size: var(--fs-sm); margin-top: 4px; }
.muted { color: var(--c-text-dim); font-size: var(--fs-sm); text-align: center; padding: 12px; }
.tx-list { display: flex; flex-direction: column; gap: 8px; }
.tx { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px; background: rgba(6, 13, 26, 0.45); border: 1px solid var(--glass-border); }
.tx-ic { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: rgba(89, 133, 189, 0.15); color: var(--c-text-dim); flex-shrink: 0; }
.tx.in .tx-ic { color: var(--c-success, #22c55e); background: rgba(34, 197, 94, 0.14); }
.tx.out .tx-ic { color: var(--c-accent, #00d4ff); background: rgba(0, 212, 255, 0.12); }
.tx-body { flex: 1; min-width: 0; }
.tx-label { font-size: 0.9rem; font-weight: 700; color: var(--c-text, #eaf2ff); }
.tx-time { font-size: 0.72rem; color: var(--c-text-dim, #8fa8c8); margin-top: 1px; }
.tx-amt { font-weight: 900; font-size: 0.98rem; }
.tx-amt.pos { color: var(--c-success, #22c55e); }
.tx-amt.neg { color: var(--c-text, #eaf2ff); }
</style>
