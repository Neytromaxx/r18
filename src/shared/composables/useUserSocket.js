import { ref, onUnmounted } from 'vue'
import { tokenStorage } from '@/app/api/tokenStorage'

// VITE_API_URL: https://host/api/v1 → WS root /ws (api/v1 EMAS)
function buildWsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  let origin
  try {
    origin = new URL(apiUrl).origin
  } catch {
    origin = window.location.origin
  }
  const wsOrigin = origin.replace(/^http/, 'ws')
  const token = tokenStorage.getAccess()
  const qs = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${wsOrigin}/ws${qs}`
}

/**
 * Foydalanuvchining SHAXSIY kanaliga (user:{id}) ulanadigan app-darajali,
 * doimiy WebSocket. Donat alerti va boshqa shaxsiy bildirishnomalar uchun.
 *
 * @param {() => (string|number|null|undefined)} getAccountId  reaktiv account id
 * @param {(eventName: string, payload: object) => void} onEvent  event kelganda
 * @returns {{ connected: Ref<boolean>, connect: Function, close: Function }}
 */
export function useUserSocket(getAccountId, onEvent) {
  const connected = ref(false)

  let ws = null
  let heartbeat = null
  let reconnectTimer = null
  let attempts = 0
  let manualClose = false

  function channel() {
    const id = getAccountId()
    return id ? `user:${id}` : null
  }

  function clearTimers() {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj))
    }
  }

  function startHeartbeat() {
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = setInterval(() => send({ type: 'ping' }), 25000)
  }

  function scheduleReconnect() {
    if (manualClose) return
    const delay = Math.min(1000 * 2 ** attempts, 15000)
    attempts++
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect() {
    const ch = channel()
    if (!ch) return               // hali auth bo'lmagan — ulanmaymiz
    manualClose = false
    clearTimers()
    try {
      ws = new WebSocket(buildWsUrl())
    } catch {
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      connected.value = true
      attempts = 0
      send({ type: 'subscribe', channel: ch })
      startHeartbeat()
    }

    ws.onmessage = (e) => {
      let msg
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }
      if (msg.type === 'pong') return
      if (msg.type !== 'event' || msg.channel !== channel()) return
      if (typeof onEvent === 'function') {
        onEvent(msg.event, msg.payload)
      }
    }

    ws.onclose = () => {
      connected.value = false
      clearTimers()
      scheduleReconnect()
    }

    ws.onerror = () => {
      if (ws) ws.close()
    }
  }

  function close() {
    manualClose = true
    clearTimers()
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
    connected.value = false
  }

  onUnmounted(close)

  return { connected, connect, close }
}
