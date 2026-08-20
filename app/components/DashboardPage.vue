<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8 space-y-5">
      <!-- Page head -->
      <div class="flex flex-wrap items-end justify-between gap-4 animate-slide-up">
        <div>
          <p class="eyebrow">ภาพรวม · Dashboard</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">{{ greetingText }}, <em style="font-style: normal; color: var(--brand);">{{ userDisplayName }}</em></h1>
          <p class="num text-xs mt-2" style="color: var(--text-muted);">{{ todayText }} · อัปเดต {{ lastUpdateTime }}</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <NuxtLink v-if="isModuleEnabled('cashflow')" to="/cashflow" class="btn-primary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            บันทึกรายการ
          </NuxtLink>
          <NuxtLink v-if="isModuleEnabled('study-schedule')" to="/study-schedule" class="btn-secondary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            ตารางเรียน
          </NuxtLink>
          <NuxtLink v-if="isModuleEnabled('todos') && !isModuleEnabled('study-schedule')" to="/todos" class="btn-secondary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11"/></svg>
            To-do List
          </NuxtLink>
          <NuxtLink v-if="isModuleEnabled('tasks') && !isModuleEnabled('cashflow')" to="/tasks" class="btn-secondary text-sm inline-flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            จัดการงาน
          </NuxtLink>
        </div>
      </div>

      <!-- Error -->
      <Transition name="slide-down">
        <div
          v-if="errorMessage"
          class="rounded-xl p-3.5 text-sm flex items-center gap-2"
          style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--event-status-soon-ink);"
          role="alert"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/></svg>
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- Main grid: left (hero + recent) · right (allocation + schedule + todos) -->
      <section v-if="hasLeftColumn || hasRightColumn" :class="gridClasses">
        <!-- LEFT column -->
        <div v-if="hasLeftColumn" class="space-y-4">
          <!-- Multi-Book Selector Bar (if user has books) -->
          <div v-if="books.length > 0" class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <!-- All Books Pill -->
            <button
              type="button"
              @click="selectBook('all')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all tap-scale flex items-center gap-1.5 shrink-0"
              :style="selectedBookId === 'all'
                ? 'background: var(--brand); color: #ffffff; box-shadow: 0 4px 14px rgba(59,78,240,0.35);'
                : 'background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary);'"
            >
              <span>📊</span>
              <span>ทุกสมุด (รวม)</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full opacity-80" :style="selectedBookId === 'all' ? 'background: rgba(255,255,255,0.2);' : 'background: rgba(0,0,0,0.2);'">
                {{ books.length }}
              </span>
            </button>

            <!-- Individual Book Pills -->
            <button
              v-for="book in books"
              :key="book.id"
              type="button"
              @click="selectBook(book.id)"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all tap-scale flex items-center gap-1.5 shrink-0"
              :style="selectedBookId === book.id
                ? `background: ${book.color}22; border: 1px solid ${book.color}66; color: ${book.color}; box-shadow: 0 2px 10px ${book.color}20;`
                : 'background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary);'"
            >
              <span>{{ book.icon || '💼' }}</span>
              <span>{{ book.name }}</span>
              <span v-if="book.isDefault" class="text-[9px] px-1 py-0.2 rounded font-medium" :style="{ background: `${book.color}25`, color: book.color }">หลัก</span>
            </button>
          </div>

          <!-- Hero balance + chart -->
          <div class="section-card animate-slide-up overflow-hidden">
            <div class="p-5 md:p-6">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="eyebrow flex items-center gap-1.5">
                    <span>เงินคงเหลือ</span>
                    <span v-if="selectedBook" class="font-semibold" :style="{ color: selectedBook.color }">({{ selectedBook.icon }} {{ selectedBook.name }})</span>
                    <span v-else class="font-normal" style="color: var(--text-muted);">(รวมทุกสมุด)</span>
                  </p>
                  <p class="num text-[34px] md:text-[42px] font-bold leading-none mt-2" :style="{ color: remainingBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-rose)' }">
                    <span class="text-xl md:text-2xl font-semibold mr-1" style="color: var(--text-muted);">฿</span>{{ formattedBalanceParts.sign }}{{ formattedBalanceParts.integer }}<span class="text-xl md:text-2xl font-semibold" style="color: var(--text-muted);">.{{ formattedBalanceParts.decimal }}</span>
                  </p>
                  <div class="flex items-center gap-2.5 mt-3 flex-wrap">
                    <span class="num text-[11px] px-2 py-1 rounded-md font-semibold" :style="remainingBalance >= 0 ? 'color: var(--ink-emerald); background: rgba(10,138,92,0.10);' : 'color: var(--ink-rose); background: rgba(208,39,72,0.10);'">
                      {{ remainingBalance >= 0 ? 'บวก' : 'ติดลบ' }}
                    </span>
                    <span class="text-[12.5px]" style="color: var(--text-secondary);">{{ remainingProgressText }}</span>
                  </div>
                </div>
                <div class="icon-bubble">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--brand);"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
              </div>

              <!-- Time Range Selector -->
              <div class="flex items-center justify-end gap-1.5 mt-4 pt-1.5 border-t" style="border-color: var(--border-subtle);">
                <span class="text-[11px] font-medium mr-auto" style="color: var(--text-muted);">ช่วงเวลา:</span>
                <button
                  v-for="range in [
                    { value: '7d', label: '7 วัน' },
                    { value: '30d', label: '30 วัน' },
                    { value: 'this_month', label: 'เดือนนี้' },
                    { value: 'all', label: 'ทั้งหมด' }
                  ]"
                  :key="range.value"
                  @click="selectedChartRange = range.value as any"
                  class="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all tap-scale touch-target"
                  :style="selectedChartRange === range.value
                    ? 'background: var(--brand); color: white; box-shadow: var(--brand-glow);'
                    : 'background: var(--bg-hover); color: var(--text-secondary);'"
                >
                  {{ range.label }}
                </button>
              </div>

              <!-- Cumulative balance trend chart -->
              <div class="mt-5 -mx-1.5 relative">
                <!-- Y-Axis Labels inside the container -->
                <div v-if="!chartGeom.empty" class="absolute left-2 top-1 text-[9px] font-semibold text-gray-500 pointer-events-none select-none bg-gray-900/60 px-1.5 py-0.5 rounded border border-gray-800/40">
                  สูงสุด: {{ chartGeom.maxFormatted }}
                </div>
                <div v-if="!chartGeom.empty" class="absolute left-2 bottom-6 text-[9px] font-semibold text-gray-500 pointer-events-none select-none bg-gray-900/60 px-1.5 py-0.5 rounded border border-gray-800/40">
                  ต่ำสุด: {{ chartGeom.minFormatted }}
                </div>

                <svg v-if="!chartGeom.empty" viewBox="0 0 600 150" preserveAspectRatio="none" class="w-full" style="height: 130px; display: block;" role="img" aria-label="กราฟยอดเงินคงเหลือสะสม">
                  <defs>
                    <linearGradient id="dashBalanceArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="var(--brand)" stop-opacity="0.24" />
                      <stop offset="1" stop-color="var(--brand)" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Grid lines -->
                  <line x1="8" y1="12" x2="592" y2="12" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  <line x1="8" y1="75" x2="592" y2="75" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  <line x1="8" y1="138" x2="592" y2="138" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
                  
                  <path :d="chartGeom.area" fill="url(#dashBalanceArea)" />
                  <path :d="chartGeom.line" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                  
                  <!-- Latest value label on the dot -->
                  <text 
                    :x="chartGeom.dotX - 10" 
                    :y="chartGeom.dotY - 10" 
                    fill="var(--brand-ink)" 
                    font-size="11" 
                    font-weight="bold" 
                    text-anchor="end" 
                    class="num"
                    style="filter: drop-shadow(0px 1px 3px rgba(0,0,0,0.8));"
                  >
                    {{ chartGeom.lastFormatted }}
                  </text>
                  
                  <circle :cx="chartGeom.dotX" :cy="chartGeom.dotY" r="4.5" fill="var(--brand)" stroke="#ffffff" stroke-width="1.5" />
                </svg>
                
                <!-- X-Axis Date Labels -->
                <div v-if="!chartGeom.empty" class="flex justify-between px-3 mt-1.5 text-[10px] font-semibold text-gray-500 border-t border-gray-800/40 pt-1">
                  <span>{{ chartGeom.startDate }}</span>
                  <span class="text-gray-600">ระยะเวลาแสดงแนวโน้มยอดเงิน</span>
                  <span>{{ chartGeom.endDate }}</span>
                </div>
                
                <div v-else class="h-[130px] flex items-center justify-center text-xs mx-1.5 rounded-lg" style="color: var(--text-muted); background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  ยังไม่มีข้อมูลพอสำหรับแสดงกราฟ
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2" style="border-top: 1px solid var(--border-subtle);">
              <div class="p-4 md:p-5" style="border-right: 1px solid var(--border-subtle);">
                <p class="eyebrow flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--ink-emerald)" stroke-width="2.2"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>รายรับรวม</p>
                <p class="num text-xl font-bold mt-1.5" style="color: var(--ink-emerald);">{{ formatCurrency(totalIncome) }}</p>
              </div>
              <div class="p-4 md:p-5">
                <p class="eyebrow flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--ink-rose)" stroke-width="2.2"><path d="M17 7L7 17M7 17h8M7 17V9"/></svg>รายจ่ายรวม</p>
                <p class="num text-xl font-bold mt-1.5" style="color: var(--ink-rose);">{{ formatCurrency(totalExpense) }}</p>
                <p v-if="overspentAmount > 0" class="text-[11px] mt-1" style="color: var(--event-status-soon-ink);">เกิน {{ formatCurrency(overspentAmount) }}</p>
              </div>
            </div>
          </div>

          <!-- Recent transactions -->
          <div class="section-card animate-slide-up delay-100">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">รายการล่าสุด</h2>
              <NuxtLink to="/cashflow" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
            </div>
            <div v-if="isLoading" class="p-5 space-y-2">
              <div v-for="i in 3" :key="i" class="h-12 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <div v-else-if="!recentTransactions.length" class="p-8 text-center text-sm" style="color: var(--text-muted);">ยังไม่มีรายการ</div>
            <div v-else>
              <div
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="grid grid-cols-[34px_1fr_auto] items-center gap-3 px-5 py-3"
                style="border-bottom: 1px solid var(--border-subtle);"
              >
                <span class="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <svg v-if="tx.type === 'income'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--ink-emerald)" stroke-width="2"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--ink-rose)" stroke-width="2"><path d="M17 7L7 17M7 17h8M7 17V9"/></svg>
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <p class="text-[13.5px] font-medium truncate" style="color: var(--text-primary);">{{ tx.category || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย') }}</p>
                    <span
                      v-if="selectedBookId === 'all' && getBookById(tx.book_id)"
                      class="text-[9.5px] px-1.5 py-0.2 rounded-md font-medium shrink-0 flex items-center gap-0.5"
                      :style="{
                        backgroundColor: `${getBookById(tx.book_id)?.color}15`,
                        color: getBookById(tx.book_id)?.color,
                        border: `1px solid ${getBookById(tx.book_id)?.color}35`
                      }"
                    >
                      <span>{{ getBookById(tx.book_id)?.icon }}</span>
                      <span>{{ getBookById(tx.book_id)?.name }}</span>
                    </span>
                  </div>
                  <p class="num text-[10.5px] mt-0.5 truncate" style="color: var(--text-muted);">{{ tx.type === 'income' ? 'รายรับ' : 'รายจ่าย' }} · {{ formatDate(tx.entry_date) }}</p>
                </div>
                <span class="num text-[14px] font-semibold text-right" :style="{ color: tx.type === 'income' ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">{{ tx.type === 'income' ? '+' : '−' }}{{ formatCurrency(tx.amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Nearest Recurring Expense -->
          <div class="section-card animate-slide-up delay-100 overflow-hidden">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm shrink-0">
                  🔄
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-white">รายจ่ายประจำใกล้ที่สุด</h2>
                  <p class="text-[11px] text-gray-500">รายการถัดไปที่ต้องชำระ</p>
                </div>
              </div>
              <NuxtLink to="/cashflow" class="eyebrow" style="color: var(--brand);">จัดการ →</NuxtLink>
            </div>

            <div v-if="isRecurringLoading" class="p-5">
              <div class="h-16 rounded-xl bg-gray-800/60 animate-pulse"></div>
            </div>

            <div v-else-if="!nearestRecurringItemInfo" class="p-6 text-center text-xs" style="color: var(--text-muted);">
              ยังไม่มีรายการจ่ายประจำ
            </div>

            <div v-else class="p-4 sm:p-5">
              <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-sm font-bold text-white truncate">{{ nearestRecurringItemInfo.item.title }}</span>
                    <span class="text-[10.5px] font-semibold px-2 py-0.5 rounded-md border" :class="nearestRecurringItemInfo.statusClass">
                      {{ nearestRecurringItemInfo.dueLabel }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-400">
                    จ่ายทุกวันที่ {{ nearestRecurringItemInfo.item.dayOfMonthDue }} &bull;
                    <span class="font-mono text-amber-300 font-semibold">{{ nearestRecurringItemInfo.countdownText }}</span>
                  </p>
                </div>

                <div class="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                  <span class="num text-base font-extrabold text-white">฿{{ formatCurrency(nearestRecurringItemInfo.item.amount) }}</span>
                  <button
                    @click="payDashboardRecurring(nearestRecurringItemInfo.item)"
                    :disabled="isPayingDashboardRecurringId === nearestRecurringItemInfo.item.id"
                    class="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5 transition-all tap-scale touch-target disabled:opacity-50"
                  >
                    <svg v-if="isPayingDashboardRecurringId !== nearestRecurringItemInfo.item.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span v-else class="inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>จ่ายแล้ว</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT column -->
        <div v-if="hasRightColumn" class="space-y-4">
          <!-- Expense allocation (Donut Chart) -->
          <div v-if="isModuleEnabled('cashflow')" class="section-card animate-slide-up delay-100">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-md flex items-center justify-center text-xs" style="background: var(--brand-soft); color: var(--brand-ink);">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                </div>
                <div>
                  <h2 class="text-sm font-semibold" style="color: var(--text-primary);">สัดส่วนรายจ่ายสูงสุด</h2>
                  <p class="text-[10.5px]" style="color: var(--text-muted);">เปรียบเทียบสัดส่วนตามหมวดหมู่</p>
                </div>
              </div>
              <NuxtLink to="/cashflow" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
            </div>
            <div class="p-5">
              <div v-if="!expenseChartData.hasData" class="text-sm py-8 text-center" style="color: var(--text-muted);">
                <div class="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style="background: var(--bg-elevated); color: var(--text-muted);">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                ยังไม่มีข้อมูลรายจ่าย
              </div>
              <div v-else class="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                <!-- SVG Donut / Pie Chart -->
                <div class="relative shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 130 130" class="w-36 h-36 transform -rotate-90">
                    <!-- Base background track -->
                    <circle
                      cx="65"
                      cy="65"
                      r="46"
                      fill="none"
                      stroke="var(--bg-elevated-2)"
                      stroke-width="15"
                    />
                    <!-- Slices -->
                    <circle
                      v-for="slice in expenseChartData.slices"
                      :key="slice.name"
                      cx="65"
                      cy="65"
                      r="46"
                      fill="none"
                      :stroke="slice.stroke"
                      :stroke-width="hoveredExpenseCategoryIndex === slice.index ? 18 : 15"
                      :stroke-dasharray="slice.dashArray"
                      :stroke-dashoffset="slice.dashOffset"
                      stroke-linecap="round"
                      class="transition-all duration-300 cursor-pointer"
                      :style="{
                        opacity: hoveredExpenseCategoryIndex === null || hoveredExpenseCategoryIndex === slice.index ? '1' : '0.35',
                        filter: hoveredExpenseCategoryIndex === slice.index ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'none',
                      }"
                      @mouseenter="hoveredExpenseCategoryIndex = slice.index"
                      @mouseleave="hoveredExpenseCategoryIndex = null"
                    />
                  </svg>

                  <!-- Center Text Info -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                    <template v-if="activeExpenseSlice">
                      <span class="text-[10px] font-semibold truncate max-w-[80px]" style="color: var(--text-muted);">
                        {{ activeExpenseSlice.name }}
                      </span>
                      <span class="num text-base font-extrabold tracking-tight" :style="{ color: activeExpenseSlice.stroke }">
                        {{ activeExpenseSlice.percentFormatted }}
                      </span>
                      <span class="num text-[9.5px] font-medium truncate max-w-[80px]" style="color: var(--text-secondary);">
                        {{ formatCurrency(activeExpenseSlice.amount) }}
                      </span>
                    </template>
                    <template v-else>
                      <span class="text-[9.5px] font-medium" style="color: var(--text-muted);">รายจ่ายรวม</span>
                      <span class="num text-[13px] font-extrabold leading-tight" style="color: var(--text-primary);">
                        {{ formatCurrency(expenseChartData.total) }}
                      </span>
                      <span class="text-[9px] mt-0.5" style="color: var(--text-muted);">{{ expenseChartData.slices.length }} หมวดหมู่</span>
                    </template>
                  </div>
                </div>

                <!-- Legend & Breakdown List -->
                <div class="flex-1 w-full space-y-2.5 min-w-0">
                  <div
                    v-for="slice in expenseChartData.slices"
                    :key="slice.name"
                    class="p-2 rounded-xl transition-all duration-200 cursor-pointer"
                    :style="hoveredExpenseCategoryIndex === slice.index 
                      ? 'background: var(--bg-elevated); box-shadow: var(--shadow-sm); transform: translateX(2px);' 
                      : 'background: transparent;'"
                    @mouseenter="hoveredExpenseCategoryIndex = slice.index"
                    @mouseleave="hoveredExpenseCategoryIndex = null"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: slice.stroke }"></span>
                        <span class="text-[12.5px] font-medium truncate" :style="{ color: hoveredExpenseCategoryIndex === slice.index ? 'var(--text-primary)' : 'var(--text-secondary)' }">
                          {{ slice.name }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <span class="num text-[10.5px] font-bold px-1.5 py-0.5 rounded-md" :style="{ background: slice.bgColor, color: slice.textColor }">
                          {{ slice.percentFormatted }}
                        </span>
                        <span class="num text-[12.5px] font-semibold" style="color: var(--text-primary);">
                          {{ formatCurrency(slice.amount) }}
                        </span>
                      </div>
                    </div>
                    <!-- Mini comparison bar -->
                    <div class="w-full h-1 rounded-full overflow-hidden mt-1.5" style="background: var(--bg-elevated-2);">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: slice.percent + '%',
                          background: slice.stroke,
                          opacity: hoveredExpenseCategoryIndex === null || hoveredExpenseCategoryIndex === slice.index ? 1 : 0.4
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's schedule -->
          <div v-if="isModuleEnabled('study-schedule')" class="section-card animate-slide-up delay-200">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">ตารางวันนี้ · {{ todaysStudyClasses.length }} คาบ</h2>
              <NuxtLink to="/study-schedule" class="eyebrow" style="color: var(--brand);">ทั้งสัปดาห์ →</NuxtLink>
            </div>
            <div v-if="isScheduleLoading" class="p-5 space-y-2">
              <div v-for="i in 2" :key="i" class="h-12 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <template v-else>
              <div v-if="todaysStudyClasses.length">
                <!-- Countdown Banner for Active or Next Class -->
                <div v-if="currentStudyClass || nextStudyClassToday" class="mx-5 mt-4 p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 relative overflow-hidden"
                  :class="{ 'study-blinking-card': isStudyBlinking }"
                  :style="!isStudyBlinking ? (currentStudyClass 
                    ? 'background: rgba(10,138,92,0.05); border-color: rgba(10,138,92,0.25); color: var(--ink-emerald);'
                    : 'background: rgba(59,78,240,0.05); border-color: rgba(59,78,240,0.25); color: var(--brand-ink);') : ''">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider transition-colors"
                      :class="{ 'animate-study-text-blink text-white': isStudyBlinking }"
                      :style="!isStudyBlinking ? { background: currentStudyClass ? 'var(--ink-emerald)' : 'var(--brand)', color: '#ffffff' } : { background: '#1e293b', color: '#ffffff' }">
                      {{ currentStudyClass ? '🔴 กำลังเรียน' : '⏳ คาบเรียนถัดไป' }}
                    </span>
                    <span class="num text-[11px] font-bold" :class="{ 'animate-study-text-blink text-white': isStudyBlinking }">
                      {{ formatTime(currentStudyClass ? currentStudyClass.start_time : (nextStudyClassToday?.start_time || '')) }} - 
                      {{ formatTime(currentStudyClass ? currentStudyClass.end_time : (nextStudyClassToday?.end_time || '')) }} น.
                    </span>
                  </div>
                  <h3 class="text-sm font-bold leading-tight" 
                    :class="{ 'animate-study-text-blink text-white': isStudyBlinking }"
                    :style="!isStudyBlinking ? { color: 'var(--text-primary)' } : { color: '#ffffff' }">
                    {{ currentStudyClass ? currentStudyClass.course_name : (nextStudyClassToday?.course_name || '') }}
                  </h3>
                  <p class="text-xs font-semibold mt-0.5 flex items-center gap-1">
                    <span>🕒</span>
                    <span class="font-bold" :class="{ 'animate-study-text-blink text-white': isStudyBlinking }">{{ studyCountdownText }}</span>
                  </p>
                  <p v-if="currentStudyClass?.location || nextStudyClassToday?.location" class="text-[11px]"
                    :class="{ 'animate-study-text-blink text-white': isStudyBlinking }"
                    :style="!isStudyBlinking ? { color: 'var(--text-secondary)' } : { color: '#ffffff' }">
                    📍 {{ currentStudyClass ? currentStudyClass.location : (nextStudyClassToday?.location || '') }}
                  </p>
                </div>

                <!-- Classes List -->
                <div
                  v-for="(item, i) in todaysStudyClasses"
                  :key="item.id"
                  class="grid grid-cols-[58px_1fr_auto] gap-3.5 px-5 py-3 transition-all duration-300"
                  :class="{ 
                    'opacity-55': getClassStatus(item) === 'finished',
                    'study-blinking-card my-1 mx-2 rounded-xl border': isBlinkingRow(item)
                  }"
                  :style="!isBlinkingRow(item) ? { borderBottom: '1px solid var(--border-subtle)' } : {}"
                >
                  <div class="num text-[11px] pt-0.5" 
                    :class="{ 'animate-study-text-blink text-white': isBlinkingRow(item) }"
                    :style="!isBlinkingRow(item) ? { color: 'var(--text-muted)' } : {}">
                    {{ formatTime(item.start_time) }}<span class="block font-semibold" :style="!isBlinkingRow(item) ? { color: 'var(--text-primary)' } : {}">{{ formatTime(item.end_time) }}</span>
                  </div>
                  <div class="pl-3.5" :style="{ borderLeft: '3px solid ' + (isBlinkingRow(item) ? '#3b82f6' : (getClassStatus(item) === 'finished' ? 'var(--text-muted)' : courseTint(item.course_name))) }">
                    <strong class="text-[13.5px] font-semibold block" 
                      :class="{ 'animate-study-text-blink text-white': isBlinkingRow(item) }"
                      :style="!isBlinkingRow(item) ? { 
                        color: getClassStatus(item) === 'finished' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: getClassStatus(item) === 'finished' ? 'line-through' : 'none'
                      } : {}">
                      {{ item.course_name }}
                    </strong>
                    <span v-if="item.location" class="num block text-[11px] mt-0.5"
                      :class="{ 'animate-study-text-blink text-white': isBlinkingRow(item) }"
                      :style="!isBlinkingRow(item) ? { color: 'var(--text-muted)' } : {}">{{ item.location }}</span>
                  </div>
                  <div class="flex items-center shrink-0">
                    <span v-if="getClassStatus(item) === 'finished'" class="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      ✓ เสร็จสิ้น
                    </span>
                    <span v-else-if="getClassStatus(item) === 'active'" 
                      class="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                      :class="isBlinkingRow(item) ? 'bg-indigo-600 text-white animate-study-text-blink' : 'bg-emerald-600 animate-pulse text-white'">
                      <span class="w-1.5 h-1.5 rounded-full bg-white block"></span> กำลังเรียน
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="p-6 text-center text-sm transition-all duration-300"
                :class="{ 'study-blinking-card mx-4 my-3 rounded-2xl': isStudyBlinking && nextStudyClass }"
                :style="!isStudyBlinking ? { color: 'var(--text-muted)' } : {}">
                วันนี้ไม่มีคาบเรียน
                <p class="num text-[11px] mt-1 flex items-center justify-center gap-1.5"
                  :class="{ 'animate-study-text-blink text-white font-semibold': isStudyBlinking && nextStudyClass }">
                  <span>คาบถัดไป · {{ nextStudyClassSubtitle }}</span>
                </p>
              </div>
            </template>
          </div>

          <!-- Todos -->
          <div v-if="isModuleEnabled('todos')" class="section-card animate-slide-up delay-300">
            <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
              <h2 class="text-sm font-semibold" style="color: var(--text-primary);">To-do List</h2>
              <NuxtLink to="/todos" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
            </div>
            <div v-if="isTodosLoading" class="p-5 space-y-2">
              <div v-for="i in 3" :key="i" class="h-11 rounded-lg animate-pulse" style="background: var(--bg-elevated);"></div>
            </div>
            <div v-else-if="!dashboardTodos.length" class="p-8 text-center">
              <p class="text-sm font-medium" style="color: var(--ink-emerald);">ไม่มีงานด่วนหรืองานค้างในวันนี้</p>
              <p class="text-xs mt-1" style="color: var(--text-muted);">ทำได้ดีมาก ทุกงานอยู่ในสถานะดี</p>
            </div>
            <div v-else>
              <div
                v-for="todo in dashboardTodos"
                :key="todo.id"
                class="grid grid-cols-[20px_1fr_auto] items-center gap-3 px-5 py-3"
                style="border-bottom: 1px solid var(--border-subtle);"
              >
                <button
                  @click="markTodoDone(todo.id)"
                  class="w-[19px] h-[19px] rounded-md shrink-0 tap-scale transition-colors"
                  style="border: 1.5px solid var(--border-strong);"
                  aria-label="ทำเครื่องหมายว่าเสร็จ"
                ></button>
                <div class="min-w-0">
                  <p class="text-[13.5px] font-medium truncate" style="color: var(--text-primary);">{{ todo.title }}</p>
                  <p class="num text-[10.5px] mt-0.5" :class="getTodoDateColor(todo)">
                    <span v-if="todo.due_date">{{ formatDate(todo.due_date) }}</span>
                    <span v-else style="color: var(--text-muted);">ไม่มีกำหนด</span>
                  </p>
                </div>
                <span
                  v-if="todo.priority === 'high'"
                  class="text-[10px] px-2 py-1 rounded-md font-semibold uppercase tracking-wide shrink-0"
                  style="color: var(--ink-rose); background: rgba(208,39,72,0.10);"
                >ด่วน</span>
                <span
                  v-else-if="todo.status === 'in_progress'"
                  class="text-[10px] px-2 py-1 rounded-md font-semibold uppercase tracking-wide shrink-0"
                  style="color: var(--brand-ink); background: var(--brand-soft);"
                >กำลังทำ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Events Section -->
      <section v-if="isModuleEnabled('events')" class="section-card animate-slide-up delay-400">
        <div class="flex items-center justify-between gap-3 p-5" style="border-bottom: 1px solid var(--border-subtle);">
          <div>
            <h2 class="text-sm font-semibold" style="color: var(--text-primary);">กิจกรรมและนัดหมาย</h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">เหตุการณ์สำคัญที่กำลังจะมาถึง</p>
          </div>
          <NuxtLink to="/events" class="eyebrow" style="color: var(--brand);">ดูทั้งหมด →</NuxtLink>
        </div>

        <div class="p-5">
          <div v-if="eventsErrorMessage" class="rounded-lg px-3 py-2 text-xs mb-3" style="background: var(--event-status-soon-soft); border: 1px solid var(--event-status-soon-border); color: var(--event-status-soon-ink);">
            {{ eventsErrorMessage }}
          </div>

          <div v-if="isEventsLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="h-24 rounded-xl animate-pulse" style="background: var(--bg-elevated);"></div>
          </div>

          <div v-else-if="!dashboardEvents.length" class="flex flex-col items-center justify-center py-8 text-center">
            <p class="text-sm font-medium" style="color: var(--text-secondary);">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
            <NuxtLink to="/events" class="mt-2 text-xs" style="color: var(--brand);">+ เพิ่มกิจกรรม</NuxtLink>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="event in dashboardEvents"
              :key="event.id"
              class="rounded-[10px] p-4 pl-[18px] relative overflow-hidden tap-scale transition-all"
              style="background: var(--bg-card); border: 1px solid var(--border-subtle);"
            >
              <span class="absolute left-0 top-0 bottom-0 w-1" :style="{ background: 'var(' + getDashboardEventStatusTokenPrefix(event) + '-ink)' }"></span>
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wide flex items-center gap-1" :style="getDashboardEventStatusBadgeStyle(event)">
                  <span v-if="getDashboardEventStatusMeta(event).status === 'ongoing'" class="w-1.5 h-1.5 rounded-full animate-ping" style="background: var(--event-status-ongoing-ink);"></span>
                  {{ getDashboardEventStatusText(event) }}
                </span>
                <div class="text-right shrink-0">
                  <span class="num text-[10px] font-bold uppercase" :style="getDashboardEventStatusTextStyle(event)">{{ getMonthShort(event.start_date) }}</span>
                  <span class="num block text-lg font-bold leading-none" style="color: var(--text-primary);">{{ getDay(event.start_date) }}</span>
                </div>
              </div>
              <p class="text-sm font-semibold mt-2.5 line-clamp-1" style="color: var(--text-primary);">{{ event.title }}</p>
              <p class="num text-[11px] mt-1" style="color: var(--text-muted);">{{ displayEventDateTimeShort(event) }}</p>

              <!-- Countdown widget for both ongoing and next upcoming -->
              <div v-if="getDashboardEventStatusMeta(event).status === 'ongoing' || isNextUpcomingEvent(event)" class="mt-3 p-3 rounded-xl border flex flex-col gap-2 transition-all" :style="getDashboardCountdownStyle(event)">
                <!-- Ongoing variant -->
                <template v-if="getDashboardEventStatusMeta(event).status === 'ongoing'">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-semibold flex items-center gap-1.5" style="color: var(--event-status-ongoing-ink);">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background: var(--event-status-ongoing-ink);"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2" style="background: var(--event-status-ongoing-ink);"></span>
                      </span>
                      กำลังดำเนินอยู่
                    </span>
                    <span class="num font-mono font-bold text-xs" style="color: var(--event-status-ongoing-ink);">
                      {{ getDashboardOngoingEventDetails(event).progress }}%
                    </span>
                  </div>
                  <div class="num text-sm font-bold font-mono tracking-tight" style="color: var(--text-primary);">
                    ⏱️ {{ getDashboardOngoingEventDetails(event).countdownText }}
                  </div>
                  <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: rgba(0, 0, 0, 0.15);">
                    <div class="h-full rounded-full transition-all duration-1000 ease-linear" :style="{ width: getDashboardOngoingEventDetails(event).progress + '%', background: 'var(--event-status-ongoing-ink)' }"></div>
                  </div>
                  <div class="flex items-center justify-between text-[10px]" style="color: var(--text-muted);">
                    <span>เริ่ม {{ getDashboardOngoingEventDetails(event).startTimeFormatted }}</span>
                    <span>สิ้นสุด {{ getDashboardOngoingEventDetails(event).endTimeFormatted }}</span>
                  </div>
                </template>

                <!-- Next Upcoming variant -->
                <template v-else>
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold flex items-center gap-1.5" style="color: var(--brand-ink);">
                      <span>⏰</span>
                      กิจกรรมถัดไป
                    </span>
                    <span class="num text-xs font-mono font-bold" style="color: var(--brand-ink);">
                      {{ getDashboardUpcomingEventDetails(event).progress }}%
                    </span>
                  </div>
                  <div class="num text-sm font-bold font-mono tracking-tight" style="color: var(--text-primary);">
                    ⏱️ {{ getDashboardUpcomingEventDetails(event).countdownText }}
                  </div>
                  <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: rgba(59, 78, 240, 0.15);">
                    <div class="h-full rounded-full transition-all duration-1000 ease-linear" :style="{ width: getDashboardUpcomingEventDetails(event).progress + '%', background: 'var(--brand)' }"></div>
                  </div>
                  <div class="flex items-center justify-between text-[10.5px] gap-2" style="color: var(--text-muted);">
                    <span class="shrink-0">รอบ 30 วัน</span>
                    <span class="font-medium truncate text-right" style="color: var(--brand-ink);">เริ่ม {{ displayEventDateTimeShort(event) }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Feature Customization Notice if some modules are disabled -->
      <div v-if="enabledModules.length < allModules.length" class="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border transition-all" style="background: var(--bg-card); border-color: var(--border-subtle);">
        <div class="flex items-center gap-3">
          <span class="text-2xl shrink-0">✨</span>
          <div>
            <p class="text-xs font-bold" style="color: var(--text-primary);">คุณกำลังเปิดใช้งาน {{ enabledModules.length }} จาก {{ allModules.length }} ฟังก์ชัน</p>
            <p class="text-[11px]" style="color: var(--text-muted);">ต้องการใช้งานฟังก์ชันอื่นเพิ่มเติม (การเงิน, ตารางเรียน, To-do, งาน, กิจกรรม) สามารถเปิดได้ตลอดเวลา</p>
          </div>
        </div>
        <NuxtLink to="/profile" class="btn-secondary text-xs shrink-0 py-2 px-3 flex items-center gap-1.5 tap-scale">
          <span>⚙️ ปรับแต่งฟังก์ชัน</span>
        </NuxtLink>
      </div>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getTodayTH, nowTH } from '~/utils/date'
import { useFinanceBooks } from '~/composables/useFinanceBooks'

const { isModuleEnabled, allModules, enabledModules } = useUserModules()

const hasLeftColumn = computed(() => isModuleEnabled('cashflow'))
const hasRightColumn = computed(() => isModuleEnabled('cashflow') || isModuleEnabled('study-schedule') || isModuleEnabled('todos'))

const gridClasses = computed(() => {
  if (hasLeftColumn.value && hasRightColumn.value) {
    return 'grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-4 items-start'
  }
  if (hasLeftColumn.value) {
    return 'grid grid-cols-1 gap-4 items-start'
  }
  return 'grid grid-cols-1 md:grid-cols-2 gap-4 items-start'
})

type TransactionType = 'income' | 'expense'

type TransactionRow = {
  id: string
  user_id: string
  book_id?: string | null
  entry_date: string
  type: TransactionType
  category: string | null
  amount: number
  created_at: string
}

type StudyScheduleRow = {
  id: string
  user_id: string
  course_name: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  created_at: string
}

type NextStudyClassMeta = {
  item: StudyScheduleRow
  dayOffset: number
  minutesUntil: number
  isCurrent: boolean
} | null

type TodoStatus = 'pending' | 'in_progress' | 'completed'
type TodoPriority = 'low' | 'medium' | 'high'

type TodoRow = {
  id: string
  title: string
  description: string | null
  tag: string
  due_date: string | null
  status: TodoStatus
  priority: TodoPriority
}

type EventTypeType = 'same_day_time' | 'same_day_all_day' | 'multi_day'

type DashboardEventRow = {
  id: string
  title: string
  event_type: EventTypeType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
}

const { apiFetch, userId } = useBackendApi()
const { currentUser } = useAuth()

// Multi-Book Finance System
const {
  books,
  isLoadingBooks,
  selectedBookId,
  selectedBook,
  fetchBooks,
  selectBook,
} = useFinanceBooks()

const getBookById = (bookId?: string | null) => {
  if (!bookId) return null
  return books.value.find(b => b.id === bookId) || null
}

const userDisplayName = computed(() => currentUser.value?.fullName?.trim() || currentUser.value?.email?.split('@')[0] || 'MyLife User')

const lastUpdateTime = ref(nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.')

const courseColorMap: Record<string, number> = {
  'โครงสร้างข้อมูล': 0, // Blue (var(--brand))
  'ปฏิบัติการเว็บ': 1,  // Green (var(--ink-emerald))
  'แคลคูลัส': 1,      // Green (var(--ink-emerald))
  'ภาษาอังกฤษ': 2,    // Yellow (var(--ink-amber))
  'ระบบฐานข้อมูล': 3,   // Purple (var(--brand-2))
  'เครือข่าย': 4,       // Pink/Red (var(--ink-rose))
}

const courseColorIndex = (name: string) => {
  const trimmed = name.trim()
  if (courseColorMap[trimmed] !== undefined) {
    return courseColorMap[trimmed]
  }
  for (const [key, val] of Object.entries(courseColorMap)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return val
  }
  let hash = 0
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = ((hash * 31) + trimmed.charCodeAt(i)) >>> 0
  }
  return hash % 5
}

const courseTint = (name: string) => ['var(--brand)', 'var(--ink-emerald)', 'var(--ink-amber)', 'var(--brand-2)', 'var(--ink-rose)'][courseColorIndex(name)]

const formattedBalanceParts = computed(() => {
  const balance = remainingBalance.value
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(balance))
  const parts = formatted.split('.')
  return {
    sign: balance < 0 ? '−' : '',
    integer: parts[0] || '0',
    decimal: parts[1] || '00',
  }
})

const transactions = ref<TransactionRow[]>([])
const studySchedules = ref<StudyScheduleRow[]>([])
const todos = ref<TodoRow[]>([])
const events = ref<DashboardEventRow[]>([])
const currentTime = ref(nowTH())

const isLoading = ref(true)
const isScheduleLoading = ref(true)
const isTodosLoading = ref(true)
const isEventsLoading = ref(true)
const errorMessage = ref('')
const scheduleErrorMessage = ref('')
const todosErrorMessage = ref('')
const eventsErrorMessage = ref('')

const todayText = nowTH().toLocaleDateString('th-TH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const greetingText = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'สวัสดีตอนเช้า'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  if (hour < 20) return 'สวัสดีตอนเย็น'
  return 'สวัสดีตอนค่ำ'
})

const dayLabelMap = new Map<number, string>([
  [1, 'จันทร์'],
  [2, 'อังคาร'],
  [3, 'พุธ'],
  [4, 'พฤหัสบดี'],
  [5, 'ศุกร์'],
  [6, 'เสาร์'],
  [7, 'อาทิตย์'],
])

const courseChipPalette = [
  'border-sky-400/40 bg-sky-500/15 text-sky-100',
  'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  'border-amber-400/40 bg-amber-500/15 text-amber-100',
  'border-rose-400/40 bg-rose-500/15 text-rose-100',
  'border-indigo-400/40 bg-indigo-500/15 text-indigo-100',
  'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
]

const getApiErrorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

const statusFromBackend: Record<string, TodoStatus> = { pending: 'pending', inProgress: 'in_progress', completed: 'completed' }

const dayNameToNumber: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount)

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const getMonthShort = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { month: 'short' })
const getDay = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit' })

const formatTime = (time: string) => time.slice(0, 5)

const toMinutes = (time: string) => {
  const [hour = '0', minute = '0'] = time.split(':')
  return (Number(hour) * 60) + Number(minute)
}

const getCourseChipClass = (courseName: string) => {
  const normalized = courseName.trim().toLowerCase()
  if (!normalized) return 'border-gray-600 bg-gray-700/30 text-gray-100'
  let hash = 0
  for (const char of normalized) {
    hash = ((hash * 31) + char.charCodeAt(0)) % 2147483647
  }
  return courseChipPalette[Math.abs(hash) % courseChipPalette.length]
}

const totalIncome = computed(() => transactions.value
  .filter((item) => item.type === 'income')
  .reduce((sum, item) => sum + item.amount, 0))

const totalExpense = computed(() => transactions.value
  .filter((item) => item.type === 'expense')
  .reduce((sum, item) => sum + item.amount, 0))

const remainingBalance = computed(() => totalIncome.value - totalExpense.value)
const overspentAmount = computed(() => Math.max(totalExpense.value - totalIncome.value, 0))
const totalTransactions = computed(() => transactions.value.length)

const formatPercent = (value: number) => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
}).format(value)

const expenseProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 100 : 0
  return Math.min((totalExpense.value / totalIncome.value) * 100, 100)
})

const remainingProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return 0
  return Math.min(Math.max((remainingBalance.value / totalIncome.value) * 100, 0), 100)
})

const expenseProgressText = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 'มีรายจ่าย แต่ยังไม่มีรายรับเป็นฐาน' : 'รอข้อมูล'
  return `ใช้ไป ${formatPercent((totalExpense.value / totalIncome.value) * 100)}% ของรายรับ`
})

const remainingProgressText = computed(() => {
  if (totalIncome.value <= 0) return 'รอข้อมูลรายรับ'
  if (remainingBalance.value < 0) return 'รายจ่ายเกินรายรับ'
  return `คงเหลือ ${formatPercent((remainingBalance.value / totalIncome.value) * 100)}% ของรายรับ`
})

const expenseDonutColors = [
  { stroke: 'var(--brand)', text: 'var(--brand)', bg: 'rgba(59, 78, 240, 0.12)' },
  { stroke: 'var(--ink-rose)', text: 'var(--ink-rose)', bg: 'rgba(208, 39, 72, 0.12)' },
  { stroke: 'var(--ink-amber)', text: 'var(--ink-amber)', bg: 'rgba(182, 133, 42, 0.12)' },
  { stroke: 'var(--ink-cyan)', text: 'var(--ink-cyan)', bg: 'rgba(13, 139, 164, 0.12)' },
  { stroke: 'var(--brand-2)', text: 'var(--brand-2)', bg: 'rgba(111, 91, 255, 0.12)' },
  { stroke: 'var(--text-muted)', text: 'var(--text-muted)', bg: 'rgba(139, 147, 167, 0.12)' },
]

const hoveredExpenseCategoryIndex = ref<number | null>(null)

const expenseChartData = computed(() => {
  const expenseList = transactions.value.filter((item) => item.type === 'expense')
  const total = expenseList.reduce((sum, item) => sum + item.amount, 0)
  if (total <= 0) {
    return {
      slices: [],
      total: 0,
      hasData: false,
    }
  }

  const categoryTotals = expenseList.reduce<Record<string, number>>((acc, item) => {
    const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
    acc[key] = (acc[key] || 0) + item.amount
    return acc
  }, {})

  const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  
  // Show top 4 categories and group the rest into 'อื่นๆ' if more than 4
  const topCount = 4
  let displayCategories: { name: string; amount: number }[] = []
  if (sortedEntries.length <= topCount) {
    displayCategories = sortedEntries.map(([name, amount]) => ({ name, amount }))
  } else {
    const main = sortedEntries.slice(0, topCount).map(([name, amount]) => ({ name, amount }))
    const othersAmount = sortedEntries.slice(topCount).reduce((sum, [, amt]) => sum + amt, 0)
    displayCategories = [...main, { name: 'อื่นๆ', amount: othersAmount }]
  }

  const radius = 46
  const circumference = 2 * Math.PI * radius // ≈ 289.0265
  let currentOffset = 0

  const slices = displayCategories.map((cat, index) => {
    const percent = (cat.amount / total) * 100
    const dashLength = (percent / 100) * circumference
    const colorObj = expenseDonutColors[index % expenseDonutColors.length]!

    // Gap between slices if more than 1 slice
    const gap = displayCategories.length > 1 ? 2.5 : 0
    const visualDashLength = Math.max(dashLength - gap, 0.5)

    const sliceInfo = {
      index,
      name: cat.name,
      amount: cat.amount,
      percent,
      percentFormatted: `${formatPercent(percent)}%`,
      stroke: colorObj.stroke,
      textColor: colorObj.text,
      bgColor: colorObj.bg,
      dashArray: `${visualDashLength} ${circumference - visualDashLength}`,
      dashOffset: -currentOffset,
    }
    currentOffset += dashLength
    return sliceInfo
  })

  return {
    slices,
    total,
    hasData: true,
    circumference,
    radius,
  }
})

const activeExpenseSlice = computed(() => {
  if (hoveredExpenseCategoryIndex.value !== null) {
    return expenseChartData.value.slices[hoveredExpenseCategoryIndex.value] || null
  }
  return null
})

const topExpenseCategories = computed(() => {
  return expenseChartData.value.slices.slice(0, 3).map((s) => ({ name: s.name, amount: s.amount }))
})

const topExpenseCategory = computed(() => topExpenseCategories.value[0] || { name: '-', amount: 0 })

const latestTransaction = computed(() => transactions.value[0] || null)

const latestTransactionTitle = computed(() => {
  if (!latestTransaction.value) return 'ยังไม่มีรายการ'
  const typeText = latestTransaction.value.type === 'income' ? 'รายรับ' : 'รายจ่าย'
  return `${typeText} ${formatCurrency(latestTransaction.value.amount)}`
})

const latestTransactionSubtitle = computed(() => {
  if (!latestTransaction.value) return 'เพิ่มรายการแรก'
  const categoryText = latestTransaction.value.category || 'ไม่ระบุหมวดหมู่'
  return `${formatDate(latestTransaction.value.entry_date)} • ${categoryText}`
})

const recentTransactions = computed(() => transactions.value.slice(0, 5))

const selectedChartRange = ref<'7d' | '30d' | 'this_month' | 'all'>('30d')

const chartGeom = computed(() => {
  const w = 600
  const h = 150
  const pad = 12

  if (!transactions.value.length) {
    return { line: '', area: '', dotX: 0, dotY: 0, empty: true, min: 0, max: 0, minFormatted: '฿0.00', maxFormatted: '฿0.00', lastFormatted: '฿0.00', startDate: '', endDate: '' }
  }

  // 1. Sort all transactions chronologically
  const sortedAll = [...transactions.value].sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date)
    return (a.created_at || '').localeCompare(b.created_at || '')
  })

  // 2. Determine date thresholds
  const today = getTodayTH()
  let limitStr: string | null = null
  const now = nowTH()

  // Helper to format YYYY-MM-DD
  function formatYYYYMMDD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }

  if (selectedChartRange.value === '7d') {
    const d = new Date(now.getTime())
    d.setDate(d.getDate() - 6) // Last 7 days including today
    limitStr = formatYYYYMMDD(d)
  } else if (selectedChartRange.value === '30d') {
    const d = new Date(now.getTime())
    d.setDate(d.getDate() - 29) // Last 30 days including today
    limitStr = formatYYYYMMDD(d)
  } else if (selectedChartRange.value === 'this_month') {
    limitStr = `${formatYYYYMMDD(now).slice(0, 8)}01` // First day of this month
  }

  // 3. Compute cumulative series and filter
  let running = 0
  let balanceBeforeLimit = 0
  const rangePoints: { date: string; balance: number }[] = []

  for (const tx of sortedAll) {
    running += tx.type === 'income' ? tx.amount : -tx.amount
    if (limitStr && tx.entry_date < limitStr) {
      balanceBeforeLimit = running
    } else {
      rangePoints.push({ date: tx.entry_date, balance: running })
    }
  }

  // 4. Construct final chart series points
  let finalPoints: { date: string; balance: number }[] = []
  if (limitStr) {
    // Prepend starting point at the limit date with the balance just before it
    finalPoints.push({ date: limitStr, balance: balanceBeforeLimit })
    finalPoints.push(...rangePoints)

    // If only the starting point exists, add today as the end point
    if (finalPoints.length === 1) {
      finalPoints.push({ date: today, balance: balanceBeforeLimit })
    }
  } else {
    finalPoints = rangePoints
  }

  if (finalPoints.length === 1) {
    finalPoints = [{ date: finalPoints[0]!.date, balance: 0 }, { date: finalPoints[0]!.date, balance: finalPoints[0]!.balance }]
  }

  if (finalPoints.length < 2) {
    return { line: '', area: '', dotX: 0, dotY: 0, empty: true, min: 0, max: 0, minFormatted: '฿0.00', maxFormatted: '฿0.00', lastFormatted: '฿0.00', startDate: '', endDate: '' }
  }

  // 5. Convert to coordinates and path
  let values = finalPoints.map(p => p.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = (max - min) || 1

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  const startDate = formatDateShort(finalPoints[0]!.date)
  const endDate = formatDateShort(finalPoints[finalPoints.length - 1]!.date)

  // Sample points if too dense (similar to original logic)
  if (values.length > 48) {
    const step = values.length / 48
    const sampledPoints: typeof finalPoints = []
    for (let i = 0; i < 48; i += 1) {
      sampledPoints.push(finalPoints[Math.floor(i * step)]!)
    }
    sampledPoints.push(finalPoints[finalPoints.length - 1]!)
    finalPoints = sampledPoints
    values = finalPoints.map(p => p.balance)
  }

  const xAt = (i: number) => pad + (i * (w - pad * 2)) / (values.length - 1)
  const yAt = (v: number) => pad + (h - pad * 2) * (1 - (v - min) / span)

  const coords = values.map((v, i) => [xAt(i), yAt(v)] as [number, number])
  const line = coords.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `M${coords[0]![0].toFixed(1)} ${h - pad} ${coords.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${coords[coords.length - 1]![0].toFixed(1)} ${h - pad} Z`
  const last = coords[coords.length - 1]!
  const lastValue = values[values.length - 1] || 0

  return {
    line,
    area,
    dotX: last[0],
    dotY: last[1],
    empty: false,
    min,
    max,
    minFormatted: formatCurrency(min),
    maxFormatted: formatCurrency(max),
    lastFormatted: formatCurrency(lastValue),
    startDate,
    endDate
  }
})

const sortedStudySchedules = computed(() => [...studySchedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
  return a.start_time.localeCompare(b.start_time)
}))

const todayWeekday = computed(() => {
  const day = currentTime.value.getDay()
  return day === 0 ? 7 : day
})

const totalStudyClasses = computed(() => studySchedules.value.length)
const todaysStudyClasses = computed(() => sortedStudySchedules.value.filter((item) => item.day_of_week === todayWeekday.value))
const todaysStudyPreview = computed(() => todaysStudyClasses.value.slice(0, 4))

const timeStringToDate = (timeStr: string) => {
  const parts = timeStr.split(':')
  const hours = Number(parts[0] || '0')
  const minutes = Number(parts[1] || '0')
  const seconds = Number(parts[2] || '0')
  const d = new Date(currentTime.value)
  d.setHours(hours, minutes, seconds, 0)
  return d
}

const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours} ชม. ${minutes} นาที ${seconds} วินาที`
  }
  if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`
  }
  return `${seconds} วินาที`
}

const getClassStatus = (item: StudyScheduleRow) => {
  const now = currentTime.value
  const startD = timeStringToDate(item.start_time)
  const endD = timeStringToDate(item.end_time)
  
  if (now >= endD) return 'finished'
  if (now >= startD && now < endD) return 'active'
  return 'upcoming'
}

const currentStudyClass = computed(() => {
  return todaysStudyClasses.value.find(item => getClassStatus(item) === 'active') || null
})

const nextStudyClassToday = computed(() => {
  const now = currentTime.value
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  return todaysStudyClasses.value.find(item => {
    const startM = toMinutes(item.start_time)
    return startM > currentMinutes
  }) || null
})

const { isBlinking: isStudyBlinking, remainingSeconds: studyBlinkRemainingSecs, triggerBlink: triggerStudyBlink } = useStudyBlink(5000)

const targetBlinkStudyClass = computed(() => {
  return currentStudyClass.value || nextStudyClassToday.value || nextStudyClass.value || null
})

const isBlinkingRow = (item: StudyScheduleRow) => {
  if (!isStudyBlinking.value) return false
  if (currentStudyClass.value) {
    return item.id === currentStudyClass.value.id
  }
  if (nextStudyClassToday.value) {
    return item.id === nextStudyClassToday.value.id
  }
  return false
}

const studyCountdownText = computed(() => {
  if (currentStudyClass.value) {
    const endD = timeStringToDate(currentStudyClass.value.end_time)
    const diff = endD.getTime() - currentTime.value.getTime()
    return `เหลืออีก ${formatCountdown(diff)}`
  } else if (nextStudyClassToday.value) {
    const startD = timeStringToDate(nextStudyClassToday.value.start_time)
    const diff = startD.getTime() - currentTime.value.getTime()
    return `เริ่มในอีก ${formatCountdown(diff)}`
  }
  return ''
})

const dashboardTodos = computed(() => {
  const today = getTodayTH()
  return todos.value
    .filter(t => t.status !== 'completed' && (t.priority === 'high' || (t.due_date && t.due_date <= today)))
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      return 1
    })
    .slice(0, 6)
})

const getTodoDateColor = (item: TodoRow) => {
  if (!item.due_date) return 'text-gray-500'
  const today = getTodayTH()
  if (item.due_date < today) return 'text-rose-400'
  if (item.due_date === today) return 'text-amber-400'
  return 'text-gray-400'
}

const dashboardEvents = computed(() => {
  const nowMs = currentTime.value.getTime()

  // Filter out past events (events that have already ended)
  const upcomingEvents = events.value
    .filter(e => {
      const { endMs } = getDashboardEventDateTimeBounds(e)
      return endMs >= nowMs
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time || '').localeCompare(b.start_time || ''))

  // Find ongoing events
  const ongoingEvents = upcomingEvents.filter(e => {
    const { startMs, endMs } = getDashboardEventDateTimeBounds(e)
    return startMs <= nowMs && nowMs <= endMs
  })

  // If there are ongoing events, show them (max 4)
  if (ongoingEvents.length > 0) {
    return ongoingEvents.slice(0, 4)
  }

  // Otherwise, show only the next upcoming event
  return upcomingEvents.slice(0, 1)
})

const displayEventDateTimeShort = (item: DashboardEventRow) => {
  const formatTimeStr = (t: string | null) => t ? t.slice(0, 5) + ' น.' : ''
  if (item.event_type === 'same_day_all_day') return `${formatDate(item.start_date)} (ตลอดวัน)`
  if (item.event_type === 'same_day_time') return `${formatDate(item.start_date)}  ${formatTimeStr(item.start_time)} - ${formatTimeStr(item.end_time)}`
  if (item.event_type === 'multi_day') {
    const startTimeStr = item.start_time ? ` ${formatTimeStr(item.start_time)}` : ''
    const endTimeStr = item.end_time ? ` ${formatTimeStr(item.end_time)}` : ''
    return `${formatDate(item.start_date)}${startTimeStr} ถึง ${formatDate(item.end_date || '')}${endTimeStr}`
  }
  return formatDate(item.start_date)
}

const dashboardSoonThresholdMinutes = 7 * 24 * 60

const normalizeDashboardEventTime = (timeString: string | null, fallback: string) => {
  if (!timeString) return fallback
  return timeString.length === 5 ? `${timeString}:00` : timeString
}

const getDashboardEventDateTimeBounds = (item: DashboardEventRow) => {
  const endDate = item.end_date || item.start_date
  const startTime = item.event_type === 'same_day_all_day' ? '00:00:00' : normalizeDashboardEventTime(item.start_time, '00:00:00')
  const endTime = item.event_type === 'same_day_all_day' ? '23:59:59' : normalizeDashboardEventTime(item.end_time, '23:59:59')
  return {
    startMs: new Date(`${item.start_date}T${startTime}`).getTime(),
    endMs: new Date(`${endDate}T${endTime}`).getTime(),
  }
}

const formatDashboardStatusDuration = (minutes: number) => {
  const safeMinutes = Math.max(1, Math.ceil(minutes))
  if (safeMinutes < 60) return `${safeMinutes} นาที`
  const hours = Math.floor(safeMinutes / 60)
  const remainMinutes = safeMinutes % 60
  if (hours < 24) return remainMinutes > 0 ? `${hours} ชม. ${remainMinutes} นาที` : `${hours} ชม.`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  if (days < 30) return remainHours > 0 ? `${days} วัน ${remainHours} ชม.` : `${days} วัน`
  const months = Math.floor(days / 30)
  const remainDays = days % 30
  return remainDays > 0 ? `${months} เดือน ${remainDays} วัน` : `${months} เดือน`
}

const getDashboardEventStatusMeta = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntilStart = (startMs - nowMs) / 60000
  const minutesUntilEnd = (endMs - nowMs) / 60000

  if (minutesUntilEnd < 0) {
    return { status: 'past', text: 'ผ่านไปแล้ว' }
  }

  if (startMs <= nowMs && nowMs <= endMs) {
    return { status: 'ongoing', text: 'กำลังดำเนินอยู่' }
  }

  if (minutesUntilStart <= dashboardSoonThresholdMinutes) {
    return { status: 'soon', text: `กำลังจะถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
  }

  return { status: 'future', text: `ยังไม่ถึง อีก ${formatDashboardStatusDuration(minutesUntilStart)}` }
}

const getDashboardOngoingEventDetails = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const totalMs = Math.max(1, endMs - startMs)
  const remainingMs = Math.max(0, endMs - nowMs)
  const elapsedMs = Math.max(0, nowMs - startMs)
  
  const totalSec = Math.floor(remainingMs / 1000)
  const seconds = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const minutes = totalMin % 60
  const totalHours = Math.floor(totalMin / 60)
  const hours = totalHours % 24
  const days = Math.floor(totalHours / 24)

  const progress = Math.min(100, Math.max(0, ((nowMs - startMs) / totalMs) * 100))

  const pad = (n: number) => String(n).padStart(2, '0')
  let countdownText = ''
  if (days > 0) {
    countdownText = `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else if (hours > 0) {
    countdownText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ชม.`
  } else {
    countdownText = `${pad(minutes)}:${pad(seconds)} นาที`
  }

  const startFormatted = item.event_type === 'same_day_all_day' 
    ? '00:00 น.' 
    : (item.start_time ? item.start_time.slice(0, 5) + ' น.' : '')
  const endFormatted = item.event_type === 'same_day_all_day' 
    ? '23:59 น.' 
    : (item.end_time ? item.end_time.slice(0, 5) + ' น.' : '')

  return {
    remainingMs,
    days,
    hours,
    minutes,
    seconds,
    countdownText,
    progress: Number(progress.toFixed(1)),
    startTimeFormatted: startFormatted,
    endTimeFormatted: endFormatted,
  }
}

const getDashboardUpcomingEventDetails = (item: DashboardEventRow) => {
  const { startMs, endMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const remainingMs = Math.max(0, startMs - nowMs)
  const durationMs = Math.max(0, endMs - startMs)

  const totalSec = Math.floor(remainingMs / 1000)
  const seconds = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const minutes = totalMin % 60
  const totalHours = Math.floor(totalMin / 60)
  const hours = totalHours % 24
  const days = Math.floor(totalHours / 24)

  const pad = (n: number) => String(n).padStart(2, '0')
  let countdownText = ''
  if (days > 0) {
    countdownText = `${days} วัน ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else if (hours > 0) {
    countdownText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ชม.`
  } else {
    countdownText = `${pad(minutes)}:${pad(seconds)} นาที`
  }

  // Duration
  const durationMin = Math.floor(durationMs / 60000)
  const durHrs = Math.floor(durationMin / 60)
  const durRemMin = durationMin % 60
  let durationText = ''
  if (item.event_type === 'same_day_all_day') {
    durationText = 'ตลอดวัน'
  } else if (durHrs > 0) {
    durationText = durRemMin > 0 ? `${durHrs} ชม. ${durRemMin} นาที` : `${durHrs} ชม.`
  } else {
    durationText = `${Math.max(1, durationMin)} นาที`
  }

  // Fixed 30-Day countdown cycle
  const window30d = 30 * 24 * 60 * 60 * 1000
  const elapsed30d = Math.max(0, window30d - remainingMs)
  const progress = Math.min(100, Math.max(0, (elapsed30d / window30d) * 100))
  const progressLabel = 'นับถอยหลังรอบ 30 วัน'

  return {
    remainingMs,
    days,
    hours,
    minutes,
    seconds,
    countdownText,
    durationText,
    progressLabel,
    progress: Number(progress.toFixed(1)),
    isWithin24h: remainingMs <= 24 * 60 * 60 * 1000,
    isWithin30Days: remainingMs <= window30d,
  }
}

const getDashboardEventStatusText = (item: DashboardEventRow) => getDashboardEventStatusMeta(item).text

const getDashboardEventStatusTokenPrefix = (item: DashboardEventRow) => `--event-status-${getDashboardEventStatusMeta(item).status}`

const getDashboardEventStatusBadgeStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    color: `var(${prefix}-ink)`,
  }
}

const getDashboardEventDateBadgeStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return {
    background: `var(${prefix}-soft)`,
    borderColor: `var(${prefix}-border)`,
    boxShadow: `var(${prefix}-shadow)`,
  }
}

const getDashboardEventStatusTextStyle = (item: DashboardEventRow) => {
  const prefix = getDashboardEventStatusTokenPrefix(item)
  return { color: `var(${prefix}-ink)` }
}

const isNextUpcomingEvent = (item: DashboardEventRow) => {
  const nowMs = currentTime.value.getTime()
  const ongoingEvents = dashboardEvents.value.filter(e => {
    const { startMs, endMs } = getDashboardEventDateTimeBounds(e)
    return startMs <= nowMs && nowMs <= endMs
  })

  // If there are ongoing events, this is not "next upcoming"
  if (ongoingEvents.length > 0) return false

  const maxCountdownMs = 30 * 24 * 60 * 60 * 1000 // Fix รอบ 30 วัน (หากเกิน 30 วัน จะไม่แสดง Countdown)

  // Otherwise, check if this is the first upcoming event within 30 days
  const upcoming = dashboardEvents.value.filter(e => {
    const { startMs } = getDashboardEventDateTimeBounds(e)
    const remainingMs = startMs - nowMs
    return remainingMs > 0 && remainingMs <= maxCountdownMs
  }).sort((a, b) => {
    const aStart = getDashboardEventDateTimeBounds(a).startMs
    const bStart = getDashboardEventDateTimeBounds(b).startMs
    return aStart - bStart
  })

  return Boolean(upcoming[0] && upcoming[0].id === item.id)
}

const getDashboardCountdownStyle = (item: DashboardEventRow) => {
  if (getDashboardEventStatusMeta(item).status === 'ongoing') {
    return {
      background: 'var(--event-status-ongoing-soft)',
      borderColor: 'var(--event-status-ongoing-border)',
      boxShadow: 'var(--event-status-ongoing-shadow)'
    }
  } else {
    // Use different color for next upcoming (e.g., sky blue)
    return {
      background: 'rgba(14, 165, 233, 0.1)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
      boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.1)'
    }
  }
}

const getDashboardCountdownColor = (item: DashboardEventRow) => {
  if (getDashboardEventStatusMeta(item).status === 'ongoing') {
    return 'var(--event-status-ongoing-ink)'
  } else {
    // Sky blue for next upcoming
    return 'rgb(14, 165, 233)'
  }
}

const getDashboardNextEventCountdown = (item: DashboardEventRow) => {
  const { startMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const minutesUntil = (startMs - nowMs) / 60000
  return formatDashboardStatusDuration(minutesUntil)
}

const nextEventMeta = computed(() => {
  if (!events.value.length) return null
  const now = currentTime.value.getTime()

  let closestMeta = null
  let minScore = Infinity

  for (const event of events.value) {
    let startStr = `${event.start_date}T${event.start_time || '00:00:00'}`
    let endStr = `${event.end_date || event.start_date}T${event.end_time || '23:59:59'}`

    if (event.event_type === 'same_day_all_day') {
       startStr = `${event.start_date}T00:00:00`
       endStr = `${event.start_date}T23:59:59`
    }

    const startMs = new Date(startStr).getTime()
    const endMs = new Date(endStr).getTime()

    const minutesUntilStart = Math.ceil((startMs - now) / 60000)
    const minutesUntilEnd = Math.ceil((endMs - now) / 60000)

    if (minutesUntilEnd <= 0) continue

    const isCurrent = minutesUntilStart <= 0 && minutesUntilEnd > 0
    const score = isCurrent ? minutesUntilEnd - 10000000 : minutesUntilStart

    if (score < minScore) {
       minScore = score
       closestMeta = {
         item: event,
         minutesUntilStart,
         minutesUntilEnd,
         isCurrent
       }
    }
  }
  return closestMeta
})

const nextEventTitle = computed(() => nextEventMeta.value?.item.title || 'ยังไม่มีกิจกรรม')
const nextEventSubtitle = computed(() => {
  if (!nextEventMeta.value) return 'เพิ่มกิจกรรมแรกในแท็บกิจกรรม'
  return displayEventDateTimeShort(nextEventMeta.value.item)
})

const nextEventAlertText = computed(() => {
  if (!nextEventMeta.value) return 'ยังไม่มีกิจกรรมถัดไป'
  const meta = nextEventMeta.value
  if (meta.isCurrent) {
    const min = meta.minutesUntilEnd
    if (min < 60) return `กำลังดำเนินอยู่ (จบในอีก ${min} นาที)`
    const hrs = Math.floor(min / 60)
    const remainMin = min % 60
    return remainMin > 0 ? `กำลังดำเนินอยู่ (จบในอีก ${hrs} ชม. ${remainMin} นาที)` : `กำลังดำเนินอยู่ (จบในอีก ${hrs} ชม.)`
  }

  const min = meta.minutesUntilStart
  if (min < 60) return `เริ่มในอีก ${min} นาที`
  const hrs = Math.floor(min / 60)
  const remainMin = min % 60
  if (hrs < 24) return remainMin > 0 ? `เริ่มในอีก ${hrs} ชม. ${remainMin} นาที` : `เริ่มในอีก ${hrs} ชม.`
  const days = Math.floor(hrs / 24)
  const remainHrs = hrs % 24
  return remainHrs > 0 ? `เริ่มในอีก ${days} วัน ${remainHrs} ชม.` : `เริ่มในอีก ${days} วัน`
})

const nextEventAlertBadgeClass = computed(() => {
  if (!nextEventMeta.value) return 'border-gray-600 bg-gray-700/40 text-gray-300'
  const meta = nextEventMeta.value
  if (meta.isCurrent) return 'border-emerald-300/60 bg-emerald-500/25 text-emerald-100'
  if (meta.minutesUntilStart <= 60) return 'border-rose-300/60 bg-rose-500/25 text-rose-100'
  if (meta.minutesUntilStart <= 24 * 60) return 'border-amber-300/60 bg-amber-500/25 text-amber-100'
  return 'border-sky-300/60 bg-sky-500/25 text-sky-100'
})

const nextEventAlertBoxClass = computed(() => {
  if (!nextEventMeta.value) return 'border-gray-700 bg-gray-800/40'
  const meta = nextEventMeta.value
  if (meta.isCurrent) return 'border-emerald-400/35 bg-emerald-500/10'
  if (meta.minutesUntilStart <= 60) return 'border-rose-400/35 bg-rose-500/10'
  if (meta.minutesUntilStart <= 24 * 60) return 'border-amber-400/35 bg-amber-500/10'
  return 'border-sky-400/35 bg-sky-500/10'
})

const filteredDashboardEvents = computed(() => {
  if (!nextEventMeta.value) return dashboardEvents.value
  return dashboardEvents.value.filter(e => e.id !== nextEventMeta.value!.item.id)
})

const nextStudyClassMeta = computed<NextStudyClassMeta>(() => {
  if (!sortedStudySchedules.value.length) return null
  const now = currentTime.value
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  for (let offset = 0; offset < 7; offset += 1) {
    const checkingDay = ((currentDay - 1 + offset) % 7) + 1
    const classesInDay = sortedStudySchedules.value
      .filter((item) => item.day_of_week === checkingDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (const item of classesInDay) {
      const startMinutes = toMinutes(item.start_time)
      const endMinutes = toMinutes(item.end_time)
      const isCurrent = offset === 0 && currentMinutes >= startMinutes && currentMinutes < endMinutes
      if (offset > 0 || isCurrent || currentMinutes <= startMinutes) {
        return {
          item,
          dayOffset: offset,
          minutesUntil: isCurrent ? 0 : (offset * 24 * 60) + (startMinutes - currentMinutes),
          isCurrent,
        }
      }
    }
  }
  const firstItem = sortedStudySchedules.value[0]
  return firstItem
    ? { item: firstItem, dayOffset: 7, minutesUntil: (7 * 24 * 60) + (toMinutes(firstItem.start_time) - currentMinutes), isCurrent: false }
    : null
})

const nextStudyClass = computed(() => nextStudyClassMeta.value?.item || null)

const nextStudyClassTitle = computed(() => nextStudyClass.value?.course_name || 'ยังไม่มีคาบเรียน')

const nextStudyClassSubtitle = computed(() => {
  if (!nextStudyClass.value) return 'เพิ่มคาบเรียนแรกในแท็บตารางเรียน'
  const dayText = dayLabelMap.get(nextStudyClass.value.day_of_week) || 'ไม่ระบุวัน'
  return `${dayText} • ${formatTime(nextStudyClass.value.start_time)} - ${formatTime(nextStudyClass.value.end_time)}`
})

const nextStudyAlertText = computed(() => {
  if (!nextStudyClassMeta.value) return 'ยังไม่มีคาบถัดไป'
  if (nextStudyClassMeta.value.isCurrent) return 'กำลังเรียน'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 0) return 'เริ่มตอนนี้'
  if (minutes < 60) return `อีก ${minutes} นาที`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return remainMinutes > 0 ? `อีก ${hours} ชม. ${remainMinutes} นาที` : `อีก ${hours} ชม.`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `อีก ${days} วัน ${remainHours} ชม.` : `อีก ${days} วัน`
})

const nextStudyAlertBadgeClass = computed(() => {
  if (!nextStudyClassMeta.value) return 'border-gray-600 bg-gray-700/40 text-gray-300'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) return 'border-rose-300/60 bg-rose-500/25 text-rose-100'
  if (minutes <= 120) return 'border-amber-300/60 bg-amber-500/25 text-amber-100'
  return 'border-sky-300/60 bg-sky-500/25 text-sky-100'
})

const nextStudyAlertBoxClass = computed(() => {
  if (!nextStudyClassMeta.value) return 'border-gray-700 bg-gray-800/40'
  const minutes = nextStudyClassMeta.value.minutesUntil
  if (minutes <= 30) return 'border-rose-400/35 bg-rose-500/10'
  if (minutes <= 120) return 'border-amber-400/35 bg-amber-500/10'
  return 'border-sky-400/35 bg-sky-500/10'
})

type BackendTransaction = {
  id: string
  userId: string
  bookId?: string | null
  type: string
  amount: number
  category: string | null
  transactionDate: string
}

type BackendCourse = {
  id: string
  termId: string
  courseName: string
  room: string | null
  dayOfWeek: string
  startTime: string
  endTime: string
}

type BackendTerm = {
  id: string
  userId: string
  termName: string
  startDate: string
  endDate: string
  courses: BackendCourse[]
}

type BackendTodo = {
  id: string
  title: string
  description: string | null
  tag: string
  targetDate: string
  status: string
  priority: string
}

type BackendActivity = {
  id: string
  title: string
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
  isMultiDay: boolean
}

const normalizeTransactionRows = (rows: BackendTransaction[]): TransactionRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.userId),
  book_id: row.bookId ? String(row.bookId) : null,
  entry_date: String(row.transactionDate).slice(0, 10),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  amount: Number(row.amount || 0),
  created_at: String(row.transactionDate || ''),
}))

const pickActiveTerm = (terms: BackendTerm[]): BackendTerm | null => {
  if (!terms.length) return null
  const todayStr = getTodayTH()
  const active = terms.find(t => t.startDate.slice(0, 10) <= todayStr && t.endDate.slice(0, 10) >= todayStr)
  if (active) return active
  return [...terms].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] || null
}

const normalizeStudyRows = (terms: BackendTerm[]): StudyScheduleRow[] => {
  const term = pickActiveTerm(terms)
  if (!term) return []
  return term.courses.map((c) => ({
    id: String(c.id),
    user_id: term.userId,
    course_name: String(c.courseName || ''),
    day_of_week: dayNameToNumber[c.dayOfWeek] || 1,
    start_time: String(c.startTime || '00:00:00'),
    end_time: String(c.endTime || '00:00:00'),
    location: typeof c.room === 'string' ? c.room : null,
    created_at: '',
  }))
}

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendTransaction[]>(`/api/Finance/${userId.value}${query}`)
    const sorted = [...data].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    transactions.value = normalizeTransactionRows(sorted)
  } catch (error: any) {
    console.error('Load dashboard finance error:', error)
    errorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูล Dashboard ไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const loadStudySchedules = async () => {
  isScheduleLoading.value = true
  scheduleErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendTerm[]>(`/api/Schedule/terms/${userId.value}`)
    studySchedules.value = normalizeStudyRows(data)
  } catch (error: any) {
    console.error('Load study schedules summary error:', error)
    scheduleErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลตารางเรียนไม่สำเร็จ')
  } finally {
    isScheduleLoading.value = false
  }
}

const normalizeTodoRows = (rows: BackendTodo[]): TodoRow[] => rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  description: row.description,
  tag: row.tag || 'ทั่วไป',
  due_date: row.targetDate ? String(row.targetDate).slice(0, 10) : null,
  status: (statusFromBackend[row.status] || 'pending') as TodoStatus,
  priority: (row.priority === 'low' || row.priority === 'high' ? row.priority : 'medium') as TodoPriority,
}))

const loadTodos = async () => {
  isTodosLoading.value = true
  todosErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendTodo[]>(`/api/Todo/${userId.value}`)
    todos.value = normalizeTodoRows(data)
  } catch (error: any) {
    console.error('Load todos error:', error)
    todosErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลงานไม่สำเร็จ')
  } finally {
    isTodosLoading.value = false
  }
}

const markTodoDone = async (id: string) => {
  const item = todos.value.find(t => t.id === id)
  if (!item) return
  try {
    await apiFetch(`/api/Todo/${id}`, {
      method: 'PUT',
      body: {
        title: item.title,
        description: item.description,
        targetDate: `${item.due_date || getTodayTH()}T00:00:00`,
        tag: item.tag,
        recurrence: 'none',
        status: 'completed',
        priority: item.priority,
        isCompleted: true,
      },
    })
    todos.value = todos.value.map(t => t.id === id ? { ...t, status: 'completed' } : t)
  } catch (err: any) {
    console.error('Mark done error:', err)
  }
}

const normalizeEventRows = (rows: BackendActivity[]): DashboardEventRow[] => rows.map((row) => {
  const eventType: EventTypeType = row.isAllDay ? 'same_day_all_day' : row.isMultiDay ? 'multi_day' : 'same_day_time'
  const startDate = row.startTime ? row.startTime.slice(0, 10) : getTodayTH()
  const endDate = row.endTime ? row.endTime.slice(0, 10) : null
  return {
    id: String(row.id),
    title: String(row.title),
    event_type: eventType,
    start_date: startDate,
    start_time: eventType === 'same_day_all_day' ? null : (row.startTime ? row.startTime.slice(11, 19) : null),
    end_date: eventType === 'same_day_time' ? null : endDate,
    end_time: eventType === 'same_day_all_day' ? null : (row.endTime ? row.endTime.slice(11, 19) : null),
  }
})

const loadEvents = async () => {
  isEventsLoading.value = true
  eventsErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<BackendActivity[]>(`/api/Activity/${userId.value}`)
    events.value = normalizeEventRows(data)
  } catch (error: any) {
    console.error('Load events error:', error)
    eventsErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลกิจกรรมไม่สำเร็จ')
  } finally {
    isEventsLoading.value = false
  }
}

type BackendRecurringExpense = {
  id: string
  userId: string
  bookId?: string | null
  title: string
  amount: number
  category: string
  startDate: string
  endDate: string | null
  isIndefinite: boolean
  dayOfMonthDue: number
}

const recurringExpenses = ref<BackendRecurringExpense[]>([])
const isRecurringLoading = ref(false)
const isPayingDashboardRecurringId = ref('')

const loadRecurringExpenses = async () => {
  isRecurringLoading.value = true
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendRecurringExpense[]>(`/api/Finance/recurring/${userId.value}${query}`)
    recurringExpenses.value = data || []
  } catch (error: any) {
    console.error('Load dashboard recurring expenses error:', error)
  } finally {
    isRecurringLoading.value = false
  }
}

const calculateNextDue = (r: { dayOfMonthDue?: number; startDate?: string }) => {
  const day = r.dayOfMonthDue ?? 1
  const now = nowTH()
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const firstOfThisMonth = new Date(todayOnly.getFullYear(), todayOnly.getMonth(), 1)

  let startDate = todayOnly
  if (r.startDate) {
    const parsed = new Date(r.startDate)
    if (!isNaN(parsed.getTime())) {
      startDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    }
  }

  const searchFrom = startDate > firstOfThisMonth ? startDate : firstOfThisMonth

  const dueDateFor = (y: number, m: number) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const clampedDay = Math.min(Math.max(1, day), daysInMonth)
    return new Date(y, m, clampedDay)
  }

  let nextDue = dueDateFor(searchFrom.getFullYear(), searchFrom.getMonth())
  if (nextDue.getTime() < searchFrom.getTime()) {
    const nextMonth = searchFrom.getMonth() === 11 ? 0 : searchFrom.getMonth() + 1
    const nextYear = searchFrom.getMonth() === 11 ? searchFrom.getFullYear() + 1 : searchFrom.getFullYear()
    nextDue = dueDateFor(nextYear, nextMonth)
  }
  return nextDue
}

const nearestRecurringItemInfo = computed(() => {
  if (!recurringExpenses.value.length) return null

  const now = currentTime.value
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let nearestItem: BackendRecurringExpense | null = null
  let nearestNextDue: Date | null = null
  let minDays = 999999

  for (const r of recurringExpenses.value) {
    const nextDue = calculateNextDue(r)
    const dueOnly = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate())
    const daysUntil = Math.round((dueOnly.getTime() - todayOnly.getTime()) / (1000 * 3600 * 24))

    if (daysUntil < minDays) {
      minDays = daysUntil
      nearestItem = r
      nearestNextDue = nextDue
    }
  }

  if (!nearestItem || !nearestNextDue) return null

  const dueTarget = new Date(nearestNextDue.getFullYear(), nearestNextDue.getMonth(), nearestNextDue.getDate(), 23, 59, 59)
  const remainingMs = dueTarget.getTime() - now.getTime()

  let countdownText = ''
  if (remainingMs < 0) {
    countdownText = 'เลยกำหนด'
  } else if (minDays === 0) {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `เหลือ ${h}:${m}:${s}`
  } else {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor((totalSec % (3600 * 24)) / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `${minDays}วัน ${h}:${m}:${s}`
  }

  let dueLabel = ''
  let statusClass = ''
  if (minDays === 0) {
    dueLabel = 'ครบกำหนดวันนี้'
    statusClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  } else if (minDays < 0) {
    dueLabel = `เลยกำหนด ${Math.abs(minDays)} วัน`
    statusClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  } else if (minDays <= 3) {
    dueLabel = `อีก ${minDays} วัน`
    statusClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  } else {
    dueLabel = `อีก ${minDays} วัน`
    statusClass = 'bg-gray-800 text-gray-400 border-gray-700/60'
  }

  return {
    item: nearestItem,
    nextDue: nearestNextDue,
    minDays,
    countdownText,
    dueLabel,
    statusClass,
  }
})

const payDashboardRecurring = async (item: BackendRecurringExpense) => {
  if (isPayingDashboardRecurringId.value) return
  const { confirmAction, toastSuccess, toastError } = useAlert()
  const shouldPay = import.meta.client ? await confirmAction(
    `ยืนยันชำระ ${item.title}?`,
    `ยอดเงิน ฿${item.amount.toLocaleString()} จะถูกบันทึกในรายการจ่าย และขยับวันชำระไปรอบถัดไป`,
    'ชำระเงินเรียบร้อย'
  ) : true
  if (!shouldPay) return

  isPayingDashboardRecurringId.value = item.id
  try {
    const currentNextDue = calculateNextDue(item)
    // 1. Record expense
    const bodyTx = {
      userId: userId.value,
      bookId: item.bookId || null,
      type: 'expense',
      amount: item.amount,
      category: item.category || 'ค่าใช้จ่ายประจำ',
      transactionDate: new Date().toISOString(),
      note: `ชำระรายจ่ายประจำ: ${item.title}`,
    }
    await apiFetch('/api/Finance', { method: 'POST', body: bodyTx })

    // 2. Advance next due date
    const newStartDate = new Date(currentNextDue)
    newStartDate.setDate(newStartDate.getDate() + 1)

    const y = newStartDate.getFullYear()
    const m = String(newStartDate.getMonth() + 1).padStart(2, '0')
    const d = String(newStartDate.getDate()).padStart(2, '0')

    const bodyRecurring = {
      ...item,
      startDate: `${y}-${m}-${d}T00:00:00.000Z`,
    }
    await apiFetch(`/api/Finance/recurring/${item.id}`, { method: 'PUT', body: bodyRecurring })

    toastSuccess(`บันทึกรายจ่าย ฿${item.amount.toLocaleString()} เรียบร้อยแล้ว`)
    await Promise.all([loadTransactions(), loadRecurringExpenses()])
  } catch (error: any) {
    console.error('Pay dashboard recurring error:', error)
    toastError(getApiErrorMessage(error, 'เกิดข้อผิดพลาดในการชำระรายจ่ายประจำ'))
  } finally {
    isPayingDashboardRecurringId.value = ''
  }
}

watch(selectedBookId, () => {
  if (isModuleEnabled('cashflow')) {
    loadTransactions()
    loadRecurringExpenses()
  }
})

const refreshOverview = async () => {
  const promises: Promise<any>[] = []
  if (isModuleEnabled('cashflow')) {
    promises.push(fetchBooks(), loadTransactions(), loadRecurringExpenses())
  }
  if (isModuleEnabled('study-schedule')) {
    promises.push(loadStudySchedules())
  }
  if (isModuleEnabled('todos')) {
    promises.push(loadTodos())
  }
  if (isModuleEnabled('events')) {
    promises.push(loadEvents())
  }
  await Promise.all(promises)
  lastUpdateTime.value = nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshOverview()
  clockTimer = setInterval(() => {
    currentTime.value = nowTH()
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
