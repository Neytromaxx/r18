import { ref, computed, onUnmounted } from 'vue'

export function useResendTimer(initialSeconds = 60) {
  const seconds = ref(0)
  let interval = null

  const canResend = computed(() => seconds.value === 0)

  function start(s = initialSeconds) {
    seconds.value = s
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0) {
        clearInterval(interval)
        interval = null
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return { seconds, canResend, start }
}