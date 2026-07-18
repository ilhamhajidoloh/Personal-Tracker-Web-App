<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
      <!-- Page head -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="eyebrow">กิจกรรม · Events</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">กิจกรรมและนัดหมาย</h1>
          <p class="text-xs mt-2 text-gray-400 font-medium">กำลังจะมาถึง {{ upcomingEventsCount }} &bull; ที่ผ่านมา {{ pastEventsCount }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="isEntryModalOpen = true"
            class="btn-primary text-sm inline-flex items-center gap-2 tap-scale touch-target"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่มกิจกรรม
          </button>
          <button
            @click="loadEvents"
            :disabled="isLoading"
            class="btn-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
          >
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>
      </div>

      <div class="space-y-5 mt-6">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm flex items-center gap-2"
        >
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Events List -->
        <section class="section-card">
          <div class="flex flex-col gap-3 px-5 py-4 border-b border-gray-800/60">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-white">รายการกิจกรรม</h2>
              <span class="text-xs px-2.5 py-1 rounded-full" style="background: var(--bg-elevated); color: var(--text-secondary);">{{ eventPageInfo }}</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-end">
              <select
                v-model.number="eventItemsPerPage"
                @change="eventCurrentPage = 1"
                class="text-sm px-3 py-2 rounded-xl focus:outline-none transition-all"
                style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-primary);"
              >
                <option value="10">10 รายการ/หน้า</option>
                <option value="20">20 รายการ/หน้า</option>
                <option value="50">50 รายการ/หน้า</option>
              </select>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="p-5 space-y-3">
            <div v-for="i in 3" :key="i" class="h-20 rounded-xl bg-gray-800/60 animate-pulse"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="!events.length" class="flex flex-col items-center justify-center py-16 text-center px-5">
            <div class="w-16 h-16 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-4">🗓️</div>
            <p class="text-base font-semibold text-gray-300">ยังไม่มีกิจกรรม</p>
            <p class="text-sm text-gray-500 mt-1">กดปุ่มด้านบนเพื่อเพิ่มกิจกรรมแรก</p>
            <button
              @click="isEntryModalOpen = true"
              class="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-sm font-medium text-violet-300 transition-all tap-scale touch-target"
            >
              + เพิ่มกิจกรรม
            </button>
          </div>

          <!-- Event cards -->
          <div v-else class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="item in paginatedEvents"
              :key="item.id"
              class="relative rounded-[10px] overflow-hidden p-4 pl-5 tap-scale transition-all"
              style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm);"
            >
              <!-- Status stripe -->
              <span class="absolute left-0 top-0 bottom-0 w-1" :style="{ background: getEventStatusTextStyle(item).color }"></span>

              <!-- Top: badges + date -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wide whitespace-nowrap"
                    :style="getEventStatusBadgeStyle(item)"
                  >{{ getEventStatusText(item) }}</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-md border font-semibold whitespace-nowrap"
                    :class="getEventBadgeClass(item.event_type)"
                  >{{ getEventTypeName(item.event_type) }}</span>
                </div>
                <div class="shrink-0 text-center rounded-lg px-2.5 py-1.5 border" :style="getEventDateBadgeStyle(item)">
                  <div class="num text-[9px] font-bold uppercase leading-none" :style="getEventStatusTextStyle(item)">{{ getMonthShort(item.start_date) }}</div>
                  <div class="num text-lg font-bold leading-none mt-0.5" style="color: var(--text-primary);">{{ getDay(item.start_date) }}</div>
                </div>
              </div>

              <!-- Title + datetime -->
              <h3 class="text-[15px] font-semibold mt-2.5 line-clamp-2" style="color: var(--text-primary);">{{ item.title }}</h3>
              <p class="num text-[11px] mt-1.5 font-medium" :style="getEventStatusTextStyle(item)">{{ displayEventDateTime(item) }}</p>

              <div v-if="item.reminder_minutes || item.google_event_id" class="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                <span v-if="item.reminder_minutes" class="num text-[10px]" style="color: var(--event-status-soon-ink);">⏰ เตือนก่อน {{ getReminderLabel(item.reminder_minutes) }}</span>
                <span v-if="item.google_event_id" class="num text-[10px]" style="color: var(--ink-sky);">ซิงก์ Google แล้ว</span>
              </div>
              <p v-if="item.description" class="text-xs mt-1.5 line-clamp-2" style="color: var(--text-muted);">{{ item.description }}</p>

              <!-- Actions -->
              <div class="flex items-center gap-1 mt-3 pt-3" style="border-top: 1px solid var(--border-subtle);">
                <button
                  @click="syncSingleEvent(item.id)"
                  :disabled="isSyncingId === item.id || isDeletingId === item.id"
                  class="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all tap-scale touch-target"
                  style="color: var(--ink-emerald);"
                  :title="item.google_event_id ? 'ซิงค์ซ้ำเพื่ออัปเดต Google Calendar' : 'ซิงค์ไปยัง Google Calendar'"
                >
                  <span v-if="isSyncingId === item.id" class="w-3.5 h-3.5 border-2 rounded-full animate-spin" style="border-color: var(--border-strong); border-top-color: var(--ink-emerald);"></span>
                  <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
                </button>
                <button
                  @click="openEditModal(item)"
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all tap-scale touch-target"
                  style="color: var(--ink-sky);"
                  title="แก้ไข"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button
                  @click="deleteEvent(item.id)"
                  :disabled="isDeletingId === item.id || isSyncingId === item.id"
                  class="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all tap-scale touch-target ml-auto"
                  style="color: var(--ink-rose);"
                  title="ลบ"
                >
                  <svg v-if="isDeletingId !== item.id" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                  <span v-else class="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin" style="border-color: var(--border-strong); border-top-color: var(--ink-rose);"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="eventTotalPages > 1" class="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-800/60">
            <button
              @click="eventCurrentPage = Math.max(1, eventCurrentPage - 1)"
              :disabled="eventCurrentPage === 1"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
              :style="eventCurrentPage === 1 ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
            >
              ← ก่อนหน้า
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="page in eventTotalPages"
                :key="page"
                @click="eventCurrentPage = page"
                class="w-9 h-9 rounded-lg text-sm font-medium transition-all tap-scale touch-target"
                :style="eventCurrentPage === page
                  ? { 'background': 'var(--brand)', 'color': 'white', 'border': '1px solid var(--brand)' }
                  : { 'background': 'var(--bg-elevated)', 'border': '1px solid var(--border-default)', 'color': 'var(--text-secondary)' }"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="eventCurrentPage = Math.min(eventTotalPages, eventCurrentPage + 1)"
              :disabled="eventCurrentPage === eventTotalPages"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
              :style="eventCurrentPage === eventTotalPages ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
            >
              ต่อไป →
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isEntryModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isEntryModalOpen" class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">🗓️</div>
              <h3 class="text-base font-semibold text-white">{{ isEditing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่' }}</h3>
            </div>
            <button
              @click="() => { isEntryModalOpen = false; resetForm() }"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
            >✕</button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto">
            <form class="space-y-4" @submit.prevent="submitEvent">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">ชื่อกิจกรรม <span class="text-rose-400">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="100"
                  placeholder="เช่น นัดดูหนัง, ทริปต่างจังหวัด..."
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>

              <!-- Event type selector -->
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">รูปแบบเวลา</label>
                <div class="grid grid-cols-3 gap-2">
                  <label
                    v-for="opt in eventTypeOptions"
                    :key="opt.value"
                    class="flex flex-col items-center gap-1.5 p-3 border rounded-xl cursor-pointer transition-all text-center"
                    :class="form.eventType === opt.value
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                      : 'border-gray-700/60 bg-gray-800/60 text-gray-400 hover:border-gray-600'"
                  >
                    <input type="radio" :value="opt.value" v-model="form.eventType" class="sr-only">
                    <span class="text-lg">{{ opt.icon }}</span>
                    <span class="text-[11px] font-medium leading-tight">{{ opt.label }}</span>
                  </label>
                </div>
              </div>

              <!-- Date/time fields -->
              <div class="bg-gray-800/40 border border-gray-800/60 rounded-xl p-4 space-y-3">
                <!-- Same day with time -->
                <template v-if="form.eventType === 'same_day_time'">
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">วันที่ <span class="text-rose-400">*</span></label>
                    <input v-model="form.startDate" type="date" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาเริ่ม</label>
                      <input v-model="form.startTime" type="time" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาสิ้นสุด</label>
                      <input v-model="form.endTime" type="time" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                  </div>
                </template>

                <!-- All day -->
                <template v-if="form.eventType === 'same_day_all_day'">
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1.5">วันที่ <span class="text-rose-400">*</span></label>
                    <input v-model="form.startDate" type="date" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                  </div>
                </template>

                <!-- Multi-day -->
                <template v-if="form.eventType === 'multi_day'">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">วันเริ่ม <span class="text-rose-400">*</span></label>
                      <input v-model="form.startDate" type="date" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาเริ่ม</label>
                      <input v-model="form.startTime" type="time" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">วันสิ้นสุด <span class="text-rose-400">*</span></label>
                      <input v-model="form.endDate" type="date" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาสิ้นสุด</label>
                      <input v-model="form.endTime" type="time" required class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all">
                    </div>
                  </div>
                </template>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">รายละเอียดเพิ่มเติม</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="บันทึกเพิ่มเติม..."
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                ></textarea>
              </div>

              <!-- Reminder selector -->
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">🔔 แจ้งเตือนล่วงหน้า (LINE)</label>
                <select
                  v-model="form.reminderMinutes"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                >
                  <option
                    v-for="opt in activeReminderOptions"
                    :key="String(opt.value)"
                    :value="opt.value"
                  >{{ opt.label }}</option>
                </select>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  @click="() => { isEntryModalOpen = false; resetForm() }"
                  class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale touch-target"
                >ยกเลิก</button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 tap-scale touch-target"
                >
                  <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม' }}
                </button>
              </div>
            </form>
          </div>
        </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isEntryModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { getTodayTH } from '~/utils/date'

type EventTypeType = 'same_day_time' | 'same_day_all_day' | 'multi_day'

type EventRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  event_type: EventTypeType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  reminder_minutes: number | null
  google_event_id: string | null
  created_at: string
}

type EventPayload = {
  title: string
  description: string | null
  event_type: EventTypeType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  reminder_minutes: number | null
  reminder_sent_at: null
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'กิจกรรม' })

const router = useRouter()
const supabase = useSupabaseClient()
const { toastSuccess, toastError, confirmDelete } = useAlert()
const { notify, buildEventSavedMessage } = useLineMessaging()
const { syncEventToGoogle, deleteEventFromGoogle } = useGoogleCalendarSync()

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const isSyncingId = ref('')
const editingId = ref('')
const errorMessage = ref('')
const events = ref<EventRow[]>([])
const currentTime = ref(new Date())
const eventItemsPerPage = ref(20)
const eventCurrentPage = ref(1)
const tableMissingCodes = new Set(['42P01', 'PGRST205'])
const soonThresholdMinutes = 7 * 24 * 60

const eventTypeOptions = [
  { value: 'same_day_time' as EventTypeType, label: 'วันเดียวมีเวลา', icon: '🕐' },
  { value: 'same_day_all_day' as EventTypeType, label: 'ตลอดวัน', icon: '☀️' },
  { value: 'multi_day' as EventTypeType, label: 'ข้ามวัน', icon: '📅' },
]

const reminderOptions = [
  { value: null as number | null, label: 'ไม่แจ้งเตือน' },
  { value: 5, label: '5 นาทีก่อน' },
  { value: 15, label: '15 นาทีก่อน' },
  { value: 30, label: '30 นาทีก่อน' },
  { value: 60, label: '1 ชั่วโมงก่อน' },
  { value: 120, label: '2 ชั่วโมงก่อน' },
  { value: 1440, label: '1 วันก่อน' },
]

const allDayReminderOptions = [
  { value: null as number | null, label: 'ไม่แจ้งเตือน' },
  { value: 1440, label: '1 วันก่อน (08:00)' },
]

const form = reactive({
  title: '',
  description: '',
  eventType: 'same_day_time' as EventTypeType,
  startDate: getTodayTH(),
  startTime: '10:00',
  endDate: getTodayTH(),
  endTime: '12:00',
  reminderMinutes: null as number | null,
})

const activeReminderOptions = computed(() =>
  form.eventType === 'same_day_all_day' ? allDayReminderOptions : reminderOptions,
)

const isEditing = computed(() => Boolean(editingId.value))

const upcomingEventsCount = computed(() => {
  const nowMs = currentTime.value.getTime()
  return events.value.filter(item => {
    const { endMs } = getEventDateTimeBounds(item)
    return endMs >= nowMs
  }).length
})

const pastEventsCount = computed(() => {
  const nowMs = currentTime.value.getTime()
  return events.value.filter(item => {
    const { endMs } = getEventDateTimeBounds(item)
    return endMs < nowMs
  }).length
})

const eventTotalPages = computed(() => Math.ceil(events.value.length / eventItemsPerPage.value))
const paginatedEvents = computed(() => {
  const start = (eventCurrentPage.value - 1) * eventItemsPerPage.value
  const end = start + eventItemsPerPage.value
  return events.value.slice(start, end)
})

const eventPageInfo = computed(() => {
  const total = events.value.length
  if (total === 0) return 'ไม่มีรายการ'
  const start = (eventCurrentPage.value - 1) * eventItemsPerPage.value + 1
  const end = Math.min(eventCurrentPage.value * eventItemsPerPage.value, total)
  return `แสดง ${start}-${end} จาก ${total} รายการ`
})

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.eventType = 'same_day_time'
  form.startDate = getTodayTH()
  form.startTime = '10:00'
  form.endDate = getTodayTH()
  form.endTime = '12:00'
  form.reminderMinutes = null
  editingId.value = ''
}

const openEditModal = (item: EventRow) => {
  editingId.value = item.id
  form.title = item.title
  form.description = item.description || ''
  form.eventType = item.event_type
  form.startDate = item.start_date || getTodayTH()
  form.startTime = item.start_time ? item.start_time.slice(0, 5) : '10:00'
  form.endDate = item.end_date || item.start_date || getTodayTH()
  form.endTime = item.end_time ? item.end_time.slice(0, 5) : '12:00'
  form.reminderMinutes = item.reminder_minutes ?? null
  errorMessage.value = ''
  isEntryModalOpen.value = true
}

const reminderLabelMap: Record<number, string> = { 5: '5 นาที', 15: '15 นาที', 30: '30 นาที', 60: '1 ชั่วโมง', 120: '2 ชั่วโมง', 1440: '1 วัน' }
const getReminderLabel = (minutes: number) => reminderLabelMap[minutes] || `${minutes} นาที`

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
const getMonthShort = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { month: 'short' })
const getDay = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit' })
const formatTime = (timeString: string | null) => timeString ? timeString.slice(0, 5) + ' น.' : ''

const normalizeEventTime = (timeString: string | null, fallback: string) => {
  if (!timeString) return fallback
  return timeString.length === 5 ? `${timeString}:00` : timeString
}

const getEventDateTimeBounds = (item: EventRow) => {
  const endDate = item.end_date || item.start_date
  const startTime = item.event_type === 'same_day_all_day' ? '00:00:00' : normalizeEventTime(item.start_time, '00:00:00')
  const endTime = item.event_type === 'same_day_all_day' ? '23:59:59' : normalizeEventTime(item.end_time, '23:59:59')
  return {
    startMs: new Date(`${item.start_date}T${startTime}`).getTime(),
    endMs: new Date(`${endDate}T${endTime}`).getTime(),
  }
}

const formatStatusDuration = (minutes: number) => {
  const safeMinutes = Math.max(1, Math.ceil(minutes))
  if (safeMinutes < 60) return `${safeMinutes} นาที`
  const hours = Math.floor(safeMinutes / 60)
  const remainMinutes = safeMinutes % 60
  if (hours < 24) return remainMinutes > 0 ? `${hours} ชม. ${remainMinutes} นาที` : `${hours} ชม.`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  if (days < 30) return remainHours > 0 ? `${days} วัน ${remainHours} ชม.` : `${days} วัน`
  const months = Math.floor(days / 30)
  const remainDays = days % 30
  return remainDays > 0 ? `${months} เดือน ${remainDays} วัน` : `${months} เดือน`
}

const getEventStatusMeta = (item: EventRow) => {
  const { startMs, endMs } = getEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntilStart = (startMs - nowMs) / 60000
  const minutesUntilEnd = (endMs - nowMs) / 60000

  if (minutesUntilEnd < 0) {
    return { status: 'past', text: `ผ่านไปแล้ว (${formatStatusDuration(Math.abs(minutesUntilEnd))}ก่อน)` }
  }

  if (minutesUntilStart <= 0) {
    return { status: 'soon', text: 'กำลังจะถึง (กำลังดำเนินอยู่)' }
  }

  if (minutesUntilStart <= soonThresholdMinutes) {
    return { status: 'soon', text: `กำลังจะถึง (อีก ${formatStatusDuration(minutesUntilStart)})` }
  }

  return { status: 'future', text: `ยังไม่ถึง (อีก ${formatStatusDuration(minutesUntilStart)})` }
}

const getEventStatusText = (item: EventRow) => getEventStatusMeta(item).text

const getEventStatusTokenPrefix = (item: EventRow) => `--event-status-${getEventStatusMeta(item).status}`

const getEventStatusBadgeStyle = (item: EventRow) => {
  const prefix = getEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    color: `var(${prefix}-ink)`,
  }
}

const getEventDateBadgeStyle = (item: EventRow) => {
  const prefix = getEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    boxShadow: `var(${prefix}-shadow)`,
  }
}

const getEventRowHoverClass = (item: EventRow) => {
  const status = getEventStatusMeta(item).status
  return status === 'past' ? 'opacity-70' : ''
}

const getEventBadgeClass = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'border-sky-500/30 bg-sky-500/15 text-sky-300'
  if (type === 'same_day_all_day') return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  return 'border-violet-500/30 bg-violet-500/15 text-violet-300'
}

const getEventStatusTextStyle = (item: EventRow) => {
  const prefix = getEventStatusTokenPrefix(item)
  return { color: `var(${prefix}-ink)` }
}

const getEventTypeName = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'ระบุเวลา'
  if (type === 'same_day_all_day') return 'ตลอดวัน'
  return 'ข้ามวัน'
}

const displayEventDateTime = (item: EventRow) => {
  if (item.event_type === 'same_day_all_day') return `ตลอดวัน`
  if (item.event_type === 'same_day_time') return `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`
  if (item.event_type === 'multi_day') return `${formatTime(item.start_time)}  ถึง  ${formatDate(item.end_date || '')} ${formatTime(item.end_time)}`
  return ''
}

const loadEvents = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase.from('events').select('*').eq('user_id', userData.user.id).order('start_date', { ascending: true })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง events ใน Supabase'; events.value = []; return }
      throw error
    }
    events.value = data || []
  } catch (error: any) {
    console.error('Load events error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลกิจกรรมไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const submitEvent = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { await router.push('/login'); return }

    let payloadDateStart = form.startDate
    let payloadTimeStart: string | null = null
    let payloadDateEnd: string | null = null
    let payloadTimeEnd: string | null = null

    if (form.eventType === 'same_day_time') {
      payloadTimeStart = form.startTime; payloadDateEnd = form.startDate; payloadTimeEnd = form.endTime
    } else if (form.eventType === 'same_day_all_day') {
      payloadDateEnd = form.startDate
    } else if (form.eventType === 'multi_day') {
      payloadTimeStart = form.startTime; payloadDateEnd = form.endDate; payloadTimeEnd = form.endTime
    }

    const payload: EventPayload = {
      title: form.title.trim(), description: form.description.trim() || null,
      event_type: form.eventType, start_date: payloadDateStart, start_time: payloadTimeStart,
      end_date: payloadDateEnd, end_time: payloadTimeEnd,
      reminder_minutes: form.reminderMinutes, reminder_sent_at: null,
    }

    const query = supabase.from('events') as any
    const { data: savedRow, error } = isEditing.value
      ? await query.update(payload).eq('id', editingId.value).eq('user_id', userData.user.id).select('id').single()
      : await query.insert({ user_id: userData.user.id, ...payload }).select('id').single()

    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง events ใน Supabase'; return }
      throw error
    }

    const lineMessage = buildEventSavedMessage({
      title: payload.title, eventType: payload.event_type, startDate: payload.start_date,
      startTime: payload.start_time, endDate: payload.end_date, endTime: payload.end_time, isEditing: isEditing.value,
    })
    toastSuccess(isEditing.value ? 'แก้ไขกิจกรรมสำเร็จ' : 'เพิ่มกิจกรรมสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    if (savedRow?.id) await syncEventToGoogle(savedRow.id)
    await loadEvents()
    void notify(lineMessage)
  } catch (error: any) {
    console.error('Save event error:', error)
    errorMessage.value = error?.message || 'บันทึกกิจกรรมไม่สำเร็จ'
  } finally {
    isSubmitting.value = false
  }
}

const deleteEvent = async (id: string) => {
  if (!id || isDeletingId.value) return
  const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบกิจกรรมนี้?', 'จะไม่สามารถกู้คืนได้') : true
  if (!shouldDelete) return
  isDeletingId.value = id
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const deletedItem = events.value.find(t => t.id === id)
    const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userData.user.id)
    if (error) throw error
    events.value = events.value.filter(t => t.id !== id)
    toastSuccess('ลบกิจกรรมสำเร็จ')
    if (deletedItem?.google_event_id) void deleteEventFromGoogle(deletedItem.google_event_id)
  } catch (error: any) {
    console.error('Delete event error:', error)
    toastError('ลบกิจกรรมไม่สำเร็จ')
  } finally {
    isDeletingId.value = ''
  }
}

const syncSingleEvent = async (id: string) => {
  if (!id || isSyncingId.value) return
  isSyncingId.value = id
  try {
    const res = await syncEventToGoogle(id)
    if (res.synced) {
      toastSuccess('ซิงค์กับ Google Calendar สำเร็จแล้ว')
      await loadEvents()
    } else {
      if (res.reason === 'not_connected') {
        toastError('กรุณาเชื่อมต่อ Google Calendar ที่หน้าโปรไฟล์ก่อนซิงค์')
      } else {
        toastError('ซิงค์กับ Google Calendar ล้มเหลว')
      }
    }
  } catch (error) {
    console.error('Single event sync error:', error)
    toastError('เกิดข้อผิดพลาดในการซิงค์')
  } finally {
    isSyncingId.value = ''
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadEvents()
  clockTimer = setInterval(() => {
    currentTime.value = new Date()
  }, 60_000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>
