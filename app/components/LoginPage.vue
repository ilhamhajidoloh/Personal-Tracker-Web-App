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
        <p class="text-sm font-medium transition-all" style="color: var(--text-muted);">{{ sessionCheckHint }}</p>
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
        <Transition name="slide-down">
          <div
            v-if="isLoading && loadingHint"
            class="flex items-center gap-2 rounded-xl p-3 text-xs font-semibold animate-pulse"
            style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.25); color: var(--ink-amber);"
          >
            <span class="shrink-0">⚡</span>
            <span>{{ loadingHint }}</span>
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

        <!-- Sign Up Flow (Step 1 & Step 2) -->
        <div v-else class="space-y-4">
          <!-- Step 1: Account Information -->
          <form v-if="signUpStep === 'credentials'" @submit.prevent="proceedToModuleSelection" class="space-y-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background: var(--brand-soft); color: var(--brand-ink);">
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
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background: var(--brand-soft); color: var(--brand-ink);">
                ขั้นตอนที่ 2/2: ปรับแต่งการใช้งาน
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="selectAllModules"
                  class="text-[11px] font-semibold text-violet-400 hover:underline"
                >
                  เลือกทั้งหมด
                </button>
                <span class="text-gray-600 text-xs">·</span>
                <button
                  type="button"
                  @click="selectMinimalModules"
                  class="text-[11px] font-semibold text-gray-400 hover:underline"
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
                class="flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer tap-scale"
                :style="selectedSignUpModules.includes(mod.id)
                  ? 'background: var(--brand-soft); border-color: var(--brand);'
                  : 'background: var(--bg-elevated); border-color: var(--border-subtle); opacity: 0.65;'"
              >
                <div class="text-xl shrink-0 mt-0.5">{{ mod.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-bold" :style="{ color: selectedSignUpModules.includes(mod.id) ? 'var(--brand-ink)' : 'var(--text-primary)' }">
                      {{ mod.label }}
                    </p>
                    <!-- Checkbox indicator -->
                    <div
                      class="w-4 h-4 rounded-md flex items-center justify-center text-white text-[10px] shrink-0 font-bold transition-all"
                      :style="selectedSignUpModules.includes(mod.id) ? 'background: var(--brand);' : 'border: 1px solid var(--border-default); background: transparent;'"
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
                <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'ยืนยันและสร้างบัญชี ✨' }}</span>
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
import { computed, onMounted, ref, watch } from 'vue'
import type { AppModuleId } from '~/composables/useUserModules'

const router = useRouter()
const config = useRuntimeConfig()
const { login, register, loginWithGoogleIdToken, isSessionValid } = useAuth()
const { allModules, setModules } = useUserModules()

const features = ['💸 การเงิน', '📅 ตารางเรียน', '✅ งาน & To-do', '🎉 กิจกรรม', '🔔 เตือนผ่าน LINE']

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
  await router.push('/dashboard')
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

  try {
    await renderGoogleOfficialButton()
  } catch (err) {
    console.warn('Google Client pre-init warning:', err)
  }
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
</style>
