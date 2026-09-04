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
// Summaga mos eng yuqori darajani qaytaradi (ovoz + boshlanish nuqtasi +
// media birgalikda saqlanadi). Daraja faqat media bo'lsa ham hisobga olinadi.
function pickTier(tiers, amount) {
  if (!Array.isArray(tiers)) return null
  let best = null
  for (const t of tiers) {
    if (!t || (!t.url && !t.media_url)) continue
    if (amount < Number(t.min_amount || 0)) continue
    if (!best || Number(t.min_amount) >= Number(best.min_amount)) best = t
  }
  return best
}

// Media turi — kengaytmaga qarab rasm/GIF yoki video
function mediaKind(url) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(url || '')) ? 'video' : 'image'
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

// Musiqani berilgan vaqtdan keyin to'xtatadi. Keskin uzilmasligi uchun
// oxirgi ~0.6s da ovoz ohista pasayadi (fade-out).
const FADE_MS = 600
function stopAudioAfter(audio, totalMs) {
  const ms = Math.max(500, Number(totalMs) || 0)
  const fadeAt = Math.max(0, ms - FADE_MS)
  setTimeout(() => {
    const step = 50
    const startVol = audio.volume
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += step
      const v = startVol * (1 - elapsed / FADE_MS)
      audio.volume = v > 0 ? v : 0
      if (elapsed >= FADE_MS) {
        clearInterval(timer)
        try { audio.pause(); audio.currentTime = 0 } catch { /* ignore */ }
      }
    }, step)
  }, fadeAt)
}

function pushAlert(p) {
  const s = p?.settings || {}
  const durationMs = (Number(s.alert_duration) || 8) * 1000
  const amountNum = Number(p?.amount) || 0
  const id = ++seq
  // Summaga mos daraja — ham ovoz (url/start_at), ham media shu yerdan olinadi
  const tier = pickTier(s.sound_tiers, amountNum)
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
    // Streamer shu daraja uchun rasm/GIF qo'ygan bo'lsa — sikkacha o'rniga
    // o'sha ko'rsatiladi (ism/summa/xabar joyida qoladi).
    media: tier?.media_url || '',
    mediaKind: tier?.media_url ? mediaKind(tier.media_url) : '',
  })

  // Ovoz: summa darajasi bo'lsa — o'sha musiqa; aks holda default ding.
  // Musiqa cheksiz yangramasin: sound_duration sekunddan keyin (0 bo'lsa —
  // alert bilan birga) ohista pasayib to'xtaydi.
  if (tier?.url) {
    try {
      const audio = new Audio(tier.url)
      // Musiqani belgilangan sekunddan boshlaymiz (qo'shiqning "eng qizigi").
      // currentTime faqat metadata yuklangach ishonchli o'rnatiladi.
      const startAt = Number(tier.start_at) || 0
      if (startAt > 0) {
        const seek = () => { try { audio.currentTime = startAt } catch { /* ignore */ } }
        if (audio.readyState >= 1) seek()
        else audio.addEventListener('loadedmetadata', seek, { once: true })
      }
      audio.play()
      const soundMs = (Number(s.sound_duration) || 0) > 0
        ? Number(s.sound_duration) * 1000
        : durationMs
      stopAudioAfter(audio, soundMs)
    } catch { /* ignore */ }
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

// OBS uchun SHAFFOF fon. global.css da `body { background: var(--c-bg-base) }`
// bor — u overlay'ni to'q rangli to'rtburchakka aylantirib, stream ustidagi
// tasvirni to'sib qo'yardi. Faqat shu sahifada bekor qilamiz.
const TRANSPARENT_TARGETS = () => [
  document.documentElement,
  document.body,
  document.getElementById('app'),
].filter(Boolean)
let prevBg = []

onMounted(() => {
  prevBg = TRANSPARENT_TARGETS().map((el) => [el, el.style.background])
  for (const [el] of prevBg) el.style.setProperty('background', 'transparent', 'important')
  connect()
})

onUnmounted(() => {
  for (const [el, bg] of prevBg) el.style.background = bg
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
        <!-- Streamer qo'ygan rasm/GIF/video — bo'lmasa oddiy sikkacha -->
        <video
          v-if="a.media && a.mediaKind === 'video'"
          class="ov-media"
          :src="a.media"
          autoplay
          muted
          loop
          playsinline
        ></video>
        <img v-else-if="a.media" class="ov-media" :src="a.media" alt="" />
        <div v-else class="ov-coin"><i class="fa-solid fa-sack-dollar"></i></div>
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
  /* Alert TEPADA turadi — OBS'da manba to'rtburchagining yuqori qismiga
     qadaladi, shunda streamer uni xohlagan joyiga aniq qo'ya oladi. */
  justify-content: flex-start;
  gap: 2%;
  padding: 2% 2% 0;
  pointer-events: none;
  overflow: hidden;
}
.ov-card {
  /* MUHIM: qattiq min-width YO'Q. Ilgari `min-width: 320px` edi va OBS'da
     Browser Source eni 320px dan kichik bo'lsa karta sig'may, `overflow:
     hidden` uni qirqib tashlardi — alert umuman ko'rinmasdi. Endi manba
     qanday o'lchamda bo'lsa ham to'liq sig'adi. */
  width: 100%;
  max-width: 560px;
  box-sizing: border-box;
  text-align: center;
  padding: 4% 5%;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(89, 71, 226, 0.9));
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 212, 255, 0.5);
  color: #fff;
  font-family: system-ui, sans-serif;
}
/* O'lchamlar vw bilan — OBS'da Browser Source kichik bo'lsa ham karta
   proporsional qisqaradi (ilgari qattiq px edi va sig'masdi). */
.ov-coin {
  width: clamp(28px, 11vw, 64px);
  height: clamp(28px, 11vw, 64px);
  margin: 0 auto 2%;
  border-radius: 50%; display: grid; place-items: center;
  font-size: clamp(14px, 5.5vw, 30px);
  color: #ffd54a; background: rgba(0, 0, 0, 0.2);
  animation: ov-bounce 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
/* Streamer media'si — kartaning eniga sig'adi, balandligi cheklangan
   (aks holda uzun rasm butun manbani egallab, matnni siqib chiqarardi). */
.ov-media {
  display: block;
  width: 100%;
  /* Balandlik cheklangan: ism/summa/xabarga joy qolsin. Aks holda baland
     rasm kartani manbadan chiqarib, `overflow: hidden` xabarni kesardi. */
  max-height: 38vh;
  margin: 0 auto 3%;
  border-radius: 14px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.15);
}
.ov-from {
  font-size: clamp(0.75rem, 4vw, 1.4rem);
  font-weight: 900; text-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
.ov-amount {
  font-size: clamp(1.2rem, 7.5vw, 2.6rem);
  font-weight: 900; line-height: 1.1; margin: 1% 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.ov-amount span { font-size: clamp(0.6rem, 3vw, 1.1rem); opacity: 0.85; }
.ov-msg {
  font-size: clamp(0.65rem, 3.3vw, 1.15rem);
  margin-top: 2%; opacity: 0.95; word-break: break-word;
}
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
