<template>
<AppTabsLayout>
    <main class="events-board">
      <header class="events-board__header">
        <div>
          <p class="events-board__eyebrow">PLANNER / EVENTS</p>
          <h1>กิจกรรมของฉัน</h1>
          <p class="events-board__intro">วางแผน ติดตาม และจัดการทุกนัดหมายจากพื้นที่เดียว</p>
        </div>
        <div class="events-board__actions">
          <input ref="icsFileInput" type="file" accept=".ics,text/calendar" class="hidden" @change="importIcsFile">
          <button type="button" class="events-button events-button--quiet" :disabled="isImporting" @click="icsFileInput?.click()">{{ isImporting ? 'กำลังนำเข้า…' : 'นำเข้า .ics' }}</button>
          <button type="button" class="events-button events-button--quiet" :disabled="isExporting || !events.length" @click="exportIcsFile">{{ isExporting ? 'กำลังส่งออก…' : 'ส่งออก .ics' }}</button>
          <button type="button" class="events-button events-button--quiet" :disabled="isExportingPdf || !events.length" @click="exportPdfFile">{{ isExportingPdf ? 'กำลังสร้าง…' : 'PDF' }}</button>
          <button type="button" class="events-button events-button--primary" @click="isEntryModalOpen = true">+ เพิ่มกิจกรรม</button>
        </div>
      </header>

      <div v-if="errorMessage" class="events-alert">{{ errorMessage }}</div>

      <section class="events-summary">
        <div class="events-summary__item"><span>ทั้งหมด</span><strong>{{ events.length }}</strong></div>
        <div class="events-summary__item"><span>กำลังดำเนินอยู่</span><strong>{{ ongoingEventsCount }}</strong></div>
        <div class="events-summary__item"><span>กำลังจะมาถึง</span><strong>{{ upcomingEventsCount }}</strong></div>
        <div class="events-summary__item"><span>สิ้นสุดแล้ว</span><strong>{{ pastEventsCount }}</strong></div>
      </section>

      <section v-if="ongoingEvents.length" class="events-live" aria-label="กิจกรรมที่กำลังดำเนินอยู่">
        <div class="events-live__heading">
          <div><span class="events-live__signal"></span><p>HAPPENING NOW</p></div>
          <strong>{{ ongoingEvents.length }} กิจกรรมกำลังดำเนินอยู่</strong>
        </div>
        <div class="events-live__list">
          <article v-for="item in ongoingEvents" :key="item.id" class="events-live__item">
            <div class="events-live__content">
              <span class="events-live__type">{{ getEventTypeName(item.event_type) }}</span>
              <h2>{{ item.title }}</h2>
              <p>{{ displayEventDateTime(item) }}</p>
            </div>
            <div class="events-live__countdown">
              <span>เหลือเวลา</span>
              <strong>{{ getOngoingEventDetails(item).countdownText }}</strong>
            </div>
            <div class="events-live__progress" aria-hidden="true"><i :style="{ width: getOngoingEventDetails(item).progress + '%' }"></i></div>
          </article>
        </div>
      </section>

      <section class="events-workspace">
        <div class="events-toolbar">
          <div class="events-tabs" role="tablist" aria-label="ตัวกรองกิจกรรม">
            <button v-for="tab in subTabs" :key="tab.value" type="button" :class="{ 'is-active': activeSubTab === tab.value }" @click="activeSubTab = tab.value">
              {{ tab.label }} <b>{{ tab.count }}</b>
            </button>
          </div>
          <div class="events-filter">
            <input v-model="searchQuery" type="search" placeholder="ค้นหาชื่อหรือรายละเอียดกิจกรรม">
            <select v-model.number="itemsPerPage" @change="currentPage = 1" aria-label="จำนวนรายการต่อหน้า">
              <option :value="10">10 รายการ</option><option :value="20">20 รายการ</option><option :value="50">50 รายการ</option>
            </select>
            <button type="button" class="events-icon-button" :disabled="isLoading" title="รีเฟรช" @click="loadEvents">↻</button>
          </div>
        </div>

        <div v-if="isLoading" class="events-loading"><span></span><span></span><span></span></div>
        <div v-else-if="!filteredEvents.length" class="events-empty">
          <div>◌</div><h2>{{ searchQuery ? 'ไม่พบกิจกรรมที่ค้นหา' : 'ยังไม่มีรายการในมุมมองนี้' }}</h2>
          <p>{{ searchQuery ? 'ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองอื่น' : 'เริ่มบันทึกนัดหมายหรือกิจกรรมแรกของคุณ' }}</p>
          <button v-if="!searchQuery" type="button" class="events-button events-button--primary" @click="isEntryModalOpen = true">เพิ่มกิจกรรม</button>
        </div>
        <div v-else class="events-list">
          <article v-for="item in paginatedEvents" :key="item.id" class="event-row" :class="`event-row--${getEventStatusMeta(item).status}`">
            <div class="event-row__date"><span>{{ getMonthShort(getTimelineDate(item)) }}</span><strong>{{ getDay(getTimelineDate(item)) }}</strong></div>
            <div class="event-row__body">
              <div class="event-row__meta">
                <span class="event-status" :style="getEventStatusBadgeStyle(item)">{{ getEventStatusText(item) }}</span>
                <span class="event-type" :class="getEventBadgeClass(item.event_type)">{{ getEventTypeName(item.event_type) }}</span>
                <span v-if="item.google_event_id" class="event-google">Google Calendar</span>
              </div>
              <h2>{{ item.title }}</h2>
              <p class="event-row__time">{{ formatDate(getTimelineDate(item)) }} · {{ displayEventDateTime(item) }}</p>
              <p v-if="item.description" class="event-row__description">{{ item.description }}</p>
              <div v-if="getEventStatusMeta(item).status === 'ongoing'" class="event-progress"><span>กำลังดำเนินอยู่ · เหลือ {{ getOngoingEventDetails(item).countdownText }}</span><i><b :style="{ width: getOngoingEventDetails(item).progress + '%' }"></b></i></div>
              <div v-else-if="item.id === nextUpcomingEvent?.id" class="event-progress event-progress--next"><span>เริ่มในอีก {{ getUpcomingEventDetails(item).countdownText }}</span><i><b :style="{ width: getUpcomingEventDetails(item).progress + '%' }"></b></i></div>
            </div>
            <div class="event-row__actions">
              <button type="button" :disabled="isSyncingId === item.id || isDeletingId === item.id" title="ซิงค์ Google Calendar" @click="syncSingleEvent(item.id)">{{ isSyncingId === item.id ? '…' : 'Sync' }}</button>
              <button type="button" title="แก้ไข" @click="openEditModal(item)">แก้ไข</button>
              <button type="button" class="is-danger" :disabled="isDeletingId === item.id || isSyncingId === item.id" title="ลบ" @click="deleteEvent(item.id)">{{ isDeletingId === item.id ? '…' : 'ลบ' }}</button>
            </div>
          </article>
        </div>

        <footer v-if="totalPages > 1" class="events-pagination">
          <span>{{ pageInfo }}</span>
          <div><button type="button" :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">ก่อนหน้า</button><button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-current': currentPage === page }" @click="currentPage = page">{{ page }}</button><button type="button" :disabled="currentPage === totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">ถัดไป</button></div>
        </footer>
      </section>
    </main>

    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isEntryModalOpen" class="event-editor" @click.self="isEntryModalOpen = false">
          <form class="event-editor__panel" @submit.prevent="submitEvent">
            <header><div><p>EVENT EDITOR</p><h2>{{ isEditing ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่' }}</h2></div><button type="button" aria-label="ปิด" @click="() => { isEntryModalOpen = false; resetForm() }">×</button></header>
            <div class="event-editor__content">
              <label>ชื่อกิจกรรม<input v-model="form.title" type="text" maxlength="100" required placeholder="เช่น ประชุมทีม"></label>
              <fieldset><legend>รูปแบบเวลา</legend><div class="event-type-picker"><label v-for="opt in eventTypeOptions" :key="opt.value" :class="{ 'is-selected': form.eventType === opt.value }"><input v-model="form.eventType" type="radio" :value="opt.value"><span>{{ opt.icon }}</span>{{ opt.label }}</label></div></fieldset>
              <div v-if="form.eventType === 'same_day_time'" class="event-editor__grid"><label>วันที่<input v-model="form.startDate" type="date" required></label><label>เริ่ม<input v-model="form.startTime" type="time" required></label><label>สิ้นสุด<input v-model="form.endTime" type="time" required></label></div>
              <div v-else-if="form.eventType === 'same_day_all_day'" class="event-editor__grid"><label>วันที่<input v-model="form.startDate" type="date" required></label></div>
              <div v-else class="event-editor__grid"><label>วันเริ่ม<input v-model="form.startDate" type="date" required></label><label>เวลาเริ่ม<input v-model="form.startTime" type="time" required></label><label>วันสิ้นสุด<input v-model="form.endDate" type="date" required></label><label>เวลาสิ้นสุด<input v-model="form.endTime" type="time" required></label></div>
              <label>รายละเอียด<textarea v-model="form.description" rows="3" placeholder="เพิ่มรายละเอียด (ถ้ามี)"></textarea></label>
              <label>แจ้งเตือนล่วงหน้า<select v-model="form.reminderMinutes"><option v-for="opt in activeReminderOptions" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option></select></label>
            </div>
            <footer><button type="button" class="events-button events-button--quiet" @click="() => { isEntryModalOpen = false; resetForm() }">ยกเลิก</button><button type="submit" class="events-button events-button--primary" :disabled="isSubmitting">{{ isSubmitting ? 'กำลังบันทึก…' : 'บันทึกกิจกรรม' }}</button></footer>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { getTodayTH } from '~/utils/date'
import { generateEventsPDF } from '~/utils/eventsPdf'

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

type BackendActivity = {
  id: string
  userId: string
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
  isMultiDay: boolean
  isIndefinite: boolean
  recurrence: string
  location: string | null
  reminderMinutes: number | null
  reminderSentAt: string | null
  googleEventId: string | null
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'กิจกรรม' })

const { apiFetch, userId } = useBackendApi()
const { toastSuccess, toastError, confirmDelete } = useAlert()
const { notify, buildEventSavedMessage } = useLineMessaging()
const { notify: notifyEmail } = useEmailMessaging()
const { syncEventToGoogle, deleteEventFromGoogle } = useGoogleCalendarSync()

const isLoading = ref(true)
const isSubmitting = ref(false)
const isImporting = ref(false)
const isExporting = ref(false)
const isExportingPdf = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const isSyncingId = ref('')
const editingId = ref('')
const errorMessage = ref('')
const events = ref<EventRow[]>([])
const icsFileInput = ref<HTMLInputElement | null>(null)
type EventSubTab = 'upcoming' | 'past' | 'all'
const activeSubTab = ref<EventSubTab>('upcoming')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const currentTime = ref(new Date())
const soonThresholdMinutes = 7 * 24 * 60

const getApiErrorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

type IcsEvent = {
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  isMultiDay: boolean
}

const escapeIcsText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const unescapeIcsText = (value: string) => value.replace(/\\n/gi, '\n').replace(/\\([\\,;])/g, '$1')
const formatIcsDate = (date: Date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
const formatIcsDateTime = (date: Date) => `${formatIcsDate(date)}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`
const localDateTimeParts = (date: Date) => ({
  date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`,
})

const unfoldIcsLines = (content: string) => content.replace(/^\uFEFF/, '').replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
const getIcsProperties = (lines: string[]) => lines.reduce<Record<string, string>>((properties, line) => {
  const separator = line.indexOf(':')
  if (separator < 0) return properties
  const name = line.slice(0, separator).split(';')[0]?.toUpperCase()
  if (!name) return properties
  if (!(name in properties)) properties[name] = line.slice(separator + 1)
  return properties
}, {})

const parseIcsDate = (value: string) => {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/)
  if (!match) return null
  const [, year, month, day, hour = '00', minute = '00', second = '00', isUtc] = match
  const date = isUtc
    ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
    : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  return Number.isNaN(date.getTime()) ? null : date
}

const parseIcsEvents = (content: string): IcsEvent[] => {
  const eventBlocks = content.replace(/\r\n/g, '\n').match(/BEGIN:VEVENT\n[\s\S]*?\nEND:VEVENT/gi) || []
  return eventBlocks.flatMap((block) => {
    const properties = getIcsProperties(unfoldIcsLines(block))
    const title = properties.SUMMARY ? unescapeIcsText(properties.SUMMARY).trim() : ''
    const startRaw = properties.DTSTART
    if (!title || !startRaw) return []
    const start = parseIcsDate(startRaw)
    if (!start) return []
    const isAllDay = /^\d{8}$/.test(startRaw.trim())
    const parsedEnd = properties.DTEND ? parseIcsDate(properties.DTEND) : null
    const end = parsedEnd || new Date(start.getTime() + (isAllDay ? 86_400_000 : 3_600_000))
    const endForApp = isAllDay && parsedEnd ? new Date(end.getTime() - 86_400_000) : end
    if (endForApp.getTime() < start.getTime()) return []
    const startParts = localDateTimeParts(start)
    const endParts = localDateTimeParts(endForApp)
    return [{
      title,
      description: properties.DESCRIPTION ? unescapeIcsText(properties.DESCRIPTION).trim() || null : null,
      startTime: `${startParts.date}T${isAllDay ? '00:00:00' : startParts.time}`,
      endTime: `${endParts.date}T${isAllDay ? '23:59:59' : endParts.time}`,
      isAllDay,
      isMultiDay: !isAllDay && startParts.date !== endParts.date,
    }]
  })
}

const toEventRow = (a: BackendActivity): EventRow => {
  const eventType: EventTypeType = a.isAllDay ? 'same_day_all_day' : a.isMultiDay ? 'multi_day' : 'same_day_time'
  const startDate = a.startTime ? a.startTime.slice(0, 10) : getTodayTH()
  const endDate = a.endTime ? a.endTime.slice(0, 10) : null
  return {
    id: a.id,
    user_id: a.userId,
    title: a.title,
    description: a.description,
    event_type: eventType,
    start_date: startDate,
    start_time: eventType === 'same_day_all_day' ? null : (a.startTime ? a.startTime.slice(11, 19) : null),
    end_date: eventType === 'same_day_time' ? null : endDate,
    end_time: eventType === 'same_day_all_day' ? null : (a.endTime ? a.endTime.slice(11, 19) : null),
    reminder_minutes: a.reminderMinutes,
    google_event_id: a.googleEventId,
    created_at: a.startTime || '',
  }
}

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

const ongoingEvents = computed(() => {
  return events.value.filter(item => {
    const { startMs, endMs } = getEventDateTimeBounds(item)
    const nowMs = currentTime.value.getTime()
    return startMs <= nowMs && nowMs <= endMs
  })
})

const ongoingEventsCount = computed(() => ongoingEvents.value.length)

const upcomingEventsCount = computed(() => {
  const nowMs = currentTime.value.getTime()
  return events.value.filter(item => {
    const { startMs } = getEventDateTimeBounds(item)
    return startMs > nowMs
  }).length
})

const nextUpcomingEvent = computed(() => {
  const nowMs = currentTime.value.getTime()
  const maxCountdownMs = 30 * 24 * 60 * 60 * 1000 // Fix รอบ 30 วัน (หากเกิน 30 วัน จะไม่แสดง Spotlight Countdown)
  const upcoming = events.value
    .filter(item => {
      const { startMs } = getEventDateTimeBounds(item)
      const remainingMs = startMs - nowMs
      return remainingMs > 0 && remainingMs <= maxCountdownMs
    })
    .sort((a, b) => {
      const aStart = getEventDateTimeBounds(a).startMs
      const bStart = getEventDateTimeBounds(b).startMs
      return aStart - bStart
    })

  return upcoming[0] || null
})

const getNextEventCountdown = (item: EventRow) => {
  const { startMs } = getEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntil = (startMs - nowMs) / 60000
  return formatStatusDuration(minutesUntil)
}

const activeEventsCount = computed(() => {
  const nowMs = currentTime.value.getTime()
  return events.value.filter(item => getEventDateTimeBounds(item).endMs >= nowMs).length
})

const pastEventsCount = computed(() => {
  const nowMs = currentTime.value.getTime()
  return events.value.filter(item => getEventDateTimeBounds(item).endMs < nowMs).length
})

const subTabs = computed(() => [
  {
    value: 'upcoming' as EventSubTab,
    label: 'กิจกรรมที่ยังไม่ถึง',
    shortLabel: 'ยังไม่ถึง',
    icon: '📅',
    count: activeEventsCount.value,
  },
  {
    value: 'past' as EventSubTab,
    label: 'กิจกรรมที่สิ้นสุดแล้ว',
    shortLabel: 'สิ้นสุดแล้ว',
    icon: '🏁',
    count: pastEventsCount.value,
  },
  {
    value: 'all' as EventSubTab,
    label: 'กิจกรรมทั้งหมด',
    shortLabel: 'ทั้งหมด',
    icon: '📋',
    count: events.value.length,
  },
])

const filteredEvents = computed(() => {
  const nowMs = currentTime.value.getTime()
  let list: EventRow[] = []

  if (activeSubTab.value === 'upcoming') {
    list = events.value
      .filter(item => getEventDateTimeBounds(item).endMs >= nowMs)
      .sort((a, b) => getEventDateTimeBounds(a).startMs - getEventDateTimeBounds(b).startMs)
  } else if (activeSubTab.value === 'past') {
    list = events.value
      .filter(item => getEventDateTimeBounds(item).endMs < nowMs)
      .sort((a, b) => getEventDateTimeBounds(a).endMs - getEventDateTimeBounds(b).endMs)
  } else {
    list = [...events.value].sort((a, b) => {
      const aStatus = getEventStatusMeta(a).status
      const bStatus = getEventStatusMeta(b).status
      const rank = (status: string) => status === 'past' ? 0 : status === 'ongoing' ? 1 : 2
      const aRank = rank(aStatus)
      const bRank = rank(bStatus)

      // In the All tab: completed, then ongoing, then upcoming.
      if (aRank !== bRank) return aRank - bRank

      const aBounds = getEventDateTimeBounds(a)
      const bBounds = getEventDateTimeBounds(b)
      // Completed events use the end date shown in the leading date block;
      // active/upcoming events use their displayed start date.
      return aRank === 0
        ? aBounds.endMs - bBounds.endMs
        : aBounds.startMs - bBounds.startMs
    })
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    )
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredEvents.value.length / itemsPerPage.value)))

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEvents.value.slice(start, end)
})

// Animate only the connector beneath the lowest currently-running activity.
// It points to the next visible activity in the timeline.
const isActiveTimelineConnector = (item: EventRow) => {
  const visibleItems = paginatedEvents.value
  const itemIndex = visibleItems.findIndex(visibleItem => visibleItem.id === item.id)
  if (itemIndex < 0 || itemIndex === visibleItems.length - 1) return false

  let lowestOngoingIndex = -1
  visibleItems.forEach((visibleItem, index) => {
    if (getEventStatusMeta(visibleItem).status === 'ongoing') {
      lowestOngoingIndex = index
    }
  })

  return itemIndex === lowestOngoingIndex
}

const pageInfo = computed(() => {
  const total = filteredEvents.value.length
  if (total === 0) return 'ไม่มีรายการ'
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, total)
  return `แสดง ${start}-${end} จาก ${total} รายการ`
})

watch([activeSubTab, searchQuery], () => {
  currentPage.value = 1
})

watch(totalPages, (max) => {
  if (currentPage.value > max && max > 0) {
    currentPage.value = max
  }
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
const getDayOfWeek = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { weekday: 'short' })
const getYearThai = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric' })
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
    return { status: 'past', text: `สิ้นสุดแล้ว (${formatStatusDuration(Math.abs(minutesUntilEnd))}ก่อน)` }
  }

  if (startMs <= nowMs && nowMs <= endMs) {
    return { status: 'ongoing', text: 'กำลังดำเนินอยู่' }
  }

  if (minutesUntilStart <= soonThresholdMinutes) {
    return { status: 'soon', text: `กำลังจะถึง (อีก ${formatStatusDuration(minutesUntilStart)})` }
  }

  return { status: 'future', text: `ยังไม่ถึง (อีก ${formatStatusDuration(minutesUntilStart)})` }
}

// Show an event at its start date until it ends, then at its end date.
// For single-day events both values are naturally the same.
const getTimelineDate = (item: EventRow) =>
  getEventStatusMeta(item).status === 'past'
    ? item.end_date || item.start_date
    : item.start_date

const getOngoingEventDetails = (item: EventRow) => {
  const { startMs, endMs } = getEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const totalMs = Math.max(1, endMs - startMs)
  const remainingMs = Math.max(0, endMs - nowMs)
  const elapsedMs = Math.max(0, nowMs - startMs)
  
  const totalSec = Math.floor(remainingMs / 1000)
  const seconds = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const minutes = totalMin % 60
  const totalHours = Math.floor(totalMin / 60)
  const hours = totalHours % 24
  const days = Math.floor(totalHours / 24)

  const elapsedTotalMin = Math.floor(elapsedMs / 60000)
  const elapsedHrs = Math.floor(elapsedTotalMin / 60)
  const elapsedRemMin = elapsedTotalMin % 60
  let elapsedText = ''
  if (elapsedHrs > 0) {
    elapsedText = elapsedRemMin > 0 ? `${elapsedHrs} ชม. ${elapsedRemMin} นาที` : `${elapsedHrs} ชม.`
  } else {
    elapsedText = `${Math.max(0, elapsedTotalMin)} นาที`
  }

  // หลอดลดลงตามเวลาที่เหลือ (100% -> 0%)
  const progress = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100))

  const pad = (n: number) => String(n).padStart(2, '0')
  let countdownText = ''
  if (days > 0) {
    countdownText = `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else if (hours > 0) {
    countdownText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ชม.`
  } else {
    countdownText = `${pad(minutes)}:${pad(seconds)} นาที`
  }

  const startFormatted = item.event_type === 'same_day_all_day' 
    ? `${formatDate(item.start_date)} (00:00 น.)` 
    : (item.event_type === 'multi_day' ? `${formatDate(item.start_date)} ${formatTime(item.start_time)}` : formatTime(item.start_time))
  const endFormatted = item.event_type === 'same_day_all_day' 
    ? `${formatDate(item.start_date)} (23:59 น.)` 
    : (item.event_type === 'multi_day' ? `${formatDate(item.end_date || '')} ${formatTime(item.end_time)}` : formatTime(item.end_time))

  return {
    remainingMs,
    days,
    hours,
    minutes,
    seconds,
    countdownText,
    elapsedText,
    progress: Number(progress.toFixed(1)),
    startTimeFormatted: startFormatted,
    endTimeFormatted: endFormatted,
  }
}

const getUpcomingEventDetails = (item: EventRow) => {
  const { startMs, endMs } = getEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const remainingMs = Math.max(0, startMs - nowMs)
  const durationMs = Math.max(0, endMs - startMs)

  const totalSec = Math.floor(remainingMs / 1000)
  const seconds = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const minutes = totalMin % 60
  const totalHours = Math.floor(totalMin / 60)
  const hours = totalHours % 24
  const days = Math.floor(totalHours / 24)

  const pad = (n: number) => String(n).padStart(2, '0')
  let countdownText = ''
  if (days > 0) {
    countdownText = `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else if (hours > 0) {
    countdownText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ชม.`
  } else {
    countdownText = `${pad(minutes)}:${pad(seconds)} นาที`
  }

  // Duration formatting
  const durationMin = Math.floor(durationMs / 60000)
  const durHrs = Math.floor(durationMin / 60)
  const durRemMin = durationMin % 60
  let durationText = ''
  if (item.event_type === 'same_day_all_day') {
    durationText = 'ตลอดวัน'
  } else if (durHrs > 0) {
    durationText = durRemMin > 0 ? `${durHrs} ชม. ${durRemMin} นาที` : `${durHrs} ชม.`
  } else {
    durationText = `${Math.max(1, durationMin)} นาที`
  }

  // Fixed 30-Day countdown cycle
  const window30d = 30 * 24 * 60 * 60 * 1000
  const elapsed30d = Math.max(0, window30d - remainingMs)
  const progress = Math.min(100, Math.max(0, (elapsed30d / window30d) * 100))
  const progressLabel = 'นับถอยหลังรอบ 30 วัน'

  return {
    remainingMs,
    days,
    hours,
    minutes,
    seconds,
    countdownText,
    durationText,
    progressLabel,
    progress: Number(progress.toFixed(1)),
    isWithin24h: remainingMs <= 24 * 60 * 60 * 1000,
    isWithin30Days: remainingMs <= window30d,
  }
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
  if (type === 'same_day_time') return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
  if (type === 'same_day_all_day') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
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
  if (getEventStatusMeta(item).status === 'past') {
    const startTime = item.event_type === 'same_day_all_day'
      ? 'ตลอดวัน'
      : formatTime(item.start_time)
    return `เริ่มเมื่อ ${formatDate(item.start_date)} ${startTime}`
  }
  if (item.event_type === 'same_day_all_day') return `ตลอดวัน`
  if (item.event_type === 'same_day_time') return `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`
  if (item.event_type === 'multi_day') return `${formatTime(item.start_time)}  ถึง  ${formatDate(item.end_date || '')} ${formatTime(item.end_time)}`
  return ''
}

const loadEvents = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendActivity[]>(`/api/Activity/${userId.value}`)
    events.value = data.map(toEventRow).sort((a, b) => a.start_date.localeCompare(b.start_date))
  } catch (error: any) {
    console.error('Load events error:', error)
    errorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลกิจกรรมไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const exportIcsFile = () => {
  if (!import.meta.client || !events.value.length || isExporting.value) return
  isExporting.value = true
  try {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const entries = events.value.map((item) => {
      const start = new Date(`${item.start_date}T${normalizeEventTime(item.start_time, '00:00:00')}`)
      const end = new Date(`${item.end_date || item.start_date}T${normalizeEventTime(item.end_time, '23:59:59')}`)
      const lines = [
        'BEGIN:VEVENT',
        `UID:${item.id}@my-life-app`,
        `DTSTAMP:${now}`,
        `SUMMARY:${escapeIcsText(item.title)}`,
      ]
      if (item.event_type === 'same_day_all_day') {
        const exclusiveEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
        lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(start)}`, `DTEND;VALUE=DATE:${formatIcsDate(exclusiveEnd)}`)
      } else {
        lines.push(`DTSTART:${formatIcsDateTime(start)}`, `DTEND:${formatIcsDateTime(end)}`)
      }
      if (item.description) lines.push(`DESCRIPTION:${escapeIcsText(item.description)}`)
      lines.push('END:VEVENT')
      return lines.join('\r\n')
    })
    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//My Life App//Activities//TH', 'CALSCALE:GREGORIAN', ...entries, 'END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `my-life-activities-${getTodayTH()}.ics`
    link.click()
    URL.revokeObjectURL(url)
    toastSuccess(`ส่งออกกิจกรรม ${events.value.length} รายการแล้ว`)
  } catch (error) {
    console.error('Export ICS error:', error)
    toastError('ส่งออกไฟล์ปฏิทินไม่สำเร็จ')
  } finally {
    isExporting.value = false
  }
}

const exportPdfFile = async () => {
  if (!import.meta.client || !events.value.length || isExportingPdf.value) return
  isExportingPdf.value = true
  try {
    await generateEventsPDF(events.value.map(item => ({
      title: item.title,
      description: item.description,
      eventType: item.event_type,
      startDate: item.start_date,
      startTime: item.start_time,
      endDate: item.end_date,
      endTime: item.end_time,
    })), formatDate)
    toastSuccess(`ส่งออกรายงาน PDF ${events.value.length} รายการแล้ว`)
  } catch (error: any) {
    console.error('Export events PDF error:', error)
    toastError(error?.message || 'ส่งออกรายงาน PDF ไม่สำเร็จ')
  } finally {
    isExportingPdf.value = false
  }
}

const importIcsFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || isImporting.value) return
  if (!/\.ics$/i.test(file.name) && file.type !== 'text/calendar') {
    toastError('กรุณาเลือกไฟล์ปฏิทิน .ics')
    return
  }
  isImporting.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const imported = parseIcsEvents(await file.text())
    if (!imported.length) {
      toastError('ไม่พบกิจกรรมที่นำเข้าได้ในไฟล์นี้')
      return
    }
    let succeeded = 0
    let failed = 0
    for (const item of imported) {
      try {
        await apiFetch<BackendActivity>('/api/Activity', {
          method: 'POST',
          body: {
            userId: userId.value,
            title: item.title,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            isAllDay: item.isAllDay,
            isMultiDay: item.isMultiDay,
            isIndefinite: false,
            recurrence: 'none',
            location: null,
            reminderMinutes: null,
          },
        })
        succeeded++
      } catch (error) {
        console.error('Import ICS event error:', error)
        failed++
      }
    }
    await loadEvents()
    if (succeeded) toastSuccess(`นำเข้ากิจกรรม ${succeeded} รายการ${failed ? ` (ไม่สำเร็จ ${failed} รายการ)` : ''}`)
    else toastError(`นำเข้ากิจกรรมไม่สำเร็จ${failed ? ` ${failed} รายการ` : ''}`)
  } catch (error) {
    console.error('Import ICS file error:', error)
    toastError('อ่านไฟล์ปฏิทินไม่สำเร็จ')
  } finally {
    isImporting.value = false
  }
}

const submitEvent = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return

    let startTime: string
    let endTime: string
    if (form.eventType === 'same_day_all_day') {
      startTime = `${form.startDate}T00:00:00`
      endTime = `${form.startDate}T23:59:59`
    } else if (form.eventType === 'multi_day') {
      startTime = `${form.startDate}T${form.startTime}:00`
      endTime = `${form.endDate}T${form.endTime}:00`
    } else {
      startTime = `${form.startDate}T${form.startTime}:00`
      endTime = `${form.startDate}T${form.endTime}:00`
    }

    const body = {
      userId: userId.value,
      title: form.title.trim(),
      description: form.description.trim() || null,
      startTime, endTime,
      isAllDay: form.eventType === 'same_day_all_day',
      isMultiDay: form.eventType === 'multi_day',
      isIndefinite: false,
      recurrence: 'none',
      location: null,
      reminderMinutes: form.reminderMinutes,
    }

    let savedId = editingId.value
    if (isEditing.value) {
      await apiFetch(`/api/Activity/${editingId.value}`, { method: 'PUT', body })
    } else {
      const created = await apiFetch<BackendActivity>('/api/Activity', { method: 'POST', body })
      savedId = created.id
    }

    const lineMessage = buildEventSavedMessage({
      title: body.title,
      eventType: form.eventType,
      startDate: form.startDate,
      startTime: form.eventType === 'same_day_all_day' ? null : form.startTime,
      endDate: form.eventType === 'multi_day' ? form.endDate : null,
      endTime: form.eventType === 'same_day_all_day' ? null : form.endTime,
      isEditing: isEditing.value,
    })
    toastSuccess(isEditing.value ? 'แก้ไขกิจกรรมสำเร็จ' : 'เพิ่มกิจกรรมสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    if (savedId) await syncEventToGoogle(savedId)
    await loadEvents()
    void notify(lineMessage)
    void notifyEmail('event', {
      title: form.title,
      eventType: form.eventType,
      startDate: form.startDate,
      startTime: form.eventType === 'same_day_all_day' ? null : form.startTime,
      endDate: form.eventType === 'multi_day' ? form.endDate : null,
      endTime: form.eventType === 'same_day_all_day' ? null : form.endTime,
      isEditing: isEditing.value,
    })
  } catch (error: any) {
    console.error('Save event error:', error)
    errorMessage.value = getApiErrorMessage(error, 'บันทึกกิจกรรมไม่สำเร็จ')
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
    const deletedItem = events.value.find(t => t.id === id)
    await apiFetch(`/api/Activity/${id}`, { method: 'DELETE' })
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
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>

.events-board { max-width: 1200px; margin: 0 auto; padding: 2rem 1.25rem 4rem; color: var(--text-primary); }
.events-board__header { display: flex; justify-content: space-between; gap: 2rem; align-items: flex-start; padding: 1.5rem 0 2rem; border-bottom: 1px solid var(--border-subtle); }
.events-board__eyebrow, .event-editor header p { margin: 0; color: var(--brand-ink); font: 800 .68rem/1.2 ui-monospace, monospace; letter-spacing: .16em; }
.events-board h1 { margin: .5rem 0; font-size: clamp(2rem, 4vw, 3.25rem); letter-spacing: -.06em; line-height: 1; }
.events-board__intro { margin: 0; color: var(--text-muted); }.events-board__actions { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: flex-end; }
.events-button, .events-icon-button, .events-tabs button, .event-row__actions button, .events-pagination button { border: 0; cursor: pointer; font: inherit; transition: .18s ease; }.events-button { padding: .7rem .9rem; border-radius: .65rem; font-size: .8rem; font-weight: 700; }.events-button:disabled, button:disabled { cursor: not-allowed; opacity: .5; }.events-button--primary { background: var(--brand); color: #fff; box-shadow: var(--brand-glow); }.events-button--quiet { color: var(--text-secondary); background: var(--bg-elevated); border: 1px solid var(--border-subtle); }
.events-alert { padding: .8rem 1rem; margin-top: 1rem; border-radius: .7rem; color: var(--ink-amber); background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); }
.events-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 1.25rem 0; background: var(--border-subtle); border: 1px solid var(--border-subtle); border-radius: 1rem; overflow: hidden; }.events-summary__item { background: var(--bg-card); padding: 1rem 1.2rem; }.events-summary span { display:block; color:var(--text-muted); font-size:.72rem; }.events-summary strong { display:block; margin-top:.25rem; font-size:1.55rem; }
.events-live { margin: 0 0 1.25rem; padding: 1rem; border: 1px solid var(--event-status-ongoing-border); border-radius: 1rem; background: var(--event-status-ongoing-soft); box-shadow: var(--event-status-ongoing-shadow); }.events-live__heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin:0 0 .8rem; }.events-live__heading>div{display:flex;align-items:center;gap:.55rem}.events-live__heading p{margin:0;font:800 .68rem/1 ui-monospace,monospace;letter-spacing:.12em;color:var(--event-status-ongoing-ink)}.events-live__heading strong{font-size:.72rem;color:var(--event-status-ongoing-ink)}.events-live__signal{width:.55rem;height:.55rem;border-radius:50%;background:var(--event-status-ongoing-ink);box-shadow:0 0 0 0 var(--event-status-ongoing-ink);animation:events-live-pulse 1.5s infinite}@keyframes events-live-pulse{70%{box-shadow:0 0 0 .55rem transparent}100%{box-shadow:0 0 0 0 transparent}}.events-live__list{display:grid;gap:.6rem}.events-live__item{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem;padding:.9rem;background:var(--bg-card);border:1px solid var(--event-status-ongoing-border);border-radius:.7rem;overflow:hidden}.events-live__type{font-size:.65rem;font-weight:800;color:var(--event-status-ongoing-ink)}.events-live__content h2{margin:.3rem 0 .15rem;font-size:1rem}.events-live__content p,.events-live__countdown span{margin:0;color:var(--text-muted);font-size:.72rem}.events-live__countdown{text-align:right}.events-live__countdown strong{display:block;margin-top:.2rem;font-family:ui-monospace,monospace;font-size:1rem;color:var(--event-status-ongoing-ink)}.events-live__progress{position:absolute;bottom:0;left:0;width:100%;height:3px;background:var(--bg-elevated-2)}.events-live__progress i{display:block;height:100%;background:var(--event-status-ongoing-ink);transition:width 1s linear}
.events-workspace { overflow:hidden; border: 1px solid var(--border-subtle); border-radius: 1rem; background: var(--bg-card); }.events-toolbar { display:flex; justify-content:space-between; gap:1rem; padding: .85rem; border-bottom:1px solid var(--border-subtle); }.events-tabs { display:flex; gap:.25rem; overflow:auto; }.events-tabs button { white-space:nowrap; padding:.55rem .7rem; border-radius:.55rem; background:transparent; color:var(--text-muted); font-size:.78rem; }.events-tabs button.is-active { background:var(--bg-elevated); color:var(--text-primary); }.events-tabs b { margin-left:.25rem; color:var(--brand-ink); }.events-filter { display:flex; gap:.45rem; }.events-filter input, .events-filter select, .event-editor input, .event-editor select, .event-editor textarea { min-width:0; color:var(--text-primary); background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:.55rem; outline:none; }.events-filter input { width:16rem; padding:.55rem .7rem; font-size:.78rem; }.events-filter select { padding:0 .45rem; font-size:.75rem; }.events-icon-button { width:2.2rem; border-radius:.55rem; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-default); }
.events-loading { padding: 2rem; display:grid; gap:.7rem; }.events-loading span { height:5rem; border-radius:.75rem; background:var(--bg-elevated); animation:events-pulse 1.2s infinite alternate; }@keyframes events-pulse{to{opacity:.45}}.events-empty { padding:5rem 1rem; text-align:center; }.events-empty>div{font-size:3rem;color:var(--brand-ink)}.events-empty h2{margin:.5rem 0}.events-empty p{color:var(--text-muted);margin:0 0 1rem}
.events-list { padding: .75rem; display:grid; gap:.55rem; }.event-row { display:grid; grid-template-columns:4rem minmax(0,1fr) auto; gap:1rem; align-items:start; padding:1rem; border:1px solid var(--border-subtle); border-left:3px solid var(--border-default); border-radius:.8rem; }.event-row--ongoing{border-left-color:var(--event-status-ongoing-ink)}.event-row--soon{border-left-color:var(--event-status-soon-ink)}.event-row__date{text-align:center;padding:.35rem;background:var(--bg-elevated);border-radius:.55rem}.event-row__date span{display:block;text-transform:uppercase;font-size:.65rem;color:var(--text-muted)}.event-row__date strong{font-size:1.45rem}.event-row__meta{display:flex;gap:.4rem;flex-wrap:wrap}.event-status,.event-type,.event-google{font-size:.65rem;font-weight:700;padding:.22rem .45rem;border-radius:99px;border:1px solid}.event-google{color:var(--ink-sky);border-color:rgba(28,111,208,.25);background:rgba(28,111,208,.1)}.event-row h2{margin:.45rem 0 .2rem;font-size:1rem}.event-row__time,.event-row__description{margin:.15rem 0;color:var(--text-muted);font-size:.78rem}.event-row__description{color:var(--text-secondary)}.event-progress{margin-top:.7rem;font-size:.72rem;color:var(--event-status-ongoing-ink)}.event-progress--next{color:var(--brand-ink)}.event-progress i{display:block;height:4px;margin-top:.35rem;background:var(--bg-elevated-2);border-radius:99px;overflow:hidden}.event-progress b{display:block;height:100%;background:currentColor}.event-row__actions{display:flex;gap:.25rem}.event-row__actions button{padding:.4rem .5rem;border-radius:.45rem;background:var(--bg-elevated);color:var(--text-secondary);font-size:.7rem}.event-row__actions .is-danger{color:var(--ink-rose)}
.events-pagination{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:1rem;border-top:1px solid var(--border-subtle);font-size:.75rem;color:var(--text-muted)}.events-pagination div{display:flex;gap:.25rem}.events-pagination button{min-width:2rem;padding:.4rem;border-radius:.4rem;background:var(--bg-elevated);color:var(--text-secondary)}.events-pagination button.is-current{background:var(--brand);color:#fff}
.event-editor{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:1rem;background:rgba(4,8,18,.68);backdrop-filter:blur(10px)}.event-editor__panel{width:min(100%,42rem);max-height:calc(100vh - 2rem);display:flex;flex-direction:column;overflow:hidden;background:var(--bg-card);border:1px solid var(--border-strong);border-radius:1rem;box-shadow:var(--shadow-lg)}.event-editor header,.event-editor footer{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border-subtle)}.event-editor header h2{margin:.25rem 0 0;font-size:1.15rem}.event-editor header button{font-size:1.4rem;background:none;border:0;color:var(--text-muted)}.event-editor__content{overflow:auto;padding:1.25rem;display:grid;gap:1rem}.event-editor label,.event-editor legend{font-size:.75rem;font-weight:700;color:var(--text-secondary)}.event-editor input,.event-editor select,.event-editor textarea{box-sizing:border-box;display:block;width:100%;margin-top:.4rem;padding:.65rem;font:inherit}.event-editor textarea{resize:vertical}.event-editor fieldset{border:0;padding:0;margin:0}.event-type-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.4rem}.event-type-picker label{margin:0;padding:.65rem .35rem;text-align:center;border:1px solid var(--border-subtle);border-radius:.6rem;background:var(--bg-elevated);font-size:.68rem}.event-type-picker label.is-selected{border-color:var(--brand);color:var(--brand-ink)}.event-type-picker input{position:absolute;opacity:0}.event-type-picker span{display:block;font-size:1.1rem}.event-editor__grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}.event-editor footer{border-top:1px solid var(--border-subtle);border-bottom:0;justify-content:flex-end}
@media(max-width:760px){.events-board{padding:1rem 1rem 3rem}.events-board__header,.events-toolbar{flex-direction:column}.events-board__actions{justify-content:flex-start}.events-summary{grid-template-columns:repeat(2,1fr)}.events-live__item{grid-template-columns:1fr}.events-live__countdown{text-align:left}.events-filter{width:100%}.events-filter input{width:100%;flex:1}.event-row{grid-template-columns:3.3rem minmax(0,1fr)}.event-row__actions{grid-column:2;justify-content:flex-start}.events-pagination{flex-direction:column}.event-editor__grid{grid-template-columns:1fr}.event-type-picker{grid-template-columns:1fr}}
</style>
