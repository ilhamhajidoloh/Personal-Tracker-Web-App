<template>
  <div class="dashboard-page">
    <AppTabsLayout>
      <main class="db">
        <!-- HERO -->
        <section class="db-hero">
          <div class="db-hero__glow db-hero__glow--a"></div>
          <div class="db-hero__glow db-hero__glow--b"></div>
          <div class="db-hero__top">
            <div class="db-hero__title">
              <span class="db-pill">{{ todayText }}</span>
              <h1>{{ greetingText }}<br /><em>{{ userDisplayName }}</em></h1>
            </div>
            <div class="db-hero__actions">
              <NuxtLink v-if="isModuleEnabled('cashflow')" to="/cashflow" class="db-btn db-btn--solid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                บันทึกรายการ
              </NuxtLink>
              <NuxtLink v-if="isModuleEnabled('study-schedule')" to="/study-schedule" class="db-btn db-btn--ghost">ตารางเรียน</NuxtLink>
            </div>
          </div>

          <div class="db-hero__stats">
            <NuxtLink v-if="isModuleEnabled('cashflow')" to="/cashflow" class="db-stat">
              <span class="db-stat__label">เงินคงเหลือ</span>
              <strong class="db-stat__value num">{{ formatCurrency(remainingBalance) }}</strong>
              <span class="db-stat__hint" :class="remainingBalance >= 0 ? 'is-good' : 'is-risk'">{{ remainingBalance >= 0 ? 'สถานะปกติ' : 'ยอดติดลบ' }}</span>
            </NuxtLink>
            <NuxtLink v-if="isModuleEnabled('study-schedule')" to="/study-schedule" class="db-stat">
              <span class="db-stat__label">ตารางวันนี้</span>
              <strong class="db-stat__value">{{ todaysStudyClasses.length }}<small>คาบ</small></strong>
              <span class="db-stat__hint">{{ activeTermName || 'ยังไม่มีภาคเรียน' }}</span>
            </NuxtLink>
            <NuxtLink v-if="isModuleEnabled('tasks') || isModuleEnabled('todos')" :to="isModuleEnabled('tasks') ? '/tasks' : '/todos'" class="db-stat">
              <span class="db-stat__label">ต้องทำ</span>
              <strong class="db-stat__value">{{ dashboardTasks.length + dashboardTodos.length }}<small>รายการ</small></strong>
              <span class="db-stat__hint">งานและสิ่งที่ต้องติดตาม</span>
            </NuxtLink>
          </div>
        </section>

        <Transition name="slide-down">
          <p v-if="errorMessage" class="db-alert">{{ errorMessage }}</p>
        </Transition>

        <div v-if="books.length" class="db-books" aria-label="เลือกสมุดบัญชี">
          <button type="button" :class="{ active: selectedBookId === 'all' }" @click="selectBook('all')">ทั้งหมด</button>
          <button v-for="book in books" :key="book.id" type="button" :class="{ active: selectedBookId === book.id }" @click="selectBook(book.id)">
            <span>{{ book.icon || '●' }}</span>{{ book.name }}
          </button>
        </div>

        <!-- BENTO GRID -->
        <div class="db-bento">
          <!-- Balance + chart -->
          <article v-if="isModuleEnabled('cashflow')" class="db-card db-card--balance">
            <div class="db-balance__head">
              <div>
                <span class="db-balance__label">คงเหลือสุทธิ<template v-if="selectedBook"> · {{ selectedBook.name }}</template></span>
                <strong class="db-balance__value num" :class="{ 'is-neg': remainingBalance < 0 }">{{ formatCurrency(remainingBalance) }}</strong>
                <span class="db-balance__note">{{ overspentAmount > 0 ? `เกินงบ ${formatCurrency(overspentAmount)}` : remainingProgressText }}</span>
              </div>
              <div class="db-seg">
                <button v-for="range in [{ value: '7d', label: '7 วัน' }, { value: '30d', label: '30 วัน' }, { value: 'this_month', label: 'เดือนนี้' }, { value: 'all', label: 'ทั้งหมด' }]" :key="range.value" :class="{ active: selectedChartRange === range.value }" @click="selectedChartRange = range.value as any">{{ range.label }}</button>
              </div>
            </div>

            <div v-if="barChartData.empty" class="db-balance__empty">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
            <div v-else class="db-chart">
              <div v-for="(bar, index) in barChartData.bars" :key="index" class="db-chart__col" :class="{ dim: hoveredBarIndex !== null && hoveredBarIndex !== index }" @mouseenter="hoveredBarIndex = index" @mouseleave="hoveredBarIndex = null">
                <div v-if="hoveredBarIndex === index" class="db-chart__tip">
                  <b>{{ bar.label }}</b>
                  <span class="is-in">รายรับ {{ formatCurrency(bar.income) }}</span>
                  <span class="is-out">รายจ่าย {{ formatCurrency(bar.expense) }}</span>
                  <span>สุทธิ {{ bar.net >= 0 ? '+' : '' }}{{ formatCurrency(bar.net) }}</span>
                </div>
                <div class="db-chart__bars">
                  <i class="in" :style="{ height: `${Math.max(bar.incomeHeight, 3)}%` }"></i>
                  <i class="out" :style="{ height: `${Math.max(bar.expenseHeight, 3)}%` }"></i>
                </div>
                <span class="db-chart__x">{{ bar.labelShort }}</span>
              </div>
            </div>

            <div class="db-balance__foot">
              <div><span class="dot in"></span>รายรับ<strong class="num">+{{ formatCurrency(totalIncome) }}</strong></div>
              <div><span class="dot out"></span>รายจ่าย<strong class="num">−{{ formatCurrency(totalExpense) }}</strong></div>
            </div>
          </article>

          <!-- Expense donut -->
          <article v-if="isModuleEnabled('cashflow')" class="db-card db-card--donut">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Breakdown</span><h2>สัดส่วนรายจ่าย</h2></div>
              <NuxtLink to="/cashflow" class="db-card__link">ดูทั้งหมด</NuxtLink>
            </header>
            <p v-if="!expenseChartData.hasData" class="db-empty">ยังไม่มีข้อมูลรายจ่าย</p>
            <div v-else class="db-donut">
              <div class="db-donut__ring">
                <svg viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="46" fill="none" stroke="var(--bg-elevated-2)" stroke-width="14" />
                  <circle
                    v-for="slice in expenseChartData.slices"
                    :key="slice.name"
                    cx="65" cy="65" r="46" fill="none"
                    :stroke="slice.stroke"
                    :stroke-width="hoveredExpenseCategoryIndex === slice.index ? 17 : 14"
                    :stroke-dasharray="slice.dashArray"
                    :stroke-dashoffset="slice.dashOffset"
                    stroke-linecap="round"
                    :style="{ opacity: hoveredExpenseCategoryIndex === null || hoveredExpenseCategoryIndex === slice.index ? 1 : 0.3 }"
                    @mouseenter="hoveredExpenseCategoryIndex = slice.index"
                    @mouseleave="hoveredExpenseCategoryIndex = null"
                  />
                </svg>
                <div class="db-donut__center">
                  <template v-if="activeExpenseSlice">
                    <small>{{ activeExpenseSlice.name }}</small>
                    <strong :style="{ color: activeExpenseSlice.stroke }">{{ activeExpenseSlice.percentFormatted }}</strong>
                  </template>
                  <template v-else>
                    <small>รวม</small>
                    <strong class="num">{{ formatCurrency(expenseChartData.total) }}</strong>
                  </template>
                </div>
              </div>
              <ul class="db-donut__legend">
                <li v-for="slice in expenseChartData.slices" :key="slice.name" @mouseenter="hoveredExpenseCategoryIndex = slice.index" @mouseleave="hoveredExpenseCategoryIndex = null">
                  <span class="swatch" :style="{ background: slice.stroke }"></span>
                  <span class="name">{{ slice.name }}</span>
                  <span class="pct num">{{ slice.percentFormatted }}</span>
                </li>
              </ul>
            </div>
          </article>

          <!-- Recent transactions -->
          <article v-if="isModuleEnabled('cashflow')" class="db-card db-card--tx">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Money log</span><h2>รายการล่าสุด</h2></div>
              <NuxtLink to="/cashflow" class="db-card__link">ดูทั้งหมด</NuxtLink>
            </header>
            <p v-if="isLoading" class="db-empty">กำลังโหลดข้อมูล…</p>
            <p v-else-if="!recentTransactions.length" class="db-empty">ยังไม่มีรายการเงิน</p>
            <ul v-else class="db-list">
              <li v-for="tx in recentTransactions" :key="tx.id" class="db-tx">
                <span class="db-tx__icon" :class="tx.type">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path v-if="tx.type === 'income'" d="M7 17L17 7M17 7H9M17 7v8" />
                    <path v-else d="M17 7L7 17M7 17h8M7 17V9" />
                  </svg>
                </span>
                <div class="db-tx__body">
                  <strong>{{ tx.category || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย') }}</strong>
                  <small>{{ formatDate(tx.entry_date) }}</small>
                </div>
                <b class="num" :class="tx.type === 'income' ? 'is-good' : 'is-risk'">{{ tx.type === 'income' ? '+' : '−' }}{{ formatCurrency(tx.amount) }}</b>
              </li>
            </ul>
          </article>

          <!-- Recurring -->
          <article v-if="isModuleEnabled('cashflow')" class="db-card db-card--due">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Up next</span><h2>รายจ่ายประจำ</h2></div>
              <NuxtLink to="/cashflow" class="db-card__link">จัดการ</NuxtLink>
            </header>
            <p v-if="isRecurringLoading" class="db-empty">กำลังโหลดข้อมูล…</p>
            <p v-else-if="!nearestRecurringItemInfo" class="db-empty">ยังไม่มีรายการจ่ายประจำ</p>
            <div v-else class="db-due">
              <span class="db-tag">{{ nearestRecurringItemInfo.dueLabel }}</span>
              <h3>{{ nearestRecurringItemInfo.item.title }}</h3>
              <p>ทุกวันที่ {{ nearestRecurringItemInfo.item.dayOfMonthDue }} · {{ nearestRecurringItemInfo.countdownText }}</p>
              <div class="db-progress"><i :class="{ late: nearestRecurringItemInfo.minDays <= 0 }" :style="{ width: nearestRecurringItemInfo.progressPercent + '%' }"></i></div>
              <div class="db-due__foot">
                <strong class="num">{{ formatCurrency(nearestRecurringItemInfo.item.amount) }}</strong>
                <button :disabled="isPayingDashboardRecurringId === nearestRecurringItemInfo.item.id" @click="payDashboardRecurring(nearestRecurringItemInfo.item)">
                  {{ isPayingDashboardRecurringId === nearestRecurringItemInfo.item.id ? 'กำลังบันทึก…' : 'จ่ายแล้ว' }}
                </button>
              </div>
            </div>
          </article>

          <!-- Study -->
          <article v-if="isModuleEnabled('study-schedule')" class="db-card db-card--study">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Today</span><h2>{{ isInActiveTerm ? 'ตารางเรียนวันนี้' : 'ตารางเรียน' }}</h2></div>
              <NuxtLink to="/study-schedule" class="db-card__link">ดูตาราง</NuxtLink>
            </header>
            <p v-if="isScheduleLoading" class="db-empty">กำลังโหลดข้อมูล…</p>
            <div v-else-if="!isInActiveTerm" class="db-empty">
              <p>{{ offTermMessage }}</p>
              <div v-if="nextTermCountdown" class="db-next">
                <span>ภาคเรียนถัดไป</span>
                <strong>{{ nextTermCountdown.termName }}</strong>
                <b>เริ่มในอีก {{ nextTermCountdown.label }}</b>
                <small>{{ nextTermCountdown.dateLabel }}</small>
              </div>
            </div>
            <template v-else>
              <div v-if="currentStudyClass || nextStudyClassToday" class="db-next" :class="{ 'is-live': currentStudyClass, 'study-blinking-card': isStudyBlinking }">
                <span>{{ currentStudyClass ? 'กำลังเรียน' : 'คาบเรียนถัดไป' }}</span>
                <strong>{{ currentStudyClass ? currentStudyClass.course_name : nextStudyClassToday?.course_name }}</strong>
                <b>{{ studyCountdownText }}</b>
                <small>
                  {{ formatTime(currentStudyClass ? currentStudyClass.start_time : (nextStudyClassToday?.start_time || '')) }}–{{ formatTime(currentStudyClass ? currentStudyClass.end_time : (nextStudyClassToday?.end_time || '')) }} น.
                  <template v-if="currentStudyClass?.location || nextStudyClassToday?.location">· {{ currentStudyClass ? currentStudyClass.location : nextStudyClassToday?.location }}</template>
                </small>
              </div>
              <p v-if="!todaysStudyClasses.length" class="db-empty">
                วันนี้ไม่มีคาบเรียน
                <small v-if="nextStudyClassSubtitle" class="db-empty__sub">คาบถัดไป · {{ nextStudyClassSubtitle }}</small>
              </p>
              <ul v-else class="db-list">
                <li v-for="item in todaysStudyClasses" :key="item.id" class="db-class" :class="[`is-${getClassStatus(item)}`, { 'study-blinking-card': isBlinkingRow(item) }]">
                  <time class="num">{{ formatTime(item.start_time) }}<br />{{ formatTime(item.end_time) }}</time>
                  <div :style="{ '--tint': courseTint(item.course_name) }">
                    <strong>{{ item.course_name }}</strong>
                    <small>{{ item.location || 'ไม่ระบุห้อง' }}</small>
                  </div>
                  <span v-if="getClassStatus(item) === 'active'" class="db-tag db-tag--live">กำลังเรียน</span>
                  <span v-else-if="getClassStatus(item) === 'finished'" class="db-tag db-tag--done">เสร็จ</span>
                </li>
              </ul>
            </template>
          </article>

          <!-- Action queue -->
          <article v-if="isModuleEnabled('tasks') || isModuleEnabled('todos')" class="db-card db-card--work">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Action queue</span><h2>สิ่งที่ต้องทำ</h2></div>
              <NuxtLink :to="isModuleEnabled('tasks') ? '/tasks' : '/todos'" class="db-card__link">ดูทั้งหมด</NuxtLink>
            </header>
            <p v-if="isTasksLoading || isTodosLoading" class="db-empty">กำลังโหลดข้อมูล…</p>
            <p v-else-if="!dashboardTasks.length && !dashboardTodos.length" class="db-empty">วันนี้ไม่มีงานค้าง ทำได้ดีมาก</p>
            <ul v-else class="db-list">
              <li v-for="task in dashboardTasks" :key="`task-${task.id}`" class="db-work">
                <span class="db-work__bar" :class="{ urgent: task.isUrgent }"></span>
                <div>
                  <strong>{{ task.title }}</strong>
                  <small>{{ task.subject || 'งาน' }} · {{ formatTaskDeadline(task.deadline) }}</small>
                </div>
                <b class="db-chip" :style="getTaskStatusStyle(task)">{{ getTaskStatusLabel(task) }}</b>
              </li>
              <li v-for="todo in dashboardTodos" :key="`todo-${todo.id}`" class="db-work">
                <span class="db-work__bar" :class="{ urgent: todo.priority === 'high' }"></span>
                <div>
                  <strong>{{ todo.title }}</strong>
                  <small>{{ todo.due_date ? formatDate(todo.due_date) : 'ไม่มีกำหนด' }}</small>
                </div>
                <b v-if="todo.priority === 'high'" class="db-chip is-risk-chip">ด่วน</b>
                <b v-else-if="todo.status === 'in_progress'" class="db-chip">กำลังทำ</b>
              </li>
            </ul>
          </article>

          <!-- Events -->
          <article v-if="isModuleEnabled('events')" class="db-card db-card--events">
            <header class="db-card__head">
              <div><span class="db-card__kicker">Calendar</span><h2>กิจกรรมที่กำลังจะมาถึง</h2></div>
              <NuxtLink to="/events" class="db-card__link">ดูปฏิทิน</NuxtLink>
            </header>
            <p v-if="eventsErrorMessage" class="db-alert db-alert--inline">{{ eventsErrorMessage }}</p>
            <p v-if="isEventsLoading" class="db-empty">กำลังโหลดข้อมูล…</p>
            <p v-else-if="!dashboardEvents.length" class="db-empty">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
            <div v-else class="db-events">
              <NuxtLink v-for="event in dashboardEvents" :key="event.id" to="/events" class="db-event">
                <time><b>{{ getDay(event.start_date) }}</b><span>{{ getMonthShort(event.start_date) }}</span></time>
                <div class="db-event__body">
                  <strong>{{ event.title }}</strong>
                  <small>{{ displayEventDateTimeShort(event) }}</small>
                  <div class="db-event__meta">
                    <span :style="getDashboardEventStatusTextStyle(event)">{{ getDashboardEventStatusText(event) }}</span>
                    <b>{{ getDashboardEventStatusMeta(event).status === 'ongoing' ? getDashboardOngoingEventDetails(event).progress : getDashboardUpcomingEventDetails(event).progress }}%</b>
                  </div>
                  <div class="db-progress db-progress--thin">
                    <i :class="{ live: getDashboardEventStatusMeta(event).status === 'ongoing' }" :style="{ width: (getDashboardEventStatusMeta(event).status === 'ongoing' ? getDashboardOngoingEventDetails(event).progress : getDashboardUpcomingEventDetails(event).progress) + '%' }"></i>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </article>
        </div>

        <!-- Module notice -->
        <div v-if="enabledModules.length < allModules.length" class="db-notice">
          <p><strong>เปิดใช้งาน {{ enabledModules.length }} จาก {{ allModules.length }} ฟังก์ชัน</strong><span>เพิ่มฟังก์ชันอื่นได้จากหน้าโปรไฟล์</span></p>
          <NuxtLink to="/profile" class="db-btn db-btn--ghost">ปรับแต่ง</NuxtLink>
        </div>
      </main>
    </AppTabsLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getTodayTH, nowTH } from '~/utils/date'
import { useFinanceBooks } from '~/composables/useFinanceBooks'

const { isModuleEnabled, allModules, enabledModules } = useUserModules()

const hasLeftColumn = computed(() => isModuleEnabled('cashflow'))
const hasRightColumn = computed(() => isModuleEnabled('cashflow') || isModuleEnabled('study-schedule') || isModuleEnabled('todos') || isModuleEnabled('tasks'))

const gridClasses = computed(() => {
  if (hasLeftColumn.value && hasRightColumn.value) {
        return 'grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-4 md:gap-5 items-start'
  }
  if (hasLeftColumn.value) {
    return 'grid grid-cols-1 gap-4 items-start'
  }
    return 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-start'
})

type TransactionType = 'income' | 'expense'

type TransactionRow = {
  id: string
  user_id: string
  book_id?: string | null
  entry_date: string
  type: TransactionType
  category: string | null
  amount: number
  created_at: string
}

type StudyScheduleRow = {
  id: string
  user_id: string
  course_name: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  created_at: string
}

type NextStudyClassMeta = {
  item: StudyScheduleRow
  dayOffset: number
  minutesUntil: number
  isCurrent: boolean
} | null

type TodoStatus = 'pending' | 'in_progress' | 'completed'
type TodoPriority = 'low' | 'medium' | 'high'

type TodoRow = {
  id: string
  title: string
  description: string | null
  tag: string
  due_date: string | null
  status: TodoStatus
  priority: TodoPriority
}

type TaskRow = {
  id: string
  userId: string
  title: string
  subject: string | null
  deadline: string
  isUrgent: boolean
  isCompleted: boolean
}

type EventTypeType = 'same_day_time' | 'same_day_all_day' | 'multi_day'

type DashboardEventRow = {
  id: string
  title: string
  event_type: EventTypeType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
}

const { apiFetch, userId } = useBackendApi()
const { currentUser } = useAuth()

// Multi-Book Finance System
const {
  books,
  isLoadingBooks,
  selectedBookId,
  selectedBook,
  fetchBooks,
  selectBook,
} = useFinanceBooks()

const getBookById = (bookId?: string | null) => {
  if (!bookId) return null
  return books.value.find(b => b.id === bookId) || null
}

const userDisplayName = computed(() => currentUser.value?.fullName?.trim() || currentUser.value?.email?.split('@')[0] || 'MyLife User')

const lastUpdateTime = ref(nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.')

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

const formattedBalanceParts = computed(() => {
  const balance = remainingBalance.value
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(balance))
  const parts = formatted.split('.')
  return {
    sign: balance < 0 ? '−' : '',
    integer: parts[0] || '0',
    decimal: parts[1] || '00',
  }
})

const transactions = ref<TransactionRow[]>([])
const studySchedules = ref<StudyScheduleRow[]>([])
const academicTerms = ref<BackendTerm[]>([])
const todos = ref<TodoRow[]>([])
const tasks = ref<TaskRow[]>([])
const events = ref<DashboardEventRow[]>([])
const currentTime = ref(nowTH())

const isLoading = ref(true)
const isScheduleLoading = ref(true)
const isTodosLoading = ref(true)
const isTasksLoading = ref(true)
const isEventsLoading = ref(true)
const errorMessage = ref('')
const scheduleErrorMessage = ref('')
const todosErrorMessage = ref('')
const tasksErrorMessage = ref('')
const eventsErrorMessage = ref('')

const todayText = nowTH().toLocaleDateString('th-TH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const greetingText = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'สวัสดีตอนเช้า'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  if (hour < 20) return 'สวัสดีตอนเย็น'
  return 'สวัสดีตอนค่ำ'
})

const dayLabelMap = new Map<number, string>([
  [1, 'จันทร์'],
  [2, 'อังคาร'],
  [3, 'พุธ'],
  [4, 'พฤหัสบดี'],
  [5, 'ศุกร์'],
  [6, 'เสาร์'],
  [7, 'อาทิตย์'],
])

const courseChipPalette = [
  'border-sky-400/40 bg-sky-500/15 text-sky-100',
  'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  'border-amber-400/40 bg-amber-500/15 text-amber-100',
  'border-rose-400/40 bg-rose-500/15 text-rose-100',
  'border-indigo-400/40 bg-indigo-500/15 text-indigo-100',
  'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
]

const getApiErrorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

const statusFromBackend: Record<string, TodoStatus> = { pending: 'pending', inProgress: 'in_progress', completed: 'completed' }

const dayNameToNumber: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount)

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const getMonthShort = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { month: 'short' })
const getDay = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit' })

const formatTime = (time: string) => time.slice(0, 5)

const toMinutes = (time: string) => {
  const [hour = '0', minute = '0'] = time.split(':')
  return (Number(hour) * 60) + Number(minute)
}

const getCourseChipClass = (courseName: string) => {
  const normalized = courseName.trim().toLowerCase()
  if (!normalized) return 'border-gray-600 bg-gray-700/30 text-gray-100'
  let hash = 0
  for (const char of normalized) {
    hash = ((hash * 31) + char.charCodeAt(0)) % 2147483647
  }
  return courseChipPalette[Math.abs(hash) % courseChipPalette.length]
}

const totalIncome = computed(() => transactions.value
  .filter((item) => item.type === 'income')
  .reduce((sum, item) => sum + item.amount, 0))

const totalExpense = computed(() => transactions.value
  .filter((item) => item.type === 'expense')
  .reduce((sum, item) => sum + item.amount, 0))

const remainingBalance = computed(() => totalIncome.value - totalExpense.value)
const overspentAmount = computed(() => Math.max(totalExpense.value - totalIncome.value, 0))
const totalTransactions = computed(() => transactions.value.length)

const formatPercent = (value: number) => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
}).format(value)

const expenseProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 100 : 0
  return Math.min((totalExpense.value / totalIncome.value) * 100, 100)
})

const remainingProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return 0
  return Math.min(Math.max((remainingBalance.value / totalIncome.value) * 100, 0), 100)
})

const expenseProgressText = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 'มีรายจ่าย แต่ยังไม่มีรายรับเป็นฐาน' : 'รอข้อมูล'
  return `ใช้ไป ${formatPercent((totalExpense.value / totalIncome.value) * 100)}% ของรายรับ`
})

const remainingProgressText = computed(() => {
  if (totalIncome.value <= 0) return 'รอข้อมูลรายรับ'
  if (remainingBalance.value < 0) return 'รายจ่ายเกินรายรับ'
  return `คงเหลือ ${formatPercent((remainingBalance.value / totalIncome.value) * 100)}% ของรายรับ`
})

const expenseDonutColors = [
  { stroke: 'var(--brand)', text: 'var(--brand)', bg: 'rgba(59, 78, 240, 0.12)' },
  { stroke: 'var(--ink-rose)', text: 'var(--ink-rose)', bg: 'rgba(208, 39, 72, 0.12)' },
  { stroke: 'var(--ink-amber)', text: 'var(--ink-amber)', bg: 'rgba(182, 133, 42, 0.12)' },
  { stroke: 'var(--ink-cyan)', text: 'var(--ink-cyan)', bg: 'rgba(13, 139, 164, 0.12)' },
  { stroke: 'var(--brand-2)', text: 'var(--brand-2)', bg: 'rgba(111, 91, 255, 0.12)' },
  { stroke: 'var(--text-muted)', text: 'var(--text-muted)', bg: 'rgba(139, 147, 167, 0.12)' },
]

const hoveredExpenseCategoryIndex = ref<number | null>(null)

const expenseChartData = computed(() => {
  const expenseList = transactions.value.filter((item) => item.type === 'expense')
  const total = expenseList.reduce((sum, item) => sum + item.amount, 0)
  if (total <= 0) {
    return {
      slices: [],
      total: 0,
      hasData: false,
    }
  }

  const categoryTotals = expenseList.reduce<Record<string, number>>((acc, item) => {
    const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
    acc[key] = (acc[key] || 0) + item.amount
    return acc
  }, {})

  const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  
  // Show top 4 categories and group the rest into 'อื่นๆ' if more than 4
  const topCount = 4
  let displayCategories: { name: string; amount: number }[] = []
  if (sortedEntries.length <= topCount) {
    displayCategories = sortedEntries.map(([name, amount]) => ({ name, amount }))
  } else {
    const main = sortedEntries.slice(0, topCount).map(([name, amount]) => ({ name, amount }))
    const othersAmount = sortedEntries.slice(topCount).reduce((sum, [, amt]) => sum + amt, 0)
    displayCategories = [...main, { name: 'อื่นๆ', amount: othersAmount }]
  }

  const radius = 46
  const circumference = 2 * Math.PI * radius // ≈ 289.0265
  let currentOffset = 0

  const slices = displayCategories.map((cat, index) => {
    const percent = (cat.amount / total) * 100
    const dashLength = (percent / 100) * circumference
    const colorObj = expenseDonutColors[index % expenseDonutColors.length]!

    // Gap between slices if more than 1 slice
    const gap = displayCategories.length > 1 ? 2.5 : 0
    const visualDashLength = Math.max(dashLength - gap, 0.5)

    const sliceInfo = {
      index,
      name: cat.name,
      amount: cat.amount,
      percent,
      percentFormatted: `${formatPercent(percent)}%`,
      stroke: colorObj.stroke,
      textColor: colorObj.text,
      bgColor: colorObj.bg,
      dashArray: `${visualDashLength} ${circumference - visualDashLength}`,
      dashOffset: -currentOffset,
    }
    currentOffset += dashLength
    return sliceInfo
  })

  return {
    slices,
    total,
    hasData: true,
    circumference,
    radius,
  }
})

const activeExpenseSlice = computed(() => {
  if (hoveredExpenseCategoryIndex.value !== null) {
    return expenseChartData.value.slices[hoveredExpenseCategoryIndex.value] || null
  }
  return null
})

const topExpenseCategories = computed(() => {
  return expenseChartData.value.slices.slice(0, 3).map((s) => ({ name: s.name, amount: s.amount }))
})

const topExpenseCategory = computed(() => topExpenseCategories.value[0] || { name: '-', amount: 0 })

const latestTransaction = computed(() => transactions.value[0] || null)

const latestTransactionTitle = computed(() => {
  if (!latestTransaction.value) return 'ยังไม่มีรายการ'
  const typeText = latestTransaction.value.type === 'income' ? 'รายรับ' : 'รายจ่าย'
  return `${typeText} ${formatCurrency(latestTransaction.value.amount)}`
})

const latestTransactionSubtitle = computed(() => {
  if (!latestTransaction.value) return 'เพิ่มรายการแรก'
  const categoryText = latestTransaction.value.category || 'ไม่ระบุหมวดหมู่'
  return `${formatDate(latestTransaction.value.entry_date)} • ${categoryText}`
})

const recentTransactions = computed(() => transactions.value.slice(0, 5))

const selectedChartRange = ref<'7d' | '30d' | 'this_month' | 'all'>('30d')
const hoveredBarIndex = ref<number | null>(null)

const barChartData = computed(() => {
  if (!transactions.value.length) {
    return { bars: [], empty: true, max: 0, maxFormatted: '฿0', startDate: '', endDate: '' }
  }

  const now = nowTH()
  function formatYYYYMMDD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }

  let startDate: Date
  let periodCount: number
  let groupBy: 'day' | 'week' | 'month' = 'day'

  if (selectedChartRange.value === '7d') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    periodCount = 7
    groupBy = 'day'
  } else if (selectedChartRange.value === '30d') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    periodCount = 5
    groupBy = 'week'
  } else if (selectedChartRange.value === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysInMonth = endOfMonth.getDate()
    periodCount = Math.ceil(daysInMonth / 7)
    groupBy = 'week'
  } else {
    // 'all' - group by month, show last 6 months
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    periodCount = 6
    groupBy = 'month'
  }

  const startDateStr = formatYYYYMMDD(startDate)
  const filteredTransactions = transactions.value.filter(tx => tx.entry_date >= startDateStr)

  type PeriodData = { income: number; expense: number; label: string; labelShort: string }
  const periods: PeriodData[] = []

  if (groupBy === 'day') {
    // 7 days view
    for (let i = 0; i < periodCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
      const dateStr = formatYYYYMMDD(d)
      const dayTransactions = filteredTransactions.filter(tx => tx.entry_date === dateStr)
      const income = dayTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
      const expense = dayTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
      const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      const labelShort = d.toLocaleDateString('th-TH', { day: 'numeric' })
      periods.push({ income, expense, label, labelShort })
    }
  } else if (groupBy === 'week') {
    if (selectedChartRange.value === 'this_month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysInMonth = endOfMonth.getDate()
      for (let i = 0; i < periodCount; i++) {
        const startDay = 1 + (i * 7)
        const endDay = Math.min((i + 1) * 7, daysInMonth)
        const weekStart = new Date(now.getFullYear(), now.getMonth(), startDay)
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), endDay)
        const weekStartStr = formatYYYYMMDD(weekStart)
        const weekEndStr = formatYYYYMMDD(weekEnd)

        const weekTransactions = filteredTransactions.filter(tx => tx.entry_date >= weekStartStr && tx.entry_date <= weekEndStr)
        const income = weekTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
        const expense = weekTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
        const label = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekStart.toLocaleDateString('th-TH', { month: 'short' })}`
        const labelShort = `สัปดาห์ ${i + 1}`
        periods.push({ income, expense, label, labelShort })
      }
    } else {
      // 30d view - 5 weeks covering the 30 days up to today
      for (let i = 0; i < periodCount; i++) {
        const weekStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (i * 7))
        let weekEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (i * 7) + 6)
        if (weekEnd > now) {
          weekEnd = new Date(now.getTime())
        }

        const weekStartStr = formatYYYYMMDD(weekStart)
        const weekEndStr = formatYYYYMMDD(weekEnd)

        const weekTransactions = filteredTransactions.filter(tx => tx.entry_date >= weekStartStr && tx.entry_date <= weekEndStr)
        const income = weekTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
        const expense = weekTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
        const label = `${weekStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
        const labelShort = `สัปดาห์ ${i + 1}`
        periods.push({ income, expense, label, labelShort })
      }
    }
  } else {
    // Group by month (last 6 months)
    for (let i = 0; i < periodCount; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth() + 1
      const monthStr = `${year}-${String(month).padStart(2, '0')}`

      const monthTransactions = filteredTransactions.filter(tx => tx.entry_date.startsWith(monthStr))
      const income = monthTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
      const expense = monthTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
      const label = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
      const labelShort = monthDate.toLocaleDateString('th-TH', { month: 'short' })
      periods.push({ income, expense, label, labelShort })
    }
  }

  // Calculate max value for scaling with 15% headroom
  const allValues = periods.flatMap(p => [p.income, p.expense])
  const rawMax = Math.max(...allValues, 0)
  const max = rawMax > 0 ? rawMax * 1.15 : 100

  // Create bar data with heights as percentages
  const bars = periods.map(period => ({
    income: period.income,
    expense: period.expense,
    net: period.income - period.expense,
    incomeHeight: rawMax > 0 ? (period.income / max) * 100 : 0,
    expenseHeight: rawMax > 0 ? (period.expense / max) * 100 : 0,
    label: period.label,
    labelShort: period.labelShort
  }))

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  return {
    bars,
    empty: false,
    max,
    maxFormatted: formatCurrency(rawMax > 0 ? rawMax : 0),
    startDate: formatDateShort(startDateStr),
    endDate: formatDateShort(formatYYYYMMDD(now))
  }
})

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
  return academicTerms.value.find((term) => {
    const start = termDateKey(term.startDate)
    const end = termDateKey(term.endDate)
    return Boolean(start && end && start <= todayStr && end >= todayStr)
  }) || null
})

const nextUpcomingTerm = computed(() => {
  const nowMs = currentTime.value.getTime()
  return academicTerms.value
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
  if (!academicTerms.value.length) return 'ยังไม่มีภาคเรียนในระบบ'
  if (nextTermCountdown.value) return 'อยู่นอกช่วงเวลาของภาคเรียนปัจจุบัน'
  return 'ภาคเรียนล่าสุดสิ้นสุดแล้ว และยังไม่มีภาคเรียนถัดไป'
})

const sortedStudySchedules = computed(() => [...studySchedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
  return a.start_time.localeCompare(b.start_time)
}))

const todayWeekday = computed(() => {
  const day = currentTime.value.getDay()
  return day === 0 ? 7 : day
})

const totalStudyClasses = computed(() => studySchedules.value.length)
const todaysStudyClasses = computed(() => sortedStudySchedules.value.filter((item) => item.day_of_week === todayWeekday.value))
const todaysStudyPreview = computed(() => todaysStudyClasses.value.slice(0, 4))

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

const getClassStatus = (item: StudyScheduleRow) => {
  const now = currentTime.value
  const startD = timeStringToDate(item.start_time)
  const endD = timeStringToDate(item.end_time)
  
  if (now >= endD) return 'finished'
  if (now >= startD && now < endD) return 'active'
  return 'upcoming'
}

const currentStudyClass = computed(() => {
  return todaysStudyClasses.value.find(item => getClassStatus(item) === 'active') || null
})

const nextStudyClassToday = computed(() => {
  const now = currentTime.value
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  return todaysStudyClasses.value.find(item => {
    const startM = toMinutes(item.start_time)
    return startM > currentMinutes
  }) || null
})

const { isBlinking: isStudyBlinking, remainingSeconds: studyBlinkRemainingSecs, triggerBlink: triggerStudyBlink } = useStudyBlink(5000)

const targetBlinkStudyClass = computed(() => {
  return currentStudyClass.value || nextStudyClassToday.value || nextStudyClass.value || null
})

const isBlinkingRow = (item: StudyScheduleRow) => {
  if (!isStudyBlinking.value) return false
  if (currentStudyClass.value) {
    return item.id === currentStudyClass.value.id
  }
  if (nextStudyClassToday.value) {
    return item.id === nextStudyClassToday.value.id
  }
  return false
}

const studyCountdownText = computed(() => {
  if (currentStudyClass.value) {
    const endD = timeStringToDate(currentStudyClass.value.end_time)
    const diff = endD.getTime() - currentTime.value.getTime()
    return `เหลืออีก ${formatCountdown(diff)}`
  } else if (nextStudyClassToday.value) {
    const startD = timeStringToDate(nextStudyClassToday.value.start_time)
    const diff = startD.getTime() - currentTime.value.getTime()
    return `เริ่มในอีก ${formatCountdown(diff)}`
  }
  return ''
})

const dashboardTodos = computed(() => {
  const today = getTodayTH()
  return todos.value
    .filter(t => t.status !== 'completed' && (t.priority === 'high' || (t.due_date && t.due_date <= today)))
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      return 1
    })
    .slice(0, 6)
})

const getTodoDateColor = (item: TodoRow) => {
  if (!item.due_date) return 'text-gray-500'
  const today = getTodayTH()
  if (item.due_date < today) return 'text-rose-400'
  if (item.due_date === today) return 'text-amber-400'
  return 'text-gray-400'
}

// Tasks (งานและการบ้าน) Dashboard Functions
const dashboardTasks = computed(() => {
  const now = new Date()
  return tasks.value
    .filter(t => !t.isCompleted && (t.isUrgent || new Date(t.deadline) >= now))
    .sort((a, b) => {
      // Sort by urgent first, then by deadline
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
    .slice(0, 6)
})

const formatTaskDeadline = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = Math.floor(diffHours / 24)

    // If overdue
    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays)
      if (overdueDays === 0) return 'เลยกำหนดวันนี้'
      return `เลยกำหนด ${overdueDays} วัน`
    }

    // If due today
    if (diffDays === 0) {
      const hours = Math.floor(diffHours)
      if (hours === 0) {
        const minutes = Math.floor((diffMs / (1000 * 60)))
        return `อีก ${minutes} นาที`
      }
      return `วันนี้ ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }

    // If due tomorrow
    if (diffDays === 1) {
      return `พรุ่งนี้ ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }

    // Otherwise show full date
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getTaskDeadlineColorClass = (task: TaskRow) => {
  if (task.isCompleted) return 'text-[color:var(--text-muted)]'
  try {
    const d = new Date(task.deadline)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffMs < 0) return 'text-[color:var(--ink-rose)]' // Overdue
    if (diffHours <= 24) return 'text-[color:var(--ink-amber)]' // Due within 24 hours
    if (diffHours <= 48) return 'text-[color:var(--brand-ink)]' // Due within 48 hours
  } catch {}
  return 'text-[color:var(--text-secondary)]'
}

const getTaskStatusLabel = (task: TaskRow) => {
  try {
    const d = new Date(task.deadline)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffMs < 0) return 'เลยกำหนด'
    if (diffHours <= 24) return 'ครบกำหนด'
    if (task.isUrgent) return 'ด่วน'
  } catch {}
  return 'ค้างส่ง'
}

const getTaskStatusStyle = (task: TaskRow) => {
  try {
    const d = new Date(task.deadline)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffMs < 0) {
      return { color: 'var(--ink-rose)', background: 'rgba(208,39,72,0.10)', border: '1px solid rgba(208,39,72,0.2)' }
    }
    if (diffHours <= 24) {
      return { color: 'var(--ink-amber)', background: 'rgba(182,133,42,0.10)', border: '1px solid rgba(182,133,42,0.2)' }
    }
    if (task.isUrgent) {
      return { color: 'var(--ink-rose)', background: 'rgba(208,39,72,0.10)', border: '1px solid rgba(208,39,72,0.2)' }
    }
  } catch {}
  return { color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }
}

const dashboardEvents = computed(() => {
  const nowMs = currentTime.value.getTime()

  // Filter out past events (events that have already ended)
  const upcomingEvents = events.value
    .filter(e => {
      const { endMs } = getDashboardEventDateTimeBounds(e)
      return endMs >= nowMs
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time || '').localeCompare(b.start_time || ''))

  // Find ongoing events
  const ongoingEvents = upcomingEvents.filter(e => {
    const { startMs, endMs } = getDashboardEventDateTimeBounds(e)
    return startMs <= nowMs && nowMs <= endMs
  })

  // If there are ongoing events, show them (max 4)
  if (ongoingEvents.length > 0) {
    return ongoingEvents.slice(0, 4)
  }

  // Otherwise, show only the next upcoming event
  return upcomingEvents.slice(0, 1)
})

const displayEventDateTimeShort = (item: DashboardEventRow) => {
  const formatTimeStr = (t: string | null) => t ? t.slice(0, 5) + ' น.' : ''
  if (item.event_type === 'same_day_all_day') return `${formatDate(item.start_date)} (ตลอดวัน)`
  if (item.event_type === 'same_day_time') return `${formatDate(item.start_date)}  ${formatTimeStr(item.start_time)} - ${formatTimeStr(item.end_time)}`
  if (item.event_type === 'multi_day') {
    const startTimeStr = item.start_time ? ` ${formatTimeStr(item.start_time)}` : ''
    const endTimeStr = item.end_time ? ` ${formatTimeStr(item.end_time)}` : ''
    return `${formatDate(item.start_date)}${startTimeStr} ถึง ${formatDate(item.end_date || '')}${endTimeStr}`
  }
  return formatDate(item.start_date)
}

const dashboardSoonThresholdMinutes = 7 * 24 * 60

const normalizeDashboardEventTime = (timeString: string | null, fallback: string) => {
  if (!timeString) return fallback
  return timeString.length === 5 ? `${timeString}:00` : timeString
}

const getDashboardEventDateTimeBounds = (item: DashboardEventRow) => {
  const endDate = item.end_date || item.start_date
  const startTime = item.event_type === 'same_day_all_day' ? '00:00:00' : normalizeDashboardEventTime(item.start_time, '00:00:00')
  const endTime = item.event_type === 'same_day_all_day' ? '23:59:59' : normalizeDashboardEventTime(item.end_time, '23:59:59')
  return {
    startMs: new Date(`${item.start_date}T${startTime}`).getTime(),
    endMs: new Date(`${endDate}T${endTime}`).getTime(),
  }
}

const formatDashboardStatusDuration = (minutes: number) => {
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

const getDashboardEventStatusMeta = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntilStart = (startMs - nowMs) / 60000
  const minutesUntilEnd = (endMs - nowMs) / 60000

  if (minutesUntilEnd < 0) {
    return { status: 'past', text: 'ผ่านไปแล้ว' }
  }

  if (startMs <= nowMs && nowMs <= endMs) {
    return { status: 'ongoing', text: 'กำลังดำเนินอยู่' }
  }

  if (minutesUntilStart <= dashboardSoonThresholdMinutes) {
    return { status: 'soon', text: `กำลังจะถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
  }

  return { status: 'future', text: `ยังไม่ถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
}

const getDashboardOngoingEventDetails = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
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
    ? '00:00 น.' 
    : (item.start_time ? item.start_time.slice(0, 5) + ' น.' : '')
  const endFormatted = item.event_type === 'same_day_all_day' 
    ? '23:59 น.' 
    : (item.end_time ? item.end_time.slice(0, 5) + ' น.' : '')

  return {
    remainingMs,
    days,
    hours,
    minutes,
    seconds,
    countdownText,
    progress: Number(progress.toFixed(1)),
    startTimeFormatted: startFormatted,
    endTimeFormatted: endFormatted,
  }
}

const getDashboardUpcomingEventDetails = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
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

  // Duration
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

const getDashboardEventStatusText = (item: DashboardEventRow) => getDashboardEventStatusMeta(item).text

const getDashboardEventStatusTokenPrefix = (item: DashboardEventRow) => `--event-status-${getDashboardEventStatusMeta(item).status}`

const getDashboardEventStatusBadgeStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    color: `var(${prefix}-ink)`,
  }
}

const getDashboardEventDateBadgeStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    boxShadow: `var(${prefix}-shadow)`,
  }
}

const getDashboardEventStatusTextStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return { color: `var(${prefix}-ink)` }
}

const isNextUpcomingEvent = (item: DashboardEventRow) => {
  const nowMs = currentTime.value.getTime()
  const ongoingEvents = dashboardEvents.value.filter(e => {
    const { startMs, endMs } = getDashboardEventDateTimeBounds(e)
    return startMs <= nowMs && nowMs <= endMs
  })

  // If there are ongoing events, this is not "next upcoming"
  if (ongoingEvents.length > 0) return false

  const maxCountdownMs = 30 * 24 * 60 * 60 * 1000 // Fix รอบ 30 วัน (หากเกิน 30 วัน จะไม่แสดง Countdown)

  // Otherwise, check if this is the first upcoming event within 30 days
  const upcoming = dashboardEvents.value.filter(e => {
    const { startMs } = getDashboardEventDateTimeBounds(e)
    const remainingMs = startMs - nowMs
    return remainingMs > 0 && remainingMs <= maxCountdownMs
  }).sort((a, b) => {
    const aStart = getDashboardEventDateTimeBounds(a).startMs
    const bStart = getDashboardEventDateTimeBounds(b).startMs
    return aStart - bStart
  })

  return Boolean(upcoming[0] && upcoming[0].id === item.id)
}

const getDashboardCountdownStyle = (item: DashboardEventRow) => {
  if (getDashboardEventStatusMeta(item).status === 'ongoing') {
    return {
      background: 'var(--event-status-ongoing-soft)',
      borderColor: 'var(--event-status-ongoing-border)',
      boxShadow: 'var(--event-status-ongoing-shadow)'
    }
  } else {
    // Use different color for next upcoming (e.g., sky blue)
    return {
      background: 'rgba(14, 165, 233, 0.1)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
      boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.1)'
    }
  }
}

const getDashboardCountdownColor = (item: DashboardEventRow) => {
  if (getDashboardEventStatusMeta(item).status === 'ongoing') {
    return 'var(--event-status-ongoing-ink)'
  } else {
    // Sky blue for next upcoming
    return 'rgb(14, 165, 233)'
  }
}

const getDashboardNextEventCountdown = (item: DashboardEventRow) => {
  const { startMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntil = (startMs - nowMs) / 60000
  return formatDashboardStatusDuration(minutesUntil)
}

const nextEventMeta = computed(() => {
  if (!events.value.length) return null
  const now = currentTime.value.getTime()

  let closestMeta = null
  let minScore = Infinity

  for (const event of events.value) {
    let startStr = `${event.start_date}T${event.start_time || '00:00:00'}`
    let endStr = `${event.end_date || event.start_date}T${event.end_time || '23:59:59'}`

    if (event.event_type === 'same_day_all_day') {
       startStr = `${event.start_date}T00:00:00`
       endStr = `${event.start_date}T23:59:59`
    }

    const startMs = new Date(startStr).getTime()
    const endMs = new Date(endStr).getTime()

    const minutesUntilStart = Math.ceil((startMs - now) / 60000)
    const minutesUntilEnd = Math.ceil((endMs - now) / 60000)

    if (minutesUntilEnd <= 0) continue

    const isCurrent = minutesUntilStart <= 0 && minutesUntilEnd > 0
    const score = isCurrent ? minutesUntilEnd - 10000000 : minutesUntilStart

    if (score < minScore) {
       minScore = score
       closestMeta = {
         item: event,
         minutesUntilStart,
         minutesUntilEnd,
         isCurrent
       }
    }
  }
  return closestMeta
})

const nextEventTitle = computed(() => nextEventMeta.value?.item.title || 'ยังไม่มีกิจกรรม')
const nextEventSubtitle = computed(() => {
  if (!nextEventMeta.value) return 'เพิ่มกิจกรรมแรกในแท็บกิจกรรม'
  return displayEventDateTimeShort(nextEventMeta.value.item)
})

const nextEventAlertText = computed(() => {
  if (!nextEventMeta.value) return 'ยังไม่มีกิจกรรมถัดไป'
  const meta = nextEventMeta.value
  if (meta.isCurrent) {
    const min = meta.minutesUntilEnd
    if (min < 60) return `กำลังดำเนินอยู่ (จบในอีก ${min} นาที)`
    const hrs = Math.floor(min / 60)
    const remainMin = min % 60
    return remainMin > 0 ? `กำลังดำเนินอยู่ (จบในอีก ${hrs} ชม. ${remainMin} นาที)` : `กำลังดำเนินอยู่ (จบในอีก ${hrs} ชม.)`
  }

  const min = meta.minutesUntilStart
  if (min < 60) return `เริ่มในอีก ${min} นาที`
  const hrs = Math.floor(min / 60)
  const remainMin = min % 60
  if (hrs < 24) return remainMin > 0 ? `เริ่มในอีก ${hrs} ชม. ${remainMin} นาที` : `เริ่มในอีก ${hrs} ชม.`
  const days = Math.floor(hrs / 24)
  const remainHrs = hrs % 24
  return remainHrs > 0 ? `เริ่มในอีก ${days} วัน ${remainHrs} ชม.` : `เริ่มในอีก ${days} วัน`
})

const nextEventAlertBadgeClass = computed(() => {
  if (!nextEventMeta.value) return 'border-gray-600 bg-gray-700/40 text-gray-300'
  const meta = nextEventMeta.value
  if (meta.isCurrent) return 'border-emerald-300/60 bg-emerald-500/25 text-emerald-100'
  if (meta.minutesUntilStart <= 60) return 'border-rose-300/60 bg-rose-500/25 text-rose-100'
  if (meta.minutesUntilStart <= 24 * 60) return 'border-amber-300/60 bg-amber-500/25 text-amber-100'
  return 'border-sky-300/60 bg-sky-500/25 text-sky-100'
})

const nextEventAlertBoxClass = computed(() => {
  if (!nextEventMeta.value) return 'border-gray-700 bg-gray-800/40'
  const meta = nextEventMeta.value
  if (meta.isCurrent) return 'border-emerald-400/35 bg-emerald-500/10'
  if (meta.minutesUntilStart <= 60) return 'border-rose-400/35 bg-rose-500/10'
  if (meta.minutesUntilStart <= 24 * 60) return 'border-amber-400/35 bg-amber-500/10'
  return 'border-sky-400/35 bg-sky-500/10'
})

const filteredDashboardEvents = computed(() => {
  if (!nextEventMeta.value) return dashboardEvents.value
  return dashboardEvents.value.filter(e => e.id !== nextEventMeta.value!.item.id)
})

const nextStudyClassMeta = computed<NextStudyClassMeta>(() => {
  if (!sortedStudySchedules.value.length) return null
  const now = currentTime.value
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedStudySchedules.value
      .filter((item) => item.day_of_week === checkingDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (const item of classesInDay) {
      const startMinutes = toMinutes(item.start_time)
      const endMinutes = toMinutes(item.end_time)
      const isCurrent = offset === 0 && currentMinutes >= startMinutes && currentMinutes < endMinutes
      if (offset > 0 || isCurrent || currentMinutes <= startMinutes) {
        return {
          item,
          dayOffset: offset,
          minutesUntil: isCurrent ? 0 : (offset * 24 * 60) + (startMinutes - currentMinutes),
          isCurrent,
        }
      }
    }
  }
  const firstItem = sortedStudySchedules.value[0]
  return firstItem
    ? { item: firstItem, dayOffset: 7, minutesUntil: (7 * 24 * 60) + (toMinutes(firstItem.start_time) - currentMinutes), isCurrent: false }
    : null
})

const nextStudyClass = computed(() => nextStudyClassMeta.value?.item || null)

const nextStudyClassTitle = computed(() => nextStudyClass.value?.course_name || 'ยังไม่มีคาบเรียน')

const nextStudyClassSubtitle = computed(() => {
  if (!nextStudyClass.value) return 'เพิ่มคาบเรียนแรกในแท็บตารางเรียน'
  const dayText = dayLabelMap.get(nextStudyClass.value.day_of_week) || 'ไม่ระบุวัน'
  return `${dayText} • ${formatTime(nextStudyClass.value.start_time)} - ${formatTime(nextStudyClass.value.end_time)}`
})

const nextStudyAlertText = computed(() => {
  if (!nextStudyClassMeta.value) return 'ยังไม่มีคาบถัดไป'
  if (nextStudyClassMeta.value.isCurrent) return 'กำลังเรียน'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 0) return 'เริ่มตอนนี้'
  if (minutes < 60) return `อีก ${minutes} นาที`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return remainMinutes > 0 ? `อีก ${hours} ชม. ${remainMinutes} นาที` : `อีก ${hours} ชม.`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `อีก ${days} วัน ${remainHours} ชม.` : `อีก ${days} วัน`
})

const nextStudyAlertBadgeClass = computed(() => {
  if (!nextStudyClassMeta.value) return 'border-gray-600 bg-gray-700/40 text-gray-300'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) return 'border-rose-300/60 bg-rose-500/25 text-rose-100'
  if (minutes <= 120) return 'border-amber-300/60 bg-amber-500/25 text-amber-100'
  return 'border-sky-300/60 bg-sky-500/25 text-sky-100'
})

const nextStudyAlertBoxClass = computed(() => {
  if (!nextStudyClassMeta.value) return 'border-gray-700 bg-gray-800/40'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) return 'border-rose-400/35 bg-rose-500/10'
  if (minutes <= 120) return 'border-amber-400/35 bg-amber-500/10'
  return 'border-sky-400/35 bg-sky-500/10'
})

type BackendTransaction = {
  id: string
  userId: string
  bookId?: string | null
  type: string
  amount: number
  category: string | null
  transactionDate: string
}

type BackendCourse = {
  id: string
  termId: string
  courseName: string
  room: string | null
  dayOfWeek: string
  startTime: string
  endTime: string
}

type BackendTerm = {
  id: string
  userId: string
  termName: string
  startDate: string
  endDate: string
  courses: BackendCourse[]
}

type BackendTodo = {
  id: string
  title: string
  description: string | null
  tag: string
  targetDate: string
  status: string
  priority: string
}

type BackendActivity = {
  id: string
  title: string
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
  isMultiDay: boolean
}

const normalizeTransactionRows = (rows: BackendTransaction[]): TransactionRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.userId),
  book_id: row.bookId ? String(row.bookId) : null,
  entry_date: String(row.transactionDate).slice(0, 10),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  amount: Number(row.amount || 0),
  created_at: String(row.transactionDate || ''),
}))

const pickActiveTerm = (terms: BackendTerm[]): BackendTerm | null => {
  if (!terms.length) return null
  const todayStr = getTodayTH()
  return terms.find(t => {
    const start = termDateKey(t.startDate)
    const end = termDateKey(t.endDate)
    return Boolean(start && end && start <= todayStr && end >= todayStr)
  }) || null
}

const normalizeStudyRows = (terms: BackendTerm[]): StudyScheduleRow[] => {
  const term = pickActiveTerm(terms)
  if (!term) return []
  return term.courses.map((c) => ({
    id: String(c.id),
    user_id: term.userId,
    course_name: String(c.courseName || ''),
    day_of_week: dayNameToNumber[c.dayOfWeek] || 1,
    start_time: String(c.startTime || '00:00:00'),
    end_time: String(c.endTime || '00:00:00'),
    location: typeof c.room === 'string' ? c.room : null,
    created_at: '',
  }))
}

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendTransaction[]>(`/api/Finance/${userId.value}${query}`)
    const sorted = [...data].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    transactions.value = normalizeTransactionRows(sorted)
  } catch (error: any) {
    console.error('Load dashboard finance error:', error)
    errorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูล Dashboard ไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const loadStudySchedules = async () => {
  isScheduleLoading.value = true
  scheduleErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendTerm[]>(`/api/Schedule/terms/${userId.value}`)
    academicTerms.value = data
    studySchedules.value = normalizeStudyRows(data)
  } catch (error: any) {
    console.error('Load study schedules summary error:', error)
    scheduleErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลตารางเรียนไม่สำเร็จ')
  } finally {
    isScheduleLoading.value = false
  }
}

const normalizeTodoRows = (rows: BackendTodo[]): TodoRow[] => rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  description: row.description,
  tag: row.tag || 'ทั่วไป',
  due_date: row.targetDate ? String(row.targetDate).slice(0, 10) : null,
  status: (statusFromBackend[row.status] || 'pending') as TodoStatus,
  priority: (row.priority === 'low' || row.priority === 'high' ? row.priority : 'medium') as TodoPriority,
}))

const loadTodos = async () => {
  isTodosLoading.value = true
  todosErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendTodo[]>(`/api/Todo/${userId.value}`)
    todos.value = normalizeTodoRows(data)
  } catch (error: any) {
    console.error('Load todos error:', error)
    todosErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลงานไม่สำเร็จ')
  } finally {
    isTodosLoading.value = false
  }
}

const loadTasks = async () => {
  isTasksLoading.value = true
  tasksErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<TaskRow[]>(`/api/Task/${userId.value}`)
    tasks.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Load tasks error:', error)
    tasksErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลงานและการบ้านไม่สำเร็จ')
  } finally {
    isTasksLoading.value = false
  }
}

const markTodoDone = async (id: string) => {
  const item = todos.value.find(t => t.id === id)
  if (!item) return
  try {
    await apiFetch(`/api/Todo/${id}`, {
      method: 'PUT',
      body: {
        title: item.title,
        description: item.description,
        targetDate: `${item.due_date || getTodayTH()}T00:00:00`,
        tag: item.tag,
        recurrence: 'none',
        status: 'completed',
        priority: item.priority,
        isCompleted: true,
      },
    })
    todos.value = todos.value.map(t => t.id === id ? { ...t, status: 'completed' } : t)
  } catch (err: any) {
    console.error('Mark done error:', err)
  }
}

const normalizeEventRows = (rows: BackendActivity[]): DashboardEventRow[] => rows.map((row) => {
  const eventType: EventTypeType = row.isAllDay ? 'same_day_all_day' : row.isMultiDay ? 'multi_day' : 'same_day_time'
  const startDate = row.startTime ? row.startTime.slice(0, 10) : getTodayTH()
  const endDate = row.endTime ? row.endTime.slice(0, 10) : null
  return {
    id: String(row.id),
    title: String(row.title),
    event_type: eventType,
    start_date: startDate,
    start_time: eventType === 'same_day_all_day' ? null : (row.startTime ? row.startTime.slice(11, 19) : null),
    end_date: eventType === 'same_day_time' ? null : endDate,
    end_time: eventType === 'same_day_all_day' ? null : (row.endTime ? row.endTime.slice(11, 19) : null),
  }
})

const loadEvents = async () => {
  isEventsLoading.value = true
  eventsErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendActivity[]>(`/api/Activity/${userId.value}`)
    events.value = normalizeEventRows(data)
  } catch (error: any) {
    console.error('Load events error:', error)
    eventsErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลกิจกรรมไม่สำเร็จ')
  } finally {
    isEventsLoading.value = false
  }
}

type BackendRecurringExpense = {
  id: string
  userId: string
  bookId?: string | null
  title: string
  amount: number
  category: string
  startDate: string
  endDate: string | null
  isIndefinite: boolean
  dayOfMonthDue: number
}

const recurringExpenses = ref<BackendRecurringExpense[]>([])
const isRecurringLoading = ref(false)
const isPayingDashboardRecurringId = ref('')

// Timer for countdown updates
let recurringCountdownTimer: ReturnType<typeof setInterval> | null = null
const forceRecurringUpdate = ref(0) // Trigger for reactive updates

const loadRecurringExpenses = async () => {
  isRecurringLoading.value = true
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendRecurringExpense[]>(`/api/Finance/recurring/${userId.value}${query}`)
    recurringExpenses.value = data || []
  } catch (error: any) {
    console.error('Load dashboard recurring expenses error:', error)
  } finally {
    isRecurringLoading.value = false
  }
}

const calculateNextDue = (r: { dayOfMonthDue?: number; startDate?: string }) => {
  const day = r.dayOfMonthDue ?? 1
  const now = nowTH()
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const firstOfThisMonth = new Date(todayOnly.getFullYear(), todayOnly.getMonth(), 1)

  let startDate = todayOnly
  if (r.startDate) {
    const parsed = new Date(r.startDate)
    if (!isNaN(parsed.getTime())) {
      startDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    }
  }

  const searchFrom = startDate > firstOfThisMonth ? startDate : firstOfThisMonth

  const dueDateFor = (y: number, m: number) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const clampedDay = Math.min(Math.max(1, day), daysInMonth)
    return new Date(y, m, clampedDay)
  }

  let nextDue = dueDateFor(searchFrom.getFullYear(), searchFrom.getMonth())
  if (nextDue.getTime() < searchFrom.getTime()) {
    const nextMonth = searchFrom.getMonth() === 11 ? 0 : searchFrom.getMonth() + 1
    const nextYear = searchFrom.getMonth() === 11 ? searchFrom.getFullYear() + 1 : searchFrom.getFullYear()
    nextDue = dueDateFor(nextYear, nextMonth)
  }
  return nextDue
}

const nearestRecurringItemInfo = computed(() => {
  // Use forceRecurringUpdate to trigger reactive updates
  forceRecurringUpdate.value // Access to make it reactive

  if (!recurringExpenses.value.length) return null

  const now = currentTime.value
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let nearestItem: BackendRecurringExpense | null = null
  let nearestNextDue: Date | null = null
  let minDays = 999999

  for (const r of recurringExpenses.value) {
    const nextDue = calculateNextDue(r)
    const dueOnly = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate())
    const daysUntil = Math.round((dueOnly.getTime() - todayOnly.getTime()) / (1000 * 3600 * 24))

    if (daysUntil < minDays) {
      minDays = daysUntil
      nearestItem = r
      nearestNextDue = nextDue
    }
  }

  if (!nearestItem || !nearestNextDue) return null

  const dueTarget = new Date(nearestNextDue.getFullYear(), nearestNextDue.getMonth(), nearestNextDue.getDate(), 23, 59, 59)
  const remainingMs = dueTarget.getTime() - now.getTime()

  let countdownText = ''
  if (remainingMs < 0) {
    countdownText = 'เลยกำหนด'
  } else if (minDays === 0) {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `เหลือ ${h}:${m}:${s}`
  } else {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor((totalSec % (3600 * 24)) / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `${minDays}วัน ${h}:${m}:${s}`
  }

  let dueLabel = ''
  let statusClass = ''
  if (minDays === 0) {
    dueLabel = 'ครบกำหนดวันนี้'
    statusClass = 'text-[color:var(--ink-rose)]'
  } else if (minDays < 0) {
    dueLabel = `เลยกำหนด ${Math.abs(minDays)} วัน`
    statusClass = 'text-[color:var(--ink-rose)]'
  } else if (minDays <= 3) {
    dueLabel = `อีก ${minDays} วัน`
    statusClass = 'text-[color:var(--ink-amber)]'
  } else {
    dueLabel = `อีก ${minDays} วัน`
    statusClass = 'text-[color:var(--text-secondary)]'
  }

  // คำนวณ progress bar (จากวันที่เริ่มรอบจนถึงวันครบกำหนด)
  const startDate = nearestItem.startDate
    ? new Date(nearestItem.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const totalDuration = nearestNextDue.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, elapsed / totalDuration)) : 0
  const progressPercent = Math.round(progress * 100)

  return {
    item: nearestItem,
    nextDue: nearestNextDue,
    minDays,
    countdownText,
    dueLabel,
    statusClass,
    progress,
    progressPercent,
  }
})

const payDashboardRecurring = async (item: BackendRecurringExpense) => {
  if (isPayingDashboardRecurringId.value) return
  const { confirmAction, toastSuccess, toastError } = useAlert()
  const shouldPay = import.meta.client ? await confirmAction(
    `ยืนยันชำระ ${item.title}?`,
    `ยอดเงิน ฿${item.amount.toLocaleString()} จะถูกบันทึกในรายการจ่าย และขยับวันชำระไปรอบถัดไป`,
    'ชำระเงินเรียบร้อย'
  ) : true
  if (!shouldPay) return

  isPayingDashboardRecurringId.value = item.id
  try {
    const currentNextDue = calculateNextDue(item)
    // 1. Record expense
    const bodyTx = {
      userId: userId.value,
      bookId: item.bookId || null,
      type: 'expense',
      amount: item.amount,
      category: item.category || 'ค่าใช้จ่ายประจำ',
      transactionDate: new Date().toISOString(),
      note: `ชำระรายจ่ายประจำ: ${item.title}`,
    }
    await apiFetch('/api/Finance', { method: 'POST', body: bodyTx })

    // 2. Advance next due date
    const newStartDate = new Date(currentNextDue)
    newStartDate.setDate(newStartDate.getDate() + 1)

    const y = newStartDate.getFullYear()
    const m = String(newStartDate.getMonth() + 1).padStart(2, '0')
    const d = String(newStartDate.getDate()).padStart(2, '0')

    const bodyRecurring = {
      ...item,
      startDate: `${y}-${m}-${d}T00:00:00.000Z`,
    }
    await apiFetch(`/api/Finance/recurring/${item.id}`, { method: 'PUT', body: bodyRecurring })

    toastSuccess(`บันทึกรายจ่าย ฿${item.amount.toLocaleString()} เรียบร้อยแล้ว`)
    await Promise.all([loadTransactions(), loadRecurringExpenses()])
  } catch (error: any) {
    console.error('Pay dashboard recurring error:', error)
    toastError(getApiErrorMessage(error, 'เกิดข้อผิดพลาดในการชำระรายจ่ายประจำ'))
  } finally {
    isPayingDashboardRecurringId.value = ''
  }
}

watch(selectedBookId, () => {
  if (isModuleEnabled('cashflow')) {
    loadTransactions()
    loadRecurringExpenses()
  }
})

const refreshOverview = async () => {
  const promises: Promise<any>[] = []
  if (isModuleEnabled('cashflow')) {
    promises.push(fetchBooks(), loadTransactions(), loadRecurringExpenses())
  }
  if (isModuleEnabled('study-schedule')) {
    promises.push(loadStudySchedules())
  }
  if (isModuleEnabled('todos')) {
    promises.push(loadTodos())
  }
  if (isModuleEnabled('tasks')) {
    promises.push(loadTasks())
  }
  if (isModuleEnabled('events')) {
    promises.push(loadEvents())
  }
  await Promise.all(promises)
  lastUpdateTime.value = nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshOverview()
  clockTimer = setInterval(() => {
    currentTime.value = nowTH()
  }, 1000)

  // Start countdown timer for recurring expenses
  recurringCountdownTimer = setInterval(() => {
    if (recurringExpenses.value.length > 0) {
      forceRecurringUpdate.value++
    }
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (recurringCountdownTimer) {
    clearInterval(recurringCountdownTimer)
    recurringCountdownTimer = null
  }
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all .3s cubic-bezier(.4, 0, .2, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.db { width: min(100%, 1280px); margin: 0 auto; padding: clamp(16px, 3vw, 36px) clamp(14px, 3vw, 32px) 80px; color: var(--text-primary); display: flex; flex-direction: column; gap: 16px; }
.db a { text-decoration: none; color: inherit; }
.db h1, .db h2, .db h3, .db p { margin: 0; }
.db strong, .db b { font-weight: 700; }
.is-good { color: var(--ink-emerald) !important; }
.is-risk { color: var(--ink-rose) !important; }

/* Hero */
.db-hero { position: relative; overflow: hidden; padding: clamp(22px, 4vw, 40px); border-radius: 28px; color: #fff; background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); isolation: isolate; }
.db-hero__glow { position: absolute; z-index: -1; border-radius: 50%; filter: blur(70px); opacity: .22; }
.db-hero__glow--a { width: 320px; height: 320px; top: -140px; right: -60px; background: #38bdf8; }
.db-hero__glow--b { width: 260px; height: 260px; bottom: -140px; left: 20%; background: #a78bfa; opacity: .18; }
.db-hero__top { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.db-pill { display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,.12); color: #e0e7ff; backdrop-filter: blur(8px); font-size: 12px; font-weight: 600; }
.db-hero h1 { margin-top: 14px; font-size: clamp(28px, 4.6vw, 48px); line-height: 1.12; letter-spacing: -.03em; font-weight: 600; }
.db-hero h1 em { font-style: normal; font-weight: 800; }
.db-hero__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.db-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 18px; border-radius: 14px; font-size: 13px; font-weight: 700; transition: transform .2s, background .2s; cursor: pointer; }
.db-btn svg { width: 15px; height: 15px; }
.db-btn:hover { transform: translateY(-2px); }
.db a.db-btn--solid { background: #fff; color: #1e3a8a; }
.db a.db-btn--ghost { border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.08); color: #fff; backdrop-filter: blur(8px); }
.db .db-notice a.db-btn--ghost { border-color: var(--border-default); background: var(--bg-elevated); color: var(--text-primary); }

.db-hero__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-top: 28px; }
.db-stat { display: flex; flex-direction: column; gap: 4px; padding: 16px 18px; border-radius: 20px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(14px); transition: background .2s, transform .2s; }
.db-stat:hover { background: rgba(255,255,255,.12); transform: translateY(-2px); }
.db-stat__label { font-size: 12px; color: #c7d2fe; }
.db-stat__value { font-size: 26px; letter-spacing: -.03em; line-height: 1.2; }
.db-stat__value small { margin-left: 5px; font-size: 13px; font-weight: 600; opacity: .8; }
.db-stat__hint { font-size: 11.5px; color: #c7d2fe; }
.db-hero .is-good { color: #6ee7b7 !important; font-weight: 700; }
.db-hero .is-risk { color: #fda4af !important; font-weight: 700; }
:global(:root.theme-night) .db-hero { color: #edf6ff; background: linear-gradient(135deg, #173655 0%, #1d4161 52%, #1a3b57 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 18px 42px rgba(0,0,0,.18); }
:global(:root.theme-night) .db-hero__glow { opacity: .22; }:global(:root.theme-night) .db-hero__glow--b { opacity: .16; }
:global(:root.theme-night) .db-pill { color: #e8f4ff; background: rgba(9,24,41,.42); border: 1px solid rgba(177,215,241,.19); }
:global(:root.theme-night) .db-btn--solid { color: #0b2942; background: #d8ebf9; box-shadow: 0 6px 16px rgba(0,0,0,.16); }.db-btn--solid:hover { background: #edf7ff; }
:global(:root.theme-night) .db-btn--ghost { color: #eaf5ff; border-color: rgba(194,224,244,.35); background: rgba(5,20,35,.20); }
:global(:root.theme-night) .db-stat { color: #e9f4ff; background: rgba(7,25,43,.30); border-color: rgba(182,216,239,.18); }.db-stat:hover { background: rgba(7,25,43,.46); }
:global(:root.theme-night) .db-stat__label { color: #cfe4f5; opacity: 1; }.db-stat__hint { color: #b9d3e8; opacity: 1; }

.db-alert { padding: 12px 16px; border-radius: 14px; font-size: 13px; color: var(--event-status-soon-ink); background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); }
.db-alert--inline { margin: 0 20px 12px; }

/* Books */
.db-books { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.db-books button { display: inline-flex; gap: 6px; align-items: center; padding: 9px 16px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); font-size: 12.5px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all .2s; }
.db-books button.active { background: var(--text-primary); color: var(--bg-card); border-color: var(--text-primary); }

/* Bento */
.db-bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.db-card { position: relative; min-width: 0; overflow: hidden; border-radius: 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 12px 32px -20px rgba(21,46,84,.25); transition: transform .25s, box-shadow .25s; }
.db-card:hover { transform: translateY(-3px); box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 22px 40px -20px rgba(21,46,84,.35); }
.db-card--balance { grid-column: span 8; padding: 26px; }
.db-card--donut { grid-column: span 4; }
.db-card--tx { grid-column: span 5; }
.db-card--due { grid-column: span 3; }
.db-card--study { grid-column: span 4; }
.db-card--work { grid-column: span 7; }
.db-card--events { grid-column: span 5; }

.db-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 22px 22px 14px; }
.db-card__kicker { display: block; margin-bottom: 4px; color: var(--brand-ink); font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.db-card h2 { font-size: 17px; letter-spacing: -.02em; font-weight: 700; }
.db-card__link { padding: 6px 12px; border-radius: 999px; background: var(--bg-elevated); color: var(--text-secondary); font-size: 11.5px; font-weight: 700; white-space: nowrap; transition: background .2s, color .2s; }
.db-card__link:hover { background: var(--brand-soft); color: var(--brand-ink); }
.db-empty { padding: 28px 22px 34px; text-align: center; color: var(--text-muted); font-size: 13px; }
.db-empty__sub { display: block; margin-top: 4px; font-size: 11.5px; }

/* Balance */
.db-balance__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.db-balance__label { display: block; color: var(--text-muted); font-size: 13px; font-weight: 600; }
.db-balance__value { display: block; margin: 6px 0 4px; font-size: clamp(32px, 5vw, 52px); line-height: 1.05; letter-spacing: -.045em; font-weight: 800; }
.db-balance__value.is-neg { color: var(--ink-rose); }
.db-balance__note { color: var(--text-secondary); font-size: 12.5px; }
.db-seg { display: flex; padding: 4px; gap: 2px; border-radius: 14px; background: var(--bg-elevated); }
.db-seg button { padding: 7px 12px; border: 0; border-radius: 10px; background: transparent; color: var(--text-secondary); font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all .2s; }
.db-seg button.active { background: var(--bg-card); color: var(--brand-ink); box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.db-balance__empty { display: grid; place-items: center; height: 160px; margin-top: 20px; border-radius: 18px; background: var(--bg-elevated); color: var(--text-muted); font-size: 13px; }
.db-chart { display: flex; align-items: flex-end; gap: clamp(6px, 1.4vw, 16px); height: 190px; margin-top: 24px; }
.db-chart__col { position: relative; flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; transition: opacity .2s; cursor: pointer; }
.db-chart__col.dim { opacity: .4; }
.db-chart__bars { width: 100%; flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 4px; padding: 0 4%; border-radius: 12px; background: var(--bg-elevated); }
.db-chart__bars i { display: block; width: min(18px, 38%); border-radius: 8px 8px 3px 3px; transition: height .4s cubic-bezier(.2,.8,.2,1); }
.db-chart__bars .in { background: linear-gradient(180deg, var(--ink-emerald), color-mix(in srgb, var(--ink-emerald) 60%, transparent)); }
.db-chart__bars .out { background: linear-gradient(180deg, var(--ink-rose), color-mix(in srgb, var(--ink-rose) 60%, transparent)); }
.db-chart__x { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted); font-size: 10.5px; font-weight: 600; }
.db-chart__tip { position: absolute; z-index: 5; bottom: calc(100% - 20px); left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 12px; background: var(--text-primary); color: var(--bg-card); font-size: 11px; white-space: nowrap; pointer-events: none; box-shadow: 0 10px 24px rgba(0,0,0,.25); }
.db-chart__tip b { margin-bottom: 3px; }
.db-chart__tip .is-in { color: #6ee7b7; }
.db-chart__tip .is-out { color: #fda4af; }
.db-balance__foot { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
.db-balance__foot > div { flex: 1; min-width: 150px; display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 16px; background: var(--bg-elevated); color: var(--text-secondary); font-size: 12px; }
.db-balance__foot strong { margin-left: auto; color: var(--text-primary); font-size: 14px; }
.dot { width: 9px; height: 9px; border-radius: 50%; }
.dot.in { background: var(--ink-emerald); }
.dot.out { background: var(--ink-rose); }

/* Donut */
.db-donut { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 4px 22px 24px; }
.db-donut__ring { position: relative; width: 168px; height: 168px; }
.db-donut__ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.db-donut__ring circle { transition: all .3s; cursor: pointer; }
.db-donut__center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 28px; text-align: center; pointer-events: none; }
.db-donut__center small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted); font-size: 11px; }
.db-donut__center strong { font-size: 15px; letter-spacing: -.02em; }
.db-donut__legend { width: 100%; margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.db-donut__legend li { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 10px; font-size: 12.5px; cursor: pointer; transition: background .2s; }
.db-donut__legend li:hover { background: var(--bg-elevated); }
.swatch { width: 10px; height: 10px; border-radius: 4px; flex-shrink: 0; }
.db-donut__legend .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); }
.db-donut__legend .pct { font-weight: 700; }

/* Lists */
.db-list { margin: 0; padding: 0 12px 14px; list-style: none; display: flex; flex-direction: column; gap: 2px; }
.db-list > li { border-radius: 14px; transition: background .2s; }
.db-list > li:hover { background: var(--bg-elevated); }
.db-list strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; color: var(--text-primary); }
.db-list small { display: block; margin-top: 2px; color: var(--text-muted); font-size: 11.5px; }

.db-tx { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px; }
.db-tx__icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 14px; }
.db-tx__icon svg { width: 17px; height: 17px; }
.db-tx__icon.income { background: var(--event-status-ongoing-soft); color: var(--ink-emerald); }
.db-tx__icon.expense { background: color-mix(in srgb, var(--ink-rose) 12%, transparent); color: var(--ink-rose); }
.db-tx b { font-size: 13.5px; }

.db-class { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px; }
.db-class time { color: var(--text-muted); font-size: 11px; line-height: 1.5; }
.db-class > div { padding-left: 12px; border-left: 3px solid var(--tint, var(--brand)); border-radius: 2px; }
.db-class.is-finished { opacity: .5; }
.db-class.is-finished strong { text-decoration: line-through; }
.db-class.is-active { background: var(--event-status-ongoing-soft); }

.db-work { display: grid; grid-template-columns: 4px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px 10px; }
.db-work__bar { align-self: stretch; border-radius: 4px; background: var(--border-default); }
.db-work__bar.urgent { background: var(--ink-rose); }

.db-chip, .db-tag { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 700; white-space: nowrap; background: var(--brand-soft); color: var(--brand-ink); }
.db-chip.is-risk-chip { background: color-mix(in srgb, var(--ink-rose) 14%, transparent); color: var(--ink-rose); }
.db-tag--live { background: var(--ink-emerald); color: #fff; }
.db-tag--done { background: var(--bg-elevated-2); color: var(--text-muted); }

/* Due */
.db-card--due { background: linear-gradient(160deg, color-mix(in srgb, var(--ink-amber) 14%, var(--bg-card)), var(--bg-card) 70%); }
.db-due { padding: 4px 22px 22px; display: flex; flex-direction: column; gap: 6px; }
.db-due .db-tag { align-self: flex-start; background: color-mix(in srgb, var(--ink-amber) 20%, transparent); color: var(--ink-amber); }
.db-due h3 { margin-top: 8px; font-size: 17px; letter-spacing: -.02em; }
.db-due p { color: var(--text-muted); font-size: 12px; }
.db-due__foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.db-due__foot strong { font-size: 18px; letter-spacing: -.02em; }
.db-due__foot button { padding: 9px 14px; border: 0; border-radius: 12px; background: var(--ink-emerald); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; transition: transform .2s, opacity .2s; }
.db-due__foot button:hover:not(:disabled) { transform: translateY(-1px); }
.db-due__foot button:disabled { opacity: .6; cursor: default; }
.db-progress { height: 7px; margin-top: 8px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--text-muted) 18%, transparent); }
.db-progress--thin { height: 5px; margin-top: 6px; }
.db-progress i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ink-amber), var(--brand)); transition: width .5s ease; }
.db-progress i.late { background: var(--ink-rose); }
.db-progress i.live { background: linear-gradient(90deg, var(--ink-emerald), var(--ink-cyan)); }

/* Next class */
.db-next { display: flex; flex-direction: column; gap: 3px; margin: 0 16px 12px; padding: 16px; border-radius: 18px; background: var(--brand-soft); text-align: left; }
.db-next span { color: var(--brand-ink); font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.db-next strong { font-size: 15px; color: var(--text-primary); }
.db-next b { color: var(--brand-ink); font-size: 13px; }
.db-next small { color: var(--text-muted); font-size: 11.5px; }
.db-next.is-live { background: var(--event-status-ongoing-soft); }
.db-next.is-live span, .db-next.is-live b { color: var(--ink-emerald); }
.db-empty .db-next { margin: 16px 0 0; }

/* Events */
.db-events { display: flex; flex-direction: column; gap: 8px; padding: 0 14px 16px; }
.db-event { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 14px; padding: 12px; border-radius: 18px; background: var(--bg-elevated); transition: background .2s, transform .2s; }
.db-event:hover { background: var(--brand-soft); transform: translateX(3px); }
.db-event time { display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 14px; background: var(--bg-card); color: var(--brand-ink); }
.db-event time b { font-size: 20px; line-height: 1; }
.db-event time span { margin-top: 2px; font-size: 10.5px; font-weight: 700; }
.db-event__body { min-width: 0; }
.db-event__body strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
.db-event__body small { color: var(--text-muted); font-size: 11.5px; }
.db-event__meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; font-weight: 700; }
.db-event__meta b { color: var(--brand-ink); }

.db-notice { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 16px 20px; border-radius: 20px; border: 1px dashed var(--border-default); background: var(--bg-card); }
.db-notice p { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.db-notice span { color: var(--text-muted); font-size: 12px; }

@media (max-width: 1024px) {
  .db-card--balance, .db-card--work { grid-column: span 12; }
  .db-card--donut, .db-card--tx, .db-card--due, .db-card--study, .db-card--events { grid-column: span 6; }
}
@media (max-width: 700px) {
  .db-bento { gap: 12px; }
  .db-card--balance, .db-card--donut, .db-card--tx, .db-card--due, .db-card--study, .db-card--work, .db-card--events { grid-column: span 12; }
  .db-card--balance { padding: 20px; }
  .db-hero { border-radius: 24px; }
  .db-chart__col:nth-child(n+8) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .db-card, .db-stat, .db-btn, .db-event { transition: none; }
  .db-card:hover, .db-stat:hover, .db-btn:hover, .db-event:hover { transform: none; }
}
</style>
