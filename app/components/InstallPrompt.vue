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
  <div v-if="isPromptVisible" class="fixed bottom-0 left-0 right-0 p-4 z-50 animate-bounce">
    <div class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-gray-900 dark:text-white">Install App</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Add to home screen for a better experience</p>
        </div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button @click="dismissPrompt" class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          Not now
        </button>
        <button @click="installPWA" class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md">
          Install
        </button>
      </div>
    </div>
  </div>
</template>
