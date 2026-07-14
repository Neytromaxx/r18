import dayjs from 'dayjs'
import 'dayjs/locale/uz-latn'
import utc from 'dayjs/plugin/utc'

dayjs.locale('uz-latn')
dayjs.extend(utc)

// Vaqtlar bazada UTC saqlanadi; ko'rsatish foydalanuvchi profilidagi
// utc_offset_minutes bo'yicha (auth store login/fetchMe'da o'rnatadi).
// Default: UTC+5 (Toshkent).
let displayUtcOffset = 300

export function setDisplayUtcOffset(minutes) {
  const n = Number(minutes)
  displayUtcOffset = Number.isFinite(n) ? n : 300
}

export function getDisplayUtcOffset() {
  return displayUtcOffset
}

export function formatDate(value, fmt = 'DD MMM, HH:mm') {
  if (!value) return '—'
  return dayjs.utc(value).utcOffset(displayUtcOffset).format(fmt)
}

export function formatMoney(value) {
  if (value == null) return '—'
  const n = Number(value)
  if (n === 0) return 'Bepul'
  return n.toLocaleString('uz-UZ') + ' so\'m'
}

// Turnir status — player uchun ranglar
export const STATUS_META = {
  draft:        { label: 'Loyiha',         color: 'var(--c-text-dim)', icon: 'fa-solid fa-file-lines' },
  registration: { label: 'Ro\'yxat ochiq', color: 'var(--c-accent)',   icon: 'fa-solid fa-circle-check' },
  checkin:      { label: 'Check-in',       color: 'var(--c-warning)',  icon: 'fa-solid fa-clock' },
  in_progress:  { label: 'Davom',          color: 'var(--c-success)',  icon: 'fa-solid fa-tower-broadcast' },
  completed:    { label: 'Tugadi',         color: 'var(--c-text-dim)', icon: 'fa-solid fa-flag-checkered' },
  cancelled:    { label: 'Bekor',          color: 'var(--c-danger)',   icon: 'fa-solid fa-circle-xmark' },
}

export const MODE_META = {
  classic: { label: 'Classic', icon: 'fa-solid fa-trophy',     desc: 'Guruh bosqichi, pleyoff va final' },
  tdm:     { label: 'TDM',     icon: 'fa-solid fa-crosshairs', desc: 'Single elimination' },
}