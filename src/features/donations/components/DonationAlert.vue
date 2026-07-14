<script setup>
// Donat alerti — app-darajali overlay (messenger/OBS uslubida). Foydalanuvchi
// o'zining user:{id} kanaliga ulanadi; "donation_alert" kelganda animatsiyali
// karta ko'rsatiladi va ~6s dan keyin o'chadi. Bir nechta alert navbatda turadi.
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useUserSocket } from '@/shared/composables/useUserSocket'

const auth = useAuthStore()
const alerts = ref([])            // { id, from, amount, message }
let seq = 0
const SHOW_MS = 6000

function fmtAmount(v) {
  const n = Math.round(Number(v) || 0)
  // Mingliklarni bo'sh joy bilan ajratamiz: 20000 -> "20 000"
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

function pushAlert(payload) {
  const id = ++seq
  alerts.value.push({
    id,
    from: payload?.from_name || 'Anonim',
    amount: fmtAmount(payload?.amount),
    message: (payload?.message || '').trim(),
  })
  // Navbat cheklovi — ko'pi bilan 4 ta ko'rinadi
  if (alerts.value.length > 4) alerts.value.shift()
  setTimeout(() => {
    alerts.value = alerts.value.filter((a) => a.id !== id)
  }, SHOW_MS)
}

function handleEvent(eventName, payload) {
  if (eventName === 'donation_alert') pushAlert(payload)
}

const { connect, close } = useUserSocket(() => auth.user?.id, handleEvent)

onMounted(() => {
  if (auth.user?.id) connect()
})

// Login/logout — ulanishni qayta o'rnatamiz
watch(() => auth.user?.id, (id, prev) => {
  if (id && id !== prev) {
    close()
    connect()
  } else if (!id) {
    close()
  }
})
</script>

<template>
  <div class="donation-alerts" aria-live="polite">
    <TransitionGroup name="donation-pop">
      <div v-for="a in alerts" :key="a.id" class="donation-card">
        <div class="coin"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="body">
          <div class="line1">
            <span class="from">{{ a.from }}</span>
            <span class="verb">donat qildi</span>
          </div>
          <div class="amount">{{ a.amount }} <span class="ccy">so'm</span></div>
          <div v-if="a.message" class="message">"{{ a.message }}"</div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.donation-alerts {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(92vw, 420px);
  pointer-events: none;
}
.donation-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--r-md, 14px);
  /* Liquid glass + neon */
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.16),
    rgba(245, 158, 11, 0.14)
  );
  border: 1px solid rgba(0, 212, 255, 0.5);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45), var(--led-glow-sm, 0 0 12px rgba(0, 212, 255, 0.35));
}
.coin {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: var(--c-warning, #f59e0b);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  animation: coin-bounce 0.7s var(--ease-out, ease-out);
}
.body { min-width: 0; }
.line1 {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--fs-sm, 0.85rem);
}
.from {
  font-weight: 800;
  color: var(--c-accent, #00d4ff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}
.verb { color: var(--c-text-dim, #9fb2c8); }
.amount {
  font-weight: 900;
  font-size: 1.35rem;
  line-height: 1.1;
  color: var(--c-text, #eaf2ff);
}
.ccy { font-size: 0.8rem; font-weight: 700; color: var(--c-text-dim, #9fb2c8); }
.message {
  margin-top: 2px;
  font-size: var(--fs-sm, 0.85rem);
  color: var(--c-text, #eaf2ff);
  word-break: break-word;
}

@keyframes coin-bounce {
  0% { transform: scale(0.4) rotate(-20deg); }
  60% { transform: scale(1.15) rotate(8deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Kirish/chiqish animatsiyasi */
.donation-pop-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.donation-pop-leave-active { transition: all 0.3s ease; }
.donation-pop-enter-from { opacity: 0; transform: translateY(-16px) scale(0.96); }
.donation-pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }
</style>
