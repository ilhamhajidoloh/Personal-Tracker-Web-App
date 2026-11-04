<template>
  <div class="dashboard-page transition-colors duration-300">
    <AppTabsLayout>
      <div class="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <!-- ========================================================
             1. EXECUTIVE HERO HEADER
             ======================================================== -->
        <section
          class="relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8 border shadow-sm transition-all duration-300"
          style="
            background: color-mix(in srgb, var(--bg-card) 95%, var(--brand-soft));
            border-color: var(--border-default);
          "
        >
          <!-- Subtle Glow Accents -->
          <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none" style="background: var(--brand);"></div>
          <div class="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full blur-[70px] opacity-15 pointer-events-none" style="background: var(--ink-teal);"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <!-- Greeting & Info -->
            <div class="space-y-1.5">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs" style="background: var(--bg-elevated); border-color: var(--border-subtle); color: var(--text-secondary);">
                <span class="w-2 h-2 rounded-full" style="background: var(--ink-emerald);"></span>
                <span>{{ todayText }}</span>
                <span style="color: var(--text-muted);">•</span>
                <span class="tabular font-medium" style="color: var(--text-muted);">อัปเดต {{ lastUpdateTime }}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight" style="color: var(--text-primary);">
                {{ greetingText }}, <span style="color: var(--brand-ink);">{{ userDisplayName }}</span>
              </h1>
              <p class="text-xs sm:text-sm font-medium" style="color: var(--text-secondary);">
                ภาพรวมสถานะการเงิน การเรียน และภารกิจประจำวันของคุณ
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <NuxtLink
                v-if="isModuleEnabled('cashflow')"
                to="/cashflow"
                class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2 active:scale-95 hover:shadow-md"
                style="
                  background: var(--brand);
                  color: var(--brand-on);
                  box-shadow: 0 4px 12px -2px var(--brand);
                "
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>บันทึกรายการ</span>
              </NuxtLink>

              <NuxtLink
                v-if="isModuleEnabled('study-schedule')"
                to="/study-schedule"
                class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all duration-200 flex items-center gap-2 active:scale-95"
                style="
                  background: var(--bg-card);
                  border-color: var(--border-default);
                  color: var(--text-primary);
                "
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
                <span>ตารางเรียน</span>
              </NuxtLink>

              <button
                type="button"
                @click="refreshOverview"
                class="p-2.5 rounded-2xl border transition-all active:scale-95"
                style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-muted);"
                title="รีเฟรชข้อมูล"
                aria-label="รีเฟรชข้อมูล"
              >
                <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick Stats Cards Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6">
            <!-- Balance Highlight -->
            <NuxtLink
              v-if="isModuleEnabled('cashflow')"
              to="/cashflow"
              class="p-4 sm:p-5 rounded-2xl border transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
              style="background: var(--bg-card); border-color: var(--border-subtle);"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold" style="color: var(--text-muted);">คงเหลือสุทธิ</span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  :style="remainingBalance >= 0 ? { background: 'rgba(34, 197, 94, 0.1)', color: 'var(--ink-emerald)' } : { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ink-rose)' }"
                >
                  {{ remainingBalance >= 0 ? 'สถานะปกติ' : 'ยอดติดลบ' }}
                </span>
              </div>
              <div class="mt-2 flex items-baseline gap-1">
                <span class="text-2xl sm:text-3xl font-extrabold tracking-tight tabular" :style="remainingBalance < 0 ? { color: 'var(--ink-rose)' } : { color: 'var(--text-primary)' }">
                  {{ formatCurrency(remainingBalance) }}
                </span>
              </div>
              <p class="text-[11px] mt-1 truncate" style="color: var(--text-secondary);">
                {{ selectedBook ? `สมุด: ${selectedBook.name}` : 'รวมทุกสมุดบัญชี' }}
              </p>
            </NuxtLink>

            <!-- Schedule Highlight -->
            <NuxtLink
              v-if="isModuleEnabled('study-schedule')"
              to="/study-schedule"
              class="p-4 sm:p-5 rounded-2xl border transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
              style="background: var(--bg-card); border-color: var(--border-subtle);"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold" style="color: var(--text-muted);">ตารางวันนี้</span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background: var(--brand-soft); color: var(--brand-ink);">
                  {{ isInActiveTerm ? 'ในภาคเรียน' : 'ปิดภาคเรียน' }}
                </span>
              </div>
              <div class="mt-2 flex items-baseline gap-1.5">
                <span class="text-2xl sm:text-3xl font-extrabold tracking-tight" style="color: var(--text-primary);">
                  {{ todaysStudyClasses.length }}
                </span>
                <span class="text-xs font-bold" style="color: var(--text-muted);">คาบเรียนวันนี้</span>
              </div>
              <p class="text-[11px] mt-1 truncate" style="color: var(--text-secondary);">
                {{ activeTermName || 'ยังไม่มีภาคเรียนที่กำลังศึกษา' }}
              </p>
            </NuxtLink>

            <!-- Tasks & Todos Highlight -->
            <NuxtLink
              v-if="isModuleEnabled('tasks') || isModuleEnabled('todos')"
              :to="isModuleEnabled('tasks') ? '/tasks' : '/todos'"
              class="p-4 sm:p-5 rounded-2xl border transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1"
              style="background: var(--bg-card); border-color: var(--border-subtle);"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold" style="color: var(--text-muted);">สิ่งที่ต้องทำ & งานค้าง</span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background: rgba(245, 158, 11, 0.1); color: var(--ink-amber);">
                  ติดตาม
                </span>
              </div>
              <div class="mt-2 flex items-baseline gap-1.5">
                <span class="text-2xl sm:text-3xl font-extrabold tracking-tight" style="color: var(--text-primary);">
                  {{ dashboardTasks.length + dashboardTodos.length }}
                </span>
                <span class="text-xs font-bold" style="color: var(--text-muted);">รายการที่รออยู่</span>
              </div>
              <p class="text-[11px] mt-1 truncate" style="color: var(--text-secondary);">
                {{ dashboardTasks.length > 0 ? `มีงานและการบ้าน ${dashboardTasks.length} รายการ` : 'งานประจำวันเรียบร้อย' }}
              </p>
            </NuxtLink>
          </div>
        </section>

        <!-- Global Error Alert -->
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="errorMessage"
            class="p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm"
            style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); color: var(--ink-rose);"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span class="flex-1">{{ errorMessage }}</span>
          </div>
        </Transition>

        <!-- Multi-Book Selector (Only if books available) -->
        <div v-if="books.length" class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span class="text-xs font-bold shrink-0 mr-1" style="color: var(--text-muted);">สมุด:</span>
          <button
            type="button"
            @click="selectBook('all')"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-150"
            :style="
              selectedBookId === 'all'
                ? { background: 'var(--brand)', color: 'var(--brand-on)', borderColor: 'var(--brand)' }
                : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }
            "
          >
            ทั้งหมด
          </button>
          <button
            v-for="b in books"
            :key="b.id"
            type="button"
            @click="selectBook(b.id)"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-150 flex items-center gap-1.5"
            :style="
              selectedBookId === b.id
                ? { background: 'var(--brand)', color: 'var(--brand-on)', borderColor: 'var(--brand)' }
                : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }
            "
          >
            <span>{{ b.icon || '●' }}</span>
            <span>{{ b.name }}</span>
          </button>
        </div>

        <!-- ========================================================
             2. MAIN BENTO GRID
             ======================================================== -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
          <!-- ----------------------------------------------------
               CASHFLOW: Balance & Dual-Bar Chart (span-8)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('cashflow')"
            class="md:col-span-12 lg:col-span-8 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style="border-color: var(--border-subtle);">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                    Cashflow Overview
                  </span>
                  <span v-if="selectedBook" class="text-xs px-2 py-0.5 rounded-md" style="background: var(--bg-elevated); color: var(--text-muted);">
                    {{ selectedBook.name }}
                  </span>
                </div>
                <div class="flex items-baseline gap-3 mt-1">
                  <span class="text-2xl sm:text-3xl font-extrabold tracking-tight tabular" :style="remainingBalance < 0 ? { color: 'var(--ink-rose)' } : { color: 'var(--text-primary)' }">
                    {{ formatCurrency(remainingBalance) }}
                  </span>
                  <span class="text-xs font-semibold" style="color: var(--text-secondary);">
                    {{ overspentAmount > 0 ? `เกินงบ ${formatCurrency(overspentAmount)}` : remainingProgressText }}
                  </span>
                </div>
              </div>

              <!-- Time Range Selector -->
              <div class="p-1 rounded-2xl flex items-center gap-1 border shrink-0" style="background: var(--bg-elevated); border-color: var(--border-subtle);">
                <button
                  v-for="range in [{ value: '7d', label: '7 วัน' }, { value: '30d', label: '30 วัน' }, { value: 'this_month', label: 'เดือนนี้' }, { value: 'all', label: 'ทั้งหมด' }]"
                  :key="range.value"
                  type="button"
                  @click="selectedChartRange = range.value as any"
                  class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-150 select-none"
                  :style="
                    selectedChartRange === range.value
                      ? { background: 'var(--bg-card)', color: 'var(--brand-ink)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                      : { color: 'var(--text-muted)' }
                  "
                >
                  {{ range.label }}
                </button>
              </div>
            </div>

            <!-- Bar Chart Display -->
            <div v-if="barChartData.empty" class="h-48 sm:h-56 flex flex-col items-center justify-center text-xs" style="color: var(--text-muted);">
              <svg class="w-8 h-8 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span>ยังไม่มีข้อมูลการเงินในช่วงเวลานี้</span>
            </div>

            <div v-else class="mt-4">
              <div class="h-44 sm:h-52 flex items-end gap-2 sm:gap-4 pt-6 px-1">
                <div
                  v-for="(bar, index) in barChartData.bars"
                  :key="index"
                  class="relative flex-1 h-full flex flex-col justify-end items-center gap-2 group cursor-pointer"
                  :class="{ 'opacity-40': hoveredBarIndex !== null && hoveredBarIndex !== index }"
                  @mouseenter="hoveredBarIndex = index"
                  @mouseleave="hoveredBarIndex = null"
                >
                  <!-- Tooltip -->
                  <div
                    v-if="hoveredBarIndex === index"
                    class="absolute bottom-full mb-2 z-20 p-2.5 rounded-xl border text-[11px] shadow-lg pointer-events-none whitespace-nowrap flex flex-col gap-1"
                    style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-primary);"
                  >
                    <span class="font-bold border-b pb-1" style="border-color: var(--border-subtle);">{{ bar.label }}</span>
                    <span class="flex items-center justify-between gap-3" style="color: var(--ink-emerald);">
                      <span>รายรับ:</span> <span class="font-bold tabular">+{{ formatCurrency(bar.income) }}</span>
                    </span>
                    <span class="flex items-center justify-between gap-3" style="color: var(--ink-rose);">
                      <span>รายจ่าย:</span> <span class="font-bold tabular">−{{ formatCurrency(bar.expense) }}</span>
                    </span>
                    <span class="flex items-center justify-between gap-3 font-semibold pt-1 border-t" style="border-color: var(--border-subtle);">
                      <span>สุทธิ:</span> <span class="tabular">{{ bar.net >= 0 ? '+' : '' }}{{ formatCurrency(bar.net) }}</span>
                    </span>
                  </div>

                  <!-- The Bars: Income and Expense -->
                  <div class="w-full flex-1 flex items-end justify-center gap-1 sm:gap-1.5 px-0.5 rounded-xl border-b" style="background: var(--bg-elevated); border-color: var(--border-subtle);">
                    <!-- Income bar -->
                    <div
                      class="w-full max-w-[12px] sm:max-w-[16px] rounded-t-md transition-all duration-300"
                      style="background: linear-gradient(180deg, var(--ink-emerald), color-mix(in srgb, var(--ink-emerald) 60%, transparent));"
                      :style="{ height: `${Math.max(bar.incomeHeight, 4)}%` }"
                    ></div>
                    <!-- Expense bar -->
                    <div
                      class="w-full max-w-[12px] sm:max-w-[16px] rounded-t-md transition-all duration-300"
                      style="background: linear-gradient(180deg, var(--ink-rose), color-mix(in srgb, var(--ink-rose) 60%, transparent));"
                      :style="{ height: `${Math.max(bar.expenseHeight, 4)}%` }"
                    ></div>
                  </div>

                  <!-- X-Axis Label -->
                  <span class="text-[10px] sm:text-xs font-semibold truncate max-w-full" style="color: var(--text-muted);">
                    {{ bar.labelShort }}
                  </span>
                </div>
              </div>

              <!-- Footer Summary Pills -->
              <div class="grid grid-cols-2 gap-3 mt-4 pt-3 border-t" style="border-color: var(--border-subtle);">
                <div class="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between border" style="background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.15);">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background: var(--ink-emerald);"></span>
                    <span class="text-xs font-semibold" style="color: var(--text-secondary);">รายรับรวม</span>
                  </div>
                  <span class="text-xs sm:text-sm font-extrabold tabular" style="color: var(--ink-emerald);">
                    +{{ formatCurrency(totalIncome) }}
                  </span>
                </div>

                <div class="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between border" style="background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.15);">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background: var(--ink-rose);"></span>
                    <span class="text-xs font-semibold" style="color: var(--text-secondary);">รายจ่ายรวม</span>
                  </div>
                  <span class="text-xs sm:text-sm font-extrabold tabular" style="color: var(--ink-rose);">
                    −{{ formatCurrency(totalExpense) }}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <!-- ----------------------------------------------------
               CASHFLOW: Expense Donut Breakdown (span-4)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('cashflow')"
            class="md:col-span-12 lg:col-span-4 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                  Breakdown
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  สัดส่วนรายจ่าย
                </h2>
              </div>
              <NuxtLink to="/cashflow" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                ดูทั้งหมด
              </NuxtLink>
            </div>

            <div v-if="!expenseChartData.hasData" class="h-56 flex flex-col items-center justify-center text-xs" style="color: var(--text-muted);">
              <span>ยังไม่มีข้อมูลรายจ่าย</span>
            </div>

            <div v-else class="mt-4 flex flex-col items-center">
              <!-- SVG Donut Chart -->
              <div class="relative w-40 h-40">
                <svg viewBox="0 0 130 130" class="w-full h-full -rotate-90">
                  <circle cx="65" cy="65" r="46" fill="none" stroke="var(--bg-elevated-2)" stroke-width="14" />
                  <circle
                    v-for="slice in expenseChartData.slices"
                    :key="slice.name"
                    cx="65"
                    cy="65"
                    r="46"
                    fill="none"
                    :stroke="slice.stroke"
                    :stroke-width="hoveredExpenseCategoryIndex === slice.index ? 17 : 14"
                    :stroke-dasharray="slice.dashArray"
                    :stroke-dashoffset="slice.dashOffset"
                    stroke-linecap="round"
                    class="transition-all duration-200 cursor-pointer"
                    :style="{ opacity: hoveredExpenseCategoryIndex === null || hoveredExpenseCategoryIndex === slice.index ? 1 : 0.35 }"
                    @mouseenter="hoveredExpenseCategoryIndex = slice.index"
                    @mouseleave="hoveredExpenseCategoryIndex = null"
                  />
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span class="text-[10px] font-semibold truncate max-w-full" style="color: var(--text-muted);">
                    {{ activeExpenseSlice ? activeExpenseSlice.name : 'จ่ายรวม' }}
                  </span>
                  <span class="text-sm font-extrabold tracking-tight tabular mt-0.5" :style="{ color: activeExpenseSlice ? activeExpenseSlice.stroke : 'var(--text-primary)' }">
                    {{ activeExpenseSlice ? activeExpenseSlice.percentFormatted : formatCurrency(expenseChartData.total) }}
                  </span>
                </div>
              </div>

              <!-- Donut Legend List -->
              <ul class="w-full mt-4 space-y-1 text-xs">
                <li
                  v-for="slice in expenseChartData.slices"
                  :key="slice.name"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  :class="hoveredExpenseCategoryIndex === slice.index ? 'bg-[color:var(--bg-elevated)] font-bold' : ''"
                  @mouseenter="hoveredExpenseCategoryIndex = slice.index"
                  @mouseleave="hoveredExpenseCategoryIndex = null"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: slice.stroke }"></span>
                    <span class="truncate" style="color: var(--text-secondary);">{{ slice.name }}</span>
                  </div>
                  <span class="font-extrabold tabular shrink-0 ml-2" style="color: var(--text-primary);">{{ slice.percentFormatted }}</span>
                </li>
              </ul>
            </div>
          </article>

          <!-- ----------------------------------------------------
               CASHFLOW: Recent Transactions (span-5)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('cashflow')"
            class="md:col-span-12 lg:col-span-5 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                  Transactions
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  รายการล่าสุด
                </h2>
              </div>
              <NuxtLink to="/cashflow" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                ดูทั้งหมด
              </NuxtLink>
            </div>

            <div v-if="isLoading" class="py-12 text-center text-xs" style="color: var(--text-muted);">
              กำลังโหลดรายการ…
            </div>
            <div v-else-if="!recentTransactions.length" class="py-12 text-center text-xs" style="color: var(--text-muted);">
              ยังไม่มีประวัติรายการเงิน
            </div>
            <div v-else class="mt-3 divide-y" style="border-color: var(--border-subtle);">
              <div
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="py-3 flex items-center justify-between gap-3 group transition-colors rounded-xl px-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    :style="
                      tx.type === 'income'
                        ? { background: 'rgba(34, 197, 94, 0.1)', color: 'var(--ink-emerald)', borderColor: 'rgba(34, 197, 94, 0.2)' }
                        : { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ink-rose)', borderColor: 'rgba(239, 68, 68, 0.2)' }
                    "
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path v-if="tx.type === 'income'" d="M7 17L17 7M17 7H9M17 7v8" />
                      <path v-else d="M17 7L7 17M7 17h8M7 17V9" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs sm:text-sm font-bold truncate" style="color: var(--text-primary);">
                      {{ tx.category || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย') }}
                    </p>
                    <p class="text-[10px] sm:text-xs truncate" style="color: var(--text-muted);">
                      {{ formatDate(tx.entry_date) }}
                    </p>
                  </div>
                </div>

                <span
                  class="text-xs sm:text-sm font-extrabold tabular shrink-0"
                  :style="tx.type === 'income' ? { color: 'var(--ink-emerald)' } : { color: 'var(--ink-rose)' }"
                >
                  {{ tx.type === 'income' ? '+' : '−' }}{{ formatCurrency(tx.amount) }}
                </span>
              </div>
            </div>
          </article>

          <!-- ----------------------------------------------------
               CASHFLOW: Recurring Expenses (span-3 on large)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('cashflow')"
            class="md:col-span-6 lg:col-span-3 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--ink-amber);">
                  Recurring
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  รายจ่ายประจำ
                </h2>
              </div>
              <NuxtLink to="/cashflow" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                จัดการ
              </NuxtLink>
            </div>

            <div v-if="isRecurringLoading" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              กำลังโหลด…
            </div>
            <div v-else-if="!nearestRecurringItemInfo" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              ไม่มีรายการจ่ายประจำเร็วๆ นี้
            </div>
            <div v-else class="mt-4 space-y-3">
              <span
                class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style="background: rgba(245, 158, 11, 0.12); color: var(--ink-amber);"
              >
                {{ nearestRecurringItemInfo.dueLabel }}
              </span>

              <div>
                <h3 class="text-sm font-extrabold truncate" style="color: var(--text-primary);">
                  {{ nearestRecurringItemInfo.item.title }}
                </h3>
                <p class="text-xs mt-0.5" style="color: var(--text-muted);">
                  ทุกวันที่ {{ nearestRecurringItemInfo.item.dayOfMonthDue }} • {{ nearestRecurringItemInfo.countdownText }}
                </p>
              </div>

              <!-- Progress bar -->
              <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :style="{
                    width: `${nearestRecurringItemInfo.progressPercent}%`,
                    background: nearestRecurringItemInfo.minDays <= 0 ? 'var(--ink-rose)' : 'var(--ink-amber)'
                  }"
                ></div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <span class="text-base font-extrabold tabular" style="color: var(--text-primary);">
                  {{ formatCurrency(nearestRecurringItemInfo.item.amount) }}
                </span>
                <button
                  type="button"
                  :disabled="isPayingDashboardRecurringId === nearestRecurringItemInfo.item.id"
                  @click="payDashboardRecurring(nearestRecurringItemInfo.item)"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style="background: var(--ink-emerald);"
                >
                  {{ isPayingDashboardRecurringId === nearestRecurringItemInfo.item.id ? 'กำลังบันทึก…' : 'จ่ายแล้ว' }}
                </button>
              </div>
            </div>
          </article>

          <!-- ----------------------------------------------------
               STUDY SCHEDULE: Classes for today (span-4)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('study-schedule')"
            class="md:col-span-6 lg:col-span-4 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                  Study Schedule
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  {{ isInActiveTerm ? 'ตารางเรียนวันนี้' : 'ตารางเรียน' }}
                </h2>
              </div>
              <NuxtLink to="/study-schedule" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                ดูตาราง
              </NuxtLink>
            </div>

            <div v-if="isScheduleLoading" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              กำลังโหลดข้อมูล…
            </div>
            <div v-else-if="!isInActiveTerm" class="py-8 text-center text-xs" style="color: var(--text-muted);">
              <p>{{ offTermMessage }}</p>
              <div v-if="nextTermCountdown" class="mt-3 p-3 rounded-2xl border text-left" style="background: var(--bg-elevated); border-color: var(--border-subtle);">
                <span class="text-[10px] font-bold uppercase" style="color: var(--brand-ink);">ภาคเรียนถัดไป</span>
                <p class="text-xs font-extrabold mt-0.5" style="color: var(--text-primary);">{{ nextTermCountdown.termName }}</p>
                <p class="text-xs font-bold mt-1" style="color: var(--brand-ink);">เริ่มในอีก {{ nextTermCountdown.label }}</p>
                <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">{{ nextTermCountdown.dateLabel }}</p>
              </div>
            </div>

            <div v-else class="mt-3 space-y-3">
              <!-- Live or Next Class Box -->
              <div
                v-if="currentStudyClass || nextStudyClassToday"
                class="p-3.5 rounded-2xl border transition-all"
                :class="{ 'animate-pulse': isStudyBlinking }"
                :style="
                  currentStudyClass
                    ? { background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.25)' }
                    : { background: 'var(--brand-soft)', borderColor: 'var(--brand-border)' }
                "
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider" :style="{ color: currentStudyClass ? 'var(--ink-emerald)' : 'var(--brand-ink)' }">
                    {{ currentStudyClass ? '● กำลังเรียน' : 'คาบเรียนถัดไป' }}
                  </span>
                  <span class="text-xs font-bold tabular" :style="{ color: currentStudyClass ? 'var(--ink-emerald)' : 'var(--brand-ink)' }">
                    {{ studyCountdownText }}
                  </span>
                </div>
                <h4 class="text-sm font-extrabold mt-1 truncate" style="color: var(--text-primary);">
                  {{ currentStudyClass ? currentStudyClass.course_name : nextStudyClassToday?.course_name }}
                </h4>
                <p class="text-[11px] mt-0.5" style="color: var(--text-muted);">
                  {{ formatTime(currentStudyClass ? currentStudyClass.start_time : (nextStudyClassToday?.start_time || '')) }}–{{ formatTime(currentStudyClass ? currentStudyClass.end_time : (nextStudyClassToday?.end_time || '')) }} น.
                  <template v-if="currentStudyClass?.location || nextStudyClassToday?.location">
                    • {{ currentStudyClass ? currentStudyClass.location : nextStudyClassToday?.location }}
                  </template>
                </p>
              </div>

              <!-- Today's class list -->
              <div v-if="!todaysStudyClasses.length" class="py-6 text-center text-xs" style="color: var(--text-muted);">
                วันนี้ไม่มีคาบเรียน
              </div>
              <div v-else class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <div
                  v-for="item in todaysStudyClasses"
                  :key="item.id"
                  class="p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors"
                  :class="[
                    getClassStatus(item) === 'finished' ? 'opacity-40' : '',
                    isBlinkingRow(item) ? 'animate-pulse' : ''
                  ]"
                  :style="{
                    background: getClassStatus(item) === 'active' ? 'var(--bg-elevated)' : 'transparent',
                    borderColor: 'var(--border-subtle)'
                  }"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-1.5 h-8 rounded-full shrink-0" :style="{ background: courseTint(item.course_name) }"></span>
                    <div class="min-w-0">
                      <p class="font-bold truncate" :class="{ 'line-through': getClassStatus(item) === 'finished' }" style="color: var(--text-primary);">
                        {{ item.course_name }}
                      </p>
                      <p class="text-[10px]" style="color: var(--text-muted);">
                        {{ item.location || 'ไม่ระบุห้อง' }}
                      </p>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="font-semibold tabular block" style="color: var(--text-secondary);">
                      {{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
                    </span>
                    <span v-if="getClassStatus(item) === 'active'" class="text-[10px] font-bold" style="color: var(--ink-emerald);">
                      กำลังเรียน
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- ----------------------------------------------------
               ACTION QUEUE: Tasks & To-dos (span-7)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('tasks') || isModuleEnabled('todos')"
            class="md:col-span-12 lg:col-span-7 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                  Action Queue
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  งานและการบ้านที่ต้องติดตาม
                </h2>
              </div>
              <NuxtLink :to="isModuleEnabled('tasks') ? '/tasks' : '/todos'" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                ดูทั้งหมด
              </NuxtLink>
            </div>

            <div v-if="isTasksLoading || isTodosLoading" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              กำลังโหลดข้อมูล…
            </div>
            <div v-else-if="!dashboardTasks.length && !dashboardTodos.length" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              ยอดเยี่ยม! ไม่มีงานหรือ To-do ที่ต้องเร่งทำในขณะนี้
            </div>
            <div v-else class="mt-3 space-y-3">
              <!-- Tasks Header if both tasks & todos exist -->
              <div v-if="dashboardTasks.length && dashboardTodos.length" class="flex items-center justify-between pt-1">
                <span class="text-xs font-bold" style="color: var(--text-primary);">
                  งานและการบ้าน
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold" style="background: var(--brand-soft); color: var(--brand);">
                  {{ dashboardTasks.length }} รายการ
                </span>
              </div>

              <!-- Tasks list with Countdown Time & Progress Bar -->
              <div
                v-for="task in dashboardTasks"
                :key="`task-${task.id}`"
                class="p-3.5 sm:p-4 rounded-2xl border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style="background: var(--bg-elevated); border-color: var(--border-subtle);"
              >
                <!-- Top Row: title, subject, status badge & complete button -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-2 h-8 rounded-full shrink-0 mt-0.5"
                      :style="{ background: task.isUrgent ? 'var(--ink-rose)' : 'var(--brand)' }"
                    ></div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <NuxtLink
                          :to="`/tasks`"
                          class="font-bold text-xs sm:text-sm truncate hover:underline"
                          style="color: var(--text-primary);"
                        >
                          {{ task.title }}
                        </NuxtLink>
                        <span
                          v-if="task.subject"
                          class="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style="background: var(--brand-soft); color: var(--brand);"
                        >
                          {{ task.subject }}
                        </span>
                      </div>
                      <p class="text-[11px] mt-0.5 truncate" style="color: var(--text-muted);">
                        กำหนดส่ง: {{ formatTaskDeadline(task.deadline) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                      :style="getTaskStatusStyle(task)"
                    >
                      {{ getTaskStatusLabel(task) }}
                    </span>
                    <button
                      type="button"
                      @click="markTaskDone(task.id)"
                      title="ทำเครื่องหมายเสร็จสิ้น"
                      class="px-2.5 py-1 rounded-xl text-[10px] font-semibold border transition-all active:scale-95 hover:border-emerald-500 hover:text-emerald-500"
                      style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-secondary);"
                    >
                      ✓ เสร็จสิ้น
                    </button>
                  </div>
                </div>

                <!-- Countdown Time & Progress Bar Section -->
                <div class="mt-3 pt-2.5 border-t" style="border-color: var(--border-subtle);">
                  <div class="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <div class="flex items-center gap-1.5 min-w-0" :style="{ color: getTaskCountdownDetails(task).color }">
                      <svg class="w-3.5 h-3.5 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span class="truncate">{{ getTaskCountdownDetails(task).countdownText }}</span>
                    </div>
                    <span class="text-[10px] num shrink-0" style="color: var(--text-muted);">
                      {{ getTaskCountdownDetails(task).isOverdue ? 'หมดเวลา' : `${getTaskCountdownDetails(task).progress}% ความเร่งด่วน` }}
                    </span>
                  </div>

                  <!-- Urgency Progress Bar -->
                  <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :style="{
                        width: `${getTaskCountdownDetails(task).progress}%`,
                        background: getTaskCountdownDetails(task).barColor
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Todos Header if both tasks & todos exist -->
              <div v-if="dashboardTasks.length && dashboardTodos.length" class="flex items-center justify-between pt-2">
                <span class="text-xs font-bold" style="color: var(--text-primary);">
                  To-do List ที่ต้องทำ
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold" style="background: var(--bg-elevated-2); color: var(--text-muted);">
                  {{ dashboardTodos.length }} รายการ
                </span>
              </div>

              <!-- Todos list with Countdown & Progress Bar -->
              <div
                v-for="todo in dashboardTodos"
                :key="`todo-${todo.id}`"
                class="p-3.5 sm:p-4 rounded-2xl border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style="background: var(--bg-elevated); border-color: var(--border-subtle);"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-2 h-8 rounded-full shrink-0 mt-0.5"
                      :style="{ background: todo.priority === 'high' ? 'var(--ink-rose)' : 'var(--border-strong)' }"
                    ></div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-bold text-xs sm:text-sm truncate" style="color: var(--text-primary);">{{ todo.title }}</p>
                        <span
                          v-if="todo.tag"
                          class="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style="background: var(--bg-elevated-2); color: var(--text-secondary);"
                        >
                          {{ todo.tag }}
                        </span>
                      </div>
                      <p class="text-[11px] mt-0.5 truncate" style="color: var(--text-muted);">
                        กำหนด: {{ todo.due_date ? formatDate(todo.due_date) : 'ไม่มีกำหนด' }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span
                      v-if="todo.priority === 'high'"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style="background: rgba(239, 68, 68, 0.12); color: var(--ink-rose);"
                    >
                      ด่วน
                    </span>
                    <button
                      type="button"
                      @click="markTodoDone(todo.id)"
                      class="px-2.5 py-1 rounded-xl text-[10px] font-semibold border transition-all active:scale-95 hover:border-emerald-500 hover:text-emerald-500"
                      style="background: var(--bg-card); border-color: var(--border-default); color: var(--text-secondary);"
                    >
                      ✓ เสร็จสิ้น
                    </button>
                  </div>
                </div>

                <!-- Countdown & Progress Bar for Todo (if due_date exists) -->
                <div v-if="todo.due_date" class="mt-3 pt-2.5 border-t" style="border-color: var(--border-subtle);">
                  <div class="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <div class="flex items-center gap-1.5 min-w-0" :style="{ color: getTodoCountdownDetails(todo).color }">
                      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span class="truncate">{{ getTodoCountdownDetails(todo).countdownText }}</span>
                    </div>
                    <span class="text-[10px] num shrink-0" style="color: var(--text-muted);">
                      {{ getTodoCountdownDetails(todo).isOverdue ? 'หมดเวลา' : `${getTodoCountdownDetails(todo).progress}%` }}
                    </span>
                  </div>

                  <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :style="{
                        width: `${getTodoCountdownDetails(todo).progress}%`,
                        background: getTodoCountdownDetails(todo).barColor
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- ----------------------------------------------------
               CALENDAR EVENTS: Upcoming Events (span-5)
               ---------------------------------------------------- -->
          <article
            v-if="isModuleEnabled('events')"
            class="md:col-span-12 lg:col-span-5 p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200"
            style="background: var(--bg-card); border-color: var(--border-default);"
          >
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle);">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--brand-ink);">
                  Calendar
                </span>
                <h2 class="text-base font-bold tracking-tight mt-0.5" style="color: var(--text-primary);">
                  กิจกรรมที่กำลังจะมาถึง
                </h2>
              </div>
              <NuxtLink to="/events" class="text-xs font-bold hover:underline" style="color: var(--brand-ink);">
                ดูปฏิทิน
              </NuxtLink>
            </div>

            <div v-if="eventsErrorMessage" class="p-3 my-2 rounded-xl text-xs" style="background: rgba(239,68,68,0.1); color: var(--ink-rose);">
              {{ eventsErrorMessage }}
            </div>
            <div v-if="isEventsLoading" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              กำลังโหลดข้อมูล…
            </div>
            <div v-else-if="!dashboardEvents.length" class="py-10 text-center text-xs" style="color: var(--text-muted);">
              ไม่มีกิจกรรมที่กำลังดำเนินอยู่หรือกำลังจะถึง
            </div>
            <div v-else class="mt-3 space-y-3">
              <NuxtLink
                v-for="event in dashboardEvents"
                :key="event.id"
                to="/events"
                class="p-3 rounded-2xl border flex items-start gap-3.5 transition-all duration-150 group hover:bg-black/5 dark:hover:bg-white/5"
                style="background: var(--bg-elevated); border-color: var(--border-subtle);"
              >
                <!-- Calendar Day Box -->
                <div
                  class="w-11 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0 text-center"
                  style="background: var(--bg-card); border-color: var(--border-default);"
                >
                  <span class="text-sm font-extrabold leading-none" style="color: var(--brand-ink);">
                    {{ getDay(event.start_date) }}
                  </span>
                  <span class="text-[9px] font-bold leading-none mt-1 uppercase" style="color: var(--text-muted);">
                    {{ getMonthShort(event.start_date) }}
                  </span>
                </div>

                <!-- Event Details -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs sm:text-sm font-bold truncate" style="color: var(--text-primary);">
                      {{ event.title }}
                    </p>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      :style="getDashboardEventStatusBadgeStyle(event)"
                    >
                      {{ getDashboardEventStatusMeta(event).status === 'ongoing' ? 'กำลังดำเนินอยู่' : 'เร็วๆ นี้' }}
                    </span>
                  </div>

                  <p class="text-[11px] mt-0.5 truncate" style="color: var(--text-muted);">
                    {{ displayEventDateTimeShort(event) }}
                  </p>

                  <!-- Countdown & Progress Bar -->
                  <div class="mt-2.5">
                    <div class="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span :style="getDashboardEventStatusTextStyle(event)">
                        {{ getDashboardEventStatusText(event) }}
                      </span>
                      <span style="color: var(--brand-ink);">
                        {{ getDashboardEventStatusMeta(event).status === 'ongoing' ? getDashboardOngoingEventDetails(event).progress : getDashboardUpcomingEventDetails(event).progress }}%
                      </span>
                    </div>
                    <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :style="{
                          width: `${getDashboardEventStatusMeta(event).status === 'ongoing' ? getDashboardOngoingEventDetails(event).progress : getDashboardUpcomingEventDetails(event).progress}%`,
                          background: getDashboardEventStatusMeta(event).status === 'ongoing' ? 'var(--ink-emerald)' : 'var(--brand)'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </article>
        </div>

        <!-- ========================================================
             3. MODULE DISCOVERY NOTICE
             ======================================================== -->
        <div
          v-if="enabledModules.length < allModules.length"
          class="p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          style="background: var(--bg-card); border-color: var(--border-default); border-style: dashed;"
        >
          <div class="space-y-0.5">
            <p class="font-bold text-sm" style="color: var(--text-primary);">
              เปิดใช้งาน {{ enabledModules.length }} จากทั้งหมด {{ allModules.length }} ฟังก์ชัน
            </p>
            <p style="color: var(--text-muted);">
              คุณสามารถเปิดใช้งานฟังก์ชันอื่นๆ เช่น ตารางเรียน การเงิน งาน หรือกิจกรรม เพิ่มเติมได้ตลอดเวลา
            </p>
          </div>
          <NuxtLink
            to="/profile"
            class="px-4 py-2 rounded-xl font-bold border transition-all active:scale-95 shrink-0 text-center"
            style="background: var(--bg-elevated); border-color: var(--border-default); color: var(--text-primary);"
          >
            ตั้งค่าฟังก์ชัน
          </NuxtLink>
        </div>
      </div>
    </AppTabsLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getTodayTH, nowTH } from '~/utils/date'
import { useFinanceBooks } from '~/composables/useFinanceBooks'

const { isModuleEnabled, allModules, enabledModules } = useUserModules()

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

type TaskRow = {
  id: string
  userId: string
  title: string
  subject: string | null
  deadline: string
  isUrgent: boolean
  isCompleted: boolean
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

const userDisplayName = computed(() => currentUser.value?.fullName?.trim() || currentUser.value?.email?.split('@')[0] || 'MyLife User')

const lastUpdateTime = ref(nowTH().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.')

const courseColorMap: Record<string, number> = {
  'โครงสร้างข้อมูล': 0,
  'ปฏิบัติการเว็บ': 1,
  'แคลคูลัส': 1,
  'ภาษาอังกฤษ': 2,
  'ระบบฐานข้อมูล': 3,
  'เครือข่าย': 4,
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

const transactions = ref<TransactionRow[]>([])
const studySchedules = ref<StudyScheduleRow[]>([])
const academicTerms = ref<BackendTerm[]>([])
const todos = ref<TodoRow[]>([])
const tasks = ref<TaskRow[]>([])
const events = ref<DashboardEventRow[]>([])
const currentTime = ref(nowTH())

const isLoading = ref(true)
const isScheduleLoading = ref(true)
const isTodosLoading = ref(true)
const isTasksLoading = ref(true)
const isEventsLoading = ref(true)
const errorMessage = ref('')
const scheduleErrorMessage = ref('')
const todosErrorMessage = ref('')
const tasksErrorMessage = ref('')
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

const totalIncome = computed(() => transactions.value
  .filter((item) => item.type === 'income')
  .reduce((sum, item) => sum + item.amount, 0))

const totalExpense = computed(() => transactions.value
  .filter((item) => item.type === 'expense')
  .reduce((sum, item) => sum + item.amount, 0))

const remainingBalance = computed(() => totalIncome.value - totalExpense.value)
const overspentAmount = computed(() => Math.max(totalExpense.value - totalIncome.value, 0))

const formatPercent = (value: number) => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
}).format(value)

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
    return { slices: [], total: 0, hasData: false }
  }

  const categoryTotals = expenseList.reduce<Record<string, number>>((acc, item) => {
    const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
    acc[key] = (acc[key] || 0) + item.amount
    return acc
  }, {})

  const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
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
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  const slices = displayCategories.map((cat, index) => {
    const percent = (cat.amount / total) * 100
    const dashLength = (percent / 100) * circumference
    const colorObj = expenseDonutColors[index % expenseDonutColors.length]!
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

  return { slices, total, hasData: true }
})

const activeExpenseSlice = computed(() => {
  if (hoveredExpenseCategoryIndex.value !== null) {
    return expenseChartData.value.slices[hoveredExpenseCategoryIndex.value] || null
  }
  return null
})

const recentTransactions = computed(() => transactions.value.slice(0, 5))

const selectedChartRange = ref<'7d' | '30d' | 'this_month' | 'all'>('30d')
const hoveredBarIndex = ref<number | null>(null)

const barChartData = computed(() => {
  if (!transactions.value.length) {
    return { bars: [], empty: true, max: 0, maxFormatted: '฿0', startDate: '', endDate: '' }
  }

  const now = nowTH()
  function formatYYYYMMDD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }

  let startDate: Date
  let periodCount: number
  let groupBy: 'day' | 'week' | 'month' = 'day'

  if (selectedChartRange.value === '7d') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    periodCount = 7
    groupBy = 'day'
  } else if (selectedChartRange.value === '30d') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    periodCount = 5
    groupBy = 'week'
  } else if (selectedChartRange.value === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysInMonth = endOfMonth.getDate()
    periodCount = Math.ceil(daysInMonth / 7)
    groupBy = 'week'
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    periodCount = 6
    groupBy = 'month'
  }

  const startDateStr = formatYYYYMMDD(startDate)
  const filteredTransactions = transactions.value.filter(tx => tx.entry_date >= startDateStr)

  type PeriodData = { income: number; expense: number; label: string; labelShort: string }
  const periods: PeriodData[] = []

  if (groupBy === 'day') {
    for (let i = 0; i < periodCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
      const dateStr = formatYYYYMMDD(d)
      const dayTransactions = filteredTransactions.filter(tx => tx.entry_date === dateStr)
      const income = dayTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
      const expense = dayTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
      const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      const labelShort = d.toLocaleDateString('th-TH', { day: 'numeric' })
      periods.push({ income, expense, label, labelShort })
    }
  } else if (groupBy === 'week') {
    if (selectedChartRange.value === 'this_month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysInMonth = endOfMonth.getDate()
      for (let i = 0; i < periodCount; i++) {
        const startDay = 1 + (i * 7)
        const endDay = Math.min((i + 1) * 7, daysInMonth)
        const weekStart = new Date(now.getFullYear(), now.getMonth(), startDay)
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), endDay)
        const weekStartStr = formatYYYYMMDD(weekStart)
        const weekEndStr = formatYYYYMMDD(weekEnd)

        const weekTransactions = filteredTransactions.filter(tx => tx.entry_date >= weekStartStr && tx.entry_date <= weekEndStr)
        const income = weekTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
        const expense = weekTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
        const label = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekStart.toLocaleDateString('th-TH', { month: 'short' })}`
        const labelShort = `สัปดาห์ ${i + 1}`
        periods.push({ income, expense, label, labelShort })
      }
    } else {
      for (let i = 0; i < periodCount; i++) {
        const weekStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (i * 7))
        let weekEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (i * 7) + 6)
        if (weekEnd > now) {
          weekEnd = new Date(now.getTime())
        }

        const weekStartStr = formatYYYYMMDD(weekStart)
        const weekEndStr = formatYYYYMMDD(weekEnd)

        const weekTransactions = filteredTransactions.filter(tx => tx.entry_date >= weekStartStr && tx.entry_date <= weekEndStr)
        const income = weekTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
        const expense = weekTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
        const label = `${weekStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
        const labelShort = `สัปดาห์ ${i + 1}`
        periods.push({ income, expense, label, labelShort })
      }
    }
  } else {
    for (let i = 0; i < periodCount; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth() + 1
      const monthStr = `${year}-${String(month).padStart(2, '0')}`

      const monthTransactions = filteredTransactions.filter(tx => tx.entry_date.startsWith(monthStr))
      const income = monthTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
      const expense = monthTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
      const label = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
      const labelShort = monthDate.toLocaleDateString('th-TH', { month: 'short' })
      periods.push({ income, expense, label, labelShort })
    }
  }

  const allValues = periods.flatMap(p => [p.income, p.expense])
  const rawMax = Math.max(...allValues, 0)
  const max = rawMax > 0 ? rawMax * 1.15 : 100

  const bars = periods.map(period => ({
    income: period.income,
    expense: period.expense,
    net: period.income - period.expense,
    incomeHeight: rawMax > 0 ? (period.income / max) * 100 : 0,
    expenseHeight: rawMax > 0 ? (period.expense / max) * 100 : 0,
    label: period.label,
    labelShort: period.labelShort
  }))

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  return {
    bars,
    empty: false,
    max,
    maxFormatted: formatCurrency(rawMax > 0 ? rawMax : 0),
    startDate: formatDateShort(startDateStr),
    endDate: formatDateShort(formatYYYYMMDD(now))
  }
})

const termDateKey = (value?: string | null) => (value ? String(value).slice(0, 10) : '')

const formatThaiDateLabel = (dateStr: string) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  return new Date(year, month - 1, day).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

const termStartMs = (term: BackendTerm) => {
  const [year, month, day] = termDateKey(term.startDate).split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

const formatDurationCountdown = (ms: number) => {
  if (ms <= 0) return 'เริ่มแล้ว'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) {
    return hours > 0 ? `${days} วัน ${hours} ชม.` : `${days} วัน`
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`
  }
  if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`
  }
  return `${seconds} วินาที`
}

const activeTerm = computed(() => {
  const todayStr = getTodayTH()
  return academicTerms.value.find((term) => {
    const start = termDateKey(term.startDate)
    const end = termDateKey(term.endDate)
    return Boolean(start && end && start <= todayStr && end >= todayStr)
  }) || null
})

const nextUpcomingTerm = computed(() => {
  const nowMs = currentTime.value.getTime()
  return academicTerms.value
    .filter((term) => termStartMs(term) > nowMs)
    .sort((a, b) => termStartMs(a) - termStartMs(b))[0] || null
})

const isInActiveTerm = computed(() => Boolean(activeTerm.value))
const activeTermName = computed(() => activeTerm.value?.termName || '')

const nextTermCountdown = computed(() => {
  const term = nextUpcomingTerm.value
  if (!term) return null
  const startMs = termStartMs(term)
  if (Number.isNaN(startMs)) return null
  return {
    termName: term.termName,
    label: formatDurationCountdown(startMs - currentTime.value.getTime()),
    dateLabel: `เริ่ม ${formatThaiDateLabel(termDateKey(term.startDate))}`,
  }
})

const offTermMessage = computed(() => {
  if (!academicTerms.value.length) return 'ยังไม่มีภาคเรียนในระบบ'
  if (nextTermCountdown.value) return 'อยู่นอกช่วงเวลาของภาคเรียนปัจจุบัน'
  return 'ภาคเรียนล่าสุดสิ้นสุดแล้ว และยังไม่มีภาคเรียนถัดไป'
})

const sortedStudySchedules = computed(() => [...studySchedules.value].sort((a, b) => {
  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
  return a.start_time.localeCompare(b.start_time)
}))

const todayWeekday = computed(() => {
  const day = currentTime.value.getDay()
  return day === 0 ? 7 : day
})

const todaysStudyClasses = computed(() => sortedStudySchedules.value.filter((item) => item.day_of_week === todayWeekday.value))

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

const { isBlinking: isStudyBlinking } = useStudyBlink(5000)

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

const padZero = (n: number) => n.toString().padStart(2, '0')

const dashboardTasks = computed(() => {
  const nowMs = currentTime.value.getTime()
  return tasks.value
    .filter(t => !t.isCompleted)
    .sort((a, b) => {
      const aMs = new Date(a.deadline).getTime()
      const bMs = new Date(b.deadline).getTime()
      const aOverdue = aMs < nowMs
      const bOverdue = bMs < nowMs
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
      return aMs - bMs
    })
    .slice(0, 6)
})

const formatTaskDeadline = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getTaskCountdownDetails = (task: TaskRow) => {
  if (!task.deadline) {
    return {
      countdownText: 'ไม่มีกำหนดส่ง',
      progress: 0,
      isOverdue: false,
      isDueSoon: false,
      color: 'var(--text-muted)',
      barColor: 'var(--brand)',
      badgeBg: 'var(--bg-elevated)',
    }
  }

  const d = new Date(task.deadline)
  if (isNaN(d.getTime())) {
    return {
      countdownText: task.deadline,
      progress: 0,
      isOverdue: false,
      isDueSoon: false,
      color: 'var(--text-muted)',
      barColor: 'var(--brand)',
      badgeBg: 'var(--bg-elevated)',
    }
  }

  const nowMs = currentTime.value.getTime()
  const deadlineMs = d.getTime()
  const diffMs = deadlineMs - nowMs

  const windowMs = 7 * 24 * 60 * 60 * 1000 // 7-day urgency window

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs)
    const overdueHours = overdueMs / (1000 * 60 * 60)
    const days = Math.floor(overdueHours / 24)
    const hours = Math.floor(overdueHours % 24)
    const minutes = Math.floor((overdueMs / (1000 * 60)) % 60)
    const seconds = Math.floor((overdueMs / 1000) % 60)

    let countdownText = ''
    if (days > 0) {
      countdownText = `เลยกำหนด ${days} วัน ${hours} ชม.`
    } else if (hours > 0) {
      countdownText = `เลยกำหนด ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)} ชม.`
    } else {
      countdownText = `เลยกำหนด ${minutes} นาที ${padZero(seconds)} วินาที`
    }

    return {
      countdownText,
      progress: 100,
      isOverdue: true,
      isDueSoon: false,
      color: 'var(--ink-rose)',
      barColor: 'var(--ink-rose)',
      badgeBg: 'rgba(239, 68, 68, 0.12)',
    }
  }

  const diffHours = diffMs / (1000 * 60 * 60)
  const days = Math.floor(diffHours / 24)
  const hours = Math.floor(diffHours % 24)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
  const seconds = Math.floor((diffMs / 1000) % 60)

  // Progress fills up towards 100% as deadline approaches within the 7-day window
  const elapsedMs = Math.max(0, windowMs - diffMs)
  const rawProgress = Math.min(100, Math.max(8, Math.round((elapsedMs / windowMs) * 100)))

  let countdownText = ''
  let isDueSoon = false
  let barColor = 'var(--brand)'
  let color = 'var(--brand-ink)'
  let badgeBg = 'var(--brand-soft)'

  if (diffHours <= 24) {
    isDueSoon = true
    barColor = 'linear-gradient(90deg, var(--ink-amber), var(--ink-rose))'
    color = 'var(--ink-rose)'
    badgeBg = 'rgba(239, 68, 68, 0.12)'
    if (hours === 0) {
      countdownText = `เหลืออีก ${minutes} นาที ${padZero(seconds)} วินาที`
    } else {
      countdownText = `เหลืออีก ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)} ชม.`
    }
  } else if (days <= 3) {
    barColor = 'linear-gradient(90deg, var(--brand), var(--ink-amber))'
    color = 'var(--ink-amber)'
    badgeBg = 'rgba(245, 158, 11, 0.12)'
    countdownText = `เหลืออีก ${days} วัน ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`
  } else {
    barColor = 'var(--brand)'
    color = 'var(--brand-ink)'
    badgeBg = 'var(--brand-soft)'
    countdownText = `เหลืออีก ${days} วัน ${hours} ชม.`
  }

  return {
    countdownText,
    progress: rawProgress,
    isOverdue: false,
    isDueSoon,
    color,
    barColor,
    badgeBg,
  }
}

const getTodoCountdownDetails = (todo: TodoRow) => {
  if (!todo.due_date) {
    return {
      countdownText: 'ไม่มีกำหนดวัน',
      progress: 0,
      isOverdue: false,
      isDueSoon: false,
      color: 'var(--text-muted)',
      barColor: 'var(--border-strong)',
    }
  }

  const dueD = new Date(`${todo.due_date}T23:59:59`)
  if (isNaN(dueD.getTime())) {
    return {
      countdownText: todo.due_date,
      progress: 0,
      isOverdue: false,
      isDueSoon: false,
      color: 'var(--text-muted)',
      barColor: 'var(--brand)',
    }
  }

  const nowMs = currentTime.value.getTime()
  const diffMs = dueD.getTime() - nowMs
  const windowMs = 5 * 24 * 60 * 60 * 1000

  if (diffMs < 0) {
    const overdueDays = Math.max(1, Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24)))
    return {
      countdownText: `เลยกำหนด ${overdueDays} วัน`,
      progress: 100,
      isOverdue: true,
      isDueSoon: false,
      color: 'var(--ink-rose)',
      barColor: 'var(--ink-rose)',
    }
  }

  const diffHours = diffMs / (1000 * 60 * 60)
  const days = Math.floor(diffHours / 24)
  const hours = Math.floor(diffHours % 24)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
  const seconds = Math.floor((diffMs / 1000) % 60)

  const elapsedMs = Math.max(0, windowMs - diffMs)
  const progress = Math.min(100, Math.max(10, Math.round((elapsedMs / windowMs) * 100)))

  if (days === 0) {
    return {
      countdownText: `ครบกำหนดวันนี้ (${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)})`,
      progress,
      isOverdue: false,
      isDueSoon: true,
      color: 'var(--ink-amber)',
      barColor: 'var(--ink-amber)',
    }
  }

  return {
    countdownText: `เหลืออีก ${days} วัน`,
    progress,
    isOverdue: false,
    isDueSoon: false,
    color: 'var(--brand-ink)',
    barColor: 'var(--brand)',
  }
}

const getTaskStatusLabel = (task: TaskRow) => {
  const cd = getTaskCountdownDetails(task)
  if (cd.isOverdue) return 'เลยกำหนด'
  if (cd.isDueSoon) return 'ส่งเร็วๆ นี้'
  if (task.isUrgent) return 'ด่วน'
  return 'กำลังทำ'
}

const getTaskStatusStyle = (task: TaskRow) => {
  const cd = getTaskCountdownDetails(task)
  return {
    color: cd.color,
    background: cd.badgeBg,
    border: `1px solid ${cd.isOverdue ? 'rgba(239, 68, 68, 0.25)' : cd.isDueSoon ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-subtle)'}`,
  }
}

const dashboardEvents = computed(() => {
  const nowMs = currentTime.value.getTime()
  const upcomingEvents = events.value
    .filter(e => {
      const { endMs } = getDashboardEventDateTimeBounds(e)
      return endMs >= nowMs
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time || '').localeCompare(b.start_time || ''))

  const ongoingEvents = upcomingEvents.filter(e => {
    const { startMs, endMs } = getDashboardEventDateTimeBounds(e)
    return startMs <= nowMs && nowMs <= endMs
  })

  if (ongoingEvents.length > 0) {
    return ongoingEvents.slice(0, 4)
  }
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
  const progress = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100))
  return { progress: Number(progress.toFixed(1)) }
}

const getDashboardUpcomingEventDetails = (item: DashboardEventRow) => {
  const { startMs } = getDashboardEventDateTimeBounds(item)
  const nowMs = currentTime.value.getTime()
  const remainingMs = Math.max(0, startMs - nowMs)
  const window30d = 30 * 24 * 60 * 60 * 1000
  const elapsed30d = Math.max(0, window30d - remainingMs)
  const progress = Math.min(100, Math.max(0, (elapsed30d / window30d) * 100))
  return { progress: Number(progress.toFixed(1)) }
}

const getDashboardEventStatusText = (item: DashboardEventRow) => getDashboardEventStatusMeta(item).text

const getDashboardEventStatusBadgeStyle = (item: DashboardEventRow) => {
  const meta = getDashboardEventStatusMeta(item)
  if (meta.status === 'ongoing') {
    return { background: 'rgba(34, 197, 94, 0.1)', color: 'var(--ink-emerald)' }
  }
  if (meta.status === 'soon') {
    return { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--ink-amber)' }
  }
  return { background: 'var(--brand-soft)', color: 'var(--brand-ink)' }
}

const getDashboardEventStatusTextStyle = (item: DashboardEventRow) => {
  const meta = getDashboardEventStatusMeta(item)
  if (meta.status === 'ongoing') return { color: 'var(--ink-emerald)' }
  if (meta.status === 'soon') return { color: 'var(--ink-amber)' }
  return { color: 'var(--brand-ink)' }
}

type BackendTransaction = {
  id: string
  userId: string
  bookId?: string | null
  type: string
  amount: number
  category: string | null
  transactionDate: string
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
  return terms.find(t => {
    const start = termDateKey(t.startDate)
    const end = termDateKey(t.endDate)
    return Boolean(start && end && start <= todayStr && end >= todayStr)
  }) || null
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
    academicTerms.value = data
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

const loadTasks = async () => {
  isTasksLoading.value = true
  tasksErrorMessage.value = ''
  try {
    if (!userId.value) return
    const data = await apiFetch<TaskRow[]>(`/api/Task/${userId.value}`)
    tasks.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Load tasks error:', error)
    tasksErrorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลงานและการบ้านไม่สำเร็จ')
  } finally {
    isTasksLoading.value = false
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

const markTaskDone = async (id: string) => {
  const task = tasks.value.find(t => t.id === id)
  if (!task) return
  try {
    await apiFetch(`/api/Task/${id}`, {
      method: 'PUT',
      body: {
        title: task.title,
        subject: task.subject,
        deadline: task.deadline,
        isUrgent: task.isUrgent,
        isCompleted: true,
      },
    })
    tasks.value = tasks.value.map(t => t.id === id ? { ...t, isCompleted: true } : t)
  } catch (err: any) {
    console.error('Mark task done error:', err)
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

let recurringCountdownTimer: ReturnType<typeof setInterval> | null = null
const forceRecurringUpdate = ref(0)

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
  forceRecurringUpdate.value

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
  if (minDays === 0) {
    dueLabel = 'ครบกำหนดวันนี้'
  } else if (minDays < 0) {
    dueLabel = `เลยกำหนด ${Math.abs(minDays)} วัน`
  } else {
    dueLabel = `อีก ${minDays} วัน`
  }

  const startDate = nearestItem.startDate
    ? new Date(nearestItem.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const totalDuration = nearestNextDue.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, elapsed / totalDuration)) : 0
  const progressPercent = Math.round(progress * 100)

  return {
    item: nearestItem,
    nextDue: nearestNextDue,
    minDays,
    countdownText,
    dueLabel,
    progress,
    progressPercent,
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
  if (isModuleEnabled('tasks')) {
    promises.push(loadTasks())
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

  recurringCountdownTimer = setInterval(() => {
    if (recurringExpenses.value.length > 0) {
      forceRecurringUpdate.value++
    }
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (recurringCountdownTimer) {
    clearInterval(recurringCountdownTimer)
    recurringCountdownTimer = null
  }
})
</script>
