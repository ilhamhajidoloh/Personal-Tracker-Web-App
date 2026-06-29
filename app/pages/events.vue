<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <!-- Page Header -->
      <header class="sticky top-0 z-10 px-6 md:px-8 py-5 glass-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">🎉 กิจกรรมและนัดหมาย</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">บันทึกนัดหมาย วันสำคัญ และกิจกรรมต่างๆ</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="isEntryModalOpen = true"
            class="btn-primary text-sm flex items-center gap-1.5"
          >
            <span>+</span> เพิ่มกิจกรรม
          </button>
          <button
            @click="loadEvents"
            :disabled="isLoading"
            class="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'กำลังโหลด...' : '↻ รีเฟรช' }}
          </button>
        </div>
      </header>

      <div class="px-6 md:px-8 py-6 space-y-5">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm flex items-center gap-2"
        >
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Events List -->
        <section class="section-card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">รายการกิจกรรม</h2>
            <span class="text-xs bg-gray-800/80 text-gray-400 border border-gray-700/60 rounded-full px-3 py-1">
              ทั้งหมด {{ events.length }} รายการ
            </span>
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
              class="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-sm font-medium text-violet-300 transition-all"
            >
              + เพิ่มกิจกรรม
            </button>
          </div>

          <!-- Event List -->
          <div v-else class="divide-y divide-gray-800/50">
            <div
              v-for="item in events"
              :key="item.id"
              class="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/20 transition-all"
              :class="getEventRowHoverClass(item.event_type)"
            >
              <!-- Date badge -->
              <div
                class="shrink-0 w-14 text-center rounded-xl py-2.5 border mt-0.5"
                :class="getEventDateBadgeClass(item.event_type)"
              >
                <div class="text-[10px] font-bold uppercase leading-none" :class="getEventDateColor(item.event_type)">{{ getMonthShort(item.start_date) }}</div>
                <div class="text-xl font-bold text-white leading-tight mt-0.5">{{ getDay(item.start_date) }}</div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h3 class="text-sm font-semibold text-white truncate">{{ item.title }}</h3>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap"
                    :class="getEventBadgeClass(item.event_type)"
                  >
                    {{ getEventTypeName(item.event_type) }}
                  </span>
                </div>
                <p class="text-xs font-medium" :class="getEventTextColor(item.event_type)">{{ displayEventDateTime(item) }}</p>
                <p v-if="item.reminder_minutes" class="text-[10px] text-amber-400 mt-1">🔔 เตือนก่อน {{ getReminderLabel(item.reminder_minutes) }}</p>
                <p v-if="item.description" class="text-xs text-gray-500 mt-1.5 line-clamp-1">{{ item.description }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="openEditModal(item)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-400 hover:text-sky-300 hover:bg-sky-500/15 transition-all"
                  title="แก้ไข"
                >✏️</button>
                <button
                  @click="deleteEvent(item.id)"
                  :disabled="isDeletingId === item.id"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-400 hover:text-rose-300 hover:bg-rose-500/15 disabled:opacity-50 transition-all"
                  title="ลบ"
                >🗑️</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="isEntryModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="isEntryModalOpen = false"></div>

        <div class="relative w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">🗓️</div>
              <h3 class="text-base font-semibold text-white">{{ isEditing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่' }}</h3>
            </div>
            <button
              @click="() => { isEntryModalOpen = false; resetForm() }"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all"
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
                  class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all"
                >ยกเลิก</button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const editingId = ref('')
const errorMessage = ref('')
const events = ref<EventRow[]>([])
const tableMissingCodes = new Set(['42P01', 'PGRST205'])

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

const getEventDateBadgeClass = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'bg-sky-500/10 border-sky-500/25'
  if (type === 'same_day_all_day') return 'bg-emerald-500/10 border-emerald-500/25'
  return 'bg-violet-500/10 border-violet-500/25'
}

const getEventRowHoverClass = (_type: EventTypeType) => ''

const getEventBadgeClass = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'border-sky-500/30 bg-sky-500/15 text-sky-300'
  if (type === 'same_day_all_day') return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  return 'border-violet-500/30 bg-violet-500/15 text-violet-300'
}

const getEventTextColor = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'text-sky-400'
  if (type === 'same_day_all_day') return 'text-emerald-400'
  return 'text-violet-400'
}

const getEventDateColor = (type: EventTypeType) => {
  if (type === 'same_day_time') return 'text-sky-400'
  if (type === 'same_day_all_day') return 'text-emerald-400'
  return 'text-violet-400'
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
    const { error } = isEditing.value
      ? await query.update(payload).eq('id', editingId.value).eq('user_id', userData.user.id)
      : await query.insert({ user_id: userData.user.id, ...payload })

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
    const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userData.user.id)
    if (error) throw error
    events.value = events.value.filter(t => t.id !== id)
    toastSuccess('ลบกิจกรรมสำเร็จ')
  } catch (error: any) {
    console.error('Delete event error:', error)
    toastError('ลบกิจกรรมไม่สำเร็จ')
  } finally {
    isDeletingId.value = ''
  }
}

onMounted(() => { loadEvents() })
</script>
