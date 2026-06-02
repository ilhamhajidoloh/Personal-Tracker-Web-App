<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">งานและ To-do</h1>
          <p class="text-sm text-gray-400 mt-1">จัดการสิ่งที่ต้องทำ งานค้าง และกำหนดส่ง</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="isEntryModalOpen = true"
            class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium"
          >
            + เพิ่มงานใหม่
          </button>
          <button
            @click="loadTodos"
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

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">งานทั้งหมด (ที่ยังไม่เสร็จ)</p>
          <p class="text-2xl font-bold text-white mt-2">{{ pendingTodos.length }} <span class="text-sm text-gray-500 font-normal">งาน</span></p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">งานที่ต้องส่งวันนี้ / เลยกำหนดส่ง</p>
          <p class="text-2xl font-bold text-rose-400 mt-2">
            {{ urgentTodos.length }} <span class="text-sm text-gray-500 font-normal">งาน</span>
          </p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">งานที่เสร็จแล้ว (ทั้งหมด)</p>
          <p class="text-2xl font-bold text-emerald-400 mt-2">
            {{ completedTodos.length }} <span class="text-sm text-gray-500 font-normal">งาน</span>
          </p>
        </div>
      </div>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 class="text-lg font-semibold text-white">รายการงาน</h2>
          <div class="flex items-center gap-2 flex-wrap">
            <select
              v-model="filterStatus"
              class="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="in_progress">กำลังทำ</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
          </div>
        </div>

        <div v-if="!filteredTodos.length" class="text-sm text-gray-400">ยังไม่มีรายการงาน</div>

        <div v-else class="space-y-3">
          <div
            v-for="item in filteredTodos"
            :key="item.id"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-800/70 bg-gray-800/20"
            :class="{'opacity-75': item.status === 'completed'}"
          >
            <button
              @click="toggleStatus(item)"
              class="mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors"
              :class="item.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-500 hover:border-violet-400'"
            >
              <span v-if="item.status === 'completed'">✓</span>
            </button>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-base font-medium text-white truncate" :class="{'line-through text-gray-400': item.status === 'completed'}">
                  {{ item.title }}
                </h3>
                <span v-if="item.priority === 'high'" class="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">ด่วน</span>
                <span v-else-if="item.priority === 'low'" class="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">ชิลๆ</span>
              </div>
              <p v-if="item.description" class="text-sm text-gray-400 line-clamp-2 mb-2">{{ item.description }}</p>
              
              <div class="flex items-center gap-3 text-xs">
                <span v-if="item.due_date" class="flex items-center gap-1" :class="getDueDateColor(item)">
                  📅 {{ formatDate(item.due_date) }}
                </span>
                <span class="text-gray-500">
                  สถานะ: {{ getStatusText(item.status) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0 bg-gray-800/50 rounded-lg p-1">
              <button
                @click="openEditModal(item)"
                class="p-2 inline-flex items-center justify-center rounded text-sky-300 hover:bg-sky-500/20"
              >
                ✏️
              </button>
              <button
                @click="deleteTodo(item.id)"
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
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/70" @click="isEntryModalOpen = false"></div>

          <div class="relative w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ isEditing ? 'แก้ไขงาน' : 'เพิ่มงานใหม่' }}</h3>
              </div>
              <button
                @click="() => { isEntryModalOpen = false; resetForm() }"
                class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto">
              <form class="space-y-4" @submit.prevent="submitTodo">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">ชื่องาน <span class="text-rose-400">*</span></label>
                  <input
                    v-model="form.title"
                    type="text"
                    required
                    maxlength="100"
                    placeholder="เช่น ส่งรายงานวิชา... , อ่านหนังสือสอบ..."
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  >
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1">รายละเอียด</label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">ระยะเวลา/วันกำหนดส่ง</label>
                    <input
                      v-model="form.dueDate"
                      type="date"
                      class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">ความสำคัญ</label>
                    <select
                      v-model="form.priority"
                      class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="low">ต่ำ</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="high">ด่วนมาก</option>
                    </select>
                  </div>
                </div>

                <div v-if="isEditing">
                  <label class="block text-xs text-gray-400 mb-1">สถานะ</label>
                  <select
                    v-model="form.status"
                    class="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังทำ</option>
                    <option value="completed">เสร็จสิ้น</option>
                  </select>
                </div>

                <div class="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium text-white transition-colors"
                  >
                    {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกงาน' }}
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
  const today = new Date().toISOString().slice(0, 10)
  return todos.value.filter(t => 
    t.status !== 'completed' && 
    (t.due_date && t.due_date <= today)
  )
})

const filteredTodos = computed(() => {
  let list = todos.value
  if (filterStatus.value !== 'all') {
    list = list.filter(t => t.status === filterStatus.value)
  }
  return list.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    return 0
  })
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const getStatusText = (status: string) => {
  if (status === 'completed') return 'เสร็จสิ้น'
  if (status === 'in_progress') return 'กำลังทำ'
  return 'รอดำเนินการ'
}

const getDueDateColor = (item: TodoRow) => {
  if (item.status === 'completed') return 'text-gray-500'
  if (!item.due_date) return 'text-gray-400'
  
  const today = new Date().toISOString().slice(0, 10)
  if (item.due_date < today) return 'text-rose-400 font-medium'
  if (item.due_date === today) return 'text-amber-400 font-medium'
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
    const { error } = await query
      .update({ status: newStatus })
      .eq('id', item.id)
      .eq('user_id', userData.user.id)

    if (error) throw error
    
    const index = todos.value.findIndex(t => t.id === item.id)
    if (index !== -1 && todos.value[index]) {
      todos.value[index].status = newStatus
    }
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
    if (!userData.user) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        todos.value = []
        return
      }
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

  if (!form.title.trim()) {
    toastError('กรุณาระบุชื่องาน')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      await router.push('/login')
      return
    }

    const payload: TodoPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.dueDate || null,
      priority: form.priority,
      status: isEditing.value ? form.status : 'pending',
    }

    const query = supabase.from('todos') as any

    const { error } = isEditing.value
      ? await query
        .update(payload)
        .eq('id', editingId.value)
        .eq('user_id', userData.user.id)
      : await query
        .insert({
          user_id: userData.user.id,
          ...payload,
        })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง todos ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        return
      }
      throw error
    }

    const lineMessage = buildTodoSavedMessage({
      title: payload.title,
      dueDate: payload.due_date,
      priority: payload.priority,
      isEditing: isEditing.value,
    })
    
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

  const shouldDelete = import.meta.client
    ? await confirmDelete('ยืนยันการลบงานนี้?', 'จะไม่สามารถกู้คืนได้')
    : true

  if (!shouldDelete) return

  isDeletingId.value = id

  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id)

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

onMounted(() => {
  loadTodos()
})
</script>