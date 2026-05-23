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
    <div class="flex-1 overflow-y-auto px-6 py-8">
      <div class="mx-auto max-w-5xl rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h1 class="text-2xl font-bold text-white">Supabase Test</h1>
        <p class="mt-2 text-sm text-gray-400">หน้านี้ใช้ layout เดียวกับ dashboard เพื่อให้แท็บคงอยู่ตลอด</p>
        <div class="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300">
          Supabase Connected 🚀
        </div>
      </div>
    </div>
  </AppTabsLayout>
</template>