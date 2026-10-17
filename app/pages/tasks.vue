<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-6 md:py-8 pb-28">
      <!-- Hero -->
      <header
        class="relative overflow-hidden rounded-[28px] p-6 md:p-8"
        style="background: linear-gradient(135deg, var(--brand) 0%, #6d4aff 100%); color: #ffffff;"
      >
        <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10"></div>
        <div class="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10"></div>
        <div class="relative flex items-center justify-between gap-6">
          <div class="min-w-0">
            <p class="text-[11px] font-bold tracking-[0.18em] uppercase opacity-80">Assignments</p>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">งานและการบ้าน</h1>
            <div class="flex flex-wrap gap-2 mt-4">
              <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">ทั้งหมด <b class="num">{{ tasks.length }}</b></span>
              <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">ค้างส่ง <b class="num">{{ pendingTasks.length }}</b></span>
              <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">ด่วน <b class="num">{{ urgentTasks.length }}</b></span>
              <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">เสร็จ <b class="num">{{ completedTasks.length }}</b></span>
            </div>
          </div>
          <div class="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
            <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"
                :stroke-dasharray="`${completionPercent} 100`"
                style="transition: stroke-dasharray .5s ease;"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="num text-xl md:text-2xl font-extrabold leading-none">{{ completionPercent }}%</span>
              <span class="text-[10px] opacity-80 mt-0.5">สำเร็จ</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mt-4 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium"
        style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.3); color: var(--ink-amber);"
      >
        <span>⚠️</span><span>{{ errorMessage }}</span>
      </div>

      <!-- Toolbar -->
      <div class="mt-6 flex flex-col md:flex-row md:items-center gap-3">
        <div class="relative flex-1">
          <svg class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหางาน หรือ วิชา..."
            class="w-full text-sm pl-11 pr-4 py-3 rounded-full outline-none"
            style="background: var(--bg-card); border: 1px solid var(--border-default); color: var(--text-primary);"
          />
        </div>
        <div class="flex items-center gap-2">
          <div class="flex p-1 rounded-full overflow-x-auto no-scrollbar" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
            <button
              v-for="filter in filterOptions"
              :key="filter.value"
              @click="activeFilter = filter.value"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-scale"
              :style="activeFilter === filter.value
                ? { background: 'var(--bg-card)', color: 'var(--brand)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }
                : { color: 'var(--text-muted)' }"
            >
              {{ filter.label }} <span class="num opacity-70">{{ filter.count }}</span>
            </button>
          </div>
          <button
            @click="loadTasks"
            :disabled="isLoading"
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 tap-scale"
            style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
            aria-label="รีเฟรช"
          >
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-20 text-center">
        <span class="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style="border-color: var(--brand); border-top-color: transparent;"></span>
        <p class="text-sm font-medium" style="color: var(--text-muted);">กำลังโหลดข้อมูลงาน...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredTasks.length" class="mt-8 rounded-[28px] py-16 px-6 text-center" style="border: 2px dashed var(--border-default);">
        <div class="text-4xl mb-3">📝</div>
        <h3 class="text-base font-semibold" style="color: var(--text-primary);">ไม่พบรายการงาน</h3>
        <p class="text-xs mt-1" style="color: var(--text-muted);">ลองเปลี่ยนตัวกรอง ค้นหาด้วยคำอื่น หรือเพิ่มงานใหม่</p>
        <button @click="openCreateTaskModal" class="mt-5 btn-primary text-xs py-2.5 px-5 rounded-full tap-scale">+ เพิ่มงานแรก</button>
      </div>

      <!-- Card grid -->
      <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in filteredTasks"
          :key="item.id"
          class="relative rounded-3xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
          :style="{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            opacity: item.isCompleted ? 0.7 : 1,
          }"
        >
          <span
            class="absolute top-0 left-6 right-6 h-1 rounded-b-full"
            :style="{ background: item.isCompleted ? 'var(--ink-emerald)' : item.isUrgent ? 'var(--ink-rose)' : 'var(--brand)' }"
          ></span>

          <div class="flex items-center justify-between gap-2 pt-1">
            <span class="text-[11px] px-2.5 py-1 rounded-full font-semibold truncate" style="background: var(--brand-soft); color: var(--brand);">
              {{ item.subject || 'ทั่วไป' }}
            </span>
            <span v-if="item.isUrgent && !item.isCompleted" class="text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0" style="background: rgba(208,39,72,0.12); color: var(--ink-rose);">🔥 ด่วน</span>
            <span v-else-if="item.isCompleted" class="text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0" style="background: rgba(16,185,129,0.12); color: var(--ink-emerald);">เสร็จแล้ว</span>
          </div>

          <h3
            class="text-[15px] font-bold leading-snug break-words"
            :style="{ color: item.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.isCompleted ? 'line-through' : 'none' }"
          >
            {{ item.title }}
          </h3>

          <div class="rounded-2xl px-3.5 py-2.5 text-[12px] flex items-center gap-2" style="background: var(--bg-elevated);">
            <span>📅</span>
            <span class="num font-medium" :style="getDeadlineStyle(item)">{{ formatDeadline(item.deadline) }}</span>
          </div>

          <div class="flex items-center gap-2 mt-auto pt-1">
            <button
              type="button"
              @click="toggleTaskComplete(item)"
              class="flex-1 py-2 rounded-full text-xs font-bold transition-all tap-scale"
              :style="item.isCompleted
                ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
                : { background: 'var(--ink-emerald)', color: '#ffffff' }"
            >
              {{ item.isCompleted ? '↩ ทำต่อ' : '✓ เสร็จแล้ว' }}
            </button>
            <button
              @click="openEditTaskModal(item)"
              class="w-9 h-9 rounded-full flex items-center justify-center tap-scale"
              style="background: var(--bg-elevated); color: var(--text-secondary);"
              aria-label="แก้ไข"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button
              @click="deleteTask(item.id)"
              :disabled="deletingId === item.id"
              class="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50 tap-scale"
              style="background: rgba(208,39,72,0.1); color: var(--ink-rose);"
              aria-label="ลบ"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg>
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- Floating add button -->
    <button
      @click="openCreateTaskModal"
      class="fixed right-5 bottom-24 md:bottom-8 z-40 h-14 px-5 rounded-full btn-primary shadow-xl inline-flex items-center gap-2 text-sm font-bold tap-scale"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
      เพิ่มงาน
    </button>

    <!-- Bottom sheet -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          @click.self="closeModal"
        >
          <Transition name="modal">
            <div v-if="isModalOpen" class="relative z-10 w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl" style="background: var(--bg-card);">
              <div class="px-6 pt-3 pb-4" style="background: var(--brand-soft);">
                <div class="w-10 h-1 rounded-full mx-auto mb-3 sm:hidden" style="background: var(--border-strong);"></div>
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-extrabold" style="color: var(--text-primary);">{{ editingId ? 'แก้ไขงาน' : 'งานใหม่' }}</h2>
                    <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ editingId ? 'ปรับปรุงข้อมูลงานและการบ้าน' : 'ใส่รายละเอียดงานที่ต้องทำ' }}</p>
                  </div>
                  <button type="button" @click="closeModal" class="w-9 h-9 rounded-full flex items-center justify-center tap-scale" style="background: var(--bg-card); color: var(--text-muted);">✕</button>
                </div>
              </div>

              <form class="p-6 space-y-4" @submit.prevent="submitTask">
                <input
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="150"
                  placeholder="ชื่องาน / การบ้าน *"
                  class="w-full text-base font-semibold px-4 py-3 rounded-2xl outline-none"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-primary);"
                />
                <input
                  v-model="form.subject"
                  type="text"
                  maxlength="100"
                  placeholder="วิชา / หมวดหมู่"
                  class="w-full text-sm px-4 py-3 rounded-2xl outline-none"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-primary);"
                />
                <div>
                  <p class="text-[11px] font-semibold mb-1.5 px-1" style="color: var(--text-muted);">กำหนดส่ง *</p>
                  <input
                    v-model="form.deadline"
                    type="datetime-local"
                    required
                    class="w-full text-sm px-4 py-3 rounded-2xl outline-none"
                    style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-primary);"
                  />
                </div>

                <button
                  type="button"
                  @click="form.isUrgent = !form.isUrgent"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                  :style="form.isUrgent
                    ? { background: 'rgba(208,39,72,0.12)', color: 'var(--ink-rose)', border: '1px solid rgba(208,39,72,0.35)' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }"
                >
                  <span>🔥 งานด่วน</span>
                  <span class="w-10 h-6 rounded-full relative transition-all" :style="{ background: form.isUrgent ? 'var(--ink-rose)' : 'var(--border-strong)' }">
                    <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" :style="{ left: form.isUrgent ? '18px' : '2px' }"></span>
                  </span>
                </button>

                <div class="flex gap-3 pt-2">
                  <button type="button" @click="closeModal" class="flex-1 py-3 rounded-full text-sm font-semibold tap-scale" style="background: var(--bg-elevated); color: var(--text-secondary);">ยกเลิก</button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="flex-[2] btn-primary py-3 rounded-full disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-2 tap-scale"
                  >
                    <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ isSubmitting ? 'กำลังบันทึก...' : (editingId ? 'บันทึกแก้ไข' : 'บันทึกงาน') }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

type AssignmentTask = {
  id: string
  userId: string
  title: string
  subject?: string
  deadline: string
  isUrgent: boolean
  isCompleted: boolean
}

useHead({
  title: 'งานและการบ้าน',
})

const { apiFetch, userId } = useBackendApi()
const { confirmDelete, toastSuccess, toastError, toastWarning } = useAlert()
const { notify: notifyEmail } = useEmailMessaging()

const tasks = ref<AssignmentTask[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const deletingId = ref('')
const errorMessage = ref('')
type FilterType = 'all' | 'pending' | 'urgent' | 'completed'
const activeFilter = ref<FilterType>('all')
const searchQuery = ref('')

const isModalOpen = ref(false)
const editingId = ref('')

const form = reactive({
  title: '',
  subject: '',
  deadline: '',
  isUrgent: false,
})

const pendingTasks = computed(() => tasks.value.filter(t => !t.isCompleted))
const urgentTasks = computed(() => tasks.value.filter(t => t.isUrgent && !t.isCompleted))
const completedTasks = computed(() => tasks.value.filter(t => t.isCompleted))

const completionPercent = computed(() =>
  tasks.value.length ? Math.round((completedTasks.value.length / tasks.value.length) * 100) : 0,
)

const filterOptions =computed<{ label: string; value: FilterType; count: number }[]>(() => [
  { label: 'ทั้งหมด', value: 'all', count: tasks.value.length },
  { label: 'ค้างส่ง', value: 'pending', count: pendingTasks.value.length },
  { label: '🔥 งานด่วน', value: 'urgent', count: urgentTasks.value.length },
  { label: 'เสร็จแล้ว', value: 'completed', count: completedTasks.value.length },
])

const filteredTasks = computed(() => {
  let list = tasks.value

  if (activeFilter.value === 'pending') {
    list = list.filter(t => !t.isCompleted)
  } else if (activeFilter.value === 'urgent') {
    list = list.filter(t => t.isUrgent && !t.isCompleted)
  } else if (activeFilter.value === 'completed') {
    list = list.filter(t => t.isCompleted)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    )
  }

  return list
})

const formatDeadline = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getDeadlineStyle = (item: AssignmentTask) => {
  if (item.isCompleted) return { color: 'var(--text-muted)' }
  try {
    const d = new Date(item.deadline)
    const now = new Date()
    if (d < now) return { color: 'var(--ink-rose)', fontWeight: 'bold' } // Overdue
    const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (diffHours <= 24) return { color: 'var(--ink-orange)', fontWeight: 'bold' } // Due soon
  } catch {}
  return { color: 'var(--text-secondary)' }
}

const loadTasks = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<AssignmentTask[]>(`/api/Task/${userId.value}`)
    tasks.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Load tasks error:', error)
    errorMessage.value = error?.data?.message || error?.message || 'โหลดข้อมูลงานไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const openCreateTaskModal = () => {
  editingId.value = ''
  form.title = ''
  form.subject = ''
  // Default to tomorrow 17:00
  const now = new Date()
  now.setDate(now.getDate() + 1)
  now.setHours(17, 0, 0, 0)
  form.deadline = now.toISOString().slice(0, 16)
  form.isUrgent = false
  isModalOpen.value = true
}

const openEditTaskModal = (item: AssignmentTask) => {
  editingId.value = item.id
  form.title = item.title
  form.subject = item.subject || ''
  try {
    const d = new Date(item.deadline)
    form.deadline = d.toISOString().slice(0, 16)
  } catch {
    form.deadline = item.deadline
  }
  form.isUrgent = item.isUrgent
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingId.value = ''
}

const submitTask = async () => {
  if (isSubmitting.value) return
  if (!form.title.trim()) { toastWarning('กรุณาระบุชื่องาน'); return }
  if (!form.deadline) { toastWarning('กรุณาระบุวันกำหนดส่ง'); return }

  isSubmitting.value = true
  try {
    const deadlineDate = new Date(form.deadline)
    const body = {
      title: form.title.trim(),
      subject: form.subject.trim() || null,
      deadline: deadlineDate.toISOString(),
      isUrgent: form.isUrgent,
      isCompleted: false,
    }

    if (editingId.value) {
      const existing = tasks.value.find(t => t.id === editingId.value)
      await apiFetch(`/api/Task/${editingId.value}`, {
        method: 'PUT',
        body: {
          ...body,
          isCompleted: existing ? existing.isCompleted : false,
        },
      })
      toastSuccess('แก้ไขข้อมูลงานสำเร็จ')
    } else {
      await apiFetch('/api/Task', {
        method: 'POST',
        body,
      })
      toastSuccess('เพิ่มงานใหม่สำเร็จ')
    }

    closeModal()
    await loadTasks()
    void notifyEmail('task', {
      title: form.title.trim(),
      courseName: form.subject?.trim() || null,
      deadline: form.deadline,
      isUrgent: form.isUrgent,
    })
  } catch (error: any) {
    console.error('Submit task error:', error)
    toastError(error?.data?.message || error?.message || 'บันทึกงานไม่สำเร็จ')
  } finally {
    isSubmitting.value = false
  }
}

const toggleTaskComplete = async (item: AssignmentTask) => {
  const nextState = !item.isCompleted
  item.isCompleted = nextState
  try {
    await apiFetch(`/api/Task/${item.id}`, {
      method: 'PUT',
      body: {
        title: item.title,
        subject: item.subject,
        deadline: item.deadline,
        isUrgent: item.isUrgent,
        isCompleted: nextState,
      },
    })
    toastSuccess(nextState ? 'ทำเสร็จเรียบร้อย! 🎉' : 'ทำรายการต่อ')
  } catch (error: any) {
    item.isCompleted = !nextState
    console.error('Toggle task complete error:', error)
    toastError('อัปเดตสถานะไม่สำเร็จ')
  }
}

const deleteTask = async (taskId: string) => {
  if (!taskId || deletingId.value) return
  const confirmed = await confirmDelete('ยืนยันการลบงานนี้?', 'การลบจะไม่สามารถย้อนกลับได้')
  if (!confirmed) return

  deletingId.value = taskId
  try {
    await apiFetch(`/api/Task/${taskId}`, { method: 'DELETE' })
    toastSuccess('ลบรายการงานสำเร็จ')
    await loadTasks()
  } catch (error: any) {
    console.error('Delete task error:', error)
    toastError('ลบงานไม่สำเร็จ')
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  loadTasks()
})
</script>
