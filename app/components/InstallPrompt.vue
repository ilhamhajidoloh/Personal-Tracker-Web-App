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
    <div v-if="isPromptVisible" class="fixed bottom-4 sm:bottom-8 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50">
      <div class="w-full sm:w-[420px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] border border-white/10 p-6 relative overflow-hidden group">
        
        <!-- Subtle background glow -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl group-hover:bg-violet-500/30 transition-colors duration-700 pointer-events-none"></div>

        <div class="flex items-start gap-4 w-full">
          <div class="w-14 h-14 bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-inner relative overflow-hidden">
            <!-- Inner shine -->
            <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div class="flex-1 pt-0.5">
            <h3 class="font-semibold text-slate-100 text-lg tracking-wide">ติดตั้งแอป MyLife</h3>
            <p class="text-sm text-slate-400 mt-1.5 leading-relaxed">เพิ่มไปยังหน้าจอหลักเพื่อการเข้าถึงที่รวดเร็วและประสบการณ์ใช้งานที่ดียิ่งขึ้น</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3 w-full">
          <button @click="dismissPrompt" class="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-xl transition-all duration-200">
            ไว้ทีหลัง
          </button>
          <button @click="installPWA" class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.96] rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]">
            ติดตั้ง
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
