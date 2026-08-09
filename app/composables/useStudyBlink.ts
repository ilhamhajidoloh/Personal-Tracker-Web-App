import { ref, onMounted, onUnmounted } from 'vue'

export function useStudyBlink(defaultDurationMs = 5000) {
  const isBlinking = ref(true)
  const remainingSeconds = ref(Math.ceil(defaultDurationMs / 1000))
  let timer: ReturnType<typeof setTimeout> | null = null
  let intervalTimer: ReturnType<typeof setInterval> | null = null

  const stopBlink = () => {
    isBlinking.value = false
    remainingSeconds.value = 0
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = null
    }
  }

  const triggerBlink = (durationMs = defaultDurationMs) => {
    stopBlink()
    isBlinking.value = true
    remainingSeconds.value = Math.ceil(durationMs / 1000)

    intervalTimer = setInterval(() => {
      if (remainingSeconds.value > 1) {
        remainingSeconds.value -= 1
      }
    }, 1000)

    timer = setTimeout(() => {
      stopBlink()
    }, durationMs)
  }

  onMounted(() => {
    triggerBlink(defaultDurationMs)
  })

  onUnmounted(() => {
    stopBlink()
  })

  return {
    isBlinking,
    remainingSeconds,
    triggerBlink,
    stopBlink,
  }
}
