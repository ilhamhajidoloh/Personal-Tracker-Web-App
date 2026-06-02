<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">ตารางเรียน</h1>
          <p class="text-sm text-gray-400 mt-1">เพิ่มข้อมูลวิชา เวลาเรียน และดูภาพรวมรายสัปดาห์</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="openCreateScheduleModal"
            class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm"
          >
            เพิ่มคาบเรียน
          </button>
          <button
            @click="loadSchedules"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm"
          >
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">คาบเรียนทั้งหมด</p>
          <p class="text-2xl font-bold text-white mt-2">{{ totalClasses }} คาบ</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">คาบเรียนวันนี้</p>
          <p class="text-2xl font-bold text-sky-300 mt-2">{{ todaysClasses.length }} คาบ</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">คาบถัดไป</p>
          <p class="text-sm font-semibold text-white mt-2">{{ nextClassTitle }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ nextClassSubtitle }}</p>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">บอร์ดตารางเรียนรายสัปดาห์</h2>
              <p class="text-sm text-gray-400 mt-1">เรียงตามวันและเวลา</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="day in weeklyBoard"
              :key="day.value"
              class="border border-gray-800 rounded-xl p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-semibold text-white">{{ day.label }}</p>
                <span class="text-xs text-gray-400">{{ day.items.length }} คาบ</span>
              </div>

              <div v-if="!day.items.length" class="text-xs text-gray-500">ไม่มีคาบเรียน</div>

              <div v-else class="space-y-2">
                <div
                  v-for="item in day.items"
                  :key="item.id"
                  class="bg-gray-800/60 border border-gray-700 rounded-lg px-2.5 py-2"
                >
                  <p class="text-sm text-white">{{ item.course_name }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTimeRange(item.start_time, item.end_time) }}</p>
                  <p v-if="item.location" class="text-xs text-gray-400 mt-1">สถานที่: {{ item.location }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-white">ตารางเรียนแบบตารางสัปดาห์</h2>
            <p class="text-sm text-gray-400 mt-1">มองภาพรวมตามช่วงเวลาและวัน</p>
          </div>
        </div>

        <div v-if="!gridTimeSlots.length" class="text-sm text-gray-400">ยังไม่มีคาบเรียน</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-400 border-b border-gray-800">
                <th class="py-2 pr-4 font-medium">เวลา</th>
                <th
                  v-for="day in dayOptions"
                  :key="day.value"
                  class="py-2 pr-4 font-medium"
                >
                  {{ day.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="slot in gridTimeSlots"
                :key="slot.key"
                class="border-b border-gray-800/70"
              >
                <td class="py-2 pr-4 text-gray-300 whitespace-nowrap">{{ slot.label }}</td>
                <td
                  v-for="day in dayOptions"
                  :key="day.value"
                  class="py-2 pr-4 align-top"
                >
                  <div
                    v-if="scheduleGrid[day.value]?.[slot.key]?.length"
                    class="space-y-1"
                  >
                    <div
                      v-for="item in scheduleGrid[day.value]?.[slot.key]"
                      :key="item.id"
                      class="rounded-lg border border-gray-700 bg-gray-800/60 px-2 py-1"
                    >
                      <p class="text-xs text-white">{{ item.course_name }}</p>
                      <p v-if="item.location" class="text-[11px] text-gray-400">สถานที่: {{ item.location }}</p>
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-500">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h2 class="text-lg font-semibold text-white">รายการคาบเรียนทั้งหมด</h2>
          <span class="text-xs text-gray-400">{{ schedules.length }} รายการ</span>
        </div>

        <div v-if="!schedules.length" class="text-sm text-gray-400">ยังไม่มีข้อมูลตารางเรียน</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-400 border-b border-gray-800">
                <th class="py-2 pr-4 font-medium">วัน</th>
                <th class="py-2 pr-4 font-medium">วิชา</th>
                <th class="py-2 pr-4 font-medium">เวลา</th>
                <th class="py-2 pr-4 font-medium">สถานที่</th>
                <th class="py-2 pr-4 font-medium">หมายเหตุ</th>
                <th class="py-2 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in schedules"
                :key="item.id"
                class="border-b border-gray-800/70"
                :class="editingScheduleId === item.id ? 'bg-violet-500/5' : ''"
              >
                <td class="py-2 pr-4 text-gray-300">{{ getDayLabel(item.day_of_week) }}</td>
                <td class="py-2 pr-4 text-gray-300">{{ item.course_name }}</td>
                <td class="py-2 pr-4 text-gray-300">{{ formatTimeRange(item.start_time, item.end_time) }}</td>
                <td class="py-2 pr-4 text-gray-400">{{ item.location || '-' }}</td>
                <td class="py-2 pr-4 text-gray-400">{{ item.note || '-' }}</td>
                <td class="py-2 text-right space-x-2">
                  <button
                    @click="openEditScheduleModal(item)"
                    :disabled="isDeletingId === item.id"
                    class="px-3 py-1.5 rounded-lg text-xs bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    แก้ไข
                  </button>
                  <button
                    @click="deleteSchedule(item.id)"
                    :disabled="isDeletingId === item.id"
                    class="px-3 py-1.5 rounded-lg text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isDeletingId === item.id ? 'กำลังลบ...' : 'ลบ' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Teleport to="body">
        <div
          v-if="isScheduleModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          @click.self="closeScheduleModal"
        >
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <div class="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-white">{{ formTitle }}</h2>
                <p class="text-sm text-gray-400 mt-1">{{ formSubtitle }}</p>
              </div>
              <button
                type="button"
                @click="closeScheduleModal"
                class="h-8 w-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-lg leading-none"
                aria-label="ปิดหน้าต่าง"
              >
                ×
              </button>
            </div>

            <form class="mt-4 space-y-3" @submit.prevent="submitSchedule">
              <div>
                <label class="block text-xs text-gray-400 mb-1">ชื่อวิชา</label>
                <input
                  v-model="form.courseName"
                  type="text"
                  maxlength="120"
                  placeholder="เช่น คณิตศาสตร์"
                  class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                >
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">วันเรียน</label>
                <select
                  v-model.number="form.dayOfWeek"
                  class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                >
                  <option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">เวลาเริ่ม</label>
                  <input
                    v-model="form.startTime"
                    type="time"
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">เวลาสิ้นสุด</label>
                  <input
                    v-model="form.endTime"
                    type="time"
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  >
                </div>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">สถานที่ (ไม่บังคับ)</label>
                <input
                  v-model="form.location"
                  type="text"
                  maxlength="120"
                  placeholder="เช่น ห้อง 402"
                  class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                >
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">หมายเหตุ (ไม่บังคับ)</label>
                <textarea
                  v-model="form.note"
                  rows="3"
                  maxlength="300"
                  class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {{ submitButtonText }}
                </button>
                <button
                  type="button"
                  @click="closeScheduleModal"
                  class="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'ตารางเรียน',
})

const router = useRouter()
const supabase = useSupabaseClient()

const dayOptions: DayOption[] = [
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
  { value: 6, label: 'เสาร์' },
  { value: 7, label: 'อาทิตย์' },
]

const dayLabelMap = new Map(dayOptions.map((item) => [item.value, item.label]))

const schedules = ref<ScheduleRow[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDeletingId = ref('')
const isScheduleModalOpen = ref(false)
const editingScheduleId = ref('')
const errorMessage = ref('')

const form = reactive({
  courseName: '',
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '09:00',
  location: '',
  note: '',
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

const formSubtitle = computed(() => isEditing.value
  ? 'ปรับข้อมูลแล้วกดบันทึกการแก้ไข'
  : 'ใส่ข้อมูลพื้นฐานที่จำเป็น')

const submitButtonText = computed(() => {
  if (isSubmitting.value) {
    return isEditing.value ? 'กำลังบันทึกการแก้ไข...' : 'กำลังบันทึก...'
  }

  return isEditing.value ? 'บันทึกการแก้ไข' : 'บันทึกคาบเรียน'
})

const todayWeekday = computed(() => {
  const day = nowTH().getDay()
  return day === 0 ? 7 : day
})

const sortedSchedules = computed(() => [...schedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) {
    return a.day_of_week - b.day_of_week
  }

  return a.start_time.localeCompare(b.start_time)
}))

const todaysClasses = computed(() => sortedSchedules.value.filter((item) => item.day_of_week === todayWeekday.value))

const weeklyBoard = computed(() => dayOptions.map((day) => ({
  ...day,
  items: sortedSchedules.value.filter((item) => item.day_of_week === day.value),
})))

const gridTimeSlots = computed<TimeSlot[]>(() => {
  const slotMap = new Map<string, TimeSlot>()

  for (const item of sortedSchedules.value) {
    const start = item.start_time.slice(0, 5)
    const end = item.end_time.slice(0, 5)
    const key = `${start}-${end}`

    if (!slotMap.has(key)) {
      slotMap.set(key, {
        key,
        start,
        end,
        label: formatTimeRange(start, end),
        sortKey: toMinutes(start),
      })
    }
  }

  return Array.from(slotMap.values()).sort((a, b) => {
    if (a.sortKey !== b.sortKey) {
      return a.sortKey - b.sortKey
    }

    return a.end.localeCompare(b.end)
  })
})

const scheduleGrid = computed(() => {
  const grid = {} as Record<number, Record<string, ScheduleRow[]>>

  for (const day of dayOptions) {
    grid[day.value] = {}
  }

  for (const item of sortedSchedules.value) {
    const start = item.start_time.slice(0, 5)
    const end = item.end_time.slice(0, 5)
    const key = `${start}-${end}`

    const dayGrid = grid[item.day_of_week] || {}
    grid[item.day_of_week] = dayGrid

    if (!dayGrid[key]) {
      dayGrid[key] = []
    }

    dayGrid[key].push(item)
  }

  return grid
})

const nextClass = computed(() => {
  if (!sortedSchedules.value.length) {
    return null
  }

  const now = nowTH()
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()

  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedSchedules.value
      .filter((item) => item.day_of_week === checkingDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    for (const item of classesInDay) {
      if (offset > 0 || toMinutes(item.start_time) >= currentMinutes) {
        return item
      }
    }
  }

  return sortedSchedules.value[0] || null
})

const nextClassTitle = computed(() => {
  if (!nextClass.value) {
    return 'ยังไม่มีคาบเรียน'
  }

  return `${nextClass.value.course_name}`
})

const nextClassSubtitle = computed(() => {
  if (!nextClass.value) {
    return 'เพิ่มคาบเรียนแรกของคุณ'
  }

  return `${getDayLabel(nextClass.value.day_of_week)} • ${formatTimeRange(nextClass.value.start_time, nextClass.value.end_time)}`
})

const normalizeRows = (rows: any[]): ScheduleRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.user_id),
  course_name: String(row.course_name || ''),
  day_of_week: Number(row.day_of_week || 1),
  start_time: String(row.start_time || '00:00:00'),
  end_time: String(row.end_time || '00:00:00'),
  location: typeof row.location === 'string' ? row.location : null,
  note: typeof row.note === 'string' ? row.note : null,
  created_at: String(row.created_at || ''),
}))

const resetForm = () => {
  form.courseName = ''
  form.dayOfWeek = 1
  form.startTime = '08:00'
  form.endTime = '09:00'
  form.location = ''
  form.note = ''
  editingScheduleId.value = ''
}

const openCreateScheduleModal = () => {
  resetForm()
  errorMessage.value = ''
  isScheduleModalOpen.value = true
}

const openEditScheduleModal = (item: ScheduleRow) => {
  editingScheduleId.value = item.id
  form.courseName = item.course_name
  form.dayOfWeek = item.day_of_week
  form.startTime = item.start_time.slice(0, 5)
  form.endTime = item.end_time.slice(0, 5)
  form.location = item.location || ''
  form.note = item.note || ''

  errorMessage.value = ''
  isScheduleModalOpen.value = true
}

const closeScheduleModal = () => {
  resetForm()
  errorMessage.value = ''
  isScheduleModalOpen.value = false
}

const loadSchedules = async () => {
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
      .from('study_schedules')
      .select('id, user_id, course_name, day_of_week, start_time, end_time, location, note, created_at')
      .eq('user_id', userData.user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง study_schedules ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        schedules.value = []
        return
      }

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
  if (isSubmitting.value) {
    return
  }
  
  const { toastSuccess, toastError, toastWarning } = useAlert()

  if (!form.courseName.trim()) {
    errorMessage.value = 'กรุณาระบุชื่อวิชา'
    toastWarning('กรุณาระบุชื่อวิชา')
    return
  }

  if (!form.startTime || !form.endTime) {
    errorMessage.value = 'กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด'
    toastWarning('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด')
    return
  }

  if (toMinutes(form.endTime) <= toMinutes(form.startTime)) {
    errorMessage.value = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'
    toastWarning('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม')
    return
  }

  isSubmitting.value = true
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

    const payload = {
      course_name: form.courseName.trim(),
      day_of_week: form.dayOfWeek,
      start_time: `${form.startTime}:00`,
      end_time: `${form.endTime}:00`,
      location: form.location.trim() || null,
      note: form.note.trim() || null,
    }

    const { error } = isEditing.value
      ? await supabase
        .from('study_schedules')
        // @ts-ignore
        .update(payload)
        .eq('id', editingScheduleId.value)
        .eq('user_id', userData.user.id)
      : await supabase
        .from('study_schedules')
        .insert({
          // @ts-ignore
          user_id: userData.user.id,
          ...payload,
        })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        const msg = 'ยังไม่พบตาราง study_schedules ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        errorMessage.value = msg
        toastError(msg)
        return
      }

      throw error
    }

    const successMsg = isEditing.value ? 'แก้ไขคาบเรียนสำเร็จ' : 'เพิ่มคาบเรียนสำเร็จ'
    toastSuccess(successMsg)

    resetForm()
    isScheduleModalOpen.value = false
    await loadSchedules()
  } catch (error: any) {
    console.error('Save study schedule error:', error)
    const msg = error?.message || 'บันทึกคาบเรียนไม่สำเร็จ'
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isSubmitting.value = false
  }
}

const deleteSchedule = async (scheduleId: string) => {
  if (!scheduleId || isDeletingId.value) {
    return
  }

  const { confirmDelete, toastSuccess, toastError } = useAlert()
  const shouldDelete = import.meta.client
    ? await confirmDelete('ยืนยันการลบคาบเรียนนี้?')
    : true

  if (!shouldDelete) {
    return
  }

  isDeletingId.value = scheduleId
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

    const { error } = await supabase
      .from('study_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', userData.user.id)

    if (error) {
      throw error
    }

    schedules.value = schedules.value.filter((item) => item.id !== scheduleId)

    if (editingScheduleId.value === scheduleId) {
      closeScheduleModal()
    }
    
    toastSuccess('ลบคาบเรียนสำเร็จ')
  } catch (error: any) {
    console.error('Delete study schedule error:', error)
    const msg = error?.message || 'ลบคาบเรียนไม่สำเร็จ'
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isDeletingId.value = ''
  }
}

onMounted(() => {
  loadSchedules()
})
</script>
