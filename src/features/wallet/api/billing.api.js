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
  // GET /billing/intents/{id} — to'lov holati (poll, auth'siz)
  getIntent(id) {
    return api.get(`/billing/intents/${id}`)
  },
}

// PSP donat komissiyasi (backend PSP_DONATION_RATE bilan mos)
export const PSP_DONATION_RATE = 0.015
// Wallet donat komissiyasi (backend COMMISSION_RATE bilan mos)
export const WALLET_DONATION_RATE = 0.007
