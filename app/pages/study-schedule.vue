<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
      <!-- Page head -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="eyebrow text-gray-500 uppercase tracking-widest text-[11px]">ตารางเรียน · TIMETABLE</p>
          <h1 class="text-4xl md:text-5xl font-normal mt-1.5 font-itim text-white">ตารางเรียน</h1>
          <p class="text-xs mt-2 text-gray-400 font-medium">ภาคเรียนที่ 1 / 2569 &bull; {{ uniqueSubjectsCount }} รายวิชา</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="openCreateScheduleModal"
            class="btn-primary text-sm inline-flex items-center gap-2 tap-scale touch-target"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่มคาบเรียน
          </button>
          <button
            @click="loadSchedules"
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

        <!-- Schedule Grid Table -->
        <section class="section-card">
          <!-- Empty State -->
          <div v-if="!schedules.length" class="flex flex-col items-center justify-center py-14 text-center px-5">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            </div>
            <p class="text-sm font-medium" style="color: var(--text-secondary);">ยังไม่มีคาบเรียน</p>
          </div>

          <!-- Timeline Grid -->
          <div v-else class="overflow-x-auto">
            <div class="min-w-[850px] w-full flex flex-col" style="background: var(--bg-card);">
              
              <!-- Grid Header Row -->
              <div 
                class="grid border-b" 
                :style="{ 
                  gridTemplateColumns: `80px repeat(${gridDays.length}, 1fr)`,
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--bg-elevated)'
                }"
              >
                <div class="py-3 px-3 text-center text-xs font-semibold select-none border-r" style="border-color: var(--border-subtle); color: var(--text-secondary);">เวลา</div>
                <div 
                  v-for="day in gridDays" 
                  :key="day.value" 
                  class="py-3 px-3 text-center text-xs font-semibold select-none border-r last:border-r-0"
                  :style="{ 
                    color: day.value === todayWeekday ? 'var(--brand-ink)' : 'var(--text-secondary)',
                    borderColor: 'var(--border-subtle)'
                  }"
                >
                  {{ day.value === 4 ? 'พฤหัส' : day.label }}
                </div>
              </div>

              <!-- Grid Body Container -->
              <div class="relative w-full" :style="{ height: `${totalHours * hourHeight}px` }">
                <div class="grid h-full" :style="{ gridTemplateColumns: `80px repeat(${gridDays.length}, 1fr)` }">
                  
                  <!-- Time Column -->
                  <div class="relative h-full border-r" style="border-color: var(--border-subtle);">
                    <div 
                      v-for="(hour, idx) in timelineHours" 
                      :key="hour" 
                      class="absolute left-0 right-0 num text-right pr-4 text-[11px] select-none flex items-center justify-end border-b"
                      :style="{ 
                        top: `${idx * hourHeight}px`, 
                        height: `${hourHeight}px`,
                        borderColor: 'var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-muted)'
                      }"
                    >
                      {{ formatHour(hour) }}
                    </div>
                  </div>

                  <!-- Day Columns -->
                  <div 
                    v-for="day in gridDays" 
                    :key="day.value" 
                    class="relative h-full border-r last:border-r-0" 
                    :style="{ 
                      borderColor: 'var(--border-subtle)',
                      background: day.value === todayWeekday ? 'var(--brand-soft)' : 'transparent'
                    }"
                  >
                    <!-- Background slots -->
                    <div 
                      v-for="idx in totalHours" 
                      :key="idx" 
                      class="absolute left-0 right-0 border-b"
                      :style="{ 
                        top: `${(idx - 1) * hourHeight}px`, 
                        height: `${hourHeight}px`,
                        borderColor: 'var(--border-subtle)'
                      }"
                    ></div>

                    <!-- Absolute Course Cards -->
                    <div
                      v-for="item in getPositionedSchedulesForDay(day.value)"
                      :key="item.id"
                      class="absolute transition-all duration-200 group cursor-pointer hover:z-20 p-[3px]"
                      :style="{
                        top: `${item.top}%`,
                        height: `${item.height}%`,
                        left: `${item.left}%`,
                        width: `${item.width}%`,
                      }"
                      @click="openEditScheduleModal(item)"
                    >
                      <div 
                        class="course-card-inner w-full h-full rounded-xl p-3 flex flex-col justify-between border select-none transition-all duration-200"
                        :style="{
                          background: 'color-mix(in srgb, ' + courseTint(item.course_name) + ' 10%, transparent)',
                          borderColor: 'color-mix(in srgb, ' + courseTint(item.course_name) + ' 25%, transparent)',
                          '--hover-bg': 'color-mix(in srgb, ' + courseTint(item.course_name) + ' 16%, transparent)',
                          '--hover-border': 'color-mix(in srgb, ' + courseTint(item.course_name) + ' 45%, transparent)',
                        }"
                      >
                        <div>
                          <p class="text-[12.5px] font-bold leading-tight" :style="{ color: courseInk(item.course_name) }">
                            {{ item.course_name }}
                          </p>
                          <p v-if="item.location" class="num text-[10px] mt-1.5 font-semibold" :style="{ color: courseInk(item.course_name), opacity: 0.8 }">
                            {{ item.location }}
                          </p>
                        </div>
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 num text-[9px] font-semibold self-end" :style="{ color: courseInk(item.course_name), opacity: 0.6 }">
                          {{ formatTimeRange(item.start_time, item.end_time) }}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- All Schedules Table -->
        <section class="section-card">
          <div class="flex flex-col gap-3 px-5 py-4 border-b border-gray-800/60">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-white">รายการคาบเรียนทั้งหมด</h2>
              <span class="text-xs px-2.5 py-1 rounded-full" style="background: var(--bg-elevated); color: var(--text-secondary);">{{ schedulePageInfo }}</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <select
                v-model.number="scheduleItemsPerPage"
                @change="scheduleCurrentPage = 1"
                class="text-sm px-3 py-2 rounded-xl ml-auto focus:outline-none transition-all"
                style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-primary);"
              >
                <option value="10">10 รายการ/หน้า</option>
                <option value="20">20 รายการ/หน้า</option>
                <option value="50">50 รายการ/หน้า</option>
              </select>
            </div>
          </div>

          <div v-if="!schedules.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
            <div class="w-14 h-14 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-3">📚</div>
            <p class="text-sm font-medium text-gray-400">ยังไม่มีคาบเรียน</p>
            <button               @click="openCreateScheduleModal" class="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-sm font-medium text-violet-300 transition-all tap-scale touch-target">
              + เพิ่มคาบแรก
            </button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-gray-800/60 bg-gray-800/20">
                  <th class="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">วัน</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">วิชา</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">เวลา</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">สถานที่</th>
                  <th class="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/40">
                <tr
                  v-for="item in paginatedSchedules"
                  :key="item.id"
                  class="hover:bg-gray-800/20 transition-all"
                  :class="editingScheduleId === item.id ? 'bg-violet-500/5' : ''"
                >
                  <td class="py-3 px-5">
                    <span
                      class="text-xs font-semibold px-2.5 py-1 rounded-full border"
                      :class="item.day_of_week === todayWeekday
                        ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                        : 'border-gray-700 bg-gray-800/60 text-gray-400'"
                    >{{ getDayLabel(item.day_of_week) }}</span>
                  </td>
                  <td class="py-3 px-3 font-medium text-white">{{ item.course_name }}</td>
                  <td class="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">{{ formatTimeRange(item.start_time, item.end_time) }}</td>
                  <td class="py-3 px-3 text-gray-500 text-xs hidden sm:table-cell">{{ item.location || '—' }}</td>
                  <td class="py-3 px-5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        @click="openEditScheduleModal(item)"
                        :disabled="isDeletingId === item.id"
                        class="px-3 py-1.5 rounded-lg text-xs bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/20 disabled:opacity-50 transition-all font-medium tap-scale touch-target"
                      >แก้ไข</button>
                      <button
                        @click="deleteSchedule(item.id)"
                        :disabled="isDeletingId === item.id"
                        class="px-3 py-1.5 rounded-lg text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 disabled:opacity-50 transition-all font-medium tap-scale touch-target"
                      >{{ isDeletingId === item.id ? 'ลบ...' : 'ลบ' }}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div v-if="scheduleTotalPages > 1" class="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-800/60">
            <button
              @click="scheduleCurrentPage = Math.max(1, scheduleCurrentPage - 1)"
              :disabled="scheduleCurrentPage === 1"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
              :style="scheduleCurrentPage === 1 ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
            >
              ← ก่อนหน้า
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="page in scheduleTotalPages"
                :key="page"
                @click="scheduleCurrentPage = page"
                class="w-9 h-9 rounded-lg text-sm font-medium transition-all tap-scale touch-target"
                :style="scheduleCurrentPage === page
                  ? { 'background': 'var(--brand)', 'color': 'white', 'border': '1px solid var(--brand)' }
                  : { 'background': 'var(--bg-elevated)', 'border': '1px solid var(--border-default)', 'color': 'var(--text-secondary)' }"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="scheduleCurrentPage = Math.min(scheduleTotalPages, scheduleCurrentPage + 1)"
              :disabled="scheduleCurrentPage === scheduleTotalPages"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
              :style="scheduleCurrentPage === scheduleTotalPages ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
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
          v-if="isScheduleModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          @click.self="closeScheduleModal"
        >
          <Transition name="modal">
            <div v-if="isScheduleModalOpen" class="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">📚</div>
              <div>
                <h2 class="text-base font-semibold text-white">{{ formTitle }}</h2>
                <p class="text-xs text-gray-500">{{ formSubtitle }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="closeScheduleModal"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all tap-scale touch-target"
            >✕</button>
          </div>

          <!-- Modal Body -->
          <form class="p-6 space-y-4" @submit.prevent="submitSchedule">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">ชื่อวิชา <span class="text-rose-400">*</span></label>
              <input
                v-model="form.courseName"
                type="text"
                maxlength="120"
                placeholder="เช่น คณิตศาสตร์, ภาษาอังกฤษ..."
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              >
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">วันเรียน</label>
              <select
                v-model.number="form.dayOfWeek"
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              >
                <option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาเริ่ม <span class="text-rose-400">*</span></label>
                <input
                  v-model="form.startTime"
                  type="time"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">เวลาสิ้นสุด <span class="text-rose-400">*</span></label>
                <input
                  v-model="form.endTime"
                  type="time"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">สถานที่ (ไม่บังคับ)</label>
              <input
                v-model="form.location"
                type="text"
                maxlength="120"
                placeholder="เช่น ห้อง 402, อาคาร A..."
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              >
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">หมายเหตุ (ไม่บังคับ)</label>
              <textarea
                v-model="form.note"
                rows="2"
                maxlength="300"
                placeholder="บันทึกเพิ่มเติม..."
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
              ></textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="closeScheduleModal"
                class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale touch-target"
              >ยกเลิก</button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2 tap-scale touch-target"
              >
                <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                {{ submitButtonText }}
              </button>
            </div>
          </form>
        </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="closeScheduleModal"></div>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { nowTH } from '~/utils/date'

type ScheduleRow = {
  id: string
  user_id: string
  course_name: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  note: string | null
  created_at: string
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

const router = useRouter()
const supabase = useSupabaseClient()

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

const schedules = ref<ScheduleRow[]>([])
const currentTime = ref(nowTH())
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDeletingId = ref('')
const isScheduleModalOpen = ref(false)
const editingScheduleId = ref('')
const errorMessage = ref('')
const scheduleItemsPerPage = ref(20)
const scheduleCurrentPage = ref(1)

const form = reactive({
  courseName: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', location: '', note: '',
})

const tableMissingCodes = new Set(['42P01', 'PGRST205'])

const getDayLabel = (day: number) => dayLabelMap.get(day) || 'ไม่ระบุ'
const formatTimeRange = (start: string, end: string) => `${start.slice(0, 5)} - ${end.slice(0, 5)}`
const toMinutes = (time: string) => {
  const [hour = '0', minute = '0'] = time.split(':')
  return (Number(hour) * 60) + Number(minute)
}

const hourHeight = 70 // pixels per hour row

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

const sortedSchedules = computed(() => [...schedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
  return a.start_time.localeCompare(b.start_time)
}))

const todaysClasses = computed(() => sortedSchedules.value.filter(item => item.day_of_week === todayWeekday.value))

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
  if (!sortedSchedules.value.length) return null
  const now = currentTime.value
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedSchedules.value.filter(item => item.day_of_week === checkingDay).sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (const item of classesInDay) {
      const startMinutes = toMinutes(item.start_time)
      const endMinutes = toMinutes(item.end_time)
      if (offset > 0 || currentMinutes < endMinutes || currentMinutes <= startMinutes) return item
    }
  }
  return sortedSchedules.value[0] || null
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

const normalizeRows = (rows: any[]): ScheduleRow[] => rows.map(row => ({
  id: String(row.id), user_id: String(row.user_id), course_name: String(row.course_name || ''),
  day_of_week: Number(row.day_of_week || 1), start_time: String(row.start_time || '00:00:00'),
  end_time: String(row.end_time || '00:00:00'),
  location: typeof row.location === 'string' ? row.location : null,
  note: typeof row.note === 'string' ? row.note : null, created_at: String(row.created_at || ''),
}))

const resetForm = () => {
  form.courseName = ''; form.dayOfWeek = 1; form.startTime = '08:00'
  form.endTime = '09:00'; form.location = ''; form.note = ''
  editingScheduleId.value = ''
}

const openCreateScheduleModal = () => { resetForm(); errorMessage.value = ''; isScheduleModalOpen.value = true }

const openEditScheduleModal = (item: ScheduleRow) => {
  editingScheduleId.value = item.id; form.courseName = item.course_name
  form.dayOfWeek = item.day_of_week; form.startTime = item.start_time.slice(0, 5)
  form.endTime = item.end_time.slice(0, 5); form.location = item.location || ''; form.note = item.note || ''
  errorMessage.value = ''; isScheduleModalOpen.value = true
}

const closeScheduleModal = () => { resetForm(); errorMessage.value = ''; isScheduleModalOpen.value = false }

const loadSchedules = async () => {
  isLoading.value = true; errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase
      .from('study_schedules').select('id, user_id, course_name, day_of_week, start_time, end_time, location, note, created_at')
      .eq('user_id', userData.user.id).order('day_of_week', { ascending: true }).order('start_time', { ascending: true })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง study_schedules ใน Supabase'; schedules.value = []; return }
      throw error
    }
    schedules.value = normalizeRows(data || [])
  } catch (error: any) {
    console.error('Load study schedules error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลตารางเรียนไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const submitSchedule = async () => {
  if (isSubmitting.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  if (!form.courseName.trim()) { toastWarning('กรุณาระบุชื่อวิชา'); return }
  if (!form.startTime || !form.endTime) { toastWarning('กรุณาระบุเวลาเริ่มและสิ้นสุด'); return }
  if (toMinutes(form.endTime) <= toMinutes(form.startTime)) { toastWarning('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'); return }
  isSubmitting.value = true; errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const payload = {
      course_name: form.courseName.trim(), day_of_week: form.dayOfWeek,
      start_time: `${form.startTime}:00`, end_time: `${form.endTime}:00`,
      location: form.location.trim() || null, note: form.note.trim() || null,
    }
    const q = supabase.from('study_schedules') as any
    const { error } = isEditing.value
      ? await q.update(payload).eq('id', editingScheduleId.value).eq('user_id', userData.user.id)
      : await q.insert({ user_id: userData.user.id, ...payload })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { const msg = 'ยังไม่พบตาราง study_schedules'; errorMessage.value = msg; toastError(msg); return }
      throw error
    }
    toastSuccess(isEditing.value ? 'แก้ไขคาบเรียนสำเร็จ' : 'เพิ่มคาบเรียนสำเร็จ')
    resetForm(); isScheduleModalOpen.value = false; await loadSchedules()
  } catch (error: any) {
    console.error('Save study schedule error:', error)
    const msg = error?.message || 'บันทึกคาบเรียนไม่สำเร็จ'; errorMessage.value = msg; toastError(msg)
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
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { error } = await supabase.from('study_schedules').delete().eq('id', scheduleId).eq('user_id', userData.user.id)
    if (error) throw error
    schedules.value = schedules.value.filter(item => item.id !== scheduleId)
    if (editingScheduleId.value === scheduleId) closeScheduleModal()
    toastSuccess('ลบคาบเรียนสำเร็จ')
  } catch (error: any) {
    console.error('Delete study schedule error:', error)
    const msg = error?.message || 'ลบคาบเรียนไม่สำเร็จ'; errorMessage.value = msg; toastError(msg)
  } finally {
    isDeletingId.value = ''
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadSchedules()
  clockTimer = setInterval(() => {
    currentTime.value = nowTH()
  }, 60_000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Itim&display=swap');

.font-itim {
  font-family: 'Itim', cursive, sans-serif;
}

.course-card-inner:hover {
  background-color: var(--hover-bg) !important;
  border-color: var(--hover-border) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transform: translateY(-1px);
}
</style>
