<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
      <!-- Page Head -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="eyebrow">To-do List · Checklist</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">Todolist</h1>
          <p class="text-xs mt-2 font-medium" style="color: var(--text-muted);">จัดการรายการที่ต้องทำ</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button @click="openCreateModal" class="btn-primary text-sm inline-flex items-center gap-2 tap-scale touch-target">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่ม Todolist
          </button>
          <button @click="loadTodos" :disabled="isLoading" class="btn-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50 tap-scale touch-target">
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>
      </div>

      <div class="space-y-4 mt-6">
        <!-- Error -->
        <div v-if="errorMessage" class="rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium" style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.3); color: var(--ink-amber);">
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Progress Card (เหมือน Mobile) -->
        <div v-if="!isLoading" class="section-card p-5 flex items-center gap-6">
          <!-- Progress Circle -->
          <div class="relative shrink-0 w-20 h-20">
            <svg viewBox="0 0 80 80" class="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-elevated)" stroke-width="8"/>
              <circle
                cx="40" cy="40" r="32"
                fill="none"
                stroke="var(--brand)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${completionPercentage * 201.1} 201.1`"
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-sm font-extrabold num" style="color: var(--text-primary);">{{ Math.round(completionPercentage * 100) }}%</span>
              <span class="text-[9px] font-semibold" style="color: var(--text-muted);">สำเร็จ</span>
            </div>
          </div>
          <!-- Progress Info -->
          <div class="flex-1 min-w-0">
            <p class="text-base font-extrabold" style="color: var(--text-primary);">ความสำเร็จ</p>
            <p class="text-sm mt-0.5" style="color: var(--text-secondary);">{{ completedCount }} / {{ totalCount }} รายการ</p>
            <div class="mt-2.5 h-2 rounded-full overflow-hidden" style="background: var(--bg-elevated);">
              <div
                class="h-full rounded-full transition-all duration-500"
                style="background: var(--brand);"
                :style="{ width: `${completionPercentage * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- View Mode Selector (วัน / เดือน / ปี / ทั้งหมด) -->
        <div class="flex p-1 gap-1 rounded-2xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
          <button
            v-for="v in viewOptions"
            :key="v"
            @click="changeView(v)"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 tap-scale touch-target"
            :style="selectedView === v
              ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }
              : { color: 'var(--text-muted)' }"
          >
            {{ v }}
          </button>
        </div>

        <!-- Range Navigator (เลื่อนวัน/เดือน/ปี) -->
        <div v-if="selectedView !== 'ทั้งหมด'" class="flex items-center justify-between">
          <button @click="shiftView(-1)" class="p-2 rounded-xl tap-scale touch-target transition-all" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span class="text-sm font-bold" style="color: var(--text-primary);">{{ rangeLabel }}</span>
          <button @click="shiftView(1)" class="p-2 rounded-xl tap-scale touch-target transition-all" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- Tag Filter Chips (เรียน / งาน / ส่วนตัว / สุขภาพ) -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            v-for="tag in tagOptions"
            :key="tag"
            @click="selectedTag = tag; loadTodos()"
            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 tap-scale touch-target"
            :style="getTagChipStyle(tag, selectedTag === tag)"
          >
            {{ tag }}
          </button>
        </div>

        <!-- Todolist Section Card -->
        <section class="section-card">
          <div class="flex items-center justify-between px-5 py-4 border-b" style="border-color: var(--border-subtle);">
            <h2 class="text-sm font-semibold" style="color: var(--text-primary);">รายการ</h2>
            <span class="eyebrow">{{ rangeLabel }}</span>
          </div>

          <!-- Loading Skeleton -->
          <div v-if="isLoading" class="p-5 space-y-3">
            <div v-for="i in 3" :key="i" class="h-16 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!todos.length" class="flex flex-col items-center justify-center py-16 text-center px-6">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">✅</div>
            <h3 class="text-base font-semibold" style="color: var(--text-primary);">ยังไม่มีรายการ</h3>
            <p class="text-xs mt-1" style="color: var(--text-muted);">กด + เพื่อสร้างรายการ Todolist แรก</p>
            <button @click="openCreateModal" class="mt-4 btn-primary text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 tap-scale touch-target">+ เพิ่ม Todolist</button>
          </div>

          <!-- Todo Items (เหมือน Mobile) -->
          <div v-else class="p-3 space-y-2">
            <div
              v-for="item in todos"
              :key="item.id"
              class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              :style="item.isCompleted
                ? 'background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.12);'
                : 'background: var(--bg-elevated); border: 1px solid var(--border-subtle);'"
            >
              <!-- Checkbox (ส่ง API /completion เหมือน Mobile) -->
              <button
                type="button"
                @click="toggleCompletion(item)"
                class="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all tap-scale touch-target"
                :style="item.isCompleted
                  ? 'background: linear-gradient(135deg, var(--ink-emerald), rgba(16,185,129,0.8)); border: 2px solid var(--ink-emerald);'
                  : 'background: transparent; border: 2px solid var(--border-strong);'"
              >
                <svg v-if="item.isCompleted" class="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-semibold leading-snug truncate"
                  :style="{
                    color: item.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.isCompleted ? 'line-through' : 'none'
                  }"
                >
                  {{ item.title }}
                </p>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    v-if="item.tag && item.tag !== 'ทั่วไป'"
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    :style="getTagBadgeStyle(item.tag)"
                  >
                    {{ item.tag }}
                  </span>
                  <span v-if="item.targetDate" class="text-[10.5px] num font-medium" :style="getDueDateStyle(item)">
                    📅 {{ formatDate(item.targetDate) }}
                  </span>
                  <span v-if="item.recurrenceLabel" class="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style="background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-subtle);">
                    🔁 {{ item.recurrenceLabel }}
                  </span>
                </div>
              </div>

              <!-- Edit Button -->
              <button
                @click="openEditModal(item)"
                class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all tap-scale touch-target"
                style="color: var(--text-muted);"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Modal: Add / Edit Todolist -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px);"
          @click.self="closeModal"
        >
          <Transition name="modal">
            <div v-if="isModalOpen" class="relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style="background: var(--bg-card); border: 1px solid var(--border-default);">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border-subtle);">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base" style="background: var(--brand-soft);">✅</div>
                  <div>
                    <h2 class="text-base font-semibold" style="color: var(--text-primary);">{{ editingId ? 'แก้ไข Todolist' : 'เพิ่ม Todolist ใหม่' }}</h2>
                    <p class="text-xs" style="color: var(--text-muted);">{{ editingId ? 'ปรับปรุงรายการที่ต้องทำ' : 'เพิ่มรายการสิ่งที่ต้องทำ' }}</p>
                  </div>
                </div>
                <button @click="closeModal" class="w-8 h-8 rounded-xl flex items-center justify-center transition-all tap-scale touch-target" style="background: var(--bg-elevated); color: var(--text-muted);">✕</button>
              </div>

              <!-- Form -->
              <form class="p-6 space-y-4" @submit.prevent="submitTodo">
                <!-- Title -->
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">รายการที่ต้องทำ <span style="color: var(--ink-rose);">*</span></label>
                  <input
                    v-model="form.title"
                    type="text"
                    required
                    maxlength="100"
                    placeholder="เช่น อ่านหนังสือ, ส่งรายงาน..."
                    class="w-full input-glass text-sm"
                  />
                </div>

                <!-- Recurrence (รูปแบบวันที่) -->
                <div>
                  <label class="block text-xs font-medium mb-2" style="color: var(--text-secondary);">รูปแบบวันที่ต้องทำ</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="opt in recurrenceOptions"
                      :key="opt.value"
                      type="button"
                      @click="form.recurrence = opt.value"
                      class="px-3 py-2 rounded-xl text-xs font-semibold transition-all tap-scale touch-target"
                      :style="form.recurrence === opt.value
                        ? { background: 'var(--brand-soft)', border: '1px solid var(--brand-border)', color: 'var(--brand-ink)' }
                        : { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>

                <!-- Target Date -->
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">{{ form.recurrence === 0 ? 'วันที่ต้องทำ' : 'วันที่เริ่มต้น' }}</label>
                  <input
                    v-model="form.targetDate"
                    type="date"
                    class="w-full input-glass text-sm"
                  />
                </div>

                <!-- Tag Selection -->
                <div>
                  <label class="block text-xs font-medium mb-2" style="color: var(--text-secondary);">เลือกแท็ก</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="tag in ['เรียน', 'งาน', 'ส่วนตัว', 'สุขภาพ']"
                      :key="tag"
                      type="button"
                      @click="form.tag = tag"
                      class="px-3 py-2 rounded-xl text-xs font-semibold transition-all tap-scale touch-target"
                      :style="getTagChipStyle(tag, form.tag === tag)"
                    >
                      {{ tag }}
                    </button>
                  </div>
                </div>

                <!-- Buttons -->
                <div class="flex gap-3 pt-2">
                  <button
                    v-if="editingId"
                    type="button"
                    @click="deleteTodo(editingId)"
                    class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 tap-scale touch-target"
                    style="background: rgba(208,39,72,0.12); color: var(--ink-rose);"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                  </button>
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
                    {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
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

type BackendTodo = {
  id: string
  userId: string
  title: string
  description: string | null
  targetDate: string
  tag: string
  recurrence: string | number
  status: string
  priority: string
  isCompleted: boolean
  reminderSentAt: string | null
}

type TodoRow = BackendTodo & {
  recurrenceLabel: string
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'To-do List' })

const { apiFetch, userId } = useBackendApi()
const { toastSuccess, toastError, confirmDelete } = useAlert()

const todos = ref<TodoRow[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const selectedView = ref<string>('วัน')
const selectedTag = ref<string>('ทั้งหมด')
const viewAnchor = ref(new Date())

const viewOptions = ['ทั้งหมด', 'วัน', 'เดือน', 'ปี']
const tagOptions = ['ทั้งหมด', 'เรียน', 'งาน', 'ส่วนตัว', 'สุขภาพ']

const recurrenceOptions = [
  { label: 'เป็นวันที่', value: 0 },
  { label: 'ทุกวัน', value: 1 },
  { label: 'ทุกสัปดาห์', value: 2 },
  { label: 'ทุกเดือน', value: 3 },
  { label: 'ทุกปี', value: 4 },
]

// Modal state
const isModalOpen = ref(false)
const editingId = ref('')
const form = reactive({
  title: '',
  tag: 'เรียน',
  targetDate: '',
  recurrence: 0,
})

// ----- Computed: Progress -----
const completedCount = computed(() => todos.value.filter(t => t.isCompleted).length)
const totalCount = computed(() => todos.value.length)
const completionPercentage = computed(() => totalCount.value > 0 ? completedCount.value / totalCount.value : 0)

// ----- Range Label -----
const thMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const rangeLabel = computed(() => {
  const d = viewAnchor.value
  switch (selectedView.value) {
    case 'ทั้งหมด': return 'รายการทั้งหมด'
    case 'วัน': return `${d.getDate()} ${thMonths[d.getMonth() + 1]} ${d.getFullYear() + 543}`
    case 'เดือน': return `${thMonths[d.getMonth() + 1]} ${d.getFullYear() + 543}`
    default: return `${d.getFullYear() + 543}`
  }
})

// ----- View Navigation -----
const changeView = (v: string) => {
  selectedView.value = v
  loadTodos()
}

const shiftView = (delta: number) => {
  if (selectedView.value === 'ทั้งหมด') return
  const d = new Date(viewAnchor.value)
  if (selectedView.value === 'วัน') {
    d.setDate(d.getDate() + delta)
  } else if (selectedView.value === 'เดือน') {
    d.setMonth(d.getMonth() + delta)
  } else {
    d.setFullYear(d.getFullYear() + delta)
  }
  viewAnchor.value = d
  loadTodos()
}

// ----- Helpers -----
const parseRecurrence = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const n = parseInt(String(value))
  if (!isNaN(n)) return n
  switch (String(value).toLowerCase().trim()) {
    case 'daily': return 1
    case 'weekly': return 2
    case 'monthly': return 3
    case 'yearly': return 4
    default: return 0
  }
}

const recurrenceLabel = (value: string | number) => {
  switch (parseRecurrence(value)) {
    case 1: return 'ทุกวัน'
    case 2: return 'ทุกสัปดาห์'
    case 3: return 'ทุกเดือน'
    case 4: return 'ทุกปี'
    default: return ''
  }
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getDate()} ${thMonths[d.getMonth() + 1]} ${d.getFullYear() + 543}`
  } catch { return dateStr }
}

const getDueDateStyle = (item: TodoRow) => {
  if (item.isCompleted) return { color: 'var(--text-muted)' }
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const d = new Date(item.targetDate); d.setHours(0, 0, 0, 0)
    if (d < today) return { color: 'var(--ink-rose)' }
    if (d.getTime() === today.getTime()) return { color: 'var(--ink-amber)' }
  } catch {}
  return { color: 'var(--text-muted)' }
}

const tagColorMap: Record<string, { bg: string; border: string; color: string }> = {
  'เรียน':    { bg: 'var(--brand-soft)',                    border: 'var(--brand-border)',            color: 'var(--brand-ink)' },
  'งาน':     { bg: 'rgba(182, 133, 42, 0.12)',              border: 'rgba(182, 133, 42, 0.35)',        color: 'var(--ink-amber)' },
  'ส่วนตัว': { bg: 'rgba(139, 92, 246, 0.12)',              border: 'rgba(139, 92, 246, 0.35)',        color: '#a78bfa' },
  'สุขภาพ':  { bg: 'rgba(16, 185, 129, 0.12)',              border: 'rgba(16, 185, 129, 0.35)',        color: 'var(--ink-emerald)' },
  'ทั้งหมด': { bg: 'var(--brand-soft)',                    border: 'var(--brand-border)',            color: 'var(--brand-ink)' },
}

const getTagChipStyle = (tag: string, isSelected: boolean) => {
  const c = tagColorMap[tag] || { bg: 'var(--bg-elevated)', border: 'var(--border-subtle)', color: 'var(--text-secondary)' }
  if (isSelected) return { background: c.bg, border: `1px solid ${c.border}`, color: c.color }
  return { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
}

const getTagBadgeStyle = (tag: string) => {
  const c = tagColorMap[tag] || { bg: 'var(--bg-elevated)', border: 'var(--border-subtle)', color: 'var(--text-secondary)' }
  return { background: c.bg, border: `1px solid ${c.border}`, color: c.color }
}

// ----- API: Load Todos -----
const loadTodos = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const params = new URLSearchParams()
    if (selectedTag.value !== 'ทั้งหมด') params.append('tag', selectedTag.value)
    const d = viewAnchor.value
    if (selectedView.value !== 'ทั้งหมด') params.append('year', String(d.getFullYear()))
    if (selectedView.value === 'วัน' || selectedView.value === 'เดือน') params.append('month', String(d.getMonth() + 1))
    if (selectedView.value === 'วัน') params.append('day', String(d.getDate()))

    const query = params.toString() ? `?${params.toString()}` : ''
    const data = await apiFetch<BackendTodo[]>(`/api/Todo/${userId.value}${query}`)
    todos.value = (Array.isArray(data) ? data : []).map(item => ({
      ...item,
      recurrenceLabel: recurrenceLabel(item.recurrence),
    }))
  } catch (error: any) {
    console.error('Load todos error:', error)
    errorMessage.value = error?.data?.message || error?.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

// ----- API: Toggle Completion (ใช้ /completion endpoint เหมือน Mobile) -----
const toggleCompletion = async (item: TodoRow) => {
  const newCompleted = !item.isCompleted
  // Optimistic update
  item.isCompleted = newCompleted

  try {
    const completionDate = selectedView.value === 'วัน'
      ? viewAnchor.value
      : (item.targetDate ? new Date(item.targetDate) : new Date())

    await apiFetch(`/api/Todo/${item.id}/completion`, {
      method: 'PUT',
      body: {
        date: completionDate.toISOString(),
        isCompleted: newCompleted,
      },
    })
    toastSuccess(newCompleted ? 'ทำเสร็จเรียบร้อย! 🎉' : 'ยกเลิกการทำเครื่องหมาย')
  } catch (error: any) {
    // Rollback on fail
    item.isCompleted = !newCompleted
    console.error('Toggle completion error:', error)
    toastError('อัปเดตสถานะไม่สำเร็จ')
  }
}

// ----- Modal Logic -----
const openCreateModal = () => {
  editingId.value = ''
  form.title = ''
  form.tag = 'เรียน'
  form.targetDate = new Date().toISOString().slice(0, 10)
  form.recurrence = 0
  isModalOpen.value = true
}

const openEditModal = (item: TodoRow) => {
  editingId.value = item.id
  form.title = item.title
  form.tag = item.tag || 'เรียน'
  form.targetDate = item.targetDate ? item.targetDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  form.recurrence = parseRecurrence(item.recurrence)
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingId.value = ''
}

const submitTodo = async () => {
  if (isSubmitting.value) return
  if (!form.title.trim()) { toastError('กรุณาระบุรายการที่ต้องทำ'); return }
  isSubmitting.value = true
  try {
    const body = {
      userId: userId.value,
      title: form.title.trim(),
      description: null,
      targetDate: `${form.targetDate}T00:00:00`,
      tag: form.tag,
      recurrence: form.recurrence,
      status: 'pending',
      priority: 'medium',
      isCompleted: false,
    }
    if (editingId.value) {
      await apiFetch(`/api/Todo/${editingId.value}`, { method: 'PUT', body })
      toastSuccess('แก้ไขรายการสำเร็จ')
    } else {
      await apiFetch('/api/Todo', { method: 'POST', body })
      toastSuccess('เพิ่มรายการสำเร็จ')
    }
    closeModal()
    await loadTodos()
  } catch (error: any) {
    console.error('Save todo error:', error)
    toastError(error?.data?.message || error?.message || 'บันทึกไม่สำเร็จ')
  } finally {
    isSubmitting.value = false
  }
}

const deleteTodo = async (id: string) => {
  if (!id) return
  const confirmed = await confirmDelete('ยืนยันการลบรายการนี้?', 'จะไม่สามารถกู้คืนได้')
  if (!confirmed) return
  try {
    await apiFetch(`/api/Todo/${id}`, { method: 'DELETE' })
    toastSuccess('ลบรายการสำเร็จ')
    closeModal()
    await loadTodos()
  } catch (error: any) {
    console.error('Delete todo error:', error)
    toastError('ลบรายการไม่สำเร็จ')
  }
}

onMounted(() => { loadTodos() })
</script>
