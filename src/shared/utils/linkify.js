// Donat xabaridagi havolalarni ajratib beradi.
//
// Xom matnni segmentlarga bo'ladi: { t: 'text' } yoki { t: 'link' }.
// v-html ISHLATILMAYDI — segmentlar shablonda oddiy matn sifatida chiqadi,
// shuning uchun xabar ichidagi HTML/skript hech qachon bajarilmaydi.

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi

// Havola oxiridagi tinish belgilari URL'ga kirmasin: "sayt.uz." → "sayt.uz" + "."
const TRAILING_RE = /[.,!?;:)\]}»"']+$/

// Domen → platforma kaliti (LINK_PLATFORM_ICON bilan bir xil nomlar)
const PLATFORM_BY_HOST = [
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'youtube'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)t\.me$|(^|\.)telegram\.(me|org)$/, 'telegram'],
  [/(^|\.)twitch\.tv$/, 'twitch'],
  [/(^|\.)kick\.com$/, 'kick'],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, 'facebook'],
  [/(^|\.)(twitter\.com|x\.com)$/, 'twitter'],
  [/(^|\.)discord\.(gg|com)$/, 'discord'],
]

function hostOf(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function platformOf(href) {
  const host = hostOf(href)
  for (const [re, key] of PLATFORM_BY_HOST) {
    if (re.test(host)) return key
  }
  return 'web'
}

/**
 * @param {string} text donat xabari
 * @returns {Array<{t:'text'|'link', v:string, href?:string, platform?:string}>}
 */
export function linkify(text) {
  const s = String(text ?? '')
  if (!s) return []

  const out = []
  let last = 0

  for (const m of s.matchAll(URL_RE)) {
    const start = m.index
    if (start > last) out.push({ t: 'text', v: s.slice(last, start) })

    let raw = m[0]
    let tail = ''
    const trail = raw.match(TRAILING_RE)
    if (trail) {
      tail = trail[0]
      raw = raw.slice(0, raw.length - tail.length)
    }

    if (raw) {
      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      out.push({
        t: 'link',
        v: hostOf(href) || raw,   // ko'rinadigan matn — domen (qisqa va tushunarli)
        href,
        platform: platformOf(href),
      })
    }
    if (tail) out.push({ t: 'text', v: tail })

    last = start + m[0].length
  }

  if (last < s.length) out.push({ t: 'text', v: s.slice(last) })
  return out
}
