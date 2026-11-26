<template>
  <AppTabsLayout>
    <main class="note-shell">
      <header class="note-hero">
        <div>
          <span class="note-kicker">REMINDER NOTES</span>
          <h1>Note ของฉัน</h1>
          <p>จดสิ่งที่อยากจำ และเลือกให้แจ้งเตือนเมื่อถึงเวลาที่ต้องการ</p>
        </div>
        <button class="note-primary" type="button" @click="openCreateModal">
          <span>＋</span> เพิ่ม Note
        </button>
      </header>

      <section class="note-summary" aria-label="สรุป Note">
        <article>
          <span>ทั้งหมด</span>
          <strong>{{ notes.length }}</strong>
          <small>รายการ</small>
        </article>
        <article>
          <span>กำลังรอแจ้งเตือน</span>
          <strong>{{ upcomingCount }}</strong>
          <small>รายการ</small>
        </article>
        <article>
          <span>Note ธรรมดา</span>
          <strong>{{ plainCount }}</strong>
          <small>ไม่ตั้งเวลา</small>
        </article>
      </section>

      <section class="note-toolbar">
        <label class="note-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input v-model.trim="searchQuery" type="search" placeholder="ค้นหาหัวข้อหรือข้อความ..." />
        </label>
        <div class="note-filters" aria-label="ตัวกรอง Note">
          <button
            v-for="option in filterOptions"
            :key="option.value"
            type="button"
            :class="{ active: selectedFilter === option.value }"
            @click="selectedFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="note-refresh" type="button" :disabled="isLoading" aria-label="รีเฟรช" @click="loadNotes">
          <svg :class="{ spin: isLoading }" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.8-4L3 10m0-5v5h5M4 13a8 8 0 0 0 14.8 4L21 14m0 5v-5h-5"/></svg>
        </button>
      </section>

      <div v-if="errorMessage" class="note-alert">{{ errorMessage }}</div>

      <section v-if="isLoading" class="note-grid" aria-label="กำลังโหลด">
        <div v-for="index in 6" :key="index" class="note-skeleton" />
      </section>

      <section v-else-if="filteredNotes.length" class="note-grid">
        <article v-for="note in filteredNotes" :key="note.id" class="note-card" @click="openEditModal(note)">
          <div class="note-card-top">
            <span class="note-status" :class="reminderState(note)">
              <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              {{ reminderLabel(note) }}
            </span>
            <button type="button" aria-label="แก้ไข Note" @click.stop="openEditModal(note)">•••</button>
          </div>
          <h2>{{ note.title }}</h2>
          <p v-if="note.content">{{ note.content }}</p>
          <p v-else class="note-empty-content">ไม่มีข้อความเพิ่มเติม</p>
          <footer>
            <span>แก้ไขล่าสุด {{ formatUpdatedAt(note.updatedAt) }}</span>
            <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </footer>
        </article>
      </section>

      <section v-else class="note-empty">
        <div>🔔</div>
        <h2>{{ searchQuery ? 'ไม่พบ Note ที่ค้นหา' : 'ยังไม่มี Note' }}</h2>
        <p>{{ searchQuery ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เริ่มจดเรื่องที่อยากให้ตัวเองจำไว้' }}</p>
        <button v-if="!searchQuery" type="button" @click="openCreateModal">สร้าง Note แรก</button>
      </section>
    </main>

    <Teleport to="body">
      <Transition name="note-modal">
        <div v-if="isModalOpen" class="note-backdrop" @click.self="closeModal">
          <form class="note-modal" @submit.prevent="submitNote">
            <header>
              <div>
                <span>{{ editingId ? 'EDIT NOTE' : 'NEW NOTE' }}</span>
                <h2>{{ editingId ? 'แก้ไข Note' : 'เพิ่ม Note ใหม่' }}</h2>
              </div>
              <button type="button" aria-label="ปิด" @click="closeModal">×</button>
            </header>

            <div class="note-form-body">
              <label>
                <span>หัวข้อ <em>*</em></span>
                <input v-model="form.title" type="text" maxlength="1000" placeholder="เรื่องที่อยากจำ" autofocus />
              </label>
              <label>
                <span>ข้อความเพิ่มเติม</span>
                <textarea v-model="form.content" maxlength="4000" rows="5" placeholder="เขียนรายละเอียดเพิ่มเติมได้ที่นี่..." />
                <small>{{ form.content.length }}/4000</small>
              </label>

              <div class="note-reminder-box">
                <div>
                  <div class="note-reminder-icon">🔔</div>
                  <div>
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
                <label v-if="form.reminderEnabled" class="note-datetime">
                  <span>วันและเวลาที่แจ้งเตือน</span>
                  <input v-model="form.remindAt" type="datetime-local" :min="minimumReminderTime" />
                </label>
              </div>
            </div>

            <footer>
              <button v-if="editingId" class="note-delete" type="button" :disabled="isSubmitting" @click="deleteNote">ลบ Note</button>
              <span />
              <button class="note-cancel" type="button" :disabled="isSubmitting" @click="closeModal">ยกเลิก</button>
              <button class="note-save" type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก Note' }}
              </button>
            </footer>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

type NoteRow = {
  id: string
  userId: string
  title: string
  content: string | null
  remindAt: string | null
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

type NoteFilter = 'all' | 'upcoming' | 'plain' | 'sent'

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

const form = reactive({
  title: '',
  content: '',
  reminderEnabled: false,
  remindAt: '',
})

const filterOptions: Array<{ label: string, value: NoteFilter }> = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รอแจ้งเตือน', value: 'upcoming' },
  { label: 'Note ธรรมดา', value: 'plain' },
  { label: 'แจ้งแล้ว', value: 'sent' },
]

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

const minimumReminderTime = computed(() => toLocalInput(new Date()))
const upcomingCount = computed(() => notes.value.filter(note => note.remindAt && !note.reminderSentAt && parseApiDate(note.remindAt).getTime() >= Date.now()).length)
const plainCount = computed(() => notes.value.filter(note => !note.remindAt).length)

const filteredNotes = computed(() => {
  const term = searchQuery.value.toLocaleLowerCase('th-TH')
  return notes.value.filter((note) => {
    const matchesSearch = !term || note.title.toLocaleLowerCase('th-TH').includes(term) || (note.content || '').toLocaleLowerCase('th-TH').includes(term)
    if (!matchesSearch) return false
    if (selectedFilter.value === 'plain') return !note.remindAt
    if (selectedFilter.value === 'sent') return Boolean(note.reminderSentAt)
    if (selectedFilter.value === 'upcoming') return Boolean(note.remindAt && !note.reminderSentAt && parseApiDate(note.remindAt).getTime() >= Date.now())
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
  if (parseApiDate(note.remindAt).getTime() < Date.now()) return 'overdue'
  return 'upcoming'
}

const reminderLabel = (note: NoteRow) => {
  const state = reminderState(note)
  if (state === 'plain') return 'ไม่ตั้งเวลา'
  if (state === 'sent') return `แจ้งแล้ว · ${formatReminder(note.remindAt!)}`
  if (state === 'overdue') return `เลยเวลา · ${formatReminder(note.remindAt!)}`
  return formatReminder(note.remindAt!)
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
  isModalOpen.value = true
}

const openEditModal = (note: NoteRow) => {
  editingId.value = note.id
  form.title = note.title
  form.content = note.content || ''
  form.reminderEnabled = Boolean(note.remindAt)
  form.remindAt = note.remindAt ? toLocalInput(note.remindAt) : defaultReminderTime()
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

onMounted(loadNotes)
</script>

<style scoped>
.note-shell { width: min(1160px, 100%); margin: 0 auto; padding: 44px 28px 110px; color: var(--text-primary); }
.note-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.note-kicker { color: var(--brand-ink); font-size: 11px; font-weight: 900; letter-spacing: .18em; }
.note-hero h1 { margin: 8px 0 7px; font-size: clamp(30px, 5vw, 48px); letter-spacing: -.055em; line-height: 1; }
.note-hero p { margin: 0; color: var(--text-muted); font-size: 14px; }
.note-primary { display: flex; align-items: center; gap: 7px; min-height: 46px; padding: 0 18px; border: 0; border-radius: 14px; background: var(--brand); color: var(--brand-on); font: inherit; font-size: 13px; font-weight: 900; box-shadow: var(--shadow-md); cursor: pointer; }
.note-primary span { font-size: 20px; font-weight: 400; }
.note-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
.note-summary article { min-height: 108px; padding: 19px 21px; border: 1px solid var(--border-subtle); border-radius: 20px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.note-summary span { display: block; color: var(--text-muted); font-size: 11px; font-weight: 800; }
.note-summary strong { display: inline-block; margin-top: 9px; font-size: 30px; letter-spacing: -.05em; }
.note-summary small { margin-left: 7px; color: var(--text-muted); font-size: 11px; }
.note-toolbar { display: flex; align-items: center; gap: 10px; margin: 22px 0 16px; }
.note-search { position: relative; flex: 1; }
.note-search svg { position: absolute; left: 14px; top: 50%; width: 18px; fill: none; stroke: var(--text-muted); stroke-width: 2; transform: translateY(-50%); }
.note-search input { width: 100%; height: 44px; padding: 0 14px 0 42px; border: 1px solid var(--border-default); border-radius: 13px; outline: none; background: var(--bg-card); color: var(--text-primary); font: inherit; font-size: 12px; }
.note-search input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-ring); }
.note-filters { display: flex; gap: 5px; padding: 4px; border: 1px solid var(--border-subtle); border-radius: 13px; background: var(--bg-elevated); }
.note-filters button { height: 34px; padding: 0 11px; border: 0; border-radius: 9px; background: transparent; color: var(--text-muted); font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
.note-filters button.active { background: var(--bg-card); color: var(--brand-ink); box-shadow: var(--shadow-sm); }
.note-refresh { display: grid; width: 44px; height: 44px; place-items: center; border: 1px solid var(--border-default); border-radius: 13px; background: var(--bg-card); color: var(--text-secondary); cursor: pointer; }
.note-refresh svg { width: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.spin { animation: note-spin .8s linear infinite; }
@keyframes note-spin { to { transform: rotate(360deg); } }
.note-alert { margin: 14px 0; padding: 13px 16px; border: 1px solid color-mix(in srgb, var(--ink-rose) 35%, transparent); border-radius: 13px; background: color-mix(in srgb, var(--ink-rose) 9%, transparent); color: var(--ink-rose); font-size: 12px; font-weight: 700; }
.note-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
.note-card { min-height: 230px; display: flex; flex-direction: column; padding: 19px; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 21px; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform .2s, border-color .2s, box-shadow .2s; }
.note-card:hover { transform: translateY(-3px); border-color: var(--brand-border); box-shadow: var(--shadow-md); }
.note-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.note-card-top > button { border: 0; background: transparent; color: var(--text-muted); font-weight: 900; letter-spacing: 2px; cursor: pointer; }
.note-status { display: inline-flex; align-items: center; gap: 6px; max-width: calc(100% - 35px); padding: 6px 9px; overflow: hidden; border-radius: 8px; font-size: 9px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
.note-status svg { width: 12px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.note-status.upcoming { background: var(--brand-soft); color: var(--brand-ink); }
.note-status.plain { background: var(--bg-elevated); color: var(--text-muted); }
.note-status.sent { background: rgba(16, 185, 129, .12); color: var(--ink-emerald); }
.note-status.overdue { background: rgba(239, 68, 68, .1); color: var(--ink-rose); }
.note-card h2 { margin: 20px 0 8px; overflow: hidden; font-size: 17px; letter-spacing: -.025em; text-overflow: ellipsis; white-space: nowrap; }
.note-card > p { display: -webkit-box; margin: 0; overflow: hidden; color: var(--text-secondary); font-size: 12px; line-height: 1.75; white-space: pre-line; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.note-card > p.note-empty-content { color: var(--text-muted); font-style: italic; }
.note-card footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 18px; color: var(--text-muted); font-size: 9px; font-weight: 700; }
.note-card footer svg { width: 16px; fill: none; stroke: currentColor; stroke-width: 2; }
.note-skeleton { height: 230px; border-radius: 21px; background: var(--bg-elevated); animation: note-pulse 1s ease-in-out infinite alternate; }
@keyframes note-pulse { to { opacity: .45; } }
.note-empty { padding: 75px 20px; text-align: center; }
.note-empty > div { display: grid; width: 62px; height: 62px; margin: 0 auto 16px; place-items: center; border-radius: 20px; background: var(--brand-soft); font-size: 28px; }
.note-empty h2 { margin: 0; font-size: 19px; }
.note-empty p { margin: 7px 0 18px; color: var(--text-muted); font-size: 12px; }
.note-empty button { border: 0; background: transparent; color: var(--brand-ink); font: inherit; font-size: 12px; font-weight: 900; cursor: pointer; }
.note-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; padding: 18px; place-items: center; background: rgba(3, 8, 18, .65); backdrop-filter: blur(10px); }
.note-modal { width: min(540px, 100%); overflow: hidden; border: 1px solid var(--border-default); border-radius: 25px; background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-lg); }
.note-modal > header { display: flex; align-items: flex-start; justify-content: space-between; padding: 23px 24px 18px; border-bottom: 1px solid var(--border-subtle); }
.note-modal > header span { color: var(--brand-ink); font-size: 9px; font-weight: 900; letter-spacing: .16em; }
.note-modal > header h2 { margin: 6px 0 0; font-size: 23px; letter-spacing: -.04em; }
.note-modal > header button { width: 32px; height: 32px; border: 0; border-radius: 9px; background: var(--bg-elevated); color: var(--text-muted); font-size: 23px; cursor: pointer; }
.note-form-body { display: grid; gap: 18px; padding: 22px 24px; }
.note-form-body > label { position: relative; display: grid; gap: 8px; color: var(--text-secondary); font-size: 11px; font-weight: 800; }
.note-form-body label em { color: var(--ink-rose); font-style: normal; }
.note-form-body input, .note-form-body textarea { width: 100%; padding: 11px 13px; border: 1px solid var(--border-default); border-radius: 12px; outline: none; resize: vertical; background: var(--bg-elevated); color: var(--text-primary); font: inherit; font-size: 13px; }
.note-form-body input { min-height: 44px; }
.note-form-body input:focus, .note-form-body textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-ring); }
.note-form-body > label small { position: absolute; right: 9px; bottom: 7px; color: var(--text-muted); font-size: 8px; }
.note-reminder-box { padding: 15px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-elevated); }
.note-reminder-box > div { display: flex; align-items: center; gap: 11px; }
.note-reminder-icon { display: grid; width: 36px; height: 36px; flex: 0 0 auto; place-items: center; border-radius: 11px; background: var(--brand-soft); }
.note-reminder-box strong { display: block; font-size: 11px; }
.note-reminder-box p { margin: 3px 0 0; color: var(--text-muted); font-size: 9px; }
.note-switch { position: relative; width: 42px; height: 24px; margin-left: auto; flex: 0 0 auto; border: 0; border-radius: 99px; background: var(--border-strong); cursor: pointer; transition: background .2s; }
.note-switch i { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,.2); transition: transform .2s; }
.note-switch.on { background: var(--brand); }
.note-switch.on i { transform: translateX(18px); }
.note-datetime { display: grid; gap: 7px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 10px; font-weight: 800; }
.note-modal > footer { display: flex; align-items: center; gap: 8px; padding: 15px 24px; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
.note-modal > footer span { flex: 1; }
.note-modal > footer button { min-height: 39px; padding: 0 14px; border-radius: 10px; font: inherit; font-size: 11px; font-weight: 900; cursor: pointer; }
.note-delete { border: 1px solid rgba(239,68,68,.25); background: transparent; color: var(--ink-rose); }
.note-cancel { border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); }
.note-save { border: 0; background: var(--brand); color: var(--brand-on); }
.note-modal button:disabled { opacity: .55; cursor: not-allowed; }
.note-modal-enter-active, .note-modal-leave-active { transition: opacity .2s; }
.note-modal-enter-from, .note-modal-leave-to { opacity: 0; }
@media (max-width: 850px) {
  .note-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .note-toolbar { align-items: stretch; flex-wrap: wrap; }
  .note-search { flex-basis: calc(100% - 54px); }
  .note-filters { order: 3; width: 100%; overflow-x: auto; }
  .note-filters button { flex: 1; white-space: nowrap; }
}
@media (max-width: 580px) {
  .note-shell { padding: 27px 14px 100px; }
  .note-hero { align-items: stretch; flex-direction: column; }
  .note-primary { justify-content: center; }
  .note-summary { grid-template-columns: 1fr 1fr; }
  .note-summary article:first-child { grid-column: 1 / -1; }
  .note-grid { grid-template-columns: 1fr; }
  .note-card { min-height: 205px; }
  .note-backdrop { align-items: end; padding: 0; }
  .note-modal { max-height: 94vh; overflow-y: auto; border-radius: 24px 24px 0 0; }
  .note-modal > footer { flex-wrap: wrap; }
  .note-modal > footer span { display: none; }
  .note-delete { margin-right: auto; }
}
</style>
