<template>
  <div class="min-h-[100dvh] flex items-center justify-center p-4 bg-mesh" style="background-color: var(--bg-base);">
    <div class="rounded-[1.75rem] p-10 flex flex-col items-center gap-5 max-w-sm w-full animate-slide-up" style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl glow-violet relative overflow-hidden" style="background: linear-gradient(135deg, var(--brand), var(--brand-2));">
        <span class="text-white font-extrabold text-2xl relative z-10">M</span>
        <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-white/25"></div>
      </div>
      <span class="inline-block w-10 h-10 border-[3px] rounded-full animate-spin" style="border-color: var(--brand); border-top-color: transparent;"></span>
      <div class="text-center space-y-1.5">
        <p class="text-lg font-bold" style="color: var(--text-primary);">กำลังยืนยันการเข้าสู่ระบบ...</p>
        <p class="text-sm" style="color: var(--text-muted);">กรุณารอสักครู่</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

useHead({
  title: 'กำลังเข้าสู่ระบบ',
})

const router = useRouter()
const supabase = useSupabaseClient()

onMounted(async () => {
  try {
    // รอให้ session จัดเตรียมพร้อม
    const { data } = await supabase.auth.getSession()
    
    if (data.session) {
      // บันทึก token ไปยัง localStorage
      if (data.session.access_token) {
        localStorage.setItem('auth_token', data.session.access_token)
        localStorage.setItem('auth_session', JSON.stringify(data.session))
      }
      
      // ไปที่ dashboard ใช้ router.push
      await router.push('/dashboard')
    } else {
      // ถ้าไม่มี session กลับไปที่ login
      await router.push('/login')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    await router.push('/login')
  }
})
</script>
