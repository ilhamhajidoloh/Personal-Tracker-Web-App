<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">กิจกรรม</h1>
          <p class="text-sm text-gray-400 mt-1">บันทึกนัดหมาย วันสำคัญ และกิจกรรมต่างๆ</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="isEntryModalOpen = true"
            class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium"
          >
            + เพิ่มกิจกรรม
          </button>
          <button
            @click="loadEvents"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm"
          >
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 class="text-lg font-semibold text-white">รายการกิจกรรม</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded-full px-3 py-1">
              ทั้งหมด {{ events.length }} รายการ
            </span>
          </div>
        </div>

        <div v-if="isLoading" class="text-sm text-gray-400">กำลังโหลด...</div>
        <div v-else-if="!events.length" class="text-sm text-gray-400">
          ยังไม่มีกิจกรรมใดๆ กดปุ่มเพื่มกิจกรรมด้านบน
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in events"
            :key="item.id"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-800/70 bg-gray-800/20"
          >
            <div class="mt-1 w-10 text-center shrink-0">
              <div class="text-xs text-rose-400 font-bold uppercase">{{ getMonthShort(item.start_date) }}</div>
              <div class="text-xl text-white font-bold">{{ getDay(item.start_date) }}</div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium text-white truncate">{{ item.title }}</h3>
              <p class="text-xs text-sky-400 font-medium mt-0.5">{{ displayEventDateTime(item) }}</p>
              <p v-if="item.description" class="text-sm text-gray-400 mt-2 line-clamp-2">{{ item.description }}</p>
            </div>

            <div class="flex items-center gap-1 shrink-0 bg-gray-800/50 rounded-lg p-1">
              <button
                @click="openEditModal(item)"
                class="p-2 inline-flex items-center justify-center rounded text-sky-300 hover:bg-sky-500/20"
              >
                ✏️
              </button>
              <button
                @click="deleteEvent(item.id)"
                :disabled="isDeletingId === item.id"
                class="p-2 inline-flex items-center justify-center rounded text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </section>

      <Teleport to="body">
        <div
          v-if="isEntryModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          <div class="absolute inset-0 bg-black/70" @click="isEntryModalOpen = false"></div>

          <div class="relative w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ isEditing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่' }}</h3>
              </div>
              <button
                @click="() => { isEntryModalOpen = false; resetForm() }"
                class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto">
              <form class="space-y-4" @submit.prevent="submitEvent">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">ชื่อกิจกรรม <span class="text-rose-400">*</span></label>
                  <input
                    v-model="form.title"
                    type="text"
                    required
                    maxlength="100"
                    placeholder="เช่น นัดดูหนัง, ทริปต่างจังหวัด..."
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  >
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1">รูปแบบเวลา</label>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label class="flex items-center gap-2 p-2 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer hover:border-violet-500">
                      <input type="radio" value="same_day_time" v-model="form.eventType" class="accent-violet-500">
                      <span class="text-xs text-white">วันเดียวกัน (มีเวลา)</span>
                    </label>
                    <label class="flex items-center gap-2 p-2 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer hover:border-violet-500">
                      <input type="radio" value="same_day_all_day" v-model="form.eventType" class="accent-violet-500">
                      <span class="text-xs text-white">วันเดียวกัน (ทั้งวัน)</span>
                    </label>
                    <label class="flex items-center gap-2 p-2 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer hover:border-violet-500">
                      <input type="radio" value="multi_day" v-model="form.eventType" class="accent-violet-500">
                      <span class="text-xs text-white">ข้ามวัน</span>
                    </label>
                  </div>
                </div>

                <!-- แบบที่ 1: วันเดียวกัน แต่ กำหนดเวลาเริ่ม และ กำหนดเวลาสิ้นสุด -->
                <div v-if="form.eventType === 'same_day_time'" class="grid grid-cols-2 gap-4 bg-gray-800/30 p-3 rounded-xl border border-gray-800">
                  <div class="col-span-2">
                    <label class="block text-xs text-gray-400 mb-1">วันที่ <span class="text-rose-400">*</span></label>
                    <input v-model="form.startDate" type="date" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">เวลาเริ่ม (น.)</label>
                    <input v-model="form.startTime" type="time" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">เวลาสิ้นสุด (น.)</label>
                    <input v-model="form.endTime" type="time" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                  </div>
                </div>

                <!-- แบบที่ 2: วันเดียวกัน ทั้งวัน ไม่กำหนดเวลา -->
                <div v-if="form.eventType === 'same_day_all_day'" class="bg-gray-800/30 p-3 rounded-xl border border-gray-800">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">วันที่ <span class="text-rose-400">*</span></label>
                    <input v-model="form.startDate" type="date" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                  </div>
                </div>

                <!-- แบบที่ 3: ข้ามวัน เริ่มเวลาไหน วันไหน และ สิ้นสุด เวลาไหน วันไหน -->
                <div v-if="form.eventType === 'multi_day'" class="bg-gray-800/30 p-3 rounded-xl border border-gray-800 space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">วันเริ่ม <span class="text-rose-400">*</span></label>
                      <input v-model="form.startDate" type="date" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                    </div>
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">เวลาเริ่ม (น.)</label>
                      <input v-model="form.startTime" type="time" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">วันสิ้นสุด <span class="text-rose-400">*</span></label>
                      <input v-model="form.endDate" type="date" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                    </div>
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">เวลาสิ้นสุด (น.)</label>
                      <input v-model="form.endTime" type="time" required class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500" >
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                  ></textarea>
                </div>

                <div class="pt-2">
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium text-white transition-colors"
                  >
                    {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

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
  created_at: string
}

type EventPayload = {
  title: string
  description: string | null
  event_type: EventTypeType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'กิจกรรม' })

const router = useRouter()
const supabase = useSupabaseClient()
const { toastSuccess, toastError, confirmDelete } = useAlert()

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const editingId = ref('')
const errorMessage = ref('')
const events = ref<EventRow[]>([])
const tableMissingCodes = new Set(['42P01', 'PGRST205'])

const form = reactive({
  title: '',
  description: '',
  eventType: 'same_day_time' as EventTypeType,
  startDate: new Date().toISOString().slice(0, 10),
  startTime: '10:00',
  endDate: new Date().toISOString().slice(0, 10),
  endTime: '12:00',
})

const isEditing = computed(() => Boolean(editingId.value))

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.eventType = 'same_day_time'
  form.startDate = new Date().toISOString().slice(0, 10)
  form.startTime = '10:00'
  form.endDate = new Date().toISOString().slice(0, 10)
  form.endTime = '12:00'
  editingId.value = ''
}

const openEditModal = (item: EventRow) => {
  editingId.value = item.id
  form.title = item.title
  form.description = item.description || ''
  form.eventType = item.event_type
  form.startDate = item.start_date || new Date().toISOString().slice(0, 10)
  form.startTime = item.start_time ? item.start_time.slice(0, 5) : '10:00'
  form.endDate = item.end_date || item.start_date || new Date().toISOString().slice(0, 10)
  form.endTime = item.end_time ? item.end_time.slice(0, 5) : '12:00'
  errorMessage.value = ''
  isEntryModalOpen.value = true
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const getMonthShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', { month: 'short' })
}

const getDay = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit' })
}

const formatTime = (timeString: string | null) => {
  if (!timeString) return ''
  return timeString.slice(0, 5) + ' น.'
}

const displayEventDateTime = (item: EventRow) => {
  if (item.event_type === 'same_day_all_day') {
    return `ตลอดวัน`
  }
  if (item.event_type === 'same_day_time') {
    return `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`
  }
  if (item.event_type === 'multi_day') {
    return `${formatTime(item.start_time)}  ถึง  ${formatDate(item.end_date || '')} ${formatTime(item.end_time)}`
  }
  return ''
}

const loadEvents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('start_date', { ascending: true })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง events ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        events.value = []
        return
      }
      throw error
    }

    events.value = data || []
  } catch (error: any) {
    console.error('Load events error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลกิจกรรมไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const submitEvent = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      await router.push('/login')
      return
    }

    // จัดการข้อมูลให้ตรงตามประเภท
    let payloadDateStart = form.startDate
    let payloadTimeStart: string | null = null
    let payloadDateEnd: string | null = null
    let payloadTimeEnd: string | null = null

    if (form.eventType === 'same_day_time') {
      payloadTimeStart = form.startTime
      payloadDateEnd = form.startDate
      payloadTimeEnd = form.endTime
    } else if (form.eventType === 'same_day_all_day') {
      payloadDateEnd = form.startDate
    } else if (form.eventType === 'multi_day') {
      payloadTimeStart = form.startTime
      payloadDateEnd = form.endDate
      payloadTimeEnd = form.endTime
    }

    const payload: EventPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_type: form.eventType,
      start_date: payloadDateStart,
      start_time: payloadTimeStart,
      end_date: payloadDateEnd,
      end_time: payloadTimeEnd,
    }

    const query = supabase.from('events') as any

    const { error } = isEditing.value
      ? await query.update(payload).eq('id', editingId.value).eq('user_id', userData.user.id)
      : await query.insert({ user_id: userData.user.id, ...payload })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง events ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        return
      }
      throw error
    }
    
    toastSuccess(isEditing.value ? 'แก้ไขกิจกรรมสำเร็จ' : 'เพิ่มกิจกรรมสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    await loadEvents()
  } catch (error: any) {
    console.error('Save event error:', error)
    errorMessage.value = error?.message || 'บันทึกกิจกรรมไม่สำเร็จ'
  } finally {
    isSubmitting.value = false
  }
}

const deleteEvent = async (id: string) => {
  if (!id || isDeletingId.value) return

  const shouldDelete = import.meta.client
    ? await confirmDelete('ยืนยันการลบกิจกรรมนี้?', 'จะไม่สามารถกู้คืนได้')
    : true

  if (!shouldDelete) return

  isDeletingId.value = id

  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id)

    if (error) throw error

    events.value = events.value.filter(t => t.id !== id)
    toastSuccess('ลบกิจกรรมสำเร็จ')
  } catch (error: any) {
    console.error('Delete event error:', error)
    toastError('ลบกิจกรรมไม่สำเร็จ')
  } finally {
    isDeletingId.value = ''
  }
}

onMounted(() => {
  loadEvents()
})
</script>