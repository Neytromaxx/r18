import { api } from '@/app/api/client'

export const billingApi = {
  // POST /billing/donations — PSP donat intenti (guest ham). → { intent_id, checkout_url, ... }
  createDonationIntent(payload) {
    return api.post('/billing/donations', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
  },
  // POST /billing/topups — PSP top-up intenti (auth)
  createTopupIntent(provider, amount) {
    return api.post(
      '/billing/topups',
      { provider, amount },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
  },
  // GET /billing/topups/quote?amount= — fee ko'rsatish (haftalik bepul limit)
  getTopupQuote(amount) {
    return api.get('/billing/topups/quote', { params: { amount } })
  },
  // GET /billing/intents/{id} — to'lov holati (poll, auth'siz).
  // Donatda `reward`: { cashback_w, first_bonus_w, status, expires_at, message }
  getIntent(id) {
    return api.get(`/billing/intents/${id}`)
  },
  // GET /billing/donations/quote — donat cheki (komissiya, net, W).
  // Komissiya va W frontendda HISOBLANMAYDI — faqat shu javobdan.
  donationQuote({ recipient_public_id, amount, cover_fee }) {
    return api.get('/billing/donations/quote', {
      params: { recipient_public_id, amount, cover_fee: Boolean(cover_fee) },
    })
  },
}
