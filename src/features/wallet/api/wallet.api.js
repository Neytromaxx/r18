import { api } from '@/app/api/client'

export const walletApi = {
  // GET /wallet — balans + tranzaksiyalar (ledger proyeksiyasi)
  get() {
    return api.get('/wallet')
  },
  // POST /wallet/topups — top-up so'rovi (summa + chek)
  createTopup(amount, receiptUrl = null) {
    return api.post('/wallet/topups', {
      amount,
      ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
    })
  },
  // GET /wallet/topups — mening top-up so'rovlarim
  myTopups() {
    return api.get('/wallet/topups')
  },
  // POST /uploads/image — chek rasmini yuklash → { url }
  uploadReceipt(file) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'receipts')
    return api.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
