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
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-8 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-6 scale-95"
  >
    <div
      v-if="isPromptVisible"
      class="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[70] pointer-events-none"
    >
      <div
        class="pointer-events-auto p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl backdrop-blur-2xl transition-all duration-200"
        style="
          background: color-mix(in srgb, var(--bg-card) 92%, transparent);
          border-color: var(--border-default);
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px var(--border-subtle);
        "
      >
        <div class="flex items-start gap-3.5">
          <!-- App Logo Icon -->
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md relative overflow-hidden"
            style="
              background: linear-gradient(135deg, var(--brand), var(--brand-2));
              color: var(--brand-on);
            "
          >
            <span class="text-xl font-extrabold tracking-tight select-none">M</span>
            <div class="absolute inset-0 bg-white/10 opacity-50 pointer-events-none"></div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-[15px] sm:text-base tracking-tight" style="color: var(--text-primary);">
                ติดตั้งแอป MyLife
              </h3>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                style="background: var(--brand-soft); color: var(--brand-ink);"
              >
                PWA
              </span>
            </div>
            <p class="text-xs sm:text-sm mt-1 leading-relaxed" style="color: var(--text-secondary);">
              เพิ่มไปยังหน้าจอหลักเพื่อการเข้าถึงที่รวดเร็ว ลื่นไหล พร้อมใช้งานได้ทุกที่
            </p>
          </div>

          <!-- Close button -->
          <button
            type="button"
            @click="dismissPrompt"
            class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style="color: var(--text-muted); background: var(--bg-elevated);"
            aria-label="ปิดการแจ้งเตือน"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 pt-3.5 border-t flex items-center justify-end gap-2.5" style="border-color: var(--border-subtle);">
          <button
            type="button"
            @click="dismissPrompt"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
            style="color: var(--text-secondary); background: transparent;"
          >
            ไว้ทีหลัง
          </button>
          <button
            type="button"
            @click="installPWA"
            class="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            style="
              background: var(--brand);
              color: var(--brand-on);
              box-shadow: 0 4px 14px -3px var(--brand);
            "
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>ติดตั้งแอป</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
