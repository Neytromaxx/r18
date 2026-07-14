<script setup>
// Public OBS overlay — AUTH'SIZ. /overlay/:token orqali ochiladi (OBS browser
// source). /ws/overlay?token= ga ulanib, donat alertlarini KATTA, markazda,
// shaffof fon ustida ko'rsatadi (stream ustiga qo'yiladi).
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { LINK_PLATFORM_ICON } from '../api/streamer.api'

function linkIcon(platform) {
  return LINK_PLATFORM_ICON[platform] || LINK_PLATFORM_ICON.web
}

const route = useRoute()
const token = route.params.token
const alerts = ref([])
let seq = 0
const SHOW_MS = 8000

let ws = null
let heartbeat = null
let reconnectTimer = null
let attempts = 0
let closed = false

function wsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  let origin
  try { origin = new URL(apiUrl).origin } catch { origin = window.location.origin }
  const wsOrigin = origin.replace(/^http/, 'ws')
  return `${wsOrigin}/ws/overlay?token=${encodeURIComponent(token)}`
}

function fmt(v) {
  return (Math.round(Number(v) || 0)).toLocaleString('ru-RU').replace(/,/g, ' ')
}

// Ovoz signali — tashqi fayl'siz, WebAudio bilan qisqa "ding"
function playDing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.42)
  } catch { /* ignore */ }
}

// Summa uchun eng mos (yuqori) ovoz darajasini tanlaydi
function pickTierUrl(tiers, amount) {
  if (!Array.isArray(tiers)) return null
  let best = null
  for (const t of tiers) {
    if (t?.url && amount >= Number(t.min_amount || 0)) {
      if (!best || Number(t.min_amount) >= Number(best.min_amount)) best = t
    }
  }
  return best?.url || null
}

// Server TTS — /streamer/tts?token=&donation_id= MP3 qaytaradi (OBS brauzerida
// ishonchli). Alert ovozidan keyin ~1.8s kechikish bilan ijro etiladi.
function apiOrigin() {
  return import.meta.env.VITE_API_URL || ''
}
function playServerTts(donationId, enabled) {
  if (!enabled || !donationId) return
  const url = `${apiOrigin()}/streamer/tts?token=${encodeURIComponent(token)}&donation_id=${encodeURIComponent(donationId)}`
  setTimeout(() => {
    try {
      const a = new Audio(url)
      a.play().catch(() => {})   // 204/xato bo'lsa jim
    } catch { /* ignore */ }
  }, 1800)
}

function pushAlert(p) {
  const s = p?.settings || {}
  const durationMs = (Number(s.alert_duration) || 8) * 1000
  const amountNum = Number(p?.amount) || 0
  const id = ++seq
  alerts.value.push({
    id,
    from: p?.from_name || 'Anonim',
    amount: fmt(p?.amount),
    // Overlay xabari — segmentlar (matn + link chip); fallback: xom matn
    segments: Array.isArray(p?.message_segments)
      ? p.message_segments
      : ((p?.message || '').trim() ? [{ t: 'text', v: p.message.trim() }] : []),
    showAmount: s.show_amount !== false,
    showMessage: s.show_message !== false,
  })

  // Ovoz: summa darajasi bo'lsa — o'sha musiqa; aks holda default ding
  const tierUrl = pickTierUrl(s.sound_tiers, amountNum)
  if (tierUrl) {
    try { new Audio(tierUrl).play() } catch { /* ignore */ }
  } else if (s.sound_enabled !== false) {
    playDing()
  }

  // TTS — server orqali xabarni ovoz bilan o'qish (linklarsiz)
  if (s.show_message !== false) {
    playServerTts(p?.donation_id, s.tts_enabled === true)
  }

  setTimeout(() => { alerts.value = alerts.value.filter((a) => a.id !== id) }, durationMs)
}

function connect() {
  if (closed) return
  try { ws = new WebSocket(wsUrl()) } catch { scheduleReconnect(); return }
  ws.onopen = () => {
    attempts = 0
    heartbeat = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
    }, 25000)
  }
  ws.onmessage = (e) => {
    let msg
    try { msg = JSON.parse(e.data) } catch { return }
    if (msg.type === 'event' && msg.event === 'donation_alert') pushAlert(msg.payload)
  }
  ws.onclose = () => { clearInterval(heartbeat); scheduleReconnect() }
  ws.onerror = () => { if (ws) ws.close() }
}

function scheduleReconnect() {
  if (closed) return
  const delay = Math.min(1000 * 2 ** attempts, 15000)
  attempts++
  reconnectTimer = setTimeout(connect, delay)
}

onMounted(connect)
onUnmounted(() => {
  closed = true
  clearInterval(heartbeat)
  clearTimeout(reconnectTimer)
  if (ws) { ws.onclose = null; ws.close() }
})
</script>

<template>
  <div class="overlay-root">
    <TransitionGroup name="ov-pop">
      <div v-for="a in alerts" :key="a.id" class="ov-card">
        <div class="ov-coin"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="ov-from">{{ a.from }}</div>
        <div v-if="a.showAmount" class="ov-amount">{{ a.amount }} <span>so'm</span></div>
        <div v-if="a.showMessage && a.segments.length" class="ov-msg">
          <template v-for="(seg, si) in a.segments" :key="si">
            <span v-if="seg.t === 'text'">{{ seg.v }}</span>
            <span v-else class="ov-link" :style="{ color: linkIcon(seg.platform).color }">
              <i :class="linkIcon(seg.platform).icon"></i> link
            </span>
          </template>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.overlay-root {
  position: fixed;
  inset: 0;
  background: transparent;   /* OBS: stream ustiga qo'yiladi */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 8vh;
  pointer-events: none;
  overflow: hidden;
}
.ov-card {
  min-width: 320px;
  max-width: 70vw;
  text-align: center;
  padding: 22px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(89, 71, 226, 0.9));
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 212, 255, 0.5);
  color: #fff;
  font-family: system-ui, sans-serif;
}
.ov-coin {
  width: 64px; height: 64px; margin: 0 auto 8px;
  border-radius: 50%; display: grid; place-items: center;
  font-size: 30px; color: #ffd54a; background: rgba(0, 0, 0, 0.2);
  animation: ov-bounce 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.ov-from { font-size: 1.4rem; font-weight: 900; text-shadow: 0 2px 6px rgba(0,0,0,0.4); }
.ov-amount { font-size: 2.6rem; font-weight: 900; line-height: 1.1; margin: 2px 0; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.ov-amount span { font-size: 1.1rem; opacity: 0.85; }
.ov-msg { font-size: 1.15rem; margin-top: 4px; opacity: 0.95; word-break: break-word; }
.ov-link {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 8px; margin: 0 2px; border-radius: 6px;
  background: rgba(0, 0, 0, 0.28); font-weight: 700; font-size: 0.95rem;
  vertical-align: middle;
}

@keyframes ov-bounce {
  0% { transform: scale(0.3) rotate(-25deg); }
  60% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0); }
}
.ov-pop-enter-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.ov-pop-leave-active { transition: all 0.4s ease; }
.ov-pop-enter-from { opacity: 0; transform: translateY(-40px) scale(0.8); }
.ov-pop-leave-to { opacity: 0; transform: scale(0.9); }
</style>
