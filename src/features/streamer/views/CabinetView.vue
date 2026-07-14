<script setup>
// Streamer kabineti — profil, platforma linklari, overlay sozlamalari,
// OBS havolasi. Butun mantiq StreamerPanel'da.
import StreamerPanel from '../components/StreamerPanel.vue'
</script>

<template>
  <div class="cabinet">
    <header class="cab-head">
      <h1><i class="fa-solid fa-tower-broadcast"></i> Streamer kabineti</h1>
      <p class="sub">Donat sahifangiz, overlay va sozlamalar — hammasi shu yerda.</p>
    </header>
    <StreamerPanel />
  </div>
</template>

<style scoped>
.cabinet {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px 0 60px;
}
.cab-head { margin-bottom: 16px; }
.cab-head h1 {
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cab-head h1 i { color: var(--c-accent); }
.sub { color: var(--c-text-dim); font-size: 0.85rem; margin-top: 4px; }
</style>
