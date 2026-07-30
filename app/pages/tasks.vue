<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
      <!-- Page head -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="eyebrow">งาน · ASSIGNMENTS</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">งานและการบ้าน</h1>
          <p class="text-xs mt-2 text-gray-400 font-medium">ค้างส่ง {{ pendingTasks.length }} รายการ &bull; งานด่วน {{ urgentTasks.length }} รายการ</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="openCreateTaskModal"
            class="btn-primary text-sm inline-flex items-center gap-2 tap-scale touch-target"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่มงานใหม่
          </button>
          <button
            @click="loadTasks"
            :disabled="isLoading"
            class="btn-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
          >
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>
      </div>

      <div class="space-y-5 mt-6">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium"
          style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.3); color: var(--ink-amber);"
        >
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Summary tiles -->
        <div class="section-card grid grid-cols-2 sm:grid-cols-4">
          <div class="p-4 border-b sm:border-b-0 border-r" style="border-color: var(--border-subtle);">
            <p class="eyebrow">งานทั้งหมด</p>
            <p class="num text-2xl font-bold mt-1" style="color: var(--text-primary);">{{ tasks.length }}</p>
          </div>
          <div class="p-4 border-b sm:border-b-0 sm:border-r" style="border-color: var(--border-subtle);">
            <p class="eyebrow">ค้างส่ง</p>
            <p class="num text-2xl font-bold mt-1" style="color: var(--ink-amber);">{{ pendingTasks.length }}</p>
          </div>
          <div class="p-4 border-r" style="border-color: var(--border-subtle);">
            <p class="eyebrow">🔥 งานด่วน</p>
            <p class="num text-2xl font-bold mt-1" style="color: var(--ink-rose);">{{ urgentTasks.length }}</p>
          </div>
          <div class="p-4">
            <p class="eyebrow">เสร็จแล้ว</p>
            <p class="num text-2xl font-bold mt-1" style="color: var(--ink-emerald);">{{ completedTasks.length }}</p>
          </div>
        </div>

        <!-- Tasks Content Card -->
        <section class="section-card">
          <!-- Filters & Search Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-4 border-b" style="border-color: var(--border-subtle);">
            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                v-for="filter in filterOptions"
                :key="filter.value"
                @click="activeFilter = filter.value"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tap-scale touch-target"
                :style="activeFilter === filter.value
                  ? { background: 'var(--brand)', color: '#ffffff', boxShadow: 'var(--brand-glow)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }"
              >
                {{ filter.label }}
                <span class="ml-1 opacity-75 num">({{ filter.count }})</span>
              </button>
            </div>

            <!-- Search box -->
            <div class="relative w-full sm:w-64">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหางาน หรือ วิชา..."
                class="w-full input-glass text-xs pl-8 pr-3 py-2"
              />
              <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="py-16 text-center">
            <span class="inline-block w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mb-3" style="border-color: var(--brand); border-top-color: transparent;"></span>
            <p class="text-sm font-medium" style="color: var(--text-muted);">กำลังโหลดข้อมูลงาน...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="!filteredTasks.length" class="flex flex-col items-center justify-center py-16 text-center px-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
              📝
            </div>
            <h3 class="text-base font-semibold" style="color: var(--text-primary);">ไม่พบรายการงาน</h3>
            <p class="text-xs mt-1 max-w-xs" style="color: var(--text-muted);">ลองเปลี่ยนตัวกรอง ค้นหาด้วยคำอื่น หรือกดเพิ่มงานใหม่</p>
            <button
              @click="openCreateTaskModal"
              class="mt-4 btn-primary text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 tap-scale touch-target"
            >
              + เพิ่มงานแรก
            </button>
          </div>

          <!-- Task List Table / Items -->
          <div v-else class="divide-y" style="border-color: var(--border-subtle);">
            <div
              v-for="item in filteredTasks"
              :key="item.id"
              class="flex items-start sm:items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--bg-hover)] transition-all"
            >
              <!-- Checkbox + Title + Subject + Deadline -->
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  @click="toggleTaskComplete(item)"
                  class="mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all tap-scale touch-target"
                  :style="item.isCompleted
                    ? { background: 'var(--ink-emerald)', borderColor: 'var(--ink-emerald)', color: '#ffffff' }
                    : { background: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }"
                >
                  <svg v-if="item.isCompleted" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3
                      class="text-sm font-bold truncate leading-tight"
                      :style="{
                        color: item.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: item.isCompleted ? 'line-through' : 'none'
                      }"
                    >
                      {{ item.title }}
                    </h3>
                    <span v-if="item.isUrgent && !item.isCompleted" class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25 shrink-0">
                      🔥 ด่วน
                    </span>
                    <span v-if="item.subject" class="text-[10.5px] px-2 py-0.5 rounded-md font-semibold shrink-0" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
                      {{ item.subject }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3 mt-1.5 text-[11px] flex-wrap" style="color: var(--text-muted);">
                    <span class="num flex items-center gap-1 font-medium" :style="getDeadlineStyle(item)">
                      📅 กำหนดส่ง: {{ formatDeadline(item.deadline) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  @click="openEditTaskModal(item)"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all tap-scale touch-target"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
                >
                  แก้ไข
                </button>
                <button
                  @click="deleteTask(item.id)"
                  :disabled="deletingId === item.id"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 tap-scale touch-target"
                  style="background: rgba(208,39,72,0.1); border: 1px solid rgba(208,39,72,0.2); color: var(--ink-rose);"
                >
                  {{ deletingId === item.id ? 'ลบ...' : 'ลบ' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Task Modal Dialog -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          @click.self="closeModal"
        >
          <Transition name="modal">
            <div v-if="isModalOpen" class="relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style="background: var(--bg-card); border: 1px solid var(--border-default);">
              <!-- Modal Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border-subtle);">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base" style="background: var(--brand-soft); color: var(--brand);">📝</div>
                  <div>
                    <h2 class="text-base font-semibold" style="color: var(--text-primary);">{{ editingId ? 'แก้ไขงาน' : 'เพิ่มงานใหม่' }}</h2>
                    <p class="text-xs" style="color: var(--text-muted);">{{ editingId ? 'ปรับปรุงข้อมูลงานและการบ้าน' : 'ใส่ข้อมูลรายละเอียดงานที่ต้องทำ' }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="closeModal"
                  class="w-8 h-8 rounded-xl flex items-center justify-center transition-all tap-scale touch-target"
                  style="background: var(--bg-elevated); color: var(--text-muted);"
                >✕</button>
              </div>

              <!-- Form -->
              <form class="p-6 space-y-4" @submit.prevent="submitTask">
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">ชื่องาน / การบ้าน <span style="color: var(--ink-rose);">*</span></label>
                  <input
                    v-model="form.title"
                    type="text"
                    required
                    maxlength="150"
                    placeholder="เช่น ทำรายงานวิชาโปรแกรมมิ่ง, ส่งการบ้านบทที่ 3..."
                    class="w-full input-glass text-sm"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">วิชา / หมวดหมู่</label>
                  <input
                    v-model="form.subject"
                    type="text"
                    maxlength="100"
                    placeholder="เช่น วิชาคอมพิวเตอร์, งานโปรเจกต์..."
                    class="w-full input-glass text-sm"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">วันกำหนดส่ง (Deadline) <span style="color: var(--ink-rose);">*</span></label>
                  <input
                    v-model="form.deadline"
                    type="datetime-local"
                    required
                    class="w-full input-glass text-sm"
                  />
                </div>

                <div class="flex items-center gap-3 pt-1">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      v-model="form.isUrgent"
                      type="checkbox"
                      class="w-4 h-4 rounded border-gray-600 text-rose-500 focus:ring-rose-500/20"
                    />
                    <span class="text-xs font-semibold" style="color: var(--ink-rose);">🔥 Mark เป็นงานด่วน (Urgent Task)</span>
                  </label>
                </div>

                <div class="flex gap-3 pt-3">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all tap-scale touch-target"
                    style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 tap-scale touch-target"
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

const filterOptions = computed<{ label: string; value: FilterType; count: number }[]>(() => [
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
