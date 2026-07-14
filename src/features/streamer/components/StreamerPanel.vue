<script setup>
// Streamer bo'lish / overlay boshqaruvi. Streamer bo'lmasa — opt-in forma;
// bo'lsa — overlay URL (OBS browser-source uchun) + token yangilash.
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { streamerApi, STREAM_PLATFORMS } from '../api/streamer.api'
import { useAuthStore } from '@/features/auth/store/auth.store'

const auth = useAuthStore()
const loading = ref(false)
const profile = ref(null)
const name = ref('')
const links = ref({})
const settings = ref({
  min_amount: 5000,
  alert_duration: 8,
  show_amount: true,
  show_message: true,
  sound_enabled: true,
  tts_enabled: false,
  tts_max_chars: 200,
  tts_max_repeat: 5,
  tts_lang: 'auto',
})
const tiers = ref([])              // [{ min_amount, url, label }]
const uploadingTier = ref(-1)
const busy = ref(false)

const overlayUrl = computed(() => {
  if (!profile.value?.overlay_token) return ''
  return `${window.location.origin}/overlay/${profile.value.overlay_token}`
})
const publicUrl = computed(() => {
  const pid = auth.user?.public_id
  return pid ? `${window.location.origin}/s/${pid}` : ''
})

async function load() {
  loading.value = true
  try {
    const { data } = await streamerApi.me()
    profile.value = data || null
    if (profile.value) {
      name.value = profile.value.display_name
      links.value = { ...(profile.value.links || {}) }
      const s = profile.value.settings || {}
      settings.value = { ...settings.value, ...s }
      tiers.value = Array.isArray(s.sound_tiers) ? s.sound_tiers.map((t) => ({ ...t })) : []
    }
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

async function become() {
  if (name.value.trim().length < 2) { toast.error('Nom kamida 2 belgi'); return }
  busy.value = true
  try {
    const { data } = await streamerApi.become(name.value.trim())
    profile.value = data
    toast.success('Siz endi streamersiz! 🎥')
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

async function saveProfile() {
  busy.value = true
  try {
    // Bo'sh linklarni tashlab yuboramiz
    const cleanLinks = {}
    for (const [k, v] of Object.entries(links.value)) {
      if (v && v.trim()) cleanLinks[k] = v.trim()
    }
    const cleanTiers = tiers.value
      .filter((t) => t.url && Number(t.min_amount) > 0)
      .map((t) => ({ min_amount: Number(t.min_amount), url: t.url, label: (t.label || '').trim() }))
    const { data } = await streamerApi.updateProfile({
      displayName: name.value.trim(),
      links: cleanLinks,
      settings: {
        min_amount: Number(settings.value.min_amount) || 5000,
        alert_duration: Number(settings.value.alert_duration) || 8,
        show_amount: !!settings.value.show_amount,
        show_message: !!settings.value.show_message,
        sound_enabled: !!settings.value.sound_enabled,
        tts_enabled: !!settings.value.tts_enabled,
        tts_max_chars: Number(settings.value.tts_max_chars) || 200,
        tts_max_repeat: Number(settings.value.tts_max_repeat) || 5,
        tts_lang: settings.value.tts_lang || 'auto',
        sound_tiers: cleanTiers,
      },
    })
    profile.value = data
    links.value = { ...(data.links || {}) }
    const s = data.settings || {}
    settings.value = { ...settings.value, ...s }
    tiers.value = Array.isArray(s.sound_tiers) ? s.sound_tiers.map((t) => ({ ...t })) : []
    toast.success('Saqlandi')
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

function copyPublic() {
  navigator.clipboard?.writeText(publicUrl.value)
    .then(() => toast.success('Havola nusxalandi'))
    .catch(() => toast.error('Nusxalab bo\'lmadi'))
}

// ── Ovoz darajalari (summa uchun musiqa) ──
function addTier() {
  tiers.value.push({ min_amount: 10000, url: '', label: '' })
}
function removeTier(i) {
  tiers.value.splice(i, 1)
}
async function uploadTierAudio(i, e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('audio/')) { toast.error('Faqat audio'); return }
  if (f.size > 10 * 1024 * 1024) { toast.error('Audio juda katta (maks 10 MB)'); return }
  uploadingTier.value = i
  try {
    const { data } = await streamerApi.uploadAudio(f)
    tiers.value[i].url = data?.url || ''
    if (!tiers.value[i].label) tiers.value[i].label = f.name.replace(/\.[^.]+$/, '')
    toast.success('Audio yuklandi')
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Yuklanmadi')
  } finally {
    uploadingTier.value = -1
  }
}
function testTier(t) {
  if (!t.url) return
  try { new Audio(t.url).play() } catch { /* ignore */ }
}

const PLATFORMS = STREAM_PLATFORMS

async function regenerate() {
  busy.value = true
  try {
    const { data } = await streamerApi.regenerateToken()
    profile.value = data
    toast.success('Overlay havolasi yangilandi')
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

function copyOverlay() {
  navigator.clipboard?.writeText(overlayUrl.value)
    .then(() => toast.success('Havola nusxalandi'))
    .catch(() => toast.error('Nusxalab bo\'lmadi'))
}

onMounted(load)
</script>

<template>
  <div class="streamer">
    <div v-if="loading" class="muted">Yuklanmoqda…</div>

    <!-- Streamer emas — opt-in -->
    <template v-else-if="!profile">
      <div class="intro">
        <div class="ic"><i class="fa-solid fa-video"></i></div>
        <h3>Streamer bo'ling</h3>
        <p>Donatlaringiz jonli efirda OBS overlay orqali ko'rsatiladi.</p>
      </div>
      <label class="lbl">Ko'rsatiladigan nom</label>
      <input v-model="name" type="text" maxlength="80" placeholder="Masalan: EpsilonKing" class="inp" />
      <button class="btn-primary" :disabled="busy" @click="become">
        {{ busy ? '…' : "Streamer bo'lish" }}
      </button>
    </template>

    <!-- Streamer -->
    <template v-else>
      <div class="badge-streamer"><i class="fa-solid fa-circle-check"></i> Siz streamersiz</div>

      <label class="lbl">Ko'rsatiladigan nom</label>
      <input v-model="name" type="text" maxlength="80" class="inp" />

      <label class="lbl">Streaming / ijtimoiy havolalar</label>
      <p class="hint">Public donat sahifangizda ko'rinadi.</p>
      <div class="links">
        <div v-for="pf in PLATFORMS" :key="pf.key" class="link-row">
          <span class="link-ic" :style="{ color: pf.color }"><i :class="pf.icon"></i></span>
          <input
            v-model="links[pf.key]"
            type="url"
            :placeholder="pf.label + ' havolasi'"
            class="inp"
          />
        </div>
      </div>

      <label class="lbl">Donat sozlamalari</label>
      <div class="settings">
        <div class="set-row">
          <span class="set-lbl">Minimal summa (so'm)</span>
          <input v-model.number="settings.min_amount" type="number" min="1000" step="1000" class="inp num" />
        </div>
        <div class="set-row">
          <span class="set-lbl">Alert davomiyligi (sek)</span>
          <input v-model.number="settings.alert_duration" type="number" min="3" max="30" class="inp num" />
        </div>
        <label class="toggle">
          <input v-model="settings.show_amount" type="checkbox" />
          <span>Summani ko'rsatish</span>
        </label>
        <label class="toggle">
          <input v-model="settings.show_message" type="checkbox" />
          <span>Xabarni ko'rsatish</span>
        </label>
        <label class="toggle">
          <input v-model="settings.sound_enabled" type="checkbox" />
          <span>Ovozli signal (default "ding")</span>
        </label>
      </div>

      <!-- Summa uchun ovoz/musiqa -->
      <label class="lbl">Summa uchun ovoz/musiqa</label>
      <p class="hint">Masalan 10 000 → Akon - Ghetto. Eng mos (yuqori) daraja ijro etiladi.</p>
      <div class="tiers">
        <div v-for="(t, i) in tiers" :key="i" class="tier">
          <input v-model.number="t.min_amount" type="number" min="1000" step="1000" class="inp num" placeholder="summa" />
          <input v-model="t.label" type="text" maxlength="80" class="inp" placeholder="Nomi (ixtiyoriy)" />
          <label class="btn-mini" :class="{ ok: t.url }" title="Audio yuklash">
            <i v-if="uploadingTier === i" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else :class="t.url ? 'fa-solid fa-check' : 'fa-solid fa-upload'"></i>
            <input type="file" accept="audio/*" class="hidden" @change="(e) => uploadTierAudio(i, e)" />
          </label>
          <button v-if="t.url" class="btn-mini" @click="testTier(t)" title="Tinglash"><i class="fa-solid fa-play"></i></button>
          <button class="btn-mini danger" @click="removeTier(i)" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
        </div>
        <button class="btn-add" @click="addTier"><i class="fa-solid fa-plus"></i> Daraja qo'shish</button>
      </div>

      <!-- TTS: xabarni ovoz bilan o'qish -->
      <label class="lbl">Xabarni ovoz bilan o'qish (TTS)</label>
      <div class="settings">
        <label class="toggle">
          <input v-model="settings.tts_enabled" type="checkbox" />
          <span>Yoqish</span>
        </label>
        <div class="set-row">
          <span class="set-lbl">Maks belgilar (≤1000)</span>
          <input v-model.number="settings.tts_max_chars" type="number" min="0" max="1000" class="inp num" />
        </div>
        <div class="set-row">
          <span class="set-lbl">Bir xil harf limiti (spam)</span>
          <input v-model.number="settings.tts_max_repeat" type="number" min="2" max="20" class="inp num" />
        </div>
        <div class="set-row">
          <span class="set-lbl">Ovoz tili</span>
          <select v-model="settings.tts_lang" class="inp num">
            <option value="auto">Avto</option>
            <option value="ru">Ruscha</option>
            <option value="tr">Turkcha</option>
            <option value="en">Inglizcha</option>
          </select>
        </div>
        <p class="hint">Server ovozi (Google TTS). Limitdan ortiq takror harflar (ъъъъъъ) o'qishда qisqartiriladi. Linklar o'qilmaydi — overlayда platforma logosi ko'rinadi.</p>
      </div>

      <button class="btn-primary" :disabled="busy" @click="saveProfile">
        {{ busy ? '…' : 'Saqlash' }}
      </button>

      <label v-if="publicUrl" class="lbl">Public donat sahifangiz</label>
      <div v-if="publicUrl" class="overlay-box">
        <code>{{ publicUrl }}</code>
        <a class="btn-mini" :href="publicUrl" target="_blank" rel="noopener" title="Ochish"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        <button class="btn-mini" @click="copyPublic" title="Nusxa"><i class="fa-solid fa-copy"></i></button>
      </div>

      <label class="lbl">OBS overlay havolasi</label>
      <p class="hint">Bu havolani OBS'da "Browser Source" sifatida qo'shing. Donat kelganda ekranда alert chiqadi.</p>
      <div class="overlay-box">
        <code>{{ overlayUrl }}</code>
        <button class="btn-mini" @click="copyOverlay"><i class="fa-solid fa-copy"></i></button>
      </div>

      <button class="btn-ghost" :disabled="busy" @click="regenerate">
        <i class="fa-solid fa-rotate"></i> Havolani yangilash
      </button>
      <p class="warn">Yangilasangiz, eski havola ishlamay qoladi.</p>
    </template>
  </div>
</template>

<style scoped>
.streamer { display: flex; flex-direction: column; gap: 8px; }
.muted { color: var(--c-text-dim, #9fb2c8); text-align: center; padding: 20px; }
.intro { text-align: center; padding: 8px 0 16px; }
.intro .ic { width: 56px; height: 56px; margin: 0 auto 10px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; color: var(--c-accent, #00d4ff); background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.4); }
.intro h3 { font-weight: 900; font-size: 1.2rem; }
.intro p { color: var(--c-text-dim, #9fb2c8); font-size: var(--fs-sm, 0.85rem); margin-top: 4px; }
.lbl { font-size: var(--fs-sm, 0.85rem); font-weight: 700; color: var(--c-text-dim, #9fb2c8); margin-top: 8px; }
.hint { font-size: var(--fs-xs, 0.72rem); color: var(--c-text-dim); }
.warn { font-size: var(--fs-xs, 0.72rem); color: var(--c-warning, #f59e0b); }
.inp { width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: rgba(6, 13, 26, 0.6); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); color: var(--c-text, #eaf2ff); }
.row { display: flex; gap: 8px; }
.row .inp { flex: 1; min-width: 0; }
.links { display: flex; flex-direction: column; gap: 8px; }
.link-row { display: flex; align-items: center; gap: 10px; }
.link-ic { width: 28px; text-align: center; font-size: 18px; flex-shrink: 0; }
.link-row .inp { flex: 1; min-width: 0; }
.settings { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; background: rgba(6, 13, 26, 0.4); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); }
.set-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.set-lbl { font-size: var(--fs-sm, 0.85rem); color: var(--c-text, #eaf2ff); }
.inp.num { width: 120px; height: 40px; text-align: right; }
.toggle { display: flex; align-items: center; gap: 10px; font-size: var(--fs-sm, 0.85rem); cursor: pointer; }
.toggle input { width: 18px; height: 18px; accent-color: var(--c-accent, #00d4ff); }
.hidden { display: none; }
.tiers { display: flex; flex-direction: column; gap: 8px; }
.tier { display: flex; align-items: center; gap: 6px; }
.tier .num { width: 90px; flex-shrink: 0; }
.tier .inp:not(.num) { flex: 1; min-width: 0; }
.btn-mini.ok { color: var(--c-success, #22c55e); border-color: rgba(34,197,94,0.5); }
.btn-mini.danger { color: #ef4444; }
.btn-mini { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.btn-add { height: 40px; border-radius: 10px; background: rgba(0, 212, 255, 0.08); border: 1px dashed var(--glass-border, rgba(89,133,189,0.35)); color: var(--c-accent, #00d4ff); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; }
.badge-streamer { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; padding: 6px 12px; border-radius: 999px; background: rgba(34, 197, 94, 0.14); color: var(--c-success, #22c55e); font-weight: 700; font-size: var(--fs-sm); }
.overlay-box { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: rgba(6, 13, 26, 0.6); border: 1px solid var(--glass-border); }
.overlay-box code { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--fs-xs, 0.72rem); color: var(--c-accent, #00d4ff); }
.btn-primary { height: 48px; margin-top: 12px; border-radius: 12px; background: var(--c-accent, #00d4ff); color: var(--c-bg-base, #04101f); font-weight: 800; border: none; }
.btn-primary:disabled { opacity: 0.5; }
.btn-mini { height: 44px; padding: 0 16px; border-radius: 10px; background: rgba(89, 133, 189, 0.15); border: 1px solid var(--glass-border); color: var(--c-text); font-weight: 700; flex-shrink: 0; }
.btn-ghost { height: 44px; margin-top: 12px; border-radius: 10px; background: rgba(89, 133, 189, 0.12); border: 1px solid var(--glass-border); color: var(--c-text-dim); display: flex; align-items: center; justify-content: center; gap: 8px; }
</style>
