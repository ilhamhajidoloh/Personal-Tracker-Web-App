<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref<Event | null>(null)
const isPromptVisible = ref(false)

const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  deferredPrompt.value = e
  isPromptVisible.value = true
}

const installPWA = async () => {
  if (!deferredPrompt.value) return

  const promptEvent = deferredPrompt.value as any
  promptEvent.prompt()

  await promptEvent.userChoice

  deferredPrompt.value = null
  isPromptVisible.value = false
}

const dismissPrompt = () => {
  isPromptVisible.value = false
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-6"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-6"
  >
    <div
      v-if="isPromptVisible"
      class="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[60]"
    >
      <div
        class="install-card w-full md:w-[400px] rounded-2xl p-4 sm:p-5"
        style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);"
      >
        <div class="flex items-start gap-3.5">
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style="background: var(--brand-soft); color: var(--brand-ink);"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            <h3 class="font-semibold text-[15px] tracking-tight" style="color: var(--text-primary);">ติดตั้งแอป MyLife</h3>
            <p class="text-sm mt-1 leading-relaxed" style="color: var(--text-secondary);">เพิ่มไปยังหน้าจอหลัก เพื่อเปิดใช้งานได้เร็วขึ้น</p>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button type="button" @click="dismissPrompt" class="btn-secondary text-sm">
            ไว้ทีหลัง
          </button>
          <button type="button" @click="installPWA" class="btn-primary text-sm px-5">
            ติดตั้ง
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
