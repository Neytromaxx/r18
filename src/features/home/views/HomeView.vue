<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/auth.store'

const router = useRouter()
const auth = useAuthStore()

function startStreamer() {
  if (auth.isAuthenticated) router.push('/cabinet')
  else router.push({ name: 'login', query: { redirect: '/cabinet' } })
}
function goHub() {
  if (auth.isAuthenticated) router.push('/hub')
  else router.push({ name: 'login', query: { redirect: '/hub' } })
}
</script>

<template>
  <div class="landing">
    <section class="hero glass anim-rise">
      <div class="hero-logo"><i class="fa-solid fa-bolt"></i></div>
      <h1>Epsilon <b>Donation</b></h1>
      <p class="tagline">
        Streamerlar uchun donat platformasi — tomoshabinlaringizdan donat qabul
        qiling, OBS overlay'da jonli alert, ovoz va TTS bilan ko'rsating.
      </p>
      <div class="cta-row">
        <button class="btn-primary press" @click="startStreamer">
          <i class="fa-solid fa-tower-broadcast"></i> Streamer bo'lish
        </button>
        <button class="btn-ghost press" @click="goHub">
          <i class="fa-solid fa-hand-holding-heart"></i> Donat yuborish
        </button>
      </div>
      <p class="note">Ro'yxatdan o'tish — faqat email va tasdiqlash kodi. Parol kerak emas.</p>
    </section>

    <section class="steps">
      <div class="step glass anim-rise">
        <span class="num">1</span>
        <h3>Kiring</h3>
        <p>Email kiritasiz, kodni tasdiqlaysiz — akkaunt tayyor.</p>
      </div>
      <div class="step glass anim-rise">
        <span class="num">2</span>
        <h3>Sozlang</h3>
        <p>Kabinetda nom, platforma linklari va overlay'ni sozlaysiz, OBS havolasini olasiz.</p>
      </div>
      <div class="step glass anim-rise">
        <span class="num">3</span>
        <h3>Donat oling</h3>
        <p>Tomoshabinlar sahifangizdan donat yuboradi — alert jonli efirda chiqadi.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 0 60px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero {
  text-align: center;
  padding: 48px 28px;
}
.hero-logo {
  width: 76px;
  height: 76px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  font-size: 2.2rem;
  color: var(--c-accent);
}
.hero h1 { font-size: 2rem; font-weight: 800; }
.hero h1 b { color: var(--c-accent); }
.tagline {
  color: var(--c-text-dim);
  max-width: 520px;
  margin: 12px auto 24px;
  line-height: 1.6;
}
.cta-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-primary,
.btn-ghost {
  height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary {
  background: var(--c-accent);
  color: var(--c-bg-base);
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.35);
}
.btn-ghost {
  border: 1px solid var(--glass-border);
  color: var(--c-text);
  background: transparent;
}
.btn-ghost:hover { border-color: var(--c-accent); color: var(--c-accent); }
.note { margin-top: 18px; font-size: 0.8rem; color: var(--c-text-dim); }

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.step { padding: 22px 18px; position: relative; }
.num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--c-accent);
  color: var(--c-bg-base);
  font-weight: 800;
  margin-bottom: 10px;
}
.step h3 { font-weight: 700; margin-bottom: 6px; }
.step p { color: var(--c-text-dim); font-size: 0.88rem; line-height: 1.5; }
</style>
