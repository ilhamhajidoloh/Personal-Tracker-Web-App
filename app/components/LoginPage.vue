<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-48 -right-48 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-500/4 rounded-full blur-3xl"></div>
    </div>

    <!-- Loading / Redirecting -->
    <div
      v-if="isCheckingSession || isRedirecting"
      class="relative bg-gray-900/90 backdrop-blur-md border border-gray-800/80 p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full"
    >
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-violet-500/25">✦</div>
      <span class="inline-block w-10 h-10 border-4 border-violet-400/20 border-t-violet-400 rounded-full animate-spin"></span>
      <div class="text-center space-y-1">
        <p class="text-lg font-semibold text-white">
          {{ isRedirecting ? 'กำลังพาไปที่ Dashboard...' : 'กำลังตรวจสอบเซสชัน...' }}
        </p>
        <p class="text-sm text-gray-500">กรุณารอสักครู่</p>
      </div>
    </div>

    <!-- Login Card -->
    <div v-else class="relative bg-gray-900/90 backdrop-blur-md border border-gray-800/70 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
      <!-- Card header -->
      <div class="px-8 pt-8 pb-6 text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-violet-500/30 mx-auto mb-5">✦</div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Welcome to MyLife</h1>
        <p class="text-sm text-gray-500 mt-1.5">จัดการชีวิตของคุณให้ดีขึ้น</p>
      </div>

      <div class="px-8 pb-8 space-y-5">
        <!-- Messages -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3.5 text-sm text-rose-400"
        >
          <span class="shrink-0 mt-0.5">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
        <div
          v-if="successMessage"
          class="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3.5 text-sm text-emerald-400"
        >
          <span class="shrink-0 mt-0.5">✓</span>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Tab switcher -->
        <div class="flex bg-gray-800/70 rounded-xl p-1 gap-1">
          <button
            @click="isSignUp = false"
            :class="[
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
              !isSignUp
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200'
            ]"
          >
            ลงชื่อเข้าใช้
          </button>
          <button
            @click="isSignUp = true"
            :class="[
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
              isSignUp
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200'
            ]"
          >
            สมัครสมาชิก
          </button>
        </div>

        <!-- Sign In Form -->
        <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">อีเมล</label>
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              class="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">รหัสผ่าน</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-600/50 disabled:to-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้' }}
          </button>
        </form>

        <!-- Sign Up Form -->
        <form v-else @submit.prevent="handleSignUp" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">อีเมล</label>
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              class="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">รหัสผ่าน</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              minlength="6"
              class="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <p class="text-[11px] text-gray-600 mt-1.5">อย่างน้อย 6 ตัวอักษร</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">ยืนยันรหัสผ่าน</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minlength="6"
              class="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading || password !== confirmPassword"
            class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-600/50 disabled:to-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            {{ isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-gray-800"></div>
          <span class="text-xs text-gray-600">หรือ</span>
          <div class="flex-1 h-px bg-gray-800"></div>
        </div>

        <!-- Google Sign In -->
        <button
          @click="handleGoogleSignIn"
          :disabled="isLoading"
          class="w-full bg-gray-800/80 hover:bg-gray-800 disabled:bg-gray-800/50 disabled:cursor-not-allowed border border-gray-700/80 hover:border-gray-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          ลงชื่อเข้าใช้ผ่าน Google
        </button>

        <p class="text-xs text-center text-gray-600 leading-relaxed">
          เมื่อลงชื่อเข้าใช้สำเร็จ ระบบจะพาไปที่ Dashboard อัตโนมัติ
        </p>
      </div>
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
  if (configuredAppUrl) return configuredAppUrl
  if (import.meta.client) return window.location.origin
  return ''
}

const redirectToDashboard = async () => {
  if (import.meta.server || isRedirecting.value) return
  isRedirecting.value = true
  await router.push('/dashboard')
}

const finishSessionCheck = () => {
  if (!isRedirecting.value) isCheckingSession.value = false
}

let stopAuthListener: (() => void) | undefined

if (import.meta.client) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      if (event === 'SIGNED_OUT') {
        isRedirecting.value = false
        finishSessionCheck()
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_session')
      }
      return
    }
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session.access_token) {
        localStorage.setItem('auth_token', session.access_token)
        localStorage.setItem('auth_session', JSON.stringify(session))
      }
      await redirectToDashboard()
    }
  })
  stopAuthListener = () => { data.subscription.unsubscribe() }
}

const showMessage = (message: string, type: 'error' | 'success') => {
  const { toastSuccess, toastError } = useAlert()
  if (type === 'error') {
    errorMessage.value = message
    successMessage.value = ''
    toastError(message)
  } else {
    successMessage.value = message
    errorMessage.value = ''
    toastSuccess(message)
  }
  setTimeout(() => {
    errorMessage.value = ''
    successMessage.value = ''
  }, 5000)
}

const getSignUpErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return 'สมัครสมาชิกไม่สำเร็จ'
  const authError = error as { code?: string; message?: string; status?: number }
  if (authError.code === 'over_email_send_rate_limit' || authError.status === 429) {
    return 'ส่งอีเมลยืนยันบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
  }
  return authError.message || 'สมัครสมาชิกไม่สำเร็จ'
}

const hasOAuthCallbackParams = () => {
  return Boolean(route.query.code || route.query.access_token || route.hash.includes('access_token'))
}

const waitForSession = async (attempts = 8) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await supabase.auth.getSession()
    if (data.session) return true
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

onBeforeUnmount(() => { stopAuthListener?.() })

onMounted(async () => {
  const isOAuthCallback = hasOAuthCallbackParams()
  if (typeof route.query.error_description === 'string') {
    showMessage(decodeURIComponent(route.query.error_description), 'error')
    finishSessionCheck()
    return
  }
  if (isOAuthCallback) showMessage('กำลังยืนยันการเข้าสู่ระบบด้วย Google...', 'success')
  const { data } = await supabase.auth.getSession()
  if (data.session) { redirectToDashboard(); return }
  if (isOAuthCallback && await waitForSession()) { redirectToDashboard(); return }
  finishSessionCheck()
})

const handleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) throw error
    if (!data.session) throw new Error('ไม่พบเซสชันหลังจากเข้าสู่ระบบ')
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
    const { data, error } = await supabase.auth.signUp({ email: email.value, password: password.value })
    if (error) throw error
    if (data.session) {
      if (data.session.access_token) {
        localStorage.setItem('auth_token', data.session.access_token)
        localStorage.setItem('auth_session', JSON.stringify(data.session))
      }
      showMessage('สมัครสมาชิกสำเร็จ กำลังพาไปที่ Dashboard...', 'success')
      await redirectToDashboard()
      return
    }
    showMessage('สมัครสมาชิกสำเร็จ แต่โปรเจ็กต์ยังเปิดการยืนยันอีเมลอยู่', 'success')
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (error: any) {
    console.error('Sign up error:', error)
    showMessage(getSignUpErrorMessage(error), 'error')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const appOrigin = getAppOrigin()
    if (!appOrigin) throw new Error('ไม่พบ app URL สำหรับ redirect หลัง Google login')
    const redirectUrl = `${appOrigin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    })
    if (error) throw error
  } catch (error: any) {
    console.error('Google sign in error:', error)
    showMessage(error.message || 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ', 'error')
    isLoading.value = false
  }
}
</script>
