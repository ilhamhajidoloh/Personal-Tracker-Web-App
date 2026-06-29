<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <!-- Page Header -->
      <header class="sticky top-0 z-10 px-6 md:px-8 py-5 glass-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">✅ งานและ To-do</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">จัดการสิ่งที่ต้องทำ งานค้าง และกำหนดส่ง</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="isEntryModalOpen = true"
            class="btn-primary text-sm flex items-center gap-1.5"
          >
            <span>+</span> เพิ่มงานใหม่
          </button>
          <button
            @click="loadTodos"
            :disabled="isLoading"
            class="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div class="grid grid-cols-3 gap-3 md:gap-4">
          <div class="stat-card">
            <div class="icon-bubble mb-3" style="background: var(--bg-elevated);">📋</div>
            <p class="text-[11px] font-medium uppercase tracking-wide relative z-10" style="color: var(--text-muted);">ที่ยังไม่เสร็จ</p>
            <p class="text-2xl font-bold text-white mt-1 relative z-10">{{ pendingTodos.length }}</p>
            <p class="text-xs relative z-10" style="color: var(--text-muted);">งาน</p>
          </div>
          <div class="stat-card">
            <div class="icon-bubble mb-3" style="background: rgba(244,63,94,0.12);">⚠️</div>
            <p class="text-[11px] font-medium uppercase tracking-wide relative z-10" style="color: var(--text-muted);">ด่วน/เกินกำหนด</p>
            <p class="text-2xl font-bold text-rose-400 mt-1 relative z-10">{{ urgentTodos.length }}</p>
            <p class="text-xs relative z-10" style="color: var(--text-muted);">งาน</p>
          </div>
          <div class="stat-card">
            <div class="icon-bubble mb-3" style="background: rgba(16,185,129,0.12);">✅</div>
            <p class="text-[11px] font-medium uppercase tracking-wide relative z-10" style="color: var(--text-muted);">เสร็จแล้ว</p>
            <p class="text-2xl font-bold text-emerald-400 mt-1 relative z-10">{{ completedTodos.length }}</p>
            <p class="text-xs relative z-10" style="color: var(--text-muted);">งาน</p>
          </div>
        </div>

        <!-- Todo List -->
        <section class="section-card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">รายการงาน</h2>
            <select
              v-model="filterStatus"
              class="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="in_progress">กำลังทำ</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="p-5 space-y-3">
            <div v-for="i in 3" :key="i" class="h-20 rounded-xl bg-gray-800/60 animate-pulse"></div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!filteredTodos.length" class="flex flex-col items-center justify-center py-16 text-center px-5">
            <div class="w-16 h-16 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-4">✅</div>
            <p class="text-base font-semibold text-gray-300">ไม่พบรายการงาน</p>
            <p class="text-sm text-gray-500 mt-1">ลองเปลี่ยนตัวกรอง หรือเพิ่มงานใหม่</p>
            <button
              @click="isEntryModalOpen = true"
              class="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-sm font-medium text-violet-300 transition-all"
            >
              + เพิ่มงานใหม่
            </button>
          </div>

          <!-- Todo Items -->
          <div v-else class="divide-y divide-gray-800/60">
            <div
              v-for="item in filteredTodos"
              :key="item.id"
              class="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/30 transition-all"
              :class="{ 'opacity-60': item.status === 'completed' }"
            >
              <!-- Checkbox -->
              <button
                @click="toggleStatus(item)"
                class="mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                :class="item.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-gray-600 hover:border-violet-400'"
              >
                <svg v-if="item.status === 'completed'" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h3
                    class="text-sm font-semibold text-white"
                    :class="{ 'line-through text-gray-500': item.status === 'completed' }"
                  >{{ item.title }}</h3>
                  <span
                    v-if="item.priority === 'high'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25"
                  >ด่วน</span>
                  <span
                    v-else-if="item.priority === 'low'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25"
                  >ปกติ</span>
                </div>
                <p v-if="item.description" class="text-xs text-gray-500 line-clamp-1 mb-1.5">{{ item.description }}</p>
                <div class="flex items-center gap-3 text-xs">
                  <span v-if="item.due_date" class="flex items-center gap-1 font-medium" :class="getDueDateColor(item)">
                    📅 {{ formatDate(item.due_date) }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    :class="{
                      'border-emerald-500/30 bg-emerald-500/10 text-emerald-400': item.status === 'completed',
                      'border-sky-500/30 bg-sky-500/10 text-sky-400': item.status === 'in_progress',
                      'border-gray-600 bg-gray-800/50 text-gray-400': item.status === 'pending',
                    }"
                  >
                    {{ getStatusText(item.status) }}
                  </span>
                </div>
                <p
                  v-if="item.due_date && item.status !== 'completed'"
                  class="text-[10px] text-amber-400 mt-1"
                >🔔 {{ item.priority === 'high' ? 'เตือน 1 วันก่อน deadline' : 'เตือนเช้าวัน deadline' }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="openEditModal(item)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-400 hover:text-sky-300 hover:bg-sky-500/15 transition-all"
                  title="แก้ไข"
                >✏️</button>
                <button
                  @click="deleteTodo(item.id)"
                  :disabled="isDeletingId === item.id"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-400 hover:text-rose-300 hover:bg-rose-500/15 disabled:opacity-50 transition-all"
                  title="ลบ"
                >🗑️</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="isEntryModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="isEntryModalOpen = false"></div>

        <div class="relative w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">{{ isEditing ? '✏️' : '➕' }}</div>
              <div>
                <h3 class="text-base font-semibold text-white">{{ isEditing ? 'แก้ไขงาน' : 'เพิ่มงานใหม่' }}</h3>
              </div>
            </div>
            <button
              @click="() => { isEntryModalOpen = false; resetForm() }"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all"
            >✕</button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto">
            <form class="space-y-4" @submit.prevent="submitTodo">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">ชื่องาน <span class="text-rose-400">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="100"
                  placeholder="เช่น ส่งรายงานวิชา..., อ่านหนังสือสอบ..."
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">รายละเอียด</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="รายละเอียดเพิ่มเติม..."
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">วันกำหนดส่ง</label>
                  <input
                    v-model="form.dueDate"
                    type="date"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">ความสำคัญ</label>
                  <select
                    v-model="form.priority"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วนมาก</option>
                  </select>
                </div>
              </div>

              <div v-if="isEditing">
                <label class="block text-xs font-medium text-gray-400 mb-1.5">สถานะ</label>
                <select
                  v-model="form.status"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in_progress">กำลังทำ</option>
                  <option value="completed">เสร็จสิ้น</option>
                </select>
              </div>

              <div class="pt-2 flex gap-3">
                <button
                  type="button"
                  @click="() => { isEntryModalOpen = false; resetForm() }"
                  class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกงาน' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getTodayTH } from '~/utils/date'

type TodoStatus = 'pending' | 'in_progress' | 'completed'
type TodoPriority = 'low' | 'medium' | 'high'

type TodoRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TodoStatus
  priority: TodoPriority
  created_at: string
}

type TodoPayload = {
  title: string
  description: string | null
  due_date: string | null
  status: TodoStatus
  priority: TodoPriority
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'งานและ To-do' })

const router = useRouter()
const supabase = useSupabaseClient()
const { toastSuccess, toastError, confirmDelete } = useAlert()
const { notify, buildTodoSavedMessage } = useLineMessaging()

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const editingId = ref('')
const errorMessage = ref('')
const todos = ref<TodoRow[]>([])

const filterStatus = ref<'all' | TodoStatus>('all')

const form = reactive({
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium' as TodoPriority,
  status: 'pending' as TodoStatus,
})

const tableMissingCodes = new Set(['42P01', 'PGRST205'])

const isEditing = computed(() => Boolean(editingId.value))

const pendingTodos = computed(() => todos.value.filter(t => t.status !== 'completed'))
const completedTodos = computed(() => todos.value.filter(t => t.status === 'completed'))
const urgentTodos = computed(() => {
  const today = getTodayTH()
  return todos.value.filter(t => t.status !== 'completed' && (t.due_date && t.due_date <= today))
})

const filteredTodos = computed(() => {
  let list = todos.value
  if (filterStatus.value !== 'all') list = list.filter(t => t.status === filterStatus.value)
  return list.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    return 0
  })
})

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
  day: '2-digit', month: 'short', year: 'numeric'
})

const getStatusText = (status: string) => {
  if (status === 'completed') return 'เสร็จสิ้น'
  if (status === 'in_progress') return 'กำลังทำ'
  return 'รอดำเนินการ'
}

const getDueDateColor = (item: TodoRow) => {
  if (item.status === 'completed') return 'text-gray-500'
  if (!item.due_date) return 'text-gray-400'
  const today = getTodayTH()
  if (item.due_date < today) return 'text-rose-400'
  if (item.due_date === today) return 'text-amber-400'
  return 'text-sky-400'
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.dueDate = ''
  form.priority = 'medium'
  form.status = 'pending'
  editingId.value = ''
}

const openEditModal = (item: TodoRow) => {
  editingId.value = item.id
  form.title = item.title
  form.description = item.description || ''
  form.dueDate = item.due_date || ''
  form.priority = item.priority
  form.status = item.status
  errorMessage.value = ''
  isEntryModalOpen.value = true
}

const toggleStatus = async (item: TodoRow) => {
  const newStatus = item.status === 'completed' ? 'pending' : 'completed'
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const query = supabase.from('todos') as any
    const { error } = await query.update({ status: newStatus }).eq('id', item.id).eq('user_id', userData.user.id)
    if (error) throw error
    const index = todos.value.findIndex(t => t.id === item.id)
    if (index !== -1 && todos.value[index]) todos.value[index].status = newStatus
  } catch (err: any) {
    console.error('Toggle status error:', err)
    toastError('อัปเดตสถานะไม่สำเร็จ')
  }
}

const loadTodos = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase.from('todos').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'; todos.value = []; return }
      throw error
    }
    todos.value = data || []
  } catch (error: any) {
    console.error('Load todos error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลงานไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

const submitTodo = async () => {
  if (isSubmitting.value) return
  if (!form.title.trim()) { toastError('กรุณาระบุชื่องาน'); return }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { await router.push('/login'); return }
    const payload: TodoPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.dueDate || null,
      priority: form.priority,
      status: isEditing.value ? form.status : 'pending',
    }
    const query = supabase.from('todos') as any
    const { error } = isEditing.value
      ? await query.update(payload).eq('id', editingId.value).eq('user_id', userData.user.id)
      : await query.insert({ user_id: userData.user.id, ...payload })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase'; return }
      throw error
    }
    const lineMessage = buildTodoSavedMessage({ title: payload.title, dueDate: payload.due_date, priority: payload.priority, isEditing: isEditing.value })
    toastSuccess(isEditing.value ? 'แก้ไขงานสำเร็จ' : 'เพิ่มงานสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    await loadTodos()
    void notify(lineMessage)
  } catch (error: any) {
    console.error('Save todo error:', error)
    errorMessage.value = error?.message || 'บันทึกงานไม่สำเร็จ'
  } finally {
    isSubmitting.value = false
  }
}

const deleteTodo = async (id: string) => {
  if (!id || isDeletingId.value) return
  const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบงานนี้?', 'จะไม่สามารถกู้คืนได้') : true
  if (!shouldDelete) return
  isDeletingId.value = id
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userData.user.id)
    if (error) throw error
    todos.value = todos.value.filter(t => t.id !== id)
    toastSuccess('ลบงานสำเร็จ')
  } catch (error: any) {
    console.error('Delete todo error:', error)
    toastError('ลบงานไม่สำเร็จ')
  } finally {
    isDeletingId.value = ''
  }
}

onMounted(() => { loadTodos() })
</script>
