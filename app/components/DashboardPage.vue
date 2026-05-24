<template>
  <AppTabsLayout>
    <header class="px-6 md:px-8 py-5 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Dashboard ภาพรวม</h1>
        <p class="text-sm text-gray-400 mt-1">{{ todayText }}</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/cashflow"
          class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium transition-colors"
        >
          รายรับรายจ่าย
        </NuxtLink>
        <NuxtLink
          to="/study-schedule"
          class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium transition-colors"
        >
          ตารางเรียน
        </NuxtLink>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">เงินคงเหลือรวม</p>
          <p class="text-2xl font-bold mt-2" :class="remainingBalance >= 0 ? 'text-sky-300' : 'text-amber-300'">
            {{ formatCurrency(remainingBalance) }}
          </p>

          <div class="mt-3">
            <div class="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
              <div
                class="h-full transition-all"
                :class="remainingBalance >= 0 ? 'bg-sky-500' : 'bg-amber-500'"
                :style="{ width: `${remainingProgressPercent}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ remainingProgressText }}</p>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายรับรวม</p>
          <p class="text-2xl font-bold text-emerald-400 mt-2">{{ formatCurrency(totalIncome) }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายรวม</p>
          <p class="text-2xl font-bold text-rose-400 mt-2">{{ formatCurrency(totalExpense) }}</p>

          <div class="mt-3">
            <div class="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
              <div
                class="h-full bg-rose-500 transition-all"
                :style="{ width: `${expenseProgressPercent}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              {{ expenseProgressText }}
              <span v-if="overspentAmount > 0" class="text-amber-300">(เกิน {{ formatCurrency(overspentAmount) }})</span>
            </p>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายที่มากที่สุด</p>
          <p class="text-lg font-semibold text-white mt-2 truncate">{{ topExpenseCategory.name }}</p>
          <p class="text-sm text-gray-400 mt-1">{{ formatCurrency(topExpenseCategory.amount) }}</p>
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div class="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">สรุปการเงินแบบย่อ</h2>
              <p class="text-sm text-gray-400 mt-1">แสดงเฉพาะข้อมูลสำคัญบนหน้า Dashboard</p>
            </div>
            <button
              @click="refreshOverview"
              :disabled="isLoading"
              class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-xs"
            >
              {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
            </button>
          </div>

          <div v-if="isLoading" class="text-sm text-gray-400">กำลังโหลดข้อมูล...</div>

          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">จำนวนรายการทั้งหมด</p>
                <p class="text-lg font-semibold text-white mt-1">{{ totalTransactions }} รายการ</p>
              </div>
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">รายการล่าสุด</p>
                <p class="text-sm font-medium text-white mt-1">{{ latestTransactionTitle }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ latestTransactionSubtitle }}</p>
              </div>
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">ค่าใช้จ่ายหมวดสูงสุด</p>
                <p class="text-sm font-medium text-white mt-1">{{ topExpenseCategory.name }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatCurrency(topExpenseCategory.amount) }}</p>
              </div>
            </div>

            <NuxtLink
              to="/cashflow"
              class="inline-flex items-center px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium"
            >
              ดูรายละเอียดรายรับรายจ่ายทั้งหมด
            </NuxtLink>
          </div>
        </div>

        <div class="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">สรุปตารางเรียน</h2>
              <p class="text-sm text-gray-400 mt-1">ข้อมูลจำเป็นสำหรับดูเร็วบนหน้า Dashboard</p>
            </div>
            <button
              @click="loadStudySchedules"
              :disabled="isScheduleLoading"
              class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-xs"
            >
              {{ isScheduleLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
            </button>
          </div>

          <div
            v-if="scheduleErrorMessage"
            class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-xs mb-3"
          >
            {{ scheduleErrorMessage }}
          </div>

          <div v-if="isScheduleLoading" class="text-sm text-gray-400">กำลังโหลดข้อมูลตารางเรียน...</div>

          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">คาบเรียนวันนี้</p>
                <p class="text-lg font-semibold text-white mt-1">{{ todaysStudyClasses.length }} คาบ</p>
              </div>
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">คาบทั้งหมดต่อสัปดาห์</p>
                <p class="text-lg font-semibold text-white mt-1">{{ totalStudyClasses }} คาบ</p>
              </div>
            </div>

            <div class="rounded-xl border px-3 py-3" :class="nextStudyAlertBoxClass">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-xs text-gray-200/90">คาบถัดไป</p>
                  <p class="text-sm font-medium text-white mt-1">{{ nextStudyClassTitle }}</p>
                  <p class="text-xs text-gray-300 mt-1">{{ nextStudyClassSubtitle }}</p>
                </div>
                <span
                  class="text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap"
                  :class="nextStudyAlertBadgeClass"
                >
                  {{ nextStudyAlertText }}
                </span>
              </div>
            </div>

            <div class="border border-gray-800 rounded-xl px-3 py-3">
              <div class="flex items-center justify-between gap-2 mb-2">
                <p class="text-xs text-gray-500">วิชาวันนี้</p>
                <p v-if="todaysStudyClasses.length" class="text-xs text-gray-500">{{ todaysStudyClasses.length }} คาบ</p>
              </div>

              <div v-if="todaysStudyPreview.length" class="flex flex-wrap gap-2">
                <span
                  v-for="item in todaysStudyPreview"
                  :key="item.id"
                  class="px-2 py-1 rounded-full text-xs border"
                  :class="getCourseChipClass(item.course_name)"
                >
                  {{ formatTime(item.start_time) }} {{ item.course_name }}
                </span>

                <span
                  v-if="todaysStudyClasses.length > todaysStudyPreview.length"
                  class="px-2 py-1 rounded-full text-xs border border-gray-700 text-gray-300"
                >
                  +{{ todaysStudyClasses.length - todaysStudyPreview.length }} วิชา
                </span>
              </div>

              <p v-else class="text-xs text-gray-500">วันนี้ไม่มีคาบเรียน</p>
            </div>

            <NuxtLink
              to="/study-schedule"
              class="inline-flex items-center px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium"
            >
              จัดการตารางเรียน
            </NuxtLink>
          </div>
        </div>
      </section>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-white">งานและ To-do (วันนี้ / ค้างส่ง)</h2>
            <p class="text-sm text-gray-400 mt-1">สรุปงานสำคัญที่ต้องรีบจัดการ</p>
          </div>
          <NuxtLink
            to="/todos"
            class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs inline-flex items-center gap-1"
          >
            ดูทั้งหมด
          </NuxtLink>
        </div>

        <div
          v-if="todosErrorMessage"
          class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-xs mb-3"
        >
          {{ todosErrorMessage }}
        </div>

        <div v-if="isTodosLoading" class="text-sm text-gray-400">กำลังโหลดข้อมูลงาน...</div>
        <div v-else-if="!todos.length" class="text-sm text-gray-400">ยังไม่มีงานใดๆ กดปุ่ม 'ดูทั้งหมด' เพื่อเพิ่มงานใหม่</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="todo in dashboardTodos"
            :key="todo.id"
            class="border border-gray-700 rounded-xl px-4 py-3 bg-gray-800/30 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-1">
                <p class="text-sm font-medium text-white line-clamp-2">{{ todo.title }}</p>
                <span v-if="todo.priority === 'high'" class="shrink-0 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">ด่วน</span>
              </div>
              <p class="text-[11px]" :class="getTodoDateColor(todo)">
                {{ todo.due_date ? `กำหนด: ${formatDate(todo.due_date)}` : 'ไม่มีกำหนด' }}
              </p>
            </div>
            
            <div class="mt-3 flex items-center justify-between">
              <span class="text-[10px] uppercase px-2 py-0.5 rounded-full border border-gray-600 bg-gray-700 text-gray-300">
                {{ todo.status === 'in_progress' ? 'กำลังทำ' : 'รอทำ' }}
              </span>
              <button 
                @click="markTodoDone(todo.id)"
                class="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>✓</span> เสร็จแล้ว
              </button>
            </div>
          </div>
          
          <div
            v-if="dashboardTodos.length === 0"
            class="md:col-span-2 lg:col-span-3 border border-dashed border-gray-700 rounded-xl px-4 py-6 text-center"
          >
            <p class="text-sm text-gray-400">🎉 ไม่มีงานด่วนหรืองานค้างในวันนี้</p>
          </div>
        </div>
      </section>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-white">กิจกรรมและนัดหมาย</h2>
            <p class="text-sm text-gray-400 mt-1">เหตุการณ์สำคัญที่กำลังจะมาถึง</p>
          </div>
          <NuxtLink
            to="/events"
            class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs inline-flex items-center gap-1"
          >
            ดูทั้งหมด
          </NuxtLink>
        </div>

        <div
          v-if="eventsErrorMessage"
          class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-xs mb-3"
        >
          {{ eventsErrorMessage }}
        </div>

        <div v-if="isEventsLoading" class="text-sm text-gray-400">กำลังโหลดข้อมูลกิจกรรม...</div>
        <div v-else-if="!dashboardEvents.length" class="text-sm text-gray-400">🎉 ยังไม่มีกิจกรรมที่กำลังจะมาถึง</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="event in dashboardEvents"
            :key="event.id"
            class="border border-gray-700 rounded-xl px-4 py-3 bg-gray-800/30 flex items-center justify-between gap-4"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white line-clamp-1 mb-1">{{ event.title }}</p>
              <p class="text-[11px] text-sky-400 font-medium">
                {{ displayEventDateTimeShort(event) }}
              </p>
            </div>
            <div class="shrink-0 text-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <div class="text-[10px] text-rose-400 font-bold uppercase">{{ getMonthShort(event.start_date) }}</div>
              <div class="text-lg text-white font-bold">{{ getDay(event.start_date) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type TransactionType = 'income' | 'expense'

type TransactionRow = {
  id: string
  user_id: string
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
} | null

type TodoStatus = 'pending' | 'in_progress' | 'completed'
type TodoPriority = 'low' | 'medium' | 'high'

type TodoRow = {
  id: string
  title: string
  due_date: string | null
  status: TodoStatus
  priority: TodoPriority
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

const router = useRouter()
const supabase = useSupabaseClient()

const transactions = ref<TransactionRow[]>([])
const studySchedules = ref<StudyScheduleRow[]>([])
const todos = ref<TodoRow[]>([])
const events = ref<DashboardEventRow[]>([])

const isLoading = ref(true)
const isScheduleLoading = ref(true)
const isTodosLoading = ref(true)
const isEventsLoading = ref(true)
const errorMessage = ref('')
const scheduleErrorMessage = ref('')
const todosErrorMessage = ref('')
const eventsErrorMessage = ref('')

const todayText = new Date().toLocaleDateString('th-TH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
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

const tableMissingCodes = new Set(['42P01', 'PGRST205'])

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
  if (!normalized) {
    return 'border-gray-600 bg-gray-700/30 text-gray-100'
  }

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
  if (totalIncome.value <= 0) {
    return totalExpense.value > 0 ? 100 : 0
  }

  const ratio = (totalExpense.value / totalIncome.value) * 100
  return Math.min(ratio, 100)
})

const remainingProgressPercent = computed(() => {
  if (totalIncome.value <= 0) {
    return 0
  }

  const ratio = (remainingBalance.value / totalIncome.value) * 100
  return Math.min(Math.max(ratio, 0), 100)
})

const expenseProgressText = computed(() => {
  if (totalIncome.value <= 0) {
    return totalExpense.value > 0 ? 'มีรายจ่าย แต่ยังไม่มีรายรับเป็นฐานคำนวณ' : 'รอข้อมูลรายรับ/รายจ่าย'
  }

  return `ใช้ไป ${formatPercent((totalExpense.value / totalIncome.value) * 100)}% ของรายรับ`
})

const remainingProgressText = computed(() => {
  if (totalIncome.value <= 0) {
    return 'รอข้อมูลรายรับเพื่อคำนวณเงินคงเหลือ'
  }

  if (remainingBalance.value < 0) {
    return 'รายจ่ายเกินรายรับ'
  }

  return `คงเหลือ ${formatPercent((remainingBalance.value / totalIncome.value) * 100)}% ของรายรับ`
})

const topExpenseCategory = computed(() => {
  const categoryTotals = transactions.value
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})

  const [name, amount] = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0] || ['-', 0]

  return { name, amount }
})

const latestTransaction = computed(() => transactions.value[0] || null)

const latestTransactionTitle = computed(() => {
  if (!latestTransaction.value) {
    return 'ยังไม่มีรายการ'
  }

  const typeText = latestTransaction.value.type === 'income' ? 'รายรับ' : 'รายจ่าย'
  return `${typeText} ${formatCurrency(latestTransaction.value.amount)}`
})

const latestTransactionSubtitle = computed(() => {
  if (!latestTransaction.value) {
    return 'เพิ่มรายการแรกในแท็บรายรับรายจ่าย'
  }

  const categoryText = latestTransaction.value.category || 'ไม่ระบุหมวดหมู่'
  return `${formatDate(latestTransaction.value.entry_date)} • ${categoryText}`
})

const sortedStudySchedules = computed(() => [...studySchedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) {
    return a.day_of_week - b.day_of_week
  }

  return a.start_time.localeCompare(b.start_time)
}))

const todayWeekday = computed(() => {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
})

const totalStudyClasses = computed(() => studySchedules.value.length)

const todaysStudyClasses = computed(() => sortedStudySchedules.value
  .filter((item) => item.day_of_week === todayWeekday.value))

const todaysStudyPreview = computed(() => todaysStudyClasses.value.slice(0, 4))

const dashboardTodos = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
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
  const today = new Date().toISOString().slice(0, 10)
  if (item.due_date < today) return 'text-rose-400 font-medium'
  if (item.due_date === today) return 'text-amber-400 font-medium'
  return 'text-gray-400'
}

const dashboardEvents = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return events.value
    .filter(e => {
        const maxDate = e.end_date || e.start_date
        return maxDate >= today
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 4)
})

const displayEventDateTimeShort = (item: DashboardEventRow) => {
  const formatTimeStr = (t: string | null) => t ? t.slice(0, 5) + ' น.' : ''
  if (item.event_type === 'same_day_all_day') {
    return `${formatDate(item.start_date)} (ตลอดวัน)`
  }
  if (item.event_type === 'same_day_time') {
    return `${formatDate(item.start_date)}  ${formatTimeStr(item.start_time)} - ${formatTimeStr(item.end_time)}`
  }
  if (item.event_type === 'multi_day') {
    return `${formatDate(item.start_date)} ถึง ${formatDate(item.end_date || '')}`
  }
  return formatDate(item.start_date)
}

const nextStudyClassMeta = computed<NextStudyClassMeta>(() => {
  if (!sortedStudySchedules.value.length) {
    return null
  }

  const now = new Date()
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()

  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedStudySchedules.value
      .filter((item) => item.day_of_week === checkingDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    for (const item of classesInDay) {
      const startMinutes = toMinutes(item.start_time)

      if (offset > 0 || startMinutes >= currentMinutes) {
        return {
          item,
          dayOffset: offset,
          minutesUntil: (offset * 24 * 60) + (startMinutes - currentMinutes),
        }
      }
    }
  }

  const firstItem = sortedStudySchedules.value[0]
  return firstItem
    ? {
      item: firstItem,
      dayOffset: 7,
      minutesUntil: (7 * 24 * 60) + (toMinutes(firstItem.start_time) - currentMinutes),
    }
    : null
})

const nextStudyClass = computed(() => nextStudyClassMeta.value?.item || null)

const nextStudyClassTitle = computed(() => {
  if (!nextStudyClass.value) {
    return 'ยังไม่มีคาบเรียน'
  }

  return nextStudyClass.value.course_name
})

const nextStudyClassSubtitle = computed(() => {
  if (!nextStudyClass.value) {
    return 'เพิ่มคาบเรียนแรกของคุณในแท็บตารางเรียน'
  }

  const dayText = dayLabelMap.get(nextStudyClass.value.day_of_week) || 'ไม่ระบุวัน'
  return `${dayText} • ${formatTime(nextStudyClass.value.start_time)} - ${formatTime(nextStudyClass.value.end_time)}`
})

const nextStudyAlertText = computed(() => {
  if (!nextStudyClassMeta.value) {
    return 'ยังไม่มีคาบถัดไป'
  }

  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 0) {
    return 'เริ่มตอนนี้'
  }

  if (minutes < 60) {
    return `อีก ${minutes} นาที`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours < 24) {
    return remainMinutes > 0
      ? `อีก ${hours} ชม. ${remainMinutes} นาที`
      : `อีก ${hours} ชม.`
  }

  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0
    ? `อีก ${days} วัน ${remainHours} ชม.`
    : `อีก ${days} วัน`
})

const nextStudyAlertBadgeClass = computed(() => {
  if (!nextStudyClassMeta.value) {
    return 'border-gray-600 bg-gray-700/40 text-gray-100'
  }

  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) {
    return 'border-rose-300/60 bg-rose-500/25 text-rose-100'
  }

  if (minutes <= 120) {
    return 'border-amber-300/60 bg-amber-500/25 text-amber-100'
  }

  return 'border-sky-300/60 bg-sky-500/25 text-sky-100'
})

const nextStudyAlertBoxClass = computed(() => {
  if (!nextStudyClassMeta.value) {
    return 'border-gray-700 bg-gray-800/40'
  }

  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) {
    return 'border-rose-400/35 bg-rose-500/10'
  }

  if (minutes <= 120) {
    return 'border-amber-400/35 bg-amber-500/10'
  }

  return 'border-sky-400/35 bg-sky-500/10'
})

const normalizeTransactionRows = (rows: any[]): TransactionRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.user_id),
  entry_date: String(row.entry_date),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  amount: Number(row.amount || 0),
  created_at: String(row.created_at || ''),
}))

const normalizeStudyRows = (rows: any[]): StudyScheduleRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.user_id),
  course_name: String(row.course_name || ''),
  day_of_week: Number(row.day_of_week || 1),
  start_time: String(row.start_time || '00:00:00'),
  end_time: String(row.end_time || '00:00:00'),
  location: typeof row.location === 'string' ? row.location : null,
  created_at: String(row.created_at || ''),
}))

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      throw userError
    }

    if (!userData.user) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, entry_date, type, category, amount, created_at')
      .eq('user_id', userData.user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง transactions ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        transactions.value = []
        return
      }

      throw error
    }

    transactions.value = normalizeTransactionRows(data || [])
  } catch (error: any) {
    console.error('Load dashboard finance error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูล Dashboard ไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const loadStudySchedules = async () => {
  isScheduleLoading.value = true
  scheduleErrorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      throw userError
    }

    if (!userData.user) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('study_schedules')
      .select('id, user_id, course_name, day_of_week, start_time, end_time, location, created_at')
      .eq('user_id', userData.user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        scheduleErrorMessage.value = 'ยังไม่พบตาราง study_schedules ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        studySchedules.value = []
        return
      }

      throw error
    }

    studySchedules.value = normalizeStudyRows(data || [])
  } catch (error: any) {
    console.error('Load study schedules summary error:', error)
    scheduleErrorMessage.value = error?.message || 'โหลดข้อมูลตารางเรียนไม่สำเร็จ'
  } finally {
    isScheduleLoading.value = false
  }
}

const normalizeTodoRows = (rows: any[]): TodoRow[] => rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  due_date: row.due_date ? String(row.due_date) : null,
  status: row.status as TodoStatus,
  priority: row.priority as TodoPriority,
}))

const loadTodos = async () => {
  isTodosLoading.value = true
  todosErrorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) return

    const { data, error } = await supabase
      .from('todos')
      .select('id, title, due_date, status, priority')
      .eq('user_id', userData.user.id)

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        todosErrorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase'
        todos.value = []
        return
      }
      throw error
    }

    todos.value = normalizeTodoRows(data || [])
  } catch (error: any) {
    console.error('Load todos error:', error)
    todosErrorMessage.value = error?.message || 'โหลดข้อมูลงานไม่สำเร็จ'
  } finally {
    isTodosLoading.value = false
  }
}

const markTodoDone = async (id: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const query = supabase.from('todos') as any
    const { error } = await query
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', userData.user.id)

    if (error) throw error
    
    todos.value = todos.value.map(t => t.id === id ? { ...t, status: 'completed' } : t)
  } catch (err: any) {
    console.error('Mark done error:', err)
  }
}

const normalizeEventRows = (rows: any[]): DashboardEventRow[] => rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  event_type: row.event_type as EventTypeType,
  start_date: String(row.start_date),
  start_time: row.start_time ? String(row.start_time) : null,
  end_date: row.end_date ? String(row.end_date) : null,
  end_time: row.end_time ? String(row.end_time) : null,
}))

const loadEvents = async () => {
  isEventsLoading.value = true
  eventsErrorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) return

    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_type, start_date, start_time, end_date, end_time')
      .eq('user_id', userData.user.id)

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        eventsErrorMessage.value = 'ยังไม่พบตาราง events ใน Supabase'
        events.value = []
        return
      }
      throw error
    }

    events.value = normalizeEventRows(data || [])
  } catch (error: any) {
    console.error('Load events error:', error)
    eventsErrorMessage.value = error?.message || 'โหลดข้อมูลกิจกรรมไม่สำเร็จ'
  } finally {
    isEventsLoading.value = false
  }
}

const refreshOverview = async () => {
  await Promise.all([
    loadTransactions(),
    loadStudySchedules(),
    loadTodos(),
    loadEvents()
  ])
}

onMounted(() => {
  refreshOverview()
})
</script>
