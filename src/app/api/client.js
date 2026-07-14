import axios from 'axios'
import { tokenStorage } from './tokenStorage'
import { API_TIMEOUT } from '@/shared/constants/config'

const baseURL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let waiters = []

function onRefreshed(newAccess) {
  waiters.forEach((cb) => cb(newAccess, null))
  waiters = []
}

function onRefreshFailed(err) {
  waiters.forEach((cb) => cb(null, err))
  waiters = []
}

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error('No refresh token')

  const { data } = await axios.post(`${baseURL}/auth/refresh`, {
    refresh_token: refresh,
  })
  tokenStorage.set(data.access_token, data.refresh_token)
  return data.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waiters.push((newAccess, err) => {
            if (err || !newAccess) {
              reject(err || error)
              return
            }
            original.headers.Authorization = `Bearer ${newAccess}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const newAccess = await refreshAccessToken()
        isRefreshing = false
        onRefreshed(newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (refreshError) {
        isRefreshing = false
        onRefreshFailed(refreshError)
        tokenStorage.clear()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)