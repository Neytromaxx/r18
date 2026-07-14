const ACCESS_KEY = 'epsilon_donation_access'
const REFRESH_KEY = 'epsilon_donation_refresh'

export const tokenStorage = {
  getAccess() { return localStorage.getItem(ACCESS_KEY) },
  getRefresh() { return localStorage.getItem(REFRESH_KEY) },
  set(access, refresh) {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
