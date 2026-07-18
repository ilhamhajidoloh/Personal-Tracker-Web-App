<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8 space-y-5">
      <!-- Page head -->
      <div class="flex flex-wrap items-end justify-between gap-4 animate-slide-up">
        <div>
          <p class="eyebrow">ภาพรวม · Dashboard</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">{{ greetingText }}, <em style="font-style: normal; color: var(--brand);">{{ userDisplayName }}</em></h1>
          <p class="num text-xs mt-2" style="color: var(--text-muted);">{{ todayText }} · อัปเดต {{ lastUpdateTime }}</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/cashflow" class="btn-primary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            บันทึกรายการ
          </NuxtLink>
          <NuxtLink to="/study-schedule" class="btn-secondary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            ตารางเรียน
          </NuxtLink>
        </div>
      </div>

      <!-- Error -->
      <Transition name="slide-down">
        <div
          v-if="errorMessage"
          class="rounded-xl p-3.5 text-sm flex items-center gap-2"
          style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--event-status-soon-ink);"
          role="alert"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/></svg>
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- Main grid: left (hero + recent) · right (allocation + schedule + todos) -->
      <section class="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-4 items-start">
        <!-- LEFT column -->
        <div class="space-y-4">
          <!-- Hero balance + chart -->
          <div class="section-card animate-slide-up overflow-hidden">
            <div class="p-5 md:p-6">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="eyebrow">เงินคงเหลือรวม</p>
                  <p class="num text-[34px] md:text-[42px] font-bold leading-none mt-2" :style="{ color: remainingBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-rose)' }">
                    <span class="text-xl md:text-2xl font-semibold mr-1" style="color: var(--text-muted);">฿</span>{{ formattedBalanceParts.sign }}{{ formattedBalanceParts.integer }}<span class="text-xl md:text-2xl font-semibold" style="color: var(--text-muted);">.{{ formattedBalanceParts.decimal }}</span>
                  </p>
                  <div class="flex items-center gap-2.5 mt-3 flex-wrap">
                    <span class="num text-[11px] px-2 py-1 rounded-md font-semibold" :style="remainingBalance >= 0 ? 'color: var(--ink-emerald); background: rgba(10,138,92,0.10);' : 'color: var(--ink-rose); background: rgba(208,39,72,0.10);'">
                      {{ remainingBalance >= 0 ? 'บวก' : 'ติดลบ' }}
                    </span>
                    <span class="text-[12.5px]" style="color: var(--text-secondary);">{{ remainingProgressText }}</span>
                  </div>
                </div>
                <div class="icon-bubble">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--brand);"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
              </div>

              <!-- Cumulative balance trend chart -->
              <div class="mt-5 -mx-1.5 relative">
                <!-- Y-Axis Labels inside the container -->
                <div v-if="!chartGeom.empty" class="absolute left-2 top-1 text-[9px] font-semibold text-gray-500 pointer-events-none select-none bg-gray-900/60 px-1.5 py-0.5 rounded border border-gray-800/40">
                  สูงสุด: {{ chartGeom.maxFormatted }}
                </div>
                <div v-if="!chartGeom.empty" class="absolute left-2 bottom-6 text-[9px] font-semibold text-gray-500 pointer-events-none select-none bg-gray-900/60 px-1.5 py-0.5 rounded border border-gray-800/40">
                  ต่ำสุด: {{ chartGeom.minFormatted }}
                </div>

                <svg v-if="!chartGeom.empty" viewBox="0 0 600 150" preserveAspectRatio="none" class="w-full" style="height: 130px; display: block;" role="img" aria-label="กราฟยอดเงินคงเหลือสะสม">
                  <defs>
                    <linearGradient id="dashBalanceArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="var(--brand)" stop-opacity="0.24" />
                      <stop offset="1" stop-color="var(--brand)" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Grid lines -->
                  <line x1="8" y1="12" x2="592" y2="12" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  <line x1="8" y1="75" x2="592" y2="75" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  <line x1="8" y1="138" x2="592" y2="138" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  
                  <path :d="chartGeom.area" fill="url(#dashBalanceArea)" />
                  <path :d="chartGeom.line" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                  
                  <!-- Latest value label on the dot -->
                  <text 
                    :x="chartGeom.dotX - 10" 
                    :y="chartGeom.dotY - 10" 
                    fill="var(--brand-ink)" 
                    font-size="11" 
                    font-weight="bold" 
                    text-anchor="end" 
                    class="num"
                    style="filter: drop-shadow(0px 1px 3px rgba(0,0,0,0.8));"
                  >
                    {{ chartGeom.lastFormatted }}
                  </text>
                  
                  <circle :cx="chartGeom.dotX" :cy="chartGeom.dotY" r="4.5" fill="var(--brand)" stroke="#ffffff" stroke-width="1.5" />
                </svg>
                
                <!-- X-Axis Date Labels -->
                <div v-if="!chartGeom.empty" class="flex justify-between px-3 mt-1.5 text-[10px] font-semibold text-gray-500 border-t border-gray-800/40 pt-1">
                  <span>{{ chartGeom.startDate }}</span>
                  <span class="text-gray-600">ระยะเวลาแสดงแนวโน้มยอดเงิน</span>
                  <span>{{ chartGeom.endDate }}</span>
                </div>
                
                <div v-else class="h-[130px] flex items-center justify-center text-xs mx-1.5 rounded-lg" style="color: var(--text-muted); background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  ยังไม่มีข้อมูลพอสำหรับแสดงกราฟ
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2" style="border-top: 1px solid var(--border-subtle);">
              <div class="p-4 md:p-5" style="border-right: 1px solid var(--border-subtle);">
                <p class="eyebrow flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--ink-emerald)" stroke-width="2.2"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>รายรับรวม</p>
                <p class="num text-xl font-bold mt-1.5" style="color: var(--ink-emerald);">{{ formatCurrency(totalIncome) }}</p>
              </div>
              <div class="p-4 md:p-5">
                <p class="eyebrow flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--ink-rose)" stroke-width="2.2"><path d="M17 7L7 17M7 17h8M7 17V9"/></svg>รายจ่ายรวม</p>
                <p class="num text-xl font-bold mt-1.5" style="color: var(--ink-rose);">{{ formatCurrency(totalExpense) }}</p>
                <p v-if="overspentAmount > 0" class="text-[11px] mt-1" style="color: var(--event-status-soon-ink);">เกิน {{ formatCurrency(overspentAmount) }}</p>
              </div>
            </div>
          </div>

          <!-- Recent transactions -->
          <div class="section-card animate-slide-up delay-100">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">รายการล่าสุด</h2>
              <NuxtLink to="/cashflow" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
            </div>
            <div v-if="isLoading" class="p-5 space-y-2">
              <div v-for="i in 3" :key="i" class="h-12 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <div v-else-if="!recentTransactions.length" class="p-8 text-center text-sm" style="color: var(--text-muted);">ยังไม่มีรายการ</div>
            <div v-else>
              <div
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="grid grid-cols-[34px_1fr_auto] items-center gap-3 px-5 py-3"
                style="border-bottom: 1px solid var(--border-subtle);"
              >
                <span class="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <svg v-if="tx.type === 'income'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--ink-emerald)" stroke-width="2"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--ink-rose)" stroke-width="2"><path d="M17 7L7 17M7 17h8M7 17V9"/></svg>
                </span>
                <div class="min-w-0">
                  <p class="text-[13.5px] font-medium truncate" style="color: var(--text-primary);">{{ tx.category || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย') }}</p>
                  <p class="num text-[10.5px] mt-0.5 truncate" style="color: var(--text-muted);">{{ tx.type === 'income' ? 'รายรับ' : 'รายจ่าย' }} · {{ formatDate(tx.entry_date) }}</p>
                </div>
                <span class="num text-[14px] font-semibold text-right" :style="{ color: tx.type === 'income' ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">{{ tx.type === 'income' ? '+' : '−' }}{{ formatCurrency(tx.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT column -->
        <div class="space-y-4">
          <!-- Expense allocation -->
          <div class="section-card animate-slide-up delay-100">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">สัดส่วนรายจ่ายสูงสุด</h2>
              <NuxtLink to="/cashflow" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
            </div>
            <div class="p-5">
              <div v-if="!topExpenseCategories.length" class="text-sm py-6 text-center" style="color: var(--text-muted);">ยังไม่มีข้อมูลรายจ่าย</div>
              <div v-else class="space-y-4">
                <div class="flex h-3 rounded-md overflow-hidden gap-0.5" style="background: var(--bg-elevated-2);">
                  <i v-for="(cat, i) in topExpenseCategories" :key="cat.name" class="block h-full" :style="{ width: (totalExpense > 0 ? (cat.amount / totalExpense * 100) : 0) + '%', background: ['var(--brand)','var(--brand-2)','var(--ink-cyan)'][i] }"></i>
                </div>
                <div class="space-y-2.5">
                  <div v-for="(cat, i) in topExpenseCategories" :key="cat.name" class="flex items-center gap-2.5">
                    <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: ['var(--brand)','var(--brand-2)','var(--ink-cyan)'][i] }"></span>
                    <span class="flex-1 text-[13px] truncate" style="color: var(--text-secondary);">{{ cat.name }}</span>
                    <span class="num text-[13px] font-semibold" style="color: var(--text-primary);">{{ formatCurrency(cat.amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's schedule -->
          <div class="section-card animate-slide-up delay-200">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">ตารางวันนี้ · {{ todaysStudyClasses.length }} คาบ</h2>
              <NuxtLink to="/study-schedule" class="eyebrow" style="color: var(--brand);">ทั้งสัปดาห์ →</NuxtLink>
            </div>
            <div v-if="isScheduleLoading" class="p-5 space-y-2">
              <div v-for="i in 2" :key="i" class="h-12 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <template v-else>
              <div v-if="todaysStudyClasses.length" >
                <div
                  v-for="(item, i) in todaysStudyClasses"
                  :key="item.id"
                  class="grid grid-cols-[58px_1fr] gap-3.5 px-5 py-3"
                  style="border-bottom: 1px solid var(--border-subtle);"
                >
                  <div class="num text-[11px] pt-0.5" style="color: var(--text-muted);">
                    {{ formatTime(item.start_time) }}<span class="block font-semibold" style="color: var(--text-primary);">{{ formatTime(item.end_time) }}</span>
                  </div>
                  <div class="pl-3.5" :style="{ borderLeft: '3px solid ' + courseTint(item.course_name) }">
                    <strong class="text-[13.5px] font-semibold" style="color: var(--text-primary);">{{ item.course_name }}</strong>
                    <span v-if="item.location" class="num block text-[11px] mt-0.5" style="color: var(--text-muted);">{{ item.location }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="p-6 text-center text-sm" style="color: var(--text-muted);">
                วันนี้ไม่มีคาบเรียน
                <p class="num text-[11px] mt-1">คาบถัดไป · {{ nextStudyClassSubtitle }}</p>
              </div>
            </template>
          </div>

          <!-- Todos -->
          <div class="section-card animate-slide-up delay-300">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">งานที่ต้องทำ</h2>
              <NuxtLink to="/todos" class="eyebrow" style="color: var(--brand);">จัดการ →</NuxtLink>
            </div>
            <div v-if="isTodosLoading" class="p-5 space-y-2">
              <div v-for="i in 3" :key="i" class="h-11 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <div v-else-if="!dashboardTodos.length" class="p-8 text-center">
              <p class="text-sm font-medium" style="color: var(--ink-emerald);">ไม่มีงานด่วนหรืองานค้างในวันนี้</p>
              <p class="text-xs mt-1" style="color: var(--text-muted);">ทำได้ดีมาก ทุกงานอยู่ในสถานะดี</p>
            </div>
            <div v-else>
              <div
                v-for="todo in dashboardTodos"
                :key="todo.id"
                class="grid grid-cols-[20px_1fr_auto] items-center gap-3 px-5 py-3"
                style="border-bottom: 1px solid var(--border-subtle);"
              >
                <button
                  @click="markTodoDone(todo.id)"
                  class="w-[19px] h-[19px] rounded-md shrink-0 tap-scale transition-colors"
                  style="border: 1.5px solid var(--border-strong);"
                  aria-label="ทำเครื่องหมายว่าเสร็จ"
                ></button>
                <div class="min-w-0">
                  <p class="text-[13.5px] font-medium truncate" style="color: var(--text-primary);">{{ todo.title }}</p>
                  <p class="num text-[10.5px] mt-0.5" :class="getTodoDateColor(todo)">
                    <span v-if="todo.due_date">{{ formatDate(todo.due_date) }}</span>
                    <span v-else style="color: var(--text-muted);">ไม่มีกำหนด</span>
                  </p>
                </div>
                <span
                  v-if="todo.priority === 'high'"
                  class="text-[10px] px-2 py-1 rounded-md font-semibold uppercase tracking-wide shrink-0"
                  style="color: var(--ink-rose); background: rgba(208,39,72,0.10);"
                >ด่วน</span>
                <span
                  v-else-if="todo.status === 'in_progress'"
                  class="text-[10px] px-2 py-1 rounded-md font-semibold uppercase tracking-wide shrink-0"
                  style="color: var(--brand-ink); background: var(--brand-soft);"
                >กำลังทำ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Events Section -->
      <section class="section-card animate-slide-up delay-400">
        <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
          <div>
            <h2 class="text-sm font-semibold" style="color: var(--text-primary);">กิจกรรมและนัดหมาย</h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">เหตุการณ์สำคัญที่กำลังจะมาถึง</p>
          </div>
          <NuxtLink to="/events" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
        </div>

        <div class="p-5">
          <div v-if="eventsErrorMessage" class="rounded-lg px-3 py-2 text-xs mb-3" style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--event-status-soon-ink);">
            {{ eventsErrorMessage }}
          </div>

          <div v-if="isEventsLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="h-24 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
          </div>

          <div v-else-if="!dashboardEvents.length" class="flex flex-col items-center justify-center py-8 text-center">
            <p class="text-sm font-medium" style="color: var(--text-secondary);">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
            <NuxtLink to="/events" class="mt-2 text-xs" style="color: var(--brand);">+ เพิ่มกิจกรรม</NuxtLink>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="event in dashboardEvents"
              :key="event.id"
              class="rounded-[10px] p-4 pl-[18px] relative overflow-hidden tap-scale"
              style="background: var(--bg-card); border: 1px solid var(--border-subtle);"
            >
              <span class="absolute left-0 top-0 bottom-0 w-1" :style="{ background: 'var(' + getDashboardEventStatusTokenPrefix(event) + '-ink)' }"></span>
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wide" :style="getDashboardEventStatusBadgeStyle(event)">{{ getDashboardEventStatusText(event) }}</span>
                <div class="text-right shrink-0">
                  <span class="num text-[10px] font-bold uppercase" :style="getDashboardEventStatusTextStyle(event)">{{ getMonthShort(event.start_date) }}</span>
                  <span class="num block text-lg font-bold leading-none" style="color: var(--text-primary);">{{ getDay(event.start_date) }}</span>
                </div>
              </div>
              <p class="text-sm font-semibold mt-2.5 line-clamp-1" style="color: var(--text-primary);">{{ event.title }}</p>
              <p class="num text-[11px] mt-1" style="color: var(--text-muted);">{{ displayEventDateTimeShort(event) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getTodayTH, nowTH } from '~/utils/date'

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
  isCurrent: boolean
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
const user = useSupabaseUser()

const userDisplayName = computed(() => {
  const metadata = (user.value?.user_metadata || {}) as Record<string, unknown>
  const fullName = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : ''
  return fullName.trim() || user.value?.email?.split('@')[0] || 'MyLife User'
})

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
const todos = ref<TodoRow[]>([])
const events = ref<DashboardEventRow[]>([])
const currentTime = ref(nowTH())

const isLoading = ref(true)
const isScheduleLoading = ref(true)
const isTodosLoading = ref(true)
const isEventsLoading = ref(true)
const errorMessage = ref('')
const scheduleErrorMessage = ref('')
const todosErrorMessage = ref('')
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

const topExpenseCategories = computed(() => {
  const categoryTotals = transactions.value
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})
  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }))
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

// Cumulative balance series (chronological) used for the dashboard trend chart
const balanceSeries = computed<number[]>(() => {
  const sorted = [...transactions.value].sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date)
    return (a.created_at || '').localeCompare(b.created_at || '')
  })
  let running = 0
  const points: number[] = []
  for (const item of sorted) {
    running += item.type === 'income' ? item.amount : -item.amount
    points.push(running)
  }
  return points
})

const chartGeom = computed(() => {
  const w = 600
  const h = 150
  const pad = 12
  let points = balanceSeries.value
  if (points.length === 1) points = [0, points[0]!]
  if (points.length < 2) return { line: '', area: '', dotX: 0, dotY: 0, empty: true, min: 0, max: 0, minFormatted: '฿0.00', maxFormatted: '฿0.00', lastFormatted: '฿0.00', startDate: '', endDate: '' }
  
  const sorted = [...transactions.value].sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date)
    return (a.created_at || '').localeCompare(b.created_at || '')
  })
  
  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  }
  
  const startDate = formatDateShort(sorted[0]?.entry_date)
  const endDate = formatDateShort(sorted[sorted.length - 1]?.entry_date)

  if (points.length > 48) {
    const step = points.length / 48
    const sampled: number[] = []
    for (let i = 0; i < 48; i += 1) sampled.push(points[Math.floor(i * step)]!)
    sampled.push(points[points.length - 1]!)
    points = sampled
  }
  
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = (max - min) || 1
  
  const xAt = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1)
  const yAt = (v: number) => pad + (h - pad * 2) * (1 - (v - min) / span)
  const coords = points.map((v, i) => [xAt(i), yAt(v)] as [number, number])
  const line = coords.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `M${coords[0]![0].toFixed(1)} ${h - pad} ${coords.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${coords[coords.length - 1]![0].toFixed(1)} ${h - pad} Z`
  const last = coords[coords.length - 1]!
  
  const lastValue = points[points.length - 1] || 0
  
  return { 
    line, 
    area, 
    dotX: last[0], 
    dotY: last[1], 
    empty: false, 
    min, 
    max, 
    minFormatted: formatCurrency(min), 
    maxFormatted: formatCurrency(max), 
    lastFormatted: formatCurrency(lastValue),
    startDate,
    endDate
  }
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

const dashboardEvents = computed(() => {
  const today = getTodayTH()
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

  if (minutesUntilStart <= 0) {
    return { status: 'soon', text: 'กำลังจะถึง' }
  }

  if (minutesUntilStart <= dashboardSoonThresholdMinutes) {
    return { status: 'soon', text: `กำลังจะถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
  }

  return { status: 'future', text: `ยังไม่ถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
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
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, entry_date, type, category, amount, created_at')
      .eq('user_id', userData.user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง transactions ใน Supabase'; transactions.value = []; return }
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
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase
      .from('study_schedules')
      .select('id, user_id, course_name, day_of_week, start_time, end_time, location, created_at')
      .eq('user_id', userData.user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { scheduleErrorMessage.value = 'ยังไม่พบตาราง study_schedules ใน Supabase'; studySchedules.value = []; return }
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
      if (tableMissingCodes.has(error.code || '')) { todosErrorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase'; todos.value = []; return }
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
    const { error } = await query.update({ status: 'completed' }).eq('id', id).eq('user_id', userData.user.id)
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
      if (tableMissingCodes.has(error.code || '')) { eventsErrorMessage.value = 'ยังไม่พบตาราง events ใน Supabase'; events.value = []; return }
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
  await Promise.all([loadTransactions(), loadStudySchedules(), loadTodos(), loadEvents()])
  lastUpdateTime.value = nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshOverview()
  clockTimer = setInterval(() => {
    currentTime.value = nowTH()
  }, 60_000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
