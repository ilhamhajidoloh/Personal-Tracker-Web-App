<template>
  <AppTabsLayout>
    <!-- Page Header -->
    <header class="px-5 md:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 glass-header">
      <div class="animate-slide-up flex items-center gap-3.5">
        <div class="hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center text-2xl shrink-0 glow-violet" style="background: linear-gradient(135deg, var(--brand), var(--brand-2));">👋</div>
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight" style="color: var(--text-primary);">{{ greetingText }} <span class="text-gradient">MyLife</span></h1>
          <p class="text-sm mt-0.5" style="color: var(--text-muted);">{{ todayText }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 animate-slide-up delay-100">
        <NuxtLink
          to="/cashflow"
          class="btn-primary text-sm flex items-center gap-1.5"
        >
          💸 รายรับรายจ่าย
        </NuxtLink>
        <NuxtLink
          to="/study-schedule"
          class="btn-secondary text-sm font-medium"
        >
          📅 ตารางเรียน
        </NuxtLink>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5">
      <!-- Error -->
      <Transition name="slide-down">
        <div
          v-if="errorMessage"
          class="rounded-xl p-3.5 text-amber-200 text-sm flex items-center gap-2"
          style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15);"
        >
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- Stats Cards Row -->
      <section class="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <!-- Balance -->
        <div class="stat-card col-span-2 sm:col-span-1 animate-slide-up">
          <div class="flex items-start justify-between gap-2 mb-3 relative z-10">
            <div class="icon-bubble" :style="'background: rgba(14,165,233,0.12);'">💰</div>
            <span class="text-[10px] px-2.5 py-1 rounded-full font-semibold" :class="remainingBalance >= 0 ? 'text-sky-400' : 'text-amber-400'" :style="remainingBalance >= 0 ? 'background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.2);' : 'background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);'">
              {{ remainingBalance >= 0 ? 'บวก' : 'ติดลบ' }}
            </span>
          </div>
          <p class="text-xs font-medium relative z-10" style="color: var(--text-muted);">เงินคงเหลือรวม</p>
          <p class="text-2xl font-bold mt-1 relative z-10" :class="remainingBalance >= 0 ? 'text-sky-300' : 'text-amber-300'">
            {{ formatCurrency(remainingBalance) }}
          </p>
          <div class="mt-3 relative z-10">
            <div class="progress-bar">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="remainingBalance >= 0 ? 'bg-gradient-to-r from-sky-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'"
                :style="{ width: `${remainingProgressPercent}%` }"
              ></div>
            </div>
            <p class="text-[11px] mt-1.5" style="color: var(--text-muted);">{{ remainingProgressText }}</p>
          </div>
        </div>

        <!-- Income -->
        <div class="stat-card animate-slide-up delay-100">
          <div class="icon-bubble mb-3" style="background: rgba(16,185,129,0.12);">📈</div>
          <p class="text-xs font-medium relative z-10" style="color: var(--text-muted);">รายรับรวม</p>
          <p class="text-2xl font-bold text-emerald-400 mt-1 relative z-10">{{ formatCurrency(totalIncome) }}</p>
        </div>

        <!-- Expense -->
        <div class="stat-card animate-slide-up delay-200">
          <div class="icon-bubble mb-3" style="background: rgba(244,63,94,0.12);">📉</div>
          <p class="text-xs font-medium relative z-10" style="color: var(--text-muted);">รายจ่ายรวม</p>
          <p class="text-2xl font-bold text-rose-400 mt-1 relative z-10">{{ formatCurrency(totalExpense) }}</p>
          <div class="mt-3 relative z-10">
            <div class="progress-bar">
              <div
                class="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-700"
                :style="{ width: `${expenseProgressPercent}%` }"
              ></div>
            </div>
            <p class="text-[11px] mt-1.5" style="color: var(--text-muted);">
              {{ expenseProgressText }}
              <span v-if="overspentAmount > 0" class="text-amber-400">  (เกิน {{ formatCurrency(overspentAmount) }})</span>
            </p>
          </div>
        </div>

        <!-- Top Category -->
        <div class="stat-card animate-slide-up delay-300">
          <div class="icon-bubble mb-3" style="background: rgba(245,158,11,0.12);">🏷️</div>
          <p class="text-xs font-medium relative z-10" style="color: var(--text-muted);">หมวดรายจ่ายสูงสุด</p>
          <p class="text-lg font-bold text-white mt-1 truncate relative z-10">{{ topExpenseCategory.name }}</p>
          <p class="text-sm mt-0.5 relative z-10" style="color: var(--text-muted);">{{ formatCurrency(topExpenseCategory.amount) }}</p>
        </div>
      </section>

      <!-- Finance + Schedule Row -->
      <section class="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <!-- Finance Summary -->
        <div class="xl:col-span-3 section-card animate-slide-up delay-200">
          <div class="flex items-start justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
            <div>
              <h2 class="text-base font-semibold text-white">สรุปการเงิน</h2>
              <p class="text-xs mt-0.5" style="color: var(--text-muted);">ข้อมูลสำคัญแบบย่อ</p>
            </div>
            <button
              @click="refreshOverview"
              :disabled="isLoading"
              class="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              style="padding: 0.375rem 0.75rem;"
            >
              {{ isLoading ? 'กำลังโหลด...' : '↻ รีเฟรช' }}
            </button>
          </div>

          <div class="p-5">
            <div v-if="isLoading" class="space-y-2">
              <div class="h-16 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
              <div class="h-16 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>

            <div v-else class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl p-3.5" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[11px]" style="color: var(--text-muted);">รายการทั้งหมด</p>
                  <p class="text-xl font-bold text-white mt-1">{{ totalTransactions }}</p>
                  <p class="text-[11px]" style="color: var(--text-muted);">รายการ</p>
                </div>
                <div class="rounded-xl p-3.5" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[11px]" style="color: var(--text-muted);">รายการล่าสุด</p>
                  <p class="text-sm font-semibold text-white mt-1 truncate">{{ latestTransactionTitle }}</p>
                  <p class="text-[11px] mt-0.5 truncate" style="color: var(--text-muted);">{{ latestTransactionSubtitle }}</p>
                </div>
              </div>
              <div class="rounded-xl p-3.5" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                <div class="flex items-center gap-1.5 mb-2.5">
                  <span class="text-base">🔺</span>
                  <p class="text-[11px] font-semibold uppercase tracking-wide" style="color: var(--text-secondary);">3 อันดับรายจ่ายสูงสุด</p>
                </div>
                <div v-if="!topExpenseCategories.length" class="text-xs" style="color: var(--text-muted);">ยังไม่มีข้อมูลรายจ่าย</div>
                <div v-else class="space-y-2">
                  <div v-for="(cat, i) in topExpenseCategories" :key="cat.name" class="flex items-center gap-2.5">
                    <span
                      class="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                      :class="i === 0 ? 'text-rose-300' : i === 1 ? 'text-orange-300' : 'text-amber-300'"
                      :style="i === 0 ? 'background: rgba(244,63,94,0.15);' : i === 1 ? 'background: rgba(249,115,22,0.15);' : 'background: rgba(245,158,11,0.15);'"
                    >{{ i + 1 }}</span>
                    <span class="flex-1 text-xs text-white truncate">{{ cat.name }}</span>
                    <span class="text-xs font-semibold text-rose-400 shrink-0">{{ formatCurrency(cat.amount) }}</span>
                  </div>
                </div>
              </div>
              <NuxtLink
                to="/cashflow"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style="background: var(--brand-soft); border: 1px solid var(--brand-border); color: var(--brand-ink);"
                @mouseenter="$el.style.background = 'var(--brand-soft-hover)'"
                @mouseleave="$el.style.background = 'var(--brand-soft)'"
              >
                ดูรายละเอียดทั้งหมด →
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Study Schedule Summary -->
        <div class="xl:col-span-2 section-card animate-slide-up delay-300">
          <div class="flex items-start justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
            <div>
              <h2 class="text-base font-semibold text-white">ตารางเรียน</h2>
              <p class="text-xs mt-0.5" style="color: var(--text-muted);">วันนี้และคาบถัดไป</p>
            </div>
            <button
              @click="loadStudySchedules"
              :disabled="isScheduleLoading"
              class="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              style="padding: 0.375rem 0.75rem;"
            >
              {{ isScheduleLoading ? 'กำลังโหลด...' : '↻ รีเฟรช' }}
            </button>
          </div>

          <div class="p-5">
            <div v-if="scheduleErrorMessage" class="rounded-xl px-3 py-2 text-amber-200 text-xs mb-3" style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15);">
              {{ scheduleErrorMessage }}
            </div>

            <div v-if="isScheduleLoading" class="space-y-2">
              <div class="h-12 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
              <div class="h-12 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>

            <div v-else class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl p-3.5" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[11px]" style="color: var(--text-muted);">วันนี้</p>
                  <p class="text-xl font-bold text-sky-300 mt-1">{{ todaysStudyClasses.length }}</p>
                  <p class="text-[11px]" style="color: var(--text-muted);">คาบ</p>
                </div>
                <div class="rounded-xl p-3.5" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[11px]" style="color: var(--text-muted);">ทั้งสัปดาห์</p>
                  <p class="text-xl font-bold text-white mt-1">{{ totalStudyClasses }}</p>
                  <p class="text-[11px]" style="color: var(--text-muted);">คาบ</p>
                </div>
              </div>

              <!-- Next class card -->
              <div class="rounded-xl px-3.5 py-3.5" :class="nextStudyAlertBoxClass" style="border-width: 1px;">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-[11px]" style="color: var(--text-secondary);">คาบถัดไป</p>
                    <p class="text-sm font-semibold text-white mt-0.5 truncate">{{ nextStudyClassTitle }}</p>
                    <p class="text-[11px] mt-0.5" style="color: var(--text-secondary);">{{ nextStudyClassSubtitle }}</p>
                  </div>
                  <span
                    class="text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0"
                    :class="nextStudyAlertBadgeClass"
                  >
                    {{ nextStudyAlertText }}
                  </span>
                </div>
              </div>

              <!-- Today's subjects -->
              <div v-if="todaysStudyPreview.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="item in todaysStudyPreview"
                  :key="item.id"
                  class="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  :class="getCourseChipClass(item.course_name)"
                >
                  {{ formatTime(item.start_time) }} · {{ item.course_name }}
                </span>
                <span
                  v-if="todaysStudyClasses.length > todaysStudyPreview.length"
                  class="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style="border: 1px solid var(--border-default); color: var(--text-secondary);"
                >
                  +{{ todaysStudyClasses.length - todaysStudyPreview.length }} วิชา
                </span>
              </div>
              <p v-else class="text-xs" style="color: var(--text-muted);">วันนี้ไม่มีคาบเรียน</p>

              <NuxtLink
                to="/study-schedule"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
                @mouseenter="$el.style.borderColor = 'var(--border-strong)'; $el.style.color = 'var(--text-primary)'"
                @mouseleave="$el.style.borderColor = 'var(--border-default)'; $el.style.color = 'var(--text-secondary)'"
              >
                จัดการตารางเรียน →
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Todos Section -->
      <section class="section-card animate-slide-up delay-300">
        <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
          <div>
            <h2 class="text-base font-semibold text-white">งานและ To-do</h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">งานด่วนและงานค้างส่ง</p>
          </div>
          <NuxtLink
            to="/todos"
            class="btn-secondary text-xs"
            style="padding: 0.375rem 0.75rem;"
          >
            ดูทั้งหมด →
          </NuxtLink>
        </div>

        <div class="p-5">
          <div v-if="todosErrorMessage" class="rounded-xl px-3 py-2 text-amber-200 text-xs mb-3" style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15);">
            {{ todosErrorMessage }}
          </div>

          <div v-if="isTodosLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="i in 3" :key="i" class="h-24 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
          </div>

          <div v-else-if="!todos.length" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: var(--bg-elevated);">✅</div>
            <p class="text-sm font-medium" style="color: var(--text-secondary);">ยังไม่มีงานใดๆ</p>
            <NuxtLink to="/todos" class="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">+ เพิ่มงานแรก</NuxtLink>
          </div>

          <div v-else-if="dashboardTodos.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: rgba(16,185,129,0.1);">🎉</div>
            <p class="text-sm font-medium text-emerald-400">ไม่มีงานด่วนหรืองานค้างในวันนี้!</p>
            <p class="text-xs mt-1" style="color: var(--text-muted);">ทำได้ดีมาก ทุกงานอยู่ในสถานะดี</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="todo in dashboardTodos"
              :key="todo.id"
              class="glass-card rounded-xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div class="flex items-start gap-2 mb-1.5">
                  <p class="text-sm font-medium text-white line-clamp-2 flex-1">{{ todo.title }}</p>
                  <span
                    v-if="todo.priority === 'high'"
                    class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold text-rose-300"
                    style="background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.2);"
                  >ด่วน</span>
                </div>
                <p class="text-[11px] font-medium flex items-center gap-1" :class="getTodoDateColor(todo)">
                  <span v-if="todo.due_date">📅 {{ formatDate(todo.due_date) }}</span>
                  <span v-else style="color: var(--text-muted);">ไม่มีกำหนด</span>
                </p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] px-2 py-1 rounded-full border font-medium"
                  :class="todo.status === 'in_progress' ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : ''"
                  :style="todo.status !== 'in_progress' ? 'border-color: var(--border-default); background: var(--bg-elevated); color: var(--text-secondary);' : ''"
                >
                  {{ todo.status === 'in_progress' ? 'กำลังทำ' : 'รอทำ' }}
                </span>
                <button
                  @click="markTodoDone(todo.id)"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-medium"
                >
                  ✓ เสร็จแล้ว
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Events Section -->
      <section class="section-card animate-slide-up delay-400">
        <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
          <div>
            <h2 class="text-base font-semibold text-white">กิจกรรมและนัดหมาย</h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">เหตุการณ์สำคัญที่กำลังจะมาถึง</p>
          </div>
          <NuxtLink
            to="/events"
            class="btn-secondary text-xs"
            style="padding: 0.375rem 0.75rem;"
          >
            ดูทั้งหมด →
          </NuxtLink>
        </div>

        <div class="p-5">
          <div v-if="eventsErrorMessage" class="rounded-xl px-3 py-2 text-amber-200 text-xs mb-3" style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15);">
            {{ eventsErrorMessage }}
          </div>

          <div v-if="isEventsLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="h-20 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
          </div>

          <div v-else-if="!dashboardEvents.length && !nextEventMeta" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: var(--bg-elevated);">📆</div>
            <p class="text-sm font-medium" style="color: var(--text-secondary);">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
            <NuxtLink to="/events" class="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">+ เพิ่มกิจกรรม</NuxtLink>
          </div>

          <div v-else class="space-y-4">
            <!-- Next event card -->
            <div v-if="nextEventMeta" class="rounded-xl px-4 py-3.5" :class="nextEventAlertBoxClass" style="border-width: 1px;">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[11px]" style="color: var(--text-secondary);">กิจกรรมถัดไป</p>
                  <p class="text-sm font-semibold text-white mt-0.5 truncate">{{ nextEventTitle }}</p>
                  <p class="text-[11px] mt-0.5" style="color: var(--text-secondary);">{{ nextEventSubtitle }}</p>
                </div>
                <span
                  class="text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0"
                  :class="nextEventAlertBadgeClass"
                >
                  {{ nextEventAlertText }}
                </span>
              </div>
            </div>

            <div v-if="filteredDashboardEvents.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="event in filteredDashboardEvents"
                :key="event.id"
                class="glass-card rounded-xl px-4 py-3.5 flex items-center gap-4"
              >
                <!-- Date badge -->
                <div
                  class="shrink-0 text-center rounded-xl px-3 py-2.5 min-w-[52px] border"
                  :style="getDashboardEventDateBadgeStyle(event)"
                >
                  <div class="text-[10px] font-bold uppercase leading-none" :style="getDashboardEventStatusTextStyle(event)">{{ getMonthShort(event.start_date) }}</div>
                  <div class="text-2xl font-bold leading-tight mt-0.5" style="color: var(--text-primary);">{{ getDay(event.start_date) }}</div>
                </div>
                <!-- Event info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 min-w-0">
                    <p class="text-sm font-semibold line-clamp-1 min-w-0" style="color: var(--text-primary);">{{ event.title }}</p>
                    <span
                      class="shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap"
                      :style="getDashboardEventStatusBadgeStyle(event)"
                    >
                      {{ getDashboardEventStatusText(event) }}
                    </span>
                  </div>
                  <p class="text-[11px] mt-0.5 font-medium" :style="getDashboardEventStatusTextStyle(event)">{{ displayEventDateTimeShort(event) }}</p>
                </div>
              </div>
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
