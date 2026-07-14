import { api } from '@/app/api/client'

export const streamerApi = {
  // GET /streamer/me → profil yoki null
  me() {
    return api.get('/streamer/me')
  },
  // POST /streamer — streamer bo'lish ({ display_name, links? })
  become(displayName, links = null) {
    return api.post('/streamer', {
      display_name: displayName,
      ...(links ? { links } : {}),
    })
  },
  // PATCH /streamer/me — nom / linklar / sozlamalar
  updateProfile({ displayName = null, links = null, settings = null } = {}) {
    return api.patch('/streamer/me', {
      ...(displayName != null ? { display_name: displayName } : {}),
      ...(links != null ? { links } : {}),
      ...(settings != null ? { settings } : {}),
    })
  },
  // POST /streamer/me/regenerate-token — overlay tokenni yangilash
  regenerateToken() {
    return api.post('/streamer/me/regenerate-token')
  },
  // GET /streamer/public/{publicId} — public streamer sahifasi (auth'siz)
  publicProfile(publicId) {
    return api.get(`/streamer/public/${publicId}`)
  },
  // POST /uploads/audio — donat ovozi (Cloudinary) → { url }
  uploadAudio(file) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'donation-sounds')
    return api.post('/uploads/audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Overlay xabar segmentidagi link platformasi → ikonка/rang
export const LINK_PLATFORM_ICON = {
  instagram: { icon: 'fa-brands fa-instagram', color: '#e1306c' },
  youtube: { icon: 'fa-brands fa-youtube', color: '#ff0000' },
  tiktok: { icon: 'fa-brands fa-tiktok', color: '#fff' },
  telegram: { icon: 'fa-brands fa-telegram', color: '#26a5e4' },
  twitch: { icon: 'fa-brands fa-twitch', color: '#9146ff' },
  kick: { icon: 'fa-solid fa-video', color: '#53fc18' },
  facebook: { icon: 'fa-brands fa-facebook', color: '#1877f2' },
  twitter: { icon: 'fa-brands fa-x-twitter', color: '#fff' },
  discord: { icon: 'fa-brands fa-discord', color: '#5865f2' },
  web: { icon: 'fa-solid fa-globe', color: '#9fb2c8' },
}

// Qo'llab-quvvatlanadigan platformalar (UI uchun)
export const STREAM_PLATFORMS = [
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube', color: '#ff0000' },
  { key: 'twitch', label: 'Twitch', icon: 'fa-brands fa-twitch', color: '#9146ff' },
  { key: 'kick', label: 'Kick', icon: 'fa-solid fa-video', color: '#53fc18' },
  { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram', color: '#e1306c' },
  { key: 'telegram', label: 'Telegram', icon: 'fa-brands fa-telegram', color: '#26a5e4' },
  { key: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok', color: '#eaf2ff' },
  { key: 'discord', label: 'Discord', icon: 'fa-brands fa-discord', color: '#5865f2' },
]
