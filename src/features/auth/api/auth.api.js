import { api } from '@/app/api/client'

export const authApi = {
  logout() {
    return api.post('/auth/logout')
  },
  getMe() {
    return api.get('/me')
  },

  // ── Parolsiz oqim (yagona): email → kod → kirish ──
  // Email yangi bo'lsa backend akkaunt yaratadi (parolsiz), mavjud bo'lsa
  // login kodi yuboradi. Har doim success qaytaradi (enumeration himoyasi).
  requestLoginCode(email) {
    return api.post('/auth/login/request-code', { email })
  },

  // POST /auth/sso-exchange — n20'dan kelgan bir martalik SSO kodni token
  // juftligiga almashtiradi (yangi 14-kunlik donation sessiyasi ochiladi)
  ssoExchange(code) {
    return api.post('/auth/sso-exchange', { code, platform: 'web' })
  },
  verifyLoginCode(email, code) {
    return api.post('/auth/login/verify-code', {
      email, code, platform: 'web',
    })
  },

  // POST /auth/login/google (ixtiyoriy)
  loginGoogle(idToken) {
    return api.post('/auth/login/google', {
      id_token: idToken,
      platform: 'web',
    })
  },
}
