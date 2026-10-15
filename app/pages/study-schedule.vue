<template>
  <AppTabsLayout>
    <main class="schedule-shell">
      <header class="schedule-hero">
        <div>
          <p class="schedule-kicker">ACADEMIC PLANNER</p>
          <h1>ตารางเรียนของฉัน</h1>
          <p class="schedule-subtitle">จัดลำดับวันเรียนและเวลาให้เห็นภาพในมุมเดียว</p>
        </div>
        <div class="hero-actions">
          <select v-if="terms.length" v-model="selectedTermId" class="term-select">
            <option v-for="term in terms" :key="term.id" :value="term.id">{{ term.termName }}</option>
          </select>
          <button v-if="selectedTermId" type="button" class="icon-action" title="แก้ไขภาคเรียน" @click="openEditTermModal">✎</button>
          <button type="button" class="outline-action" @click="openCreateTermModal">+ ภาคเรียน</button>
          <button type="button" class="primary-action" :disabled="!selectedTermId" @click="openCreateScheduleModal">+ เพิ่มคาบเรียน</button>
        </div>
      </header>

      <p v-if="errorMessage" class="schedule-error">{{ errorMessage }}</p>

      <section v-if="!isLoading && !terms.length" class="welcome-panel">
        <span class="welcome-mark">01</span>
        <div><h2>เริ่มต้นด้วยภาคเรียน</h2><p>สร้างช่วงเวลาเรียนก่อน แล้วเพิ่มวิชาและคาบเรียนของคุณได้ทันที</p></div>
        <button class="primary-action" @click="openCreateTermModal">สร้างภาคเรียน</button>
      </section>

      <template v-else>
        <section class="overview-strip">
          <div class="overview-stat"><span>ภาคเรียนที่เลือก</span><strong>{{ selectedTermName }}</strong></div>
          <div class="overview-stat"><span>รายวิชา</span><strong>{{ uniqueSubjectsCount }} <small>วิชา</small></strong></div>
          <div class="overview-stat"><span>คาบเรียนทั้งหมด</span><strong>{{ totalClasses }} <small>คาบ</small></strong></div>
          <button class="refresh-action" :disabled="isLoading" @click="loadSchedules">↻ {{ isLoading ? 'กำลังโหลด' : 'รีเฟรช' }}</button>
        </section>

        <section class="today-board">
          <div class="today-heading">
            <div><p class="schedule-kicker">TODAY / LIVE</p><h2>แผนของวันนี้</h2></div>
            <span class="date-chip">{{ getDayLabel(todayWeekday) }}</span>
          </div>
          <div v-if="!isInActiveTerm" class="today-empty">
            <strong>ยังไม่อยู่ในช่วงภาคเรียน</strong><span>{{ offTermMessage }}</span>
            <em v-if="nextTermCountdown">{{ nextTermCountdown.termName }} · เริ่มในอีก {{ nextTermCountdown.label }}</em>
          </div>
          <div v-else-if="!todaysClasses.length" class="today-empty"><strong>วันนี้ไม่มีคาบเรียน</strong><span>ใช้เวลานี้พักผ่อน หรือเคลียร์งานที่ค้างไว้</span></div>
          <div v-else class="today-list">
            <button
              v-for="item in todaysClasses"
              :key="item.id"
              class="today-session"
              :class="[
                getClassStatus(item),
                { 'is-focus': targetBlinkClass?.id === item.id }
              ]"
              :style="{ '--course': courseTint(item.course_name) }"
              @click="openEditScheduleModal(item)"
            >
              <span class="session-time">{{ formatTimeRange(item.start_time, item.end_time) }}</span>
              <span class="session-name">{{ item.course_name }}</span>
              <span class="session-meta">{{ item.location || 'ไม่ระบุสถานที่' }}</span>
              <span class="session-status">{{ getCountdownLabel(item) }}</span>
              <span class="session-progress-head">
                <span>{{ getProgressPhaseLabel(item) }}</span>
                <span>{{ Math.round(getClassProgress(item)) }}%</span>
              </span>
              <span class="session-progress-track" aria-hidden="true">
                <span
                  class="session-progress-fill"
                  :style="{ width: `${getClassProgress(item)}%` }"
                ></span>
              </span>
            </button>
          </div>
        </section>

        <section class="week-section">
          <div class="section-heading"><div><p class="schedule-kicker">WEEK AT A GLANCE</p><h2>ตารางประจำสัปดาห์</h2></div><span>{{ totalClasses }} คาบในภาคเรียนนี้</span></div>
          <div v-if="!schedules.length" class="empty-schedule"><p>ยังไม่มีคาบเรียนในภาคนี้</p><button class="outline-action" @click="openCreateScheduleModal">เพิ่มคาบแรก</button></div>
          <div v-else class="week-rail">
            <article v-for="day in gridDays" :key="day.value" class="day-column" :class="{ 'is-today': day.value === todayWeekday }">
              <header><span>{{ String(day.value).padStart(2, '0') }}</span><h3>{{ day.label }}</h3></header>
              <div class="day-sessions">
                <button v-for="item in getSchedulesForDay(day.value)" :key="item.id" class="course-line" :style="{ '--course': courseTint(item.course_name) }" @click="openEditScheduleModal(item)">
                  <time>{{ formatTimeRange(item.start_time, item.end_time) }}</time><strong>{{ item.course_name }}</strong><small>{{ item.location || 'ไม่ระบุสถานที่' }}</small>
                </button>
                <p v-if="!getSchedulesForDay(day.value).length" class="free-note">ว่าง</p>
              </div>
            </article>
          </div>
        </section>

        <section class="agenda-section">
          <div class="section-heading"><div><p class="schedule-kicker">ALL SESSIONS</p><h2>รายการคาบเรียน</h2></div><span>{{ schedulePageInfo }}</span></div>
          <div class="agenda-list">
            <article v-for="item in paginatedSchedules" :key="item.id" class="agenda-row" :style="{ '--course': courseTint(item.course_name) }">
              <time>{{ formatTimeRange(item.start_time, item.end_time) }}</time><div><strong>{{ item.course_name }}</strong><span>{{ getDayLabel(item.day_of_week) }}<i v-if="item.location"> · {{ item.location }}</i></span></div>
              <div class="row-actions"><button @click="openEditScheduleModal(item)">แก้ไข</button><button class="delete" :disabled="isDeletingId === item.id" @click="deleteSchedule(item.id)">{{ isDeletingId === item.id ? 'กำลังลบ' : 'ลบ' }}</button></div>
            </article>
          </div>
          <nav v-if="scheduleTotalPages > 1" class="pager"><button :disabled="scheduleCurrentPage === 1" @click="scheduleCurrentPage--">ก่อนหน้า</button><button v-for="page in scheduleTotalPages" :key="page" :class="{ active: page === scheduleCurrentPage }" @click="scheduleCurrentPage = page">{{ page }}</button><button :disabled="scheduleCurrentPage === scheduleTotalPages" @click="scheduleCurrentPage++">ถัดไป</button></nav>
        </section>
      </template>
    </main>

    <Teleport to="body"><div v-if="isScheduleModalOpen" class="dialog-backdrop" @click.self="closeScheduleModal"><form class="schedule-dialog" @submit.prevent="submitSchedule"><header><div><p class="schedule-kicker">CLASS DETAILS</p><h2>{{ formTitle }}</h2></div><button type="button" @click="closeScheduleModal">×</button></header><div class="dialog-body"><label>ชื่อวิชา<input v-model="form.courseName" required maxlength="120" placeholder="เช่น ภาษาอังกฤษ" /></label><label v-if="!isMultiSessionMode">วันเรียน<select v-model.number="form.dayOfWeek"><option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option></select></label><div v-if="!isMultiSessionMode" class="form-grid"><label>เริ่ม<input v-model="form.startTime" type="time" required /></label><label>สิ้นสุด<input v-model="form.endTime" type="time" required /></label></div><label v-if="!isMultiSessionMode">สถานที่<input v-model="form.location" maxlength="120" placeholder="ไม่บังคับ" /></label><label class="mode-toggle"><input v-model="isMultiSessionMode" type="checkbox" @change="isEditing && toggleMultiSessionInEdit" />เพิ่มหลายคาบสำหรับวิชาเดียวกัน</label><div v-if="isMultiSessionMode" class="multi-editor"><div v-for="(session, index) in multiSessions" :key="index" class="multi-row"><select v-model.number="session.dayOfWeek"><option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option></select><input v-model="session.startTime" type="time" /><input v-model="session.endTime" type="time" /><input v-model="session.location" placeholder="สถานที่" /><button type="button" @click="removeSession(index)">×</button></div><button type="button" class="outline-action" @click="addSession">+ เพิ่มคาบ</button></div></div><footer><button type="button" class="outline-action" @click="closeScheduleModal">ยกเลิก</button><button class="primary-action" :disabled="isSubmitting">{{ submitButtonText }}</button></footer></form></div></Teleport>
    <Teleport to="body"><div v-if="isTermModalOpen" class="dialog-backdrop" @click.self="closeTermModal"><form class="schedule-dialog compact" @submit.prevent="submitTerm"><header><div><p class="schedule-kicker">TERM SETTINGS</p><h2>{{ isEditingTerm ? 'แก้ไขภาคเรียน' : 'สร้างภาคเรียน' }}</h2></div><button type="button" @click="closeTermModal">×</button></header><div class="dialog-body"><label>ชื่อภาคเรียน<input v-model="termForm.termName" required maxlength="120" /></label><div class="form-grid"><label>วันเริ่ม<input v-model="termForm.startDate" type="date" required /></label><label>วันสิ้นสุด<input v-model="termForm.endDate" type="date" required /></label></div></div><footer><button type="button" class="outline-action" @click="closeTermModal">ยกเลิก</button><button class="primary-action" :disabled="isSubmittingTerm">{{ isSubmittingTerm ? 'กำลังบันทึก' : 'บันทึก' }}</button></footer></form></div></Teleport>
  </AppTabsLayout>
</template>


<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { getTodayTH, nowTH } from '~/utils/date'

type ScheduleRow = {
  id: string
  course_name: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
}

type BackendCourse = {
  id: string
  termId: string
  courseCode: string
  courseName: string
  room: string | null
  instructor: string | null
  dayOfWeek: string
  startTime: string
  endTime: string
  colorHex: string | null
}

type BackendTerm = {
  id: string
  userId: string
  termName: string
  startDate: string
  endDate: string
  courses: BackendCourse[]
}

type DayOption = {
  value: number
  label: string
}

type TimeSlot = {
  key: string
  start: string
  end: string
  label: string
  sortKey: number
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ตารางเรียน' })

const { apiFetch, userId } = useBackendApi()

const dayNameToNumber: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
}
const dayNumberToName: Record<number, string> = {
  1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 7: 'sunday',
}

const dayOptions: DayOption[] = [
  { value: 1, label: 'จันทร์' }, { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' }, { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' }, { value: 6, label: 'เสาร์' },
  { value: 7, label: 'อาทิตย์' },
]

const dayLabelMap = new Map(dayOptions.map(item => [item.value, item.label]))

// Grid shows Mon–Fri by default; a weekend column appears only when it has classes
const gridDays = computed(() => dayOptions.filter(day =>
  day.value <= 5 || schedules.value.some(item => item.day_of_week === day.value)
))

// Deterministic colour per course (smart mapping to match mockup, hash fallback)
const courseColorMap: Record<string, number> = {
  'โครงสร้างข้อมูล': 0, // Blue (var(--brand))
  'ปฏิบัติการเว็บ': 1,  // Green (var(--ink-emerald))
  'แคลคูลัส': 1,      // Green (var(--ink-emerald))
  'ภาษาอังกฤษ': 2,    // Yellow (var(--ink-amber))
  'ระบบฐานข้อมูล': 3,   // Purple (var(--brand-2))
  'เครือข่าย': 4,       // Pink/Red (var(--ink-rose))
}

const courseColorIndex = (name: string) => {
  const trimmed = name.trim()
  if (courseColorMap[trimmed] !== undefined) {
    return courseColorMap[trimmed]
  }
  for (const [key, val] of Object.entries(courseColorMap)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return val
  }
  let hash = 0
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = ((hash * 31) + trimmed.charCodeAt(i)) >>> 0
  }
  return hash % 5
}

const courseTint = (name: string) => ['var(--brand)', 'var(--ink-emerald)', 'var(--ink-amber)', 'var(--brand-2)', 'var(--ink-rose)'][courseColorIndex(name)]
const courseInk = (name: string) => ['var(--brand-ink)', 'var(--ink-emerald)', 'var(--ink-amber)', 'var(--brand-2)', 'var(--ink-rose)'][courseColorIndex(name)]

const terms = ref<BackendTerm[]>([])
const selectedTermId = ref('')

const mapTermCourses = (term?: BackendTerm | null): ScheduleRow[] => {
  if (!term) return []
  return term.courses.map(c => ({
    id: c.id,
    course_name: c.courseName,
    day_of_week: dayNameToNumber[c.dayOfWeek] || 1,
    start_time: c.startTime,
    end_time: c.endTime,
    location: c.room,
  }))
}

const schedules = computed<ScheduleRow[]>(() => {
  return mapTermCourses(terms.value.find(t => t.id === selectedTermId.value))
})
const currentTime = ref(nowTH())
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDeletingId = ref('')
const isScheduleModalOpen = ref(false)
const editingScheduleId = ref('')
const errorMessage = ref('')
const scheduleItemsPerPage = ref(20)
const scheduleCurrentPage = ref(1)

const isTermModalOpen = ref(false)
const isSubmittingTerm = ref(false)
const editingTermId = ref('')
const termForm = reactive({ termName: '', startDate: '', endDate: '' })
const isEditingTerm = computed(() => Boolean(editingTermId.value))

const form = reactive({
  courseName: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', location: '',
})

// Multi-session mode
const isMultiSessionMode = ref(false)
const multiSessions = ref<Array<{ id?: string; dayOfWeek: number; startTime: string; endTime: string; location?: string }>>([
  { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', location: '' }
])

const getApiErrorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

const getDayLabel = (day: number) => dayLabelMap.get(day) || 'ไม่ระบุ'
const formatTimeRange = (start: string, end: string) => `${start.slice(0, 5)} - ${end.slice(0, 5)}`
const toMinutes = (time: string) => {
  const [hour = '0', minute = '0'] = time.split(':')
  return (Number(hour) * 60) + Number(minute)
}

const hourHeight = 70 // pixels per hour row

const selectedTermName = computed(() => terms.value.find(t => t.id === selectedTermId.value)?.termName || 'ยังไม่มีภาคเรียน')

const termDateKey = (value?: string | null) => (value ? String(value).slice(0, 10) : '')

const formatThaiDateLabel = (dateStr: string) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  return new Date(year, month - 1, day).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const termStartMs = (term: BackendTerm) => {
  const [year, month, day] = termDateKey(term.startDate).split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

const formatDurationCountdown = (ms: number) => {
  if (ms <= 0) return 'เริ่มแล้ว'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) {
    return hours > 0 ? `${days} วัน ${hours} ชม.` : `${days} วัน`
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`
  }
  if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`
  }
  return `${seconds} วินาที`
}

const activeTerm = computed(() => {
  const todayStr = getTodayTH()
  return terms.value.find((term) => {
    const start = termDateKey(term.startDate)
    const end = termDateKey(term.endDate)
    return Boolean(start && end && start <= todayStr && end >= todayStr)
  }) || null
})

const nextUpcomingTerm = computed(() => {
  const nowMs = currentTime.value.getTime()
  return terms.value
    .filter((term) => termStartMs(term) > nowMs)
    .sort((a, b) => termStartMs(a) - termStartMs(b))[0] || null
})

const isInActiveTerm = computed(() => Boolean(activeTerm.value))
const activeTermName = computed(() => activeTerm.value?.termName || '')

const nextTermCountdown = computed(() => {
  const term = nextUpcomingTerm.value
  if (!term) return null
  const startMs = termStartMs(term)
  if (Number.isNaN(startMs)) return null
  return {
    termName: term.termName,
    label: formatDurationCountdown(startMs - currentTime.value.getTime()),
    dateLabel: `เริ่ม ${formatThaiDateLabel(termDateKey(term.startDate))}`,
  }
})

const offTermMessage = computed(() => {
  if (!terms.value.length) return 'ยังไม่มีภาคเรียนในระบบ'
  if (nextTermCountdown.value) return 'อยู่นอกช่วงเวลาของภาคเรียนปัจจุบัน'
  return 'ภาคเรียนล่าสุดสิ้นสุดแล้ว และยังไม่มีภาคเรียนถัดไป'
})

const todaySchedules = computed<ScheduleRow[]>(() => mapTermCourses(activeTerm.value))

const uniqueSubjectsCount = computed(() => {
  const names = schedules.value.map(item => item.course_name.trim())
  return new Set(names).size
})

const startHour = computed(() => {
  if (!schedules.value.length) return 8
  const hours = schedules.value.map(item => toMinutes(item.start_time) / 60)
  return Math.max(0, Math.min(8, Math.floor(Math.min(...hours))))
})

const endHour = computed(() => {
  if (!schedules.value.length) return 18
  const hours = schedules.value.map(item => toMinutes(item.end_time) / 60)
  return Math.min(24, Math.max(18, Math.ceil(Math.max(...hours))))
})

const totalHours = computed(() => endHour.value - startHour.value)

const timelineHours = computed(() => {
  const hours: number[] = []
  for (let h = startHour.value; h < endHour.value; h++) {
    hours.push(h)
  }
  return hours
})

const formatHour = (hour: number) => {
  return `${String(hour).padStart(2, '0')}:00`
}

interface PositionedSchedule extends ScheduleRow {
  top: number
  height: number
  width: number
  left: number
}

const getPositionedSchedulesForDay = (dayValue: number): PositionedSchedule[] => {
  const dayClasses = sortedSchedules.value.filter(item => item.day_of_week === dayValue)
  if (!dayClasses.length) return []

  const startH = startHour.value
  const endH = endHour.value
  const totalMinutes = (endH - startH) * 60

  const items = dayClasses.map(item => {
    const startM = toMinutes(item.start_time)
    const endM = toMinutes(item.end_time)
    const relativeStart = Math.max(0, startM - startH * 60)
    const relativeEnd = Math.min(totalMinutes, endM - startH * 60)
    const duration = Math.max(15, relativeEnd - relativeStart)

    return {
      ...item,
      startM,
      endM,
      top: (relativeStart / totalMinutes) * 100,
      height: (duration / totalMinutes) * 100,
      width: 100,
      left: 0,
      column: 0,
      maxColumns: 1
    }
  })

  items.sort((a, b) => {
    if (a.startM !== b.startM) return a.startM - b.startM
    return (b.endM - b.startM) - (a.endM - a.startM)
  })

  const clusters: (typeof items)[] = []
  for (const item of items) {
    let assigned = false
    for (const cluster of clusters) {
      const hasOverlap = cluster.some(c => item.startM < c.endM && item.endM > c.startM)
      if (hasOverlap) {
        cluster.push(item)
        assigned = true
        break
      }
    }
    if (!assigned) {
      clusters.push([item])
    }
  }

  for (const cluster of clusters) {
    const cols: (typeof items)[] = []
    for (const item of cluster) {
      let colIdx = 0
      while (true) {
        let col = cols[colIdx]
        if (!col) {
          col = []
          cols[colIdx] = col
        }
        const overlap = col.some(c => item.startM < c.endM && item.endM > c.startM)
        if (!overlap) {
          col.push(item)
          item.column = colIdx
          break
        }
        colIdx++
      }
    }
    const totalCols = cols.length
    for (const item of cluster) {
      item.maxColumns = totalCols
      item.width = 100 / totalCols
      item.left = item.column * (100 / totalCols)
    }
  }

  return items
}

const totalClasses = computed(() => schedules.value.length)
const isEditing = computed(() => Boolean(editingScheduleId.value))
const formTitle = computed(() => isEditing.value ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน')
const formSubtitle = computed(() => isEditing.value ? 'ปรับข้อมูลแล้วกดบันทึก' : 'ใส่ข้อมูลพื้นฐานที่จำเป็น')
const submitButtonText = computed(() => {
  if (isSubmitting.value) return isEditing.value ? 'กำลังบันทึก...' : 'กำลังบันทึก...'
  return isEditing.value ? 'บันทึกการแก้ไข' : 'บันทึกคาบเรียน'
})

const todayWeekday = computed(() => {
  const day = currentTime.value.getDay()
  return day === 0 ? 7 : day
})

const selectedMobileDay = ref<number>(todayWeekday.value)

const getDayLabelAbbr = (dayValue: number) => {
  const abbrMap: Record<number, string> = {
    1: 'จ.', 2: 'อ.', 3: 'พ.', 4: 'พฤ.', 5: 'ศ.', 6: 'ส.', 7: 'อา.'
  }
  return abbrMap[dayValue] || ''
}

const getSchedulesForDay = (dayValue: number) => {
  return sortedSchedules.value.filter(item => item.day_of_week === dayValue)
}

const sortScheduleRows = (rows: ScheduleRow[]) => [...rows].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
  return a.start_time.localeCompare(b.start_time)
})

const sortedSchedules = computed(() => sortScheduleRows(schedules.value))
const sortedTodaySchedules = computed(() => sortScheduleRows(todaySchedules.value))

const todaysClasses = computed(() => {
  if (!isInActiveTerm.value) return []
  return sortedTodaySchedules.value.filter(item => item.day_of_week === todayWeekday.value)
})

const { isBlinking, remainingSeconds, triggerBlink } = useStudyBlink(5000)

const currentClass = computed(() => {
  return todaysClasses.value.find(item => getClassStatus(item) === 'active') || null
})

const nextClassToday = computed(() => {
  return todaysClasses.value.find(item => getClassStatus(item) === 'upcoming') || null
})

const targetBlinkClass = computed(() => {
  return currentClass.value || nextClassToday.value || nextClass.value || null
})

const isBlinkingCard = (item: ScheduleRow) => {
  if (!isBlinking.value || !targetBlinkClass.value) return false
  return item.id === targetBlinkClass.value.id
}

const timeStringToDate = (timeStr: string) => {
  const parts = timeStr.split(':')
  const hours = Number(parts[0] || '0')
  const minutes = Number(parts[1] || '0')
  const seconds = Number(parts[2] || '0')
  const d = new Date(currentTime.value)
  d.setHours(hours, minutes, seconds, 0)
  return d
}

const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours} ชม. ${minutes} นาที ${seconds} วินาที`
  }
  if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`
  }
  return `${seconds} วินาที`
}

const getClassStatus = (item: ScheduleRow) => {
  const now = currentTime.value
  const startD = timeStringToDate(item.start_time)
  const endD = timeStringToDate(item.end_time)
  
  if (now >= endD) return 'finished'
  if (now >= startD && now < endD) return 'active'
  return 'upcoming'
}

const getClassProgress = (item: ScheduleRow) => {
  const nowMs = currentTime.value.getTime()
  const startMs = timeStringToDate(item.start_time).getTime()
  const endMs = timeStringToDate(item.end_time).getTime()

  if (nowMs >= endMs) return 0

  if (nowMs < startMs) {
    const preparationWindowMs = 12 * 60 * 60 * 1000
    const elapsedPreparationMs = preparationWindowMs - (startMs - nowMs)
    return Math.max(0, Math.min(100, (elapsedPreparationMs / preparationWindowMs) * 100))
  }

  const durationMs = Math.max(1, endMs - startMs)
  const remainingMs = endMs - nowMs
  return Math.max(0, Math.min(100, (remainingMs / durationMs) * 100))
}

const getProgressPhaseLabel = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'active') return 'กำลังเรียน · เวลาคงเหลือ'
  if (status === 'finished') return 'เรียนเสร็จแล้ว'
  return getClassProgress(item) > 0 ? 'เตรียมเข้าเรียน' : 'รอเวลาเรียน'
}

const getClassCardStyle = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'finished') {
    return {
      background: 'rgba(123, 131, 152, 0.03)',
      borderColor: 'var(--border-subtle)',
      opacity: '0.65',
    }
  }
  if (status === 'active') {
    return {
      background: 'rgba(10, 138, 92, 0.05)',
      borderColor: 'rgba(10, 138, 92, 0.3)',
      boxShadow: '0 0 12px rgba(10, 138, 92, 0.08)',
    }
  }
  return {
    background: 'var(--bg-card)',
    borderColor: 'var(--border-subtle)',
  }
}

const getStatusBadgeStyle = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'finished') return { background: 'var(--text-muted)' }
  if (status === 'active') return { background: 'var(--ink-emerald)' }
  return { background: 'var(--brand)' }
}

const getStatusLabel = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'finished') return 'เรียนเสร็จแล้ว'
  if (status === 'active') return '🔴 กำลังเรียน'
  return '⏳ ก่อนเรียน'
}

const getCountdownLabel = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'finished') return 'เรียนเสร็จสิ้นแล้ว'
  
  const now = currentTime.value
  if (status === 'active') {
    const endD = timeStringToDate(item.end_time)
    const diff = endD.getTime() - now.getTime()
    return `เหลืออีก ${formatCountdown(diff)}`
  }
  
  // upcoming
  const startD = timeStringToDate(item.start_time)
  const diff = startD.getTime() - now.getTime()
  return `เริ่มในอีก ${formatCountdown(diff)}`
}

const getCountdownTextStyle = (item: ScheduleRow) => {
  const status = getClassStatus(item)
  if (status === 'finished') return { color: 'var(--text-muted)' }
  if (status === 'active') return { color: 'var(--ink-emerald)', fontWeight: 'bold' }
  return { color: 'var(--brand-ink)' }
}

const weeklyBoard = computed(() => dayOptions.map(day => ({
  ...day,
  items: sortedSchedules.value.filter(item => item.day_of_week === day.value),
})))

const gridTimeSlots = computed<TimeSlot[]>(() => {
  const slotMap = new Map<string, TimeSlot>()
  for (const item of sortedSchedules.value) {
    const start = item.start_time.slice(0, 5)
    const end = item.end_time.slice(0, 5)
    const key = `${start}-${end}`
    if (!slotMap.has(key)) slotMap.set(key, { key, start, end, label: formatTimeRange(start, end), sortKey: toMinutes(start) })
  }
  return Array.from(slotMap.values()).sort((a, b) => a.sortKey !== b.sortKey ? a.sortKey - b.sortKey : a.end.localeCompare(b.end))
})

const scheduleGrid = computed(() => {
  const grid = {} as Record<number, Record<string, ScheduleRow[]>>
  for (const day of dayOptions) grid[day.value] = {}
  for (const item of sortedSchedules.value) {
    const key = `${item.start_time.slice(0, 5)}-${item.end_time.slice(0, 5)}`
    const dayGrid = grid[item.day_of_week] || {}
    grid[item.day_of_week] = dayGrid
    if (!dayGrid[key]) dayGrid[key] = []
    dayGrid[key].push(item)
  }
  return grid
})

const nextClass = computed(() => {
  if (!isInActiveTerm.value || !sortedTodaySchedules.value.length) return null
  const now = currentTime.value
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedTodaySchedules.value.filter(item => item.day_of_week === checkingDay).sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (const item of classesInDay) {
      const startMinutes = toMinutes(item.start_time)
      const endMinutes = toMinutes(item.end_time)
      if (offset > 0 || currentMinutes < endMinutes || currentMinutes <= startMinutes) return item
    }
  }
  return sortedTodaySchedules.value[0] || null
})

const nextClassTitle = computed(() => nextClass.value?.course_name || 'ยังไม่มีคาบเรียน')
const nextClassSubtitle = computed(() => {
  if (!nextClass.value) return 'เพิ่มคาบเรียนแรก'
  return `${getDayLabel(nextClass.value.day_of_week)} • ${formatTimeRange(nextClass.value.start_time, nextClass.value.end_time)}`
})

const scheduleTotalPages = computed(() => Math.ceil(schedules.value.length / scheduleItemsPerPage.value))
const paginatedSchedules = computed(() => {
  const start = (scheduleCurrentPage.value - 1) * scheduleItemsPerPage.value
  const end = start + scheduleItemsPerPage.value
  return sortedSchedules.value.slice(start, end)
})

const schedulePageInfo = computed(() => {
  const total = schedules.value.length
  if (total === 0) return 'ไม่มีรายการ'
  const start = (scheduleCurrentPage.value - 1) * scheduleItemsPerPage.value + 1
  const end = Math.min(scheduleCurrentPage.value * scheduleItemsPerPage.value, total)
  return `แสดง ${start}-${end} จาก ${total} รายการ`
})

const addSession = () => {
  multiSessions.value.push({ dayOfWeek: 1, startTime: '08:00', endTime: '09:00', location: '' })
}

const removeSession = async (index: number) => {
  if (multiSessions.value.length <= 1) {
    const { toastWarning } = useAlert()
    toastWarning('ต้องมีอย่างน้อย 1 คาบ')
    return
  }

  const session = multiSessions.value[index]

  // If session has an id, it exists in database - need to delete it
  if (session?.id && isEditing.value) {
    const { confirmDelete, toastSuccess, toastError } = useAlert()
    const shouldDelete = import.meta.client ? await confirmDelete('ลบคาบเรียนนี้ออกจากฐานข้อมูล?') : true
    if (!shouldDelete) return

    try {
      await apiFetch(`/api/Schedule/courses/${session.id}`, { method: 'DELETE' })
      multiSessions.value.splice(index, 1)
      toastSuccess('ลบคาบเรียนสำเร็จ')
      await loadSchedules()
    } catch (error: any) {
      console.error('Delete session error:', error)
      toastError('ลบคาบเรียนไม่สำเร็จ')
    }
  } else {
    // New session not yet saved - just remove from array
    multiSessions.value.splice(index, 1)
  }
}

const toggleMultiSessionInEdit = () => {
  if (isMultiSessionMode.value && multiSessions.value.length === 0) {
    // When enabling multi-session mode in edit, load all sessions of the same course
    const currentCourseName = form.courseName.trim()
    const sameCourseSchedules = schedules.value.filter(s =>
      s.course_name.trim() === currentCourseName
    ).sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
      return a.start_time.localeCompare(b.start_time)
    })

    if (sameCourseSchedules.length > 0) {
      multiSessions.value = sameCourseSchedules.map(s => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time.slice(0, 5),
        endTime: s.end_time.slice(0, 5),
        location: s.location || ''
      }))
    } else {
      // Fallback: use current form data
      multiSessions.value = [{
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location
      }]
    }
  }
}

const resetForm = () => {
  form.courseName = ''; form.dayOfWeek = 1; form.startTime = '08:00'
  form.endTime = '09:00'; form.location = ''
  editingScheduleId.value = ''
  isMultiSessionMode.value = false
  multiSessions.value = [{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00', location: '' }]
}

const openCreateScheduleModal = () => {
  const { toastWarning } = useAlert()
  if (!selectedTermId.value) { toastWarning('กรุณาเลือกหรือสร้างภาคเรียนก่อน'); return }
  resetForm(); errorMessage.value = ''; isScheduleModalOpen.value = true
}

const openEditScheduleModal = (item: ScheduleRow) => {
  editingScheduleId.value = item.id
  form.courseName = item.course_name
  form.dayOfWeek = item.day_of_week
  form.startTime = item.start_time.slice(0, 5)
  form.endTime = item.end_time.slice(0, 5)
  form.location = item.location || ''

  // Find all other sessions of the same course
  const sameCourseSchedules = schedules.value.filter(s =>
    s.course_name.trim() === item.course_name.trim()
  ).sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return a.start_time.localeCompare(b.start_time)
  })

  if (sameCourseSchedules.length > 1) {
    // Multi-session course - enable multi-session mode for editing
    isMultiSessionMode.value = true
    multiSessions.value = sameCourseSchedules.map(s => ({
      id: s.id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time.slice(0, 5),
      endTime: s.end_time.slice(0, 5),
      location: s.location || ''
    }))
  }

  errorMessage.value = ''
  isScheduleModalOpen.value = true
}

const closeScheduleModal = () => { resetForm(); errorMessage.value = ''; isScheduleModalOpen.value = false }

const resetTermForm = () => {
  editingTermId.value = ''
  termForm.termName = ''
  termForm.startDate = ''
  termForm.endDate = ''
}

const openCreateTermModal = () => {
  resetTermForm()
  isTermModalOpen.value = true
}

const openEditTermModal = () => {
  const { toastWarning } = useAlert()
  const term = terms.value.find(t => t.id === selectedTermId.value)
  if (!term) {
    toastWarning('กรุณาเลือกภาคเรียนก่อน')
    return
  }
  editingTermId.value = term.id
  termForm.termName = term.termName
  termForm.startDate = term.startDate ? term.startDate.slice(0, 10) : ''
  termForm.endDate = term.endDate ? term.endDate.slice(0, 10) : ''
  isTermModalOpen.value = true
}

const closeTermModal = () => {
  isTermModalOpen.value = false
  resetTermForm()
}

const submitTerm = async () => {
  if (isSubmittingTerm.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  if (!termForm.termName.trim()) { toastWarning('กรุณาระบุชื่อภาคเรียน'); return }
  if (!termForm.startDate || !termForm.endDate) { toastWarning('กรุณาระบุวันเริ่มและวันสิ้นสุดภาคเรียน'); return }
  if (termForm.endDate < termForm.startDate) { toastWarning('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม'); return }
  const wasEditing = isEditingTerm.value
  const editedTermId = editingTermId.value
  isSubmittingTerm.value = true
  try {
    if (!userId.value) return
    const payload = {
      termName: termForm.termName.trim(),
      startDate: `${termForm.startDate}T00:00:00`,
      endDate: `${termForm.endDate}T00:00:00`,
    }
    if (wasEditing) {
      await apiFetch<BackendTerm>(`/api/Schedule/terms/${editedTermId}`, {
        method: 'PUT',
        body: {
          id: editedTermId,
          userId: userId.value,
          ...payload,
        },
      })
      toastSuccess('แก้ไขภาคเรียนสำเร็จ')
      closeTermModal()
      await loadSchedules()
      selectedTermId.value = editedTermId
    } else {
      const created = await apiFetch<BackendTerm>('/api/Schedule/terms', {
        method: 'POST',
        body: {
          userId: userId.value,
          ...payload,
        },
      })
      toastSuccess('สร้างภาคเรียนสำเร็จ')
      closeTermModal()
      await loadSchedules()
      selectedTermId.value = created.id
    }
  } catch (error: any) {
    console.error(wasEditing ? 'Update term error:' : 'Create term error:', error)
    toastError(getApiErrorMessage(error, wasEditing ? 'แก้ไขภาคเรียนไม่สำเร็จ' : 'สร้างภาคเรียนไม่สำเร็จ'))
  } finally {
    isSubmittingTerm.value = false
  }
}

const findCurrentTerm = (termList: BackendTerm[]): BackendTerm | null => {
  if (!termList || !termList.length) return null
  const todayStr = getTodayTH()
  
  // 1. Term active today (startDate <= todayStr <= endDate)
  const activeTerm = termList.find(t => {
    const start = t.startDate ? t.startDate.slice(0, 10) : ''
    const end = t.endDate ? t.endDate.slice(0, 10) : ''
    return start <= todayStr && end >= todayStr
  })
  if (activeTerm) return activeTerm

  // 2. Fallback to term with latest start date prior to or closest to today
  const sorted = [...termList].sort((a, b) => {
    const startA = a.startDate ? a.startDate.slice(0, 10) : ''
    const startB = b.startDate ? b.startDate.slice(0, 10) : ''
    return startB.localeCompare(startA)
  })

  const pastOrCurrent = sorted.find(t => (t.startDate ? t.startDate.slice(0, 10) : '') <= todayStr)
  if (pastOrCurrent) return pastOrCurrent

  return sorted[0] || null
}

const loadSchedules = async () => {
  isLoading.value = true; errorMessage.value = ''
  try {
    if (!userId.value) return
    const previousSelected = selectedTermId.value
    const data = await apiFetch<BackendTerm[]>(`/api/Schedule/terms/${userId.value}`)
    terms.value = data

    if (previousSelected && data.some(t => t.id === previousSelected)) {
      selectedTermId.value = previousSelected
      return
    }

    const currentTerm = findCurrentTerm(data)
    selectedTermId.value = currentTerm?.id || data[0]?.id || ''
  } catch (error: any) {
    console.error('Load study schedules error:', error)
    errorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลตารางเรียนไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const submitSchedule = async () => {
  if (isSubmitting.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  if (!selectedTermId.value) { toastWarning('กรุณาเลือกหรือสร้างภาคเรียนก่อน'); return }
  if (!form.courseName.trim()) { toastWarning('กรุณาระบุชื่อวิชา'); return }

  // Validate sessions based on mode
  if (isMultiSessionMode.value) {
    // Validate all sessions
    for (let i = 0; i < multiSessions.value.length; i++) {
      const session = multiSessions.value[i]
      if (!session) continue
      if (!session.startTime || !session.endTime) {
        toastWarning(`กรุณาระบุเวลาเริ่มและสิ้นสุดสำหรับคาบที่ ${i + 1}`)
        return
      }
      if (toMinutes(session.endTime) <= toMinutes(session.startTime)) {
        toastWarning(`เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสำหรับคาบที่ ${i + 1}`)
        return
      }
    }
  } else {
    // Single session mode validation
    if (!form.startTime || !form.endTime) { toastWarning('กรุณาระบุเวลาเริ่มและสิ้นสุด'); return }
    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) { toastWarning('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'); return }
  }

  isSubmitting.value = true; errorMessage.value = ''
  try {
    if (isEditing.value) {
      if (isMultiSessionMode.value) {
        // Edit multiple sessions
        const promises = multiSessions.value.map(session => {
          const body = {
            termId: selectedTermId.value,
            courseCode: '',
            courseName: form.courseName.trim(),
            room: session.location?.trim() || null,
            instructor: null,
            dayOfWeek: dayNumberToName[session.dayOfWeek] || 'monday',
            startTime: `${session.startTime}:00`,
            endTime: `${session.endTime}:00`,
            colorHex: null,
          }

          if (session.id) {
            // Update existing session
            return apiFetch(`/api/Schedule/courses/${session.id}`, { method: 'PUT', body })
          } else {
            // Create new session (if user added more sessions while editing)
            return apiFetch('/api/Schedule/courses', { method: 'POST', body })
          }
        })
        await Promise.all(promises)
        toastSuccess(`แก้ไข ${multiSessions.value.length} คาบเรียนสำเร็จ`)
      } else {
        // Edit single session (existing behavior)
        const body = {
          termId: selectedTermId.value,
          courseCode: '',
          courseName: form.courseName.trim(),
          room: form.location.trim() || null,
          instructor: null,
          dayOfWeek: dayNumberToName[form.dayOfWeek] || 'monday',
          startTime: `${form.startTime}:00`,
          endTime: `${form.endTime}:00`,
          colorHex: null,
        }
        await apiFetch(`/api/Schedule/courses/${editingScheduleId.value}`, { method: 'PUT', body })
        toastSuccess('แก้ไขคาบเรียนสำเร็จ')
      }
    } else {
      // Create new session(s)
      if (isMultiSessionMode.value) {
        // Create multiple sessions
        const promises = multiSessions.value.map(session => {
          const body = {
            termId: selectedTermId.value,
            courseCode: '',
            courseName: form.courseName.trim(),
            room: session.location?.trim() || null,
            instructor: null,
            dayOfWeek: dayNumberToName[session.dayOfWeek] || 'monday',
            startTime: `${session.startTime}:00`,
            endTime: `${session.endTime}:00`,
            colorHex: null,
          }
          return apiFetch('/api/Schedule/courses', { method: 'POST', body })
        })
        await Promise.all(promises)
        toastSuccess(`เพิ่ม ${multiSessions.value.length} คาบเรียนสำเร็จ`)
      } else {
        // Create single session
        const body = {
          termId: selectedTermId.value,
          courseCode: '',
          courseName: form.courseName.trim(),
          room: form.location.trim() || null,
          instructor: null,
          dayOfWeek: dayNumberToName[form.dayOfWeek] || 'monday',
          startTime: `${form.startTime}:00`,
          endTime: `${form.endTime}:00`,
          colorHex: null,
        }
        await apiFetch('/api/Schedule/courses', { method: 'POST', body })
        toastSuccess('เพิ่มคาบเรียนสำเร็จ')
      }
    }
    resetForm(); isScheduleModalOpen.value = false; await loadSchedules()
  } catch (error: any) {
    console.error('Save study schedule error:', error)
    const msg = getApiErrorMessage(error, 'บันทึกคาบเรียนไม่สำเร็จ'); errorMessage.value = msg; toastError(msg)
  } finally {
    isSubmitting.value = false
  }
}

const deleteSchedule = async (scheduleId: string) => {
  if (!scheduleId || isDeletingId.value) return
  const { confirmDelete, toastSuccess, toastError } = useAlert()
  const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบคาบเรียนนี้?') : true
  if (!shouldDelete) return
  isDeletingId.value = scheduleId; errorMessage.value = ''
  try {
    await apiFetch(`/api/Schedule/courses/${scheduleId}`, { method: 'DELETE' })
    if (editingScheduleId.value === scheduleId) closeScheduleModal()
    toastSuccess('ลบคาบเรียนสำเร็จ')
    await loadSchedules()
  } catch (error: any) {
    console.error('Delete study schedule error:', error)
    const msg = getApiErrorMessage(error, 'ลบคาบเรียนไม่สำเร็จ'); errorMessage.value = msg; toastError(msg)
  } finally {
    isDeletingId.value = ''
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadSchedules()
  clockTimer = setInterval(() => {
    currentTime.value = nowTH()
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Itim&display=swap');

.schedule-shell { max-width: 1180px; margin: 0 auto; padding: 32px 20px 64px; color: var(--text-primary); }
.schedule-hero, .section-heading, .today-heading, .schedule-dialog header, .schedule-dialog footer { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.schedule-hero { padding: 12px 0 34px; border-bottom: 1px solid var(--border-subtle); }
.schedule-kicker { margin:0 0 5px; color: var(--brand-ink); letter-spacing:.14em; font-size:10px; font-weight:800; }
h1,h2,h3,p { margin-top:0; }.schedule-hero h1 { margin-bottom:8px; font: 400 clamp(34px,5vw,54px)/.95 'Itim', cursive; }.schedule-subtitle { margin-bottom:0; color:var(--text-muted); font-size:14px; }.hero-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
.term-select,.primary-action,.outline-action,.refresh-action,.icon-action { border-radius:10px; border:1px solid var(--border-default); padding:10px 13px; font-size:13px; font-weight:700; transition:.2s ease; }.term-select { min-width:155px; background:var(--bg-elevated); color:var(--text-primary); }.primary-action { border-color:var(--brand); background:var(--brand); color:white; }.outline-action,.refresh-action,.icon-action { background:transparent; color:var(--text-secondary); }.icon-action { padding:10px 13px; }.primary-action:hover,.outline-action:hover,.refresh-action:hover,.icon-action:hover { transform:translateY(-1px); filter:brightness(1.12); }.primary-action:disabled,.refresh-action:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.schedule-error { margin:20px 0; padding:12px 14px; border-left:3px solid var(--ink-rose); background:color-mix(in srgb,var(--ink-rose) 10%,transparent); color:var(--text-secondary); }.welcome-panel { margin-top:28px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:22px; padding:30px; background:var(--bg-card); border:1px solid var(--border-subtle); }.welcome-mark { color:var(--brand-ink); font-size:32px; font-weight:800; }.welcome-panel h2 { margin-bottom:5px; }.welcome-panel p { margin:0; color:var(--text-muted); font-size:14px; }
.overview-strip { display:grid; grid-template-columns:1.4fr 1fr 1fr auto; gap:1px; margin:26px 0; background:var(--border-subtle); border:1px solid var(--border-subtle); }.overview-stat,.refresh-action { padding:17px 20px; background:var(--bg-card); }.overview-stat span { display:block; color:var(--text-muted); font-size:11px; margin-bottom:5px; }.overview-stat strong { font-size:16px; }.overview-stat small { color:var(--text-muted); font-weight:500; }.refresh-action { border:0; border-radius:0; }
.today-board { padding:26px; border:1px solid var(--border-subtle); background:linear-gradient(135deg,color-mix(in srgb,var(--brand) 10%,var(--bg-card)),var(--bg-card) 48%); }.today-heading { margin-bottom:20px; }.today-heading h2,.section-heading h2 { margin:0; font-size:20px; }.date-chip { padding:6px 10px; color:var(--brand-ink); border:1px solid var(--brand-border); font-size:12px; }.today-empty { display:flex; flex-direction:column; gap:5px; padding:25px 0 4px; color:var(--text-muted); font-size:13px; }.today-empty strong { color:var(--text-primary); font-size:16px; }.today-empty em { margin-top:8px; color:var(--brand-ink); font-style:normal; }.today-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; }.today-session { text-align:left; padding:15px; border:1px solid color-mix(in srgb,var(--course) 32%,var(--border-subtle)); border-left:3px solid var(--course); background:var(--bg-card); color:var(--text-primary); }.today-session.active { background:color-mix(in srgb,var(--course) 12%,var(--bg-card)); }.today-session.finished { opacity:.55; }.session-time,.session-meta,.session-status { display:block; font-size:11px; color:var(--text-muted); }.session-name { display:block; padding:9px 0 4px; font-weight:800; font-size:14px; }.session-status { margin-top:10px; color:var(--brand-ink); }
.week-section,.agenda-section { margin-top:28px; }.section-heading { margin:0 0 13px; }.section-heading > span { color:var(--text-muted); font-size:12px; }.week-rail { display:grid; grid-template-columns:repeat(5,minmax(150px,1fr)); overflow-x:auto; border:1px solid var(--border-subtle); }.day-column { min-height:230px; border-right:1px solid var(--border-subtle); background:var(--bg-card); }.day-column:last-child { border:0; }.day-column.is-today { background:color-mix(in srgb,var(--brand) 6%,var(--bg-card)); }.day-column header { display:flex; align-items:baseline; gap:8px; padding:13px; border-bottom:1px solid var(--border-subtle); }.day-column header span { color:var(--brand-ink); font-size:11px; font-weight:800; }.day-column h3 { margin:0; font-size:13px; }.day-sessions { padding:8px; }.course-line { display:block; width:100%; margin-bottom:7px; padding:10px; text-align:left; background:color-mix(in srgb,var(--course) 7%,transparent); border-left:2px solid var(--course); color:var(--text-primary); }.course-line time,.course-line small { display:block; color:var(--text-muted); font-size:10px; }.course-line strong { display:block; margin:4px 0; font-size:12px; }.free-note { padding:8px; color:var(--text-muted); font-size:12px; }.empty-schedule { padding:42px; text-align:center; border:1px dashed var(--border-default); color:var(--text-muted); }.empty-schedule .outline-action { margin-top:8px; }
.agenda-list { border-top:1px solid var(--border-subtle); }.agenda-row { display:grid; grid-template-columns:150px 1fr auto; gap:20px; align-items:center; padding:16px; border-bottom:1px solid var(--border-subtle); border-left:3px solid var(--course); background:var(--bg-card); }.agenda-row time { color:var(--brand-ink); font-size:12px; font-weight:700; }.agenda-row strong,.agenda-row span { display:block; }.agenda-row span { margin-top:3px; color:var(--text-muted); font-size:12px; }.agenda-row i { font-style:normal; }.row-actions { display:flex; gap:7px; }.row-actions button,.pager button { padding:7px 10px; border:1px solid var(--border-default); background:transparent; color:var(--text-secondary); font-size:12px; }.row-actions .delete { color:var(--ink-rose); }.pager { display:flex; justify-content:center; gap:5px; padding:20px; }.pager button.active { background:var(--brand); color:#fff; border-color:var(--brand); }.pager button:disabled { opacity:.4; }
.dialog-backdrop { position:fixed; inset:0; z-index:90; display:grid; place-items:center; padding:16px; background:rgba(4,8,16,.78); backdrop-filter:blur(8px); }.schedule-dialog { width:min(100%,560px); max-height:calc(100vh - 32px); overflow:auto; background:var(--bg-card); border:1px solid var(--border-default); box-shadow:0 24px 80px rgba(0,0,0,.4); }.schedule-dialog header,.schedule-dialog footer { padding:18px 20px; border-bottom:1px solid var(--border-subtle); }.schedule-dialog footer { border-top:1px solid var(--border-subtle); border-bottom:0; justify-content:flex-end; }.schedule-dialog h2 { margin:0; font-size:20px; }.schedule-dialog header button { font-size:24px; color:var(--text-muted); }.dialog-body { display:grid; gap:15px; padding:20px; }.dialog-body label { display:grid; gap:6px; color:var(--text-secondary); font-size:12px; font-weight:700; }.dialog-body input,.dialog-body select { width:100%; padding:10px; border:1px solid var(--border-default); background:var(--bg-elevated); color:var(--text-primary); }.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }.mode-toggle { display:flex !important; grid-template-columns:auto 1fr; align-items:center; padding-top:4px; }.mode-toggle input { width:auto; }.multi-editor { display:grid; gap:8px; }.multi-row { display:grid; grid-template-columns:1.3fr 1fr 1fr 1.4fr auto; gap:6px; }.multi-row button { color:var(--ink-rose); }
@media (max-width:720px) { .schedule-shell { padding:22px 14px 48px; }.schedule-hero { align-items:flex-start; flex-direction:column; }.hero-actions { justify-content:flex-start; }.overview-strip { grid-template-columns:1fr 1fr; }.overview-strip .refresh-action { grid-column:span 2; }.week-rail { grid-template-columns:repeat(5,155px); }.agenda-row { grid-template-columns:1fr auto; gap:10px; }.agenda-row time { grid-column:span 2; }.row-actions { grid-column:2; grid-row:2; }.welcome-panel { grid-template-columns:auto 1fr; }.welcome-panel .primary-action { grid-column:span 2; }.multi-row { grid-template-columns:1fr 1fr; }.multi-row input[placeholder] { grid-column:span 2; }.multi-row button { grid-column:2; } }

/* Modern workspace layer */
.schedule-shell { max-width: 1560px; padding: clamp(24px, 3vw, 54px) clamp(18px, 3vw, 52px) 80px; }
.schedule-shell::before { content:''; position:fixed; z-index:-1; width:58vw; height:58vw; right:-22vw; top:7vh; pointer-events:none; background:radial-gradient(circle, color-mix(in srgb,var(--brand) 16%,transparent), transparent 66%); filter:blur(12px); }
.schedule-hero { min-height:180px; padding:30px clamp(24px,3vw,46px); border:1px solid color-mix(in srgb,var(--border-default) 75%,transparent); border-radius:28px; background:linear-gradient(115deg, color-mix(in srgb,var(--brand) 17%,var(--bg-card)), var(--bg-card) 44%, color-mix(in srgb,var(--brand-2) 11%,var(--bg-card))); box-shadow:0 20px 52px rgba(0,0,0,.12); }
.schedule-hero h1 { font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; font-weight:760; letter-spacing:-.055em; font-size:clamp(34px,4vw,62px); }
.schedule-subtitle { max-width:520px; font-size:15px; line-height:1.65; }
.hero-actions { gap:10px; }.term-select,.primary-action,.outline-action,.refresh-action,.icon-action { min-height:42px; border-radius:13px; padding:10px 15px; }.primary-action { box-shadow:0 8px 22px color-mix(in srgb,var(--brand) 30%,transparent); }.outline-action,.refresh-action,.icon-action { background:color-mix(in srgb,var(--bg-elevated) 74%,transparent); backdrop-filter:blur(10px); }
.overview-strip { overflow:hidden; gap:0; margin:22px 0 26px; border-radius:20px; background:color-mix(in srgb,var(--border-default) 65%,transparent); box-shadow:0 12px 28px rgba(0,0,0,.06); }.overview-stat,.refresh-action { min-height:86px; display:flex; flex-direction:column; justify-content:center; padding:17px clamp(16px,2vw,28px); border-right:1px solid color-mix(in srgb,var(--border-default) 65%,transparent); background:color-mix(in srgb,var(--bg-card) 92%,transparent); }.overview-stat strong { font-size:19px; letter-spacing:-.025em; }.refresh-action { flex-direction:row; align-items:center; gap:7px; border-right:0; }
.today-board { position:relative; overflow:hidden; padding:clamp(22px,3vw,34px); border-radius:24px; border-color:color-mix(in srgb,var(--brand) 27%,var(--border-subtle)); background:linear-gradient(130deg,color-mix(in srgb,var(--brand) 16%,var(--bg-card)),var(--bg-card) 48%,color-mix(in srgb,var(--brand-2) 8%,var(--bg-card))); box-shadow:0 16px 36px rgba(0,0,0,.08); }.today-board::after { content:'TODAY'; position:absolute; right:24px; bottom:-18px; color:color-mix(in srgb,var(--text-primary) 4%,transparent); font-size:clamp(72px,10vw,142px); font-weight:900; letter-spacing:-.1em; pointer-events:none; }.today-list { position:relative; z-index:1; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:12px; }.today-session { min-height:145px; border-radius:16px; border-left-width:4px; box-shadow:0 8px 18px rgba(0,0,0,.06); transition:transform .22s ease, box-shadow .22s ease; }.today-session:hover { transform:translateY(-4px); box-shadow:0 15px 25px rgba(0,0,0,.14); }.session-name { font-size:15px; }
.session-progress-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; color:var(--text-muted); font-size:10px; font-weight:700; }.session-progress-track { display:block; width:100%; height:6px; margin-top:6px; overflow:hidden; border-radius:999px; background:color-mix(in srgb,var(--text-muted) 15%,transparent); }.session-progress-fill { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--course),color-mix(in srgb,var(--course) 58%,white)); box-shadow:0 0 12px color-mix(in srgb,var(--course) 44%,transparent); transition:width 1s linear; }.today-session.active .session-progress-head { color:var(--course); }
.today-session.is-focus { position:relative; isolation:isolate; animation:class-focus-pulse 1.35s ease-in-out infinite; }.today-session.is-focus::after { content:''; position:absolute; inset:-1px; z-index:-1; border:2px solid var(--course); border-radius:17px; pointer-events:none; animation:class-focus-ring 1.35s ease-out infinite; }.today-session.is-focus .session-name { color:color-mix(in srgb,var(--course) 72%,white); }
@keyframes class-focus-pulse { 0%,100% { box-shadow:0 8px 18px rgba(0,0,0,.06),0 0 0 0 color-mix(in srgb,var(--course) 0%,transparent); } 50% { box-shadow:0 14px 32px rgba(0,0,0,.15),0 0 22px color-mix(in srgb,var(--course) 35%,transparent); } }
@keyframes class-focus-ring { 0% { opacity:.9; transform:scale(1); } 70%,100% { opacity:0; transform:scale(1.035); } }
@media (prefers-reduced-motion: reduce) { .today-session.is-focus,.today-session.is-focus::after { animation:none; }.today-session.is-focus { box-shadow:0 0 0 2px var(--course),0 12px 28px color-mix(in srgb,var(--course) 20%,transparent); } }
.week-section,.agenda-section { margin-top:40px; }.section-heading { margin-bottom:16px; }.section-heading h2 { font-size:23px; letter-spacing:-.035em; }.week-rail { grid-template-columns:repeat(5,minmax(185px,1fr)); border-radius:22px; box-shadow:0 14px 35px rgba(0,0,0,.08); scrollbar-width:thin; }.day-column { min-height:290px; }.day-column header { padding:17px; }.day-column header span { display:grid; width:28px; height:28px; place-items:center; border-radius:9px; background:color-mix(in srgb,var(--brand) 15%,transparent); }.day-column.is-today header { background:color-mix(in srgb,var(--brand) 8%,transparent); }.day-sessions { padding:10px; }.course-line { border-radius:11px; border-left-width:3px; transition:transform .2s ease, background .2s ease; }.course-line:hover { transform:translateX(3px); background:color-mix(in srgb,var(--course) 14%,transparent); }
.agenda-list { overflow:hidden; border:1px solid var(--border-subtle); border-radius:20px; box-shadow:0 12px 32px rgba(0,0,0,.06); }.agenda-row { min-height:78px; padding:17px 22px; transition:background .2s ease; }.agenda-row:hover { background:color-mix(in srgb,var(--bg-hover) 75%,var(--bg-card)); }.agenda-row time { font-size:13px; }.row-actions button { border-radius:9px; padding:8px 12px; }.pager button { border-radius:9px; }.welcome-panel { border-radius:24px; box-shadow:0 16px 38px rgba(0,0,0,.08); }
.schedule-dialog { border-radius:24px; box-shadow:0 28px 100px rgba(0,0,0,.5); }.dialog-body input,.dialog-body select { border-radius:11px; }.dialog-backdrop { background:rgba(4,8,16,.7); }
@media (max-width:1100px) { .schedule-shell { max-width:100%; }.schedule-hero { min-height:0; }.overview-strip { grid-template-columns:1.35fr 1fr 1fr auto; }.week-rail { grid-template-columns:repeat(5,180px); } }
@media (max-width:820px) { .schedule-hero { align-items:flex-start; flex-direction:column; }.hero-actions { justify-content:flex-start; }.overview-strip { grid-template-columns:1fr 1fr; }.overview-strip .refresh-action { grid-column:span 2; flex-direction:row; align-items:center; }.today-list { grid-template-columns:repeat(2,minmax(0,1fr)); }.week-rail { grid-template-columns:repeat(5,170px); }.agenda-row { grid-template-columns:130px 1fr auto; } }
@media (max-width:560px) { .schedule-shell { padding:16px 12px 50px; }.schedule-hero { padding:24px 20px; border-radius:21px; }.schedule-hero h1 { font-size:38px; }.hero-actions { width:100%; display:grid; grid-template-columns:1fr 1fr; }.term-select { grid-column:span 2; width:100%; }.primary-action,.outline-action,.icon-action { justify-content:center; }.overview-strip { border-radius:16px; }.overview-stat,.refresh-action { min-height:76px; padding:14px; }.overview-stat strong { font-size:15px; }.today-board { border-radius:20px; }.today-list { grid-template-columns:1fr; }.week-section,.agenda-section { margin-top:32px; }.agenda-row { grid-template-columns:1fr auto; padding:15px; }.agenda-row time { grid-column:span 2; }.agenda-row > div:not(.row-actions) { min-width:0; }.row-actions { grid-row:2; grid-column:2; }.section-heading { align-items:flex-end; }.section-heading > span { text-align:right; }.form-grid { grid-template-columns:1fr; } }

/* Weekly schedule responsive layout */
.week-rail {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  overflow: visible;
  gap: 1px;
  background: var(--border-subtle);
}
.day-column {
  min-width: 0;
  border-right: 0;
}
.course-line strong,
.course-line small {
  overflow-wrap: anywhere;
}

@media (min-width: 1181px) {
  .schedule-shell {
    width: 100%;
    max-width: none;
    margin: 0;
    padding-right: clamp(24px, 2.25vw, 44px);
    padding-left: clamp(24px, 2.25vw, 44px);
  }
  .week-rail {
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  }
  .day-column {
    min-height: clamp(290px, 34vh, 440px);
  }
  .day-column header {
    padding: 18px clamp(14px, 1.2vw, 22px);
  }
  .day-sessions {
    padding: clamp(10px, 1vw, 16px);
  }
  .course-line {
    padding: clamp(11px, 1vw, 16px);
  }
}

@media (min-width: 821px) and (max-width: 1180px) {
  .week-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 12px;
    background: color-mix(in srgb, var(--bg-card) 88%, transparent);
  }
  .day-column {
    min-height: 240px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
  }
}

@media (max-width: 820px) {
  .week-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 10px;
    overflow: visible;
    background: color-mix(in srgb, var(--bg-card) 88%, transparent);
  }
  .day-column {
    min-height: 210px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 15px;
  }
  .day-column header {
    padding: 13px 14px;
  }
}

@media (max-width: 560px) {
  .week-section .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
  .week-section .section-heading > span {
    text-align: left;
  }
  .week-rail {
    grid-template-columns: 1fr;
    gap: 9px;
    padding: 9px;
    border-radius: 18px;
  }
  .day-column {
    min-height: 0;
    border-radius: 14px;
  }
  .day-column header {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 12px 13px;
  }
  .day-sessions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 7px;
    padding: 9px;
  }
  .course-line {
    margin-bottom: 0;
    padding: 12px;
  }
  .course-line time {
    font-size: 11px;
  }
  .course-line strong {
    font-size: 13px;
  }
  .free-note {
    margin: 0;
    padding: 10px 12px;
  }
}
</style>
