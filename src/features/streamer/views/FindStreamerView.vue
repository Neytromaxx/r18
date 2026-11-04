<script setup>
// Streamer qidiruvi — bosh sahifadagi "Donat yuborish" shu yerga olib keladi.
// Tomoshabin roʻyxatdan oʻtmasdan streamer sahifasini topadi va toʻlaydi
// (ilgari bu tugma login → hub ga olib borardi va tomoshabin shu yerda
// yoʻqolardi).
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { streamerApi } from '../api/streamer.api'

const router = useRouter()
const q = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)
let timer = null
let seq = 0

async function search() {
  const term = q.value.trim()
  if (term.length < 2) {
    results.value = []
    searched.value = false
    return
  }
  const my = ++seq
  loading.value = true
  try {
    const { data } = await streamerApi.search(term)
    if (my === seq) results.value = Array.isArray(data) ? data : []
  } catch {
    if (my === seq) results.value = []
  } finally {
    if (my === seq) {
      loading.value = false
      searched.value = true
    }
  }
}

watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(search, 300)
})

function open(s) {
  router.push(`/s/${s.public_id}`)
}
</script>

<template>
  <div class="find">
    <h1>Streamerni toping</h1>
    <p class="sub">Nik yoki nomini yozing — roʻyxatdan oʻtmasdan karta orqali donat yuborasiz.</p>

    <div class="search-box">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input
        v-model="q"
        type="search"
        inputmode="search"
        autocomplete="off"
        maxlength="40"
        placeholder="Masalan: aziz_live"
        aria-label="Streamer nomi yoki niki"
        data-test="find-input"
        autofocus
      />
    </div>

    <div v-if="loading" class="muted">Qidirilmoqda…</div>
    <div v-else-if="searched && !results.length" class="muted" data-test="find-empty">
      Hech kim topilmadi. Nikni tekshirib koʻring.
    </div>
    <ul v-else class="list">
      <li v-for="s in results" :key="s.public_id">
        <button type="button" class="row" data-test="find-result" @click="open(s)">
          <span class="ava">{{ (s.display_name || '?').trim().charAt(0).toUpperCase() }}</span>
          <span class="names">
            <b>{{ s.display_name }}</b>
            <small v-if="s.nickname">@{{ s.nickname }}</small>
          </span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.find { max-width: 560px; margin: 0 auto; padding: 24px 16px 110px; display: flex; flex-direction: column; gap: 12px; }
h1 { font-size: 1.5rem; font-weight: 900; }
.sub { color: var(--c-text-dim, #9fb2c8); font-size: 0.9rem; }
.search-box { display: flex; align-items: center; gap: 10px; padding: 0 14px; height: 50px; border-radius: 14px; background: rgba(6, 13, 26, 0.6); border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25)); }
.search-box:focus-within { border-color: var(--c-accent, #00d4ff); }
.search-box i { color: var(--c-text-dim, #9fb2c8); }
.search-box input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--c-text, #f0f8ff); font-size: 1rem; }
.muted { color: var(--c-text-dim, #9fb2c8); text-align: center; padding: 20px 0; font-size: 0.9rem; }
.list { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; margin: 0; }
.row { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 14px; background: rgba(6, 13, 26, 0.45); border: 1px solid var(--glass-border, rgba(89, 133, 189, 0.25)); color: var(--c-text, #f0f8ff); text-align: left; cursor: pointer; }
.row:hover { border-color: rgba(0, 212, 255, 0.5); }
.ava { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-weight: 900; background: rgba(0, 212, 255, 0.14); color: var(--c-accent, #00d4ff); flex-shrink: 0; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.names b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names small { color: var(--c-text-dim, #9fb2c8); }
.row > i { color: var(--c-text-dim, #9fb2c8); }
</style>
