<script setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { profileApi } from '../api/profile.api'

const auth = useAuthStore()
const u = computed(() => auth.user)

// ── Username ──
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const usernameInput = ref('')
const editing = ref(false)
const saving = ref(false)

function startEdit() {
  usernameInput.value = u.value?.username || ''
  editing.value = true
}

async function saveUsername() {
  const name = usernameInput.value.trim()
  if (!USERNAME_RE.test(name)) {
    toast.error("Username 3-30 belgi, faqat harf, raqam va _ bo'lishi kerak")
    return
  }
  saving.value = true
  try {
    await profileApi.updateUsername(name)
    await auth.fetchMe()
    toast.success('Username yangilandi')
    editing.value = false
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Xato yuz berdi')
  } finally {
    saving.value = false
  }
}

// ── Vaqt mintaqasi ──
const TZ_OPTIONS = []
for (let h = -12; h <= 14; h++) {
  TZ_OPTIONS.push({ value: h * 60, label: `UTC${h >= 0 ? '+' : ''}${h}` })
}
const tzSaving = ref(false)

async function saveTimezone(e) {
  tzSaving.value = true
  try {
    await profileApi.updateTimezone(Number(e.target.value))
    await auth.fetchMe()
    toast.success('Vaqt mintaqasi saqlandi')
  } catch (err) {
    toast.error(err.response?.data?.error?.message || 'Xato yuz berdi')
  } finally {
    tzSaving.value = false
  }
}
</script>

<template>
  <div class="profile">
    <h1 class="title">Profil</h1>

    <section class="card glass anim-rise">
      <div class="row">
        <span class="label">Email</span>
        <span class="value">{{ u?.email }}</span>
      </div>

      <div class="row">
        <span class="label">Username</span>
        <template v-if="!editing">
          <span class="value">
            {{ u?.username || '—' }}
            <button class="edit" title="Tahrirlash" @click="startEdit">
              <i class="fa-solid fa-pen"></i>
            </button>
          </span>
        </template>
        <div v-else class="edit-row">
          <input v-model="usernameInput" maxlength="30" placeholder="username" />
          <button class="btn-mini" :disabled="saving" @click="saveUsername">Saqlash</button>
          <button class="btn-mini ghost" @click="editing = false">Bekor</button>
        </div>
      </div>
      <p class="hint">Username donat alertlari va leaderboard'da ko'rinadi.</p>

      <div class="row">
        <span class="label">Vaqt mintaqasi</span>
        <select
          class="tz-select"
          :value="u?.utc_offset_minutes ?? 300"
          :disabled="tzSaving"
          @change="saveTimezone"
        >
          <option v-for="o in TZ_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <p class="hint">Barcha vaqtlar shu mintaqa bo'yicha ko'rsatiladi. Standart: UTC+5 (Toshkent).</p>

      <div class="row">
        <span class="label">ID</span>
        <span class="value mono">{{ u?.public_id }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile { max-width: 560px; margin: 0 auto; padding: 16px 0 60px; }
.title { font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; }

.card { padding: 20px; }

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--glass-border);
}
.row:last-of-type { border-bottom: none; }
.label { color: var(--c-text-dim); font-size: 0.85rem; }
.value { font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
.value.mono { font-family: ui-monospace, monospace; }

.edit { color: var(--c-text-dim); }
.edit:hover { color: var(--c-accent); }

.edit-row { display: flex; gap: 8px; align-items: center; }
.edit-row input {
  height: 38px;
  padding: 0 10px;
  background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-md);
  color: var(--c-text);
  width: 160px;
}
.edit-row input:focus { outline: none; border-color: var(--c-accent); }
.btn-mini {
  height: 38px;
  padding: 0 12px;
  border-radius: var(--r-md);
  background: var(--c-accent);
  color: var(--c-bg-base);
  font-weight: 700;
  font-size: 0.85rem;
}
.btn-mini.ghost { background: transparent; border: 1px solid var(--glass-border); color: var(--c-text-dim); }

.hint { color: var(--c-text-dim); font-size: 0.75rem; margin: 4px 0 8px; }

.tz-select {
  height: 38px;
  padding: 0 10px;
  background: rgba(6, 13, 26, 0.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-md);
  color: var(--c-text);
  font-weight: 600;
}
.tz-select:focus { outline: none; border-color: var(--c-accent); }
</style>
