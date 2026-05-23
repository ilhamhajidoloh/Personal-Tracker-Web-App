<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center text-white">
    <div class="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 max-w-sm w-full">
      <span class="inline-block w-10 h-10 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
      <div class="text-center space-y-1">
        <p class="text-lg font-semibold text-white">
          กำลังยืนยันการเข้าสู่ระบบ...
        </p>
        <p class="text-sm text-gray-400">
          กรุณารอสักครู่
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

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
