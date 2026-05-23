<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
    <div
      v-if="isCheckingSession || isRedirecting"
      class="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 max-w-sm w-full"
    >
      <span class="inline-block w-10 h-10 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
      <div class="text-center space-y-1">
        <p class="text-lg font-semibold text-white">
          {{ isRedirecting ? 'กำลังพาไปที่ Dashboard...' : 'กำลังตรวจสอบเซสชัน...' }}
        </p>
        <p class="text-sm text-gray-400">
          กรุณารอสักครู่
        </p>
      </div>
    </div>

    <div v-else class="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 max-w-sm w-full">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/20">
        ✦
      </div>

      <div class="text-center space-y-1.5">
        <h1 class="text-2xl font-bold">Welcome to MyLife</h1>
        <p class="text-sm text-gray-400">จัดการชีวิตของคุณให้ดีขึ้น</p>
      </div>

      <div v-if="errorMessage" class="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="w-full bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400">
        {{ successMessage }}
      </div>

      <div class="w-full flex gap-2">
        <button
          @click="isSignUp = false"
          :class="[
            'flex-1 py-2 px-4 rounded-lg font-semibold transition-colors',
            isSignUp
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          ]"
        >
          ลงชื่อเข้าใช้
        </button>
        <button
          @click="isSignUp = true"
          :class="[
            'flex-1 py-2 px-4 rounded-lg font-semibold transition-colors',
            isSignUp
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          ]"
        >
          สมัครสมาชิก
        </button>
      </div>

      <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="w-full space-y-4">
        <div>
          <label class="block text-sm text-gray-300 mb-2">อีเมล</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2">รหัสผ่าน</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้' }}
        </button>
      </form>

      <form v-else @submit.prevent="handleSignUp" class="w-full space-y-4">
        <div>
          <label class="block text-sm text-gray-300 mb-2">อีเมล</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2">รหัสผ่าน</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <p class="text-xs text-gray-400 mt-1">อย่างน้อย 6 ตัวอักษร</p>
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2">ยืนยันรหัสผ่าน</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading || password !== confirmPassword"
          class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <div class="w-full flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-700"></div>
        <span class="text-xs text-gray-500">หรือ</span>
        <div class="flex-1 h-px bg-gray-700"></div>
      </div>

      <button
        @click="handleGoogleSignIn"
        :disabled="isLoading"
        class="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed border border-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span class="text-lg">🔐</span>
        ลงชื่อเข้าใช้ผ่าน Google
      </button>

      <p class="text-xs text-center text-gray-500 leading-relaxed">
        เมื่อลงชื่อเข้าใช้สำเร็จ ระบบจะพาไปที่ Dashboard อัตโนมัติ
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const supabase = useSupabaseClient()

const isSignUp = ref(false)
const isLoading = ref(false)
const isCheckingSession = ref(true)
const isRedirecting = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const getAppOrigin = () => {
  const configuredAppUrl = config.public.appUrl?.trim().replace(/\/$/, '')

  if (configuredAppUrl) {
    return configuredAppUrl
  }

  if (import.meta.client) {
    return window.location.origin
  }

  return ''
}

const redirectToDashboard = async () => {
  if (import.meta.server || isRedirecting.value) {
    return
  }

  isRedirecting.value = true
  await router.push('/dashboard')
}

const finishSessionCheck = () => {
  if (!isRedirecting.value) {
    isCheckingSession.value = false
  }
}

let stopAuthListener: (() => void) | undefined

if (import.meta.client) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      if (event === 'SIGNED_OUT') {
        isRedirecting.value = false
        finishSessionCheck()
        // ล้าง token จาก localStorage เมื่อ sign out
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_session')
      }
      return
    }

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // บันทึก token ไปยัง localStorage
      if (session.access_token) {
        localStorage.setItem('auth_token', session.access_token)
        localStorage.setItem('auth_session', JSON.stringify(session))
      }
      await redirectToDashboard()
    }
  })

  stopAuthListener = () => {
    data.subscription.unsubscribe()
  }
}

const showMessage = (message: string, type: 'error' | 'success') => {
  if (type === 'error') {
    errorMessage.value = message
    successMessage.value = ''
  } else {
    successMessage.value = message
    errorMessage.value = ''
  }

  setTimeout(() => {
    errorMessage.value = ''
    successMessage.value = ''
  }, 5000)
}

const hasOAuthCallbackParams = () => {
  return Boolean(route.query.code || route.query.access_token || route.hash.includes('access_token'))
}

const waitForSession = async (attempts = 8) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  return false
}

onBeforeUnmount(() => {
  stopAuthListener?.()
})

onMounted(async () => {
  const isOAuthCallback = hasOAuthCallbackParams()

  if (typeof route.query.error_description === 'string') {
    showMessage(decodeURIComponent(route.query.error_description), 'error')
    finishSessionCheck()
    return
  }

  if (isOAuthCallback) {
    showMessage('กำลังยืนยันการเข้าสู่ระบบด้วย Google...', 'success')
  }

  const { data } = await supabase.auth.getSession()

  if (data.session) {
    redirectToDashboard()
    return
  }

  if (isOAuthCallback && await waitForSession()) {
    redirectToDashboard()
    return
  }

  finishSessionCheck()
})

const handleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      throw error
    }

    if (!data.session) {
      throw new Error('ไม่พบเซสชันหลังจากเข้าสู่ระบบ')
    }

    // บันทึก token ไปยัง localStorage
    if (data.session.access_token) {
      localStorage.setItem('auth_token', data.session.access_token)
      localStorage.setItem('auth_session', JSON.stringify(data.session))
    }

    await redirectToDashboard()
  } catch (error: any) {
    console.error('Sign in error:', error)
    showMessage(error.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSignUp = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    if (password.value !== confirmPassword.value) {
      showMessage('รหัสผ่านไม่ตรงกัน', 'error')
      isLoading.value = false
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) {
      throw error
    }

    showMessage('สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลของคุณก่อน', 'success')
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (error: any) {
    console.error('Sign up error:', error)
    showMessage(error.message || 'สมัครสมาชิกไม่สำเร็จ', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const appOrigin = getAppOrigin()

    if (!appOrigin) {
      throw new Error('ไม่พบ app URL สำหรับ redirect หลัง Google login')
    }

    const redirectUrl = `${appOrigin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      throw error
    }
  } catch (error: any) {
    console.error('Google sign in error:', error)
    showMessage(error.message || 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ', 'error')
    isLoading.value = false
  }
}
</script>