<script setup lang="ts">
useHead({
  title: 'Supabase Test',
})

definePageMeta({
  middleware: 'auth',
})

const supabase = useSupabaseClient()
</script>

<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto px-5 md:px-8 py-8">
      <div class="mx-auto max-w-5xl section-card p-6 animate-slide-up">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style="background: var(--brand-soft);">⚡</div>
          <div>
            <h1 class="text-2xl font-extrabold" style="color: var(--text-primary);">Supabase Test</h1>
            <p class="mt-0.5 text-sm" style="color: var(--text-muted);">หน้านี้ใช้ layout เดียวกับ dashboard เพื่อให้แท็บคงอยู่ตลอด</p>
          </div>
        </div>
        <div class="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 text-emerald-500 font-semibold flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Supabase Connected 🚀
        </div>
      </div>
    </div>
  </AppTabsLayout>
</template>