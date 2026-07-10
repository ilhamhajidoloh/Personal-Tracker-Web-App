<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <!-- Page Header -->
      <header class="sticky top-0 z-10 px-6 md:px-8 py-5 glass-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">👤 โปรไฟล์</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">ข้อมูลบัญชีผู้ใช้และการตั้งค่า</p>
        </div>
        <button
          @click="loadProfile"
          :disabled="isLoading"
          class="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed self-start"
        >
          {{ isLoading ? 'กำลังโหลด...' : '↻ รีเฟรช' }}
        </button>
      </header>

      <div class="max-w-5xl mx-auto px-6 md:px-8 py-6 space-y-5">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm flex items-center gap-2"
        >
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Loading -->
        <div
          v-if="isLoading"
          class="glass-card px-6 py-12 flex items-center justify-center gap-3"
        >
          <span class="inline-block w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
          <span class="text-gray-400">กำลังโหลดข้อมูลโปรไฟล์...</span>
        </div>

        <template v-else>
          <!-- Profile Section -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Avatar Card -->
            <div class="lg:col-span-1 glass-card p-6 flex flex-col items-start">
              <!-- Avatar -->
              <div class="relative mb-4">
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-violet-500/25">
                  {{ avatarFallback }}
                </div>
                <div
                  class="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs"
                  :class="emailConfirmed ? 'bg-emerald-500' : 'bg-amber-500'"
                  :title="emailConfirmed ? 'อีเมลยืนยันแล้ว' : 'ยังไม่ยืนยันอีเมล'"
                >{{ emailConfirmed ? '✓' : '!' }}</div>
              </div>

              <h2 class="text-lg font-bold text-white leading-tight">{{ displayName }}</h2>
              <p class="text-xs text-gray-500 mt-1 break-all">{{ currentUser?.email || '-' }}</p>

              <div class="mt-4 w-full space-y-2">
                <div class="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                  <span class="text-xs text-gray-500">ชื่อ</span>
                  <span class="text-xs font-medium text-white">{{ firstName }}</span>
                </div>
                <div class="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                  <span class="text-xs text-gray-500">นามสกุล</span>
                  <span class="text-xs font-medium text-white">{{ lastName }}</span>
                </div>
                <div class="flex items-center justify-between py-1.5">
                  <span class="text-xs text-gray-500">สถานะอีเมล</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="emailConfirmed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'">
                    {{ emailConfirmed ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Account Info Card -->
            <div class="lg:col-span-2 section-card">
              <div class="px-5 py-4 border-b border-gray-800/60">
                <h3 class="text-base font-semibold text-white">ข้อมูลบัญชี</h3>
                <p class="text-xs text-gray-500 mt-0.5">ข้อมูลหลักของบัญชีผู้ใช้</p>
              </div>
              <div class="divide-y divide-gray-800/50">
                <div
                  v-for="row in importantProfileRows"
                  :key="row.key"
                  class="flex items-start gap-4 px-5 py-3 hover:bg-gray-800/20 transition-all"
                >
                  <span class="text-xs text-gray-500 uppercase tracking-wide font-medium w-28 shrink-0 pt-0.5">{{ row.key }}</span>
                  <span class="text-sm text-gray-300 break-all flex-1">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- LINE Integration -->
          <section class="section-card">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl shrink-0">💬</div>
                <div>
                  <h3 class="text-base font-semibold text-white">LINE Integration</h3>
                  <p class="text-xs text-gray-500 mt-0.5">ผูก LINE เพื่อรับแจ้งเตือนเมื่อเพิ่มหรือแก้ไขงาน/กิจกรรม</p>
                </div>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0"
                :class="lineStatusBadgeClass"
              >
                {{ lineStatusLabel }}
              </span>
            </div>

            <div class="p-5">
              <div v-if="isLineLoading" class="flex items-center gap-2 text-sm text-gray-400 py-4">
                <span class="inline-block w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
                กำลังตรวจสอบการเชื่อมต่อ LINE...
              </div>

              <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <!-- Left: Status + Easy connect -->
                <div class="space-y-4">
                  <!-- Status info -->
                  <div class="grid grid-cols-3 gap-3">
                    <div class="col-span-2 border border-gray-800/70 rounded-xl p-3">
                      <p class="text-[11px] text-gray-500 uppercase tracking-wide">LINE User ID</p>
                      <p class="text-xs text-gray-300 break-all mt-1">{{ lineStatus.lineUserId || '—' }}</p>
                    </div>
                    <div class="border border-gray-800/70 rounded-xl p-3">
                      <p class="text-[11px] text-gray-500 uppercase tracking-wide">แจ้งเตือน</p>
                      <p class="text-xs mt-1 font-semibold" :class="lineStatus.notificationsEnabled && lineStatus.connected ? 'text-emerald-400' : 'text-gray-400'">
                        {{ lineStatus.connected ? (lineStatus.notificationsEnabled ? 'เปิด' : 'ปิด') : '—' }}
                      </p>
                    </div>
                  </div>

                  <!-- Easy connect box -->
                  <div class="rounded-xl border border-sky-500/20 bg-sky-500/8 p-4 space-y-3">
                    <div>
                      <p class="text-sm font-semibold text-white">เชื่อมต่อแบบง่าย</p>
                      <p class="text-xs text-sky-200 mt-1 leading-relaxed">ไม่ต้องหา LINE User ID เอง ระบบจะสร้างข้อความให้ ส่งไปหา {{ lineBotDisplayName }} ได้เลย</p>
                    </div>

                    <div class="bg-sky-500/8 border border-sky-500/15 rounded-lg p-3 space-y-1 text-xs text-sky-200">
                      <p class="font-medium text-white">วิธีการเชื่อมต่อ</p>
                      <p>1. กดสร้างโค้ดเชื่อมต่อด้านล่าง</p>
                      <p>2. ส่งข้อความนั้นไปหา {{ lineBotDisplayName }}</p>
                      <p>3. ระบบจะผูก LINE account ให้อัตโนมัติ</p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <a
                        v-if="lineBotAddFriendUrl"
                        :href="lineBotAddFriendUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 text-xs text-gray-300 hover:text-white transition-all"
                      >
                        เพิ่มเพื่อน {{ lineBotDisplayName }}
                      </a>

                      <button
                        type="button"
                        @click="generateLineLinkCode()"
                        :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                        class="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition-all"
                      >
                        {{ isGeneratingLineCode ? 'กำลังสร้าง...' : (hasLineLinkCode ? 'สร้างโค้ดใหม่' : 'สร้างโค้ดเชื่อมต่อ') }}
                      </button>

                      <button
                        type="button"
                        @click="openLineForConnection"
                        :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                        class="px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all"
                      >
                        เปิด LINE พร้อมข้อความ
                      </button>

                      <button
                        type="button"
                        @click="refreshLineStatus"
                        :disabled="isLineLoading || isGeneratingLineCode"
                        class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-400 hover:text-white transition-all"
                      >
                        ตรวจสอบสถานะ
                      </button>
                    </div>

                    <!-- Link code display -->
                    <div v-if="lineLinkCode" class="space-y-2">
                      <div class="rounded-xl border border-gray-700/60 bg-gray-900/60 p-3">
                        <p class="text-[11px] text-gray-500 uppercase tracking-wide mb-2">ข้อความที่ต้องส่งหา LINE bot</p>
                        <textarea
                          :value="lineLinkCode.code"
                          rows="3"
                          readonly
                          class="w-full bg-gray-800/70 border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none resize-none"
                        ></textarea>
                        <div class="mt-2 flex items-center justify-between gap-2">
                          <p class="text-[11px] text-gray-500">หมดอายุ {{ lineLinkCodeExpiresAtText }}</p>
                          <button
                            type="button"
                            @click="copyLineLinkCode"
                            class="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-[11px] text-gray-300 transition-all"
                          >คัดลอก</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Preferences + Manual -->
                <div class="space-y-4">
                  <!-- Notifications preference -->
                  <div class="rounded-xl border border-gray-800/70 bg-gray-800/20 p-4 space-y-3">
                    <h4 class="text-sm font-semibold text-white">การแจ้งเตือน</h4>
                    <label class="flex items-start gap-3 p-3 border border-gray-800/60 rounded-xl bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 transition-all">
                      <input
                        v-model="lineNotificationsEnabled"
                        type="checkbox"
                        class="mt-0.5 accent-violet-500"
                      >
                      <span class="text-xs text-gray-300 leading-relaxed">รับแจ้งเตือนใน LINE เมื่อมีการเพิ่มหรือแก้ไขงานและกิจกรรม</span>
                    </label>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        @click="saveLinePreferences"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all"
                      >
                        {{ isSavingLine ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
                      </button>
                      <button
                        type="button"
                        @click="sendLineTestMessage"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-300 hover:text-white transition-all"
                      >
                        {{ isTestingLine ? 'กำลังส่ง...' : 'ทดสอบ' }}
                      </button>
                      <button
                        type="button"
                        @click="disconnectLine"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-rose-400 transition-all"
                      >
                        ยกเลิกการเชื่อมต่อ
                      </button>
                    </div>
                  </div>

                  <!-- Manual connect (collapsed) -->
                  <details class="rounded-xl border border-gray-800/70 bg-gray-800/20 overflow-hidden">
                    <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white list-none flex items-center justify-between transition-colors">
                      <span>เชื่อมต่อแบบกรอก LINE User ID เอง</span>
                      <span class="text-gray-500 text-xs">คลิกเพื่อขยาย</span>
                    </summary>
                    <form class="px-4 pb-4 space-y-3 border-t border-gray-800/60 pt-4" @submit.prevent="connectLine">
                      <div>
                        <label class="block text-xs font-medium text-gray-400 mb-1.5">LINE User ID</label>
                        <input
                          v-model="lineUserIdInput"
                          type="text"
                          autocomplete="off"
                          placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        >
                        <p class="text-[11px] text-gray-600 mt-1.5">ใช้เฉพาะกรณีที่คุณมี LINE User ID อยู่แล้ว</p>
                      </div>
                      <button
                        type="submit"
                        :disabled="isSavingLine || isTestingLine"
                        class="w-full px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300 hover:text-white transition-all font-medium"
                      >
                        {{ isSavingLine ? 'กำลังบันทึก...' : (lineStatus.connected ? 'อัปเดตการเชื่อมต่อ' : 'เชื่อมต่อ') }}
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            </div>
          </section>

          <!-- Google Calendar Integration -->
          <section class="section-card">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-xl shrink-0">📅</div>
                <div>
                  <h3 class="text-base font-semibold text-white">Google Calendar</h3>
                  <p class="text-xs text-gray-500 mt-0.5">ส่งกิจกรรมที่เพิ่ม/แก้ไขในแท็บกิจกรรมไปยัง Google Calendar อัตโนมัติ</p>
                </div>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0"
                :class="googleStatusBadgeClass"
              >
                {{ googleStatusLabel }}
              </span>
            </div>

            <div class="p-5">
              <div v-if="isGoogleLoading" class="flex items-center gap-2 text-sm text-gray-400 py-4">
                <span class="inline-block w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
                กำลังตรวจสอบการเชื่อมต่อ Google Calendar...
              </div>

              <div v-else class="flex flex-wrap items-center gap-2">
                <a
                  v-if="!googleStatus.connected"
                  href="/api/google/auth"
                  class="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition-all"
                >
                  เชื่อมต่อ Google Calendar
                </a>
                <button
                  v-else
                  type="button"
                  @click="disconnectGoogle"
                  :disabled="isDisconnectingGoogle"
                  class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-rose-400 transition-all"
                >
                  {{ isDisconnectingGoogle ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ' }}
                </button>
                <button
                  type="button"
                  @click="refreshGoogleStatus"
                  :disabled="isGoogleLoading"
                  class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-400 hover:text-white transition-all"
                >
                  ตรวจสอบสถานะ
                </button>
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

type GoogleCalendarStatus = {
  connected: boolean
  connectedAt: string | null
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Profile' })

const router = useRouter()
const route = useRoute()
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
  connected: false, lineUserId: '', notificationsEnabled: false, connectedAt: null,
})
const lineLinkCode = ref<LineLinkCodeResponse | null>(null)
const lineUserIdInput = ref('')
const lineNotificationsEnabled = ref(true)

const isGoogleLoading = ref(true)
const isDisconnectingGoogle = ref(false)
const googleStatus = ref<GoogleCalendarStatus>({ connected: false, connectedAt: null })

let lineStatusPollingTimer: ReturnType<typeof setInterval> | null = null

const currentUser = computed(() => user.value)
const createEmptyLineStatus = (): LineConnectionStatus => ({ connected: false, lineUserId: '', notificationsEnabled: false, connectedAt: null })

const getProfileValue = (...values: unknown[]) => {
  const matchedValue = values.find(value => typeof value === 'string' && value.trim())
  return typeof matchedValue === 'string' ? matchedValue.trim() : ''
}

const getFallbackNamePart = (index: number) => {
  const [first = '', ...rest] = displayName.value.split(' ').filter(Boolean)
  return index === 0 ? first : rest.join(' ')
}

const firstName = computed(() => getProfileValue(profileRow.value?.first_name, currentUser.value?.user_metadata?.first_name, currentUser.value?.user_metadata?.given_name, getFallbackNamePart(0)) || '-')
const lastName = computed(() => getProfileValue(profileRow.value?.last_name, currentUser.value?.user_metadata?.last_name, currentUser.value?.user_metadata?.family_name, getFallbackNamePart(1)) || '-')
const displayName = computed<string>(() => getProfileValue(profileRow.value?.display_name, profileRow.value?.full_name) || getProfileValue(currentUser.value?.user_metadata?.full_name, currentUser.value?.user_metadata?.name) || currentUser.value?.email?.split('@')[0] || '')
const avatarFallback = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')
const emailConfirmed = computed(() => Boolean(currentUser.value?.email_confirmed_at))

const createdAtText = computed(() => currentUser.value?.created_at ? new Date(currentUser.value.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-')
const lastSignInText = computed(() => currentUser.value?.last_sign_in_at ? new Date(currentUser.value.last_sign_in_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-')

const importantProfileRows = computed(() => [
  { key: 'ชื่อ', value: firstName.value },
  { key: 'นามสกุล', value: lastName.value },
  { key: 'ชื่อที่แสดง', value: displayName.value || '-' },
  { key: 'อีเมล', value: currentUser.value?.email || '-' },
  { key: 'สถานะอีเมล', value: emailConfirmed.value ? 'ยืนยันแล้ว ✓' : 'ยังไม่ยืนยัน' },
  { key: 'สมัครเมื่อ', value: createdAtText.value },
  { key: 'เข้าใช้ล่าสุด', value: lastSignInText.value },
])

const lineStatusLabel = computed(() => {
  if (!lineStatus.value.connected) return 'ยังไม่ได้เชื่อมต่อ'
  return lineStatus.value.notificationsEnabled ? 'เชื่อมต่อแล้ว · แจ้งเตือนเปิด' : 'เชื่อมต่อแล้ว · แจ้งเตือนปิด'
})

const lineStatusBadgeClass = computed(() => {
  if (!lineStatus.value.connected) return 'border-gray-700 bg-gray-800/40 text-gray-400'
  return lineStatus.value.notificationsEnabled
    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
    : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
})

const googleStatusLabel = computed(() => googleStatus.value.connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ')

const googleStatusBadgeClass = computed(() => googleStatus.value.connected
  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  : 'border-gray-700 bg-gray-800/40 text-gray-400')

const lineLinkCodeExpiresAtText = computed(() => lineLinkCode.value?.expiresAt ? new Date(lineLinkCode.value.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '-')
const hasLineLinkCode = computed(() => Boolean(lineLinkCode.value?.code))
const lineBotDisplayName = computed(() => config.public.line?.botDisplayName?.trim() || 'MyLife Bot')
const lineBotAddFriendUrl = computed(() => config.public.line?.botAddFriendUrl?.trim() || '')

const normalizeLineUserIdInput = (value: string) => {
  const normalized = value.trim()
  return /^U[0-9a-f]{32}$/i.test(normalized) ? normalized : ''
}

const getRequestErrorMessage = (error: any, fallbackMessage: string) => error?.data?.statusMessage || error?.statusMessage || error?.message || fallbackMessage

const syncLineForm = () => {
  lineUserIdInput.value = lineStatus.value.lineUserId
  lineNotificationsEnabled.value = lineStatus.value.connected ? lineStatus.value.notificationsEnabled : true
}

const stopLineStatusPolling = () => {
  if (lineStatusPollingTimer) { clearInterval(lineStatusPollingTimer); lineStatusPollingTimer = null }
}

const loadLineStatus = async (options: { silent?: boolean, notifyOnConnect?: boolean } = {}) => {
  const shouldShowLoader = !options.silent
  const wasConnected = lineStatus.value.connected
  if (shouldShowLoader) isLineLoading.value = true
  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/status')
    syncLineForm()
    if (lineStatus.value.connected) {
      stopLineStatusPolling()
      lineLinkCode.value = null
      if (options.notifyOnConnect && !wasConnected) toastSuccess('เชื่อมต่อ LINE สำเร็จแล้ว')
    }
  } catch (error: any) {
    console.error('Load line status error:', error)
    if (!options.silent) lineStatus.value = createEmptyLineStatus()
  } finally {
    if (shouldShowLoader) isLineLoading.value = false
  }
}

const startLineStatusPolling = () => {
  if (!import.meta.client) return
  stopLineStatusPolling()
  lineStatusPollingTimer = window.setInterval(async () => {
    if (!lineLinkCode.value) { stopLineStatusPolling(); return }
    if (new Date(lineLinkCode.value.expiresAt).getTime() <= Date.now()) { lineLinkCode.value = null; stopLineStatusPolling(); return }
    await supabase.auth.refreshSession()
    await loadLineStatus({ silent: true, notifyOnConnect: true })
  }, 4000)
}

const copyTextToClipboard = async (text: string, successMessage: string) => {
  if (!import.meta.client || !navigator.clipboard) { toastError('เบราว์เซอร์ยังไม่รองรับการคัดลอก'); return false }
  try { await navigator.clipboard.writeText(text); toastSuccess(successMessage); return true }
  catch (error) { console.error('Clipboard write error:', error); toastError('คัดลอกข้อความไม่สำเร็จ'); return false }
}

const copyLineLinkCode = async () => {
  if (!lineLinkCode.value?.code) return
  await copyTextToClipboard(lineLinkCode.value.code, 'คัดลอกข้อความเชื่อม LINE แล้ว')
}

const getLineShareUrl = (message: string) => `https://line.me/R/msg/text/?${encodeURIComponent(message)}`
const openLineComposer = (message: string) => { if (!import.meta.client) return; window.open(getLineShareUrl(message), '_blank', 'noopener,noreferrer') }

const saveLineConnection = async (lineUserId: string) => {
  lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/connect', {
    method: 'POST', body: { lineUserId, notificationsEnabled: lineNotificationsEnabled.value },
  })
  syncLineForm()
  lineLinkCode.value = null
  stopLineStatusPolling()
}

const generateLineLinkCode = async (options: { openLine?: boolean } = {}) => {
  if (isGeneratingLineCode.value || isSavingLine.value || isTestingLine.value) return
  isGeneratingLineCode.value = true
  try {
    lineLinkCode.value = await $fetch<LineLinkCodeResponse>('/api/line/link-code', {
      method: 'POST', body: { notificationsEnabled: lineNotificationsEnabled.value },
    })
    await copyTextToClipboard(lineLinkCode.value.code, 'คัดลอกข้อความเชื่อม LINE แล้ว')
    if (options.openLine) openLineComposer(lineLinkCode.value.code)
    startLineStatusPolling()
  } catch (error: any) {
    console.error('Generate line link code error:', error)
    toastError(getRequestErrorMessage(error, 'สร้างโค้ดเชื่อมต่อ LINE ไม่สำเร็จ'))
  } finally {
    isGeneratingLineCode.value = false
  }
}

const openLineForConnection = async () => {
  if (lineLinkCode.value?.code) { openLineComposer(lineLinkCode.value.code); return }
  await generateLineLinkCode({ openLine: true })
}

const refreshLineStatus = async () => {
  await supabase.auth.refreshSession()
  await loadLineStatus({ notifyOnConnect: true })
  if (!lineStatus.value.connected) toastError('ยังไม่พบการเชื่อมต่อ LINE')
}

const connectLine = async () => {
  if (isSavingLine.value || isTestingLine.value) return
  const lineUserId = normalizeLineUserIdInput(lineUserIdInput.value)
  if (!lineUserId) { toastError('กรุณากรอก LINE User ID ให้ถูกต้อง'); return }
  isSavingLine.value = true
  try { await saveLineConnection(lineUserId); toastSuccess('บันทึกการเชื่อมต่อ LINE สำเร็จ') }
  catch (error: any) { console.error('Connect line error:', error); toastError(getRequestErrorMessage(error, 'เชื่อมต่อ LINE ไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const saveLinePreferences = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isSavingLine.value = true
  try { await saveLineConnection(lineStatus.value.lineUserId); toastSuccess('บันทึกการตั้งค่าแจ้งเตือน LINE แล้ว') }
  catch (error: any) { console.error('Save line preferences error:', error); toastError(getRequestErrorMessage(error, 'บันทึกการตั้งค่าแจ้งเตือนไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const disconnectLine = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isSavingLine.value = true
  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/disconnect', { method: 'POST' })
    syncLineForm()
    toastSuccess('ยกเลิกการเชื่อมต่อ LINE แล้ว')
  }
  catch (error: any) { console.error('Disconnect line error:', error); toastError(getRequestErrorMessage(error, 'ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const sendLineTestMessage = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isTestingLine.value = true
  try { await $fetch('/api/line/test', { method: 'POST' }); toastSuccess('ส่งข้อความทดสอบไปที่ LINE แล้ว') }
  catch (error: any) { console.error('Test line message error:', error); toastError(getRequestErrorMessage(error, 'ส่งข้อความทดสอบไม่สำเร็จ')) }
  finally { isTestingLine.value = false }
}

const loadGoogleStatus = async () => {
  isGoogleLoading.value = true
  try {
    googleStatus.value = await $fetch<GoogleCalendarStatus>('/api/google/status')
  } catch (error) {
    console.error('Load Google Calendar status error:', error)
    googleStatus.value = { connected: false, connectedAt: null }
  } finally {
    isGoogleLoading.value = false
  }
}

const refreshGoogleStatus = async () => {
  await loadGoogleStatus()
  if (!googleStatus.value.connected) toastError('ยังไม่พบการเชื่อมต่อ Google Calendar')
}

const disconnectGoogle = async () => {
  if (!googleStatus.value.connected || isDisconnectingGoogle.value) return
  isDisconnectingGoogle.value = true
  try {
    googleStatus.value = await $fetch<GoogleCalendarStatus>('/api/google/disconnect', { method: 'POST' })
    toastSuccess('ยกเลิกการเชื่อมต่อ Google Calendar แล้ว')
  } catch (error: any) {
    console.error('Disconnect Google Calendar error:', error)
    toastError(getRequestErrorMessage(error, 'ยกเลิกการเชื่อมต่อ Google Calendar ไม่สำเร็จ'))
  } finally {
    isDisconnectingGoogle.value = false
  }
}

const consumeGoogleRedirectStatus = () => {
  const googleQuery = route.query.google
  if (!googleQuery) return
  if (googleQuery === 'success') toastSuccess('เชื่อมต่อ Google Calendar สำเร็จแล้ว')
  else if (googleQuery === 'error') toastError('เชื่อมต่อ Google Calendar ไม่สำเร็จ กรุณาลองใหม่')
  const { google, ...restQuery } = route.query
  router.replace({ query: restQuery })
}

const loadProfile = async () => {
  isLoading.value = true; errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle()
    if (error) {
      if (['42P01', 'PGRST205'].includes(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง profiles ในโปรเจ็กต์นี้ จึงแสดงเฉพาะข้อมูลจาก Auth'
        profileRow.value = null; return
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

onMounted(() => { loadProfile(); loadLineStatus(); loadGoogleStatus(); consumeGoogleRedirectStatus() })
onBeforeUnmount(() => { stopLineStatusPolling() })
</script>
