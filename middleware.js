// middleware.js — Vercel Edge Middleware, FAQAT /s/:public_id uchun.
//
// Telegram/WhatsApp havola koʻrinishi JS bajarmaydi: statik index.html da
// har bir streamer havolasi "Epsilon Donation" boʻlib chiqardi. Bu yerda
// index.html ga streamerning nomi, tavsifi va rasmi (og:image) qoʻyiladi.
// Sahifaning qolgan qismi oʻzgarmaydi — SPA avvalgidek yuklanadi.
//
// Streamer topilmasa yoki API javob bermasa — hech narsa qilinmaydi
// (standart meta bilan oddiy index.html).
//
// Kesh: edgeʼda 10 daqiqa (yangi deployda tozalanadi).

export const config = { matcher: '/s/:public_id' }

const API = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '')

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function injectMeta(html, { title, description, image, url }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="mydonation.uz" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n    ')
  return html
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<title>[\s\S]*?<\/title>/i, tags)
}

export async function fetchProfile(publicId, fetchImpl = fetch) {
  if (!API || !/^[A-Za-z0-9_-]{1,32}$/.test(publicId)) return null
  try {
    const r = await fetchImpl(`${API}/streamer/public/${encodeURIComponent(publicId)}`, {
      headers: { accept: 'application/json' },
    })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const publicId = decodeURIComponent(url.pathname.split('/')[2] || '')
  const profile = await fetchProfile(publicId)
  if (!profile?.display_name) return undefined   // standart meta

  const indexRes = await fetch(new URL('/index.html', url))
  if (!indexRes.ok) return undefined

  const name = profile.display_name
  const html = injectMeta(await indexRes.text(), {
    title: `${name} — donat yuborish | mydonation.uz`,
    description: `${name}ga donat yuboring — efirda jonli alert bilan`,
    image: `${url.origin}/api/og?id=${encodeURIComponent(publicId)}`,
    url: url.href,
  })
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600',
    },
  })
}
