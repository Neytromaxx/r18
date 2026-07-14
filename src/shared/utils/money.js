// Fiat summani ko'rsatish uchun formatlash (UZS). 20000 -> "20 000"
export function fmtSom(v) {
  const n = Math.round(Number(v) || 0)
  return n.toLocaleString('ru-RU').replace(/ /g, ' ').replace(/,/g, ' ')
}
