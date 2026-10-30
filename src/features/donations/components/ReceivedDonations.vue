<script setup>
// Menga kelgan donatlar (o'yinchi) — alert feed tarixi.
import { ref, onMounted } from 'vue'
import { donationsApi } from '../api/donations.api'
import { fmtSom } from '@/shared/utils/money'
import { formatDate } from '@/shared/utils/format'
import { linkify } from '@/shared/utils/linkify'
import { LINK_PLATFORM_ICON } from '@/features/streamer/api/streamer.api'

function linkIcon(platform) {
  return LINK_PLATFORM_ICON[platform] || LINK_PLATFORM_ICON.web
}

const loading = ref(false)
const items = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await donationsApi.received()
    items.value = Array.isArray(data) ? data : []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
defineExpose({ load })
</script>

<template>
  <div class="received">
    <div v-if="loading" class="muted">Yuklanmoqda…</div>
    <div v-else-if="!items.length" class="muted">
      <i class="fa-solid fa-gift"></i>
      <p>Hali donat kelmagan.</p>
    </div>
    <div v-else class="list">
      <div v-for="d in items" :key="d.id" class="card">
        <div class="coin"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="body">
          <div class="top-line">
            <div class="amt">
              +{{ fmtSom(d.net) }} <span class="ccy">so'm</span>
              <span v-if="d.cover_fee" class="covered-chip" title="Komissiya donator tomonidan qoplangan">
                100% to'liq
              </span>
            </div>
            <span v-if="d.created_at" class="time">{{ formatDate(d.created_at) }}</span>
          </div>
          <!-- Xabar: havolalar ajratib ko'rsatiladi va yangi oynada ochiladi.
               v-html emas — segmentlar oddiy matn, XSS xavfi yo'q. -->
          <div v-if="d.message" class="msg">
            <template v-for="(seg, si) in linkify(d.message)" :key="si">
              <a
                v-if="seg.t === 'link'"
                class="msg-link"
                :href="seg.href"
                target="_blank"
                rel="noopener noreferrer nofollow"
                :title="seg.href"
                :style="{ color: linkIcon(seg.platform).color }"
              ><i :class="linkIcon(seg.platform).icon"></i> {{ seg.v }}</a>
              <span v-else>{{ seg.v }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted { color: var(--c-text-dim, #9fb2c8); font-size: var(--fs-sm); text-align: center; padding: 30px 12px; }
.muted i { font-size: 28px; opacity: 0.5; }
.muted p { margin-top: 8px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-md, 14px); background: rgba(6, 13, 26, 0.45); border: 1px solid var(--glass-border, rgba(89,133,189,0.25)); }
.coin { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--c-warning, #f59e0b); background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); flex-shrink: 0; }
.body { flex: 1; min-width: 0; }
.top-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.amt { font-weight: 900; font-size: 1.12rem; color: #4ade80; display: inline-flex; align-items: center; gap: 6px; }
.ccy { font-size: 0.78rem; font-weight: 700; color: var(--c-text-dim); }
.covered-chip { font-size: 0.66rem; font-weight: 800; padding: 1px 7px; border-radius: 999px; background: rgba(0, 212, 255, 0.14); color: var(--c-accent, #00d4ff); }
.time { font-size: 0.72rem; color: var(--c-text-dim, #8fa8c8); }
.msg { font-size: var(--fs-sm); color: var(--c-text); margin-top: 3px; word-break: break-word; }
.msg-link {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 7px; margin: 0 2px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 700;
  text-decoration: none;
  vertical-align: middle;
  word-break: break-all;
}
.msg-link:hover { background: rgba(255, 255, 255, 0.16); text-decoration: underline; }
</style>
