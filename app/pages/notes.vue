<template>
  <AppTabsLayout>
    <main class="note-shell">
      <!-- Hero -->
      <header class="note-hero">
        <div class="note-hero-copy">
          <span class="note-kicker">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
            REMINDER NOTES
          </span>
          <h1>Note ของฉัน</h1>
          <p>จดบันทึกเรื่องสำคัญ พร้อมตั้งเวลาแจ้งเตือนและนับถอยหลังอย่างเป็นระเบียบ</p>
        </div>
        <button class="note-primary" type="button" @click="openCreateModal">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>เพิ่ม Note</span>
        </button>
      </header>

      <!-- Summary Metrics -->
      <section class="note-summary" aria-label="สรุป Note">
        <button
          type="button"
          class="note-stat"
          :class="{ 'is-selected': selectedFilter === 'all' }"
          @click="selectedFilter = 'all'"
        >
          <span class="note-stat-icon note-stat-icon--brand" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          </span>
          <div class="note-stat-body">
            <span>ทั้งหมด</span>
            <div class="note-stat-num">
              <strong>{{ notes.length }}</strong>
              <small>รายการ</small>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="note-stat"
          :class="{ 'is-selected': selectedFilter === 'upcoming' }"
          @click="selectedFilter = 'upcoming'"
        >
          <span class="note-stat-icon note-stat-icon--amber" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>
          <div class="note-stat-body">
            <span>รอแจ้งเตือน</span>
            <div class="note-stat-num">
              <strong>{{ upcomingCount }}</strong>
              <small>รายการ</small>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="note-stat"
          :class="{ 'is-selected': selectedFilter === 'plain' }"
          @click="selectedFilter = 'plain'"
        >
          <span class="note-stat-icon note-stat-icon--teal" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <div class="note-stat-body">
            <span>Note ธรรมดา</span>
            <div class="note-stat-num">
              <strong>{{ plainCount }}</strong>
              <small>ไม่ตั้งเวลา</small>
            </div>
          </div>
        </button>
      </section>

      <!-- Next Upcoming Countdown Spotlight -->
      <section
        v-if="!isLoading && nextUpcomingNote && nextUpcomingParts"
        class="note-spotlight"
        :class="`note-spotlight--${getCountdownInfo(nextUpcomingNote).tone}`"
        role="button"
        tabindex="0"
        aria-label="ดูรายละเอียด Note ที่ใกล้ถึงเวลาแจ้งเตือนถัดไป"
        @click="openEditModal(nextUpcomingNote)"
        @keydown.enter.prevent="openEditModal(nextUpcomingNote)"
      >
        <div class="note-spotlight-info">
          <span class="note-spotlight-kicker">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            ใกล้ถึงเวลาแจ้งเตือนถัดไป
          </span>
          <h2>{{ nextUpcomingNote.title }}</h2>
          <p class="note-spotlight-meta">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {{ formatReminder(nextUpcomingNote.remindAt!) }}
            <span class="note-dot-sep" aria-hidden="true" />
            {{ reminderAdvanceLabel(nextUpcomingNote.reminderMinutes ?? 15) }}
          </p>
        </div>

        <div class="note-spotlight-timer" aria-label="เวลานับถอยหลัง">
          <div v-if="nextUpcomingParts.days > 0" class="note-timer-unit">
            <strong>{{ nextUpcomingParts.days }}</strong>
            <span>วัน</span>
          </div>
          <div class="note-timer-unit">
            <strong>{{ pad2(nextUpcomingParts.hours) }}</strong>
            <span>ชม.</span>
          </div>
          <div class="note-timer-unit">
            <strong>{{ pad2(nextUpcomingParts.minutes) }}</strong>
            <span>นาที</span>
          </div>
          <div class="note-timer-unit">
            <strong>{{ pad2(nextUpcomingParts.seconds) }}</strong>
            <span>วินาที</span>
          </div>
        </div>
      </section>

      <!-- Toolbar -->
      <section class="note-toolbar">
        <label class="note-search">
          <svg class="note-search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input v-model.trim="searchQuery" type="search" placeholder="ค้นหาหัวข้อหรือข้อความ..." />
          <button
            v-if="searchQuery"
            type="button"
            class="note-search-clear"
            aria-label="ล้างคำค้นหา"
            @click="searchQuery = ''"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </label>

        <div class="note-toolbar-actions">
          <div class="note-filters" role="tablist" aria-label="ตัวกรอง Note">
            <button
              v-for="option in filterOptions"
              :key="option.value"
              type="button"
              role="tab"
              :aria-selected="selectedFilter === option.value"
              :class="{ active: selectedFilter === option.value }"
              @click="selectedFilter = option.value"
            >
              <span>{{ option.label }}</span>
              <em class="note-filter-count">{{ option.count }}</em>
            </button>
          </div>
          <button
            class="note-refresh"
            type="button"
            :disabled="isLoading"
            aria-label="รีเฟรชข้อมูล"
            title="รีเฟรชข้อมูล"
            @click="loadNotes"
          >
            <svg :class="{ spin: isLoading }" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11a8 8 0 0 0-14.8-4L3 10m0-5v5h5M4 13a8 8 0 0 0 14.8 4L21 14m0 5v-5h-5" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="note-alert" role="alert">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Loading Skeleton -->
      <section v-if="isLoading" class="note-grid" aria-label="กำลังโหลด">
        <div v-for="index in 6" :key="index" class="note-skeleton" />
      </section>

      <!-- Notes Grid -->
      <section v-else-if="filteredNotes.length" class="note-grid">
        <article
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :class="`note-card--${cardAccentState(note)}`"
          @click="openEditModal(note)"
        >
          <span class="note-card-accent" aria-hidden="true" />

          <div class="note-card-top">
            <span class="note-status" :class="reminderState(note)">
              <svg v-if="reminderState(note) === 'sent'" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.5 2.5 4.5-5" />
              </svg>
              <svg v-else-if="reminderState(note) === 'overdue'" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <svg v-else-if="reminderState(note) === 'upcoming'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span class="note-status-text">{{ reminderLabel(note) }}</span>
            </span>

            <button
              type="button"
              class="note-card-edit"
              aria-label="แก้ไข Note"
              title="แก้ไข Note"
              @click.stop="openEditModal(note)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>

          <h2 class="note-card-title">{{ note.title }}</h2>
          <p v-if="note.content" class="note-card-content">{{ note.content }}</p>
          <p v-else class="note-card-content note-empty-content">ไม่มีข้อความเพิ่มเติม</p>

          <div v-if="note.remindAt" class="note-countdown" :class="getCountdownInfo(note).tone">
            <span class="note-countdown-label">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>{{ getCountdownInfo(note).label }}</span>
            </span>
            <strong class="note-countdown-value">{{ getCountdownInfo(note).value }}</strong>
          </div>

          <footer class="note-card-footer">
            <span class="note-card-updated">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8v4l2.5 1.5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              แก้ไขล่าสุด {{ formatUpdatedAt(note.updatedAt) }}
            </span>
            <svg class="note-card-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </footer>
        </article>
      </section>

      <!-- Empty State -->
      <section v-else class="note-empty">
        <div class="note-empty-icon" aria-hidden="true">
          <svg v-if="searchQuery" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </div>
        <h2>{{ searchQuery ? 'ไม่พบ Note ที่ค้นหา' : 'ยังไม่มี Note ในหมวดนี้' }}</h2>
        <p>{{ searchQuery ? 'ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองอื่น' : 'เริ่มจดบันทึกเรื่องสำคัญและตั้งเวลาแจ้งเตือนได้เลย' }}</p>
        <button v-if="!searchQuery" type="button" class="note-empty-cta" @click="openCreateModal">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>สร้าง Note แรก</span>
        </button>
      </section>
    </main>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <Transition name="note-modal">
        <div v-if="isModalOpen" class="note-backdrop" @click.self="closeModal">
          <form class="note-modal" @submit.prevent="submitNote">
            <div class="note-modal-handle" aria-hidden="true" />
            <header class="note-modal-header">
              <div>
                <span class="note-modal-kicker">{{ editingId ? 'EDIT NOTE' : 'NEW NOTE' }}</span>
                <h2>{{ editingId ? 'แก้ไข Note' : 'เพิ่ม Note ใหม่' }}</h2>
              </div>
              <button type="button" class="note-modal-close" aria-label="ปิด" @click="closeModal">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div class="note-form-body">
              <label class="note-field">
                <span>หัวข้อ <em>*</em></span>
                <input v-model="form.title" type="text" maxlength="1000" placeholder="เรื่องที่อยากจำ" autofocus />
              </label>

              <label class="note-field">
                <span>ข้อความเพิ่มเติม</span>
                <textarea v-model="form.content" maxlength="4000" rows="5" placeholder="เขียนรายละเอียดเพิ่มเติมได้ที่นี่..." />
                <small>{{ form.content.length }}/4000</small>
              </label>

              <div class="note-reminder-box">
                <div class="note-reminder-head">
                  <div class="note-reminder-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M10 21h4" />
                    </svg>
                  </div>
                  <div class="note-reminder-copy">
                    <strong>แจ้งเตือน Note นี้</strong>
                    <p>เลือกปิดได้หากต้องการเก็บเป็น Note ธรรมดา</p>
                  </div>
                  <button
                    class="note-switch"
                    :class="{ on: form.reminderEnabled }"
                    type="button"
                    role="switch"
                    :aria-checked="form.reminderEnabled"
                    @click="toggleReminder"
                  ><i /></button>
                </div>

                <div v-if="form.reminderEnabled" class="note-datetime-wrap">
                  <div class="note-datetime-grid">
                    <label class="note-sub-field">
                      <span>วันและเวลาของ Note</span>
                      <input v-model="form.remindAt" type="datetime-local" :min="minimumReminderTime" />
                    </label>
                    <label class="note-sub-field">
                      <span>แจ้งเตือนล่วงหน้า</span>
                      <select v-model.number="form.reminderMinutes">
                        <option v-for="option in reminderOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                    </label>
                  </div>

                  <div v-if="formCountdownPreview" class="note-countdown note-countdown--preview" :class="formCountdownPreview.tone">
                    <span class="note-countdown-label">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      <span>{{ formCountdownPreview.label }}</span>
                    </span>
                    <strong class="note-countdown-value">{{ formCountdownPreview.value }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <footer class="note-modal-footer">
              <button v-if="editingId" class="note-delete" type="button" :disabled="isSubmitting" @click="deleteNote">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                </svg>
                <span>ลบ Note</span>
              </button>
              <span class="note-footer-spacer" />
              <button class="note-cancel" type="button" :disabled="isSubmitting" @click="closeModal">ยกเลิก</button>
              <button class="note-save" type="submit" :disabled="isSubmitting">
                <svg v-if="!isSubmitting" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก Note' }}</span>
              </button>
            </footer>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

type NoteRow = {
  id: string
  userId: string
  title: string
  content: string | null
  remindAt: string | null
  reminderMinutes: number
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

type NoteFilter = 'all' | 'upcoming' | 'plain' | 'sent'
type CountdownTone = 'normal' | 'soon' | 'imminent' | 'overdue' | 'sent'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Note & การแจ้งเตือน' })

const { apiFetch, userId } = useBackendApi()
const { toastSuccess, toastError, confirmDelete } = useAlert()

const notes = ref<NoteRow[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedFilter = ref<NoteFilter>('all')
const isModalOpen = ref(false)
const editingId = ref('')
const nowMs = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  title: '',
  content: '',
  reminderEnabled: false,
  remindAt: '',
  reminderMinutes: 15,
})

const reminderOptions = [
  { value: 5, label: '5 นาทีก่อน' },
  { value: 15, label: '15 นาทีก่อน' },
  { value: 30, label: '30 นาทีก่อน' },
  { value: 60, label: '1 ชั่วโมงก่อน' },
  { value: 120, label: '2 ชั่วโมงก่อน' },
  { value: 1440, label: '1 วันก่อน' },
]

const reminderAdvanceLabel = (minutes: number) =>
  reminderOptions.find(option => option.value === minutes)?.label || `${minutes} นาทีก่อน`

// Oracle TIMESTAMP does not retain DateTime.Kind, so API timestamps can arrive
// without a trailing timezone marker even though the backend stores UTC.
const parseApiDate = (value: string) => {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasTimeZone ? value : `${value}Z`)
}

const toLocalInput = (value: Date | string) => {
  const date = value instanceof Date ? value : parseApiDate(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const defaultReminderTime = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() + 30, 0, 0)
  return toLocalInput(date)
}

const minimumReminderTime = computed(() => toLocalInput(new Date(nowMs.value)))
const upcomingCount = computed(() => notes.value.filter(note => note.remindAt && !note.reminderSentAt && parseApiDate(note.remindAt).getTime() >= nowMs.value).length)
const plainCount = computed(() => notes.value.filter(note => !note.remindAt).length)
const sentCount = computed(() => notes.value.filter(note => Boolean(note.reminderSentAt)).length)

const filterOptions = computed<Array<{ label: string, value: NoteFilter, count: number }>>(() => [
  { label: 'ทั้งหมด', value: 'all', count: notes.value.length },
  { label: 'รอแจ้งเตือน', value: 'upcoming', count: upcomingCount.value },
  { label: 'Note ธรรมดา', value: 'plain', count: plainCount.value },
  { label: 'แจ้งแล้ว', value: 'sent', count: sentCount.value },
])

const nextUpcomingNote = computed(() => {
  const upcoming = notes.value
    .filter(note => note.remindAt && parseApiDate(note.remindAt).getTime() > nowMs.value)
    .sort((a, b) => parseApiDate(a.remindAt!).getTime() - parseApiDate(b.remindAt!).getTime())
  return upcoming[0] || null
})

const nextUpcomingParts = computed(() => {
  if (!nextUpcomingNote.value?.remindAt) return null
  const diffMs = Math.max(0, parseApiDate(nextUpcomingNote.value.remindAt).getTime() - nowMs.value)
  const totalSeconds = Math.floor(diffMs / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
})

const filteredNotes = computed(() => {
  const term = searchQuery.value.toLocaleLowerCase('th-TH')
  return notes.value.filter((note) => {
    const matchesSearch = !term || note.title.toLocaleLowerCase('th-TH').includes(term) || (note.content || '').toLocaleLowerCase('th-TH').includes(term)
    if (!matchesSearch) return false
    if (selectedFilter.value === 'plain') return !note.remindAt
    if (selectedFilter.value === 'sent') return Boolean(note.reminderSentAt)
    if (selectedFilter.value === 'upcoming') return Boolean(note.remindAt && !note.reminderSentAt && parseApiDate(note.remindAt).getTime() >= nowMs.value)
    return true
  })
})

const formatReminder = (value: string) => new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
}).format(parseApiDate(value))

const formatUpdatedAt = (value: string) => new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
}).format(parseApiDate(value))

const reminderState = (note: NoteRow) => {
  if (!note.remindAt) return 'plain'
  if (note.reminderSentAt) return 'sent'
  if (parseApiDate(note.remindAt).getTime() < nowMs.value) return 'overdue'
  return 'upcoming'
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const formatRemainingMs = (diffMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days} วัน ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
  if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
  return `${pad2(minutes)}:${pad2(seconds)}`
}

const formatElapsedMs = (elapsedMs: number) => {
  const totalMinutes = Math.max(1, Math.floor(elapsedMs / 60000))
  if (totalMinutes < 60) return `${totalMinutes} นาที`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) return minutes > 0 ? `${hours} ชม. ${minutes} น.` : `${hours} ชม.`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days} วัน ${remainHours} ชม.` : `${days} วัน`
}

const buildCountdown = (targetMs: number, isSent = false): { label: string, value: string, tone: CountdownTone } => {
  if (Number.isNaN(targetMs)) {
    return { label: 'นับถอยหลัง', value: '-', tone: 'normal' }
  }
  const diffMs = targetMs - nowMs.value
  if (diffMs > 0) {
    const tone: CountdownTone = diffMs <= 15 * 60 * 1000
      ? 'imminent'
      : diffMs <= 60 * 60 * 1000
        ? 'soon'
        : 'normal'
    return {
      label: isSent ? 'ถึงเวลาในอีก' : 'นับถอยหลัง',
      value: formatRemainingMs(diffMs),
      tone,
    }
  }
  if (isSent) {
    return {
      label: 'สถานะเวลา',
      value: 'ถึงเวลาแล้ว',
      tone: 'sent',
    }
  }
  return {
    label: 'เลยเวลามาแล้ว',
    value: formatElapsedMs(Math.abs(diffMs)),
    tone: 'overdue',
  }
}

const getCountdownInfo = (note: NoteRow) => {
  if (!note.remindAt) return { label: 'นับถอยหลัง', value: '-', tone: 'normal' as CountdownTone }
  return buildCountdown(parseApiDate(note.remindAt).getTime(), Boolean(note.reminderSentAt))
}

const cardAccentState = (note: NoteRow) => {
  if (!note.remindAt) return 'plain'
  return getCountdownInfo(note).tone
}

const formCountdownPreview = computed(() => {
  if (!form.reminderEnabled || !form.remindAt) return null
  const targetMs = new Date(form.remindAt).getTime()
  if (Number.isNaN(targetMs)) return null
  return buildCountdown(targetMs, false)
})

const reminderLabel = (note: NoteRow) => {
  const state = reminderState(note)
  if (state === 'plain') return 'Note ธรรมดา'
  if (state === 'sent') return `แจ้งแล้ว · ${formatReminder(note.remindAt!)}`
  if (state === 'overdue') return `เลยเวลา · ${formatReminder(note.remindAt!)}`
  return `${reminderAdvanceLabel(note.reminderMinutes ?? 15)} · ${formatReminder(note.remindAt!)}`
}

const getErrorMessage = (error: any, fallback: string) =>
  error?.data?.message || error?.data?.title || error?.message || fallback

const loadNotes = async () => {
  if (!userId.value) { isLoading.value = false; return }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await apiFetch<NoteRow[]>(`/api/Note/${userId.value}`)
    notes.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Load notes error:', error)
    errorMessage.value = getErrorMessage(error, 'โหลด Note ไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  editingId.value = ''
  form.title = ''
  form.content = ''
  form.reminderEnabled = false
  form.remindAt = defaultReminderTime()
  form.reminderMinutes = 15
  isModalOpen.value = true
}

const openEditModal = (note: NoteRow) => {
  editingId.value = note.id
  form.title = note.title
  form.content = note.content || ''
  form.reminderEnabled = Boolean(note.remindAt)
  form.remindAt = note.remindAt ? toLocalInput(note.remindAt) : defaultReminderTime()
  form.reminderMinutes = note.reminderMinutes ?? 15
  isModalOpen.value = true
}

const closeModal = () => {
  if (isSubmitting.value) return
  isModalOpen.value = false
  editingId.value = ''
}

const toggleReminder = () => {
  form.reminderEnabled = !form.reminderEnabled
  if (form.reminderEnabled && !form.remindAt) form.remindAt = defaultReminderTime()
}

const submitNote = async () => {
  if (isSubmitting.value) return
  if (!form.title.trim()) { toastError('กรุณาระบุหัวข้อ Note'); return }
  if (form.reminderEnabled && !form.remindAt) { toastError('กรุณาเลือกวันและเวลาแจ้งเตือน'); return }

  isSubmitting.value = true
  try {
    const body = {
      title: form.title.trim(),
      content: form.content.trim() || null,
      remindAt: form.reminderEnabled ? new Date(form.remindAt).toISOString() : null,
      reminderMinutes: form.reminderEnabled ? form.reminderMinutes : 15,
    }
    if (editingId.value) {
      await apiFetch(`/api/Note/${editingId.value}`, { method: 'PUT', body })
      toastSuccess('แก้ไข Note แล้ว')
    } else {
      await apiFetch('/api/Note', { method: 'POST', body })
      toastSuccess('เพิ่ม Note แล้ว')
    }
    isModalOpen.value = false
    editingId.value = ''
    await loadNotes()
  } catch (error: any) {
    console.error('Save note error:', error)
    toastError(getErrorMessage(error, 'บันทึก Note ไม่สำเร็จ'))
  } finally {
    isSubmitting.value = false
  }
}

const deleteNote = async () => {
  if (!editingId.value || isSubmitting.value) return
  const confirmed = await confirmDelete('ลบ Note นี้?', 'Note และเวลาแจ้งเตือนจะถูกลบถาวร')
  if (!confirmed) return

  isSubmitting.value = true
  try {
    await apiFetch(`/api/Note/${editingId.value}`, { method: 'DELETE' })
    toastSuccess('ลบ Note แล้ว')
    isModalOpen.value = false
    editingId.value = ''
    await loadNotes()
  } catch (error: any) {
    console.error('Delete note error:', error)
    toastError(getErrorMessage(error, 'ลบ Note ไม่สำเร็จ'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadNotes()
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
/* =====================================================================
   NOTE PAGE — Calm, refined Light/Dark UI aligned with Quiet Ledger
   ===================================================================== */
.note-shell {
  width: min(1160px, 100%);
  margin: 0 auto;
  padding: 36px 28px 110px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.note-shell *,
.note-modal * {
  box-sizing: border-box;
}

/* --- Hero --- */
.note-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  margin-bottom: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background:
    radial-gradient(circle at 92% 10%, var(--brand-soft), transparent 45%),
    var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.note-hero-copy {
  min-width: 0;
}

.note-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.note-kicker svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-hero h1 {
  margin: 12px 0 6px;
  font-size: clamp(26px, 3.6vw, 36px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text-primary);
}

.note-hero p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.55;
}

.note-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 14px;
  background: var(--brand);
  color: var(--brand-on);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: var(--brand-glow);
  cursor: pointer;
  transition: transform 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}

.note-primary:hover {
  background: var(--brand-strong);
  transform: translateY(-1px);
}

.note-primary:active {
  transform: scale(0.98);
}

.note-primary svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
}

/* --- Summary Stats --- */
.note-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.note-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--bg-card);
  color: inherit;
  text-align: left;
  font: inherit;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.note-stat:hover {
  border-color: var(--brand-border);
  background: var(--bg-card-hover);
  transform: translateY(-1px);
}

.note-stat.is-selected {
  border-color: var(--brand-border);
  box-shadow: 0 0 0 1px var(--brand-border), var(--shadow-sm);
}

.note-stat-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  flex-shrink: 0;
}

.note-stat-icon svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-stat-icon--brand {
  background: var(--brand-soft);
  color: var(--brand-ink);
}

.note-stat-icon--amber {
  background: color-mix(in srgb, var(--ink-amber) 13%, transparent);
  color: var(--ink-amber);
}

.note-stat-icon--teal {
  background: color-mix(in srgb, var(--ink-teal) 13%, transparent);
  color: var(--ink-teal);
}

.note-stat-body {
  min-width: 0;
}

.note-stat-body > span {
  display: block;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.note-stat-num {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 2px;
}

.note-stat-num strong {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.note-stat-num small {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
}

/* --- Spotlight Countdown --- */
.note-spotlight {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  margin-bottom: 18px;
  border: 1px solid var(--brand-border);
  border-radius: 20px;
  background:
    linear-gradient(135deg, var(--brand-soft), transparent 55%),
    var(--bg-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.note-spotlight:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.note-spotlight--soon {
  border-color: color-mix(in srgb, var(--ink-amber) 34%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--ink-amber) 11%, transparent), transparent 55%),
    var(--bg-card);
}

.note-spotlight--imminent {
  border-color: color-mix(in srgb, var(--ink-rose) 36%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--ink-rose) 11%, transparent), transparent 55%),
    var(--bg-card);
}

.note-spotlight-info {
  min-width: 0;
  flex: 1;
}

.note-spotlight-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-ink);
}

.note-spotlight--soon .note-spotlight-kicker {
  color: var(--ink-amber);
}

.note-spotlight--imminent .note-spotlight-kicker {
  color: var(--ink-rose);
}

.note-spotlight-kicker svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-spotlight h2 {
  margin: 6px 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-spotlight-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.note-spotlight-meta svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.note-dot-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-strong);
}

.note-spotlight-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.note-timer-unit {
  min-width: 56px;
  padding: 9px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 13px;
  background: var(--bg-elevated);
  text-align: center;
}

.note-timer-unit strong {
  display: block;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.note-spotlight--soon .note-timer-unit strong {
  color: var(--ink-amber);
}

.note-spotlight--imminent .note-timer-unit strong {
  color: var(--ink-rose);
}

.note-timer-unit span {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
}

/* --- Toolbar --- */
.note-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 20px 0 18px;
}

.note-search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.note-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: translateY(-50%);
  pointer-events: none;
}

.note-search input {
  width: 100%;
  height: 44px;
  padding: 0 38px 0 40px;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: 13px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.note-search input::placeholder {
  color: var(--text-muted);
}

.note-search input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.note-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  transform: translateY(-50%);
  cursor: pointer;
}

.note-search-clear:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.note-search-clear svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.note-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.note-filters {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border-subtle);
  border-radius: 13px;
  background: var(--bg-elevated);
}

.note-filters button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.note-filters button:hover {
  color: var(--text-primary);
}

.note-filters button.active {
  background: var(--bg-card);
  color: var(--brand-ink);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.note-filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--bg-elevated-2);
  color: var(--text-muted);
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.note-filters button.active .note-filter-count {
  background: var(--brand-soft);
  color: var(--brand-ink);
}

.note-refresh {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  background: var(--bg-card);
  color: var(--text-secondary);
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease;
}

.note-refresh:hover {
  border-color: var(--brand-border);
  color: var(--brand-ink);
  background: var(--bg-card-hover);
}

.note-refresh svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.spin {
  animation: note-spin 0.8s linear infinite;
}

@keyframes note-spin {
  to { transform: rotate(360deg); }
}

/* --- Error Alert --- */
.note-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  padding: 13px 16px;
  border: 1px solid color-mix(in srgb, var(--ink-rose) 32%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--ink-rose) 10%, transparent);
  color: var(--ink-rose);
  font-size: 13px;
  font-weight: 600;
}

.note-alert svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

/* --- Notes Grid & Cards --- */
.note-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.note-card {
  position: relative;
  min-height: 236px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: var(--brand-border);
  background: var(--bg-card-hover);
  box-shadow: var(--shadow-md);
}

.note-card-accent {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  border-radius: 0 0 999px 999px;
  background: var(--border-default);
  opacity: 0.7;
}

.note-card--normal .note-card-accent {
  background: var(--brand);
  opacity: 0.85;
}

.note-card--soon .note-card-accent {
  background: var(--ink-amber);
  opacity: 0.9;
}

.note-card--imminent .note-card-accent,
.note-card--overdue .note-card-accent {
  background: var(--ink-rose);
  opacity: 0.9;
}

.note-card--sent .note-card-accent {
  background: var(--ink-emerald);
  opacity: 0.85;
}

.note-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 38px);
  padding: 5px 10px;
  overflow: hidden;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.note-status svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.note-status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-status.upcoming {
  background: var(--brand-soft);
  color: var(--brand-ink);
}

.note-status.plain {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.note-status.sent {
  background: color-mix(in srgb, var(--ink-emerald) 13%, transparent);
  color: var(--ink-emerald);
}

.note-status.overdue {
  background: color-mix(in srgb, var(--ink-rose) 12%, transparent);
  color: var(--ink-rose);
}

.note-card-edit {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-muted);
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.note-card-edit:hover {
  background: var(--bg-elevated);
  color: var(--brand-ink);
}

.note-card-edit svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-card-title {
  display: -webkit-box;
  margin: 16px 0 8px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.note-card-content {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-line;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.note-card-content.note-empty-content {
  color: var(--text-muted);
  font-style: italic;
}

/* --- Countdown Pill --- */
.note-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding: 9px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--bg-elevated);
  min-width: 0;
}

.note-countdown--preview {
  margin-top: 10px;
}

.note-countdown-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  white-space: nowrap;
}

.note-countdown-label svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-countdown-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: var(--brand-ink);
  white-space: nowrap;
}

.note-countdown.normal {
  background: var(--brand-soft);
  border-color: var(--brand-border);
}

.note-countdown.normal .note-countdown-label {
  color: var(--brand-ink);
}

.note-countdown.soon {
  background: color-mix(in srgb, var(--ink-amber) 12%, transparent);
  border-color: color-mix(in srgb, var(--ink-amber) 28%, transparent);
}

.note-countdown.soon .note-countdown-label,
.note-countdown.soon .note-countdown-value {
  color: var(--ink-amber);
}

.note-countdown.imminent,
.note-countdown.overdue {
  background: color-mix(in srgb, var(--ink-rose) 11%, transparent);
  border-color: color-mix(in srgb, var(--ink-rose) 28%, transparent);
}

.note-countdown.imminent .note-countdown-label,
.note-countdown.imminent .note-countdown-value,
.note-countdown.overdue .note-countdown-label,
.note-countdown.overdue .note-countdown-value {
  color: var(--ink-rose);
}

.note-countdown.sent {
  background: color-mix(in srgb, var(--ink-emerald) 11%, transparent);
  border-color: color-mix(in srgb, var(--ink-emerald) 26%, transparent);
}

.note-countdown.sent .note-countdown-label,
.note-countdown.sent .note-countdown-value {
  color: var(--ink-emerald);
}

/* --- Card Footer --- */
.note-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.note-card-content {
  margin-bottom: 14px;
}

.note-card > .note-countdown {
  margin-top: 0;
  margin-bottom: 14px;
}

.note-countdown--preview {
  margin: 10px 0 0;
}

.note-card-updated {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card-updated svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-card-arrow {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.16s ease;
}

.note-card:hover .note-card-arrow {
  transform: translateX(2px);
  color: var(--brand-ink);
}

/* --- Skeleton --- */
.note-skeleton {
  height: 236px;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: var(--bg-elevated);
  animation: note-pulse 1.1s ease-in-out infinite alternate;
}

@keyframes note-pulse {
  to { opacity: 0.48; }
}

/* --- Empty State --- */
.note-empty {
  padding: 64px 24px;
  border: 1px dashed var(--border-default);
  border-radius: 24px;
  background: var(--bg-card);
  text-align: center;
}

.note-empty-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  border-radius: 18px;
  background: var(--brand-soft);
  color: var(--brand-ink);
}

.note-empty-icon svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-empty h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.note-empty p {
  margin: 8px auto 20px;
  max-width: 380px;
  color: var(--text-secondary);
  font-size: 13px;
}

.note-empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--brand-border);
  border-radius: 12px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.note-empty-cta:hover {
  background: var(--brand-soft-hover);
}

.note-empty-cta svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.3;
  stroke-linecap: round;
}

/* --- Modal --- */
.note-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgba(9, 19, 33, 0.56);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.note-modal {
  width: min(560px, 100%);
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: 24px;
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}

.note-modal-handle {
  display: none;
}

.note-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.note-modal-kicker {
  display: block;
  color: var(--brand-ink);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.note-modal-header h2 {
  margin: 4px 0 0;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.note-modal-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.note-modal-close:hover {
  background: var(--bg-elevated-2);
  color: var(--text-primary);
}

.note-modal-close svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.note-form-body {
  display: grid;
  gap: 16px;
  padding: 22px 24px;
}

.note-field {
  position: relative;
  display: grid;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.note-field em {
  color: var(--ink-rose);
  font-style: normal;
}

.note-form-body input,
.note-form-body textarea,
.note-form-body select {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  outline: none;
  resize: vertical;
  background: var(--bg-elevated);
  color: var(--text-primary);
  font: inherit;
  font-size: 13.5px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.note-form-body input,
.note-form-body select {
  min-height: 44px;
}

.note-form-body input:focus,
.note-form-body textarea:focus,
.note-form-body select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.note-field small {
  position: absolute;
  right: 10px;
  bottom: 8px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
}

.note-reminder-box {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--bg-elevated);
}

.note-reminder-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-reminder-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 11px;
  background: var(--brand-soft);
  color: var(--brand-ink);
}

.note-reminder-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-reminder-copy {
  min-width: 0;
}

.note-reminder-copy strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.note-reminder-copy p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.note-switch {
  position: relative;
  width: 44px;
  height: 25px;
  margin-left: auto;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: var(--border-strong);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.note-switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.22);
  transition: transform 0.2s ease;
}

.note-switch.on {
  background: var(--brand);
}

.note-switch.on i {
  transform: translateX(19px);
}

.note-datetime-wrap {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.note-datetime-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 10px;
}

.note-sub-field {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.note-modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}

.note-footer-spacer {
  flex: 1;
}

.note-modal-footer button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 41px;
  padding: 0 16px;
  border-radius: 11px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
}

.note-modal-footer button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.note-delete {
  border: 1px solid color-mix(in srgb, var(--ink-rose) 32%, transparent);
  background: transparent;
  color: var(--ink-rose);
}

.note-delete:hover {
  background: color-mix(in srgb, var(--ink-rose) 10%, transparent);
}

.note-cancel {
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.note-cancel:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.note-save {
  border: 0;
  background: var(--brand);
  color: var(--brand-on);
}

.note-save:hover {
  background: var(--brand-strong);
}

.note-modal button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.note-modal-enter-active,
.note-modal-leave-active {
  transition: opacity 0.2s ease;
}

.note-modal-enter-from,
.note-modal-leave-to {
  opacity: 0;
}

/* =====================================================================
   TABLET (<= 960px)
   ===================================================================== */
@media (max-width: 960px) {
  .note-shell {
    padding: 28px 20px 104px;
  }

  .note-hero {
    padding: 22px 24px;
  }

  .note-spotlight {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .note-spotlight-timer {
    justify-content: flex-start;
  }

  .note-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .note-toolbar-actions {
    width: 100%;
  }

  .note-filters {
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .note-filters::-webkit-scrollbar {
    display: none;
  }

  .note-filters button {
    flex: 1;
  }

  .note-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =====================================================================
   MOBILE (<= 600px)
   ===================================================================== */
@media (max-width: 600px) {
  .note-shell {
    padding: 18px 14px 100px;
  }

  .note-hero {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px 18px;
    border-radius: 20px;
  }

  .note-hero h1 {
    font-size: 24px;
  }

  .note-hero p {
    font-size: 13px;
  }

  .note-primary {
    width: 100%;
    min-height: 44px;
  }

  .note-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .note-stat:first-child {
    grid-column: 1 / -1;
  }

  .note-stat {
    padding: 13px 14px;
    gap: 11px;
    border-radius: 16px;
  }

  .note-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 11px;
  }

  .note-stat-num strong {
    font-size: 20px;
  }

  .note-spotlight {
    padding: 16px;
    border-radius: 18px;
  }

  .note-spotlight-timer {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    width: 100%;
    gap: 6px;
  }

  .note-timer-unit {
    min-width: 0;
    padding: 8px 6px;
  }

  .note-timer-unit strong {
    font-size: 16px;
  }

  .note-toolbar {
    gap: 10px;
    margin: 16px 0 14px;
  }

  .note-filters button {
    padding: 0 10px;
    font-size: 11.5px;
  }

  .note-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .note-card {
    min-height: 196px;
    padding: 17px 16px;
    border-radius: 18px;
  }

  .note-datetime-grid {
    grid-template-columns: 1fr;
  }

  .note-backdrop {
    align-items: end;
    padding: 0;
  }

  .note-modal {
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 24px 24px 0 0;
    border-bottom: 0;
  }

  .note-modal-handle {
    display: block;
    width: 38px;
    height: 4px;
    margin: 10px auto 0;
    border-radius: 999px;
    background: var(--border-strong);
  }

  .note-modal-header {
    padding: 14px 18px 14px;
  }

  .note-form-body {
    padding: 16px 18px;
  }

  .note-modal-footer {
    flex-wrap: wrap;
    padding: 14px 18px 20px;
  }

  .note-footer-spacer {
    display: none;
  }

  .note-delete {
    margin-right: auto;
  }
}
</style>
