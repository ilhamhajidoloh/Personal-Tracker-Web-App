<template>
  <div class="auth-container">
    <!-- Loading Overlay -->
    <div v-if="isCheckingSession || isRedirecting" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner-wrapper">
          <div class="spinner"></div>
          <div class="spinner-glow"></div>
        </div>
        <h2 class="loading-title">{{ isRedirecting ? 'กำลังพาไปที่ Dashboard' : 'กำลังตรวจสอบเซสชัน' }}</h2>
        <p class="loading-subtitle">{{ sessionCheckHint }}</p>
      </div>
    </div>

    <!-- Main Auth Content -->
    <div v-else class="auth-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-background">
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="gradient-orb orb-3"></div>
        </div>

        <div class="hero-content">
          <div class="logo-section">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 class="logo-text">MyLife</h1>
          </div>

          <div class="hero-text">
            <h2 class="hero-title">จัดการทุกด้านของชีวิต<br>ในที่เดียว</h2>
            <p class="hero-description">
              การเงิน • ตารางเรียน • งาน & To-do • กิจกรรม
            </p>
          </div>

          <div class="feature-grid">
            <div v-for="f in features" :key="f.label" class="feature-card">
              <div class="feature-icon">{{ f.icon }}</div>
              <span class="feature-label">{{ f.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="form-section">
        <div class="form-container">
          <!-- Messages -->
          <Transition name="message">
            <div v-if="errorMessage" class="alert alert-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <Transition name="message">
            <div v-if="successMessage" class="alert alert-success" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{{ successMessage }}</span>
            </div>
          </Transition>

          <Transition name="message">
            <div v-if="isLoading && loadingHint" class="alert alert-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ loadingHint }}</span>
            </div>
          </Transition>

          <!-- Form Header -->
          <div class="form-header">
            <h2 class="form-title">{{ isSignUp ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับ' }}</h2>
            <p class="form-subtitle">{{ isSignUp ? 'เริ่มต้นจัดการชีวิตที่ดีขึ้น' : 'เข้าสู่ระบบเพื่อดำเนินการต่อ' }}</p>
          </div>

          <!-- Mode Switcher -->
          <div class="mode-switcher">
            <button
              type="button"
              @click="isSignUp = false"
              class="mode-btn"
              :class="{ active: !isSignUp }"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              type="button"
              @click="isSignUp = true"
              class="mode-btn"
              :class="{ active: isSignUp }"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span>สมัครสมาชิก</span>
            </button>
          </div>

          <!-- Sign In Form -->
          <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="auth-form">
            <div class="input-group">
              <label class="input-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>อีเมล</span>
              </label>
              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                required
                autocomplete="email"
                class="input-field"
              />
            </div>

            <div class="input-group">
              <label class="input-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>รหัสผ่าน</span>
              </label>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                class="input-field"
              />
            </div>

            <button type="submit" :disabled="isLoading" class="primary-btn">
              <span v-if="isLoading" class="btn-spinner"></span>
              <span>{{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
            </button>
          </form>

          <!-- Sign Up Flow -->
          <div v-else class="auth-form">
            <!-- Step 1: Credentials -->
            <form v-if="signUpStep === 'credentials'" @submit.prevent="proceedToModuleSelection">
              <div class="progress-indicator">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 50%"></div>
                </div>
                <span class="progress-text">ขั้นตอนที่ 1 จาก 2</span>
              </div>

              <div class="input-group">
                <label class="input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>ชื่อที่แสดง</span>
                </label>
                <input
                  v-model="fullName"
                  type="text"
                  placeholder="ชื่อของคุณ"
                  autocomplete="name"
                  class="input-field"
                />
              </div>

              <div class="input-group">
                <label class="input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>อีเมล</span>
                </label>
                <input
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autocomplete="email"
                  class="input-field"
                />
              </div>

              <div class="input-group">
                <label class="input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>รหัสผ่าน</span>
                </label>
                <input
                  v-model="password"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="input-field"
                />
              </div>

              <div class="input-group">
                <label class="input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>ยืนยันรหัสผ่าน</span>
                </label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="input-field"
                />
              </div>

              <button type="submit" :disabled="!isCredentialsValid" class="primary-btn">
                <span>ถัดไป</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </form>

            <!-- Step 2: Module Selection -->
            <div v-else>
              <div class="progress-indicator">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 100%"></div>
                </div>
                <span class="progress-text">ขั้นตอนที่ 2 จาก 2</span>
              </div>

              <div class="modules-header">
                <h3 class="modules-title">เลือกฟังก์ชันที่ต้องการ</h3>
                <div class="modules-actions">
                  <button type="button" @click="selectAllModules" class="text-btn">ทั้งหมด</button>
                  <span>•</span>
                  <button type="button" @click="selectMinimalModules" class="text-btn">การเงินอย่างเดียว</button>
                </div>
              </div>

              <div class="modules-grid">
                <div
                  v-for="mod in allModules"
                  :key="mod.id"
                  @click="toggleSelectedModule(mod.id)"
                  class="module-card"
                  :class="{ selected: selectedSignUpModules.includes(mod.id) }"
                >
                  <div class="module-check">
                    <svg v-if="selectedSignUpModules.includes(mod.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div class="module-icon-large">{{ mod.icon }}</div>
                  <h4 class="module-name">{{ mod.label }}</h4>
                  <p class="module-desc">{{ mod.description }}</p>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" @click="signUpStep = 'credentials'" class="secondary-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  @click="handleSignUp"
                  :disabled="isLoading || selectedSignUpModules.length === 0"
                  class="primary-btn flex-1"
                >
                  <span v-if="isLoading" class="btn-spinner"></span>
                  <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider">
            <span>หรือ</span>
          </div>

          <!-- Google Sign In -->
          <div class="social-section">
            <div ref="googleBtnRef" class="google-official-wrapper"></div>

            <button
              v-if="!isGoogleBtnRendered"
              @click="handleGoogleSignIn"
              :disabled="isLoading"
              class="google-btn"
            >
              <svg viewBox="0 0 24 24" class="google-logo">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{{ isLoading ? 'กำลังเชื่อมต่อ...' : 'ดำเนินการต่อด้วย Google' }}</span>
              <span v-if="isLoading" class="btn-spinner gray"></span>
            </button>
          </div>
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

const features = [
  { icon: '💰', label: 'การเงิน' },
  { icon: '📚', label: 'ตารางเรียน' },
  { icon: '✅', label: 'งาน & To-do' },
  { icon: '🎯', label: 'กิจกรรม' },
]

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
        theme: isDark ? 'filled_black' : 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: '100%',
        logo_alignment: 'left',
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
/* ========== Base Container ========== */
.auth-container {
  min-height: 100dvh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* ========== Loading Overlay ========== */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
  padding: 2rem;
}

.spinner-wrapper {
  position: relative;
  width: 4rem;
  height: 4rem;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: var(--brand);
  border-right-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

.spinner-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--brand-soft) 0%, transparent 70%);
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.loading-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* ========== Main Content Layout ========== */
.auth-content {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .auth-content {
    grid-template-columns: 1fr 1fr;
  }
}

/* ========== Hero Section ========== */
.hero-section {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .hero-section {
    display: flex;
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 8s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.15);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  bottom: -80px;
  left: -80px;
  animation-delay: 2s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: rgba(255, 255, 255, 0.08);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 500px;
  color: white;
}

/* Logo */
.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.logo-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.logo-icon svg {
  width: 1.75rem;
  height: 1.75rem;
  color: white;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Hero Text */
.hero-text {
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
}

.hero-description {
  font-size: 1.125rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* Features Grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2rem;
}

.feature-label {
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.95;
}

/* ========== Form Section ========== */
.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-base);
  min-height: 100dvh;
}

@media (min-width: 640px) {
  .form-section {
    padding: 3rem;
  }
}

.form-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ========== Alerts ========== */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  line-height: 1.5;
  border: 1px solid;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #16a34a;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #d97706;
}

/* ========== Form Header ========== */
.form-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-subtitle {
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ========== Mode Switcher ========== */
.mode-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.mode-btn:hover:not(.active) {
  background: var(--bg-card);
  color: var(--text-secondary);
}

.mode-btn.active {
  background: var(--brand);
  color: var(--brand-on);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ========== Form Styles ========== */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-label svg {
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-field::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.input-field:focus {
  outline: none;
  border-color: var(--brand);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

/* ========== Buttons ========== */
.primary-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.875rem;
  border: none;
  background: var(--brand);
  color: var(--brand-on);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-radius: 0.875rem;
  border: 1.5px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.secondary-btn:hover {
  background: var(--bg-card);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.secondary-btn svg {
  width: 1rem;
  height: 1rem;
}

.text-btn {
  background: none;
  border: none;
  color: var(--brand-ink);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.text-btn:hover {
  text-decoration: underline;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn-spinner.gray {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: rgba(0, 0, 0, 0.6);
}

/* ========== Progress Indicator ========== */
.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 0.5rem;
  background: var(--bg-elevated);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--brand-2, var(--brand)));
  border-radius: 9999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
}

/* ========== Module Selection ========== */
.modules-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.modules-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modules-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .modules-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.module-card {
  position: relative;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 2px solid var(--border-subtle);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.module-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.module-card.selected {
  background: var(--brand-soft);
  border-color: var(--brand);
  box-shadow: 0 4px 12px var(--brand-soft);
}

.module-check {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 0.375rem;
  background: transparent;
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-card.selected .module-check {
  background: var(--brand);
  border-color: var(--brand);
}

.module-check svg {
  width: 0.875rem;
  height: 0.875rem;
  color: white;
}

.module-icon-large {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.module-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
}

.module-card.selected .module-name {
  color: var(--brand-ink);
}

.module-desc {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========== Form Actions ========== */
.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.flex-1 {
  flex: 1;
}

/* ========== Divider ========== */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 0.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-default), transparent);
}

.divider span {
  padding: 0 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

/* ========== Social Section ========== */
.social-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.google-official-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 3rem;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-radius: 0.875rem;
  border: 1.5px solid var(--border-default);
  background: #ffffff;
  color: #1f1f1f;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.google-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.google-btn:active:not(:disabled) {
  transform: translateY(0);
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-logo {
  width: 1.375rem;
  height: 1.375rem;
  flex-shrink: 0;
}

/* ========== Animations ========== */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.02); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
