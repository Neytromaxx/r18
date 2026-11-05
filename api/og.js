// api/og.js — streamer havolasi uchun 1200×630 rasm (og:image).
// Vercel Edge Function, `@vercel/og`. Nom, nik, avatar (boʻlmasa birinchi
// harf) va brend ranglari. Kesh — 10 daqiqa.
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const API = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '')

// JSX yoʻq (oddiy Vite loyihasi) — satori element obyektlarini qabul qiladi
const h = (type, style, children) => ({ type, props: { style, children } })

async function avatarDataUrl(url) {
  if (!url) return null
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const type = r.headers.get('content-type') || 'image/jpeg'
    if (!type.startsWith('image/')) return null
    const bytes = new Uint8Array(await r.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return `data:${type};base64,${btoa(bin)}`
  } catch {
    return null
  }
}

export function card({ name, nickname, avatar }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase()
  const avatarNode = avatar
    ? { type: 'img', props: { src: avatar, width: 220, height: 220, style: { borderRadius: 110, objectFit: 'cover' } } }
    : h('div', {
        width: 220, height: 220, borderRadius: 110, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 110, fontWeight: 800,
        color: '#00D4FF', background: 'rgba(0,212,255,0.14)', border: '4px solid rgba(0,212,255,0.6)',
      }, letter)
  return h('div', {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 90px',
    gap: 60, color: '#F0F8FF',
    background: 'radial-gradient(circle at 20% 0%, #0B3A66 0%, #060D1A 60%)',
  }, [
    avatarNode,
    h('div', { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }, [
      h('div', { fontSize: 30, color: '#00D4FF', fontWeight: 700 }, 'mydonation.uz'),
      h('div', { fontSize: 76, fontWeight: 800, lineHeight: 1.05 }, name),
      nickname ? h('div', { fontSize: 36, color: '#8FA8C8' }, `@${nickname}`) : h('div', {}, ''),
      h('div', { fontSize: 34, marginTop: 18, color: '#FDE68A' }, 'Donat yuboring — efirda jonli alert'),
    ]),
  ])
}

export default async function handler(request) {
  const id = new URL(request.url).searchParams.get('id') || ''
  let profile = null
  if (API && /^[A-Za-z0-9_-]{1,32}$/.test(id)) {
    try {
      const r = await fetch(`${API}/streamer/public/${encodeURIComponent(id)}`)
      if (r.ok) profile = await r.json()
    } catch { /* standart rasm */ }
  }
  const node = card({
    name: profile?.display_name || 'Epsilon Donation',
    nickname: profile?.nickname || '',
    avatar: await avatarDataUrl(profile?.avatar_url),
  })
  return new ImageResponse(node, {
    width: 1200,
    height: 630,
    headers: { 'cache-control': 'public, max-age=0, s-maxage=600' },
  })
}
