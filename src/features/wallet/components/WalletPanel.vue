<script setup>
// Mening walletim — balans + tarix + top-up so'rovi (chek yuklash).
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { walletApi } from '../api/wallet.api'
import { fmtSom } from '@/shared/utils/money'

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
}

function txMeta(t) {
  return TX_LABEL[t.tx_type] || { t: t.tx_type || 'Amal', icon: 'fa-solid fa-coins', cls: '' }
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
onMounted(load)
</script>

<template>
  <div class="wallet">
    <div class="balance-card">
      <div class="bal-label">Balans</div>
      <div class="bal-amount">{{ fmtSom(balance) }} <span class="ccy">so'm</span></div>
      <button class="btn-topup" @click="showTopup = !showTopup">
        <i class="fa-solid fa-plus"></i> To'ldirish
      </button>
    </div>

    <!-- Top-up formasi -->
    <div v-if="showTopup" class="topup-form">
      <input v-model="amount" type="number" min="1000" placeholder="Summa (so'm)" class="inp" />
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
      <button class="btn-receipt" @click="pickReceipt">
        <i class="fa-solid fa-paperclip"></i>
        {{ receiptName || 'Chek (ixtiyoriy)' }}
      </button>
      <p class="hint">Platforma kartasiga o'tkazing, so'ng summa + chekni yuboring. Admin tasdiqlaydi.</p>
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
    <div class="section-title">Tarix</div>
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="!txs.length" class="muted">Hali amal yo'q.</div>
    <div v-else class="tx-list">
      <div v-for="t in txs" :key="t.id" class="tx" :class="txMeta(t).cls">
        <span class="tx-ic"><i :class="txMeta(t).icon"></i></span>
        <span class="tx-label">{{ txMeta(t).t }}</span>
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
  padding: 20px;
  border-radius: var(--r-md, 14px);
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.14), rgba(89, 133, 189, 0.1));
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
  text-align: center;
}
.bal-label { font-size: var(--fs-sm, 0.85rem); color: var(--c-text-dim, #9fb2c8); }
.bal-amount { font-size: 2rem; font-weight: 900; color: var(--c-text, #eaf2ff); margin: 4px 0 12px; }
.ccy { font-size: 0.9rem; font-weight: 700; color: var(--c-text-dim, #9fb2c8); }
.btn-topup {
  padding: 9px 20px; border-radius: 999px; font-weight: 800;
  background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); border: none;
}
.topup-form { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px solid var(--glass-border); border-radius: var(--r-md, 14px); background: rgba(6, 13, 26, 0.4); }
.inp { height: 42px; padding: 0 14px; border-radius: 10px; background: rgba(6, 13, 26, 0.6); border: 1px solid var(--glass-border); color: var(--c-text); }
.btn-receipt { height: 42px; border-radius: 10px; background: rgba(89, 133, 189, 0.15); border: 1px dashed var(--glass-border); color: var(--c-text-dim); text-align: left; padding: 0 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hint { font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); }
.btn-submit { height: 44px; border-radius: 10px; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; border: none; }
.btn-submit:disabled { opacity: 0.5; }
.hidden { display: none; }
.pending { display: flex; flex-direction: column; gap: 6px; }
.pending-row { font-size: var(--fs-sm); color: var(--c-warning, #f59e0b); display: flex; align-items: center; gap: 8px; }
.section-title { font-weight: 800; font-size: var(--fs-sm); margin-top: 4px; }
.muted { color: var(--c-text-dim); font-size: var(--fs-sm); text-align: center; padding: 12px; }
.tx-list { display: flex; flex-direction: column; gap: 6px; }
.tx { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(6, 13, 26, 0.4); border: 1px solid var(--glass-border); }
.tx-ic { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: rgba(89, 133, 189, 0.15); color: var(--c-text-dim); flex-shrink: 0; }
.tx.in .tx-ic { color: var(--c-success, #22c55e); }
.tx.out .tx-ic { color: var(--c-accent, #00d4ff); }
.tx-label { flex: 1; font-size: var(--fs-sm); }
.tx-amt { font-weight: 800; }
.tx-amt.pos { color: var(--c-success, #22c55e); }
.tx-amt.neg { color: var(--c-text, #eaf2ff); }
</style>
