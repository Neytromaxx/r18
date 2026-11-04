import { api } from '@/app/api/client'

export const donationsApi = {
  // POST /donations/rewards/claim — mehmon donati uchun ajratilgan W ni olish.
  // claim_token — intent yaratilganda localStorage ga yozilgan (epd_claim:{id}).
  claimReward(intentId, claimToken) {
    return api.post('/donations/rewards/claim', {
      intent_id: intentId,
      claim_token: claimToken,
    })
  },
  // GET /donations/sent — men yuborgan donatlar (+ "Olish" orqali bogʻlanganlar)
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
