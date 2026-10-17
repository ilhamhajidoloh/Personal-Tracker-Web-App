<template>
  <AppTabsLayout>
    <main class="todo-shell">
      <header class="todo-hero">
        <div>
          <span class="todo-kicker"><i></i> Personal workspace</span>
          <h1>โฟกัสกับสิ่งสำคัญ</h1>
          <p>จัดระเบียบทุกสิ่งที่ต้องทำ ให้วันนี้เดินหน้าอย่างมีจังหวะ</p>
        </div>
        <div class="todo-hero-actions">
          <button class="todo-icon-btn" type="button" :disabled="isLoading" aria-label="รีเฟรชรายการ" @click="loadTodos">
            <svg :class="{ 'todo-spin': isLoading }" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10m0-5v5h5M4 13a8.1 8.1 0 0 0 14.8 4L21 14m0 5v-5h-5"/></svg>
          </button>
          <button class="todo-add-btn" type="button" @click="openCreateModal"><span>＋</span> เพิ่มงานใหม่</button>
        </div>
      </header>
      <div v-if="errorMessage" class="todo-alert"><span>!</span>{{ errorMessage }}</div>
      <section v-if="!isLoading" class="todo-overview">
        <div class="todo-progress-card">
          <div class="todo-progress-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="39" class="ring-track"/><circle cx="50" cy="50" r="39" class="ring-value" :stroke-dasharray="`${completionPercentage * 245} 245`"/></svg><strong>{{ Math.round(completionPercentage * 100) }}<small>%</small></strong></div>
          <div class="todo-progress-copy"><span class="todo-label">ภาพรวมช่วงเวลานี้</span><h2>{{ completedCount }} <small>/ {{ totalCount }} งานเสร็จแล้ว</small></h2><div class="todo-meter"><i :style="{ width: `${completionPercentage * 100}%` }"></i></div><p>{{ completedCount ? 'กำลังไปได้ดี รักษาจังหวะนี้ไว้' : 'เริ่มจากงานเล็กที่สุดก่อน' }}</p></div>
        </div>
        <div class="todo-stat-card"><span class="todo-stat-icon">✦</span><span class="todo-label">ช่วงเวลาที่เลือก</span><strong>{{ rangeLabel }}</strong><small>{{ selectedTag === 'ทั้งหมด' ? 'ทุกหมวดหมู่' : `หมวด${selectedTag}` }}</small></div>
      </section>
      <section class="todo-toolbar">
        <div class="todo-view-switch"><button v-for="v in viewOptions" :key="v" type="button" :class="{ active: selectedView === v }" @click="changeView(v)">{{ v }}</button></div>
        <div v-if="selectedView !== 'ทั้งหมด'" class="todo-date-nav"><button type="button" aria-label="ช่วงก่อนหน้า" @click="shiftView(-1)">‹</button><strong>{{ rangeLabel }}</strong><button type="button" aria-label="ช่วงถัดไป" @click="shiftView(1)">›</button></div>
      </section>
      <section class="todo-filter-row"><span>แสดงงานจาก</span><div><button v-for="tag in tagOptions" :key="tag" type="button" :class="{ active: selectedTag === tag }" :style="getTagChipStyle(tag, selectedTag === tag)" @click="selectedTag = tag; loadTodos()">{{ tag }}</button></div></section>
      <section class="todo-list-panel">
        <header class="todo-list-head"><div><span class="todo-label">Your tasks</span><h2>รายการที่ต้องทำ</h2></div><span class="todo-count">{{ todos.length }} รายการ</span></header>
        <div v-if="isLoading" class="todo-loading"><i v-for="i in 4" :key="i"></i></div>
        <div v-else-if="!todos.length" class="todo-empty"><div>✓</div><h3>พื้นที่ว่างสำหรับงานใหม่</h3><p>ยังไม่มีงานในช่วงเวลาหรือหมวดหมู่นี้</p><button type="button" @click="openCreateModal">สร้างงานแรกของคุณ <span>→</span></button></div>
        <div v-else class="todo-items">
          <article v-for="(item, index) in todos" :key="item.id" class="todo-item" :class="{ completed: item.isCompleted }">
            <span class="todo-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <button class="todo-check" type="button" :class="{ checked: item.isCompleted }" @click="toggleCompletion(item)"><svg v-if="item.isCompleted" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg></button>
            <div class="todo-item-body"><h3>{{ item.title }}</h3><div class="todo-meta"><span v-if="item.tag && item.tag !== 'ทั่วไป'" class="todo-tag" :style="getTagBadgeStyle(item.tag)">{{ item.tag }}</span><span v-if="item.targetDate" class="todo-due" :style="getDueDateStyle(item)">◷ {{ formatDate(item.targetDate) }}</span><span v-if="item.recurrenceLabel" class="todo-repeat">↻ {{ item.recurrenceLabel }}</span></div></div>
            <button class="todo-edit" type="button" aria-label="แก้ไขงาน" @click="openEditModal(item)">↗</button>
          </article>
        </div>
      </section>
    </main>
    <Teleport to="body">
      <Transition name="todo-modal">
        <div v-if="isModalOpen" class="todo-modal-backdrop" @click.self="closeModal">
          <form class="todo-modal" @submit.prevent="submitTodo">
            <header><div><span class="todo-kicker"><i></i>{{ editingId ? 'Edit task' : 'New task' }}</span><h2>{{ editingId ? 'แก้ไขงาน' : 'สร้างงานใหม่' }}</h2></div><button type="button" aria-label="ปิด" @click="closeModal">×</button></header>
            <div class="todo-modal-body">
              <label>ชื่องาน <em>*</em><input v-model="form.title" type="text" required maxlength="100" placeholder="วันนี้อยากทำอะไรให้สำเร็จ?" /></label>
              <label>{{ form.recurrence === 0 ? 'วันที่ต้องทำ' : 'วันที่เริ่มต้น' }}<input v-model="form.targetDate" type="date" /></label>
              <div><span class="todo-form-label">ความถี่</span><div class="todo-choice-grid"><button v-for="opt in recurrenceOptions" :key="opt.value" type="button" :class="{ active: form.recurrence === opt.value }" @click="form.recurrence = opt.value">{{ opt.label }}</button></div></div>
              <div><span class="todo-form-label">หมวดหมู่</span><div class="todo-choice-grid"><button v-for="tag in ['เรียน', 'งาน', 'ส่วนตัว', 'สุขภาพ']" :key="tag" type="button" :class="{ active: form.tag === tag }" :style="getTagChipStyle(tag, form.tag === tag)" @click="form.tag = tag">{{ tag }}</button></div></div>
            </div>
            <footer><button v-if="editingId" type="button" class="todo-delete" @click="deleteTodo(editingId)">ลบงาน</button><span v-else></span><button type="button" class="todo-cancel" @click="closeModal">ยกเลิก</button><button type="submit" class="todo-save" :disabled="isSubmitting">{{ isSubmitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'สร้างงาน' }}</button></footer>
          </form>
        </div>
      </Transition>
    </Teleport>
    <div v-if="false" class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
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
    <Teleport v-if="false" to="body">
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

<style scoped>
.todo-shell { width: min(1180px, 100%); margin: 0 auto; padding: 30px 22px 100px; color: var(--text-primary); }
.todo-hero, .todo-overview, .todo-toolbar, .todo-filter-row, .todo-list-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.todo-hero { align-items: flex-end; margin-bottom: 28px; }
.todo-kicker, .todo-label { display: inline-flex; align-items: center; gap: 8px; color: var(--brand-ink); font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.todo-kicker i { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
.todo-hero h1 { margin: 8px 0 5px; font-size: clamp(28px, 4vw, 46px); line-height: 1.08; letter-spacing: -.05em; font-weight: 800; }
.todo-hero p { margin: 0; color: var(--text-muted); font-size: 14px; }
.todo-hero-actions { display: flex; gap: 10px; flex-shrink: 0; }
.todo-icon-btn, .todo-add-btn, .todo-date-nav button { border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); }
.todo-icon-btn { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; }
.todo-icon-btn svg { width: 19px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.todo-add-btn { height: 44px; padding: 0 18px; border: 0; border-radius: 14px; background: var(--brand); color: var(--brand-on); font-weight: 800; box-shadow: var(--brand-glow); }
.todo-add-btn span { margin-right: 5px; font-size: 20px; vertical-align: -1px; }
.todo-icon-btn:hover, .todo-date-nav button:hover { color: var(--brand-ink); border-color: var(--brand-border); }
.todo-add-btn:hover { background: var(--brand-strong); }
.todo-alert { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 15px; border: 1px solid var(--event-status-soon-border); border-radius: 15px; background: var(--event-status-soon-soft); color: var(--ink-amber); font-size: 13px; font-weight: 700; }
.todo-alert span { display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid currentColor; border-radius: 50%; }
.todo-overview { align-items: stretch; margin-bottom: 18px; }
.todo-progress-card, .todo-stat-card, .todo-list-panel { border: 1px solid var(--border-subtle); background: var(--bg-card); box-shadow: var(--shadow-md); }
.todo-progress-card { flex: 1; display: flex; align-items: center; gap: 24px; min-width: 0; padding: 24px; border-radius: 24px; }
.todo-progress-ring { position: relative; width: 112px; height: 112px; flex: 0 0 112px; }
.todo-progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.todo-progress-ring circle { fill: none; stroke-width: 8; }
.ring-track { stroke: var(--bg-elevated); }
.ring-value { stroke: var(--brand); stroke-linecap: round; transition: stroke-dasharray .5s ease; }
.todo-progress-ring strong { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 25px; letter-spacing: -.05em; }
.todo-progress-ring small { margin-left: 2px; font-size: 13px; color: var(--brand-ink); }
.todo-progress-copy { min-width: 0; flex: 1; }
.todo-progress-copy h2 { margin: 7px 0 11px; font-size: 25px; letter-spacing: -.04em; }
.todo-progress-copy h2 small { color: var(--text-muted); font-size: 13px; font-weight: 600; letter-spacing: 0; }
.todo-meter { height: 8px; overflow: hidden; border-radius: 99px; background: var(--bg-elevated); }
.todo-meter i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand), var(--brand-2)); transition: width .5s ease; }
.todo-progress-copy p, .todo-stat-card small { margin: 9px 0 0; color: var(--text-muted); font-size: 12px; }
.todo-stat-card { width: 265px; padding: 22px; border-radius: 24px; }
.todo-stat-icon { display: grid; place-items: center; width: 34px; height: 34px; margin-bottom: 16px; border-radius: 11px; background: var(--brand-soft); color: var(--brand-ink); font-size: 18px; }
.todo-stat-card strong { display: block; margin-top: 10px; font-size: 20px; letter-spacing: -.03em; }
.todo-toolbar { margin: 26px 0 12px; }
.todo-view-switch { display: flex; padding: 4px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-elevated); }
.todo-view-switch button { min-width: 68px; padding: 9px 14px; border: 0; border-radius: 10px; background: transparent; color: var(--text-muted); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.todo-view-switch button.active { background: var(--bg-card); color: var(--brand-ink); box-shadow: var(--shadow-sm); }
.todo-date-nav { display: flex; align-items: center; gap: 12px; }
.todo-date-nav strong { min-width: 105px; text-align: center; font-size: 13px; }
.todo-date-nav button { width: 34px; height: 34px; border-radius: 10px; font-size: 23px; line-height: 1; cursor: pointer; }
.todo-filter-row { justify-content: flex-start; margin-bottom: 14px; padding: 4px 0; }
.todo-filter-row > span { color: var(--text-muted); font-size: 12px; font-weight: 700; }
.todo-filter-row > div { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 3px; }
.todo-filter-row button { padding: 7px 13px; border: 1px solid var(--border-subtle); border-radius: 99px; background: var(--bg-elevated); color: var(--text-secondary); font: inherit; font-size: 11px; font-weight: 800; white-space: nowrap; cursor: pointer; }
.todo-filter-row button.active { box-shadow: var(--shadow-sm); }
.todo-list-panel { overflow: hidden; border-radius: 24px; }
.todo-list-head { padding: 22px 24px 18px; border-bottom: 1px solid var(--border-subtle); }
.todo-list-head h2 { margin: 5px 0 0; font-size: 21px; letter-spacing: -.04em; }
.todo-count { padding: 5px 11px; border-radius: 99px; background: var(--brand-soft); color: var(--brand-ink); font-size: 11px; font-weight: 800; }
.todo-items { padding: 8px 12px 12px; }
.todo-item { display: flex; align-items: center; gap: 15px; padding: 17px 12px; border-bottom: 1px solid var(--border-subtle); transition: background .2s, transform .2s; }
.todo-item:last-child { border-bottom: 0; }
.todo-item:hover { transform: translateX(3px); background: var(--bg-card-hover); }
.todo-item.completed { opacity: .65; }
.todo-index { width: 28px; color: var(--text-muted); font: 700 11px var(--font-mono); }
.todo-check { width: 24px; height: 24px; display: grid; flex-shrink: 0; place-items: center; border: 2px solid var(--border-strong); border-radius: 8px; background: transparent; cursor: pointer; }
.todo-check.checked { border-color: var(--ink-emerald); background: var(--ink-emerald); }
.todo-check svg { width: 16px; fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.todo-item-body { min-width: 0; flex: 1; }
.todo-item-body h3 { overflow: hidden; margin: 0 0 7px; color: var(--text-primary); font-size: 14px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.todo-item.completed h3 { text-decoration: line-through; color: var(--text-muted); }
.todo-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.todo-tag, .todo-repeat { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
.todo-due { font-size: 11px; font-weight: 700; }
.todo-repeat { border: 1px solid var(--border-subtle); color: var(--text-muted); }
.todo-edit { width: 34px; height: 34px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--text-muted); font-size: 20px; cursor: pointer; }
.todo-edit:hover { border-color: var(--brand-border); background: var(--brand-soft); color: var(--brand-ink); }
.todo-loading { display: grid; gap: 10px; padding: 20px; }
.todo-loading i { height: 62px; display: block; border-radius: 15px; background: var(--bg-elevated); animation: todo-pulse 1.2s ease-in-out infinite alternate; }
@keyframes todo-pulse { to { opacity: .45; } }
.todo-empty { padding: 68px 20px; text-align: center; }
.todo-empty > div { display: grid; place-items: center; width: 55px; height: 55px; margin: 0 auto 15px; border-radius: 18px; background: var(--brand-soft); color: var(--brand-ink); font-size: 25px; }
.todo-empty h3 { margin: 0; font-size: 17px; }
.todo-empty p { margin: 5px 0 17px; color: var(--text-muted); font-size: 12px; }
.todo-empty button { border: 0; background: transparent; color: var(--brand-ink); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.todo-empty button span { margin-left: 5px; font-size: 17px; }
.todo-modal-backdrop { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 18px; background: rgba(3, 8, 18, .62); backdrop-filter: blur(10px); }
.todo-modal { width: min(490px, 100%); overflow: hidden; border: 1px solid var(--border-default); border-radius: 26px; background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-lg); }
.todo-modal > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; padding: 25px 25px 20px; border-bottom: 1px solid var(--border-subtle); }
.todo-modal h2 { margin: 7px 0 0; font-size: 24px; letter-spacing: -.04em; }
.todo-modal > header button { width: 32px; height: 32px; border: 0; border-radius: 10px; background: var(--bg-elevated); color: var(--text-muted); font-size: 23px; cursor: pointer; }
.todo-modal-body { display: grid; gap: 19px; padding: 24px 25px; }
.todo-modal label, .todo-form-label { display: grid; gap: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 800; }
.todo-modal label em { color: var(--ink-rose); font-style: normal; }
.todo-modal input { width: 100%; min-height: 44px; padding: 0 13px; border: 1px solid var(--border-default); border-radius: 12px; outline: 0; background: var(--bg-elevated); color: var(--text-primary); font: inherit; font-size: 13px; }
.todo-modal input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-ring); }
.todo-choice-grid { display: flex; flex-wrap: wrap; gap: 7px; }
.todo-choice-grid button { padding: 9px 11px; border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-elevated); color: var(--text-secondary); font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; }
.todo-choice-grid button.active { border-color: var(--brand-border); background: var(--brand-soft); color: var(--brand-ink); }
.todo-modal > footer { display: flex; align-items: center; gap: 9px; padding: 16px 25px; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
.todo-modal > footer button { min-height: 40px; padding: 0 15px; border-radius: 11px; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.todo-modal > footer span { flex: 1; }
.todo-delete { border: 1px solid color-mix(in srgb, var(--ink-rose) 30%, transparent); background: transparent; color: var(--ink-rose); }
.todo-cancel { border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); }
.todo-save { border: 0; background: var(--brand); color: var(--brand-on); }
.todo-save:disabled { opacity: .55; cursor: not-allowed; }
.todo-spin { animation: todo-rotate .8s linear infinite; }
@keyframes todo-rotate { to { transform: rotate(360deg); } }
.todo-modal-enter-active, .todo-modal-leave-active { transition: opacity .2s ease; }
.todo-modal-enter-from, .todo-modal-leave-to { opacity: 0; }
@media (max-width: 700px) {
  .todo-shell { padding: 22px 14px 90px; }
  .todo-hero { align-items: flex-start; flex-direction: column; margin-bottom: 22px; }
  .todo-hero-actions { width: 100%; }
  .todo-add-btn { flex: 1; }
  .todo-overview { flex-direction: column; }
  .todo-stat-card { width: 100%; }
  .todo-progress-card { padding: 18px; gap: 15px; }
  .todo-progress-ring { width: 88px; height: 88px; flex-basis: 88px; }
  .todo-progress-ring strong { font-size: 20px; }
  .todo-progress-copy h2 { font-size: 20px; }
  .todo-toolbar { align-items: stretch; flex-direction: column; }
  .todo-view-switch button { flex: 1; min-width: 0; padding-inline: 8px; }
  .todo-date-nav { justify-content: space-between; }
  .todo-filter-row { align-items: flex-start; flex-direction: column; gap: 8px; }
  .todo-list-head { padding: 18px 16px 15px; }
  .todo-items { padding-inline: 8px; }
  .todo-item { gap: 10px; padding-inline: 7px; }
  .todo-index { width: 20px; }
  .todo-modal-backdrop { align-items: end; padding: 0; }
  .todo-modal { border-radius: 25px 25px 0 0; }
}
</style>

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
const { notify: notifyEmail } = useEmailMessaging()

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
    void notifyEmail('todo', {
      title: form.title.trim(),
      targetDate: form.targetDate,
      priority: 'medium',
      isEditing: Boolean(editingId.value),
    })
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
