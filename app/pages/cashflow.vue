<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <!-- Page Header -->
      <header class="sticky top-0 z-10 px-6 md:px-8 py-5 border-b border-gray-800/80 bg-gray-900/95 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">รายรับรายจ่าย</h1>
          <p class="text-xs text-gray-500 mt-0.5">บันทึกรายการรายวัน พร้อมสรุปยอดเงินคงเหลือ</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="isEntryModalOpen = true"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
          >
            <span>+</span> เพิ่มรายการ
          </button>
          <button
            @click="loadTransactions"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700/60 text-sm text-gray-400 hover:text-white transition-all"
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
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <!-- Income -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl mb-3">📈</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">รายรับรวม</p>
            <p class="text-2xl font-bold text-emerald-400 mt-1">{{ formatCurrency(totalIncome) }}</p>
          </div>

          <!-- Expense -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-xl mb-3">📉</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">รายจ่ายรวม</p>
            <p class="text-2xl font-bold text-rose-400 mt-1">{{ formatCurrency(totalExpense) }}</p>
            <div class="mt-3">
              <div class="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-500" :style="{ width: `${expenseProgressPercent}%` }"></div>
              </div>
              <p class="text-[11px] text-gray-500 mt-1">
                {{ expenseProgressText }}
                <span v-if="overspentAmount > 0" class="text-amber-400"> (เกิน {{ formatCurrency(overspentAmount) }})</span>
              </p>
            </div>
          </div>

          <!-- Balance -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" :class="remainingBalance >= 0 ? 'bg-sky-500/15' : 'bg-amber-500/15'">💰</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">เงินคงเหลือ</p>
            <p class="text-2xl font-bold mt-1" :class="remainingBalance >= 0 ? 'text-sky-300' : 'text-amber-300'">{{ formatCurrency(remainingBalance) }}</p>
            <div class="mt-3">
              <div class="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div class="h-full transition-all duration-500" :class="remainingBalance >= 0 ? 'bg-gradient-to-r from-sky-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'" :style="{ width: `${remainingProgressPercent}%` }"></div>
              </div>
              <p class="text-[11px] text-gray-500 mt-1">{{ remainingProgressText }}</p>
            </div>
          </div>

          <!-- Top Category -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 md:p-5">
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-xl mb-3">🏷️</div>
            <p class="text-[11px] text-gray-500 font-medium uppercase tracking-wide">หมวดสูงสุด</p>
            <p class="text-lg font-bold text-white mt-1 truncate">{{ topExpenseCategory.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ formatCurrency(topExpenseCategory.amount) }}</p>
          </div>
        </div>

        <!-- Top / Bottom Expense Category Rankings -->
        <div v-if="expenseCategoryRankings.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Top 3 Highest -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-base shrink-0">🔺</div>
              <div>
                <h2 class="text-sm font-semibold text-white">3 อันดับรายจ่ายสูงสุด</h2>
                <p class="text-[11px] text-gray-500">หมวดที่ใช้จ่ายมากที่สุด</p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(cat, i) in topExpenseCategories"
                :key="cat.name"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/30"
              >
                <span
                  class="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                  :class="i === 0 ? 'bg-rose-500/30 text-rose-300' : i === 1 ? 'bg-orange-500/30 text-orange-300' : 'bg-amber-500/30 text-amber-300'"
                >{{ i + 1 }}</span>
                <span class="flex-1 text-sm text-white truncate">{{ cat.name }}</span>
                <span class="text-sm font-semibold text-rose-400 shrink-0">{{ formatCurrency(cat.amount) }}</span>
              </div>
            </div>
          </div>
          <!-- Top 3 Lowest -->
          <div class="bg-gray-900 border border-gray-800/80 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-base shrink-0">🔻</div>
              <div>
                <h2 class="text-sm font-semibold text-white">3 อันดับรายจ่ายน้อยสุด</h2>
                <p class="text-[11px] text-gray-500">หมวดที่ใช้จ่ายน้อยที่สุด</p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(cat, i) in bottomExpenseCategories"
                :key="cat.name"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/30"
              >
                <span
                  class="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                  :class="i === 0 ? 'bg-emerald-500/30 text-emerald-300' : i === 1 ? 'bg-teal-500/30 text-teal-300' : 'bg-cyan-500/30 text-cyan-300'"
                >{{ i + 1 }}</span>
                <span class="flex-1 text-sm text-white truncate">{{ cat.name }}</span>
                <span class="text-sm font-semibold text-emerald-400 shrink-0">{{ formatCurrency(cat.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Summary -->
        <section class="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
            <div>
              <h2 class="text-base font-semibold text-white">สรุปรายวัน</h2>
              <p class="text-xs text-gray-500 mt-0.5">ยอดรับจ่ายและคงเหลือแต่ละวัน</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <input
                v-model="summaryFilterMonth"
                type="month"
                class="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              <button
                v-if="summaryFilterMonth"
                @click="summaryFilterMonth = ''"
                class="text-xs text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-all"
              >ล้าง ✕</button>
              <span class="text-xs bg-gray-800/80 text-gray-400 border border-gray-700/60 rounded-full px-3 py-1">{{ dailySummaries.length }} วัน</span>
            </div>
          </div>

          <div v-if="isLoading" class="p-5 space-y-2">
            <div v-for="i in 3" :key="i" class="h-14 rounded-xl bg-gray-800/60 animate-pulse"></div>
          </div>
          <div v-else-if="!dailySummaries.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
            <div class="w-14 h-14 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-3">📊</div>
            <p class="text-sm font-medium text-gray-400">ยังไม่มีข้อมูลรายรับรายจ่าย</p>
          </div>
          <div v-else class="divide-y divide-gray-800/50">
            <div
              v-for="day in dailySummaries"
              :key="day.date"
              class="grid grid-cols-4 gap-2 px-5 py-3.5 hover:bg-gray-800/20 transition-all"
            >
              <div>
                <p class="text-[11px] text-gray-500">วันที่</p>
                <p class="text-sm font-medium text-white mt-0.5">{{ formatDate(day.date) }}</p>
              </div>
              <div>
                <p class="text-[11px] text-gray-500">รายรับ</p>
                <p class="text-sm font-semibold text-emerald-400 mt-0.5">+{{ formatCurrency(day.income) }}</p>
              </div>
              <div>
                <p class="text-[11px] text-gray-500">รายจ่าย</p>
                <p class="text-sm font-semibold text-rose-400 mt-0.5">-{{ formatCurrency(day.expense) }}</p>
              </div>
              <div>
                <p class="text-[11px] text-gray-500">คงเหลือ</p>
                <p class="text-sm font-semibold mt-0.5" :class="day.balance >= 0 ? 'text-sky-300' : 'text-amber-300'">
                  {{ formatCurrency(day.balance) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Transaction List -->
        <section class="bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
            <h2 class="text-base font-semibold text-white">รายการทั้งหมด</h2>
            <div class="flex items-center gap-2 flex-wrap">
              <select
                v-model="transactionFilterMode"
                class="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
              >
                <option value="all">ทั้งหมด</option>
                <option value="day">รายวัน</option>
                <option value="month">รายเดือน</option>
              </select>
              <input
                v-if="transactionFilterMode === 'day'"
                v-model="transactionFilterDate"
                type="date"
                class="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
              />
              <input
                v-if="transactionFilterMode === 'month'"
                v-model="transactionFilterMonth"
                type="month"
                class="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
              />
              <span class="text-xs text-gray-500">{{ filteredTransactions.length }} รายการ</span>
            </div>
          </div>

          <div v-if="!filteredTransactions.length" class="flex flex-col items-center justify-center py-12 text-center px-5">
            <div class="w-14 h-14 rounded-2xl bg-gray-800/70 flex items-center justify-center text-2xl mb-3">💳</div>
            <p class="text-sm font-medium text-gray-400">ยังไม่มีรายการ</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-gray-800/60 bg-gray-800/20">
                  <th class="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">วันที่</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">ประเภท</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">หมวดหมู่</th>
                  <th class="text-left py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">รายละเอียด</th>
                  <th class="text-right py-3 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">จำนวนเงิน</th>
                  <th class="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/40">
                <tr
                  v-for="item in filteredTransactions"
                  :key="item.id"
                  class="hover:bg-gray-800/20 transition-all"
                >
                  <td class="py-3 px-5 text-gray-300 text-xs whitespace-nowrap">{{ formatDate(item.entry_date) }}</td>
                  <td class="py-3 px-3">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      :class="item.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'"
                    >
                      {{ item.type === 'income' ? '↑ รับ' : '↓ จ่าย' }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-gray-300 text-xs">{{ item.category || '-' }}</td>
                  <td class="py-3 px-3 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">{{ item.description || '-' }}</td>
                  <td class="py-3 px-3 text-right font-semibold text-sm" :class="item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'">
                    {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
                  </td>
                  <td class="py-3 px-5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        @click="openEditTransactionModal(item)"
                        :disabled="isDeletingId === item.id"
                        class="px-3 py-1.5 rounded-lg text-xs bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/20 disabled:opacity-50 transition-all font-medium"
                      >แก้ไข</button>
                      <button
                        @click="deleteTransaction(item.id)"
                        :disabled="isDeletingId === item.id"
                        class="px-3 py-1.5 rounded-lg text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 disabled:opacity-50 transition-all font-medium"
                      >{{ isDeletingId === item.id ? 'ลบ...' : 'ลบ' }}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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

        <div class="relative w-full max-w-lg rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl overflow-hidden">
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
              class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all"
              aria-label="ปิด"
            >✕</button>
          </div>

          <!-- Modal Body -->
          <form class="p-6 space-y-4" @submit.prevent="submitTransaction">
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
                class="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-gray-700/60 bg-gray-850 shadow-xl"
                style="background: #1a1d23;"
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
              <label class="block text-xs font-medium text-gray-400 mb-1.5">จำนวนเงิน (บาท) <span class="text-rose-400">*</span></label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">฿</span>
                <input
                  v-model="form.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                >
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
                class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all"
              >ยกเลิก</button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                {{ submitButtonText }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { getTodayTH, getThisMonthTH } from '~/utils/date'

type TransactionType = 'income' | 'expense'

type TransactionRow = {
  id: string
  user_id: string
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

type TransactionPayload = {
  entry_date: string
  type: TransactionType
  category: string | null
  description: string | null
  amount: number
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'รายรับรายจ่าย' })

const router = useRouter()
const supabase = useSupabaseClient()

const isLoading = ref(true)
const isSubmitting = ref(false)
const isEntryModalOpen = ref(false)
const isDeletingId = ref('')
const editingTransactionId = ref('')
const errorMessage = ref('')
const transactions = ref<TransactionRow[]>([])

const summaryFilterMonth = ref(getThisMonthTH())
const transactionFilterMode = ref<'all' | 'day' | 'month'>('all')
const transactionFilterDate = ref(getTodayTH())
const transactionFilterMonth = ref(getThisMonthTH())

const form = reactive({
  entryDate: getTodayTH(),
  type: 'expense' as TransactionType,
  category: '',
  description: '',
  amount: '',
})

const tableMissingCodes = new Set(['42P01', 'PGRST205'])

const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency', currency: 'THB', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount)

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
  day: '2-digit', month: 'short', year: 'numeric',
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
})

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
  if (transactionFilterMode.value === 'day' && transactionFilterDate.value)
    return transactions.value.filter(i => i.entry_date === transactionFilterDate.value)
  if (transactionFilterMode.value === 'month' && transactionFilterMonth.value)
    return transactions.value.filter(i => i.entry_date.startsWith(transactionFilterMonth.value))
  return transactions.value
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

const normalizeRows = (rows: any[]): TransactionRow[] => rows.map(row => ({
  id: String(row.id), user_id: String(row.user_id), entry_date: String(row.entry_date),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  description: typeof row.description === 'string' ? row.description : null,
  amount: Number(row.amount || 0), created_at: String(row.created_at || ''),
}))

const openEditTransactionModal = (item: TransactionRow) => {
  editingTransactionId.value = item.id
  form.entryDate = item.entry_date
  form.type = item.type
  form.category = item.category || ''
  categorySearch.value = item.category || ''
  form.description = item.description || ''
  form.amount = String(item.amount)
  errorMessage.value = ''
  isCategoryDropdownOpen.value = false
  isEntryModalOpen.value = true
}

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, entry_date, type, category, description, amount, created_at')
      .eq('user_id', userData.user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { errorMessage.value = 'ยังไม่พบตาราง transactions ใน Supabase'; transactions.value = []; return }
      throw error
    }
    transactions.value = normalizeRows(data || [])
  } catch (error: any) {
    console.error('Load transactions error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลไม่สำเร็จ'
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
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const payload: TransactionPayload = {
      entry_date: form.entryDate, type: form.type,
      category: form.category.trim() || null,
      description: form.description.trim() || null, amount,
    }
    const q = supabase.from('transactions') as any
    const { error } = isEditing.value
      ? await q.update(payload).eq('id', editingTransactionId.value).eq('user_id', userData.user.id)
      : await q.insert({ user_id: userData.user.id, ...payload })
    if (error) {
      if (tableMissingCodes.has(error.code || '')) { const msg = 'ยังไม่พบตาราง transactions ใน Supabase'; errorMessage.value = msg; toastError(msg); return }
      throw error
    }
    toastSuccess(isEditing.value ? 'แก้ไขรายการสำเร็จ' : 'เพิ่มรายการสำเร็จ')
    isEntryModalOpen.value = false
    resetForm()
    await loadTransactions()
  } catch (error: any) {
    console.error('Save transaction error:', error)
    const msg = error?.message || 'บันทึกรายการไม่สำเร็จ'
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isSubmitting.value = false
  }
}

const deleteTransaction = async (transactionId: string) => {
  if (!transactionId || isDeletingId.value) return
  const { confirmDelete, toastSuccess, toastError } = useAlert()
  const shouldDelete = import.meta.client ? await confirmDelete('ยืนยันการลบรายการนี้?', 'สรุปยอดเงินจะถูกคำนวณใหม่') : true
  if (!shouldDelete) return
  isDeletingId.value = transactionId
  errorMessage.value = ''
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) { await router.push('/login'); return }
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', userData.user.id)
    if (error) throw error
    transactions.value = transactions.value.filter(i => i.id !== transactionId)
    if (editingTransactionId.value === transactionId) { isEntryModalOpen.value = false; resetForm() }
    toastSuccess('ลบรายการสำเร็จ')
  } catch (error: any) {
    console.error('Delete transaction error:', error)
    const msg = error?.message || 'ลบรายการไม่สำเร็จ'
    errorMessage.value = msg
    toastError(msg)
  } finally {
    isDeletingId.value = ''
  }
}

onMounted(() => {
  loadTransactions()
  document.addEventListener('mousedown', handleClickOutsideCombobox)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutsideCombobox)
})
</script>
