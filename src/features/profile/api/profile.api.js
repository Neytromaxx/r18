import { api } from '@/app/api/client'

export const profileApi = {
  // PATCH /me/username
  updateUsername(username) {
    return api.patch('/me/username', { username })
  },

  // PATCH /me/timezone — vaqt mintaqasi (UTC dan farq, daqiqa)
  updateTimezone(utcOffsetMinutes) {
    return api.patch('/me/timezone', { utc_offset_minutes: utcOffsetMinutes })
  },
}
