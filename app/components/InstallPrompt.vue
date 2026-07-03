<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref<Event | null>(null)
const isPromptVisible = ref(false)

const handleBeforeInstallPrompt = (e: Event) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  // Stash the event so it can be triggered later.
  deferredPrompt.value = e
  // Update UI to notify the user they can install the PWA
  isPromptVisible.value = true
}

const installPWA = async () => {
  if (!deferredPrompt.value) return

  const promptEvent = deferredPrompt.value as any
  // Show the install prompt
  promptEvent.prompt()
  
  // Wait for the user to respond to the prompt
  const { outcome } = await promptEvent.userChoice
  
  // We no longer need the prompt. Clear it up
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
    enter-active-class="transition ease-out duration-500"
    enter-from-class="opacity-0 translate-y-10 sm:translate-y-5"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-300"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-10"
  >
    <div v-if="isPromptVisible" class="fixed bottom-[5.25rem] sm:bottom-8 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[60]">
      <div class="w-full sm:w-[420px] rounded-[1.75rem] p-6 relative overflow-hidden group" style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);">

        <!-- Subtle brand glow -->
        <div class="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none" style="background: var(--brand-soft-hover);"></div>

        <div class="flex items-start gap-4 w-full relative">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg glow-violet" style="background: linear-gradient(135deg, var(--brand), var(--brand-2));">
            <div class="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"></div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div class="flex-1 pt-0.5">
            <h3 class="font-extrabold text-lg tracking-tight" style="color: var(--text-primary);">ติดตั้งแอป MyLife</h3>
            <p class="text-sm mt-1.5 leading-relaxed" style="color: var(--text-secondary);">เพิ่มไปยังหน้าจอหลักเพื่อการเข้าถึงที่รวดเร็วและประสบการณ์ใช้งานที่ดียิ่งขึ้น</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3 w-full relative">
          <button @click="dismissPrompt" class="btn-secondary text-sm">
            ไว้ทีหลัง
          </button>
          <button @click="installPWA" class="btn-primary text-sm px-6">
            ติดตั้ง
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
