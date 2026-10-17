<template>
  <AppTabsLayout>
    <main class="ev">
      <!-- Hero -->
      <header class="ev-hero">
        <div class="ev-hero__glow" aria-hidden="true"></div>
        <div class="ev-hero__text">
          <span class="ev-chip ev-chip--glass">✦ Planner</span>
          <h1>กิจกรรมของฉัน</h1>
          <p>วางแผน ติดตาม และจัดการทุกนัดหมายจากพื้นที่เดียว</p>
        </div>
        <div class="ev-hero__actions">
          <input ref="icsFileInput" type="file" accept=".ics,text/calendar" class="hidden" @change="importIcsFile">
          <button type="button" class="ev-btn ev-btn--glass" :disabled="isImporting" @click="icsFileInput?.click()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
            {{ isImporting ? 'กำลังนำเข้า…' : 'นำเข้า' }}
          </button>
          <button type="button" class="ev-btn ev-btn--glass" :disabled="isExporting || !events.length" @click="exportIcsFile">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L8 7m4-4l4 4M5 21h14" /></svg>
            {{ isExporting ? 'กำลังส่งออก…' : '.ics' }}
          </button>
          <button type="button" class="ev-btn ev-btn--glass" :disabled="isExportingPdf || !events.length" @click="exportPdfFile">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5" /></svg>
            {{ isExportingPdf ? 'กำลังสร้าง…' : 'PDF' }}
          </button>
          <button type="button" class="ev-btn ev-btn--primary" @click="isEntryModalOpen = true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            เพิ่มกิจกรรม
          </button>
        </div>
      </header>


      <div v-if="errorMessage" class="ev-alert" role="alert">
        <span>⚠</span>{{ errorMessage }}
      </div>

      <!-- Stats -->
      <section class="ev-stats" aria-label="สรุปกิจกรรม">
        <div class="ev-stat ev-stat--all"><i>◎</i><div><span>ทั้งหมด</span><strong>{{ events.length }}</strong></div></div>
        <div class="ev-stat ev-stat--live"><i>●</i><div><span>กำลังดำเนินอยู่</span><strong>{{ ongoingEventsCount }}</strong></div></div>
        <div class="ev-stat ev-stat--next"><i>➜</i><div><span>กำลังจะมาถึง</span><strong>{{ upcomingEventsCount }}</strong></div></div>
        <div class="ev-stat ev-stat--done"><i>✓</i><div><span>สิ้นสุดแล้ว</span><strong>{{ pastEventsCount }}</strong></div></div>
      </section>

      <!-- Live now -->
      <section v-if="ongoingEvents.length" class="ev-now" aria-label="กิจกรรมที่กำลังดำเนินอยู่">
        <div class="ev-now__head">
          <span class="ev-now__badge"><i></i>Happening now</span>
          <span class="ev-now__count">{{ ongoingEvents.length }} กิจกรรมกำลังดำเนินอยู่</span>
        </div>
        <div class="ev-now__grid">
          <article v-for="item in ongoingEvents" :key="item.id" class="ev-now-card">
            <div class="ev-now-card__top">
              <span class="ev-chip ev-chip--live">{{ getEventTypeName(item.event_type) }}</span>
              <div class="ev-now-card__timer">
                <small>เหลือเวลา</small>
                <strong>{{ getOngoingEventDetails(item).countdownText }}</strong>
              </div>
            </div>
            <h2>{{ item.title }}</h2>
            <p>{{ displayEventDateTime(item) }}</p>
            <div class="ev-bar" aria-label="ความคืบหน้า"><i :style="{ width: getOngoingEventDetails(item).progress + '%' }"></i></div>
            <small class="ev-now-card__pct">เวลาคงเหลือ {{ getOngoingEventDetails(item).progress }}%</small>
          </article>
        </div>
      </section>


      <!-- Workspace -->
      <section class="ev-panel">
        <div class="ev-bar-tools">
          <div class="ev-seg" role="tablist" aria-label="ตัวกรองกิจกรรม">
            <button v-for="tab in subTabs" :key="tab.value" type="button" role="tab" :aria-selected="activeSubTab === tab.value" :class="{ 'is-active': activeSubTab === tab.value }" @click="activeSubTab = tab.value">
              {{ tab.label }}<b>{{ tab.count }}</b>
            </button>
          </div>
          <div class="ev-tools">
            <label class="ev-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input v-model="searchQuery" type="search" placeholder="ค้นหาชื่อหรือรายละเอียด">
            </label>
            <select v-if="viewMode === 'list'" v-model.number="itemsPerPage" class="ev-select" aria-label="จำนวนรายการต่อหน้า" @change="currentPage = 1">
              <option :value="10">10 รายการ</option><option :value="20">20 รายการ</option><option :value="50">50 รายการ</option>
            </select>
            <div class="ev-toggle" aria-label="มุมมอง">
              <button type="button" :class="{ 'is-active': viewMode === 'list' }" @click="viewMode = 'list'">รายการ</button>
              <button type="button" :class="{ 'is-active': viewMode === 'calendar' }" @click="viewMode = 'calendar'">ปฏิทิน</button>
            </div>
            <button type="button" class="ev-round" :disabled="isLoading" title="รีเฟรช" aria-label="รีเฟรช" @click="loadEvents">↻</button>
          </div>
        </div>

        <div v-if="isLoading" class="ev-skeleton"><span></span><span></span><span></span></div>

        <div v-else-if="!filteredEvents.length && viewMode === 'list'" class="ev-empty">
          <div class="ev-empty__art">◌</div>
          <h2>{{ searchQuery ? 'ไม่พบกิจกรรมที่ค้นหา' : 'ยังไม่มีรายการในมุมมองนี้' }}</h2>
          <p>{{ searchQuery ? 'ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองอื่น' : 'เริ่มบันทึกนัดหมายหรือกิจกรรมแรกของคุณ' }}</p>
          <button v-if="!searchQuery" type="button" class="ev-btn ev-btn--primary" @click="isEntryModalOpen = true">+ เพิ่มกิจกรรม</button>
        </div>

        <!-- Calendar -->
        <section v-else-if="viewMode === 'calendar'" class="ev-cal" :class="`ev-cal--${calendarLayout}`">
          <header class="ev-cal__head">
            <button type="button" class="ev-round" :aria-label="`ก่อนหน้า${calendarLayoutLabel}`" @click="moveCalendarMonth(-1)">‹</button>
            <div class="ev-cal__title">
              <h2>{{ calendarMonthLabel }}</h2>
              <div><span>{{ calendarLayoutLabel }}</span><button type="button" @click="goToCurrentMonth">วันนี้</button></div>
            </div>
            <button type="button" class="ev-round" :aria-label="`ถัดไป${calendarLayoutLabel}`" @click="moveCalendarMonth(1)">›</button>
          </header>
          <div v-if="calendarLayout !== 'day'" class="ev-cal__weekdays"><span v-for="day in calendarVisibleWeekdays" :key="day">{{ day }}</span></div>
          <div class="ev-cal__grid">
            <article v-for="day in calendarDays" :key="day.key" class="ev-cal__day" :class="{ 'is-outside': !day.isCurrentMonth, 'is-today': day.isToday }">
              <span class="ev-cal__num">{{ day.day }}</span>
              <div class="ev-cal__items">
                <button v-for="item in getCalendarEvents(day.key)" :key="item.id" type="button" class="ev-pill" :class="`ev-pill--${getEventStatusMeta(item).status}`" :title="`${item.title} · ${displayEventDateTime(item)}`" @click="openEditModal(item)">
                  <b>{{ item.start_time ? formatTime(item.start_time) : 'ทั้งวัน' }}</b><span>{{ item.title }}</span>
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- List -->
        <div v-else class="ev-list">
          <article v-for="item in paginatedEvents" :key="item.id" class="ev-card" :class="`ev-card--${getEventStatusMeta(item).status}`">
            <div class="ev-card__date">
              <span>{{ getMonthShort(getTimelineDate(item)) }}</span>
              <strong>{{ getDay(getTimelineDate(item)) }}</strong>
            </div>
            <div class="ev-card__body">
              <div class="ev-card__tags">
                <span class="ev-tag ev-tag--status" :style="getEventStatusBadgeStyle(item)">{{ getEventStatusText(item) }}</span>
                <span class="ev-tag" :class="getEventBadgeClass(item.event_type)">{{ getEventTypeName(item.event_type) }}</span>
                <span v-if="item.google_event_id" class="ev-tag ev-tag--google">Google Calendar</span>
              </div>
              <h2>{{ item.title }}</h2>
              <p class="ev-card__time">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                {{ formatDate(getTimelineDate(item)) }} · {{ displayEventDateTime(item) }}
              </p>
              <p v-if="item.description" class="ev-card__desc">{{ item.description }}</p>
              <div v-if="getEventStatusMeta(item).status === 'ongoing'" class="ev-prog">
                <div><span>กำลังดำเนินอยู่ · เหลือ {{ getOngoingEventDetails(item).countdownText }}</span><em>{{ getOngoingEventDetails(item).progress }}%</em></div>
                <div class="ev-bar"><i :style="{ width: getOngoingEventDetails(item).progress + '%' }"></i></div>
              </div>
              <div v-else-if="item.id === nextUpcomingEvent?.id" class="ev-prog ev-prog--next">
                <div><span>เริ่มในอีก {{ getUpcomingEventDetails(item).countdownText }}</span><em>{{ getUpcomingEventDetails(item).progress }}%</em></div>
                <div class="ev-bar"><i :style="{ width: getUpcomingEventDetails(item).progress + '%' }"></i></div>
              </div>
            </div>
            <div class="ev-card__actions">
              <button type="button" :disabled="isSyncingId === item.id || isDeletingId === item.id" title="ซิงค์ Google Calendar" @click="syncSingleEvent(item.id)">{{ isSyncingId === item.id ? '…' : 'Sync' }}</button>
              <button type="button" title="แก้ไข" @click="openEditModal(item)">แก้ไข</button>
              <button type="button" class="is-danger" :disabled="isDeletingId === item.id || isSyncingId === item.id" title="ลบ" @click="deleteEvent(item.id)">{{ isDeletingId === item.id ? '…' : 'ลบ' }}</button>
            </div>
          </article>
        </div>

        <footer v-if="viewMode === 'list' && totalPages > 1" class="ev-pager">
          <span>{{ pageInfo }}</span>
          <div>
            <button type="button" :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">‹ ก่อนหน้า</button>
            <button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-current': currentPage === page }" @click="currentPage = page">{{ page }}</button>
            <button type="button" :disabled="currentPage === totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">ถัดไป ›</button>
          </div>
        </footer>
      </section>
    </main>


    <!-- Editor -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isEntryModalOpen" class="ev-modal" @click.self="isEntryModalOpen = false">
          <form class="ev-sheet" @submit.prevent="submitEvent">
            <header class="ev-sheet__head">
              <div>
                <span class="ev-chip">{{ isEditing ? '✎ Edit' : '✦ New' }}</span>
                <h2>{{ isEditing ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่' }}</h2>
              </div>
              <button type="button" class="ev-round" aria-label="ปิด" @click="() => { isEntryModalOpen = false; resetForm() }">×</button>
            </header>
            <div class="ev-sheet__body">
              <label class="ev-field"><span>ชื่อกิจกรรม</span><input v-model="form.title" type="text" maxlength="100" required placeholder="เช่น ประชุมทีม"></label>
              <fieldset class="ev-field">
                <legend>รูปแบบเวลา</legend>
                <div class="ev-types">
                  <label v-for="opt in eventTypeOptions" :key="opt.value" :class="{ 'is-selected': form.eventType === opt.value }">
                    <input v-model="form.eventType" type="radio" :value="opt.value"><i>{{ opt.icon }}</i><span>{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>
              <div v-if="form.eventType === 'same_day_time'" class="ev-grid">
                <label class="ev-field"><span>วันที่</span><input v-model="form.startDate" type="date" required></label>
                <label class="ev-field"><span>เริ่ม</span><input v-model="form.startTime" type="time" required></label>
                <label class="ev-field"><span>สิ้นสุด</span><input v-model="form.endTime" type="time" required></label>
              </div>
              <div v-else-if="form.eventType === 'same_day_all_day'" class="ev-grid ev-grid--one">
                <label class="ev-field"><span>วันที่</span><input v-model="form.startDate" type="date" required></label>
              </div>
              <div v-else class="ev-grid ev-grid--two">
                <label class="ev-field"><span>วันเริ่ม</span><input v-model="form.startDate" type="date" required></label>
                <label class="ev-field"><span>เวลาเริ่ม</span><input v-model="form.startTime" type="time" required></label>
                <label class="ev-field"><span>วันสิ้นสุด</span><input v-model="form.endDate" type="date" required></label>
                <label class="ev-field"><span>เวลาสิ้นสุด</span><input v-model="form.endTime" type="time" required></label>
              </div>
              <label class="ev-field"><span>รายละเอียด</span><textarea v-model="form.description" rows="3" placeholder="เพิ่มรายละเอียด (ถ้ามี)"></textarea></label>
              <label class="ev-field"><span>แจ้งเตือนล่วงหน้า</span><select v-model="form.reminderMinutes"><option v-for="opt in activeReminderOptions" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option></select></label>
            </div>
            <footer class="ev-sheet__foot">
              <button type="button" class="ev-btn ev-btn--ghost" @click="() => { isEntryModalOpen = false; resetForm() }">ยกเลิก</button>
              <button type="submit" class="ev-btn ev-btn--primary" :disabled="isSubmitting">{{ isSubmitting ? 'กำลังบันทึก…' : 'บันทึกกิจกรรม' }}</button>
            </footer>
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
type EventViewMode = 'list' | 'calendar'
const viewMode = ref<EventViewMode>('list')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const currentTime = ref(new Date())
const viewportWidth = ref(1024)
const calendarMonth = ref(new Date(currentTime.value.getFullYear(), currentTime.value.getMonth(), 1))
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

const calendarWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const calendarLayout = computed<'month' | 'week' | 'day'>(() => {
  if (viewportWidth.value < 600) return 'day'
  if (viewportWidth.value < 960) return 'week'
  return 'month'
})

const calendarLayoutLabel = computed(() => {
  if (calendarLayout.value === 'day') return 'รายวัน'
  if (calendarLayout.value === 'week') return 'รายสัปดาห์'
  return 'รายเดือน'
})

const calendarVisibleWeekdays = computed(() => {
  if (calendarLayout.value !== 'week') return calendarWeekdays
  const start = new Date(calendarMonth.value)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, index) => calendarWeekdays[(start.getDay() + index) % 7])
})

const calendarMonthLabel = computed(() => calendarMonth.value.toLocaleDateString('th-TH', {
  ...(calendarLayout.value === 'day'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : calendarLayout.value === 'week'
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { month: 'long', year: 'numeric' }),
}))

const toCalendarDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calendarDays = computed(() => {
  const cursor = new Date(calendarMonth.value)
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = calendarLayout.value === 'month' ? new Date(monthStart) : new Date(cursor)
  if (calendarLayout.value === 'month' || calendarLayout.value === 'week') gridStart.setDate(gridStart.getDate() - gridStart.getDay())
  const todayKey = toCalendarDateKey(currentTime.value)
  const length = calendarLayout.value === 'month' ? 42 : calendarLayout.value === 'week' ? 7 : 1

  return Array.from({ length }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return {
      key: toCalendarDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === calendarMonth.value.getMonth(),
      isToday: toCalendarDateKey(date) === todayKey,
    }
  })
})

const getCalendarEvents = (dateKey: string) => filteredEvents.value.filter((item) => {
  const endDate = item.end_date || item.start_date
  return item.start_date <= dateKey && endDate >= dateKey
})

const moveCalendarMonth = (amount: number) => {
  const cursor = new Date(calendarMonth.value)
  if (calendarLayout.value === 'month') cursor.setMonth(cursor.getMonth() + amount)
  else if (calendarLayout.value === 'week') cursor.setDate(cursor.getDate() + amount * 7)
  else cursor.setDate(cursor.getDate() + amount)
  calendarMonth.value = cursor
}

const goToCurrentMonth = () => {
  calendarMonth.value = new Date(currentTime.value)
}

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
const updateViewportWidth = () => {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  loadEvents()
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth, { passive: true })
  clockTimer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<style scoped>
.ev { --r: 1.1rem; max-width: 1200px; min-width: 0; margin: 0 auto; padding: 1.25rem 1.25rem 4rem; color: var(--text-primary); overflow-x: clip; display: grid; gap: 1.1rem; }
.ev svg { width: 1.05em; height: 1.05em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.ev button, .ev-modal button { font: inherit; cursor: pointer; transition: transform .15s ease, background .15s ease, box-shadow .15s ease, opacity .15s ease; }
.ev button:disabled, .ev-modal button:disabled { cursor: not-allowed; opacity: .5; }

/* chips / buttons */
.ev-chip { display: inline-flex; align-items: center; gap: .35rem; padding: .28rem .65rem; border-radius: 99px; font-size: .68rem; font-weight: 800; letter-spacing: .04em; color: var(--brand-ink); background: color-mix(in srgb, var(--brand) 14%, transparent); }
.ev-chip--glass { color: #fff; background: rgba(255,255,255,.18); backdrop-filter: blur(8px); }
.ev-chip--live { color: var(--event-status-ongoing-ink); background: var(--event-status-ongoing-soft); }
.ev-btn { display: inline-flex; align-items: center; gap: .45rem; padding: .62rem 1rem; border: 0; border-radius: 99px; font-size: .8rem; font-weight: 700; }
.ev-btn:not(:disabled):hover { transform: translateY(-1px); }
.ev-btn--primary { color: #fff; background: linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 55%, #a855f7)); box-shadow: 0 8px 22px -8px var(--brand); }
.ev-btn--glass { color: #fff; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(10px); }
.ev-btn--glass:not(:disabled):hover { background: rgba(255,255,255,.26); }
.ev-btn--ghost { color: var(--text-secondary); background: var(--bg-elevated); }
.ev-round { display: grid; place-items: center; flex: 0 0 2.4rem; width: 2.4rem; height: 2.4rem; border: 1px solid var(--border-subtle); border-radius: 50%; color: var(--text-primary); background: var(--bg-elevated); font-size: 1.15rem; }
.ev-round:not(:disabled):hover { background: var(--bg-elevated-2); transform: rotate(0) scale(1.06); }

/* hero */
.ev-hero { position: relative; overflow: hidden; display: flex; justify-content: space-between; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap; padding: 2rem; border-radius: 1.6rem; color: #fff; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%); box-shadow: 0 24px 50px -24px rgba(124,58,237,.6); }
.ev-hero__glow { position: absolute; inset: -40% -10% auto auto; width: 26rem; height: 26rem; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.35), transparent 65%); pointer-events: none; }
.ev-hero__text { position: relative; }
.ev-hero h1 { margin: .7rem 0 .3rem; font-size: clamp(1.9rem, 4vw, 3rem); font-weight: 800; letter-spacing: -.04em; line-height: 1.05; }
.ev-hero p { margin: 0; opacity: .85; font-size: .92rem; }
.ev-hero__actions { position: relative; display: flex; flex-wrap: wrap; gap: .5rem; }
.ev-hero .ev-btn--primary { color: #4f46e5; background: #fff; box-shadow: 0 8px 24px -8px rgba(0,0,0,.4); }

.ev-alert { display: flex; gap: .6rem; align-items: center; padding: .85rem 1.1rem; border-radius: var(--r); color: var(--ink-amber); background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); font-size: .85rem; }

/* stats */
.ev-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem; }
.ev-stat { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.1rem; border-radius: var(--r); background: var(--bg-card); border: 1px solid var(--border-subtle); }
.ev-stat i { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .85rem; font-style: normal; font-size: 1rem; color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }
.ev-stat span { display: block; font-size: .7rem; color: var(--text-muted); }
.ev-stat strong { display: block; font-size: 1.6rem; line-height: 1.1; letter-spacing: -.03em; }
.ev-stat--all { --c: var(--brand); }
.ev-stat--live { --c: var(--event-status-ongoing-ink); }
.ev-stat--next { --c: var(--ink-sky, #0ea5e9); }
.ev-stat--done { --c: var(--text-muted); }

/* now */
.ev-now { padding: 1.1rem; border-radius: 1.3rem; border: 1px solid var(--event-status-ongoing-border); background: linear-gradient(160deg, var(--event-status-ongoing-soft), transparent 70%); }
.ev-now__head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .85rem; flex-wrap: wrap; }
.ev-now__badge { display: inline-flex; align-items: center; gap: .5rem; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--event-status-ongoing-ink); }
.ev-now__badge i { width: .55rem; height: .55rem; border-radius: 50%; background: currentColor; animation: ev-pulse 1.6s infinite; }
.ev-now__count { font-size: .75rem; color: var(--text-muted); }
@keyframes ev-pulse { 0% { box-shadow: 0 0 0 0 currentColor; } 70%, 100% { box-shadow: 0 0 0 .6rem transparent; } }
.ev-now__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: .8rem; }
.ev-now-card { padding: 1rem 1.1rem; border-radius: 1rem; background: var(--bg-card); border: 1px solid var(--event-status-ongoing-border); box-shadow: 0 10px 30px -18px var(--event-status-ongoing-ink); }
.ev-now-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: .6rem; }
.ev-now-card__timer { text-align: right; }
.ev-now-card__timer small { display: block; font-size: .64rem; color: var(--text-muted); }
.ev-now-card__timer strong { font: 800 1rem ui-monospace, monospace; color: var(--event-status-ongoing-ink); }
.ev-now-card h2 { margin: .7rem 0 .2rem; font-size: 1.05rem; letter-spacing: -.01em; overflow-wrap: anywhere; }
.ev-now-card p { margin: 0 0 .8rem; font-size: .76rem; color: var(--text-muted); }
.ev-now-card__pct { display: block; margin-top: .4rem; text-align: right; font-size: .64rem; font-weight: 700; color: var(--event-status-ongoing-ink); }
.ev-bar { height: .38rem; border-radius: 99px; background: var(--bg-elevated-2); overflow: hidden; }
.ev-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--event-status-ongoing-ink), color-mix(in srgb, var(--event-status-ongoing-ink) 50%, #fff)); transition: width 1s linear; }

/* panel */
.ev-panel { min-width: 0; overflow: hidden; border-radius: 1.4rem; background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: 0 20px 40px -30px rgba(0,0,0,.35); }
.ev-bar-tools { display: flex; flex-direction: column; gap: .75rem; padding: 1rem; border-bottom: 1px solid var(--border-subtle); }
.ev-seg { display: flex; gap: .25rem; padding: .25rem; width: fit-content; max-width: 100%; overflow-x: auto; scrollbar-width: none; border-radius: 99px; background: var(--bg-elevated); }
.ev-seg::-webkit-scrollbar { display: none; }
.ev-seg button { display: inline-flex; align-items: center; gap: .4rem; white-space: nowrap; padding: .5rem .9rem; border: 0; border-radius: 99px; color: var(--text-muted); background: transparent; font-size: .78rem; font-weight: 700; }
.ev-seg button b { padding: .05rem .45rem; border-radius: 99px; font-size: .68rem; background: var(--bg-elevated-2); }
.ev-seg button.is-active { color: var(--text-primary); background: var(--bg-card); box-shadow: 0 2px 8px rgba(0,0,0,.14); }
.ev-seg button.is-active b { color: #fff; background: var(--brand); }
.ev-tools { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.ev-search { flex: 1 1 14rem; display: flex; align-items: center; gap: .5rem; padding: 0 .9rem; border-radius: 99px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-muted); }
.ev-search:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.ev-search input { flex: 1; min-width: 0; padding: .65rem 0; border: 0; outline: none; background: transparent; color: var(--text-primary); font-size: .82rem; }
.ev-select { height: 2.4rem; padding: 0 .8rem; border-radius: 99px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-primary); font-size: .76rem; outline: none; }
.ev-toggle { display: flex; padding: .2rem; border-radius: 99px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); }
.ev-toggle button { padding: .4rem .85rem; border: 0; border-radius: 99px; color: var(--text-muted); background: transparent; font-size: .74rem; font-weight: 700; white-space: nowrap; }
.ev-toggle button.is-active { color: #fff; background: var(--brand); }

/* skeleton / empty */
.ev-skeleton { display: grid; gap: .75rem; padding: 1rem; }
.ev-skeleton span { height: 5.5rem; border-radius: var(--r); background: linear-gradient(90deg, var(--bg-elevated), var(--bg-elevated-2), var(--bg-elevated)); background-size: 200% 100%; animation: ev-shimmer 1.3s infinite linear; }
@keyframes ev-shimmer { to { background-position: -200% 0; } }
.ev-empty { display: grid; justify-items: center; gap: .5rem; padding: 4.5rem 1rem; text-align: center; }
.ev-empty__art { display: grid; place-items: center; width: 5rem; height: 5rem; border-radius: 50%; font-size: 2.2rem; color: var(--brand-ink); background: color-mix(in srgb, var(--brand) 12%, transparent); }
.ev-empty h2 { margin: .5rem 0 0; font-size: 1.1rem; }
.ev-empty p { margin: 0 0 .8rem; color: var(--text-muted); font-size: .85rem; }

/* list cards */
.ev-list { display: grid; gap: .75rem; padding: 1rem; }
.ev-card { --c: var(--border-default); position: relative; display: grid; grid-template-columns: 4.2rem minmax(0, 1fr) auto; gap: 1rem; align-items: start; padding: 1rem 1.1rem; border-radius: 1.1rem; border: 1px solid var(--border-subtle); background: var(--bg-card); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.ev-card::before { content: ''; position: absolute; left: 0; top: 1rem; bottom: 1rem; width: 4px; border-radius: 0 4px 4px 0; background: var(--c); }
.ev-card:hover { transform: translateY(-2px); border-color: var(--border-default); box-shadow: 0 16px 30px -22px rgba(0,0,0,.45); }
.ev-card--ongoing { --c: var(--event-status-ongoing-ink); background: linear-gradient(120deg, var(--event-status-ongoing-soft), var(--bg-card) 55%); }
.ev-card--soon { --c: var(--event-status-soon-ink); }
.ev-card--future { --c: var(--brand); }
.ev-card--past { --c: var(--event-status-past-ink); }
.ev-card--past .ev-card__body, .ev-card--past .ev-card__date { opacity: .72; }
.ev-card__date { display: grid; place-items: center; align-content: center; height: 4.4rem; border-radius: 1rem; background: color-mix(in srgb, var(--c) 13%, var(--bg-elevated)); }
.ev-card__date span { font-size: .64rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--c); }
.ev-card__date strong { font-size: 1.55rem; line-height: 1; letter-spacing: -.04em; }
.ev-card__body { min-width: 0; }
.ev-card__tags { display: flex; flex-wrap: wrap; gap: .35rem; }
.ev-tag { padding: .2rem .55rem; border: 1px solid transparent; border-radius: 99px; font-size: .64rem; font-weight: 700; }
.ev-tag--google { color: var(--ink-sky); background: rgba(28,111,208,.1); border-color: rgba(28,111,208,.22); }
.ev-card h2 { margin: .55rem 0 .25rem; font-size: 1.05rem; letter-spacing: -.01em; overflow-wrap: anywhere; }
.ev-card__time { display: flex; align-items: center; gap: .4rem; margin: 0; font-size: .78rem; color: var(--text-muted); }
.ev-card__desc { margin: .5rem 0 0; font-size: .8rem; line-height: 1.55; color: var(--text-secondary); overflow-wrap: anywhere; }
.ev-prog { margin-top: .8rem; max-width: 30rem; color: var(--event-status-ongoing-ink); }
.ev-prog--next { color: var(--brand-ink); }
.ev-prog > div:first-child { display: flex; justify-content: space-between; gap: .75rem; margin-bottom: .35rem; font-size: .72rem; font-weight: 600; }
.ev-prog em { font-style: normal; font-weight: 800; }
.ev-prog .ev-bar i { background: linear-gradient(90deg, currentColor, color-mix(in srgb, currentColor 55%, #fff)); }
.ev-card__actions { display: flex; gap: .3rem; opacity: .85; }
.ev-card:hover .ev-card__actions { opacity: 1; }
.ev-card__actions button { padding: .42rem .8rem; border: 0; border-radius: 99px; color: var(--text-secondary); background: var(--bg-elevated); font-size: .72rem; font-weight: 700; }
.ev-card__actions button:not(:disabled):hover { background: var(--bg-elevated-2); color: var(--text-primary); }
.ev-card__actions .is-danger { color: var(--ink-rose); }
.ev-card__actions .is-danger:not(:disabled):hover { background: color-mix(in srgb, var(--ink-rose) 14%, transparent); color: var(--ink-rose); }

/* pager */
.ev-pager { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: .9rem 1rem; border-top: 1px solid var(--border-subtle); font-size: .76rem; color: var(--text-muted); }
.ev-pager > div { display: flex; gap: .25rem; max-width: 100%; overflow-x: auto; }
.ev-pager button { min-width: 2.1rem; padding: .42rem .7rem; border: 0; border-radius: 99px; color: var(--text-secondary); background: var(--bg-elevated); font-weight: 700; }
.ev-pager button.is-current { color: #fff; background: var(--brand); }

/* calendar */
.ev-cal { padding: 1rem; }
.ev-cal__head { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: 1rem; }
.ev-cal__title { text-align: center; }
.ev-cal__title h2 { margin: 0; font-size: 1.1rem; letter-spacing: -.02em; }
.ev-cal__title div { display: flex; justify-content: center; align-items: center; gap: .5rem; margin-top: .25rem; font-size: .68rem; color: var(--text-muted); }
.ev-cal__title button { padding: .15rem .6rem; border: 0; border-radius: 99px; color: var(--brand-ink); background: color-mix(in srgb, var(--brand) 14%, transparent); font-size: .68rem; font-weight: 800; }
.ev-cal__weekdays, .ev-cal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .35rem; }
.ev-cal__weekdays { margin-bottom: .35rem; }
.ev-cal__weekdays span { padding: .3rem; text-align: center; font-size: .68rem; font-weight: 800; color: var(--text-muted); }
.ev-cal__day { min-width: 0; min-height: 7.6rem; padding: .45rem; border-radius: .85rem; background: var(--bg-elevated); border: 1px solid transparent; }
.ev-cal__day.is-outside { opacity: .45; }
.ev-cal__day.is-today { border-color: var(--brand); background: color-mix(in srgb, var(--brand) 8%, var(--bg-card)); }
.ev-cal__num { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; margin-bottom: .3rem; border-radius: 50%; font-size: .72rem; font-weight: 800; }
.ev-cal__day.is-today .ev-cal__num { color: #fff; background: var(--brand); }
.ev-cal__items { display: grid; gap: .22rem; }
.ev-pill { --c: var(--brand); min-width: 0; padding: .25rem .4rem; border: 0; border-radius: .45rem; text-align: left; font-size: .62rem; line-height: 1.25; color: var(--text-primary); background: color-mix(in srgb, var(--c) 16%, var(--bg-card)); }
.ev-pill:hover { background: color-mix(in srgb, var(--c) 28%, var(--bg-card)); }
.ev-pill b { margin-right: .25rem; font-size: .58rem; color: var(--c); }
.ev-pill--ongoing { --c: var(--event-status-ongoing-ink); }
.ev-pill--soon { --c: var(--event-status-soon-ink); }
.ev-pill--past { --c: var(--event-status-past-ink); }
.ev-cal--day .ev-cal__grid { grid-template-columns: 1fr; }
.ev-cal--day .ev-cal__day { min-height: clamp(20rem, 55vh, 34rem); padding: .8rem; }
.ev-cal--day .ev-pill { padding: .5rem .65rem; font-size: .8rem; }

/* editor */
.ev-modal { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 1rem; background: rgba(6,8,20,.6); backdrop-filter: blur(12px); }
.ev-sheet { width: min(100%, 40rem); max-height: calc(100vh - 2rem); display: flex; flex-direction: column; overflow: hidden; border-radius: 1.6rem; background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: 0 40px 80px -30px rgba(0,0,0,.6); color: var(--text-primary); }
.ev-sheet__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.3rem 1.4rem 1rem; background: linear-gradient(135deg, color-mix(in srgb, var(--brand) 14%, transparent), transparent); }
.ev-sheet__head h2 { margin: .5rem 0 0; font-size: 1.3rem; letter-spacing: -.02em; }
.ev-sheet__body { display: grid; gap: 1rem; padding: 1.1rem 1.4rem; overflow: auto; }
.ev-sheet__foot { display: flex; justify-content: flex-end; gap: .5rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle); }
.ev-field { display: block; min-width: 0; margin: 0; padding: 0; border: 0; }
.ev-field > span, .ev-field > legend { display: block; margin-bottom: .4rem; padding: 0; font-size: .74rem; font-weight: 700; color: var(--text-secondary); }
.ev-field input, .ev-field select, .ev-field textarea { box-sizing: border-box; display: block; width: 100%; min-width: 0; padding: .7rem .85rem; font: inherit; font-size: .88rem; color: var(--text-primary); background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: .85rem; outline: none; transition: border-color .15s, box-shadow .15s; }
.ev-field input:focus, .ev-field select:focus, .ev-field textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.ev-field textarea { resize: vertical; }
.ev-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.ev-types label { position: relative; display: grid; justify-items: center; gap: .2rem; padding: .8rem .4rem; text-align: center; border-radius: .95rem; border: 1.5px solid var(--border-subtle); background: var(--bg-elevated); font-size: .72rem; font-weight: 700; cursor: pointer; transition: .15s ease; }
.ev-types label:hover { border-color: var(--border-default); }
.ev-types label.is-selected { border-color: var(--brand); color: var(--brand-ink); background: color-mix(in srgb, var(--brand) 10%, var(--bg-elevated)); }
.ev-types input { position: absolute; opacity: 0; pointer-events: none; }
.ev-types i { font-style: normal; font-size: 1.3rem; }
.ev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
.ev-grid--one { grid-template-columns: 1fr; }
.ev-grid--two { grid-template-columns: repeat(2, 1fr); }

/* responsive */
@media (max-width: 960px) {
  .ev-cal__day { min-height: 6rem; }
  .ev-pill b { display: none; }
  .ev-pill span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
@media (max-width: 760px) {
  .ev { padding: .75rem .75rem 3rem; }
  .ev-hero { padding: 1.4rem 1.2rem; border-radius: 1.3rem; align-items: flex-start; }
  .ev-hero__actions { width: 100%; }
  .ev-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ev-stat { padding: .8rem; }
  .ev-card { grid-template-columns: 3.4rem minmax(0, 1fr); gap: .75rem; padding: .9rem; }
  .ev-card__date { height: 3.8rem; }
  .ev-card__actions { grid-column: 1 / -1; flex-wrap: wrap; }
  .ev-cal { padding: .6rem; }
  .ev-cal__day { min-height: 4.6rem; padding: .25rem; border-radius: .6rem; }
  .ev-cal__grid, .ev-cal__weekdays { gap: .2rem; }
  .ev-pill { padding: .15rem .25rem; font-size: .55rem; }
  .ev-pager { flex-direction: column; align-items: flex-start; }
  .ev-modal { padding: 0; align-items: end; }
  .ev-sheet { width: 100%; max-height: 92vh; border-radius: 1.6rem 1.6rem 0 0; }
  .ev-types { grid-template-columns: 1fr; }
  .ev-types label { grid-template-columns: auto 1fr; justify-items: start; text-align: left; padding: .65rem .85rem; gap: .6rem; }
  .ev-grid, .ev-grid--two { grid-template-columns: 1fr; }
}
</style>
