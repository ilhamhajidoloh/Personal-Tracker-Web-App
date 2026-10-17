<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8 space-y-6">
      <!-- 1. Page Header Block -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="eyebrow">การเงิน &bull; CASHFLOW</span>
            <span
              v-if="selectedBook"
              class="text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
              :style="{ background: `${selectedBook.color}15`, color: selectedBook.color, border: `1px solid ${selectedBook.color}35` }"
            >
              <span>{{ selectedBook.icon }}</span>
              <span>{{ selectedBook.name }}</span>
            </span>
          </div>
          <h1 class="text-2xl md:text-[32px] font-extrabold tracking-tight mt-1" style="color: var(--text-primary);">
            รายรับ<span class="text-gradient">·</span>รายจ่าย
          </h1>
          <p class="text-xs mt-1.5 flex items-center gap-2 flex-wrap font-medium" style="color: var(--text-muted);">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{{ currentMonthYearLabel }}</span>
            </span>
            <span>&bull;</span>
            <span class="num font-semibold">{{ transactions.length }} รายการ</span>
            <span v-if="recurringExpenses.length > 0">&bull;</span>
            <span v-if="recurringExpenses.length > 0" class="font-semibold flex items-center gap-1" style="color: var(--ink-amber);">
              🔄 {{ recurringExpenses.length }} รายจ่ายประจำ
            </span>
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            @click="openExportModal"
            :disabled="transactions.length === 0"
            class="btn-secondary text-xs sm:text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
            title="Export ข้อมูล (PDF, Excel, CSV)"
          >
            <svg class="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            <span class="font-semibold">ส่งออก</span>
          </button>
          <button
            @click="refreshData"
            :disabled="isLoading || isLoadingBooks"
            class="btn-secondary text-xs sm:text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
            title="รีเฟรชข้อมูล"
          >
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
            <span class="hidden sm:inline">{{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}</span>
          </button>
          <button
            @click="openAddTransactionModal"
            class="btn-primary text-xs sm:text-sm inline-flex items-center gap-2 tap-scale touch-target"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span class="font-semibold">เพิ่มรายการ</span>
          </button>
        </div>
      </div>

      <!-- 2. Multi-Book Switcher Block -->
      <section class="section-card p-3 sm:p-4">
        <div class="flex items-center justify-between gap-3 mb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-sm">💼</span>
            <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-secondary);">สมุดบัญชี (Books)</span>
            <span class="num text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--bg-elevated); color: var(--text-muted);">
              {{ books.length }} เล่ม
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="openManageBooksModal"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all tap-scale"
              style="background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);"
            >
              <span>⚙️</span>
              <span class="hidden sm:inline">จัดการสมุด</span>
            </button>
            <button
              type="button"
              @click="openCreateBookModal"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all tap-scale"
              style="background: var(--brand-soft); color: var(--brand-ink); border: 1px solid var(--brand-border);"
            >
              <span>+</span>
              <span class="hidden sm:inline">เพิ่มสมุด</span>
            </button>
          </div>
        </div>

        <!-- Scrollable Book Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <!-- All Books -->
          <button
            type="button"
            @click="selectBook('all')"
            class="book-pill"
            :class="{ 'book-pill-active': selectedBookId === 'all' }"
          >
            <span class="text-base">📊</span>
            <span class="font-semibold">ทุกสมุด</span>
            <span class="book-pill-badge">{{ transactions.length }}</span>
          </button>

          <!-- Individual Books -->
          <button
            v-for="book in books"
            :key="book.id"
            type="button"
            @click="selectBook(book.id)"
            class="book-pill"
            :class="{ 'book-pill-selected': selectedBookId === book.id }"
            :style="selectedBookId === book.id ? {
              background: `${book.color}18`,
              borderColor: `${book.color}60`,
              color: book.color
            } : {}"
          >
            <span class="text-base">{{ book.icon || '💼' }}</span>
            <span class="font-semibold">{{ book.name }}</span>
            <span v-if="book.isDefault" class="book-default-badge" :style="{ background: `${book.color}20`, color: book.color }">
              หลัก
            </span>
          </button>
        </div>
      </section>

      <!-- Error Message Banner -->
      <div
        v-if="errorMessage"
        class="rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium"
        style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.3); color: var(--ink-amber);"
      >
        <span>⚠️</span><span>{{ errorMessage }}</span>
      </div>

      <!-- Persistent Net Balance: visible in every Cashflow sub-tab -->
      <section
        class="section-card p-5 sm:p-6 relative overflow-hidden"
        style="background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));"
      >
        <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div class="flex items-center justify-between gap-3">
              <span class="eyebrow">คงเหลือสุทธิ · NET BALANCE</span>
              <span
                class="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                :style="remainingBalance >= 0
                  ? { background: 'rgba(40, 116, 91, 0.12)', color: 'var(--ink-emerald)', border: '1px solid rgba(40, 116, 91, 0.25)' }
                  : { background: 'rgba(172, 77, 90, 0.12)', color: 'var(--ink-rose)', border: '1px solid rgba(172, 77, 90, 0.25)' }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ background: remainingBalance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)' }"></span>
                <span>{{ remainingBalance >= 0 ? 'สภาพคล่องบวก' : 'ยอดติดลบ' }}</span>
              </span>
            </div>
            <p
              class="num text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight mt-3"
              :style="{ color: remainingBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-rose)' }"
            >
              {{ formatCurrency(remainingBalance) }}
            </p>
            <p class="text-xs mt-1" style="color: var(--text-muted);">
              {{ currentMonthYearLabel }} &bull; ยอดรวมของทุกรายการในช่วงเวลานี้
            </p>
          </div>

          <div class="w-full sm:max-w-md">
            <div class="flex items-center justify-between text-xs font-semibold mb-2">
              <span class="flex items-center gap-1.5" style="color: var(--ink-emerald);">
                <span class="w-2 h-2 rounded-full" style="background: var(--ink-emerald);"></span>
                รับ +{{ formatCurrency(totalIncome) }}
              </span>
              <span class="flex items-center gap-1.5" style="color: var(--ink-rose);">
                จ่าย −{{ formatCurrency(totalExpense) }}
                <span class="w-2 h-2 rounded-full" style="background: var(--ink-rose);"></span>
              </span>
            </div>
            <div class="h-2.5 rounded-full overflow-hidden flex" style="background: var(--bg-surface); border: 1px solid var(--border-subtle);">
              <div class="h-full transition-all duration-500 rounded-l-full" :style="{ width: totalIncome + totalExpense > 0 ? `${(totalIncome / (totalIncome + totalExpense)) * 100}%` : '50%', background: 'var(--ink-emerald)' }"></div>
              <div class="h-full transition-all duration-500 rounded-r-full" :style="{ width: totalIncome + totalExpense > 0 ? `${(totalExpense / (totalIncome + totalExpense)) * 100}%` : '50%', background: 'var(--ink-rose)' }"></div>
            </div>
            <div class="flex items-center justify-between text-[11px] mt-2" style="color: var(--text-muted);">
              <span>{{ expenseProgressText }}</span>
              <span v-if="overspentAmount > 0" class="font-bold" style="color: var(--ink-rose);">⚠️ เกินงบ {{ formatCurrency(overspentAmount) }}</span>
              <span v-else>{{ remainingProgressText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Navigation View Tabs -->
      <nav class="cashflow-view-tabs" aria-label="Cashflow views">
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            @click="activeTab = tab.id"
            class="tab-button"
            :class="{ 'tab-button-active': activeTab === tab.id }"
          >
            <span class="cashflow-tab-icon">{{ tab.icon }}</span>
            <span class="font-semibold text-xs sm:text-sm">{{ tab.id === 'analytics' ? 'รายการแยกประเภท' : tab.label }}</span>
            <span
              v-if="tab.id === 'recurring' && recurringExpenses.length > 0"
              class="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              :class="activeTab === 'recurring' ? 'bg-white/30 text-white' : 'bg-amber-500/15 text-amber-500'"
            >
              {{ recurringExpenses.length }}
            </span>
            <span
              v-if="tab.id === 'analytics' && transactions.length > 0"
              class="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              :class="activeTab === 'analytics' ? 'bg-white/30 text-white' : 'bg-gray-800/10 text-gray-500'"
            >
              {{ transactions.length }}
            </span>
          </button>
        </div>
      </nav>

      <!-- 4. Tab Contents -->
      <div>
        <!-- Tab 1: ภาพรวม (Overview) -->
        <div v-show="activeTab === 'overview'" class="space-y-6">
          <!-- Flow Summary -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- Inflow & Outflow Cards -->
            <div class="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Income Card -->
              <div class="section-card p-4 sm:p-5 flex flex-col justify-between">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style="background: rgba(40, 116, 91, 0.12); color: var(--ink-emerald); border: 1px solid rgba(40, 116, 91, 0.2);"
                    >
                      📈
                    </div>
                    <div>
                      <p class="eyebrow" style="color: var(--ink-emerald);">รายรับรวม</p>
                      <h3 class="text-sm font-bold" style="color: var(--text-primary);">Total Inflow</h3>
                    </div>
                  </div>
                  <button
                    v-if="incomeCategoryRankings.length > 0"
                    @click="isIncomeRankingModalOpen = true"
                    class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all tap-scale"
                    style="background: var(--bg-elevated); color: var(--brand-ink); border: 1px solid var(--border-subtle);"
                  >
                    อันดับ →
                  </button>
                </div>
                <div class="mt-3">
                  <p class="num text-2xl font-bold" style="color: var(--ink-emerald);">
                    +{{ formatCurrency(totalIncome) }}
                  </p>
                  <p class="text-[11px] mt-1" style="color: var(--text-muted);">
                    {{ incomeCategoryRankings.length }} หมวดหมู่รายรับ
                  </p>
                </div>
              </div>

              <!-- Expense Card -->
              <div class="section-card p-4 sm:p-5 flex flex-col justify-between">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style="background: rgba(172, 77, 90, 0.12); color: var(--ink-rose); border: 1px solid rgba(172, 77, 90, 0.2);"
                    >
                      📉
                    </div>
                    <div>
                      <p class="eyebrow" style="color: var(--ink-rose);">รายจ่ายรวม</p>
                      <h3 class="text-sm font-bold" style="color: var(--text-primary);">Total Outflow</h3>
                    </div>
                  </div>
                  <button
                    v-if="expenseCategoryRankings.length > 0"
                    @click="isRankingModalOpen = true"
                    class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all tap-scale"
                    style="background: var(--bg-elevated); color: var(--ink-rose); border: 1px solid var(--border-subtle);"
                  >
                    อันดับ →
                  </button>
                </div>
                <div class="mt-3">
                  <p class="num text-2xl font-bold" style="color: var(--ink-rose);">
                    −{{ formatCurrency(totalExpense) }}
                  </p>
                  <p class="text-[11px] mt-1 truncate" style="color: var(--text-muted);">
                    หมวดสูงสุด: <strong style="color: var(--text-primary);">{{ topExpenseCategory.name }}</strong> ({{ formatCurrency(topExpenseCategory.amount) }})
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Top / Bottom Expense Category Rankings -->
          <div v-if="expenseCategoryRankings.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Top 3 Highest -->
            <div class="section-card p-5">
              <div class="flex items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style="background: rgba(172, 77, 90, 0.12); color: var(--ink-rose);"
                  >🔺</div>
                  <div>
                    <h2 class="text-sm font-bold" style="color: var(--text-primary);">3 อันดับรายจ่ายสูงสุด</h2>
                    <p class="text-[11px]" style="color: var(--text-muted);">หมวดหมู่ที่มีการใช้จ่ายมากที่สุด</p>
                  </div>
                </div>
                <button
                  @click="isRankingModalOpen = true"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all tap-scale"
                  style="background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);"
                >
                  ดูทั้งหมด ({{ expenseCategoryRankings.length }}) →
                </button>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="(cat, i) in topExpenseCategories"
                  :key="cat.name"
                  class="p-3 rounded-xl transition-all"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span
                        class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        :style="i === 0
                          ? { background: 'rgba(172, 77, 90, 0.2)', color: 'var(--ink-rose)' }
                          : i === 1
                            ? { background: 'rgba(168, 93, 51, 0.2)', color: 'var(--ink-orange)' }
                            : { background: 'rgba(147, 112, 61, 0.2)', color: 'var(--ink-amber)' }"
                      >
                        {{ i + 1 }}
                      </span>
                      <span class="text-sm font-semibold truncate" style="color: var(--text-primary);">{{ cat.name }}</span>
                    </div>
                    <span class="num text-sm font-bold shrink-0" style="color: var(--ink-rose);">
                      {{ formatCurrency(cat.amount) }}
                    </span>
                  </div>
                  <!-- Progress bar -->
                  <div class="mt-2 flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface);">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${(cat.amount / (expenseCategoryRankings[0]?.amount || 1)) * 100}%`,
                          background: 'var(--ink-rose)'
                        }"
                      ></div>
                    </div>
                    <span class="num text-[10px] font-semibold shrink-0" style="color: var(--text-muted);">
                      {{ formatPercent((cat.amount / (totalExpense || 1)) * 100) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top 3 Lowest -->
            <div class="section-card p-5">
              <div class="flex items-center gap-2.5 mb-4">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style="background: rgba(40, 116, 91, 0.12); color: var(--ink-emerald);"
                >🔻</div>
                <div>
                  <h2 class="text-sm font-bold" style="color: var(--text-primary);">3 อันดับรายจ่ายน้อยสุด</h2>
                  <p class="text-[11px]" style="color: var(--text-muted);">หมวดหมู่ที่มีการประหยัดงบได้ดี</p>
                </div>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="(cat, i) in bottomExpenseCategories"
                  :key="cat.name"
                  class="p-3 rounded-xl transition-all"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span
                        class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        :style="i === 0
                          ? { background: 'rgba(40, 116, 91, 0.2)', color: 'var(--ink-emerald)' }
                          : i === 1
                            ? { background: 'rgba(40, 118, 110, 0.2)', color: 'var(--ink-teal)' }
                            : { background: 'rgba(40, 114, 138, 0.2)', color: 'var(--ink-cyan)' }"
                      >
                        {{ i + 1 }}
                      </span>
                      <span class="text-sm font-semibold truncate" style="color: var(--text-primary);">{{ cat.name }}</span>
                    </div>
                    <span class="num text-sm font-bold shrink-0" style="color: var(--ink-emerald);">
                      {{ formatCurrency(cat.amount) }}
                    </span>
                  </div>
                  <!-- Progress bar -->
                  <div class="mt-2 flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface);">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${(cat.amount / (bottomExpenseCategories[bottomExpenseCategories.length - 1]?.amount || 1)) * 100}%`,
                          background: 'var(--ink-emerald)'
                        }"
                      ></div>
                    </div>
                    <span class="num text-[10px] font-semibold shrink-0" style="color: var(--text-muted);">
                      {{ formatPercent((cat.amount / (totalExpense || 1)) * 100) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Recurring Expenses Section -->
        <div v-show="activeTab === 'recurring'" class="space-y-5">
          <!-- Top Metric & Quick Action Card -->
          <div class="section-card p-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style="background: rgba(147, 112, 61, 0.15); color: var(--ink-amber); border: 1px solid rgba(147, 112, 61, 0.25);"
                >
                  🔄
                </div>
                <div>
                  <h2 class="text-base font-bold" style="color: var(--text-primary);">รายจ่ายประจำ (Recurring Bills)</h2>
                  <p class="text-xs" style="color: var(--text-muted);">รายการผ่อนชำระและค่าใช้จ่ายที่ต้องจ่ายทุกเดือน</p>
                </div>
              </div>
              <button
                @click="openAddRecurringModal"
                class="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-2 tap-scale touch-target self-start sm:self-auto"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                <span>เพิ่มรายจ่ายประจำ</span>
              </button>
            </div>

            <!-- Mini Summary Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t" style="border-color: var(--border-subtle);">
              <div class="p-3 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                <p class="text-[11px]" style="color: var(--text-muted);">ยอดจ่ายประจำต่อเดือน</p>
                <p class="num text-lg font-bold mt-0.5" style="color: var(--text-primary);">
                  ฿{{ formatCurrency(recurringTotalMonthly).replace('฿', '') }}
                </p>
              </div>
              <div class="p-3 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                <p class="text-[11px]" style="color: var(--text-muted);">ใกล้ครบกำหนด (ภายใน 3 วัน)</p>
                <p class="num text-lg font-bold mt-0.5" :style="{ color: recurringDueSoonCount > 0 ? 'var(--ink-amber)' : 'var(--ink-emerald)' }">
                  {{ recurringDueSoonCount }} รายการ
                </p>
              </div>
              <div class="p-3 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                <p class="text-[11px]" style="color: var(--text-muted);">ทั้งหมดในระบบ</p>
                <p class="num text-lg font-bold mt-0.5" style="color: var(--text-primary);">
                  {{ recurringExpenses.length }} รายการ (ผ่อน {{ fixedRecurringExpenses.length }} &bull; ตลอดชีพ {{ indefiniteRecurringExpenses.length }})
                </p>
              </div>
            </div>
          </div>

          <!-- Loading Skeleton -->
          <div v-if="isLoadingRecurring" class="section-card p-5 space-y-3">
            <div v-for="i in 2" :key="i" class="h-20 rounded-xl bg-gray-800/10 animate-pulse"></div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!recurringExpenses.length" class="section-card flex flex-col items-center justify-center py-12 text-center px-5">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
              style="background: rgba(147, 112, 61, 0.12); color: var(--ink-amber); border: 1px solid rgba(147, 112, 61, 0.2);"
            >
              📅
            </div>
            <p class="text-sm font-bold" style="color: var(--text-primary);">ยังไม่มีรายการจ่ายประจำ</p>
            <p class="text-xs mt-1 max-w-sm" style="color: var(--text-muted);">
              กด "+ เพิ่มรายจ่ายประจำ" เพื่อบันทึกค่าเช่า ค่างวด ค่าเน็ต หรือบริการรายเดือน ระบบจะช่วยนับถอยหลังและบันทึกอัตโนมัติ
            </p>
            <button
              @click="openAddRecurringModal"
              class="btn-primary text-xs py-2 px-4 mt-4 inline-flex items-center gap-1.5 tap-scale"
            >
              <span>+ เพิ่มรายการแรก</span>
            </button>
          </div>

          <div v-else class="space-y-5">
            <!-- Group 1: มีกำหนดระยะเวลา -->
            <div v-if="fixedRecurringExpenses.length > 0" class="section-card p-4 sm:p-5">
              <div class="flex items-center justify-between gap-2 mb-3">
                <p class="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style="color: var(--text-secondary);">
                  <span class="w-2.5 h-2.5 rounded-full" style="background: var(--ink-amber);"></span>
                  มีกำหนดระยะเวลา (Installments / งวด)
                </p>
                <span class="num text-xs font-semibold px-2 py-0.5 rounded-full" style="background: var(--bg-elevated); color: var(--text-muted);">
                  {{ fixedRecurringExpenses.length }} รายการ
                </span>
              </div>

              <div class="space-y-3">
                <div
                  v-for="r in fixedRecurringExpenses"
                  :key="r.id"
                  @click="openEditRecurringModal(r)"
                  class="p-4 rounded-xl transition-all cursor-pointer space-y-3 group"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
                >
                  <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style="background: rgba(147, 112, 61, 0.15); color: var(--ink-amber);"
                      >
                        🗓️
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="text-sm font-bold truncate group-hover:text-amber-500 transition-colors" style="color: var(--text-primary);">
                            {{ r.title }}
                          </p>
                          <span
                            v-if="selectedBookId === 'all' && getBookById(r.bookId)"
                            class="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                            :style="{ background: `${getBookById(r.bookId)?.color}15`, color: getBookById(r.bookId)?.color }"
                          >
                            {{ getBookById(r.bookId)?.icon }} {{ getBookById(r.bookId)?.name }}
                          </span>
                        </div>
                        <p class="text-xs mt-0.5 truncate" style="color: var(--text-muted);">
                          จ่ายทุกวันที่ {{ r.dayOfMonthDue }} &bull; {{ formatShortDate(r.startDate) }} - {{ formatShortDate(r.endDate!) }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                      <div class="text-right">
                        <p class="num text-sm sm:text-base font-bold" style="color: var(--text-primary);">
                          ฿{{ formatCurrency(r.amount).replace('฿', '') }}
                        </p>
                        <span
                          class="inline-block mt-0.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border"
                          :class="getDueInfo(r).statusClass"
                        >
                          {{ getDueInfo(r).label }}
                        </span>
                        <div class="mt-1 text-[10px] font-mono font-semibold" style="color: var(--ink-amber);">
                          ⏱️ {{ getDueInfo(r).countdownText }}
                        </div>
                      </div>

                      <button
                        @click.stop="payRecurring(r)"
                        :disabled="isPayingRecurringId === r.id"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all tap-scale touch-target disabled:opacity-50"
                        style="background: rgba(40, 116, 91, 0.15); color: var(--ink-emerald); border: 1px solid rgba(40, 116, 91, 0.3);"
                      >
                        <svg v-if="isPayingRecurringId !== r.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span v-else class="inline-block w-3 h-3 border-2 rounded-full animate-spin" style="border-color: rgba(40, 116, 91, 0.3); border-top-color: var(--ink-emerald);"></span>
                        <span>จ่ายแล้ว</span>
                      </button>
                    </div>
                  </div>

                  <!-- Cycle Progress Bar -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[10px] font-semibold">
                      <span style="color: var(--text-muted);">ความคืบหน้าของรอบ</span>
                      <span :style="{ color: getDueInfo(r).daysUntil <= 0 ? 'var(--ink-rose)' : 'var(--ink-amber)' }">
                        {{ getDueInfo(r).progressPercent }}%
                      </span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface);">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :style="{
                          width: `${getDueInfo(r).progressPercent}%`,
                          background: getDueInfo(r).daysUntil <= 0 ? 'var(--ink-rose)' : 'var(--ink-amber)'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Group 2: ไม่มีกำหนดสิ้นสุด -->
            <div v-if="indefiniteRecurringExpenses.length > 0" class="section-card p-4 sm:p-5">
              <div class="flex items-center justify-between gap-2 mb-3">
                <p class="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style="color: var(--text-secondary);">
                  <span class="w-2.5 h-2.5 rounded-full" style="background: var(--ink-sky);"></span>
                  ไม่มีกำหนดสิ้นสุด (Subscriptions & Recurring)
                </p>
                <span class="num text-xs font-semibold px-2 py-0.5 rounded-full" style="background: var(--bg-elevated); color: var(--text-muted);">
                  {{ indefiniteRecurringExpenses.length }} รายการ
                </span>
              </div>

              <div class="space-y-3">
                <div
                  v-for="r in indefiniteRecurringExpenses"
                  :key="r.id"
                  @click="openEditRecurringModal(r)"
                  class="p-4 rounded-xl transition-all cursor-pointer space-y-3 group"
                  style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
                >
                  <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style="background: rgba(37, 99, 168, 0.12); color: var(--ink-sky);"
                      >
                        ♾️
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="text-sm font-bold truncate group-hover:text-sky-500 transition-colors" style="color: var(--text-primary);">
                            {{ r.title }}
                          </p>
                          <span
                            v-if="selectedBookId === 'all' && getBookById(r.bookId)"
                            class="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                            :style="{ background: `${getBookById(r.bookId)?.color}15`, color: getBookById(r.bookId)?.color }"
                          >
                            {{ getBookById(r.bookId)?.icon }} {{ getBookById(r.bookId)?.name }}
                          </span>
                        </div>
                        <p class="text-xs mt-0.5 truncate" style="color: var(--text-muted);">
                          จ่ายทุกวันที่ {{ r.dayOfMonthDue }} &bull; เริ่ม {{ formatShortDate(r.startDate) }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                      <div class="text-right">
                        <p class="num text-sm sm:text-base font-bold" style="color: var(--text-primary);">
                          ฿{{ formatCurrency(r.amount).replace('฿', '') }}
                        </p>
                        <span
                          class="inline-block mt-0.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border"
                          :class="getDueInfo(r).statusClass"
                        >
                          {{ getDueInfo(r).label }}
                        </span>
                        <div class="mt-1 text-[10px] font-mono font-semibold" style="color: var(--ink-amber);">
                          ⏱️ {{ getDueInfo(r).countdownText }}
                        </div>
                      </div>

                      <button
                        @click.stop="payRecurring(r)"
                        :disabled="isPayingRecurringId === r.id"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all tap-scale touch-target disabled:opacity-50"
                        style="background: rgba(40, 116, 91, 0.15); color: var(--ink-emerald); border: 1px solid rgba(40, 116, 91, 0.3);"
                      >
                        <svg v-if="isPayingRecurringId !== r.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span v-else class="inline-block w-3 h-3 border-2 rounded-full animate-spin" style="border-color: rgba(40, 116, 91, 0.3); border-top-color: var(--ink-emerald);"></span>
                        <span>จ่ายแล้ว</span>
                      </button>
                    </div>
                  </div>

                  <!-- Cycle Progress Bar -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[10px] font-semibold">
                      <span style="color: var(--text-muted);">ความคืบหน้าของรอบ</span>
                      <span :style="{ color: getDueInfo(r).daysUntil <= 0 ? 'var(--ink-rose)' : 'var(--ink-amber)' }">
                        {{ getDueInfo(r).progressPercent }}%
                      </span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface);">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :style="{
                          width: `${getDueInfo(r).progressPercent}%`,
                          background: getDueInfo(r).daysUntil <= 0 ? 'var(--ink-rose)' : 'var(--ink-amber)'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Daily Summary Block -->
        <div v-show="activeTab === 'daily'" class="space-y-5">
          <section class="section-card">
            <!-- Filter & Month Toolbar -->
            <div class="p-4 sm:p-5 border-b" style="border-color: var(--border-subtle);">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 class="text-base font-bold" style="color: var(--text-primary);">สรุปความเคลื่อนไหวรายวัน</h2>
                  <p class="text-xs mt-0.5" style="color: var(--text-muted);">บันทึกยอดรับ จ่าย และคงเหลือสุทธิของแต่ละวัน</p>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <input
                    v-model="summaryFilterMonth"
                    type="month"
                    class="input-glass text-xs sm:text-sm py-1.5 px-3"
                  />
                  <button
                    v-if="summaryFilterMonth"
                    @click="summaryFilterMonth = ''"
                    class="px-2.5 py-1.5 rounded-lg text-xs transition-all tap-scale"
                    style="background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);"
                  >
                    ล้าง ✕
                  </button>
                  <span class="num text-xs font-semibold px-3 py-1.5 rounded-xl" style="background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);">
                    {{ dailySummaries.length }} วัน
                  </span>
                </div>
              </div>

              <!-- Month Summary Bar (Total Inflow/Outflow/Net for the filtered month) -->
              <div v-if="dailySummaries.length > 0" class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center" style="border-color: var(--border-subtle);">
                <div class="p-2.5 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[10px]" style="color: var(--text-muted);">รับรวมเดือนนี้</p>
                  <p class="num text-xs sm:text-sm font-bold mt-0.5" style="color: var(--ink-emerald);">
                    +{{ formatCurrency(dailySummaryTotals.income) }}
                  </p>
                </div>
                <div class="p-2.5 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[10px]" style="color: var(--text-muted);">จ่ายรวมเดือนนี้</p>
                  <p class="num text-xs sm:text-sm font-bold mt-0.5" style="color: var(--ink-rose);">
                    −{{ formatCurrency(dailySummaryTotals.expense) }}
                  </p>
                </div>
                <div class="p-2.5 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                  <p class="text-[10px]" style="color: var(--text-muted);">สุทธิเดือนนี้</p>
                  <p class="num text-xs sm:text-sm font-bold mt-0.5" :style="{ color: dailySummaryTotals.balance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">
                    {{ dailySummaryTotals.balance >= 0 ? '+' : '' }}{{ formatCurrency(dailySummaryTotals.balance) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Loading Skeleton -->
            <div v-if="isLoading" class="p-5 space-y-3">
              <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-gray-800/10 animate-pulse"></div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!dailySummaries.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                📊
              </div>
              <p class="text-sm font-bold" style="color: var(--text-primary);">ไม่มีข้อมูลในช่วงเวลานี้</p>
              <p class="text-xs mt-1" style="color: var(--text-muted);">ลองเลือกเดือนอื่น หรือกด "เพิ่มรายการ" เพื่อบันทึกรายรับ-รายจ่าย</p>
            </div>

            <!-- Daily Summaries List -->
            <div v-else class="divide-y" style="border-color: var(--border-subtle);">
              <div
                v-for="day in dailySummaries"
                :key="day.date"
                class="px-4 sm:px-5 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                    <span class="num text-sm font-extrabold leading-none" style="color: var(--text-primary);">{{ new Date(day.date).getDate() }}</span>
                    <span class="text-[9px] uppercase tracking-wide leading-none mt-0.5" style="color: var(--text-muted);">{{ new Date(day.date).toLocaleDateString('th-TH', { month: 'short' }) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold" style="color: var(--text-primary);">{{ formatDate(day.date) }}</p>
                    <p class="text-xs" style="color: var(--text-muted);">{{ new Date(day.date).toLocaleDateString('th-TH', { weekday: 'long' }) }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3 text-right sm:text-left sm:flex sm:items-center sm:gap-6">
                  <div>
                    <p class="text-[10px]" style="color: var(--text-muted);">รายรับ</p>
                    <p class="num text-xs sm:text-sm font-semibold mt-0.5" style="color: var(--ink-emerald);">
                      +{{ formatCurrency(day.income) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px]" style="color: var(--text-muted);">รายจ่าย</p>
                    <p class="num text-xs sm:text-sm font-semibold mt-0.5" style="color: var(--ink-rose);">
                      −{{ formatCurrency(day.expense) }}
                    </p>
                  </div>
                  <div class="text-right min-w-[90px]">
                    <p class="text-[10px]" style="color: var(--text-muted);">คงเหลือสุทธิ</p>
                    <p class="num text-xs sm:text-sm font-bold mt-0.5" :style="{ color: day.balance >= 0 ? 'var(--text-primary)' : 'var(--ink-rose)' }">
                      {{ day.balance >= 0 ? '+' : '' }}{{ formatCurrency(day.balance) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Tab 4: Transaction List (Ledger Style) -->
        <div v-show="activeTab === 'analytics'" class="space-y-5">
          <section class="section-card">
            <!-- Header & Filter Bar -->
            <div class="flex flex-col gap-3.5 px-4 sm:px-5 py-4 border-b" style="border-color: var(--border-subtle);">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 class="text-base font-bold" style="color: var(--text-primary);">สมุดบัญชีบันทึกรายการ (General Ledger)</h2>
                  <p class="text-xs mt-0.5" style="color: var(--text-muted);">บันทึกรายละเอียด ยอดยกมา และยอดสะสมตามลำดับเวลา</p>
                </div>
                <span class="num text-xs font-semibold px-2.5 py-1 rounded-full" style="background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);">
                  {{ transactionPageInfo }}
                </span>
              </div>

              <!-- Filter Options -->
              <div class="flex items-center gap-2 flex-wrap">
                <select
                  v-model="transactionFilterMode"
                  class="input-glass text-xs sm:text-sm py-1.5 px-3 min-h-[38px]"
                >
                  <option value="month">📅 รายเดือน</option>
                  <option value="day">📆 รายวัน</option>
                </select>

                <input
                  v-if="transactionFilterMode === 'day'"
                  v-model="transactionFilterDate"
                  type="date"
                  class="input-glass text-xs sm:text-sm py-1.5 px-3 min-h-[38px]"
                />
                <input
                  v-if="transactionFilterMode === 'month'"
                  v-model="transactionFilterMonth"
                  type="month"
                  class="input-glass text-xs sm:text-sm py-1.5 px-3 min-h-[38px]"
                />

                <select
                  v-model.number="transactionItemsPerPage"
                  @change="transactionCurrentPage = 1"
                  class="input-glass text-xs sm:text-sm py-1.5 px-3 min-h-[38px] ml-auto"
                >
                  <option value="10">10 วัน/หน้า</option>
                  <option value="20">20 วัน/หน้า</option>
                  <option value="50">50 วัน/หน้า</option>
                </select>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!filteredTransactionsByDate.length" class="flex flex-col items-center justify-center py-14 text-center px-5">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              </div>
              <p class="text-sm font-bold" style="color: var(--text-primary);">ยังไม่มีรายการในช่วงเวลานี้</p>
              <p class="text-xs mt-1" style="color: var(--text-muted);">กดปุ่ม "+ เพิ่มรายการ" เพื่อเริ่มบันทึกรายรับหรือรายจ่าย</p>
            </div>

            <!-- Ledger Style Table & Mobile Cards -->
            <div v-else class="overflow-x-auto">
              <div v-for="dayGroup in paginatedLedgerGroups" :key="dayGroup.date" class="border-b" style="border-color: var(--border-subtle);">
                <!-- Date Group Header Bar -->
                <div class="px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5" style="background: var(--bg-elevated);">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold" style="color: var(--text-primary);">
                      📅 {{ formatDate(dayGroup.date) }}
                    </span>
                    <span class="num text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-subtle);">
                      {{ dayGroup.items.length }} รายการ
                    </span>
                  </div>

                  <!-- Balances Bar -->
                  <div class="flex items-center gap-2.5 text-xs font-semibold flex-wrap">
                    <span class="px-2 py-0.5 rounded-md" style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-subtle);">
                      ยกมา: <span class="num">{{ formatCurrency(dayGroup.openingBalance) }}</span>
                    </span>
                    <span class="num" style="color: var(--ink-emerald);">+{{ formatCurrency(dayGroup.totalIncome) }}</span>
                    <span class="num" style="color: var(--ink-rose);">−{{ formatCurrency(dayGroup.totalExpense) }}</span>
                    <span class="num" :style="{ color: dayGroup.balance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">
                      {{ dayGroup.balance >= 0 ? '+' : '' }}{{ formatCurrency(dayGroup.balance) }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md font-bold" :style="{
                      background: 'var(--bg-card)',
                      color: dayGroup.closingBalance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)',
                      border: '1px solid var(--border-subtle)'
                    }">
                      ยกไป: <span class="num">{{ formatCurrency(dayGroup.closingBalance) }}</span>
                    </span>
                  </div>
                </div>

                <!-- Desktop Table -->
                <div class="hidden md:block">
                  <table class="w-full">
                    <thead>
                      <tr style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);">
                        <th class="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style="color: var(--text-secondary); width: 36%;">รายละเอียด & หมวดหมู่</th>
                        <th class="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider" style="color: var(--ink-emerald); width: 17%;">รายรับ (+)</th>
                        <th class="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider" style="color: var(--ink-rose); width: 17%;">รายจ่าย (−)</th>
                        <th class="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider" style="color: var(--text-primary); width: 18%;">คงเหลือสะสม</th>
                        <th class="px-4 py-2.5 text-center text-xs font-bold" style="color: var(--text-secondary); width: 12%;">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Opening Balance Row -->
                      <tr style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);">
                        <td class="px-4 py-2.5">
                          <p class="text-xs font-bold italic" style="color: var(--text-secondary);">ยอดยกมา (Opening Balance)</p>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="text-xs" style="color: var(--text-muted);">—</span>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="text-xs" style="color: var(--text-muted);">—</span>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="num text-xs font-bold" :style="{ color: dayGroup.openingBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-amber)' }">
                            {{ formatCurrency(dayGroup.openingBalance) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5"></td>
                      </tr>

                      <!-- Transaction Rows -->
                      <tr
                        v-for="item in dayGroup.items"
                        :key="item.id"
                        class="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style="border-bottom: 1px solid var(--border-subtle);"
                      >
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-bold px-2 py-0.5 rounded-md" style="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border-subtle);">
                              {{ item.category || 'ไม่ระบุหมวดหมู่' }}
                            </span>
                            <span
                              v-if="selectedBookId === 'all' && getBookById(item.book_id)"
                              class="text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1"
                              :style="{
                                backgroundColor: `${getBookById(item.book_id)?.color}15`,
                                color: getBookById(item.book_id)?.color,
                                border: `1px solid ${getBookById(item.book_id)?.color}35`
                              }"
                            >
                              <span>{{ getBookById(item.book_id)?.icon }}</span>
                              <span>{{ getBookById(item.book_id)?.name }}</span>
                            </span>
                          </div>
                          <p v-if="item.description" class="text-xs mt-1" style="color: var(--text-muted);">
                            {{ item.description }}
                          </p>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <span v-if="item.type === 'income'" class="num text-sm font-bold" style="color: var(--ink-emerald);">
                            +{{ formatCurrency(item.amount) }}
                          </span>
                          <span v-else class="text-xs" style="color: var(--text-muted);">—</span>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <span v-if="item.type === 'expense'" class="num text-sm font-bold" style="color: var(--ink-rose);">
                            −{{ formatCurrency(item.amount) }}
                          </span>
                          <span v-else class="text-xs" style="color: var(--text-muted);">—</span>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <span class="num text-sm font-bold" :style="{ color: item.runningBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-amber)' }">
                            {{ formatCurrency(item.runningBalance) }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              @click="openEditTransactionModal(item)"
                              :disabled="isDeletingId === item.id"
                              class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all tap-scale"
                              style="background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--brand-ink);"
                              title="แก้ไขรายการ"
                              aria-label="แก้ไข"
                            >
                              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                            </button>
                            <button
                              @click="deleteTransaction(item.id)"
                              :disabled="isDeletingId === item.id"
                              class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all tap-scale"
                              style="background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--ink-rose);"
                              title="ลบรายการ"
                              aria-label="ลบ"
                            >
                              <svg v-if="isDeletingId !== item.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                              <span v-else class="inline-block w-3 h-3 border-2 rounded-full animate-spin" style="border-color: var(--border-strong); border-top-color: var(--ink-rose);"></span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      <!-- Closing Balance Row -->
                      <tr style="background: var(--bg-surface);">
                        <td class="px-4 py-2.5">
                          <p class="text-xs font-bold italic" style="color: var(--text-secondary);">ยอดยกไป (Closing Balance)</p>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="num text-xs font-bold" style="color: var(--ink-emerald);">+{{ formatCurrency(dayGroup.totalIncome) }}</span>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="num text-xs font-bold" style="color: var(--ink-rose);">−{{ formatCurrency(dayGroup.totalExpense) }}</span>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <span class="num text-xs font-extrabold" :style="{ color: dayGroup.closingBalance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">
                            {{ formatCurrency(dayGroup.closingBalance) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Mobile Card View -->
                <div class="md:hidden">
                  <!-- Opening Balance -->
                  <div class="px-4 py-2.5 flex items-center justify-between text-xs" style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);">
                    <span class="font-bold italic" style="color: var(--text-secondary);">ยอดยกมา</span>
                    <span class="num font-bold" :style="{ color: dayGroup.openingBalance >= 0 ? 'var(--text-primary)' : 'var(--ink-amber)' }">
                      {{ formatCurrency(dayGroup.openingBalance) }}
                    </span>
                  </div>

                  <!-- Transactions -->
                  <div class="divide-y" style="border-color: var(--border-subtle);">
                    <div
                      v-for="item in dayGroup.items"
                      :key="item.id"
                      class="px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold px-2 py-0.5 rounded-md" style="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border-subtle);">
                            {{ item.category || 'ไม่ระบุหมวดหมู่' }}
                          </span>
                          <span
                            v-if="selectedBookId === 'all' && getBookById(item.book_id)"
                            class="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-0.5"
                            :style="{
                              backgroundColor: `${getBookById(item.book_id)?.color}15`,
                              color: getBookById(item.book_id)?.color,
                              border: `1px solid ${getBookById(item.book_id)?.color}35`
                            }"
                          >
                            <span>{{ getBookById(item.book_id)?.icon }}</span>
                            <span>{{ getBookById(item.book_id)?.name }}</span>
                          </span>
                        </div>
                        <p v-if="item.description" class="text-xs mt-1" style="color: var(--text-muted);">
                          {{ item.description }}
                        </p>
                        <div class="flex items-center gap-3 mt-2 text-xs flex-wrap">
                          <span v-if="item.type === 'income'" class="num font-bold" style="color: var(--ink-emerald);">
                            +{{ formatCurrency(item.amount) }}
                          </span>
                          <span v-else class="num font-bold" style="color: var(--ink-rose);">
                            −{{ formatCurrency(item.amount) }}
                          </span>
                          <span class="num text-[11px]" style="color: var(--text-muted);">
                            สะสม: {{ formatCurrency(item.runningBalance) }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          @click="openEditTransactionModal(item)"
                          :disabled="isDeletingId === item.id"
                          class="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all tap-scale"
                          style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--brand-ink);"
                          aria-label="แก้ไข"
                        >
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                        </button>
                        <button
                          @click="deleteTransaction(item.id)"
                          :disabled="isDeletingId === item.id"
                          class="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all tap-scale"
                          style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--ink-rose);"
                          aria-label="ลบ"
                        >
                          <svg v-if="isDeletingId !== item.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                          <span v-else class="inline-block w-3 h-3 border-2 rounded-full animate-spin" style="border-color: var(--border-strong); border-top-color: var(--ink-rose);"></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Closing Balance -->
                  <div class="px-4 py-2.5 flex items-center justify-between text-xs font-semibold" style="background: var(--bg-surface);">
                    <div class="flex items-center gap-2">
                      <span class="italic" style="color: var(--text-secondary);">ยอดยกไป</span>
                      <span class="num text-[11px]" style="color: var(--ink-emerald);">+{{ formatCurrency(dayGroup.totalIncome) }}</span>
                      <span class="num text-[11px]" style="color: var(--ink-rose);">−{{ formatCurrency(dayGroup.totalExpense) }}</span>
                    </div>
                    <span class="num font-bold" :style="{ color: dayGroup.closingBalance >= 0 ? 'var(--ink-emerald)' : 'var(--ink-rose)' }">
                      {{ formatCurrency(dayGroup.closingBalance) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div v-if="transactionTotalPages > 1" class="flex items-center justify-center gap-2 px-5 py-4 border-t" style="border-color: var(--border-subtle);">
              <button
                @click="transactionCurrentPage = Math.max(1, transactionCurrentPage - 1)"
                :disabled="transactionCurrentPage === 1"
                class="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
                style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
                :style="transactionCurrentPage === 1 ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
              >
                ← ก่อนหน้า
              </button>
              <div class="flex items-center gap-1 overflow-x-auto">
                <button
                  v-for="page in transactionTotalPages"
                  :key="page"
                  @click="transactionCurrentPage = page"
                  class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold transition-all tap-scale touch-target shrink-0"
                  :style="transactionCurrentPage === page
                    ? { 'background': 'var(--brand)', 'color': 'white', 'border': '1px solid var(--brand)' }
                    : { 'background': 'var(--bg-elevated)', 'border': '1px solid var(--border-default)', 'color': 'var(--text-secondary)' }"
                >
                  {{ page }}
                </button>
              </div>
              <button
                @click="transactionCurrentPage = Math.min(transactionTotalPages, transactionCurrentPage + 1)"
                :disabled="transactionCurrentPage === transactionTotalPages"
                class="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
                style="background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-secondary);"
                :style="transactionCurrentPage === transactionTotalPages ? {} : { 'cursor': 'pointer', 'color': 'var(--text-primary)' }"
              >
                ต่อไป →
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Expense Ranking Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isRankingModalOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isRankingModalOpen" class="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[80vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-base shrink-0">📊</div>
              <div>
                <h3 class="text-base font-semibold text-white">ลำดับรายจ่ายทุกประเภท</h3>
                <p class="text-xs text-gray-500">
                  {{ expenseCategoryRankings.length }} หมวดหมู่ · รวม {{ formatCurrency(totalExpense) }}
                </p>
              </div>
            </div>
            <button
              @click="isRankingModalOpen = false"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all shrink-0 tap-scale touch-target"
              aria-label="ปิด"
            >✕</button>
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1">
            <div
              v-for="(cat, i) in expenseCategoryRankings"
              :key="cat.name"
              class="px-5 py-3.5 border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20 transition-all tap-scale"
            >
              <div class="flex items-center gap-3 mb-2">
                <span
                  class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  :class="i === 0
                    ? 'bg-rose-500/30 text-rose-300'
                    : i === 1
                      ? 'bg-orange-500/30 text-orange-300'
                      : i === 2
                        ? 'bg-amber-500/30 text-amber-300'
                        : 'bg-gray-700/80 text-gray-400'"
                >{{ i + 1 }}</span>
                <span class="flex-1 text-sm font-medium text-white truncate">{{ cat.name }}</span>
                <span class="text-sm font-bold text-rose-400 shrink-0">{{ formatCurrency(cat.amount) }}</span>
              </div>
              <div class="ml-10 space-y-1">
                <div class="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="i === 0 ? 'bg-gradient-to-r from-rose-500 to-pink-400' : i === 1 ? 'bg-gradient-to-r from-orange-500 to-amber-400' : i === 2 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gray-600'"
                    :style="{ width: `${(cat.amount / (expenseCategoryRankings[0]?.amount || 1)) * 100}%` }"
                  ></div>
                </div>
                <p class="text-[11px] text-gray-500">
                  {{ formatPercent((cat.amount / totalExpense) * 100) }}% ของรายจ่ายทั้งหมด
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-gray-800/80 shrink-0 flex items-center justify-between">
            <p class="text-xs text-gray-500">รายจ่ายรวมทั้งหมด</p>
            <p class="text-sm font-bold text-rose-400">{{ formatCurrency(totalExpense) }}</p>
          </div>
        </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isRankingModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Income Ranking Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isIncomeRankingModalOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isIncomeRankingModalOpen" class="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[80vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-base shrink-0">📊</div>
              <div>
                <h3 class="text-base font-semibold text-white">ลำดับรายรับทุกประเภท</h3>
                <p class="text-xs text-gray-500">
                  {{ incomeCategoryRankings.length }} หมวดหมู่ · รวม {{ formatCurrency(totalIncome) }}
                </p>
              </div>
            </div>
            <button
              @click="isIncomeRankingModalOpen = false"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all shrink-0 tap-scale touch-target"
              aria-label="ปิด"
            >✕</button>
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1">
            <div
              v-for="(cat, i) in incomeCategoryRankings"
              :key="cat.name"
              class="px-5 py-3.5 border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20 transition-all tap-scale"
            >
              <div class="flex items-center gap-3 mb-2">
                <span
                  class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  :class="i === 0
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : i === 1
                      ? 'bg-teal-500/30 text-teal-300'
                      : i === 2
                        ? 'bg-cyan-500/30 text-cyan-300'
                        : 'bg-gray-700/80 text-gray-400'"
                >{{ i + 1 }}</span>
                <span class="flex-1 text-sm font-medium text-white truncate">{{ cat.name }}</span>
                <span class="text-sm font-bold text-emerald-400 shrink-0">{{ formatCurrency(cat.amount) }}</span>
              </div>
              <div class="ml-10 space-y-1">
                <div class="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="i === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : i === 1 ? 'bg-gradient-to-r from-teal-500 to-cyan-400' : i === 2 ? 'bg-gradient-to-r from-cyan-500 to-sky-400' : 'bg-gray-600'"
                    :style="{ width: `${(cat.amount / (incomeCategoryRankings[0]?.amount || 1)) * 100}%` }"
                  ></div>
                </div>
                <p class="text-[11px] text-gray-500">
                  {{ formatPercent((cat.amount / (totalIncome || 1)) * 100) }}% ของรายรับทั้งหมด
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-gray-800/80 shrink-0 flex items-center justify-between">
            <p class="text-xs text-gray-500">รายรับรวมทั้งหมด</p>
            <p class="text-sm font-bold text-emerald-400">{{ formatCurrency(totalIncome) }}</p>
          </div>
        </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isIncomeRankingModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isEntryModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isEntryModalOpen" class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base" :class="form.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'">
                {{ form.type === 'income' ? '📈' : '📉' }}
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">{{ modalTitle }}</h3>
                <p class="text-xs text-gray-500">{{ modalSubtitle }}</p>
              </div>
            </div>
            <button
              @click="() => { isEntryModalOpen = false; resetForm() }"
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
              aria-label="ปิด"
            >✕</button>
          </div>

          <!-- Modal Body -->
          <form class="p-6 space-y-4" @submit.prevent="submitTransaction">
            <!-- Book selector -->
            <div v-if="books.length > 0">
              <label class="block text-xs font-medium text-gray-400 mb-1.5">สมุดบัญชี</label>
              <div class="relative">
                <select
                  v-model="form.bookId"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all cursor-pointer"
                >
                  <option v-for="b in books" :key="b.id" :value="b.id">
                    {{ b.icon }} {{ b.name }} {{ b.isDefault ? '(สมุดหลัก)' : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">วันที่</label>
                <input
                  v-model="form.entryDate"
                  type="date"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5">ประเภท</label>
                <select
                  v-model="form.type"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
                  <option value="income">📈 รายรับ</option>
                  <option value="expense">📉 รายจ่าย</option>
                </select>
              </div>
            </div>

            <div class="relative" ref="categoryComboboxRef">
              <label class="block text-xs font-medium text-gray-400 mb-1.5">หมวดหมู่</label>
              <input
                v-model="categorySearch"
                type="text"
                maxlength="80"
                placeholder="พิมพ์ค้นหาหรือสร้างหมวดหมู่ใหม่..."
                autocomplete="off"
                @focus="isCategoryDropdownOpen = true"
                @keydown.down.prevent="navigateCategoryOption(1)"
                @keydown.up.prevent="navigateCategoryOption(-1)"
                @keydown.enter.prevent="selectHighlightedCategory"
                @keydown.escape="isCategoryDropdownOpen = false"
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              >
              <!-- Dropdown -->
              <div
                v-if="isCategoryDropdownOpen && (filteredCategories.length > 0 || categorySearch.trim())"
                class="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-gray-700/60 bg-gray-800 shadow-xl"
              >
                <button
                  v-for="(cat, idx) in filteredCategories"
                  :key="cat"
                  type="button"
                  @mousedown.prevent="selectCategory(cat)"
                  class="w-full text-left px-4 py-2.5 text-sm transition-all"
                  :class="idx === highlightedCategoryIndex ? 'bg-violet-600/30 text-white' : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'"
                >
                  {{ cat }}
                </button>
                <!-- "Create new" option when search text doesn't match any existing -->
                <button
                  v-if="categorySearch.trim() && !categoryExactMatch"
                  type="button"
                  @mousedown.prevent="selectCategory(categorySearch.trim())"
                  class="w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2"
                  :class="highlightedCategoryIndex === filteredCategories.length ? 'bg-violet-600/30 text-white' : 'text-violet-400 hover:bg-gray-800/80 hover:text-violet-300'"
                >
                  <span>➕</span> สร้าง "{{ categorySearch.trim() }}"
                </button>
                <!-- No results and no search text -->
                <div
                  v-if="filteredCategories.length === 0 && !categorySearch.trim()"
                  class="px-4 py-3 text-xs text-gray-500 text-center"
                >
                  พิมพ์เพื่อค้นหาหรือสร้างหมวดหมู่ใหม่
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">
                จำนวนเงิน (บาท) <span class="text-rose-400">*</span>
                <span class="text-[10px] text-gray-500 ml-1">(รองรับ +, -, *, /)</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">฿</span>
                <input
                  v-model="form.amount"
                  type="text"
                  placeholder="0.00 หรือ 100+50*2"
                  @blur="evaluateAmountExpression"
                  @keydown.enter.prevent="evaluateAmountExpression"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
              </div>
              <!-- Live calculation preview -->
              <div v-if="calculatedAmount !== null && form.amount && !isNaN(Number(form.amount)) === false" class="mt-1.5 flex items-center gap-2 text-xs">
                <span class="text-gray-500">คำนวณได้:</span>
                <span class="font-bold text-violet-400">฿{{ formatCurrency(calculatedAmount).replace('฿', '') }}</span>
                <button
                  type="button"
                  @click="applyCalculatedAmount"
                  class="text-[10px] px-2 py-0.5 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 transition-all tap-scale"
                >
                  ใช้ค่านี้
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">รายละเอียด (ไม่บังคับ)</label>
              <textarea
                v-model="form.description"
                rows="2"
                maxlength="300"
                placeholder="บันทึกเพิ่มเติม..."
                class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
              ></textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="() => { isEntryModalOpen = false; resetForm() }"
                class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale touch-target"
              >ยกเลิก</button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 tap-scale touch-target"
              >
                <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                {{ submitButtonText }}
              </button>
            </div>
          </form>
        </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isEntryModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add/Edit Recurring Expense Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isRecurringModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isRecurringModalOpen" class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                    🔄
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-white">
                      {{ editingRecurringId ? 'แก้ไขรายจ่ายประจำ' : 'เพิ่มรายจ่ายประจำ' }}
                    </h3>
                    <p class="text-xs text-gray-500">กำหนดการจ่ายเงินที่ต้องทำซ้ำทุกเดือน</p>
                  </div>
                </div>
                <button
                  @click="isRecurringModalOpen = false"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
                >✕</button>
              </div>

              <!-- Form Body -->
              <form @submit.prevent="submitRecurring" class="p-6 space-y-4">
                <!-- Book selector -->
                <div v-if="books.length > 0">
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">สมุดบัญชี</label>
                  <select
                    v-model="recurringForm.bookId"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option v-for="b in books" :key="b.id" :value="b.id">
                      {{ b.icon }} {{ b.name }} {{ b.isDefault ? '(สมุดหลัก)' : '' }}
                    </option>
                  </select>
                </div>

                <!-- Title -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">ชื่อรายการ <span class="text-rose-400">*</span></label>
                  <input
                    v-model="recurringForm.title"
                    type="text"
                    placeholder="เช่น ค่าเช่าห้อง, ค่าเน็ต, ค่าน้ำค่ายาก"
                    required
                    class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <!-- Amount + Day of Month Due -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">
                      จำนวนเงิน (฿) <span class="text-rose-400">*</span>
                      <span class="text-[10px] text-gray-500 ml-1">(รองรับ +, -, *, /)</span>
                    </label>
                    <input
                      v-model="recurringForm.amount"
                      type="text"
                      placeholder="0.00 หรือ 100+50"
                      required
                      @blur="evaluateRecurringAmountExpression"
                      @keydown.enter.prevent="evaluateRecurringAmountExpression"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                    <!-- Live calculation preview for recurring -->
                    <div v-if="calculatedRecurringAmount !== null && recurringForm.amount && !isNaN(Number(recurringForm.amount)) === false" class="mt-1 flex items-center gap-2 text-xs">
                      <span class="text-gray-500">คำนวณได้:</span>
                      <span class="font-bold text-amber-400">฿{{ formatCurrency(calculatedRecurringAmount).replace('฿', '') }}</span>
                      <button
                        type="button"
                        @click="applyCalculatedRecurringAmount"
                        class="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-all tap-scale"
                      >
                        ใช้
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">กำหนดจ่ายทุกวันที่ <span class="text-rose-400">*</span></label>
                    <input
                      v-model.number="recurringForm.dayOfMonthDue"
                      type="number"
                      min="1"
                      max="31"
                      required
                      class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <!-- Category + Start Date -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">หมวดหมู่</label>
                    <input
                      v-model="recurringForm.category"
                      type="text"
                      placeholder="ค่าใช้จ่ายประจำ"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">วันที่เริ่ม</label>
                    <input
                      v-model="recurringForm.startDate"
                      type="date"
                      required
                      class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <!-- Is Indefinite Checkbox/Toggle -->
                <div class="flex items-center justify-between p-3.5 rounded-xl bg-gray-800/50 border border-gray-700/60">
                  <div>
                    <p class="text-sm font-semibold text-white">ไม่มีกำหนดสิ้นสุด</p>
                    <p class="text-xs text-gray-400">จ่ายต่อเนื่องไปเรื่อยๆ จนกว่าจะยกเลิก</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="recurringForm.isIndefinite" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <!-- End Date (if not indefinite) -->
                <div v-if="!recurringForm.isIndefinite">
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">วันที่สิ้นสุด</label>
                  <input
                    v-model="recurringForm.endDate"
                    type="date"
                    required
                    class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3 pt-3">
                  <button
                    v-if="editingRecurringId"
                    type="button"
                    @click="deleteRecurring"
                    :disabled="isDeletingRecurring"
                    class="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-sm font-semibold transition-all tap-scale touch-target disabled:opacity-50"
                  >
                    {{ isDeletingRecurring ? 'กำลังลบ...' : 'ลบรายการ' }}
                  </button>
                  <div class="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      @click="isRecurringModalOpen = false"
                      class="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-all tap-scale touch-target"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      :disabled="isSubmittingRecurring"
                      class="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2 tap-scale touch-target disabled:opacity-50"
                    >
                      <span v-if="isSubmittingRecurring" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{{ editingRecurringId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ' }}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isRecurringModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>
    <!-- Export Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isExportModalOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div
              v-if="isExportModalOpen"
              class="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
              style="background: var(--bg-card); border-color: var(--border-default);"
            >
              <!-- Modal Header -->
              <div class="flex items-center justify-between px-5 py-4 border-b shrink-0" style="border-color: var(--border-subtle);">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-lg shrink-0">
                    📥
                  </div>
                  <div>
                    <h3 class="text-base font-bold" style="color: var(--text-primary);">Export ไฟล์รายการ</h3>
                    <p class="text-xs" style="color: var(--text-secondary);">เลือกช่วงเวลาและรูปแบบไฟล์ที่ต้องการ</p>
                  </div>
                </div>
                <button
                  @click="isExportModalOpen = false"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
                  aria-label="ปิด"
                >✕</button>
              </div>

              <!-- Modal Body -->
              <div class="p-5 overflow-y-auto space-y-4">
                <!-- Scope Selection (Tabs) -->
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-secondary);">
                    1. เลือกช่วงเวลาข้อมูล
                  </label>
                  <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                    <button
                      type="button"
                      @click="exportScope = 'month'"
                      class="py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      :class="exportScope === 'month' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'"
                    >
                      <span>📅</span>
                      <span>รายเดือน</span>
                    </button>
                    <button
                      type="button"
                      @click="exportScope = 'year'"
                      class="py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      :class="exportScope === 'year' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'"
                    >
                      <span>📆</span>
                      <span>รายปี</span>
                    </button>
                    <button
                      type="button"
                      @click="exportScope = 'all'"
                      class="py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      :class="exportScope === 'all' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'"
                    >
                      <span>📂</span>
                      <span>ทั้งหมด</span>
                    </button>
                  </div>
                </div>

                <!-- Scope specific inputs -->
                <div v-if="exportScope === 'month'" class="space-y-1.5">
                  <label class="block text-xs font-medium" style="color: var(--text-secondary);">เลือกเดือนที่ต้องการ Export</label>
                  <input
                    type="month"
                    v-model="exportMonth"
                    class="input-glass w-full text-sm font-medium"
                  />
                </div>

                <div v-else-if="exportScope === 'year'" class="space-y-1.5">
                  <label class="block text-xs font-medium" style="color: var(--text-secondary);">เลือกปีที่ต้องการ Export</label>
                  <select
                    v-model="exportYear"
                    class="input-glass w-full text-sm font-medium"
                  >
                    <option v-for="y in availableYears" :key="y" :value="y">
                      ปี พ.ศ. {{ Number(y) + 543 }} (ค.ศ. {{ y }})
                    </option>
                  </select>
                </div>

                <div v-else class="p-3 rounded-xl flex items-center gap-2.5 text-xs" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
                  <span class="text-base">ℹ️</span>
                  <span>ระบบจะส่งออกรายการบัญชีทั้งหมดในระบบ ({{ transactions.length }} รายการ)</span>
                </div>

                <!-- Live Summary Preview Box -->
                <div class="p-3.5 rounded-xl space-y-2.5" style="background: var(--bg-elevated); border: 1px solid var(--border-default);">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold truncate max-w-[220px]" style="color: var(--text-primary);">{{ exportPeriodLabel }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold shrink-0" :class="exportTransactions.length > 0 ? 'bg-violet-500/20 text-violet-300' : 'bg-rose-500/20 text-rose-300'">
                      {{ exportTransactions.length }} รายการ
                    </span>
                  </div>

                  <div class="grid grid-cols-3 gap-2 pt-2 border-t text-center" style="border-color: var(--border-subtle);">
                    <div>
                      <p class="text-[10px]" style="color: var(--text-muted);">รายรับรวม</p>
                      <p class="text-xs font-bold text-emerald-400 mt-0.5 truncate">+{{ formatCurrency(exportTotalIncome) }}</p>
                    </div>
                    <div>
                      <p class="text-[10px]" style="color: var(--text-muted);">รายจ่ายรวม</p>
                      <p class="text-xs font-bold text-rose-400 mt-0.5 truncate">-{{ formatCurrency(exportTotalExpense) }}</p>
                    </div>
                    <div>
                      <p class="text-[10px]" style="color: var(--text-muted);">คงเหลือสุทธิ</p>
                      <p class="text-xs font-bold mt-0.5 truncate" :class="exportNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                        {{ formatCurrency(exportNetBalance) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Export Action Buttons -->
                <div class="space-y-2 pt-1">
                  <label class="block text-xs font-semibold uppercase tracking-wider mb-1" style="color: var(--text-secondary);">
                    2. ดาวน์โหลดรูปแบบไฟล์
                  </label>

                  <!-- PDF Button -->
                  <button
                    type="button"
                    @click="exportToPDF"
                    :disabled="isExporting || exportTransactions.length === 0"
                    class="w-full p-3 rounded-xl border flex items-center justify-between transition-all group tap-scale disabled:opacity-50 disabled:cursor-not-allowed hover:border-violet-500"
                    style="background: var(--bg-card); border-color: var(--border-default);"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold group-hover:text-violet-400 transition-colors" style="color: var(--text-primary);">
                          รายงาน PDF (.pdf)
                        </p>
                        <p class="text-[11px]" style="color: var(--text-secondary);">
                          ภาษาไทยคมชัด ตารางสวยงามพร้อมสรุปยอด
                        </p>
                      </div>
                    </div>
                    <span class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-violet-600 text-white shadow-sm flex items-center gap-1 shrink-0">
                      <span v-if="isExporting" class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>โหลด PDF</span>
                    </span>
                  </button>

                  <!-- Excel Button -->
                  <button
                    type="button"
                    @click="exportToExcel"
                    :disabled="isExporting || exportTransactions.length === 0"
                    class="w-full p-3 rounded-xl border flex items-center justify-between transition-all group tap-scale disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-500"
                    style="background: var(--bg-card); border-color: var(--border-default);"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-xs shrink-0">
                        XLS
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold group-hover:text-emerald-400 transition-colors" style="color: var(--text-primary);">
                          Excel (.xlsx)
                        </p>
                        <p class="text-[11px]" style="color: var(--text-secondary);">
                          ไฟล์สเปรดชีตพร้อมตารางและสรุปผล
                        </p>
                      </div>
                    </div>
                    <span class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center gap-1 shrink-0">
                      <span v-if="isExporting" class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>โหลด Excel</span>
                    </span>
                  </button>

                  <!-- CSV Button -->
                  <button
                    type="button"
                    @click="exportToCSV"
                    :disabled="isExporting || exportTransactions.length === 0"
                    class="w-full p-3 rounded-xl border flex items-center justify-between transition-all group tap-scale disabled:opacity-50 disabled:cursor-not-allowed hover:border-sky-500"
                    style="background: var(--bg-card); border-color: var(--border-default);"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center font-bold text-xs shrink-0">
                        CSV
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold group-hover:text-sky-400 transition-colors" style="color: var(--text-primary);">
                          CSV (.csv)
                        </p>
                        <p class="text-[11px]" style="color: var(--text-secondary);">
                          UTF-8 with BOM รองรับ Excel/Sheets
                        </p>
                      </div>
                    </div>
                    <span class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-600 text-white shadow-sm flex items-center gap-1 shrink-0">
                      <span v-if="isExporting" class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>โหลด CSV</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isExportModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Manage Books Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isManageBooksModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isManageBooksModalOpen" class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center text-base">
                    📚
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-white">จัดการสมุดบัญชี (Finance Books)</h3>
                    <p class="text-xs text-gray-500">แยกกระเป๋าเงินและสมุดรายรับ-รายจ่ายตามการใช้งาน</p>
                  </div>
                </div>
                <button
                  @click="isManageBooksModalOpen = false"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
                >✕</button>
              </div>

              <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 font-medium">สมุดทั้งหมด ({{ books.length }} เล่ม)</span>
                  <button
                    type="button"
                    @click="openCreateBookModal"
                    class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 transition-all tap-scale flex items-center gap-1"
                  >
                    <span>+ เพิ่มสมุดใหม่</span>
                  </button>
                </div>

                <div class="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  <div
                    v-for="b in books"
                    :key="b.id"
                    class="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all"
                    :style="{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderColor: b.isDefault ? `${b.color}66` : 'rgba(255, 255, 255, 0.08)'
                    }"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        :style="{ background: `${b.color}22`, border: `1px solid ${b.color}44` }"
                      >
                        {{ b.icon || '💼' }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold text-white truncate">{{ b.name }}</h4>
                          <span
                            v-if="b.isDefault"
                            class="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0"
                          >
                            สมุดหลัก
                          </span>
                        </div>
                        <p class="text-[11px] text-gray-500 mt-0.5">
                          สร้างเมื่อ {{ formatDate(b.createdAt) }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        @click="openEditBookModal(b)"
                        class="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium border border-gray-700 transition-all tap-scale"
                      >
                        แก้ไข
                      </button>
                      <button
                        v-if="books.length > 1"
                        type="button"
                        @click="handleDeleteBook(b)"
                        class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 transition-all tap-scale"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 leading-relaxed flex items-start gap-2">
                  <span class="text-base">💡</span>
                  <span>สมุดบัญชีช่วยแยกประวัติรายรับ-รายจ่าย เช่น การใช้จ่ายส่วนตัว และ ธุรกิจ/งานฟรีแลนซ์ หากลบสมุด รายการข้างในจะถูกย้ายไปยังสมุดหลักโดยอัตโนมัติ</span>
                </div>
              </div>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isManageBooksModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create/Edit Book Form Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isBookFormModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
          <Transition name="modal">
            <div v-if="isBookFormModalOpen" class="relative z-10 w-full max-w-md rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl" :style="{ background: `${bookForm.color}25`, border: `1px solid ${bookForm.color}45` }">
                    {{ bookForm.icon }}
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-white">{{ editingBookId ? 'แก้ไขสมุดบัญชี' : 'เพิ่มสมุดบัญชีใหม่' }}</h3>
                    <p class="text-xs text-gray-500">กำหนดชื่อ ไอคอน และสีประจำสมุด</p>
                  </div>
                </div>
                <button
                  @click="isBookFormModalOpen = false"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all tap-scale touch-target"
                >✕</button>
              </div>

              <form @submit.prevent="submitBookForm" class="p-6 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">ชื่อสมุดบัญชี <span class="text-rose-400">*</span></label>
                  <input
                    v-model="bookForm.name"
                    type="text"
                    placeholder="เช่น สมุดส่วนตัว, งานฟรีแลนซ์, ท่องเที่ยว"
                    required
                    maxlength="50"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <!-- Icon presets -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">ไอคอนประจำสมุด</label>
                  <div class="grid grid-cols-8 gap-2">
                    <button
                      v-for="icon in BOOK_ICON_PRESETS"
                      :key="icon"
                      type="button"
                      @click="bookForm.icon = icon"
                      class="h-9 rounded-xl flex items-center justify-center text-lg transition-all tap-scale"
                      :class="bookForm.icon === icon ? 'bg-violet-600/40 border-2 border-violet-400 scale-105' : 'bg-gray-800/80 border border-gray-700/60 hover:bg-gray-700'"
                    >
                      {{ icon }}
                    </button>
                  </div>
                </div>

                <!-- Color presets -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">สีประจำสมุด</label>
                  <div class="grid grid-cols-5 gap-2">
                    <button
                      v-for="color in BOOK_COLOR_PRESETS"
                      :key="color"
                      type="button"
                      @click="bookForm.color = color"
                      class="h-8 rounded-xl flex items-center justify-center transition-all tap-scale"
                      :style="{
                        backgroundColor: color,
                        boxShadow: bookForm.color === color ? `0 0 12px ${color}` : 'none',
                        border: bookForm.color === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)'
                      }"
                    >
                      <span v-if="bookForm.color === color" class="text-white text-xs font-bold">✓</span>
                    </button>
                  </div>
                </div>

                <!-- Set as default checkbox -->
                <label class="flex items-center gap-3 p-3 rounded-xl border border-gray-700/60 bg-gray-800/40 cursor-pointer hover:bg-gray-800/70 transition-all">
                  <input
                    v-model="bookForm.isDefault"
                    type="checkbox"
                    class="accent-violet-500 w-4 h-4 rounded"
                  />
                  <div>
                    <p class="text-xs font-semibold text-white">ตั้งเป็นสมุดหลัก (Default)</p>
                    <p class="text-[11px] text-gray-400">เมื่อบันทึกรายการใหม่จะเลือกสมุดนี้เป็นค่าเริ่มต้น</p>
                  </div>
                </label>

                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    @click="isBookFormModalOpen = false"
                    class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmittingBook"
                    class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 tap-scale"
                  >
                    <span v-if="isSubmittingBook" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>{{ editingBookId ? 'บันทึกการแก้ไข' : 'สร้างสมุด' }}</span>
                  </button>
                </div>
              </form>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="isBookFormModalOpen = false"></div>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { getTodayTH, getThisMonthTH } from '~/utils/date'
import { useFinanceBooks, BOOK_COLOR_PRESETS, BOOK_ICON_PRESETS, type FinanceBook } from '~/composables/useFinanceBooks'

type TransactionType = 'income' | 'expense'

type TransactionRow = {
  id: string
  user_id: string
  book_id?: string | null
  entry_date: string
  type: TransactionType
  category: string | null
  description: string | null
  amount: number
  created_at: string
}

type DailySummary = {
  date: string
  income: number
  expense: number
  balance: number
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'รายรับรายจ่าย' })

const { apiFetch, userId } = useBackendApi()

// Multi-Book Finance System
const {
  books,
  isLoadingBooks,
  selectedBookId,
  selectedBook,
  defaultBook,
  fetchBooks,
  selectBook,
  createBook,
  updateBook,
  deleteBook,
} = useFinanceBooks()

const isManageBooksModalOpen = ref(false)
const isBookFormModalOpen = ref(false)
const editingBookId = ref<string | null>(null)
const isSubmittingBook = ref(false)
const bookForm = reactive({
  name: '',
  icon: '💼',
  color: '#8b5cf6',
  isDefault: false,
})

const getBookById = (bookId?: string | null) => {
  if (!bookId) return null
  return books.value.find(b => b.id === bookId) || null
}

const openManageBooksModal = () => {
  isManageBooksModalOpen.value = true
}

const openCreateBookModal = () => {
  editingBookId.value = null
  const randomIcon = BOOK_ICON_PRESETS[Math.floor(Math.random() * BOOK_ICON_PRESETS.length)] || '💼'
  const randomColor = BOOK_COLOR_PRESETS[Math.floor(Math.random() * BOOK_COLOR_PRESETS.length)] || '#8b5cf6'
  bookForm.name = ''
  bookForm.icon = randomIcon
  bookForm.color = randomColor
  bookForm.isDefault = books.value.length === 0
  isBookFormModalOpen.value = true
}

const openEditBookModal = (book: FinanceBook) => {
  editingBookId.value = book.id
  bookForm.name = book.name
  bookForm.icon = book.icon || '💼'
  bookForm.color = book.color || '#8b5cf6'
  bookForm.isDefault = book.isDefault
  isBookFormModalOpen.value = true
}

const submitBookForm = async () => {
  if (isSubmittingBook.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  if (!bookForm.name.trim()) {
    toastWarning('กรุณาระบุชื่อสมุดบัญชี')
    return
  }
  isSubmittingBook.value = true
  try {
    if (editingBookId.value) {
      await updateBook(editingBookId.value, {
        name: bookForm.name,
        icon: bookForm.icon,
        color: bookForm.color,
        isDefault: bookForm.isDefault,
      })
      toastSuccess('แก้ไขสมุดบัญชีสำเร็จ')
    } else {
      await createBook({
        name: bookForm.name,
        icon: bookForm.icon,
        color: bookForm.color,
        isDefault: bookForm.isDefault,
      })
      toastSuccess('สร้างสมุดบัญชีใหม่สำเร็จ')
    }
    isBookFormModalOpen.value = false
    await refreshData()
  } catch (err: any) {
    console.error('Save book error:', err)
    toastError(getApiErrorMessage(err, 'บันทึกสมุดบัญชีไม่สำเร็จ'))
  } finally {
    isSubmittingBook.value = false
  }
}

const handleDeleteBook = async (book: FinanceBook) => {
  const { confirmDelete, toastSuccess, toastError } = useAlert()
  const confirmed = await confirmDelete(
    `ลบสมุด "${book.name}"?`,
    'รายการที่อยู่ในสมุดนี้จะถูกย้ายไปยังสมุดหลักโดยอัตโนมัติ ข้อมูลจะไม่สูญหาย'
  )
  if (!confirmed) return
  try {
    await deleteBook(book.id)
    toastSuccess('ลบสมุดบัญชีและย้ายรายการสำเร็จ')
    await refreshData()
  } catch (err: any) {
    console.error('Delete book error:', err)
    toastError(getApiErrorMessage(err, 'ลบสมุดบัญชีไม่สำเร็จ'))
  }
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isRankingModalOpen = ref(false)
const isIncomeRankingModalOpen = ref(false)
const isDeletingId = ref('')
const editingTransactionId = ref('')
const errorMessage = ref('')
const transactions = ref<TransactionRow[]>([])

// Tabs state
const activeTab = ref<'overview' | 'recurring' | 'daily' | 'analytics'>('overview')
const tabs = [
  { id: 'overview', label: 'ภาพรวม', icon: '📊' },
  { id: 'recurring', label: 'รายจ่ายประจำ', icon: '🔄' },
  { id: 'daily', label: 'รายวัน', icon: '📅' },
  { id: 'analytics', label: 'วิเคราะห์', icon: '📈' },
] as const

const summaryFilterMonth = ref(getThisMonthTH())
const transactionFilterMode = ref<'day' | 'month'>('month')
const transactionFilterDate = ref(getTodayTH())
const transactionFilterMonth = ref(getThisMonthTH())
const transactionItemsPerPage = ref(20)
const transactionCurrentPage = ref(1)

const form = reactive({
  entryDate: getTodayTH(),
  type: 'expense' as TransactionType,
  category: '',
  description: '',
  amount: '',
  bookId: '',
})

// Calculator feature for amount input
const calculatedAmount = ref<number | null>(null)
const calculatedRecurringAmount = ref<number | null>(null)

// Safe math expression evaluator
const evaluateMathExpression = (expr: string): number | null => {
  try {
    // Remove all whitespace
    const cleaned = expr.trim().replace(/\s+/g, '')

    // Allow only numbers and operators +, -, *, /, ., (, )
    if (!/^[\d+\-*/.()]+$/.test(cleaned)) {
      return null
    }

    // Prevent dangerous patterns
    if (cleaned.includes('**') || cleaned.length > 100) {
      return null
    }

    // Use Function constructor for safe evaluation (better than eval)
    const result = new Function('return ' + cleaned)()

    if (typeof result === 'number' && isFinite(result) && result >= 0) {
      return Math.round(result * 100) / 100 // Round to 2 decimals
    }
    return null
  } catch {
    return null
  }
}

// Watch for amount changes to show live calculation
watch(() => form.amount, (newVal) => {
  if (!newVal || newVal.trim() === '') {
    calculatedAmount.value = null
    return
  }

  // If it's already a simple number, no need to calculate
  const asNumber = Number(newVal)
  if (!isNaN(asNumber)) {
    calculatedAmount.value = null
    return
  }

  // Try to evaluate expression
  const result = evaluateMathExpression(newVal)
  calculatedAmount.value = result
})

const evaluateAmountExpression = () => {
  if (!form.amount || form.amount.trim() === '') return

  const asNumber = Number(form.amount)
  if (!isNaN(asNumber)) return // Already a number

  const result = evaluateMathExpression(form.amount)
  if (result !== null) {
    form.amount = String(result)
    calculatedAmount.value = null
  }
}

const evaluateRecurringAmountExpression = () => {
  if (!recurringForm.amount || String(recurringForm.amount).trim() === '') return

  const asNumber = Number(recurringForm.amount)
  if (!isNaN(asNumber)) return

  const result = evaluateMathExpression(String(recurringForm.amount))
  if (result !== null) {
    recurringForm.amount = String(result)
    calculatedRecurringAmount.value = null
  }
}

const applyCalculatedAmount = () => {
  if (calculatedAmount.value !== null) {
    form.amount = String(calculatedAmount.value)
    calculatedAmount.value = null
  }
}

const applyCalculatedRecurringAmount = () => {
  if (calculatedRecurringAmount.value !== null) {
    recurringForm.amount = String(calculatedRecurringAmount.value)
    calculatedRecurringAmount.value = null
  }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency', currency: 'THB', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount)

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
  day: '2-digit', month: 'short', year: 'numeric',
})

const currentMonthYearLabel = computed(() => {
  if (!summaryFilterMonth.value) return 'เดือนนี้'
  const [yearStr, monthStr] = summaryFilterMonth.value.split('-')
  if (!yearStr || !monthStr) return 'เดือนนี้'
  const year = Number(yearStr) + 543
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  const monthName = monthNames[Number(monthStr) - 1] || 'ไม่ระบุ'
  return `${monthName} ${year}`
})

const totalIncome = computed(() => transactions.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0))
const totalExpense = computed(() => transactions.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0))
const remainingBalance = computed(() => totalIncome.value - totalExpense.value)
const overspentAmount = computed(() => Math.max(totalExpense.value - totalIncome.value, 0))

const formatPercent = (value: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value)

const expenseProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 100 : 0
  return Math.min((totalExpense.value / totalIncome.value) * 100, 100)
})

const remainingProgressPercent = computed(() => {
  if (totalIncome.value <= 0) return 0
  return Math.min(Math.max((remainingBalance.value / totalIncome.value) * 100, 0), 100)
})

const expenseProgressText = computed(() => {
  if (totalIncome.value <= 0) return totalExpense.value > 0 ? 'มีรายจ่าย แต่ยังไม่มีรายรับ' : 'รอข้อมูล'
  return `ใช้ไป ${formatPercent((totalExpense.value / totalIncome.value) * 100)}% ของรายรับ`
})

const remainingProgressText = computed(() => {
  if (totalIncome.value <= 0) return 'รอข้อมูลรายรับ'
  if (remainingBalance.value < 0) return 'รายจ่ายเกินรายรับ'
  return `คงเหลือ ${formatPercent((remainingBalance.value / totalIncome.value) * 100)}% ของรายรับ`
})

const isEditing = computed(() => Boolean(editingTransactionId.value))
const modalTitle = computed(() => isEditing.value ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่')
const modalSubtitle = computed(() => isEditing.value ? 'ปรับข้อมูลรายรับ/รายจ่าย' : 'บันทึกรายรับหรือรายจ่ายของแต่ละวัน')
const submitButtonText = computed(() => {
  if (isSubmitting.value) return isEditing.value ? 'กำลังบันทึก...' : 'กำลังบันทึก...'
  return isEditing.value ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'
})

const topExpenseCategory = computed(() => {
  const categoryTotals = transactions.value
    .filter(i => i.type === 'expense')
    .reduce<Record<string, number>>((acc, i) => {
      const key = i.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + i.amount
      return acc
    }, {})
  const [name, amount] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['-', 0]
  return { name, amount }
})

const expenseCategoryRankings = computed(() => {
  const categoryTotals = transactions.value
    .filter(i => i.type === 'expense')
    .reduce<Record<string, number>>((acc, i) => {
      const key = i.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + i.amount
      return acc
    }, {})
  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({ name, amount }))
})

const incomeCategoryRankings = computed(() => {
  const categoryTotals = transactions.value
    .filter(i => i.type === 'income')
    .reduce<Record<string, number>>((acc, i) => {
      const key = i.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + i.amount
      return acc
    }, {})
  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({ name, amount }))
})

const topExpenseCategories = computed(() => expenseCategoryRankings.value.slice(0, 3))
const bottomExpenseCategories = computed(() => [...expenseCategoryRankings.value].reverse().slice(0, 3))

const categoryComboboxRef = ref<HTMLElement | null>(null)
const categorySearch = ref('')
const isCategoryDropdownOpen = ref(false)
const highlightedCategoryIndex = ref(0)

const categoriesByType = computed(() => {
  const cats = transactions.value
    .filter(i => i.type === form.type && i.category?.trim())
    .map(i => i.category as string)
  return [...new Set(cats)].sort((a, b) => a.localeCompare(b, 'th'))
})

const filteredCategories = computed(() => {
  const q = categorySearch.value.trim().toLowerCase()
  if (!q) return categoriesByType.value
  return categoriesByType.value.filter(c => c.toLowerCase().includes(q))
})

const categoryExactMatch = computed(() => {
  const q = categorySearch.value.trim().toLowerCase()
  return categoriesByType.value.some(c => c.toLowerCase() === q)
})

const selectCategory = (cat: string) => {
  form.category = cat
  categorySearch.value = cat
  isCategoryDropdownOpen.value = false
  highlightedCategoryIndex.value = 0
}

const navigateCategoryOption = (direction: number) => {
  const totalOptions = filteredCategories.value.length + (categorySearch.value.trim() && !categoryExactMatch.value ? 1 : 0)
  if (totalOptions === 0) return
  highlightedCategoryIndex.value = (highlightedCategoryIndex.value + direction + totalOptions) % totalOptions
}

const selectHighlightedCategory = () => {
  if (!isCategoryDropdownOpen.value) { isCategoryDropdownOpen.value = true; return }
  const idx = highlightedCategoryIndex.value
  if (idx < filteredCategories.value.length) {
    const cat = filteredCategories.value[idx]
    if (cat !== undefined) {
      selectCategory(cat)
    }
  } else if (categorySearch.value.trim() && !categoryExactMatch.value) {
    selectCategory(categorySearch.value.trim())
  }
}

const handleClickOutsideCombobox = (e: MouseEvent) => {
  if (categoryComboboxRef.value && !categoryComboboxRef.value.contains(e.target as Node)) {
    isCategoryDropdownOpen.value = false
    // If user typed something but didn't select, commit what they typed
    if (categorySearch.value.trim()) {
      form.category = categorySearch.value.trim()
    }
  }
}

watch(categorySearch, () => {
  highlightedCategoryIndex.value = 0
  if (!isCategoryDropdownOpen.value) isCategoryDropdownOpen.value = true
})

watch(() => form.type, () => {
  form.category = ''
  categorySearch.value = ''
  isCategoryDropdownOpen.value = false
}, { flush: 'sync' })

const dailySummaries = computed<DailySummary[]>(() => {
  let source = transactions.value
  if (summaryFilterMonth.value) source = source.filter(i => i.entry_date.startsWith(summaryFilterMonth.value))
  const grouped = source.reduce<Record<string, DailySummary>>((acc, i) => {
    const d = acc[i.entry_date] ?? { date: i.entry_date, income: 0, expense: 0, balance: 0 }
    acc[i.entry_date] = d
    if (i.type === 'income') d.income += i.amount
    else d.expense += i.amount
    d.balance = d.income - d.expense
    return acc
  }, {})
  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
})

const filteredTransactions = computed(() => {
  let source = transactions.value
  if (transactionFilterMode.value === 'day' && transactionFilterDate.value)
    source = source.filter(i => i.entry_date === transactionFilterDate.value)
  if (transactionFilterMode.value === 'month' && transactionFilterMonth.value)
    source = source.filter(i => i.entry_date.startsWith(transactionFilterMonth.value))
  return source
})

// Calculate opening balance from transactions before the filtered period
const openingBalance = computed(() => {
  let cutoffDate = ''

  if (transactionFilterMode.value === 'day' && transactionFilterDate.value) {
    cutoffDate = transactionFilterDate.value
  } else if (transactionFilterMode.value === 'month' && transactionFilterMonth.value) {
    cutoffDate = `${transactionFilterMonth.value}-01`
  }

  if (!cutoffDate) return 0

  // Sum all transactions before the cutoff date
  const previousTransactions = transactions.value.filter(t => t.entry_date < cutoffDate)
  let balance = 0
  for (const tx of previousTransactions) {
    if (tx.type === 'income') {
      balance += tx.amount
    } else {
      balance -= tx.amount
    }
  }
  return balance
})

// Group transactions by date for ledger view
type LedgerTransaction = TransactionRow & { runningBalance: number }
type LedgerDayGroup = {
  date: string
  items: LedgerTransaction[]
  totalIncome: number
  totalExpense: number
  balance: number
  openingBalance: number
  closingBalance: number
}

const filteredTransactionsByDate = computed<LedgerDayGroup[]>(() => {
  const source = filteredTransactions.value

  // Group by date
  const grouped = source.reduce<Record<string, TransactionRow[]>>((acc, item) => {
    const dateKey = item.entry_date
    const dayItems = acc[dateKey] ?? []
    dayItems.push(item)
    acc[dateKey] = dayItems
    return acc
  }, {})

  // Sort dates ascending for chronological order (oldest first)
  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  // Start with opening balance from previous period
  let runningBalance = openingBalance.value

  const result = sortedDates.map(date => {
    const dayItems = grouped[date] ?? []

    // Sort items within the day by created_at (chronological order)
    dayItems.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return timeA - timeB
    })

    const totalIncome = dayItems.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
    const totalExpense = dayItems.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
    const dayBalance = totalIncome - totalExpense

    // Opening balance = balance from previous day
    const dayOpeningBalance = runningBalance

    // Calculate running balance for each item
    const itemsWithBalance: LedgerTransaction[] = dayItems.map(item => {
      if (item.type === 'income') {
        runningBalance += item.amount
      } else {
        runningBalance -= item.amount
      }
      return {
        ...item,
        runningBalance
      }
    })

    // Closing balance = opening + day's net change
    const closingBalance = runningBalance

    return {
      date,
      items: itemsWithBalance,
      totalIncome,
      totalExpense,
      balance: dayBalance,
      openingBalance: dayOpeningBalance,
      closingBalance
    }
  })

  // Keep chronological order (oldest to newest) for display
  return result
})

const transactionTotalPages = computed(() => Math.ceil(filteredTransactionsByDate.value.length / transactionItemsPerPage.value))

const paginatedLedgerGroups = computed(() => {
  const start = (transactionCurrentPage.value - 1) * transactionItemsPerPage.value
  const end = start + transactionItemsPerPage.value
  return filteredTransactionsByDate.value.slice(start, end)
})

const transactionPageInfo = computed(() => {
  const totalDays = filteredTransactionsByDate.value.length
  const totalItems = filteredTransactions.value.length
  if (totalDays === 0) return 'ไม่มีรายการ'
  const start = (transactionCurrentPage.value - 1) * transactionItemsPerPage.value + 1
  const end = Math.min(transactionCurrentPage.value * transactionItemsPerPage.value, totalDays)
  return `แสดง ${start}-${end} จาก ${totalDays} วัน (${totalItems} รายการ)`
})

watch([
  transactionFilterMode,
  transactionFilterDate,
  transactionFilterMonth,
], () => {
  // Set to last page (newest dates) after filter change
  nextTick(() => {
    transactionCurrentPage.value = transactionTotalPages.value || 1
  })
})

watch(transactionTotalPages, (totalPages) => {
  if (transactionCurrentPage.value > totalPages)
    transactionCurrentPage.value = Math.max(totalPages, 1)
})

const resetForm = () => {
  form.entryDate = getTodayTH()
  form.type = 'expense'
  form.category = ''
  form.description = ''
  form.amount = ''
  editingTransactionId.value = ''
  categorySearch.value = ''
  isCategoryDropdownOpen.value = false
}

type BackendTransaction = {
  id: string
  userId: string
  bookId?: string | null
  type: string
  amount: number
  category: string | null
  transactionDate: string
  note: string | null
}

const normalizeRows = (rows: BackendTransaction[]): TransactionRow[] => rows.map(row => ({
  id: String(row.id), user_id: String(row.userId), book_id: row.bookId ? String(row.bookId) : null, entry_date: String(row.transactionDate).slice(0, 10),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  description: typeof row.note === 'string' ? row.note : null,
  amount: Number(row.amount || 0), created_at: String(row.transactionDate || ''),
}))

const openAddTransactionModal = () => {
  resetForm()
  form.bookId = selectedBookId.value !== 'all' ? selectedBookId.value : (defaultBook.value?.id || books.value[0]?.id || '')
  isEntryModalOpen.value = true
}

const openEditTransactionModal = (item: TransactionRow) => {
  editingTransactionId.value = item.id
  form.entryDate = item.entry_date
  form.type = item.type
  form.category = item.category || ''
  categorySearch.value = item.category || ''
  form.description = item.description || ''
  form.amount = String(item.amount)
  form.bookId = item.book_id || (defaultBook.value?.id || books.value[0]?.id || '')
  errorMessage.value = ''
  isCategoryDropdownOpen.value = false
  isEntryModalOpen.value = true
}

const getApiErrorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendTransaction[]>(`/api/Finance/${userId.value}${query}`)
    const sorted = [...data].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    transactions.value = normalizeRows(sorted)
  } catch (error: any) {
    console.error('Load transactions error:', error)
    errorMessage.value = getApiErrorMessage(error, 'โหลดข้อมูลไม่สำเร็จ')
  } finally {
    isLoading.value = false
  }
}

const submitTransaction = async () => {
  if (isSubmitting.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  const amount = Math.abs(Number(form.amount))
  if (!form.entryDate) { toastWarning('กรุณาเลือกวันที่'); return }
  if (!Number.isFinite(amount) || amount <= 0) { toastWarning('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    if (!userId.value) return
    const targetBookId = form.bookId || (selectedBookId.value !== 'all' ? selectedBookId.value : (defaultBook.value?.id || null))
    const body = {
      userId: userId.value,
      bookId: targetBookId,
      type: form.type,
      amount,
      category: form.category.trim() || 'ทั่วไป',
      transactionDate: form.entryDate ? `${form.entryDate}T00:00:00.000Z` : new Date().toISOString(),
      note: form.description.trim() || null,
    }
    if (isEditing.value) {
      await apiFetch(`/api/Finance/${editingTransactionId.value}`, { method: 'PUT', body })
    } else {
      await apiFetch('/api/Finance', { method: 'POST', body })
    }
    toastSuccess(isEditing.value ? 'แก้ไขรายการสำเร็จ' : 'เพิ่มรายการสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    await loadTransactions()
  } catch (error: any) {
    console.error('Save transaction error:', error)
    const msg = getApiErrorMessage(error, 'บันทึกรายการไม่สำเร็จ')
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isSubmitting.value = false
  }
}

const deleteTransaction = async (transactionId: string) => {
  if (!transactionId || isDeletingId.value) return
  const { confirmDelete, confirmAction, toastSuccess, toastError } = useAlert()
  const targetTx = transactions.value.find(i => i.id === transactionId)

  let rollbackRecurringItem: BackendRecurringExpense | null = null
  if (targetTx && targetTx.description?.startsWith('ชำระรายจ่ายประจำ: ')) {
    const title = targetTx.description.replace('ชำระรายจ่ายประจำ: ', '').trim()
    rollbackRecurringItem = recurringExpenses.value.find(r => r.title.trim() === title || targetTx.description?.includes(r.title)) || null
  }

  let shouldRollbackRecurring = false

  if (rollbackRecurringItem) {
    const choice = import.meta.client ? await confirmAction(
      `ยกเลิกชำระ ${rollbackRecurringItem.title}?`,
      `รายการนี้เป็นรายการชำระรายจ่ายประจำ ระบบจะลบรายการนี้และย้อนวันกำหนดจ่ายของรายจ่ายประจำกลับมา 1 รอบ`,
      'ใช่, ลบและย้อนรอบจ่าย'
    ) : true
    if (!choice) return
    shouldRollbackRecurring = true
  } else {
    const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบรายการนี้?', 'สรุปยอดเงินจะถูกคำนวณใหม่') : true
    if (!shouldDelete) return
  }

  isDeletingId.value = transactionId
  errorMessage.value = ''
  try {
    await apiFetch(`/api/Finance/${transactionId}`, { method: 'DELETE' })
    transactions.value = transactions.value.filter(i => i.id !== transactionId)

    if (shouldRollbackRecurring && rollbackRecurringItem) {
      const parsed = new Date(rollbackRecurringItem.startDate)
      const currentStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      currentStart.setMonth(currentStart.getMonth() - 1)

      const y = currentStart.getFullYear()
      const m = String(currentStart.getMonth() + 1).padStart(2, '0')
      const d = String(currentStart.getDate()).padStart(2, '0')

      const updatedBody = {
        ...rollbackRecurringItem,
        startDate: `${y}-${m}-${d}T00:00:00`,
      }
      await apiFetch(`/api/Finance/recurring/${rollbackRecurringItem.id}`, { method: 'PUT', body: updatedBody })
      await loadRecurringExpenses()
    }

    if (editingTransactionId.value === transactionId) { isEntryModalOpen.value = false; resetForm() }
    toastSuccess(shouldRollbackRecurring ? 'ลบรายการและย้อนรอบจ่ายประจำสำเร็จ' : 'ลบรายการสำเร็จ')
    await loadTransactions()
  } catch (error: any) {
    console.error('Delete transaction error:', error)
    const msg = getApiErrorMessage(error, 'ลบรายการไม่สำเร็จ')
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isDeletingId.value = ''
  }
}

export interface BackendRecurringExpense {
  id: string
  userId: string
  bookId?: string | null
  title: string
  amount: number
  category: string
  startDate: string
  endDate?: string | null
  isIndefinite: boolean
  dayOfMonthDue: number
}

const formatShortDate = (dStr: string) => {
  if (!dStr) return ''
  const d = new Date(dStr)
  if (isNaN(d.getTime())) return dStr
  const day = d.getDate()
  const month = d.getMonth() + 1
  const yearBE = d.getFullYear() + 543
  return `${day}/${month}/${yearBE}`
}

const calculateNextDue = (r: { dayOfMonthDue?: number; startDate?: string }) => {
  const day = r.dayOfMonthDue ?? 1
  const now = new Date()
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

const getDueInfo = (r: BackendRecurringExpense) => {
  // Use forceRecurringUpdate to trigger reactive updates
  forceRecurringUpdate.value // Access to make it reactive

  const nextDue = calculateNextDue(r)
  const now = new Date()
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueOnly = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate())

  const diffTime = dueOnly.getTime() - todayOnly.getTime()
  const daysUntil = Math.round(diffTime / (1000 * 3600 * 24))

  // คำนวณ countdown แบบละเอียด (วัน ชม:นาที:วินาที)
  const dueTarget = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate(), 23, 59, 59)
  const remainingMs = dueTarget.getTime() - now.getTime()

  let countdownText = ''
  if (remainingMs < 0) {
    countdownText = 'เลยกำหนด'
  } else if (daysUntil === 0) {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `${h}:${m}:${s}`
  } else {
    const totalSec = Math.floor(remainingMs / 1000)
    const h = String(Math.floor((totalSec % (3600 * 24)) / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    countdownText = `${daysUntil} วัน ${h}:${m}:${s}`
  }

  let label = ''
  let statusClass = ''

  if (daysUntil === 0) {
    label = 'ครบกำหนดวันนี้'
    statusClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  } else if (daysUntil < 0) {
    label = `เลยกำหนด ${Math.abs(daysUntil)} วัน`
    statusClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  } else if (daysUntil <= 3) {
    label = `อีก ${daysUntil} วัน`
    statusClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  } else {
    label = `อีก ${daysUntil} วัน`
    statusClass = 'bg-gray-800 text-gray-400 border-gray-700/60'
  }

  // คำนวณ progress bar (จากวันที่เริ่มรอบจนถึงวันครบกำหนด)
  const startDate = r.startDate
    ? new Date(r.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const totalDuration = nextDue.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, elapsed / totalDuration)) : 0
  const progressPercent = Math.round(progress * 100)

  return { nextDue, daysUntil, label, statusClass, countdownText, progress, progressPercent }
}

const recurringExpenses = ref<BackendRecurringExpense[]>([])
const isLoadingRecurring = ref(false)
const isPayingRecurringId = ref('')
const isRecurringModalOpen = ref(false)
const editingRecurringId = ref('')
const isSubmittingRecurring = ref(false)
const isDeletingRecurring = ref(false)

// Timer for countdown updates
let recurringCountdownTimer: ReturnType<typeof setInterval> | null = null
const forceRecurringUpdate = ref(0) // Trigger for reactive updates

const isExportModalOpen = ref(false)
const exportScope = ref<'month' | 'year' | 'all'>('month')
const exportMonth = ref(getThisMonthTH())
const exportYear = ref(String(new Date().getFullYear()))
const isExporting = ref(false)

const recurringForm = reactive({
  title: '',
  amount: '',
  category: 'ค่าใช้จ่ายประจำ',
  dayOfMonthDue: 1,
  startDate: getTodayTH(),
  isIndefinite: true,
  endDate: '',
  bookId: '',
})

// Watch for recurring amount changes to show live calculation
watch(() => recurringForm.amount, (newVal) => {
  if (!newVal || String(newVal).trim() === '') {
    calculatedRecurringAmount.value = null
    return
  }

  const asNumber = Number(newVal)
  if (!isNaN(asNumber)) {
    calculatedRecurringAmount.value = null
    return
  }

  const result = evaluateMathExpression(String(newVal))
  calculatedRecurringAmount.value = result
})

const fixedRecurringExpenses = computed(() => {
  return recurringExpenses.value.filter(r => !r.isIndefinite && r.endDate)
})
const indefiniteRecurringExpenses = computed(() => {
  return recurringExpenses.value.filter(r => r.isIndefinite || !r.endDate)
})

const recurringTotalMonthly = computed(() => recurringExpenses.value.reduce((s, r) => s + r.amount, 0))
const recurringDueSoonCount = computed(() => recurringExpenses.value.filter(r => {
  const info = getDueInfo(r)
  return info.daysUntil <= 3
}).length)

const dailySummaryTotals = computed(() => {
  const list = dailySummaries.value
  const income = list.reduce((s, d) => s + d.income, 0)
  const expense = list.reduce((s, d) => s + d.expense, 0)
  return { income, expense, balance: income - expense }
})

const loadRecurringExpenses = async () => {
  isLoadingRecurring.value = true
  try {
    if (!userId.value) return
    const query = selectedBookId.value && selectedBookId.value !== 'all' ? `?bookId=${selectedBookId.value}` : ''
    const data = await apiFetch<BackendRecurringExpense[]>(`/api/Finance/recurring/${userId.value}${query}`)
    recurringExpenses.value = data || []
  } catch (error: any) {
    console.error('Load recurring expenses error:', error)
  } finally {
    isLoadingRecurring.value = false
  }
}

const openAddRecurringModal = () => {
  editingRecurringId.value = ''
  recurringForm.title = ''
  recurringForm.amount = ''
  recurringForm.category = 'ค่าใช้จ่ายประจำ'
  recurringForm.dayOfMonthDue = 1
  recurringForm.startDate = getTodayTH()
  recurringForm.isIndefinite = true
  recurringForm.endDate = ''
  recurringForm.bookId = selectedBookId.value !== 'all' ? selectedBookId.value : (defaultBook.value?.id || books.value[0]?.id || '')
  isRecurringModalOpen.value = true
}

const openEditRecurringModal = (item: BackendRecurringExpense) => {
  editingRecurringId.value = item.id
  recurringForm.title = item.title
  recurringForm.amount = String(item.amount)
  recurringForm.category = item.category || 'ค่าใช้จ่ายประจำ'
  recurringForm.dayOfMonthDue = item.dayOfMonthDue || 1
  recurringForm.startDate = item.startDate ? item.startDate.slice(0, 10) : getTodayTH()
  recurringForm.isIndefinite = item.isIndefinite
  recurringForm.endDate = item.endDate ? item.endDate.slice(0, 10) : ''
  recurringForm.bookId = item.bookId || (defaultBook.value?.id || books.value[0]?.id || '')
  isRecurringModalOpen.value = true
}

const submitRecurring = async () => {
  if (isSubmittingRecurring.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  if (!recurringForm.title.trim()) { toastWarning('กรุณาระบุชื่อรายการ'); return }
  const amount = Math.abs(Number(recurringForm.amount))
  if (!Number.isFinite(amount) || amount <= 0) { toastWarning('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return }

  isSubmittingRecurring.value = true
  try {
    const targetBookId = recurringForm.bookId || (selectedBookId.value !== 'all' ? selectedBookId.value : (defaultBook.value?.id || null))
    const body = {
      userId: userId.value,
      bookId: targetBookId,
      title: recurringForm.title.trim(),
      amount,
      category: recurringForm.category.trim() || 'ค่าใช้จ่ายประจำ',
      dayOfMonthDue: Number(recurringForm.dayOfMonthDue) || 1,
      startDate: recurringForm.startDate ? `${recurringForm.startDate}T00:00:00.000Z` : new Date().toISOString(),
      isIndefinite: recurringForm.isIndefinite,
      endDate: (!recurringForm.isIndefinite && recurringForm.endDate) ? `${recurringForm.endDate}T23:59:59.000Z` : null,
    }

    if (editingRecurringId.value) {
      await apiFetch(`/api/Finance/recurring/${editingRecurringId.value}`, { method: 'PUT', body })
      toastSuccess('แก้ไขรายจ่ายประจำสำเร็จ')
    } else {
      await apiFetch('/api/Finance/recurring', { method: 'POST', body })
      toastSuccess('เพิ่มรายจ่ายประจำสำเร็จ')
    }
    isRecurringModalOpen.value = false
    await loadRecurringExpenses()
  } catch (error: any) {
    console.error('Save recurring error:', error)
    toastError(getApiErrorMessage(error, 'บันทึกรายจ่ายประจำไม่สำเร็จ'))
  } finally {
    isSubmittingRecurring.value = false
  }
}

const deleteRecurring = async () => {
  if (!editingRecurringId.value || isDeletingRecurring.value) return
  const { confirmDelete, toastSuccess, toastError } = useAlert()
  const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบรายจ่ายประจำนี้?', '') : true
  if (!shouldDelete) return
  isDeletingRecurring.value = true
  try {
    await apiFetch(`/api/Finance/recurring/${editingRecurringId.value}`, { method: 'DELETE' })
    toastSuccess('ลบรายจ่ายประจำสำเร็จ')
    isRecurringModalOpen.value = false
    await loadRecurringExpenses()
  } catch (error: any) {
    console.error('Delete recurring error:', error)
    toastError(getApiErrorMessage(error, 'ลบรายการไม่สำเร็จ'))
  } finally {
    isDeletingRecurring.value = false
  }
}

const payRecurring = async (item: BackendRecurringExpense) => {
  if (isPayingRecurringId.value) return
  const { confirmAction, toastSuccess, toastError } = useAlert()
  const shouldPay = import.meta.client ? await confirmAction(
    `ยืนยันชำระ ${item.title}?`,
    `ยอดเงิน ฿${item.amount.toLocaleString()} จะถูกบันทึกในรายการจ่าย และขยับวันชำระไปรอบถัดไป`,
    'ชำระเงินเรียบร้อย'
  ) : true
  if (!shouldPay) return

  isPayingRecurringId.value = item.id
  try {
    const currentNextDue = calculateNextDue(item)
    // 1. Record expense transaction
    const bodyTx = {
      userId: userId.value,
      bookId: item.bookId || (defaultBook.value?.id || null),
      type: 'expense',
      amount: item.amount,
      category: item.category || 'ค่าใช้จ่ายประจำ',
      transactionDate: new Date().toISOString(),
      note: `ชำระรายจ่ายประจำ: ${item.title}`,
    }
    await apiFetch('/api/Finance', { method: 'POST', body: bodyTx })

    // 2. Advance startDate to day after current next due
    const newStartDate = new Date(currentNextDue)
    newStartDate.setDate(newStartDate.getDate() + 1)

    const y = newStartDate.getFullYear()
    const m = String(newStartDate.getMonth() + 1).padStart(2, '0')
    const d = String(newStartDate.getDate()).padStart(2, '0')

    const bodyRecurring = {
      ...item,
      startDate: `${y}-${m}-${d}T00:00:00`,
    }
    await apiFetch(`/api/Finance/recurring/${item.id}`, { method: 'PUT', body: bodyRecurring })

    toastSuccess(`บันทึกรายจ่าย ฿${item.amount.toLocaleString()} เรียบร้อยแล้ว`)
    await Promise.all([loadTransactions(), loadRecurringExpenses()])
  } catch (error: any) {
    console.error('Pay recurring error:', error)
    toastError(getApiErrorMessage(error, 'เกิดข้อผิดพลาดในการชำระรายจ่ายประจำ'))
  } finally {
    isPayingRecurringId.value = ''
  }
}

const refreshData = async () => {
  await Promise.all([
    fetchBooks(),
    loadTransactions(),
    loadRecurringExpenses(),
  ])
}

watch(selectedBookId, () => {
  loadTransactions()
  loadRecurringExpenses()
})

onMounted(async () => {
  await fetchBooks()
  loadTransactions()
  loadRecurringExpenses()
  document.addEventListener('mousedown', handleClickOutsideCombobox)

  // Start countdown timer for recurring expenses
  recurringCountdownTimer = setInterval(() => {
    if (recurringExpenses.value.length > 0) {
      forceRecurringUpdate.value++
    }
  }, 1000)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutsideCombobox)

  // Clear countdown timer
  if (recurringCountdownTimer) {
    clearInterval(recurringCountdownTimer)
    recurringCountdownTimer = null
  }
})

const availableYears = computed(() => {
  const years = new Set<string>()
  const currentYear = String(new Date().getFullYear())
  years.add(currentYear)
  for (const t of transactions.value) {
    if (t.entry_date && t.entry_date.length >= 4) {
      years.add(t.entry_date.slice(0, 4))
    }
  }
  return [...years].sort((a, b) => b.localeCompare(a))
})

const exportTransactions = computed(() => {
  if (exportScope.value === 'month') {
    return transactions.value.filter(t => t.entry_date.startsWith(exportMonth.value))
  }
  if (exportScope.value === 'year') {
    return transactions.value.filter(t => t.entry_date.startsWith(exportYear.value))
  }
  return transactions.value
})

const exportOpeningBalance = computed(() => {
  let cutoffDate = ''
  if (exportScope.value === 'month') {
    cutoffDate = `${exportMonth.value}-01`
  } else if (exportScope.value === 'year') {
    cutoffDate = `${exportYear.value}-01-01`
  }
  if (!cutoffDate) return 0

  const previousTransactions = transactions.value.filter(t => t.entry_date < cutoffDate)
  let balance = 0
  for (const tx of previousTransactions) {
    if (tx.type === 'income') balance += tx.amount
    else balance -= tx.amount
  }
  return balance
})

const exportTotalIncome = computed(() => exportTransactions.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0))
const exportTotalExpense = computed(() => exportTransactions.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0))
const exportNetBalance = computed(() => exportTotalIncome.value - exportTotalExpense.value)

const exportPeriodLabel = computed(() => {
  if (exportScope.value === 'month') {
    const [yearStr, monthStr] = exportMonth.value.split('-')
    if (yearStr && monthStr) {
      const year = Number(yearStr) + 543
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ]
      const monthName = monthNames[Number(monthStr) - 1] || ''
      return `ประจำเดือน ${monthName} ${year}`
    }
    return `ประจำเดือน ${exportMonth.value}`
  }
  if (exportScope.value === 'year') {
    const year = Number(exportYear.value) + 543
    return `ประจำปี ${year}`
  }
  return 'ข้อมูลทั้งหมดทุกช่วงเวลา'
})

const getExportFilenamePrefix = (ext: string) => {
  const now = new Date()
  const thaiYear = now.getFullYear() + 543
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  if (exportScope.value === 'month') {
    const [y, m] = exportMonth.value.split('-')
    const beYear = Number(y) + 543
    return `รายรับรายจ่าย_เดือน_${beYear}${m}.${ext}`
  }
  if (exportScope.value === 'year') {
    const beYear = Number(exportYear.value) + 543
    return `รายรับรายจ่าย_ปี_${beYear}.${ext}`
  }
  return `รายรับรายจ่าย_ทั้งหมด_${thaiYear}${month}${day}.${ext}`
}

const openExportModal = () => {
  if (summaryFilterMonth.value) {
    exportMonth.value = summaryFilterMonth.value
  } else if (transactionFilterMonth.value) {
    exportMonth.value = transactionFilterMonth.value
  } else {
    exportMonth.value = getThisMonthTH()
  }

  if (exportMonth.value) {
    const [y] = exportMonth.value.split('-')
    if (y) exportYear.value = y
  }

  isExportModalOpen.value = true
}

const exportToCSV = () => {
  const { toastSuccess, toastError } = useAlert()
  if (exportTransactions.value.length === 0) {
    toastError('ไม่มีข้อมูลให้ Export ในช่วงเวลาที่เลือก')
    return
  }

  isExporting.value = true
  try {
    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)', 'คงเหลือสะสม']
    const sortedTransactions = [...exportTransactions.value].sort((a, b) => a.entry_date.localeCompare(b.entry_date))

    let runningBalance = exportOpeningBalance.value
    const rows: string[][] = []

    if (exportOpeningBalance.value !== 0) {
      rows.push(['ยอดยกมา', '-', '-', 'ยอดยกมาจากงวดก่อนหน้า', '', exportOpeningBalance.value.toFixed(2)])
    }

    sortedTransactions.forEach(tx => {
      if (tx.type === 'income') runningBalance += tx.amount
      else runningBalance -= tx.amount

      rows.push([
        formatDate(tx.entry_date),
        tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        tx.category || 'ไม่ระบุหมวดหมู่',
        tx.description || '-',
        (tx.type === 'income' ? tx.amount : -tx.amount).toFixed(2),
        runningBalance.toFixed(2)
      ])
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = getExportFilenamePrefix('csv')

    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toastSuccess(`Export CSV (${exportPeriodLabel.value}) สำเร็จ`)
      isExportModalOpen.value = false
    }
  } catch (error) {
    console.error('Export CSV error:', error)
    toastError('เกิดข้อผิดพลาดในการ Export CSV')
  } finally {
    isExporting.value = false
  }
}

const exportToExcel = async () => {
  const { toastSuccess, toastError } = useAlert()
  if (exportTransactions.value.length === 0) {
    toastError('ไม่มีข้อมูลให้ Export ในช่วงเวลาที่เลือก')
    return
  }

  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const sortedTransactions = [...exportTransactions.value].sort((a, b) => a.entry_date.localeCompare(b.entry_date))

    let runningBalance = exportOpeningBalance.value
    const data: Array<Record<string, string | number>> = []

    if (exportOpeningBalance.value !== 0) {
      data.push({
        'วันที่': 'ยอดยกมา',
        'ประเภท': '-',
        'หมวดหมู่': '-',
        'รายละเอียด': 'ยอดยกมาจากงวดก่อนหน้า',
        'จำนวนเงิน (บาท)': '',
        'คงเหลือสะสม': exportOpeningBalance.value
      })
    }

    sortedTransactions.forEach(tx => {
      if (tx.type === 'income') runningBalance += tx.amount
      else runningBalance -= tx.amount

      data.push({
        'วันที่': formatDate(tx.entry_date),
        'ประเภท': tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        'หมวดหมู่': tx.category || 'ไม่ระบุหมวดหมู่',
        'รายละเอียด': tx.description || '-',
        'จำนวนเงิน (บาท)': tx.type === 'income' ? tx.amount : -tx.amount,
        'คงเหลือสะสม': runningBalance
      })
    })

    // Summary at bottom
    data.push({})
    data.push({
      'วันที่': 'สรุปภาพรวม',
      'ประเภท': exportPeriodLabel.value,
      'หมวดหมู่': '',
      'รายละเอียด': '',
      'จำนวนเงิน (บาท)': '',
      'คงเหลือสะสม': ''
    })
    data.push({
      'วันที่': 'รายรับรวม (+)',
      'ประเภท': '',
      'หมวดหมู่': '',
      'รายละเอียด': '',
      'จำนวนเงิน (บาท)': exportTotalIncome.value,
      'คงเหลือสะสม': ''
    })
    data.push({
      'วันที่': 'รายจ่ายรวม (-)',
      'ประเภท': '',
      'หมวดหมู่': '',
      'รายละเอียด': '',
      'จำนวนเงิน (บาท)': exportTotalExpense.value,
      'คงเหลือสะสม': ''
    })
    data.push({
      'วันที่': 'คงเหลือสุทธิ',
      'ประเภท': '',
      'หมวดหมู่': '',
      'รายละเอียด': '',
      'จำนวนเงิน (บาท)': exportNetBalance.value,
      'คงเหลือสะสม': ''
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'รายรับรายจ่าย')

    ws['!cols'] = [
      { wch: 16 }, // วันที่
      { wch: 12 }, // ประเภท
      { wch: 22 }, // หมวดหมู่
      { wch: 34 }, // รายละเอียด
      { wch: 18 }, // จำนวนเงิน
      { wch: 18 }  // คงเหลือสะสม
    ]

    const filename = getExportFilenamePrefix('xlsx')
    XLSX.writeFile(wb, filename)

    toastSuccess(`Export Excel (${exportPeriodLabel.value}) สำเร็จ`)
    isExportModalOpen.value = false
  } catch (error: any) {
    console.error('Export Excel error:', error)
    toastError('เกิดข้อผิดพลาดในการ Export Excel')
  } finally {
    isExporting.value = false
  }
}

const exportToPDF = async () => {
  const { toastSuccess, toastError } = useAlert()
  if (exportTransactions.value.length === 0) {
    toastError('ไม่มีข้อมูลให้ Export ในช่วงเวลาที่เลือก')
    return
  }

  isExporting.value = true
  try {
    const filename = getExportFilenamePrefix('pdf')
    await generateCashflowPDF({
      periodLabel: exportPeriodLabel.value,
      transactions: exportTransactions.value,
      openingBalance: exportOpeningBalance.value,
      formatDate,
      filename,
      documentTitle: 'รายงานสรุปรายรับ - รายจ่าย'
    })

    toastSuccess(`Export PDF (${exportPeriodLabel.value}) สำเร็จ`)
    isExportModalOpen.value = false
  } catch (error: any) {
    console.error('Export PDF error:', error)
    toastError(error?.message || 'เกิดข้อผิดพลาดในการ Export PDF')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
/* Tabs */
.cashflow-view-tabs {
  padding: 0.35rem;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.cashflow-view-tabs > div {
  min-width: 480px;
}

@media (min-width: 640px) {
  .cashflow-view-tabs > div {
    min-width: 0;
  }
}

.tab-button {
  @apply px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border text-xs sm:text-sm font-semibold;
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
}

.tab-button:hover {
  background: var(--bg-elevated);
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.tab-button:active {
  transform: scale(0.97);
}

.tab-button-active {
  background: var(--brand-soft) !important;
  border-color: var(--brand-border) !important;
  color: var(--brand-ink) !important;
  box-shadow: 0 1px 3px rgba(37, 99, 168, 0.12);
}

.cashflow-tab-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Book Selector Pills */
.book-pill {
  @apply px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 border font-medium;
  background: var(--bg-elevated);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.book-pill:hover {
  background: var(--bg-surface);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.book-pill:active {
  transform: scale(0.97);
}

.book-pill-active {
  background: var(--brand) !important;
  border-color: var(--brand) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(37, 99, 168, 0.3);
}

.book-pill-selected {
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.18);
}

.book-pill-badge {
  @apply text-[10px] px-1.5 py-0.5 rounded-full font-semibold;
  background: rgba(255, 255, 255, 0.15);
  color: currentColor;
}

.book-pill-active .book-pill-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.book-default-badge {
  @apply text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0;
}

/* Scrollbar Hide */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
