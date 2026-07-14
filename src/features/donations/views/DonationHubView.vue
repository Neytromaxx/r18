<script setup>
// Donat hub — pastki "Donat" tab ichidagi bo'limlar:
//   Wallet · Yuborish · Kelgan · Top
import { ref } from 'vue'
import WalletPanel from '@/features/wallet/components/WalletPanel.vue'
import SendDonation from '../components/SendDonation.vue'
import ReceivedDonations from '../components/ReceivedDonations.vue'
import TopDonors from '../components/TopDonors.vue'

const tabs = [
  { key: 'wallet', label: 'Wallet', icon: 'fa-solid fa-wallet' },
  { key: 'send', label: 'Yuborish', icon: 'fa-solid fa-paper-plane' },
  { key: 'received', label: 'Kelgan', icon: 'fa-solid fa-inbox' },
  { key: 'top', label: 'Top', icon: 'fa-solid fa-ranking-star' },
]
const active = ref('wallet')
const receivedRef = ref(null)

function onSent() {
  // Yuborgandan keyin — wallet balansi o'zgaradi; keyingi ochilishda yangilanadi
  active.value = 'wallet'
}
</script>

<template>
  <div class="hub">
    <header class="hub-head">
      <h1>Donat</h1>
    </header>

    <div class="subtabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="subtab"
        :class="{ active: active === t.key }"
        @click="active = t.key"
      >
        <i :class="t.icon"></i>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <div class="panel">
      <WalletPanel v-if="active === 'wallet'" />
      <SendDonation v-else-if="active === 'send'" @sent="onSent" />
      <ReceivedDonations v-else-if="active === 'received'" ref="receivedRef" />
      <TopDonors v-else-if="active === 'top'" />
    </div>
  </div>
</template>

<style scoped>
.hub {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px 16px 110px;   /* pastda tab bar uchun joy */
}
.hub-head h1 { font-size: 1.5rem; font-weight: 900; margin-bottom: 12px; }
.subtabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
}
.subtab {
  flex: 1;
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 6px;
  border-radius: 12px;
  background: rgba(6, 13, 26, 0.4);
  border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25));
  color: var(--c-text-dim, #9fb2c8);
  font-size: var(--fs-xs, 0.72rem);
  font-weight: 700;
}
.subtab i { font-size: 16px; }
.subtab.active {
  color: var(--c-accent, #00d4ff);
  border-color: rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.1);
  box-shadow: var(--led-glow-sm, 0 0 10px rgba(0, 212, 255, 0.3));
}
</style>
