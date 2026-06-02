<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">Profile</h1>
            <p class="text-sm text-gray-400 mt-1">ข้อมูลผู้ใช้จาก Supabase Auth และตาราง profiles (ถ้ามี)</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="loadProfile"
              :disabled="isLoading"
              class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm transition-colors"
            >
              {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
            </button>
          </div>
        </header>

        <div
          v-if="errorMessage"
          class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="isLoading"
          class="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 flex items-center justify-center gap-3"
        >
          <span class="inline-block w-5 h-5 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin"></span>
          <span class="text-gray-300">กำลังโหลดข้อมูลโปรไฟล์...</span>
        </div>

        <template v-else>
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-1 rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold">
                {{ avatarFallback }}
              </div>
              <h2 class="text-xl font-semibold mt-4">{{ displayName }}</h2>
              <p class="text-sm text-gray-400 mt-1 break-all">{{ currentUser?.email || '-' }}</p>
              <div class="mt-4 space-y-2 text-sm">
                <p class="text-gray-300">ชื่อ: <span class="text-gray-400">{{ firstName }}</span></p>
                <p class="text-gray-300">นามสกุล: <span class="text-gray-400">{{ lastName }}</span></p>
                <p class="text-gray-300">สถานะอีเมล: <span :class="emailConfirmed ? 'text-emerald-400' : 'text-amber-300'">{{ emailConfirmed ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' }}</span></p>
              </div>
            </div>

            <div class="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 class="text-lg font-semibold">ข้อมูลสำคัญ</h3>
                  <p class="text-sm text-gray-400 mt-1">แสดงเฉพาะข้อมูลหลักของบัญชีผู้ใช้</p>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="row in importantProfileRows"
                  :key="row.key"
                  class="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-gray-800 rounded-xl px-3 py-2"
                >
                  <p class="text-xs text-gray-500 uppercase tracking-wide">{{ row.key }}</p>
                  <p class="sm:col-span-2 text-sm text-gray-300 break-all">{{ row.value }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold">LINE Integration</h3>
                <p class="text-sm text-gray-400 mt-1">ผูก LINE User ID เพื่อรับข้อความจาก MyLife เวลาคุณเพิ่มหรือแก้ไขงานและกิจกรรม</p>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                :class="lineStatusBadgeClass"
              >
                {{ lineStatusLabel }}
              </span>
            </div>

            <div
              v-if="isLineLoading"
              class="mt-4 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-4 text-sm text-gray-300"
            >
              กำลังตรวจสอบการเชื่อมต่อ LINE...
            </div>

            <div v-else class="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="rounded-xl border border-gray-800 bg-gray-800/20 px-4 py-3">
                  <p class="text-xs text-gray-500 uppercase tracking-wide">LINE User ID</p>
                  <p class="text-sm text-gray-300 break-all mt-1">{{ lineStatus.lineUserId || '-' }}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="rounded-xl border border-gray-800 bg-gray-800/20 px-4 py-3">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">เชื่อมต่อเมื่อ</p>
                    <p class="text-sm text-gray-300 mt-1">{{ lineConnectedAtText }}</p>
                  </div>
                  <div class="rounded-xl border border-gray-800 bg-gray-800/20 px-4 py-3">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">สถานะแจ้งเตือน</p>
                    <p class="text-sm text-gray-300 mt-1">{{ lineNotificationsText }}</p>
                  </div>
                </div>

                <div class="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-4 space-y-3">
                  <div>
                    <p class="font-medium text-white">เชื่อมแบบง่าย</p>
                    <p class="text-sm text-sky-100 mt-1">ไม่ต้องหา LINE User ID เอง ระบบจะสร้างข้อความเชื่อมต่อให้ และเมื่อคุณส่งข้อความนั้นหา {{ lineBotDisplayName }} ระบบจะรู้ทันทีว่า LINE account ไหนเป็นคนส่ง</p>
                  </div>

                  <div class="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 space-y-1">
                    <p class="font-medium text-white">มันเชื่อมยังไง?</p>
                    <p>1. MyLife สร้างโค้ดชั่วคราวที่ผูกกับบัญชีคุณ</p>
                    <p>2. คุณส่งโค้ดนั้นไปหา {{ lineBotDisplayName }}</p>
                    <p>3. LINE webhook จะอ่านว่าคนที่ส่งข้อความคือใคร แล้วเอา LINE account นั้นมาผูกกับบัญชี MyLife ให้เอง</p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      v-if="lineBotAddFriendUrl"
                      :href="lineBotAddFriendUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 text-center"
                    >
                      เพิ่มเพื่อน {{ lineBotDisplayName }}
                    </a>
                    <div
                      v-else
                      class="px-4 py-2 rounded-xl bg-gray-800/40 border border-gray-700 text-sm text-gray-400"
                    >
                      ถ้ายังไม่ได้เพิ่มเพื่อน bot ให้เปิด LINE แล้วเพิ่ม {{ lineBotDisplayName }} ก่อน
                    </div>

                    <button
                      type="button"
                      @click="generateLineLinkCode()"
                      :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                      class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white"
                    >
                      {{ isGeneratingLineCode ? 'กำลังสร้างโค้ด...' : (hasLineLinkCode ? 'สร้างโค้ดใหม่' : 'สร้างโค้ดเชื่อมต่อ') }}
                    </button>

                    <button
                      type="button"
                      @click="openLineForConnection"
                      :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                      class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white"
                    >
                      เปิด LINE พร้อมข้อความ
                    </button>

                    <button
                      type="button"
                      @click="refreshLineStatus"
                      :disabled="isLineLoading || isGeneratingLineCode"
                      class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300"
                    >
                      ตรวจสอบสถานะ
                    </button>
                  </div>

                  <div v-if="lineLinkCode" class="space-y-3">
                    <div class="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3">
                      <p class="text-xs text-gray-500 uppercase tracking-wide">ข้อความที่ต้องส่งหา LINE bot</p>
                      <textarea
                        :value="lineLinkCode.code"
                        rows="4"
                        readonly
                        class="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 outline-none resize-none"
                      ></textarea>

                      <div class="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p class="text-xs text-gray-400">โค้ดนี้หมดอายุเวลา {{ lineLinkCodeExpiresAtText }}</p>
                        <button
                          type="button"
                          @click="copyLineLinkCode"
                          class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300"
                        >
                          คัดลอกข้อความอีกครั้ง
                        </button>
                      </div>
                    </div>

                    <div class="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 space-y-1">
                      <p>1. กดปุ่ม "เปิด LINE พร้อมข้อความ" หรือคัดลอกข้อความนี้ไปวางเอง</p>
                      <p>2. เปิดหรือเลือกแชตของ {{ lineBotDisplayName }} แล้วกดส่ง</p>
                      <p>3. กลับมาหน้านี้ ระบบจะเช็คสถานะให้อัตโนมัติ และคุณกด "ตรวจสอบสถานะ" ได้ทุกเมื่อ</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-gray-800 bg-gray-800/20 px-4 py-4 space-y-4">
                <label class="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-800/30 px-3 py-3 cursor-pointer">
                  <input
                    v-model="lineNotificationsEnabled"
                    type="checkbox"
                    class="mt-0.5 accent-violet-500"
                  >
                  <span class="text-sm text-gray-300">เปิดรับแจ้งเตือนใน LINE เมื่อมีการเพิ่มหรือแก้ไขงานและกิจกรรมจากในแอป</span>
                </label>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    @click="saveLinePreferences"
                    :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                    class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white"
                  >
                    {{ isSavingLine ? 'กำลังบันทึก...' : 'บันทึกการแจ้งเตือน' }}
                  </button>
                  <button
                    type="button"
                    @click="sendLineTestMessage"
                    :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                    class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300"
                  >
                    {{ isTestingLine ? 'กำลังส่ง...' : 'ส่งข้อความทดสอบ' }}
                  </button>
                  <button
                    type="button"
                    @click="disconnectLine"
                    :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                    class="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-rose-300"
                  >
                    ยกเลิกการเชื่อมต่อ
                  </button>
                </div>

                <details class="rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3">
                  <summary class="cursor-pointer text-sm font-medium text-white">เชื่อมต่อแบบกรอก LINE User ID เอง</summary>
                  <form class="mt-4 space-y-4" @submit.prevent="connectLine">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">LINE User ID</label>
                      <input
                        v-model="lineUserIdInput"
                        type="text"
                        autocomplete="off"
                        placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                      >
                      <p class="text-xs text-gray-500 mt-1">ใช้เฉพาะกรณีที่คุณมี `LINE User ID` อยู่แล้ว</p>
                    </div>

                    <button
                      type="submit"
                      :disabled="isSavingLine || isTestingLine"
                      class="w-full px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300"
                    >
                      {{ isSavingLine ? 'กำลังบันทึก...' : (lineStatus.connected ? 'อัปเดตการเชื่อมต่อแบบ manual' : 'เชื่อมต่อแบบ manual') }}
                    </button>
                  </form>
                </details>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type ProfileRow = Record<string, unknown>
type LineConnectionStatus = {
  connected: boolean
  lineUserId: string
  notificationsEnabled: boolean
  connectedAt: string | null
}

type LineLinkCodeResponse = {
  code: string
  expiresAt: string
  expiresInSeconds: number
}

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Profile',
})

const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { toastSuccess, toastError } = useAlert()
const config = useRuntimeConfig()

const isLoading = ref(true)
const errorMessage = ref('')
const profileRow = ref<ProfileRow | null>(null)
const isLineLoading = ref(true)
const isSavingLine = ref(false)
const isTestingLine = ref(false)
const isGeneratingLineCode = ref(false)
const lineStatus = ref<LineConnectionStatus>({
  connected: false,
  lineUserId: '',
  notificationsEnabled: false,
  connectedAt: null,
})
const lineLinkCode = ref<LineLinkCodeResponse | null>(null)
const lineUserIdInput = ref('')
const lineNotificationsEnabled = ref(true)

let lineStatusPollingTimer: ReturnType<typeof setInterval> | null = null

const currentUser = computed(() => user.value)

const createEmptyLineStatus = (): LineConnectionStatus => ({
  connected: false,
  lineUserId: '',
  notificationsEnabled: false,
  connectedAt: null,
})

const getProfileValue = (...values: unknown[]) => {
  const matchedValue = values.find((value) => typeof value === 'string' && value.trim())

  return typeof matchedValue === 'string' ? matchedValue.trim() : ''
}

const getFallbackNamePart = (index: number) => {
  const [first = '', ...rest] = displayName.value.split(' ').filter(Boolean)

  if (index === 0) {
    return first
  }

  return rest.join(' ')
}

const firstName = computed(() => getProfileValue(
  profileRow.value?.first_name,
  currentUser.value?.user_metadata?.first_name,
  currentUser.value?.user_metadata?.given_name,
  getFallbackNamePart(0),
) || '-')

const lastName = computed(() => getProfileValue(
  profileRow.value?.last_name,
  currentUser.value?.user_metadata?.last_name,
  currentUser.value?.user_metadata?.family_name,
  getFallbackNamePart(1),
) || '-')

const displayName = computed<string>(() => {
  const profileDisplayName = getProfileValue(profileRow.value?.display_name, profileRow.value?.full_name)
  const authFullName = getProfileValue(currentUser.value?.user_metadata?.full_name, currentUser.value?.user_metadata?.name)

  return (
    profileDisplayName ||
    authFullName ||
    currentUser.value?.email?.split('@')[0] ||
    ''
  )
})

const avatarFallback = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')

const emailConfirmed = computed(() => Boolean(currentUser.value?.email_confirmed_at))

const createdAtText = computed(() => {
  if (!currentUser.value?.created_at) {
    return '-'
  }

  return new Date(currentUser.value.created_at).toLocaleString('th-TH')
})

const lastSignInText = computed(() => {
  if (!currentUser.value?.last_sign_in_at) {
    return '-'
  }

  return new Date(currentUser.value.last_sign_in_at).toLocaleString('th-TH')
})

const importantProfileRows = computed(() => [
  { key: 'ชื่อ', value: firstName.value },
  { key: 'นามสกุล', value: lastName.value },
  { key: 'ชื่อที่แสดง', value: displayName.value || '-' },
  { key: 'อีเมล', value: currentUser.value?.email || '-' },
  { key: 'สถานะอีเมล', value: emailConfirmed.value ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' },
  { key: 'สมัครเมื่อ', value: createdAtText.value },
  { key: 'เข้าใช้ล่าสุด', value: lastSignInText.value },
])

const lineStatusLabel = computed(() => {
  if (!lineStatus.value.connected) {
    return 'ยังไม่ได้เชื่อมต่อ'
  }

  return lineStatus.value.notificationsEnabled
    ? 'เชื่อมต่อแล้วและเปิดแจ้งเตือน'
    : 'เชื่อมต่อแล้วแต่ปิดแจ้งเตือน'
})

const lineStatusBadgeClass = computed(() => {
  if (!lineStatus.value.connected) {
    return 'border-gray-700 bg-gray-800/40 text-gray-300'
  }

  return lineStatus.value.notificationsEnabled
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
})

const lineConnectedAtText = computed(() => {
  if (!lineStatus.value.connectedAt) {
    return '-'
  }

  return new Date(lineStatus.value.connectedAt).toLocaleString('th-TH')
})

const lineNotificationsText = computed(() => lineStatus.value.notificationsEnabled ? 'เปิดอยู่' : 'ปิดอยู่')

const lineLinkCodeExpiresAtText = computed(() => {
  if (!lineLinkCode.value?.expiresAt) {
    return '-'
  }

  return new Date(lineLinkCode.value.expiresAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const hasLineLinkCode = computed(() => Boolean(lineLinkCode.value?.code))

const lineBotDisplayName = computed(() => {
  const displayName = config.public.line?.botDisplayName?.trim()
  return displayName || 'MyLife Bot'
})

const lineBotAddFriendUrl = computed(() => config.public.line?.botAddFriendUrl?.trim() || '')

const normalizeLineUserIdInput = (value: string) => {
  const normalized = value.trim()
  return /^U[0-9a-f]{32}$/i.test(normalized) ? normalized : ''
}

const getRequestErrorMessage = (error: any, fallbackMessage: string) => {
  return error?.data?.statusMessage || error?.statusMessage || error?.message || fallbackMessage
}

const syncLineForm = () => {
  lineUserIdInput.value = lineStatus.value.lineUserId
  lineNotificationsEnabled.value = lineStatus.value.connected
    ? lineStatus.value.notificationsEnabled
    : true
}

const stopLineStatusPolling = () => {
  if (lineStatusPollingTimer) {
    clearInterval(lineStatusPollingTimer)
    lineStatusPollingTimer = null
  }
}

const loadLineStatus = async (options: { silent?: boolean, notifyOnConnect?: boolean } = {}) => {
  const shouldShowLoader = !options.silent
  const wasConnected = lineStatus.value.connected

  if (shouldShowLoader) {
    isLineLoading.value = true
  }

  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/status')
    syncLineForm()

    if (lineStatus.value.connected) {
      stopLineStatusPolling()
      lineLinkCode.value = null

      if (options.notifyOnConnect && !wasConnected) {
        toastSuccess('เชื่อมต่อ LINE สำเร็จแล้ว')
      }
    }
  } catch (error: any) {
    console.error('Load line status error:', error)
    if (!options.silent) {
      lineStatus.value = createEmptyLineStatus()
    }
  } finally {
    if (shouldShowLoader) {
      isLineLoading.value = false
    }
  }
}

const startLineStatusPolling = () => {
  if (!import.meta.client) {
    return
  }

  stopLineStatusPolling()

  lineStatusPollingTimer = window.setInterval(async () => {
    if (!lineLinkCode.value) {
      stopLineStatusPolling()
      return
    }

    if (new Date(lineLinkCode.value.expiresAt).getTime() <= Date.now()) {
      lineLinkCode.value = null
      stopLineStatusPolling()
      return
    }

    await supabase.auth.refreshSession()
    await loadLineStatus({ silent: true, notifyOnConnect: true })
  }, 4000)
}

const copyTextToClipboard = async (text: string, successMessage: string) => {
  if (!import.meta.client || !navigator.clipboard) {
    toastError('เบราว์เซอร์นี้ยังไม่รองรับการคัดลอกอัตโนมัติ')
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    toastSuccess(successMessage)
    return true
  } catch (error) {
    console.error('Clipboard write error:', error)
    toastError('คัดลอกข้อความไม่สำเร็จ')
    return false
  }
}

const copyLineLinkCode = async () => {
  if (!lineLinkCode.value?.code) {
    return
  }

  await copyTextToClipboard(lineLinkCode.value.code, 'คัดลอกข้อความเชื่อม LINE แล้ว')
}

const getLineShareUrl = (message: string) => `https://line.me/R/msg/text/?${encodeURIComponent(message)}`

const openLineComposer = (message: string) => {
  if (!import.meta.client) {
    return
  }

  window.open(getLineShareUrl(message), '_blank', 'noopener,noreferrer')
}

const saveLineConnection = async (lineUserId: string) => {
  lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/connect', {
    method: 'POST',
    body: {
      lineUserId,
      notificationsEnabled: lineNotificationsEnabled.value,
    },
  })

  syncLineForm()
  lineLinkCode.value = null
  stopLineStatusPolling()
}

const generateLineLinkCode = async (options: { openLine?: boolean } = {}) => {
  if (isGeneratingLineCode.value || isSavingLine.value || isTestingLine.value) {
    return
  }

  isGeneratingLineCode.value = true

  try {
    lineLinkCode.value = await $fetch<LineLinkCodeResponse>('/api/line/link-code', {
      method: 'POST',
      body: {
        notificationsEnabled: lineNotificationsEnabled.value,
      },
    })

    await copyTextToClipboard(
      lineLinkCode.value.code,
      'คัดลอกข้อความเชื่อม LINE แล้ว ส่งข้อความนี้ให้ LINE bot ได้เลย',
    )

    if (options.openLine) {
      openLineComposer(lineLinkCode.value.code)
    }

    startLineStatusPolling()
  } catch (error: any) {
    console.error('Generate line link code error:', error)
    toastError(getRequestErrorMessage(error, 'สร้างโค้ดเชื่อมต่อ LINE ไม่สำเร็จ'))
  } finally {
    isGeneratingLineCode.value = false
  }
}

const openLineForConnection = async () => {
  if (lineLinkCode.value?.code) {
    openLineComposer(lineLinkCode.value.code)
    return
  }

  await generateLineLinkCode({ openLine: true })
}

const refreshLineStatus = async () => {
  await supabase.auth.refreshSession()
  await loadLineStatus({ notifyOnConnect: true })

  if (!lineStatus.value.connected) {
    toastError('ยังไม่พบการเชื่อมต่อ LINE ในตอนนี้')
  }
}

const connectLine = async () => {
  if (isSavingLine.value || isTestingLine.value) {
    return
  }

  const lineUserId = normalizeLineUserIdInput(lineUserIdInput.value)

  if (!lineUserId) {
    toastError('กรุณากรอก LINE User ID ให้ถูกต้อง')
    return
  }

  isSavingLine.value = true

  try {
    await saveLineConnection(lineUserId)
    toastSuccess('บันทึกการเชื่อมต่อ LINE สำเร็จ')
  } catch (error: any) {
    console.error('Connect line error:', error)
    toastError(getRequestErrorMessage(error, 'เชื่อมต่อ LINE ไม่สำเร็จ'))
  } finally {
    isSavingLine.value = false
  }
}

const saveLinePreferences = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) {
    return
  }

  isSavingLine.value = true

  try {
    await saveLineConnection(lineStatus.value.lineUserId)
    toastSuccess('บันทึกการตั้งค่าแจ้งเตือน LINE แล้ว')
  } catch (error: any) {
    console.error('Save line preferences error:', error)
    toastError(getRequestErrorMessage(error, 'บันทึกการตั้งค่าแจ้งเตือนไม่สำเร็จ'))
  } finally {
    isSavingLine.value = false
  }
}

const disconnectLine = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) {
    return
  }

  isSavingLine.value = true

  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/disconnect', {
      method: 'POST',
    })

    syncLineForm()
    toastSuccess('ยกเลิกการเชื่อมต่อ LINE แล้ว')
  } catch (error: any) {
    console.error('Disconnect line error:', error)
    toastError(getRequestErrorMessage(error, 'ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ'))
  } finally {
    isSavingLine.value = false
  }
}

const sendLineTestMessage = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) {
    return
  }

  isTestingLine.value = true

  try {
    await $fetch('/api/line/test', {
      method: 'POST',
    })

    toastSuccess('ส่งข้อความทดสอบไปที่ LINE แล้ว')
  } catch (error: any) {
    console.error('Test line message error:', error)
    toastError(getRequestErrorMessage(error, 'ส่งข้อความทดสอบไม่สำเร็จ'))
  } finally {
    isTestingLine.value = false
  }
}

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const authUser = userData.user

    if (!authUser) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      const missingTableCodes = ['42P01', 'PGRST205']

      if (missingTableCodes.includes(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง profiles ในโปรเจ็กต์นี้ จึงแสดงเฉพาะข้อมูลจาก Auth ก่อน'
        profileRow.value = null
        return
      }

      throw error
    }

    profileRow.value = data as ProfileRow | null
  } catch (error: any) {
    console.error('Load profile error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadLineStatus()
})

onBeforeUnmount(() => {
  stopLineStatusPolling()
})
</script>