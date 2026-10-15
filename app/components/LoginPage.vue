<template>
  <div class="min-h-[100dvh] relative lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]" style="background-color: var(--bg-base);">
    <!-- Brand panel (desktop / large tablet) -->
    <div class="hidden lg:flex relative flex-col justify-between p-10 xl:p-14" style="background: var(--brand-panel); color: #f4f1ea;">
      <div class="relative flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background: rgba(255,255,255,0.12);">
          <span class="font-semibold text-xl">M</span>
        </div>
        <p class="font-semibold text-lg tracking-tight">MyLife</p>
      </div>
      <div class="relative max-w-md">
        <p class="text-[11px] tracking-[0.18em] uppercase" style="color: rgba(244,241,234,0.62);">Personal tracker</p>
        <h2 class="mt-3 text-[2rem] xl:text-[2.35rem] font-semibold leading-snug tracking-tight">จัดการทุกด้านของชีวิตในที่เดียว</h2>
        <p class="mt-4 text-[15px] leading-relaxed" style="color: rgba(244,241,234,0.78);">การเงิน ตารางเรียน งานที่ต้องทำ และกิจกรรมสำคัญ — เป็นระเบียบ และพร้อมเตือนคุณผ่าน LINE</p>
        <div class="mt-8 flex flex-wrap gap-2">
          <span v-for="f in features" :key="f" class="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);">{{ f }}</span>
        </div>
      </div>
      <p class="relative text-xs" style="color: rgba(244,241,234,0.5);">© {{ new Date().getFullYear() }} MyLife · Personal Tracker</p>
    </div>

    <!-- Right side: forms -->
    <div class="relative flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10 min-h-[100dvh] lg:min-h-0">
    <!-- Loading / Redirecting -->
    <div
      v-if="isCheckingSession || isRedirecting"
      class="relative rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-4 max-w-sm w-full animate-fade-in"
      style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);"
    >
      <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: var(--brand); color: var(--brand-on);">
        <span class="font-semibold text-xl">M</span>
      </div>
      <span class="inline-block w-8 h-8 border-[2.5px] border-t-transparent rounded-full animate-spin" style="border-color: var(--brand); border-top-color: transparent;"></span>
      <div class="text-center space-y-1">
        <p class="text-base font-semibold" style="color: var(--text-primary);">
          {{ isRedirecting ? 'กำลังพาไปที่ Dashboard...' : 'กำลังตรวจสอบเซสชัน...' }}
        </p>
        <p class="text-sm" style="color: var(--text-muted);">{{ sessionCheckHint }}</p>
      </div>
    </div>

    <!-- Login Card -->
    <div v-else class="auth-card relative rounded-2xl max-w-[420px] w-full overflow-hidden animate-slide-up" style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);">
      <!-- Card header -->
      <div class="px-5 pt-7 pb-4 sm:px-8 sm:pt-8 sm:pb-5 text-center">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 lg:hidden" style="background: var(--brand); color: var(--brand-on);">
          <span class="font-semibold text-xl">M</span>
        </div>
        <p class="lg:hidden text-[11px] tracking-[0.16em] uppercase mb-1.5" style="color: var(--text-muted);">MyLife</p>
        <h1 class="text-[1.45rem] sm:text-[1.6rem] font-semibold tracking-tight" style="color: var(--text-primary);">ยินดีต้อนรับ</h1>
        <p class="text-sm mt-1.5 leading-relaxed" style="color: var(--text-muted);">เข้าสู่ระบบเพื่อจัดการชีวิตของคุณ</p>
      </div>

      <div class="px-5 pb-6 sm:px-8 sm:pb-8 space-y-5">
        <!-- Messages -->
        <Transition name="slide-down">
          <div
            v-if="errorMessage"
            class="flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
            style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--ink-rose);"
            role="alert"
          >
            <span class="shrink-0 mt-0.5" aria-hidden="true">!</span>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>
        <Transition name="slide-down">
          <div
            v-if="successMessage"
            class="flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
            style="background: var(--event-status-ongoing-soft); border: 1px solid var(--event-status-ongoing-border); color: var(--ink-emerald);"
            role="status"
          >
            <span class="shrink-0 mt-0.5" aria-hidden="true">✓</span>
            <span>{{ successMessage }}</span>
          </div>
        </Transition>
        <Transition name="slide-down">
          <div
            v-if="isLoading && loadingHint"
            class="flex items-center gap-2 rounded-xl p-3 text-xs font-medium"
            style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--ink-amber);"
          >
            <span>{{ loadingHint }}</span>
          </div>
        </Transition>

        <!-- Tab switcher -->
        <div class="flex rounded-xl p-1 gap-1" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);" role="tablist">
          <button
            type="button"
            @click="isSignUp = false"
            class="flex-1 py-2.5 px-3 rounded-[10px] text-sm font-semibold tap-scale touch-target"
            :style="!isSignUp ? 'background: var(--brand); color: var(--brand-on);' : 'color: var(--text-muted);'"
            :aria-selected="!isSignUp"
          >
            ลงชื่อเข้าใช้
          </button>
          <button
            type="button"
            @click="isSignUp = true"
            class="flex-1 py-2.5 px-3 rounded-[10px] text-sm font-semibold tap-scale touch-target"
            :style="isSignUp ? 'background: var(--brand); color: var(--brand-on);' : 'color: var(--text-muted);'"
            :aria-selected="isSignUp"
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

        <!-- Sign Up Flow (Step 1 & Step 2) -->
        <div v-else class="space-y-4">
          <!-- Step 1: Account Information -->
          <form v-if="signUpStep === 'credentials'" @submit.prevent="proceedToModuleSelection" class="space-y-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background: var(--brand-soft); color: var(--brand-ink);">
                ขั้นตอนที่ 1/2: ข้อมูลบัญชี
              </span>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">ชื่อที่แสดง</label>
              <input
                v-model="fullName"
                type="text"
                placeholder="ชื่อของคุณ"
                autocomplete="name"
                class="w-full input-glass text-sm"
              />
            </div>
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
              :disabled="!isCredentialsValid"
              class="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tap-scale touch-target"
            >
              <span>ถัดไป: เลือกฟังก์ชันที่ต้องการใช้</span>
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>

          <!-- Step 2: Feature Selection (Onboarding) -->
          <div v-else class="space-y-4 animate-fade-in">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background: var(--brand-soft); color: var(--brand-ink);">
                ขั้นตอนที่ 2/2: ปรับแต่งการใช้งาน
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="selectAllModules"
                  class="text-[12px] font-medium hover:underline"
                  style="color: var(--brand-ink);"
                >
                  เลือกทั้งหมด
                </button>
                <span class="text-xs" style="color: var(--text-muted);">·</span>
                <button
                  type="button"
                  @click="selectMinimalModules"
                  class="text-[12px] font-medium hover:underline"
                  style="color: var(--text-secondary);"
                >
                  เฉพาะการเงิน
                </button>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-bold" style="color: var(--text-primary);">คุณต้องการใช้งานฟังก์ชันใดบ้าง?</h3>
              <p class="text-[11.5px] mt-0.5" style="color: var(--text-muted);">
                เลือกเฉพาะส่วนที่ต้องใช้เพื่อความเรียบง่าย (เปิด-ปิดเพิ่มภายหลังได้ตลอดเวลา)
              </p>
            </div>

            <!-- Module list checkboxes -->
            <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              <div
                v-for="mod in allModules"
                :key="mod.id"
                @click="toggleSelectedModule(mod.id)"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer tap-scale"
                :style="selectedSignUpModules.includes(mod.id)
                  ? 'background: var(--brand-soft); border-color: var(--brand-border);'
                  : 'background: var(--bg-elevated); border-color: var(--border-subtle);'"
              >
                <div class="text-lg shrink-0 mt-0.5">{{ mod.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-[13px] font-semibold" :style="{ color: selectedSignUpModules.includes(mod.id) ? 'var(--brand-ink)' : 'var(--text-primary)' }">
                      {{ mod.label }}
                    </p>
                    <div
                      class="w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0 font-semibold"
                      :style="selectedSignUpModules.includes(mod.id) ? 'background: var(--brand); color: var(--brand-on);' : 'border: 1px solid var(--border-default); background: transparent; color: transparent;'"
                    >
                      <span v-if="selectedSignUpModules.includes(mod.id)">✓</span>
                    </div>
                  </div>
                  <p class="text-[11px] mt-0.5 leading-tight line-clamp-2" style="color: var(--text-muted);">
                    {{ mod.description }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button
                type="button"
                @click="signUpStep = 'credentials'"
                class="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all tap-scale"
                style="background: var(--bg-elevated); border-color: var(--border-subtle); color: var(--text-secondary);"
              >
                ← ย้อนกลับ
              </button>
              <button
                type="button"
                @click="handleSignUp"
                :disabled="isLoading || selectedSignUpModules.length === 0"
                class="flex-1 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tap-scale touch-target"
              >
                <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'ยืนยันและสร้างบัญชี' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border-default);"></div>
          <span class="text-xs" style="color: var(--text-muted);">หรือ</span>
          <div class="flex-1 h-px" style="background: var(--border-default);"></div>
        </div>

        <!-- Google Sign In Button Container -->
        <div class="w-full flex flex-col items-center gap-2">
          <div ref="googleBtnRef" class="w-full flex justify-center min-h-[44px]"></div>
          <button
            v-if="!isGoogleBtnRendered"
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
        </div>

        <p class="text-xs text-center leading-relaxed" style="color: var(--text-muted);">
          เมื่อลงชื่อเข้าใช้สำเร็จ ระบบจะพาไปที่ Dashboard อัตโนมัติ
        </p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AppModuleId } from '~/composables/useUserModules'

const router = useRouter()
const config = useRuntimeConfig()
const { login, register, loginWithGoogleIdToken, isSessionValid } = useAuth()
const { allModules, setModules } = useUserModules()

const features = ['การเงิน', 'ตารางเรียน', 'งาน & To-do', 'กิจกรรม', 'เตือนผ่าน LINE']

const isSignUp = ref(false)
const signUpStep = ref<'credentials' | 'modules'>('credentials')
const selectedSignUpModules = ref<AppModuleId[]>(allModules.map((m) => m.id))

const isLoading = ref(false)
const isCheckingSession = ref(true)
const isRedirecting = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loadingHint = ref('')
const sessionCheckHint = ref('กรุณารอสักครู่')

watch(isSignUp, () => {
  signUpStep.value = 'credentials'
  errorMessage.value = ''
  successMessage.value = ''
})

const isCredentialsValid = computed(() => {
  return (
    email.value.trim().length > 0 &&
    password.value.length >= 6 &&
    confirmPassword.value.length >= 6 &&
    password.value === confirmPassword.value
  )
})

const proceedToModuleSelection = () => {
  if (password.value !== confirmPassword.value) {
    showMessage('รหัสผ่านไม่ตรงกัน', 'error')
    return
  }
  if (password.value.length < 6) {
    showMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error')
    return
  }
  signUpStep.value = 'modules'
}

const toggleSelectedModule = (id: AppModuleId) => {
  const list = [...selectedSignUpModules.value]
  const idx = list.indexOf(id)
  if (idx >= 0) {
    if (list.length > 1) {
      list.splice(idx, 1)
    } else {
      showMessage('ต้องเลือกอย่างน้อย 1 ฟังก์ชัน', 'error')
    }
  } else {
    list.push(id)
  }
  selectedSignUpModules.value = list
}

const selectAllModules = () => {
  selectedSignUpModules.value = allModules.map((m) => m.id)
}

const selectMinimalModules = () => {
  selectedSignUpModules.value = ['cashflow']
}

let loadingTimer: ReturnType<typeof setTimeout> | null = null
let sessionTimer: ReturnType<typeof setTimeout> | null = null

watch(isLoading, (val) => {
  if (val) {
    loadingHint.value = ''
    loadingTimer = setTimeout(() => {
      if (isLoading.value) {
        loadingHint.value = '⚡ กำลังเชื่อมต่อเซิร์ฟเวอร์ (หากพึ่งเปิดระบบครั้งแรก อาจใช้เวลา 20-30 วินาที)'
      }
    }, 2500)
  } else {
    loadingHint.value = ''
    if (loadingTimer) clearTimeout(loadingTimer)
  }
})

watch(isCheckingSession, (val) => {
  if (val) {
    sessionCheckHint.value = 'กรุณารอสักครู่'
    sessionTimer = setTimeout(() => {
      if (isCheckingSession.value) {
        sessionCheckHint.value = '⚡ กำลังปลุกเซิร์ฟเวอร์ระบบ (อาจใช้เวลาสักครู่ในครั้งแรก)...'
      }
    }, 2500)
  } else {
    if (sessionTimer) clearTimeout(sessionTimer)
  }
}, { immediate: true })

let googleClientInitialized = false

const googleBtnRef = ref<HTMLElement | null>(null)
const isGoogleBtnRendered = ref(false)

const redirectToDashboard = async () => {
  if (import.meta.server || isRedirecting.value) return
  isRedirecting.value = true

  try {
    await router.push('/dashboard')
  } catch (error) {
    console.error('Redirect to dashboard error:', error)
    // If navigation fails, force reload
    if (import.meta.client) {
      window.location.href = '/dashboard'
    }
  }
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

const getBackendErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback
  const fetchError = error as { data?: { message?: string }; message?: string }
  return fetchError.data?.message || fetchError.message || fallback
}

type GoogleCredentialResponse = { credential?: string }

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
}

type GoogleRenderButtonOptions = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number | string
}

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void
      renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
    }
  }
}

const getGoogleWindow = (): { google?: GoogleIdentity } => globalThis as { google?: GoogleIdentity }

const loadGoogleIdentityScript = () => new Promise<void>((resolve, reject) => {
  if (getGoogleWindow().google?.accounts?.id) { resolve(); return }
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('โหลดสคริปต์ Google ไม่สำเร็จ'))
  document.head.appendChild(script)
})

const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    if (!response.credential) throw new Error('ไม่พบข้อมูลยืนยันตัวตนจาก Google')
    await loginWithGoogleIdToken(response.credential)
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Google sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ'), 'error')
  } finally {
    isLoading.value = false
  }
}

const ensureGoogleClientInitialized = async () => {
  if (googleClientInitialized) return
  if (!config.public.googleClientId) throw new Error('ยังไม่ได้ตั้งค่า Google Client ID')
  await loadGoogleIdentityScript()
  getGoogleWindow().google!.accounts.id.initialize({
    client_id: config.public.googleClientId,
    callback: handleGoogleCredential,
  })
  googleClientInitialized = true
}

const renderGoogleOfficialButton = async () => {
  try {
    await ensureGoogleClientInitialized()
    if (googleBtnRef.value && getGoogleWindow().google?.accounts?.id?.renderButton) {
      googleBtnRef.value.innerHTML = ''
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-night')
      getGoogleWindow().google!.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      })
      isGoogleBtnRendered.value = true
    }
  } catch (err) {
    console.warn('Failed to render official Google button:', err)
  }
}

onMounted(async () => {
  if (isSessionValid()) {
    redirectToDashboard()
    return
  }
  isCheckingSession.value = false
  isRedirecting.value = false

  try {
    await renderGoogleOfficialButton()
  } catch (err) {
    console.warn('Google Client pre-init warning:', err)
  }
})

onUnmounted(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
  if (sessionTimer) clearTimeout(sessionTimer)
})

const handleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await login(email.value, password.value)
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'เข้าสู่ระบบไม่สำเร็จ'), 'error')
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
    if (selectedSignUpModules.value.length === 0) {
      showMessage('โปรดเลือกอย่างน้อย 1 ฟังก์ชันที่ต้องการใช้งาน', 'error')
      isLoading.value = false
      return
    }
    await register(email.value, password.value, fullName.value || email.value.split('@')[0] || '')
    // Persist chosen modules for this new user
    setModules(selectedSignUpModules.value)
    showMessage('สมัครสมาชิกสำเร็จ กำลังพาไปที่ Dashboard...', 'success')
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Sign up error:', error)
    showMessage(getBackendErrorMessage(error, 'สมัครสมาชิกไม่สำเร็จ'), 'error')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await ensureGoogleClientInitialized()
    getGoogleWindow().google!.accounts.id.prompt((notification: GooglePromptNotification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        isLoading.value = false
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || ''
        console.warn('Google prompt not displayed/skipped reason:', reason)
        showMessage('ไม่สามารถแสดงหน้าต่างเข้าสู่ระบบ Google ได้ (โปรดลองใหม่หรือรอ Google อัปเดตสิทธิ์)', 'error')
      }
    })
  } catch (error: unknown) {
    console.error('Google sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ'), 'error')
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

@media (max-width: 639px) {
  .auth-card {
    border-radius: 1rem;
  }
}
</style>
