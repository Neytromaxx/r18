<script setup>
// Public streamer donat sahifasi — /s/:public_id.
// GUEST (No-login): PSP (Payme) orqali ro'yxatdan o'tmasdan donat (fee 1.5%),
//   yoki bir klik bilan tizimga kirib ichki hamyondan to'lash (0.7%).
// LOGIN: "Balansdan" (0.7%) yoki "Payme" (1.5%) — tanlov bilan.
// Cover-fee: streamer to'liq summani oladi, komissiya donator ustiga yoziladi.
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { streamerApi, STREAM_PLATFORMS } from '../api/streamer.api'
import { donationsApi } from '@/features/donations/api/donations.api'
import { billingApi, PSP_DONATION_RATE, WALLET_DONATION_RATE } from '@/features/wallet/api/billing.api'
import { walletApi } from '@/features/wallet/api/wallet.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { fmtSom } from '@/shared/utils/money'
import DonationAlert from '@/features/donations/components/DonationAlert.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const publicId = route.params.public_id
const loading = ref(true)
const notFound = ref(false)
const profile = ref(null)

const amount = ref('')
const message = ref('')
const guestName = ref('')
const coverFee = ref(true)
// To'lov usuli: 'wallet' (faqat login) | 'payme'
const method = ref('payme')
const sending = ref(false)

const platforms = STREAM_PLATFORMS

function linkList() {
  const l = profile.value?.links || {}
  return platforms.filter((p) => l[p.key]).map((p) => ({ ...p, url: l[p.key] }))
}

const minAmount = computed(() => Number(profile.value?.min_amount) || 1000)

// Tezkor summa tanlash tugmalari (min_amount dan kichik bo'lmagan)
const presetAmounts = computed(() => {
  const min = minAmount.value
  const base = [2000, 5000, 10000, 25000, 50000, 100000]
  const filtered = base.filter((v) => v >= min)
  if (!filtered.includes(min)) filtered.unshift(min)
  return filtered.slice(0, 5)
})

function pickPreset(val) {
  amount.value = String(val)
}

// Joriy usul bo'yicha fee stavkasi
const feeRate = computed(() =>
  method.value === 'wallet' ? WALLET_DONATION_RATE : PSP_DONATION_RATE,
)
const amountNum = computed(() => Math.max(0, Number(amount.value) || 0))
const feePreview = computed(() => {
  return Math.round(amountNum.value * feeRate.value * 100) / 100
})
const totalPreview = computed(() => {
  return coverFee.value ? amountNum.value + feePreview.value : amountNum.value
})
const netPreview = computed(() => {
  return coverFee.value ? amountNum.value : Math.max(0, amountNum.value - feePreview.value)
})

async function load() {
  loading.value = true
  try {
    const { data } = await streamerApi.publicProfile(publicId)
    profile.value = data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
  if (auth.isAuthenticated) {
    method.value = 'wallet'
    await loadBalance()
  }
}

// Donatorning o'z wallet balansi
const balance = ref(null)
async function loadBalance() {
  try {
    const { data } = await walletApi.get()
    balance.value = Number(data?.balance) || 0
  } catch {
    balance.value = null
  }
}

// Balans yetadimi (faqat wallet usuli uchun ma'noli)
const notEnough = computed(() => (
  method.value === 'wallet'
  && balance.value !== null
  && amountNum.value > 0
  && totalPreview.value > balance.value
))

const belowMin = computed(() => (
  amountNum.value > 0 && amountNum.value < minAmount.value
))

function selectMethod(m) {
  if (m === 'wallet' && !auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  method.value = m
}

function goLogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function validAmount() {
  const amt = Number(amount.value)
  const min = minAmount.value
  if (!amt || amt < min) {
    toast.error(`Minimal donat: ${fmtSom(min)} so'm`)
    return null
  }
  return amt
}

// Balansdan (faqat login, 0.7%)
async function donateWallet(amt) {
  await donationsApi.donate({
    recipient_type: 'player',
    recipient_public_id: publicId,
    amount: amt,
    message: message.value.trim() || null,
    cover_fee: coverFee.value,
  })
  toast.success(`${profile.value.display_name}'ga ${fmtSom(netPreview.value)} so'm yetkazildi!`)
  amount.value = ''
  message.value = ''
  await loadBalance()
}

// PSP (Payme) — guest ham, login ham (1.5%)
async function donatePsp(amt) {
  const { data } = await billingApi.createDonationIntent({
    provider: 'payme',
    recipient_type: 'player',
    recipient_public_id: publicId,
    amount: amt,
    message: message.value.trim() || null,
    guest_name: auth.isAuthenticated ? null : (guestName.value.trim() || null),
    cover_fee: coverFee.value,
  })
  window.location.href = data.checkout_url
}

async function donate() {
  const amt = validAmount()
  if (amt == null) return
  sending.value = true
  try {
    if (method.value === 'wallet') {
      if (!auth.isAuthenticated) {
        goLogin()
        return
      }
      await donateWallet(amt)
    } else {
      await donatePsp(amt)
    }
  } catch (e) {
    toast.error(e.response?.data?.error?.message || e.response?.data?.detail || 'Yuborilmadi')
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="sp-root">
    <!-- App-darajali donat alerti (login bo'lgan foydalanuvchiga ham chiqadi) -->
    <DonationAlert />

    <!-- Yuqori mini-navigatsiya: Brend + Hamyon / Kirish -->
    <header class="sp-topbar">
      <RouterLink to="/" class="sp-brand">
        <span class="sp-brand-ic"><i class="fa-solid fa-bolt"></i></span>
        <span>Epsilon <b>Donation</b></span>
      </RouterLink>

      <div class="sp-topbar-right">
        <template v-if="auth.isAuthenticated">
          <RouterLink to="/hub" class="sp-wallet-pill" title="Hamyon va donatlar">
            <i class="fa-solid fa-wallet"></i>
            <span v-if="balance !== null">{{ fmtSom(balance) }} so'm</span>
            <span v-else>Hamyon</span>
            <span class="sp-pill-plus"><i class="fa-solid fa-plus"></i></span>
          </RouterLink>
          <RouterLink to="/cabinet" class="sp-user-pill" title="Kabinet">
            <i class="fa-solid fa-user-check"></i>
            <span>@{{ auth.user?.username || 'profil' }}</span>
          </RouterLink>
        </template>
        <button v-else class="sp-login-btn" @click="goLogin">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Kirish · <b>0.7%</b></span>
        </button>
      </div>
    </header>

    <main class="sp-main">
      <div v-if="loading" class="sp-state glass">
        <i class="fa-solid fa-circle-notch fa-spin sp-spin"></i>
        <p>Streamer sahifasi yuklanmoqda…</p>
      </div>

      <div v-else-if="notFound" class="sp-state glass">
        <div class="sp-nf-ic"><i class="fa-solid fa-user-slash"></i></div>
        <h2>Streamer topilmadi</h2>
        <p>Havola noto'g'ri yoki streamer profili hali faollashtirilmagan.</p>
        <RouterLink to="/" class="sp-back-home">Bosh sahifaga qaytish</RouterLink>
      </div>

      <div v-else class="sp-card glass anim-rise">
        <!-- Streamer Hero qismi -->
        <div class="sp-hero">
          <div class="sp-avatar-wrap">
            <div class="sp-avatar">
              <i class="fa-solid fa-tower-broadcast"></i>
            </div>
            <span class="sp-live-badge" title="Donat qabul qilinmoqda">
              <span class="sp-dot"></span> LIVE ALERT
            </span>
          </div>

          <div class="sp-identity">
            <h1 class="sp-name">{{ profile.display_name }}</h1>
            <div class="sp-meta">
              <span v-if="profile.nickname" class="sp-handle">@{{ profile.nickname }}</span>
              <span class="sp-id-chip">#{{ publicId }}</span>
            </div>
          </div>

          <!-- Platforma havolalari -->
          <div v-if="linkList().length" class="sp-links">
            <a
              v-for="l in linkList()"
              :key="l.key"
              :href="l.url"
              target="_blank"
              rel="noopener"
              class="sp-social-link"
              :title="l.label"
              :style="{ '--pf-color': l.color }"
            >
              <i :class="l.icon"></i>
              <span>{{ l.label }}</span>
            </a>
          </div>
        </div>

        <div class="sp-divider"></div>

        <!-- Donat formasi -->
        <div class="sp-form">
          <!-- 1. To'lov usuli -->
          <div class="sp-sec-head">
            <span class="sp-sec-title">To'lov usuli</span>
            <span v-if="!auth.isAuthenticated" class="sp-guest-tag">
              <i class="fa-solid fa-bolt"></i> Ro'yxatdan o'tmasdan to'lash mumkin
            </span>
          </div>

          <div class="sp-methods">
            <!-- Payme (Guest + Auth) -->
            <button
              type="button"
              class="sp-method-card"
              :class="{ active: method === 'payme' }"
              @click="selectMethod('payme')"
            >
              <div class="sp-mc-top">
                <span class="sp-mc-icon payme"><i class="fa-solid fa-credit-card"></i></span>
                <span class="sp-mc-rate">1.5%</span>
              </div>
              <div class="sp-mc-name">Payme</div>
              <div class="sp-mc-sub">Karta orqali · Tezkor (No-login)</div>
            </button>

            <!-- Ichki Hamyon (Balansdan) -->
            <button
              type="button"
              class="sp-method-card"
              :class="{ active: method === 'wallet' }"
              @click="selectMethod('wallet')"
            >
              <div class="sp-mc-top">
                <span class="sp-mc-icon wallet"><i class="fa-solid fa-wallet"></i></span>
                <span class="sp-mc-rate best">0.7% · Arzon</span>
              </div>
              <div class="sp-mc-name">Hamyondan</div>
              <div v-if="auth.isAuthenticated && balance !== null" class="sp-mc-sub">
                Balans: <b>{{ fmtSom(balance) }} so'm</b>
              </div>
              <div v-else class="sp-mc-sub">Kirish orqali · W bonus</div>
            </button>
          </div>

          <!-- Tez kunda chiquvchi usullar -->
          <div class="sp-soon-row">
            <span class="sp-soon-lbl">Tez kunda:</span>
            <span class="sp-soon-chip"><i class="fa-solid fa-lock"></i> Click</span>
            <span class="sp-soon-chip"><i class="fa-solid fa-lock"></i> Uzum Bank</span>
          </div>

          <!-- Hamyon balansi holati (faqat wallet tanlanganda) -->
          <div
            v-if="method === 'wallet' && auth.isAuthenticated && balance !== null"
            class="sp-wallet-bar"
            :class="{ low: notEnough }"
          >
            <div class="sp-wb-left">
              <i :class="notEnough ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-wallet'"></i>
              <div>
                <div class="sp-wb-lbl">Mavjud balansingiz</div>
                <div class="sp-wb-val">{{ fmtSom(balance) }} so'm</div>
              </div>
            </div>
            <RouterLink to="/hub" class="sp-wb-topup">
              <i class="fa-solid fa-plus"></i> To'ldirish
            </RouterLink>
          </div>
          <p v-if="notEnough" class="sp-warn-text">
            Hamyonda {{ fmtSom(totalPreview - balance) }} so'm yetishmayapti — "To'ldirish" tugmasini bosing yoki Payme'ni tanlang.
          </p>

          <!-- 2. Kimdan (Guest uchun ism, Login user uchun nick ko'rsatkichi) -->
          <div class="sp-field">
            <div class="sp-field-head">
              <label>Efirda ko'rinadigan ism</label>
              <span class="sp-field-hint">OBS alertda chiqadi</span>
            </div>
            <div v-if="auth.isAuthenticated" class="sp-sender-badge">
              <i class="fa-solid fa-circle-user"></i>
              <span>Donat <b>{{ auth.user?.username || 'sizning nomingiz' }}</b> nomidan yuboriladi</span>
            </div>
            <div v-else class="sp-input-wrap">
              <i class="fa-regular fa-user sp-inp-ic"></i>
              <input
                v-model="guestName"
                type="text"
                maxlength="64"
                placeholder="Ismingiz yoki nick (bo'sh qolsa — Anonim)"
                class="sp-inp with-ic"
              />
            </div>
          </div>

          <!-- 3. Summa + Tezkor chiplar -->
          <div class="sp-field">
            <div class="sp-field-head">
              <label>Donat summasi</label>
              <span class="sp-field-hint">Minimal: <b>{{ fmtSom(minAmount) }} so'm</b></span>
            </div>

            <div class="sp-amount-box" :class="{ invalid: belowMin }">
              <input
                v-model="amount"
                type="number"
                inputmode="numeric"
                :min="minAmount"
                :placeholder="fmtSom(minAmount)"
                class="sp-amount-inp"
              />
              <span class="sp-ccy-tag">SO'M</span>
            </div>
            <p v-if="belowMin" class="sp-warn-text">
              Minimal donat summasi {{ fmtSom(minAmount) }} so'm bo'lishi kerak.
            </p>

            <!-- Tezkor summa chiplari -->
            <div class="sp-presets">
              <button
                v-for="p in presetAmounts"
                :key="p"
                type="button"
                class="sp-preset"
                :class="{ active: amountNum === p }"
                @click="pickPreset(p)"
              >
                {{ fmtSom(p) }}
              </button>
            </div>
          </div>

          <!-- 4. Xabar (Textarea + TTS/Link eslatmasi) -->
          <div class="sp-field">
            <div class="sp-field-head">
              <label>Xabar (ixtiyoriy)</label>
              <span class="sp-field-hint">{{ message.length }} / 280</span>
            </div>
            <textarea
              v-model="message"
              rows="2"
              maxlength="280"
              placeholder="Streamerga xabar yoki savolingizni yozing…"
              class="sp-textarea"
            ></textarea>
          </div>

          <!-- 5. Cover-fee switch + Hisob-kitob -->
          <div class="sp-cover-card" :class="{ active: coverFee }" @click="coverFee = !coverFee">
            <div class="sp-cover-left">
              <div class="sp-switch" :class="{ on: coverFee }">
                <span class="sp-switch-knob"></span>
              </div>
              <div class="sp-cover-text">
                <div class="sp-cover-title">
                  To'liq summa yetkazish
                  <span class="sp-cover-badge">+{{ (feeRate * 100).toFixed(1) }}%</span>
                </div>
                <div class="sp-cover-sub">
                  <template v-if="amountNum > 0">
                    Streamer aynan <b>{{ fmtSom(amountNum) }} so'm</b>ni to'liq qabul qiladi
                  </template>
                  <template v-else>
                    Komissiyani o'z ustingizga olasiz — streamer kiritilgan summani to'liq oladi
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Jonli hisob-kitob cheki -->
          <div v-if="amountNum > 0" class="sp-receipt">
            <div class="sp-rc-row">
              <span><i class="fa-solid fa-hand-holding-heart"></i> Streamerga tushadi</span>
              <b class="sp-rc-net">{{ fmtSom(netPreview) }} so'm</b>
            </div>
            <div class="sp-rc-row">
              <span>
                Komissiya ({{ (feeRate * 100).toFixed(1) }}% —
                {{ coverFee ? 'sizdan' : 'donat ichidan' }})
              </span>
              <span>{{ fmtSom(feePreview) }} so'm</span>
            </div>
            <div class="sp-rc-row total">
              <span>{{ method === 'wallet' ? 'Hamyondan yechiladi' : "Jami to'laysiz" }}</span>
              <b>{{ fmtSom(totalPreview) }} so'm</b>
            </div>
          </div>

          <!-- Yuborish tugmasi -->
          <button
            type="button"
            class="sp-submit press"
            :disabled="sending || notEnough || belowMin"
            @click="donate"
          >
            <i class="fa-solid fa-paper-plane"></i>
            <template v-if="sending">Yuborilmoqda…</template>
            <template v-else-if="method === 'payme'">
              Payme orqali {{ amountNum > 0 ? fmtSom(totalPreview) + " so'm " : '' }}yuborish
            </template>
            <template v-else>
              Hamyondan {{ amountNum > 0 ? fmtSom(totalPreview) + " so'm " : '' }}yuborish
            </template>
          </button>

          <p class="sp-foot-note">
            <template v-if="method === 'payme'">
              <i class="fa-solid fa-shield-halved"></i>
              Payme himoyalangan sahifasiga o'tasiz. To'lov tasdiqlanishi bilan efirda jonli alert chiqadi.
            </template>
            <template v-else>
              <i class="fa-solid fa-bolt"></i>
              Mablag' darhol hamyoningizdan yechiladi va efirda shu zahoti jonli alert chiqadi.
            </template>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sp-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(900px 500px at 50% -8%, rgba(0, 212, 255, 0.18), transparent 70%),
    radial-gradient(700px 500px at 85% 90%, rgba(19, 60, 111, 0.35), transparent 70%),
    var(--c-bg-base, #060d1a);
  color: var(--c-text, #f0f8ff);
}

/* ── Topbar ── */
.sp-topbar {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sp-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--c-text, #f0f8ff);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
}
.sp-brand-ic {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(0, 212, 255, 0.14);
  border: 1px solid rgba(0, 212, 255, 0.38);
  color: var(--c-accent, #00d4ff);
}
.sp-brand b {
  color: var(--c-accent, #00d4ff);
  font-weight: 800;
}
.sp-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sp-wallet-pill,
.sp-user-pill,
.sp-login-btn {
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}
.sp-wallet-pill {
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.35);
  color: var(--c-text, #f0f8ff);
}
.sp-wallet-pill > i {
  color: var(--c-accent, #00d4ff);
}
.sp-pill-plus {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--c-accent, #00d4ff);
  color: #04101f;
  font-size: 0.68rem;
}
.sp-pill-plus i {
  color: #04101f;
}
.sp-user-pill {
  background: rgba(12, 31, 65, 0.65);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
  color: var(--c-text-dim, #8fa8c8);
}
.sp-login-btn {
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.45);
  color: var(--c-text, #f0f8ff);
  cursor: pointer;
}
.sp-login-btn b {
  color: var(--c-accent, #00d4ff);
}
.sp-login-btn:hover,
.sp-wallet-pill:hover {
  border-color: var(--c-accent, #00d4ff);
  box-shadow: 0 0 16px rgba(0, 212, 255, 0.25);
}

/* ── Main Container ── */
.sp-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10px 16px 48px;
}

.sp-state {
  width: min(94vw, 440px);
  margin-top: 40px;
  padding: 36px 24px;
  text-align: center;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-spin {
  font-size: 32px;
  color: var(--c-accent, #00d4ff);
  margin-bottom: 12px;
}
.sp-nf-ic {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 26px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.sp-state h2 {
  color: var(--c-text, #f0f8ff);
  font-size: 1.2rem;
  margin-bottom: 6px;
}
.sp-back-home {
  display: inline-flex;
  margin-top: 16px;
  padding: 10px 18px;
  border-radius: 12px;
  background: var(--c-accent, #00d4ff);
  color: var(--c-bg-base, #060d1a);
  font-weight: 800;
  text-decoration: none;
}

/* ── Card ── */
.sp-card {
  width: min(100%, 480px);
  padding: 26px 22px;
  border-radius: 24px;
  background: rgba(8, 19, 38, 0.78);
  border: 1px solid rgba(89, 133, 189, 0.3);
  box-shadow:
    0 20px 55px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* ── Hero ── */
.sp-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.sp-avatar-wrap {
  position: relative;
  margin-bottom: 14px;
}
.sp-avatar {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 32px;
  color: var(--c-accent, #00d4ff);
  background: radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.25), rgba(12, 31, 65, 0.8));
  border: 1.5px solid rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 28px rgba(0, 212, 255, 0.25);
}
.sp-live-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 9px;
  border-radius: 999px;
  background: #071529;
  border: 1px solid rgba(34, 197, 94, 0.55);
  color: #4ade80;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.sp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}
.sp-name {
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}
.sp-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-id-chip {
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}
.sp-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}
.sp-social-link {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(89, 133, 189, 0.25);
  color: var(--c-text, #f0f8ff);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.15s, border-color 0.15s;
}
.sp-social-link i {
  color: var(--pf-color, var(--c-accent));
  font-size: 0.95rem;
}
.sp-social-link:hover {
  transform: translateY(-2px);
  border-color: var(--pf-color, var(--c-accent));
}

.sp-divider {
  height: 1px;
  margin: 18px 0;
  background: linear-gradient(90deg, transparent, rgba(89, 133, 189, 0.3), transparent);
}

/* ── Form ── */
.sp-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sp-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.sp-sec-title {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-guest-tag {
  font-size: 0.72rem;
  color: var(--c-accent, #00d4ff);
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.25);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
}

/* ── 2-ustunli To'lov usuli kartalari ── */
.sp-methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.sp-method-card {
  padding: 12px 13px;
  border-radius: 14px;
  background: rgba(6, 13, 26, 0.65);
  border: 1.5px solid rgba(89, 133, 189, 0.24);
  color: var(--c-text, #f0f8ff);
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.18s;
}
.sp-method-card:hover {
  border-color: rgba(0, 212, 255, 0.45);
}
.sp-method-card.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.16), rgba(19, 60, 111, 0.28));
  border-color: var(--c-accent, #00d4ff);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}
.sp-mc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.sp-mc-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  background: rgba(0, 212, 255, 0.14);
  color: var(--c-accent, #00d4ff);
}
.sp-mc-rate {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--c-text-dim, #8fa8c8);
}
.sp-mc-rate.best {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}
.sp-mc-name {
  font-size: 0.96rem;
  font-weight: 800;
  margin-top: 2px;
}
.sp-mc-sub {
  font-size: 0.74rem;
  color: var(--c-text-dim, #8fa8c8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sp-mc-sub b {
  color: var(--c-accent, #00d4ff);
}

.sp-soon-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -4px;
  font-size: 0.73rem;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-soon-chip {
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(89, 133, 189, 0.22);
  opacity: 0.65;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* ── Hamyon balansi paneli ── */
.sp-wallet-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 13px;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.3);
}
.sp-wallet-bar.low {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.45);
}
.sp-wb-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sp-wb-left > i {
  font-size: 1.1rem;
  color: var(--c-accent, #00d4ff);
}
.sp-wallet-bar.low .sp-wb-left > i {
  color: #ef4444;
}
.sp-wb-lbl {
  font-size: 0.72rem;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-wb-val {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--c-text, #f0f8ff);
}
.sp-wb-topup {
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--c-accent, #00d4ff);
  color: var(--c-bg-base, #060d1a);
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* ── Maydonlar ── */
.sp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sp-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.sp-field-head label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-field-hint {
  font-size: 0.74rem;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-field-hint b {
  color: var(--c-accent, #00d4ff);
}

.sp-sender-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.55);
  border: 1px solid rgba(89, 133, 189, 0.22);
  font-size: 0.84rem;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-sender-badge i {
  color: var(--c-accent, #00d4ff);
  font-size: 1rem;
}
.sp-sender-badge b {
  color: var(--c-text, #f0f8ff);
}

.sp-input-wrap {
  position: relative;
}
.sp-inp-ic {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-dim, #8fa8c8);
  pointer-events: none;
}
.sp-inp {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.75);
  border: 1px solid rgba(89, 133, 189, 0.28);
  color: var(--c-text, #f0f8ff);
  font-size: 0.94rem;
}
.sp-inp.with-ic {
  padding-left: 38px;
}
.sp-inp:focus,
.sp-textarea:focus {
  outline: none;
  border-color: var(--c-accent, #00d4ff);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.12);
}

/* Summa maydoni (spinner o'chirilgan) */
.sp-amount-box {
  position: relative;
  display: flex;
  align-items: center;
  height: 54px;
  border-radius: 14px;
  background: rgba(6, 13, 26, 0.82);
  border: 1.5px solid rgba(89, 133, 189, 0.32);
  transition: border-color 0.18s, box-shadow 0.18s;
}
.sp-amount-box:focus-within {
  border-color: var(--c-accent, #00d4ff);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.14);
}
.sp-amount-box.invalid {
  border-color: #ef4444;
}
.sp-amount-inp {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0 16px;
  background: transparent;
  border: none;
  color: var(--c-text, #f0f8ff);
  font-size: 1.35rem;
  font-weight: 900;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}
.sp-amount-inp::-webkit-outer-spin-button,
.sp-amount-inp::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.sp-ccy-tag {
  margin-right: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.12);
  color: var(--c-accent, #00d4ff);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

/* Tezkor summa chiplari */
.sp-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.sp-preset {
  flex: 1;
  min-width: 72px;
  height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(89, 133, 189, 0.24);
  color: var(--c-text-dim, #8fa8c8);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}
.sp-preset:hover {
  border-color: rgba(0, 212, 255, 0.45);
  color: var(--c-text, #f0f8ff);
}
.sp-preset.active {
  background: rgba(0, 212, 255, 0.16);
  border-color: var(--c-accent, #00d4ff);
  color: var(--c-accent, #00d4ff);
}

.sp-textarea {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.75);
  border: 1px solid rgba(89, 133, 189, 0.28);
  color: var(--c-text, #f0f8ff);
  font-family: inherit;
  font-size: 0.92rem;
  resize: vertical;
  min-height: 68px;
}

/* ── Cover-fee switch card ── */
.sp-cover-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(6, 13, 26, 0.55);
  border: 1px solid rgba(89, 133, 189, 0.25);
  cursor: pointer;
  user-select: none;
  transition: all 0.18s;
}
.sp-cover-card.active {
  background: rgba(0, 212, 255, 0.09);
  border-color: rgba(0, 212, 255, 0.45);
}
.sp-cover-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sp-switch {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: rgba(89, 133, 189, 0.3);
  padding: 3px;
  flex-shrink: 0;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}
.sp-switch.on {
  background: var(--c-accent, #00d4ff);
}
.sp-switch-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.sp-switch.on .sp-switch-knob {
  transform: translateX(18px);
  background: #04101f;
}
.sp-cover-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--c-text, #f0f8ff);
  display: flex;
  align-items: center;
  gap: 6px;
}
.sp-cover-badge {
  font-size: 0.7rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(0, 212, 255, 0.16);
  color: var(--c-accent, #00d4ff);
}
.sp-cover-sub {
  font-size: 0.78rem;
  color: var(--c-text-dim, #8fa8c8);
  margin-top: 2px;
}
.sp-cover-sub b {
  color: var(--c-text, #f0f8ff);
}

/* ── Receipt breakdown ── */
.sp-receipt {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(4, 10, 20, 0.65);
  border: 1px solid rgba(89, 133, 189, 0.24);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.84rem;
}
.sp-rc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--c-text-dim, #8fa8c8);
}
.sp-rc-row i {
  color: var(--c-accent, #00d4ff);
  margin-right: 4px;
}
.sp-rc-net {
  color: #4ade80;
  font-weight: 800;
}
.sp-rc-row.total {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(89, 133, 189, 0.3);
  color: var(--c-text, #f0f8ff);
  font-weight: 700;
}
.sp-rc-row.total b {
  color: var(--c-accent, #00d4ff);
  font-size: 1rem;
  font-weight: 900;
}

.sp-warn-text {
  font-size: 0.78rem;
  color: #ef4444;
  margin: -2px 0 2px;
}

/* ── Submit CTA ── */
.sp-submit {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d4ff, #1fb6ff);
  color: #04101f;
  font-size: 0.98rem;
  font-weight: 900;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  box-shadow: 0 8px 26px rgba(0, 212, 255, 0.32);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.sp-submit:hover:not(:disabled) {
  box-shadow: 0 10px 32px rgba(0, 212, 255, 0.48);
}
.sp-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.sp-foot-note {
  text-align: center;
  font-size: 0.74rem;
  color: var(--c-text-dim, #8fa8c8);
  line-height: 1.45;
}
.sp-foot-note i {
  color: var(--c-accent, #00d4ff);
  margin-right: 4px;
}

@media (max-width: 480px) {
  .sp-topbar {
    padding: 12px 14px;
  }
  .sp-user-pill {
    display: none;
  }
  .sp-card {
    padding: 20px 16px;
    border-radius: 20px;
  }
}
</style>
