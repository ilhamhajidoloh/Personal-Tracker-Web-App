<template>
  <div class="min-h-[100dvh] relative overflow-hidden bg-mesh lg:grid lg:grid-cols-2" style="background-color: var(--bg-base);">
    <!-- Animated Background blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[150px] opacity-60" style="background: radial-gradient(circle, rgba(59,78,240,0.16), transparent 70%); animation: float 16s ease-in-out infinite;"></div>
      <div class="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full blur-[130px] opacity-50" style="background: radial-gradient(circle, rgba(111,91,255,0.13), transparent 70%); animation: float 22s ease-in-out infinite reverse;"></div>
      <div class="absolute top-1/4 left-1/3 w-[420px] h-[420px] rounded-full blur-[150px] opacity-40" style="background: radial-gradient(circle, rgba(13,139,164,0.10), transparent 65%);"></div>
    </div>

    <!-- Brand panel (desktop) -->
    <div class="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden" style="background: linear-gradient(150deg, var(--brand), var(--brand-2));">
      <div class="absolute inset-0 opacity-30" style="background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 40%);"></div>
      <div class="relative flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
          <span class="text-white font-extrabold text-2xl">M</span>
        </div>
        <p class="text-white font-extrabold text-xl tracking-tight">MyLife</p>
      </div>
      <div class="relative text-white">
        <h2 class="text-4xl font-extrabold leading-tight tracking-tight">จัดการทุกด้าน<br>ของชีวิตในที่เดียว</h2>
        <p class="mt-4 text-white/85 text-base leading-relaxed max-w-sm">การเงิน ตารางเรียน งานที่ต้องทำ และกิจกรรมสำคัญ — สดใส เป็นระเบียบ และพร้อมเตือนคุณผ่าน LINE</p>
        <div class="mt-8 flex flex-wrap gap-2.5">
          <span v-for="f in features" :key="f" class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur">{{ f }}</span>
        </div>
      </div>
      <p class="relative text-white/70 text-xs">© {{ new Date().getFullYear() }} MyLife · Personal Tracker</p>
    </div>

    <!-- Right side: forms -->
    <div class="relative flex items-center justify-center p-4 sm:p-8 min-h-[100dvh] lg:min-h-0">
    <!-- Loading / Redirecting -->
    <div
      v-if="isCheckingSession || isRedirecting"
      class="relative rounded-[1.75rem] p-10 flex flex-col items-center gap-5 max-w-sm w-full animate-fade-in"
      style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);"
    >
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl glow-violet relative overflow-hidden">
        <span class="text-white font-extrabold text-2xl relative z-10">M</span>
        <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-white/25"></div>
      </div>
      <span class="inline-block w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin" style="border-color: var(--brand); border-top-color: transparent;"></span>
      <div class="text-center space-y-1.5">
        <p class="text-lg font-bold" style="color: var(--text-primary);">
          {{ isRedirecting ? 'กำลังพาไปที่ Dashboard...' : 'กำลังตรวจสอบเซสชัน...' }}
        </p>
        <p class="text-sm" style="color: var(--text-muted);">กรุณารอสักครู่</p>
      </div>
    </div>

    <!-- Login Card -->
    <div v-else class="relative rounded-[1.75rem] max-w-[420px] w-full overflow-hidden animate-slide-up" style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
      <!-- Decorative top gradient line -->
      <div class="h-1.5 w-full" style="background: linear-gradient(90deg, var(--brand), var(--brand-2), var(--brand));"></div>

      <!-- Card header -->
      <div class="px-8 pt-8 pb-5 text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl glow-violet mx-auto mb-5 relative overflow-hidden lg:hidden">
          <span class="text-white font-extrabold text-2xl relative z-10">M</span>
          <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-white/25"></div>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight" style="color: var(--text-primary);">ยินดีต้อนรับ 👋</h1>
        <p class="text-sm mt-1.5" style="color: var(--text-muted);">เข้าสู่ระบบเพื่อจัดการชีวิตของคุณ</p>
      </div>

      <div class="px-8 pb-8 space-y-5">
        <!-- Messages -->
        <Transition name="slide-down">
          <div
            v-if="errorMessage"
            class="flex items-start gap-2.5 rounded-xl p-3.5 text-sm text-rose-400"
            style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.15);"
          >
            <span class="shrink-0 mt-0.5">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>
        <Transition name="slide-down">
          <div
            v-if="successMessage"
            class="flex items-start gap-2.5 rounded-xl p-3.5 text-sm text-emerald-400"
            style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);"
          >
            <span class="shrink-0 mt-0.5">✓</span>
            <span>{{ successMessage }}</span>
          </div>
        </Transition>

        <!-- Tab switcher -->
        <div class="flex rounded-2xl p-1 gap-1" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
          <button
            @click="isSignUp = false"
            class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 tap-scale touch-target"
            :style="!isSignUp ? 'background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; box-shadow: var(--brand-glow);' : 'color: var(--text-muted);'"
          >
            ลงชื่อเข้าใช้
          </button>
          <button
            @click="isSignUp = true"
            class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 tap-scale touch-target"
            :style="isSignUp ? 'background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; box-shadow: var(--brand-glow);' : 'color: var(--text-muted);'"
          >
            สมัครสมาชิก
          </button>
        </div>

        <!-- Sign In Form -->
        <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">อีเมล</label>
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
              class="w-full input-glass text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">รหัสผ่าน</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              class="w-full input-glass text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tap-scale touch-target"
          >
            <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้' }}
          </button>
        </form>

        <!-- Sign Up Form -->
        <form v-else @submit.prevent="handleSignUp" class="space-y-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">อีเมล</label>
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
              class="w-full input-glass text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">รหัสผ่าน</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              minlength="6"
              autocomplete="new-password"
              class="w-full input-glass text-sm"
            />
            <p class="text-[11px] mt-1.5" style="color: var(--text-muted);">อย่างน้อย 6 ตัวอักษร</p>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">ยืนยันรหัสผ่าน</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minlength="6"
              autocomplete="new-password"
              class="w-full input-glass text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading || password !== confirmPassword"
            class="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tap-scale touch-target"
          >
            <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border-default);"></div>
          <span class="text-xs" style="color: var(--text-muted);">หรือ</span>
          <div class="flex-1 h-px" style="background: var(--border-default);"></div>
        </div>

        <!-- Google Sign In -->
        <button
          @click="handleGoogleSignIn"
          :disabled="isLoading"
          class="w-full btn-secondary text-sm font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          ลงชื่อเข้าใช้ผ่าน Google
        </button>

        <p class="text-xs text-center leading-relaxed" style="color: var(--text-muted);">
          เมื่อลงชื่อเข้าใช้สำเร็จ ระบบจะพาไปที่ Dashboard อัตโนมัติ
        </p>
      </div>
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

const features = ['💸 การเงิน', '📅 ตารางเรียน', '✅ งาน & To-do', '🎉 กิจกรรม', '🔔 เตือนผ่าน LINE']

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

<style scoped>
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
