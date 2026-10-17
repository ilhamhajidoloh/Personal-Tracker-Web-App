<template>
  <div class="modern-auth-container">
    <!-- Left Brand Panel -->
    <aside class="brand-panel">
      <div class="brand-content">
        <!-- Header -->
        <div class="brand-header">
          <div class="brand-logo">
            <span>M</span>
          </div>
          <h1 class="brand-name">MyLife</h1>
        </div>

        <!-- Main Content -->
        <div class="brand-main">
          <span class="brand-tagline">PERSONAL TRACKER</span>
          <h2 class="brand-headline">จัดการทุกด้านของชีวิต<br>ในที่เดียว</h2>
          <p class="brand-description">
            การเงิน ตารางเรียน งานที่ต้องทำ และกิจกรรมสำคัญ<br>
            เป็นระเบียบ พร้อมเตือนคุณผ่าน LINE
          </p>
          <div class="feature-pills">
            <span v-for="f in features" :key="f" class="feature-pill">{{ f }}</span>
          </div>
        </div>

        <!-- Footer -->
        <p class="brand-footer">© {{ new Date().getFullYear() }} MyLife · Personal Tracker</p>
      </div>

      <div class="brand-orb brand-orb-1"></div>
      <div class="brand-orb brand-orb-2"></div>
    </aside>

    <!-- Right Auth Panel -->
    <main class="auth-panel">
      <!-- Loading State -->
      <div v-if="isCheckingSession || isRedirecting" class="auth-card loading-card">
        <div class="loading-brand">
          <span>M</span>
        </div>
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <p class="loading-title">
            {{ isRedirecting ? 'กำลังพาไปที่ Dashboard...' : 'กำลังตรวจสอบเซสชัน...' }}
          </p>
          <p class="loading-subtitle">{{ sessionCheckHint }}</p>
        </div>
      </div>

      <!-- Auth Card -->
      <div v-else class="auth-card">
        <!-- Header -->
        <div class="card-header">
          <div class="mobile-brand">
            <div class="mobile-brand-icon">
              <span>M</span>
            </div>
            <span class="mobile-brand-text">MyLife</span>
          </div>
          <h1 class="card-title">ยินดีต้อนรับ</h1>
          <p class="card-subtitle">เข้าสู่ระบบเพื่อจัดการชีวิตของคุณ</p>
        </div>

        <div class="card-body">
          <!-- Messages -->
          <Transition name="slide">
            <div v-if="errorMessage" class="message-box error-box" role="alert">
              <svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <Transition name="slide">
            <div v-if="successMessage" class="message-box success-box" role="status">
              <svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{{ successMessage }}</span>
            </div>
          </Transition>

          <Transition name="slide">
            <div v-if="isLoading && loadingHint" class="message-box warning-box">
              <svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span class="hint-text">{{ loadingHint }}</span>
            </div>
          </Transition>

          <!-- Tab Switcher -->
          <div class="tab-switcher" role="tablist">
            <button
              type="button"
              @click="isSignUp = false"
              class="tab-button"
              :class="{ 'is-active': !isSignUp }"
              :aria-selected="!isSignUp"
            >
              ลงชื่อเข้าใช้
            </button>
            <button
              type="button"
              @click="isSignUp = true"
              class="tab-button"
              :class="{ 'is-active': isSignUp }"
              :aria-selected="isSignUp"
            >
              สมัครสมาชิก
            </button>
          </div>

          <!-- Sign In Form -->
          <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="auth-form">
            <div class="form-field">
              <label class="field-label">อีเมล</label>
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                required
                autocomplete="email"
                class="field-input"
              />
            </div>
            <div class="form-field">
              <label class="field-label">รหัสผ่าน</label>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                class="field-input"
              />
            </div>
            <button
              type="submit"
              :disabled="isLoading"
              class="submit-button"
            >
              <span v-if="isLoading" class="button-spinner"></span>
              {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้' }}
            </button>
          </form>

          <!-- Sign Up Flow -->
          <div v-else class="auth-form">
            <!-- Step 1: Credentials -->
            <form v-if="signUpStep === 'credentials'" @submit.prevent="proceedToModuleSelection" class="form-content">
              <div class="step-indicator">
                <span class="step-badge">ขั้นตอนที่ 1/2: ข้อมูลบัญชี</span>
              </div>

              <div class="form-field">
                <label class="field-label">ชื่อที่แสดง</label>
                <input
                  v-model="fullName"
                  type="text"
                  placeholder="ชื่อของคุณ"
                  autocomplete="name"
                  class="field-input"
                />
              </div>

              <div class="form-field">
                <label class="field-label">อีเมล</label>
                <input
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  autocomplete="email"
                  class="field-input"
                />
              </div>

              <div class="form-field">
                <label class="field-label">รหัสผ่าน</label>
                <input
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="field-input"
                />
                <p class="field-hint">อย่างน้อย 6 ตัวอักษร</p>
              </div>

              <div class="form-field">
                <label class="field-label">ยืนยันรหัสผ่าน</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="field-input"
                />
              </div>

              <button
                type="submit"
                :disabled="!isCredentialsValid"
                class="submit-button next-button"
              >
                <span>ถัดไป: เลือกฟังก์ชันที่ต้องการใช้</span>
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </form>

            <!-- Step 2: Module Selection -->
            <div v-else class="form-content module-selection">
              <div class="step-header">
                <span class="step-badge">ขั้นตอนที่ 2/2: ปรับแต่งการใช้งาน</span>
                <div class="quick-actions">
                  <button type="button" @click="selectAllModules" class="quick-action">
                    เลือกทั้งหมด
                  </button>
                  <span class="separator">·</span>
                  <button type="button" @click="selectMinimalModules" class="quick-action minimal">
                    เฉพาะการเงิน
                  </button>
                </div>
              </div>

              <div class="selection-intro">
                <h3 class="selection-title">คุณต้องการใช้งานฟังก์ชันใดบ้าง?</h3>
                <p class="selection-description">
                  เลือกเฉพาะส่วนที่ต้องใช้เพื่อความเรียบง่าย (เปิด-ปิดเพิ่มภายหลังได้ตลอดเวลา)
                </p>
              </div>

              <div class="module-list">
                <div
                  v-for="mod in allModules"
                  :key="mod.id"
                  @click="toggleSelectedModule(mod.id)"
                  class="module-item"
                  :class="{ 'is-selected': selectedSignUpModules.includes(mod.id) }"
                >
                  <div class="module-icon">{{ mod.icon }}</div>
                  <div class="module-info">
                    <div class="module-header">
                      <p class="module-label">{{ mod.label }}</p>
                      <div class="module-checkbox">
                        <svg v-if="selectedSignUpModules.includes(mod.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    </div>
                    <p class="module-description">{{ mod.description }}</p>
                  </div>
                </div>
              </div>

              <div class="action-buttons">
                <button
                  type="button"
                  @click="signUpStep = 'credentials'"
                  class="back-button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  @click="handleSignUp"
                  :disabled="isLoading || selectedSignUpModules.length === 0"
                  class="submit-button confirm-button"
                >
                  <span v-if="isLoading" class="button-spinner"></span>
                  <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'ยืนยันและสร้างบัญชี' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider">
            <span class="divider-line"></span>
            <span class="divider-text">หรือ</span>
            <span class="divider-line"></span>
          </div>

          <!-- Google Sign In -->
          <div class="google-section">
            <div class="google-button-wrapper">
              <div ref="googleBtnRef" class="google-official-button"></div>
            </div>

            <button
              v-if="!isGoogleBtnRendered"
              @click="handleGoogleSignIn"
              :disabled="isLoading"
              class="google-fallback-button"
            >
              <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{{ isLoading ? 'กำลังเชื่อมต่อ...' : 'ลงชื่อเข้าใช้ด้วย Google' }}</span>
              <span v-if="isLoading" class="button-spinner gray"></span>
            </button>

            <div class="google-benefits">
              <svg class="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <div class="benefit-text">
                <p class="benefit-title">ปลอดภัย รวดเร็ว ไม่ต้องจำรหัสผ่าน</p>
                <p class="benefit-subtitle">เข้าใช้งานด้วย Google Account ของคุณ</p>
              </div>
            </div>
          </div>

          <p class="footer-note">
            เมื่อลงชื่อเข้าใช้สำเร็จ ระบบจะพาไปที่ Dashboard อัตโนมัติ
          </p>
        </div>
      </div>
    </main>
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
/* ========== Container ========== */
.modern-auth-container {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg-base);
}

@media (min-width: 1024px) {
  .modern-auth-container {
    grid-template-columns: 45fr 55fr;
  }
}

/* ========== Brand Panel ========== */
.brand-panel {
  display: none;
  position: relative;
  overflow: hidden;
  background: var(--brand-panel);
  color: #f4f1ea;
}

@media (min-width: 1024px) {
  .brand-panel {
    display: flex;
  }
}

.brand-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  height: 100%;
}

@media (min-width: 1280px) {
  .brand-content {
    padding: 4rem;
  }
}

.brand-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  opacity: 0.3;
}

.brand-orb-1 {
  width: 30rem;
  height: 30rem;
  background: rgba(151, 205, 246, 0.4);
  right: -10rem;
  top: -8rem;
}

.brand-orb-2 {
  width: 20rem;
  height: 20rem;
  background: rgba(117, 180, 229, 0.3);
  left: -8rem;
  bottom: -6rem;
}

/* Brand Header */
.brand-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.brand-logo {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Brand Main Content */
.brand-main {
  max-width: 32rem;
}

.brand-tagline {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: rgba(244, 241, 234, 0.7);
}

.brand-headline {
  margin-top: 1rem;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

@media (min-width: 1280px) {
  .brand-headline {
    font-size: 2.75rem;
  }
}

.brand-description {
  margin-top: 1.25rem;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(244, 241, 234, 0.85);
}

.feature-pills {
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.feature-pill {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-pill:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.brand-footer {
  font-size: 0.75rem;
  color: rgba(244, 241, 234, 0.5);
}

/* ========== Auth Panel ========== */
.auth-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  min-height: 100dvh;
}

@media (min-width: 640px) {
  .auth-panel {
    padding: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .auth-panel {
    min-height: auto;
  }
}

/* ========== Auth Card ========== */
.auth-card {
  position: relative;
  width: 100%;
  max-width: 28rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2, var(--brand)));
}

/* Loading State */
.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  text-align: center;
}

.loading-brand {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--brand), var(--brand-2, var(--brand)));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-on);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--brand);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loading-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Card Header */
.card-header {
  padding: 2rem 1.75rem 1.5rem;
  text-align: center;
}

@media (min-width: 640px) {
  .card-header {
    padding: 2.5rem 2.5rem 1.75rem;
  }
}

.mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 1024px) {
  .mobile-brand {
    display: none;
  }
}

.mobile-brand-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, var(--brand), var(--brand-2, var(--brand)));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand-on);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mobile-brand-text {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.card-subtitle {
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Card Body */
.card-body {
  padding: 0 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .card-body {
    padding: 0 2.5rem 2.5rem;
  }
}

/* Message Boxes */
.message-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.message-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-box {
  background: var(--event-status-soon-soft);
  border: 1px solid var(--event-status-soon-border);
  color: var(--ink-rose);
}

.success-box {
  background: var(--event-status-ongoing-soft);
  border: 1px solid var(--event-status-ongoing-border);
  color: var(--ink-emerald);
}

.warning-box {
  background: var(--event-status-soon-soft);
  border: 1px solid var(--event-status-soon-border);
  color: var(--ink-amber);
}

.hint-text {
  font-size: 0.8125rem;
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  gap: 0.375rem;
  padding: 0.375rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 0.875rem;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-muted);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button:hover:not(.is-active) {
  color: var(--text-secondary);
  background: var(--bg-card);
}

.tab-button.is-active {
  background: var(--brand);
  color: var(--brand-on);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.field-input::placeholder {
  color: var(--text-muted);
}

.field-input:focus {
  outline: none;
  border-color: var(--brand);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Buttons */
.submit-button {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border-radius: 0.875rem;
  background: var(--brand);
  color: var(--brand-on);
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.button-spinner.gray {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: rgba(0, 0, 0, 0.6);
}

.button-icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 0.75rem;
  font-weight: 600;
}

/* Module Selection */
.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-action {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand-ink);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action:hover {
  text-decoration: underline;
}

.quick-action.minimal {
  color: var(--text-secondary);
}

.separator {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.selection-intro {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.selection-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
}

.selection-description {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-muted);
}

/* Module List */
.module-list {
  max-height: 18rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-right: 0.375rem;
}

.module-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: 0.875rem;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-item:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.module-item.is-selected {
  background: var(--brand-soft);
  border-color: var(--brand-border);
}

.module-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.module-info {
  flex: 1;
  min-width: 0;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
}

.module-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.module-item.is-selected .module-label {
  color: var(--brand-ink);
}

.module-checkbox {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 0.375rem;
  background: transparent;
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-item.is-selected .module-checkbox {
  background: var(--brand);
  border-color: var(--brand);
}

.module-checkbox svg {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--brand-on);
}

.module-description {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-top: 0.5rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.125rem;
  border-radius: 0.875rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-button svg {
  width: 1rem;
  height: 1rem;
}

.back-button:hover {
  background: var(--bg-card);
  border-color: var(--border-hover);
}

.confirm-button {
  flex: 1;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 0.375rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-default), transparent);
}

.divider-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--bg-elevated);
}

/* Google Section */
.google-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.google-button-wrapper {
  width: 100%;
}

.google-official-button {
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 3rem;
}

.google-fallback-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1.5px solid var(--border-default);
  color: #1f1f1f;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.google-fallback-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.google-fallback-button:active:not(:disabled) {
  transform: translateY(0);
}

.google-fallback-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 1.375rem;
  height: 1.375rem;
  flex-shrink: 0;
}

.google-benefits {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
}

.benefit-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--brand);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.benefit-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.benefit-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.benefit-subtitle {
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.footer-note {
  font-size: 0.8125rem;
  text-align: center;
  line-height: 1.5;
  color: var(--text-muted);
}

/* ========== Animations ========== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

/* ========== Scrollbar ========== */
.module-list::-webkit-scrollbar {
  width: 0.375rem;
}

.module-list::-webkit-scrollbar-track {
  background: transparent;
}

.module-list::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 9999px;
}

.module-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}
</style>
