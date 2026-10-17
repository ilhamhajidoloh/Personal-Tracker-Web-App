<template>
  <AppTabsLayout>
    <main class="ss">
      <!-- Top bar -->
      <header class="ss-top">
        <div class="ss-title">
          <span class="ss-kicker">Study Schedule</span>
          <h1>ตารางเรียน</h1>
        </div>
        <div class="ss-toolbar">
          <div class="ss-termbox">
            <select v-if="terms.length" v-model="selectedTermId" class="ss-select" aria-label="ภาคเรียน">
              <option v-for="term in terms" :key="term.id" :value="term.id">{{ term.termName }}</option>
            </select>
            <span v-else class="ss-faint">ยังไม่มีภาคเรียน</span>
            <button v-if="selectedTermId" type="button" class="ss-icon" title="แก้ไขภาคเรียน" @click="openEditTermModal">✎</button>
          </div>
          <button type="button" class="ss-icon" :disabled="isLoading" title="รีเฟรช" @click="loadSchedules">↻</button>
          <button type="button" class="ss-btn" @click="openCreateTermModal">ภาคเรียนใหม่</button>
          <button type="button" class="ss-btn ss-primary" :disabled="!selectedTermId" @click="openCreateScheduleModal">+ เพิ่มคาบเรียน</button>
        </div>
      </header>

      <p v-if="errorMessage" class="ss-alert">{{ errorMessage }}</p>

      <section v-if="!isLoading && !terms.length" class="ss-empty">
        <div class="ss-empty-mark">📚</div>
        <h2>เริ่มต้นด้วยการสร้างภาคเรียน</h2>
        <p>กำหนดช่วงเวลาเรียน แล้วเพิ่มวิชาและคาบเรียนของคุณ</p>
        <button type="button" class="ss-btn ss-primary" @click="openCreateTermModal">สร้างภาคเรียน</button>
      </section>

      <template v-else>
        <!-- Hero + stats -->
        <section class="ss-hero-row">
          <div
            class="ss-hero"
            :class="{ idle: !(currentClass || nextClassToday) }"
            :style="{ '--c': (currentClass || nextClassToday) ? courseTint((currentClass || nextClassToday)!.course_name) : 'var(--brand)' }"
          >
            <template v-if="!isInActiveTerm">
              <span class="ss-chip">นอกช่วงภาคเรียน</span>
              <h2>{{ offTermMessage }}</h2>
              <div v-if="nextTermCountdown" class="ss-next-term">
                <span>ภาคเรียนถัดไป</span>
                <b>{{ nextTermCountdown.termName }}</b>
                <small>เริ่มในอีก {{ nextTermCountdown.label }}</small>
              </div>
            </template>
            <template v-else-if="currentClass || nextClassToday">
              <span class="ss-chip">{{ currentClass ? '● กำลังเรียน' : 'คาบถัดไปวันนี้' }}</span>
              <h2>{{ (currentClass || nextClassToday)!.course_name }}</h2>
              <p>
                {{ formatTimeRange((currentClass || nextClassToday)!.start_time, (currentClass || nextClassToday)!.end_time) }}
                · {{ (currentClass || nextClassToday)!.location || 'ไม่ระบุสถานที่' }}
              </p>
              <div class="ss-meter"><i :style="{ width: `${getClassProgress((currentClass || nextClassToday)!)}%` }"></i></div>
              <div class="ss-hero-foot">
                <span>{{ getProgressPhaseLabel((currentClass || nextClassToday)!) }} · {{ Math.round(getClassProgress((currentClass || nextClassToday)!)) }}%</span>
                <b>{{ getCountdownLabel((currentClass || nextClassToday)!) }}</b>
              </div>
            </template>
            <template v-else>
              <span class="ss-chip">วันนี้</span>
              <h2>{{ todaysClasses.length ? 'เรียนครบทุกคาบแล้ว' : 'วันนี้ไม่มีคาบเรียน' }}</h2>
              <p>ใช้เวลานี้พักผ่อน หรือเคลียร์งานที่ค้างไว้</p>
            </template>
          </div>

          <div class="ss-stats">
            <div class="ss-stat"><b>{{ uniqueSubjectsCount }}</b><span>วิชา</span></div>
            <div class="ss-stat"><b>{{ totalClasses }}</b><span>คาบ</span></div>
            <div class="ss-stat"><b>{{ todaysClasses.length }}</b><span>คาบวันนี้</span></div>
            <div class="ss-stat"><b class="sm">{{ selectedTermName }}</b><span>ภาคเรียน</span></div>
          </div>
        </section>

        <!-- Today stepper -->
        <section v-if="isInActiveTerm && todaysClasses.length" class="ss-block">
          <h3 class="ss-h">วัน{{ getDayLabel(todayWeekday) }}นี้</h3>
          <ol class="ss-steps">
            <li
              v-for="item in todaysClasses"
              :key="item.id"
              :class="[getClassStatus(item), { focus: targetBlinkClass?.id === item.id }]"
              :style="{ '--c': courseTint(item.course_name) }"
            >
              <span class="ss-dot"></span>
              <button type="button" class="ss-step" @click="openEditScheduleModal(item)">
                <time>{{ formatTimeRange(item.start_time, item.end_time) }}</time>
                <strong>{{ item.course_name }}</strong>
                <small>{{ item.location || 'ไม่ระบุสถานที่' }} · {{ getCountdownLabel(item) }}</small>
              </button>
            </li>
          </ol>
        </section>

        <!-- Week board -->
        <section class="ss-block">
          <div class="ss-h-row">
            <h3 class="ss-h">ตารางสัปดาห์</h3>
            <span class="ss-faint">{{ totalClasses }} คาบในภาคเรียนนี้</span>
          </div>

          <div v-if="!schedules.length" class="ss-empty small">
            <p>ยังไม่มีคาบเรียนในภาคนี้</p>
            <button type="button" class="ss-btn" @click="openCreateScheduleModal">เพิ่มคาบแรก</button>
          </div>
          <div v-else class="ss-board">
            <div v-for="day in gridDays" :key="day.value" class="ss-col" :class="{ today: day.value === todayWeekday }">
              <div class="ss-col-head">
                <span>{{ day.label }}</span>
                <i>{{ getSchedulesForDay(day.value).length }}</i>
              </div>
              <button
                v-for="item in getSchedulesForDay(day.value)"
                :key="item.id"
                type="button"
                class="ss-card"
                :style="{ '--c': courseTint(item.course_name) }"
                @click="openEditScheduleModal(item)"
              >
                <time>{{ formatTimeRange(item.start_time, item.end_time) }}</time>
                <strong>{{ item.course_name }}</strong>
                <small v-if="item.location">{{ item.location }}</small>
              </button>
              <p v-if="!getSchedulesForDay(day.value).length" class="ss-free">ว่าง</p>
            </div>
          </div>
        </section>

        <!-- All sessions -->
        <section v-if="schedules.length" class="ss-block">
          <div class="ss-h-row">
            <h3 class="ss-h">คาบเรียนทั้งหมด</h3>
            <span class="ss-faint">{{ schedulePageInfo }}</span>
          </div>
          <ul class="ss-rows">
            <li v-for="item in paginatedSchedules" :key="item.id" :style="{ '--c': courseTint(item.course_name) }">
              <span class="ss-swatch"></span>
              <div class="ss-row-main">
                <strong>{{ item.course_name }}</strong>
                <small>วัน{{ getDayLabel(item.day_of_week) }} · {{ formatTimeRange(item.start_time, item.end_time) }}<template v-if="item.location"> · {{ item.location }}</template></small>
              </div>
              <button type="button" class="ss-icon" title="แก้ไข" @click="openEditScheduleModal(item)">✎</button>
              <button type="button" class="ss-icon danger" title="ลบ" :disabled="isDeletingId === item.id" @click="deleteSchedule(item.id)">{{ isDeletingId === item.id ? '…' : '🗑' }}</button>
            </li>
          </ul>
          <nav v-if="scheduleTotalPages > 1" class="ss-pager">
            <button type="button" :disabled="scheduleCurrentPage === 1" @click="scheduleCurrentPage--">‹</button>
            <button v-for="page in scheduleTotalPages" :key="page" type="button" :class="{ on: page === scheduleCurrentPage }" @click="scheduleCurrentPage = page">{{ page }}</button>
            <button type="button" :disabled="scheduleCurrentPage === scheduleTotalPages" @click="scheduleCurrentPage++">›</button>
          </nav>
        </section>
      </template>
    </main>

    <!-- Class dialog -->
    <Teleport to="body">
      <div v-if="isScheduleModalOpen" class="ss-backdrop" @click.self="closeScheduleModal">
        <form class="ss-dialog" @submit.prevent="submitSchedule">
          <header>
            <h2>{{ formTitle }}</h2>
            <button type="button" class="ss-icon" @click="closeScheduleModal">✕</button>
          </header>
          <div class="ss-fields">
            <label>ชื่อวิชา<input v-model="form.courseName" required maxlength="120" placeholder="เช่น ภาษาอังกฤษ" /></label>
            <label v-if="!isMultiSessionMode">วันเรียน
              <select v-model.number="form.dayOfWeek"><option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option></select>
            </label>
            <div v-if="!isMultiSessionMode" class="ss-pair">
              <label>เริ่ม<input v-model="form.startTime" type="time" required /></label>
              <label>สิ้นสุด<input v-model="form.endTime" type="time" required /></label>
            </div>
            <label v-if="!isMultiSessionMode">สถานที่<input v-model="form.location" maxlength="120" placeholder="ไม่บังคับ" /></label>

            <label class="ss-switch">
              <input v-model="isMultiSessionMode" type="checkbox" @change="isEditing && toggleMultiSessionInEdit" />
              เพิ่มหลายคาบสำหรับวิชาเดียวกัน
            </label>

            <div v-if="isMultiSessionMode" class="ss-sessions">
              <div v-for="(session, index) in multiSessions" :key="index" class="ss-session">
                <select v-model.number="session.dayOfWeek"><option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option></select>
                <input v-model="session.startTime" type="time" />
                <input v-model="session.endTime" type="time" />
                <input v-model="session.location" placeholder="สถานที่" />
                <button type="button" class="ss-icon danger" @click="removeSession(index)">✕</button>
              </div>
              <button type="button" class="ss-btn" @click="addSession">+ เพิ่มคาบ</button>
            </div>
          </div>
          <footer>
            <button type="button" class="ss-btn" @click="closeScheduleModal">ยกเลิก</button>
            <button class="ss-btn ss-primary" :disabled="isSubmitting">{{ submitButtonText }}</button>
          </footer>
        </form>
      </div>
    </Teleport>

    <!-- Term dialog -->
    <Teleport to="body">
      <div v-if="isTermModalOpen" class="ss-backdrop" @click.self="closeTermModal">
        <form class="ss-dialog" @submit.prevent="submitTerm">
          <header>
            <h2>{{ isEditingTerm ? 'แก้ไขภาคเรียน' : 'สร้างภาคเรียน' }}</h2>
            <button type="button" class="ss-icon" @click="closeTermModal">✕</button>
          </header>
          <div class="ss-fields">
            <label>ชื่อภาคเรียน<input v-model="termForm.termName" required maxlength="120" /></label>
            <div class="ss-pair">
              <label>วันเริ่ม<input v-model="termForm.startDate" type="date" required /></label>
              <label>วันสิ้นสุด<input v-model="termForm.endDate" type="date" required /></label>
            </div>
          </div>
          <footer>
            <button type="button" class="ss-btn" @click="closeTermModal">ยกเลิก</button>
            <button class="ss-btn ss-primary" :disabled="isSubmittingTerm">{{ isSubmittingTerm ? 'กำลังบันทึก' : 'บันทึก' }}</button>
          </footer>
        </form>
      </div>
    </Teleport>
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

  // 2. Outside a term, show the next upcoming term in the selector.
  const upcomingTerm = termList
    .filter(t => (t.startDate ? t.startDate.slice(0, 10) : '') > todayStr)
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))[0]
  if (upcomingTerm) return upcomingTerm

  // 3. If no future term exists, fall back to the most recently started term.
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
.ss { max-width: 1240px; margin: 0 auto; padding: 24px 18px 90px; display: flex; flex-direction: column; gap: 28px; color: var(--text-primary); }
.ss h1, .ss h2, .ss h3, .ss p { margin: 0; }
.ss-faint { color: var(--text-muted); font-size: 12px; }

/* top bar */
.ss-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ss-kicker { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--brand-ink); }
.ss-title h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; }
.ss-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ss-termbox { display: flex; align-items: center; gap: 6px; }
.ss-select { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-primary); font-size: 13px; font-weight: 600; }
.ss-btn { padding: 9px 16px; border-radius: 10px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; font-weight: 700; transition: filter .15s; }
.ss-btn:hover { filter: brightness(1.12); }
.ss-btn:disabled, .ss-icon:disabled { opacity: .45; cursor: not-allowed; }
.ss-primary { background: var(--brand); border-color: var(--brand); color: #fff; }
.ss-icon { width: 34px; height: 34px; flex-shrink: 0; display: inline-grid; place-items: center; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); font-size: 14px; }
.ss-icon.danger { color: var(--ink-rose); }
.ss-alert { padding: 12px 16px; border-radius: 10px; border-left: 4px solid var(--ink-rose); background: color-mix(in srgb, var(--ink-rose) 10%, transparent); color: var(--ink-rose); font-size: 13px; }

/* empty */
.ss-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px; text-align: center; border-radius: 16px; border: 1px dashed var(--border-default); background: var(--bg-card); }
.ss-empty.small { padding: 28px; }
.ss-empty-mark { font-size: 40px; }
.ss-empty h2 { font-size: 22px; font-weight: 800; }
.ss-empty p { color: var(--text-muted); font-size: 13px; }

/* hero */
.ss-hero-row { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; }
.ss-hero { --c: var(--brand); display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 28px; min-height: 200px; border-radius: 20px; color: #fff; background: linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 45%, #0b1020)); }
.ss-hero.idle { background: linear-gradient(135deg, var(--brand), var(--brand-2)); }
:global(:root.theme-night) .ss-hero.idle { border: 1px solid color-mix(in srgb, var(--brand) 42%, var(--border-subtle)); background: linear-gradient(135deg, #162842, #111d32 58%, #0e1727); box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 14px 32px rgba(0,0,0,.22); }
:global(:root.theme-night) .ss-hero.idle .ss-chip { background: color-mix(in srgb, var(--brand) 25%, transparent); border: 1px solid color-mix(in srgb, var(--brand) 35%, transparent); }
.ss-hero h2 { font-size: 28px; font-weight: 800; letter-spacing: -.02em; overflow-wrap: anywhere; }
.ss-hero p { opacity: .85; font-size: 14px; }
.ss-next-term { display:flex; align-items:baseline; flex-wrap:wrap; gap:6px; margin-top:2px; color:rgba(255,255,255,.84); }.ss-next-term span { padding:3px 8px; border-radius:999px; background:rgba(255,255,255,.13); font-size:10px; font-weight:800; letter-spacing:.04em; }.ss-next-term b { color:#fff; font-size:16px; }.ss-next-term small { font-size:13px; }
.ss-chip { align-self: flex-start; padding: 4px 12px; border-radius: 99px; background: rgba(255, 255, 255, .2); font-size: 11px; font-weight: 800; letter-spacing: .04em; }
.ss-meter { height: 6px; margin-top: 10px; border-radius: 99px; background: rgba(255, 255, 255, .25); overflow: hidden; }
.ss-meter i { display: block; height: 100%; background: #fff; border-radius: inherit; transition: width 1s linear; }
.ss-hero-foot { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; opacity: .95; }

.ss-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ss-stat { display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 16px; border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); }
.ss-stat b { font-size: 30px; font-weight: 800; line-height: 1; }
.ss-stat b.sm { font-size: 15px; line-height: 1.3; overflow-wrap: anywhere; }
.ss-stat span { font-size: 11px; color: var(--text-muted); }

/* blocks */
.ss-block { display: flex; flex-direction: column; gap: 14px; }
.ss-h { font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
.ss-h-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }

/* today stepper */
.ss-steps { margin: 0 0 0 6px; padding: 0; list-style: none; display: flex; flex-direction: column; border-left: 2px solid var(--border-subtle); }
.ss-steps li { position: relative; padding: 0 0 12px 22px; --c: var(--brand); }
.ss-dot { position: absolute; left: -7px; top: 18px; width: 12px; height: 12px; border-radius: 50%; background: var(--c); }
.ss-step { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 12px 16px; text-align: left; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--text-primary); }
.ss-step time { font-size: 12px; font-weight: 800; color: var(--c); }
.ss-step strong { font-size: 16px; }
.ss-step small { font-size: 12px; color: var(--text-muted); }
.ss-steps li.active .ss-step { border-color: var(--c); background: color-mix(in srgb, var(--c) 10%, var(--bg-card)); }
.ss-steps li.active .ss-dot { box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 30%, transparent); }
.ss-steps li.finished { opacity: .5; }
.ss-steps li.focus .ss-step { animation: ss-pulse 1.4s ease-in-out infinite; }
@keyframes ss-pulse { 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 30%, transparent); } }
@media (prefers-reduced-motion: reduce) { .ss-steps li.focus .ss-step { animation: none; } }

/* week board */
.ss-board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px, 1fr); gap: 10px; overflow-x: auto; padding-bottom: 6px; }
.ss-col { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 16px; background: var(--bg-elevated); }
.ss-col.today { background: color-mix(in srgb, var(--brand) 8%, var(--bg-elevated)); border: 2px solid color-mix(in srgb, var(--brand) 50%, transparent); }
.ss-col-head { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px 6px; font-size: 13px; font-weight: 800; }
.ss-col-head i { font-style: normal; min-width: 22px; padding: 1px 7px; text-align: center; border-radius: 99px; background: var(--bg-card); font-size: 11px; color: var(--text-muted); }
.ss-card { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; text-align: left; border-radius: 10px; background: var(--bg-card); border-top: 3px solid var(--c); color: var(--text-primary); transition: transform .15s; }
.ss-card:hover { transform: translateY(-2px); }
.ss-card time { font-size: 11px; font-weight: 800; color: var(--c); }
.ss-card strong { font-size: 13px; overflow-wrap: anywhere; }
.ss-card small { font-size: 11px; color: var(--text-muted); }
.ss-free { padding: 10px 0; text-align: center; font-size: 12px; color: var(--text-muted); }

/* rows */
.ss-rows { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-subtle); background: var(--bg-card); }
.ss-rows li { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); }
.ss-rows li:last-child { border-bottom: 0; }
.ss-swatch { width: 4px; align-self: stretch; border-radius: 99px; background: var(--c); }
.ss-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ss-row-main strong { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-row-main small { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-pager { display: flex; justify-content: center; gap: 6px; }
.ss-pager button { min-width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; }
.ss-pager button.on { background: var(--brand); border-color: var(--brand); color: #fff; }
.ss-pager button:disabled { opacity: .35; }

/* dialog */
.ss-backdrop { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(4, 8, 16, .6); backdrop-filter: blur(4px); }
.ss-dialog { display: flex; flex-direction: column; width: min(100%, 520px); max-height: 90vh; border-radius: 18px; background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: 0 30px 80px rgba(0, 0, 0, .4); }
.ss-dialog header, .ss-dialog footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 20px; }
.ss-dialog header { border-bottom: 1px solid var(--border-subtle); }
.ss-dialog header h2 { margin: 0; font-size: 18px; font-weight: 800; }
.ss-dialog footer { justify-content: flex-end; border-top: 1px solid var(--border-subtle); }
.ss-fields { display: grid; gap: 14px; align-content: start; padding: 18px 20px; overflow-y: auto; }
.ss-fields label { display: grid; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.ss-fields input, .ss-fields select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; }
.ss-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ss-fields .ss-switch { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--bg-elevated); }
.ss-fields .ss-switch input { width: auto; }
.ss-sessions { display: grid; gap: 10px; }
.ss-session { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; padding: 10px; border-radius: 12px; background: var(--bg-elevated); align-items: center; }
.ss-session select, .ss-session input[placeholder] { grid-column: span 3; }
.ss-session .ss-icon { grid-row: 1 / span 2; grid-column: 4; }
.ss-fields .ss-session input, .ss-fields .ss-session select { background: var(--bg-card); }

@media (max-width: 860px) {
  .ss-hero-row { grid-template-columns: 1fr; }
  .ss-board { grid-auto-flow: row; grid-template-columns: 1fr; overflow: visible; }
}
@media (max-width: 560px) {
  .ss { padding: 16px 12px 80px; }
  .ss-hero { padding: 20px; min-height: 0; }
  .ss-hero h2 { font-size: 22px; }
  .ss-pair { grid-template-columns: 1fr; }
  .ss-backdrop { place-items: end center; padding: 0; }
  .ss-dialog { width: 100%; border-radius: 18px 18px 0 0; }
}
</style>
