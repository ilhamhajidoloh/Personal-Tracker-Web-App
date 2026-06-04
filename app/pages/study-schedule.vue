<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <!-- Page Header -->
      <header class="sticky top-0 z-10 px-6 md:px-8 py-5 border-b border-gray-800/80 bg-gray-900/95 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">ตารางเรียน</h1>
          <p class="text-xs text-gray-500 mt-0.5">เพิ่มข้อมูลวิชา เวลาเรียน และดูภาพรวมรายสัปดาห์</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="openCreateScheduleModal"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
          >
            <span>+</span> เพิ่มคาบเรียน
          </button>
          <button
            @click="loadSchedules"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700/60 text-sm text-gray-400 hover:text-white transition-all"
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

        <!-- Stats Cards -->
        <section class="grid grid-cols-3 gap-3 md:gap-4">
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-base mb-3">📚</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">คาบทั้งหมด</p>
            <p class="text-2xl font-bold text-white mt-1">{{ totalClasses }}</p>
            <p class="text-xs text-gray-500">คาบ/สัปดาห์</p>
          </div>
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-base mb-3">📅</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">วันนี้</p>
            <p class="text-2xl font-bold text-sky-300 mt-1">{{ todaysClasses.length }}</p>
            <p class="text-xs text-gray-500">คาบ</p>
          </div>
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-base mb-3">⏰</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">คาบถัดไป</p>
            <p class="text-sm font-bold text-white mt-1 truncate">{{ nextClassTitle }}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">{{ nextClassSubtitle }}</p>
          </div>
        </section>

        <!-- Weekly Board -->
        <section class="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">บอร์ดตารางรายสัปดาห์</h2>
            <p class="text-xs text-gray-500 mt-0.5">แสดงคาบเรียนแต่ละวัน เรียงตามเวลา</p>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div
              v-for="day in weeklyBoard"
              :key="day.value"
              class="border border-gray-800/70 rounded-xl overflow-hidden"
              :class="day.value === todayWeekday ? 'border-sky-500/30 bg-sky-500/5' : ''"
            >
              <div class="flex items-center justify-between px-3 py-2.5 border-b border-gray-800/50" :class="day.value === todayWeekday ? 'bg-sky-500/10' : 'bg-gray-800/30'">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold" :class="day.value === todayWeekday ? 'text-sky-300' : 'text-white'">{{ day.label }}</p>
                  <span v-if="day.value === todayWeekday" class="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">วันนี้</span>
                </div>
                <span class="text-[11px] text-gray-500">{{ day.items.length }} คาบ</span>
              </div>
              <div class="p-2.5">
                <div v-if="!day.items.length" class="text-xs text-gray-600 text-center py-3">ไม่มีคาบ</div>
                <div v-else class="space-y-1.5">
                  <div
                    v-for="item in day.items"
                    :key="item.id"
                    class="rounded-lg border bg-gray-800/40 border-gray-700/50 px-2.5 py-2 hover:bg-gray-800/60 transition-all"
                  >
                    <p class="text-xs font-semibold text-white truncate">{{ item.course_name }}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">{{ formatTimeRange(item.start_time, item.end_time) }}</p>
                    <p v-if="item.location" class="text-[11px] text-gray-600 mt-0.5 truncate">📍 {{ item.location }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Schedule Grid Table -->
        <section class="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">ตารางภาพรวมรายสัปดาห์</h2>
            <p class="text-xs text-gray-500 mt-0.5">มองภาพรวมตามช่วงเวลาและวัน</p>
          </div>
          <div v-if="!gridTimeSlots.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
            <div class="w-14 h-14 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-3">📋</div>
            <p class="text-sm font-medium text-gray-400">ยังไม่มีคาบเรียน</p>
          </div>
          <div v-else class="overflow-x-auto p-4">
            <table class="min-w-full text-xs border-separate border-spacing-0">
              <thead>
                <tr>
                  <th class="text-left py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">เวลา</th>
                  <th
                    v-for="day in dayOptions"
                    :key="day.value"
                    class="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    :class="day.value === todayWeekday ? 'text-sky-400' : 'text-gray-500'"
                  >{{ day.label }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/40">
                <tr v-for="slot in gridTimeSlots" :key="slot.key" class="hover:bg-gray-800/10">
                  <td class="py-2 px-3 text-gray-400 whitespace-nowrap font-medium">{{ slot.label }}</td>
                  <td v-for="day in dayOptions" :key="day.value" class="py-2 px-3 align-top">
                    <div v-if="scheduleGrid[day.value]?.[slot.key]?.length" class="space-y-1">
                      <div
                        v-for="item in scheduleGrid[day.value]?.[slot.key]"
                        :key="item.id"
                        class="rounded-lg border border-gray-700/60 bg-gray-800/50 px-2 py-1.5"
                        :class="day.value === todayWeekday ? 'border-sky-500/30 bg-sky-500/8' : ''"
                      >
                        <p class="text-[11px] font-semibold text-white">{{ item.course_name }}</p>
                        <p v-if="item.location" class="text-[10px] text-gray-500 mt-0.5">{{ item.location }}</p>
                      </div>
                    </div>
                    <span v-else class="text-[11px] text-gray-700">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- All Schedules Table -->
        <section class="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">รายการคาบเรียนทั้งหมด</h2>
            <span class="text-xs bg-gray-800/80 text-gray-400 border border-gray-700/60 rounded-full px-3 py-1">{{ schedules.length }} รายการ</span>
          </div>

          <div v-if="!schedules.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
            <div class="w-14 h-14 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-3">📚</div>
            <p class="text-sm font-medium text-gray-400">ยังไม่มีคาบเรียน</p>
            <button @click="openCreateScheduleModal" class="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-sm font-medium text-violet-300 transition-all">
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
                  v-for="item in schedules"
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
                        class="px-3 py-1.5 rounded-lg text-xs bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/20 disabled:opacity-50 transition-all font-medium"
                      >แก้ไข</button>
                      <button
                        @click="deleteSchedule(item.id)"
                        :disabled="isDeletingId === item.id"
                        class="px-3 py-1.5 rounded-lg text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 disabled:opacity-50 transition-all font-medium"
                      >{{ isDeletingId === item.id ? 'ลบ...' : 'ลบ' }}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="isScheduleModalOpen"
        class="fixed inset-0 z-[90] flex items-center justify-center p-4"
        @click.self="closeScheduleModal"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-md bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
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
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all"
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
                class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all"
              >ยกเลิก</button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                {{ submitButtonText }}
              </button>
            </div>
          </form>
        </div>
      </div>
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

const schedules = ref<ScheduleRow[]>([])
const currentTime = ref(nowTH())
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDeletingId = ref('')
const isScheduleModalOpen = ref(false)
const editingScheduleId = ref('')
const errorMessage = ref('')

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
