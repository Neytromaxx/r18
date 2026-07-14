import { api } from '@/app/api/client'

export const donationsApi = {
  // POST /donations — donat yuborish. player uchun recipient_public_id (qidiruvdan)
  // yoki recipient_id (UUID). team/tournament uchun recipient_id.
  donate({ recipient_type, recipient_id = null, recipient_public_id = null, amount, message = null }) {
    return api.post('/donations', {
      recipient_type,
      ...(recipient_id ? { recipient_id } : {}),
      ...(recipient_public_id ? { recipient_public_id } : {}),
      amount,
      ...(message ? { message } : {}),
    })
  },
  // GET /donations/sent — men yuborgan donatlar
  sent() {
    return api.get('/donations/sent')
  },
  // GET /donations/received — menga (o'yinchi) kelgan donatlar
  received() {
    return api.get('/donations/received')
  },
  // GET /donations/leaderboard — top donatorlar / streamerlar
  leaderboard() {
    return api.get('/donations/leaderboard')
  },
  // GET /players/search?q= — o'yinchi qidirish [{ public_id, nickname }]
  searchPlayers(q) {
    return api.get('/players/search', { params: { q } })
  },
}
