<template>
  <AppTabsLayout>
    <div class="cx">
      <!-- Header -->
      <header class="cx-head">
        <div class="cx-head-title">
          <span class="cx-eyebrow"><i></i>{{ currentMonthYearLabel }}</span>
          <h1>รายรับ · รายจ่าย</h1>
          <p>
            {{ transactions.length }} รายการ<template v-if="recurringExpenses.length > 0"> · {{ recurringExpenses.length }} รายจ่ายประจำ</template>
          </p>
        </div>
        <div class="cx-head-actions">
          <button type="button" class="cx-ghost" :disabled="transactions.length === 0" title="Export ข้อมูล (PDF, Excel, CSV)" @click="openExportModal">
            <span aria-hidden="true">⬇</span><span class="cx-lbl">ส่งออก</span>
          </button>
          <button type="button" class="cx-ghost" :disabled="isLoading || isLoadingBooks" title="รีเฟรชข้อมูล" @click="refreshData">
            <span aria-hidden="true" :class="{ 'cx-spin': isLoading }">↻</span><span class="cx-lbl">{{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}</span>
          </button>
          <button type="button" class="cx-solid" @click="openAddTransactionModal">
            <span aria-hidden="true">＋</span> เพิ่มรายการ
          </button>
        </div>
      </header>

      <!-- Wallets -->
      <section class="cx-wallets" aria-label="สมุดบัญชี">
        <div class="cx-wallet-row">
          <button type="button" class="cx-wallet" :class="{ on: selectedBookId === 'all' }" @click="selectBook('all')">
            <span class="cx-wallet-ico">📊</span>
            <span class="cx-wallet-txt"><strong>ทุกสมุด</strong><small>{{ transactions.length }} รายการ</small></span>
          </button>
          <button
            v-for="book in books"
            :key="book.id"
            type="button"
            class="cx-wallet"
            :class="{ on: selectedBookId === book.id }"
            :style="{ '--bk': book.color || 'var(--brand)' }"
            @click="selectBook(book.id)"
          >
            <span class="cx-wallet-ico cx-wallet-ico--tint">{{ book.icon || '💼' }}</span>
            <span class="cx-wallet-txt">
              <strong>{{ book.name }}</strong>
              <small>{{ book.isDefault ? 'สมุดหลัก' : 'สมุดบัญชี' }}</small>
            </span>
          </button>
        </div>
        <div class="cx-wallet-tools">
          <button type="button" class="cx-pill" @click="openManageBooksModal">⚙ จัดการ</button>
          <button type="button" class="cx-pill cx-pill--accent" @click="openCreateBookModal">＋ สมุดใหม่</button>
        </div>
      </section>

      <p v-if="errorMessage" class="cx-alert"><span>⚠️</span>{{ errorMessage }}</p>

      <!-- Summary -->
      <section class="cx-summary">
        <article class="cx-balance">
          <div class="cx-balance-info">
            <span class="cx-eyebrow cx-eyebrow--light">คงเหลือสุทธิ</span>
            <p class="cx-balance-amt" :class="{ neg: remainingBalance < 0 }">{{ formatCurrency(remainingBalance) }}</p>
            <span class="cx-state" :class="remainingBalance >= 0 ? 'pos' : 'neg'">{{ remainingBalance >= 0 ? 'สภาพคล่องบวก' : 'ยอดติดลบ' }}</span>
            <p class="cx-balance-note">
              {{ expenseProgressText }}
              <strong v-if="overspentAmount > 0"> · เกินงบ {{ formatCurrency(overspentAmount) }}</strong>
              <template v-else> · {{ remainingProgressText }}</template>
            </p>
          </div>
          <div class="cx-gauge" :title="expenseProgressText">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" class="cx-gauge-bg" />
              <circle cx="50" cy="50" r="42" class="cx-gauge-fg" :stroke-dasharray="`${expenseProgressPercent * 2.639} 263.9`" />
            </svg>
            <div><b>{{ Math.round(expenseProgressPercent) }}%</b><small>ใช้ไป</small></div>
          </div>
        </article>

        <article class="cx-kpi cx-kpi--in">
          <div class="cx-kpi-top">
            <span class="cx-kpi-ico">↗</span>
            <span>รายรับรวม</span>
            <button v-if="incomeCategoryRankings.length > 0" type="button" @click="isIncomeRankingModalOpen = true">อันดับ</button>
          </div>
          <b>+{{ formatCurrency(totalIncome) }}</b>
          <small>{{ incomeCategoryRankings.length }} หมวดหมู่รายรับ</small>
        </article>

        <article class="cx-kpi cx-kpi--out">
          <div class="cx-kpi-top">
            <span class="cx-kpi-ico">↘</span>
            <span>รายจ่ายรวม</span>
            <button v-if="expenseCategoryRankings.length > 0" type="button" @click="isRankingModalOpen = true">อันดับ</button>
          </div>
          <b>−{{ formatCurrency(totalExpense) }}</b>
          <small>สูงสุด: {{ topExpenseCategory.name }} ({{ formatCurrency(topExpenseCategory.amount) }})</small>
        </article>
      </section>

      <!-- Tabs -->
      <nav class="cx-tabs" aria-label="Cashflow views">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="cx-tab"
          :class="{ on: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span aria-hidden="true">{{ tab.icon }}</span>
          {{ tab.id === 'analytics' ? 'รายการแยกประเภท' : tab.label }}
          <em v-if="tab.id === 'recurring' && recurringExpenses.length > 0">{{ recurringExpenses.length }}</em>
          <em v-if="tab.id === 'analytics' && transactions.length > 0">{{ transactions.length }}</em>
        </button>
      </nav>

      <!-- Overview -->
      <div v-show="activeTab === 'overview'" class="cx-pane">
        <div v-if="expenseCategoryRankings.length > 0" class="cx-grid2">
          <article class="cx-card">
            <header class="cx-card-head">
              <div><h2>รายจ่ายสูงสุด 3 อันดับ</h2><p>หมวดหมู่ที่ใช้จ่ายมากที่สุด</p></div>
              <button type="button" class="cx-pill" @click="isRankingModalOpen = true">ทั้งหมด {{ expenseCategoryRankings.length }}</button>
            </header>
            <ol class="cx-rank cx-rank--out">
              <li v-for="(cat, i) in topExpenseCategories" :key="cat.name">
                <span class="cx-rank-no">{{ i + 1 }}</span>
                <div class="cx-rank-body">
                  <div class="cx-rank-line"><strong>{{ cat.name }}</strong><b>{{ formatCurrency(cat.amount) }}</b></div>
                  <div class="cx-bar"><i :style="{ width: `${(cat.amount / (expenseCategoryRankings[0]?.amount || 1)) * 100}%` }"></i></div>
                </div>
                <em>{{ formatPercent((cat.amount / (totalExpense || 1)) * 100) }}%</em>
              </li>
            </ol>
          </article>

          <article class="cx-card">
            <header class="cx-card-head">
              <div><h2>รายจ่ายน้อยสุด 3 อันดับ</h2><p>หมวดหมู่ที่ประหยัดงบได้ดี</p></div>
            </header>
            <ol class="cx-rank cx-rank--in">
              <li v-for="(cat, i) in bottomExpenseCategories" :key="cat.name">
                <span class="cx-rank-no">{{ i + 1 }}</span>
                <div class="cx-rank-body">
                  <div class="cx-rank-line"><strong>{{ cat.name }}</strong><b>{{ formatCurrency(cat.amount) }}</b></div>
                  <div class="cx-bar"><i :style="{ width: `${(cat.amount / (bottomExpenseCategories[bottomExpenseCategories.length - 1]?.amount || 1)) * 100}%` }"></i></div>
                </div>
                <em>{{ formatPercent((cat.amount / (totalExpense || 1)) * 100) }}%</em>
              </li>
            </ol>
          </article>
        </div>
        <div v-else class="cx-empty">
          <span>📊</span>
          <strong>ยังไม่มีข้อมูลรายจ่ายให้สรุป</strong>
          <p>กด "เพิ่มรายการ" เพื่อเริ่มบันทึกรายรับ-รายจ่าย</p>
        </div>
      </div>

      <!-- Recurring -->
      <div v-show="activeTab === 'recurring'" class="cx-pane">
        <article class="cx-card">
          <header class="cx-card-head">
            <div><h2>รายจ่ายประจำ</h2><p>รายการผ่อนชำระและค่าใช้จ่ายที่ต้องจ่ายทุกเดือน</p></div>
            <button type="button" class="cx-solid" @click="openAddRecurringModal">＋ เพิ่มรายจ่ายประจำ</button>
          </header>
          <div class="cx-stats">
            <div><span>ยอดจ่ายประจำต่อเดือน</span><b>฿{{ formatCurrency(recurringTotalMonthly).replace('฿', '') }}</b></div>
            <div><span>ใกล้ครบกำหนด (ภายใน 3 วัน)</span><b :class="recurringDueSoonCount > 0 ? 'amber' : 'in'">{{ recurringDueSoonCount }} รายการ</b></div>
            <div><span>ทั้งหมดในระบบ</span><b>{{ recurringExpenses.length }} <small>(ผ่อน {{ fixedRecurringExpenses.length }} · ตลอดชีพ {{ indefiniteRecurringExpenses.length }})</small></b></div>
          </div>
        </article>

        <div v-if="isLoadingRecurring" class="cx-skel"><i v-for="i in 2" :key="i"></i></div>

        <div v-else-if="!recurringExpenses.length" class="cx-empty">
          <span>📅</span>
          <strong>ยังไม่มีรายการจ่ายประจำ</strong>
          <p>กด "+ เพิ่มรายจ่ายประจำ" เพื่อบันทึกค่าเช่า ค่างวด ค่าเน็ต หรือบริการรายเดือน ระบบจะช่วยนับถอยหลังและบันทึกอัตโนมัติ</p>
          <button type="button" class="cx-solid" @click="openAddRecurringModal">＋ เพิ่มรายการแรก</button>
        </div>

        <template v-else>
          <section
            v-for="grp in [
              { k: 'fixed', title: 'มีกำหนดระยะเวลา (งวด)', icon: '🗓️', items: fixedRecurringExpenses },
              { k: 'open', title: 'ไม่มีกำหนดสิ้นสุด', icon: '♾️', items: indefiniteRecurringExpenses },
            ]"
            v-show="grp.items.length > 0"
            :key="grp.k"
            class="cx-group"
          >
            <h3><span>{{ grp.icon }}</span>{{ grp.title }}<em>{{ grp.items.length }}</em></h3>
            <div class="cx-bills">
              <article v-for="r in grp.items" :key="r.id" class="cx-bill" @click="openEditRecurringModal(r)">
                <div class="cx-bill-main">
                  <div class="cx-ring" :class="{ late: getDueInfo(r).daysUntil <= 0 }" :style="{ '--p': getDueInfo(r).progressPercent }">
                    <span>{{ getDueInfo(r).progressPercent }}%</span>
                  </div>
                  <div class="cx-bill-title">
                    <strong>{{ r.title }}</strong>
                    <small v-if="grp.k === 'fixed'">ทุกวันที่ {{ r.dayOfMonthDue }} · {{ formatShortDate(r.startDate) }} - {{ formatShortDate(r.endDate!) }}</small>
                    <small v-else>ทุกวันที่ {{ r.dayOfMonthDue }} · เริ่ม {{ formatShortDate(r.startDate) }}</small>
                    <span v-if="selectedBookId === 'all' && getBookById(r.bookId)" class="cx-tag" :style="{ background: `${getBookById(r.bookId)?.color}22`, color: getBookById(r.bookId)?.color }">{{ getBookById(r.bookId)?.icon }} {{ getBookById(r.bookId)?.name }}</span>
                  </div>
                  <b class="cx-bill-amt">฿{{ formatCurrency(r.amount).replace('฿', '') }}</b>
                </div>
                <div class="cx-bill-foot">
                  <span class="border cx-badge" :class="getDueInfo(r).statusClass">{{ getDueInfo(r).label }}</span>
                  <span class="cx-countdown">⏱ {{ getDueInfo(r).countdownText }}</span>
                  <button type="button" class="cx-paid" :disabled="isPayingRecurringId === r.id" @click.stop="payRecurring(r)">{{ isPayingRecurringId === r.id ? '…' : '✓ จ่ายแล้ว' }}</button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </div>

      <!-- Daily -->
      <div v-show="activeTab === 'daily'" class="cx-pane">
        <article class="cx-card">
          <header class="cx-card-head">
            <div><h2>สรุปความเคลื่อนไหวรายวัน</h2><p>ยอดรับ จ่าย และคงเหลือสุทธิของแต่ละวัน</p></div>
            <div class="cx-tools">
              <input v-model="summaryFilterMonth" type="month" class="cx-field" />
              <button v-if="summaryFilterMonth" type="button" class="cx-pill" @click="summaryFilterMonth = ''">ล้าง ✕</button>
              <span class="cx-count">{{ dailySummaries.length }} วัน</span>
            </div>
          </header>
          <div v-if="dailySummaries.length > 0" class="cx-stats">
            <div><span>รับรวม</span><b class="in">+{{ formatCurrency(dailySummaryTotals.income) }}</b></div>
            <div><span>จ่ายรวม</span><b class="out">−{{ formatCurrency(dailySummaryTotals.expense) }}</b></div>
            <div><span>สุทธิ</span><b :class="dailySummaryTotals.balance >= 0 ? 'in' : 'out'">{{ dailySummaryTotals.balance >= 0 ? '+' : '' }}{{ formatCurrency(dailySummaryTotals.balance) }}</b></div>
          </div>
        </article>

        <div v-if="isLoading" class="cx-skel"><i v-for="i in 3" :key="i"></i></div>
        <div v-else-if="!dailySummaries.length" class="cx-empty">
          <span>📊</span>
          <strong>ไม่มีข้อมูลในช่วงเวลานี้</strong>
          <p>ลองเลือกเดือนอื่น หรือกด "เพิ่มรายการ" เพื่อบันทึกรายรับ-รายจ่าย</p>
        </div>
        <ul v-else class="cx-days">
          <li v-for="day in dailySummaries" :key="day.date" class="cx-day">
            <div class="cx-day-date">
              <b>{{ new Date(day.date).getDate() }}</b>
              <span>{{ new Date(day.date).toLocaleDateString('th-TH', { month: 'short' }) }}</span>
            </div>
            <div class="cx-day-name">
              <strong>{{ formatDate(day.date) }}</strong>
              <small>{{ new Date(day.date).toLocaleDateString('th-TH', { weekday: 'long' }) }}</small>
            </div>
            <div class="cx-day-fig">
              <span class="in"><small>รับ</small>+{{ formatCurrency(day.income) }}</span>
              <span class="out"><small>จ่าย</small>−{{ formatCurrency(day.expense) }}</span>
              <span class="cx-net" :class="day.balance >= 0 ? 'in' : 'out'"><small>สุทธิ</small>{{ day.balance >= 0 ? '+' : '' }}{{ formatCurrency(day.balance) }}</span>
            </div>
          </li>
        </ul>
      </div>

      <!-- Ledger -->
      <div v-show="activeTab === 'analytics'" class="cx-pane">
        <article class="cx-card">
          <header class="cx-card-head">
            <div><h2>สมุดบันทึกรายการ</h2><p>รายละเอียด ยอดยกมา และยอดสะสมตามลำดับเวลา</p></div>
            <span class="cx-count">{{ transactionPageInfo }}</span>
          </header>
          <div class="cx-tools">
            <select v-model="transactionFilterMode" class="cx-field">
              <option value="month">📅 รายเดือน</option>
              <option value="day">📆 รายวัน</option>
            </select>
            <input v-if="transactionFilterMode === 'day'" v-model="transactionFilterDate" type="date" class="cx-field" />
            <input v-if="transactionFilterMode === 'month'" v-model="transactionFilterMonth" type="month" class="cx-field" />
            <select v-model.number="transactionItemsPerPage" class="cx-field cx-push" @change="transactionCurrentPage = 1">
              <option value="10">10 วัน/หน้า</option>
              <option value="20">20 วัน/หน้า</option>
              <option value="50">50 วัน/หน้า</option>
            </select>
          </div>
        </article>

        <div v-if="!filteredTransactionsByDate.length" class="cx-empty">
          <span>🧾</span>
          <strong>ยังไม่มีรายการในช่วงเวลานี้</strong>
          <p>กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มบันทึกรายรับหรือรายจ่าย</p>
        </div>

        <div v-else class="cx-ledger">
          <section v-for="dayGroup in paginatedLedgerGroups" :key="dayGroup.date" class="cx-lg">
            <header>
              <div class="cx-lg-date">
                <strong>{{ formatDate(dayGroup.date) }}</strong>
                <small>{{ dayGroup.items.length }} รายการ · ยกมา {{ formatCurrency(dayGroup.openingBalance) }}</small>
              </div>
              <div class="cx-lg-sum">
                <span class="in">+{{ formatCurrency(dayGroup.totalIncome) }}</span>
                <span class="out">−{{ formatCurrency(dayGroup.totalExpense) }}</span>
                <b :class="dayGroup.closingBalance >= 0 ? 'in' : 'out'">ยกไป {{ formatCurrency(dayGroup.closingBalance) }}</b>
              </div>
            </header>
            <ul>
              <li v-for="item in dayGroup.items" :key="item.id" :class="item.type">
                <span class="cx-av">{{ item.type === 'income' ? '↗' : '↘' }}</span>
                <div class="cx-li-main">
                  <div class="cx-li-title">
                    <strong>{{ item.category || 'ไม่ระบุหมวดหมู่' }}</strong>
                    <span v-if="selectedBookId === 'all' && getBookById(item.book_id)" class="cx-tag" :style="{ background: `${getBookById(item.book_id)?.color}22`, color: getBookById(item.book_id)?.color }">{{ getBookById(item.book_id)?.icon }} {{ getBookById(item.book_id)?.name }}</span>
                  </div>
                  <small v-if="item.description">{{ item.description }}</small>
                </div>
                <div class="cx-li-amt">
                  <b :class="item.type === 'income' ? 'in' : 'out'">{{ item.type === 'income' ? '+' : '−' }}{{ formatCurrency(item.amount) }}</b>
                  <small>สะสม {{ formatCurrency(item.runningBalance) }}</small>
                </div>
                <div class="cx-li-tools">
                  <button type="button" title="แก้ไขรายการ" aria-label="แก้ไข" :disabled="isDeletingId === item.id" @click="openEditTransactionModal(item)">✎</button>
                  <button type="button" class="del" title="ลบรายการ" aria-label="ลบ" :disabled="isDeletingId === item.id" @click="deleteTransaction(item.id)">{{ isDeletingId === item.id ? '…' : '🗑' }}</button>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <nav v-if="transactionTotalPages > 1" class="cx-pager">
          <button type="button" :disabled="transactionCurrentPage === 1" @click="transactionCurrentPage = Math.max(1, transactionCurrentPage - 1)">← ก่อนหน้า</button>
          <div>
            <button v-for="page in transactionTotalPages" :key="page" type="button" :class="{ on: transactionCurrentPage === page }" @click="transactionCurrentPage = page">{{ page }}</button>
          </div>
          <button type="button" :disabled="transactionCurrentPage === transactionTotalPages" @click="transactionCurrentPage = Math.min(transactionTotalPages, transactionCurrentPage + 1)">ต่อไป →</button>
        </nav>
      </div>
    </div>

    <!-- Expense Ranking Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isRankingModalOpen" class="cxm-overlay" @click.self="isRankingModalOpen = false">
          <Transition name="modal">
            <div v-if="isRankingModalOpen" class="cxm cxm--out" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">📉</span>
                <div class="cxm-head-txt">
                  <h3>ลำดับรายจ่ายทุกประเภท</h3>
                  <p>{{ expenseCategoryRankings.length }} หมวดหมู่ · รวม {{ formatCurrency(totalExpense) }}</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isRankingModalOpen = false">✕</button>
              </header>
              <div class="cxm-body cxm-body--flush">
                <ol class="cxm-rank">
                  <li v-for="(cat, i) in expenseCategoryRankings" :key="cat.name">
                    <span class="cxm-rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                    <div>
                      <div class="cxm-rank-line"><strong>{{ cat.name }}</strong><b>{{ formatCurrency(cat.amount) }}</b></div>
                      <div class="cx-bar"><i :style="{ width: `${(cat.amount / (expenseCategoryRankings[0]?.amount || 1)) * 100}%` }"></i></div>
                      <small>{{ formatPercent((cat.amount / totalExpense) * 100) }}% ของรายจ่ายทั้งหมด</small>
                    </div>
                  </li>
                </ol>
              </div>
              <footer class="cxm-foot cxm-foot--between">
                <span>รายจ่ายรวมทั้งหมด</span>
                <b>{{ formatCurrency(totalExpense) }}</b>
              </footer>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Income Ranking Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isIncomeRankingModalOpen" class="cxm-overlay" @click.self="isIncomeRankingModalOpen = false">
          <Transition name="modal">
            <div v-if="isIncomeRankingModalOpen" class="cxm cxm--in" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">📈</span>
                <div class="cxm-head-txt">
                  <h3>ลำดับรายรับทุกประเภท</h3>
                  <p>{{ incomeCategoryRankings.length }} หมวดหมู่ · รวม {{ formatCurrency(totalIncome) }}</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isIncomeRankingModalOpen = false">✕</button>
              </header>
              <div class="cxm-body cxm-body--flush">
                <ol class="cxm-rank">
                  <li v-for="(cat, i) in incomeCategoryRankings" :key="cat.name">
                    <span class="cxm-rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                    <div>
                      <div class="cxm-rank-line"><strong>{{ cat.name }}</strong><b>{{ formatCurrency(cat.amount) }}</b></div>
                      <div class="cx-bar"><i :style="{ width: `${(cat.amount / (incomeCategoryRankings[0]?.amount || 1)) * 100}%` }"></i></div>
                      <small>{{ formatPercent((cat.amount / (totalIncome || 1)) * 100) }}% ของรายรับทั้งหมด</small>
                    </div>
                  </li>
                </ol>
              </div>
              <footer class="cxm-foot cxm-foot--between">
                <span>รายรับรวมทั้งหมด</span>
                <b>{{ formatCurrency(totalIncome) }}</b>
              </footer>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isEntryModalOpen" class="cxm-overlay" @click.self="isEntryModalOpen = false">
          <Transition name="modal">
            <div v-if="isEntryModalOpen" class="cxm" :class="form.type === 'income' ? 'cxm--in' : 'cxm--out'" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">{{ form.type === 'income' ? '📈' : '📉' }}</span>
                <div class="cxm-head-txt">
                  <h3>{{ modalTitle }}</h3>
                  <p>{{ modalSubtitle }}</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="() => { isEntryModalOpen = false; resetForm() }">✕</button>
              </header>

              <form class="cxm-form" @submit.prevent="submitTransaction">
                <div class="cxm-body">
                  <div class="cxm-seg" role="radiogroup" aria-label="ประเภท">
                    <button type="button" class="seg-in" :class="{ on: form.type === 'income' }" @click="form.type = 'income'">📈 รายรับ</button>
                    <button type="button" class="seg-out" :class="{ on: form.type === 'expense' }" @click="form.type = 'expense'">📉 รายจ่าย</button>
                  </div>

                  <div class="cxm-money">
                    <label for="cx-amount">จำนวนเงิน (บาท) <i>*</i> <small>รองรับ +, -, *, /</small></label>
                    <div class="cxm-money-box">
                      <span>฿</span>
                      <input
                        id="cx-amount"
                        v-model="form.amount"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00 หรือ 100+50*2"
                        @blur="evaluateAmountExpression"
                        @keydown.enter.prevent="evaluateAmountExpression"
                      >
                    </div>
                    <div v-if="calculatedAmount !== null && form.amount && !isNaN(Number(form.amount)) === false" class="cxm-calc">
                      <span>คำนวณได้</span>
                      <b>฿{{ formatCurrency(calculatedAmount).replace('฿', '') }}</b>
                      <button type="button" @click="applyCalculatedAmount">ใช้ค่านี้</button>
                    </div>
                  </div>

                  <div class="cxm-row">
                    <div class="cxm-f">
                      <label>วันที่</label>
                      <input v-model="form.entryDate" type="date" class="cxm-in">
                    </div>
                    <div v-if="books.length > 0" class="cxm-f">
                      <label>สมุดบัญชี</label>
                      <select v-model="form.bookId" class="cxm-in">
                        <option v-for="b in books" :key="b.id" :value="b.id">{{ b.icon }} {{ b.name }} {{ b.isDefault ? '(สมุดหลัก)' : '' }}</option>
                      </select>
                    </div>
                  </div>

                  <div ref="categoryComboboxRef" class="cxm-f cxm-combo">
                    <label>หมวดหมู่</label>
                    <input
                      v-model="categorySearch"
                      type="text"
                      maxlength="80"
                      placeholder="พิมพ์ค้นหาหรือสร้างหมวดหมู่ใหม่..."
                      autocomplete="off"
                      class="cxm-in"
                      @focus="isCategoryDropdownOpen = true"
                      @keydown.down.prevent="navigateCategoryOption(1)"
                      @keydown.up.prevent="navigateCategoryOption(-1)"
                      @keydown.enter.prevent="selectHighlightedCategory"
                      @keydown.escape="isCategoryDropdownOpen = false"
                    >
                    <div v-if="isCategoryDropdownOpen && (filteredCategories.length > 0 || categorySearch.trim())" class="cxm-menu">
                      <button
                        v-for="(cat, idx) in filteredCategories"
                        :key="cat"
                        type="button"
                        :class="{ hi: idx === highlightedCategoryIndex }"
                        @mousedown.prevent="selectCategory(cat)"
                      >{{ cat }}</button>
                      <button
                        v-if="categorySearch.trim() && !categoryExactMatch"
                        type="button"
                        class="new"
                        :class="{ hi: highlightedCategoryIndex === filteredCategories.length }"
                        @mousedown.prevent="selectCategory(categorySearch.trim())"
                      >➕ สร้าง "{{ categorySearch.trim() }}"</button>
                      <p v-if="filteredCategories.length === 0 && !categorySearch.trim()">พิมพ์เพื่อค้นหาหรือสร้างหมวดหมู่ใหม่</p>
                    </div>
                  </div>

                  <div class="cxm-f">
                    <label>รายละเอียด <small>(ไม่บังคับ)</small></label>
                    <textarea v-model="form.description" rows="2" maxlength="300" placeholder="บันทึกเพิ่มเติม..." class="cxm-in"></textarea>
                  </div>
                </div>

                <footer class="cxm-foot">
                  <button type="button" class="cxm-btn" @click="() => { isEntryModalOpen = false; resetForm() }">ยกเลิก</button>
                  <button type="submit" class="cxm-btn cxm-btn--main" :disabled="isSubmitting">
                    <span v-if="isSubmitting" class="cxm-spin"></span>
                    {{ submitButtonText }}
                  </button>
                </footer>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Add/Edit Recurring Expense Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isRecurringModalOpen" class="cxm-overlay" @click.self="isRecurringModalOpen = false">
          <Transition name="modal">
            <div v-if="isRecurringModalOpen" class="cxm cxm--amber" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">🔄</span>
                <div class="cxm-head-txt">
                  <h3>{{ editingRecurringId ? 'แก้ไขรายจ่ายประจำ' : 'เพิ่มรายจ่ายประจำ' }}</h3>
                  <p>กำหนดการจ่ายเงินที่ต้องทำซ้ำทุกเดือน</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isRecurringModalOpen = false">✕</button>
              </header>

              <form class="cxm-form" @submit.prevent="submitRecurring">
                <div class="cxm-body">
                  <div class="cxm-f">
                    <label>ชื่อรายการ <i>*</i></label>
                    <input v-model="recurringForm.title" type="text" placeholder="เช่น ค่าเช่าห้อง, ค่าเน็ต, ค่าน้ำค่าไฟ" required class="cxm-in" />
                  </div>

                  <div class="cxm-row">
                    <div class="cxm-f">
                      <label>จำนวนเงิน (฿) <i>*</i> <small>รองรับ +, -, *, /</small></label>
                      <input
                        v-model="recurringForm.amount"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00 หรือ 100+50"
                        required
                        class="cxm-in"
                        @blur="evaluateRecurringAmountExpression"
                        @keydown.enter.prevent="evaluateRecurringAmountExpression"
                      />
                      <div v-if="calculatedRecurringAmount !== null && recurringForm.amount && !isNaN(Number(recurringForm.amount)) === false" class="cxm-calc">
                        <span>คำนวณได้</span>
                        <b>฿{{ formatCurrency(calculatedRecurringAmount).replace('฿', '') }}</b>
                        <button type="button" @click="applyCalculatedRecurringAmount">ใช้</button>
                      </div>
                    </div>
                    <div class="cxm-f">
                      <label>กำหนดจ่ายทุกวันที่ <i>*</i></label>
                      <input v-model.number="recurringForm.dayOfMonthDue" type="number" min="1" max="31" required class="cxm-in" />
                    </div>
                  </div>

                  <div class="cxm-row">
                    <div class="cxm-f">
                      <label>หมวดหมู่</label>
                      <input v-model="recurringForm.category" type="text" placeholder="ค่าใช้จ่ายประจำ" class="cxm-in" />
                    </div>
                    <div v-if="books.length > 0" class="cxm-f">
                      <label>สมุดบัญชี</label>
                      <select v-model="recurringForm.bookId" class="cxm-in">
                        <option v-for="b in books" :key="b.id" :value="b.id">{{ b.icon }} {{ b.name }} {{ b.isDefault ? '(สมุดหลัก)' : '' }}</option>
                      </select>
                    </div>
                  </div>

                  <label class="cxm-switch">
                    <span>
                      <strong>ไม่มีกำหนดสิ้นสุด</strong>
                      <small>จ่ายต่อเนื่องไปเรื่อยๆ จนกว่าจะยกเลิก</small>
                    </span>
                    <input v-model="recurringForm.isIndefinite" type="checkbox" />
                    <i></i>
                  </label>

                  <div class="cxm-row">
                    <div class="cxm-f">
                      <label>วันที่เริ่ม</label>
                      <input v-model="recurringForm.startDate" type="date" required class="cxm-in" />
                    </div>
                    <div v-if="!recurringForm.isIndefinite" class="cxm-f">
                      <label>วันที่สิ้นสุด</label>
                      <input v-model="recurringForm.endDate" type="date" required class="cxm-in" />
                    </div>
                  </div>
                </div>

                <footer class="cxm-foot">
                  <button v-if="editingRecurringId" type="button" class="cxm-btn cxm-btn--danger" :disabled="isDeletingRecurring" @click="deleteRecurring">
                    {{ isDeletingRecurring ? 'กำลังลบ...' : 'ลบรายการ' }}
                  </button>
                  <span class="cxm-grow"></span>
                  <button type="button" class="cxm-btn" @click="isRecurringModalOpen = false">ยกเลิก</button>
                  <button type="submit" class="cxm-btn cxm-btn--main" :disabled="isSubmittingRecurring">
                    <span v-if="isSubmittingRecurring" class="cxm-spin"></span>
                    {{ editingRecurringId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ' }}
                  </button>
                </footer>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Export Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isExportModalOpen" class="cxm-overlay" @click.self="isExportModalOpen = false">
          <Transition name="modal">
            <div v-if="isExportModalOpen" class="cxm" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">📥</span>
                <div class="cxm-head-txt">
                  <h3>Export ไฟล์รายการ</h3>
                  <p>เลือกช่วงเวลาและรูปแบบไฟล์ที่ต้องการ</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isExportModalOpen = false">✕</button>
              </header>

              <div class="cxm-body">
                <div class="cxm-f">
                  <label>1. เลือกช่วงเวลาข้อมูล</label>
                  <div class="cxm-seg cxm-seg--3">
                    <button type="button" :class="{ on: exportScope === 'month' }" @click="exportScope = 'month'">📅 รายเดือน</button>
                    <button type="button" :class="{ on: exportScope === 'year' }" @click="exportScope = 'year'">📆 รายปี</button>
                    <button type="button" :class="{ on: exportScope === 'all' }" @click="exportScope = 'all'">📂 ทั้งหมด</button>
                  </div>
                </div>

                <div v-if="exportScope === 'month'" class="cxm-f">
                  <label>เลือกเดือนที่ต้องการ Export</label>
                  <input v-model="exportMonth" type="month" class="cxm-in" />
                </div>
                <div v-else-if="exportScope === 'year'" class="cxm-f">
                  <label>เลือกปีที่ต้องการ Export</label>
                  <select v-model="exportYear" class="cxm-in">
                    <option v-for="y in availableYears" :key="y" :value="y">ปี พ.ศ. {{ Number(y) + 543 }} (ค.ศ. {{ y }})</option>
                  </select>
                </div>
                <p v-else class="cxm-note">ℹ️ ระบบจะส่งออกรายการบัญชีทั้งหมดในระบบ ({{ transactions.length }} รายการ)</p>

                <div class="cxm-sum">
                  <div class="cxm-sum-top">
                    <strong>{{ exportPeriodLabel }}</strong>
                    <span :class="{ empty: exportTransactions.length === 0 }">{{ exportTransactions.length }} รายการ</span>
                  </div>
                  <div class="cxm-sum-grid">
                    <div><small>รายรับรวม</small><b class="in">+{{ formatCurrency(exportTotalIncome) }}</b></div>
                    <div><small>รายจ่ายรวม</small><b class="out">−{{ formatCurrency(exportTotalExpense) }}</b></div>
                    <div><small>คงเหลือสุทธิ</small><b :class="exportNetBalance >= 0 ? 'in' : 'out'">{{ formatCurrency(exportNetBalance) }}</b></div>
                  </div>
                </div>

                <div class="cxm-f">
                  <label>2. ดาวน์โหลดรูปแบบไฟล์</label>
                  <div class="cxm-files">
                    <button type="button" class="file-pdf" :disabled="isExporting || exportTransactions.length === 0" @click="exportToPDF">
                      <span>PDF</span>
                      <div><strong>รายงาน PDF (.pdf)</strong><small>ภาษาไทยคมชัด ตารางสวยงามพร้อมสรุปยอด</small></div>
                      <em><i v-if="isExporting" class="cxm-spin"></i>โหลด</em>
                    </button>
                    <button type="button" class="file-xls" :disabled="isExporting || exportTransactions.length === 0" @click="exportToExcel">
                      <span>XLS</span>
                      <div><strong>Excel (.xlsx)</strong><small>ไฟล์สเปรดชีตพร้อมตารางและสรุปผล</small></div>
                      <em><i v-if="isExporting" class="cxm-spin"></i>โหลด</em>
                    </button>
                    <button type="button" class="file-csv" :disabled="isExporting || exportTransactions.length === 0" @click="exportToCSV">
                      <span>CSV</span>
                      <div><strong>CSV (.csv)</strong><small>UTF-8 with BOM รองรับ Excel/Sheets</small></div>
                      <em><i v-if="isExporting" class="cxm-spin"></i>โหลด</em>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Manage Books Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isManageBooksModalOpen" class="cxm-overlay" @click.self="isManageBooksModalOpen = false">
          <Transition name="modal">
            <div v-if="isManageBooksModalOpen" class="cxm" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">📚</span>
                <div class="cxm-head-txt">
                  <h3>จัดการสมุดบัญชี</h3>
                  <p>แยกกระเป๋าเงินและสมุดรายรับ-รายจ่ายตามการใช้งาน</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isManageBooksModalOpen = false">✕</button>
              </header>

              <div class="cxm-body">
                <div class="cxm-bar">
                  <span>สมุดทั้งหมด {{ books.length }} เล่ม</span>
                  <button type="button" class="cxm-btn cxm-btn--main cxm-btn--sm" @click="openCreateBookModal">＋ เพิ่มสมุดใหม่</button>
                </div>

                <ul class="cxm-books">
                  <li v-for="b in books" :key="b.id" :style="{ '--bk': b.color || 'var(--brand)' }">
                    <span class="cxm-book-ico">{{ b.icon || '💼' }}</span>
                    <div>
                      <strong>{{ b.name }}<em v-if="b.isDefault">สมุดหลัก</em></strong>
                      <small>สร้างเมื่อ {{ formatDate(b.createdAt) }}</small>
                    </div>
                    <div class="cxm-book-tools">
                      <button type="button" class="cxm-btn cxm-btn--sm" @click="openEditBookModal(b)">แก้ไข</button>
                      <button v-if="books.length > 1" type="button" class="cxm-btn cxm-btn--danger cxm-btn--sm" @click="handleDeleteBook(b)">ลบ</button>
                    </div>
                  </li>
                </ul>

                <p class="cxm-note">💡 สมุดบัญชีช่วยแยกประวัติรายรับ-รายจ่าย เช่น การใช้จ่ายส่วนตัว และ ธุรกิจ/งานฟรีแลนซ์ หากลบสมุด รายการข้างในจะถูกย้ายไปยังสมุดหลักโดยอัตโนมัติ</p>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Create/Edit Book Form Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="isBookFormModalOpen" class="cxm-overlay cxm-overlay--top" @click.self="isBookFormModalOpen = false">
          <Transition name="modal">
            <div v-if="isBookFormModalOpen" class="cxm cxm--book" :style="{ '--ac': bookForm.color }" role="dialog" aria-modal="true">
              <header class="cxm-head">
                <span class="cxm-badge">{{ bookForm.icon }}</span>
                <div class="cxm-head-txt">
                  <h3>{{ editingBookId ? 'แก้ไขสมุดบัญชี' : 'เพิ่มสมุดบัญชีใหม่' }}</h3>
                  <p>กำหนดชื่อ ไอคอน และสีประจำสมุด</p>
                </div>
                <button type="button" class="cxm-x" aria-label="ปิด" @click="isBookFormModalOpen = false">✕</button>
              </header>

              <form class="cxm-form" @submit.prevent="submitBookForm">
                <div class="cxm-body">
                  <div class="cxm-f">
                    <label>ชื่อสมุดบัญชี <i>*</i></label>
                    <input v-model="bookForm.name" type="text" placeholder="เช่น สมุดส่วนตัว, งานฟรีแลนซ์, ท่องเที่ยว" required maxlength="50" class="cxm-in" />
                  </div>

                  <div class="cxm-f">
                    <label>ไอคอนประจำสมุด</label>
                    <div class="cxm-icons">
                      <button v-for="icon in BOOK_ICON_PRESETS" :key="icon" type="button" :class="{ on: bookForm.icon === icon }" @click="bookForm.icon = icon">{{ icon }}</button>
                    </div>
                  </div>

                  <div class="cxm-f">
                    <label>สีประจำสมุด</label>
                    <div class="cxm-colors">
                      <button
                        v-for="color in BOOK_COLOR_PRESETS"
                        :key="color"
                        type="button"
                        :class="{ on: bookForm.color === color }"
                        :style="{ backgroundColor: color }"
                        :aria-label="color"
                        @click="bookForm.color = color"
                      >{{ bookForm.color === color ? '✓' : '' }}</button>
                    </div>
                  </div>

                  <label class="cxm-switch">
                    <span>
                      <strong>ตั้งเป็นสมุดหลัก (Default)</strong>
                      <small>เมื่อบันทึกรายการใหม่จะเลือกสมุดนี้เป็นค่าเริ่มต้น</small>
                    </span>
                    <input v-model="bookForm.isDefault" type="checkbox" />
                    <i></i>
                  </label>
                </div>

                <footer class="cxm-foot">
                  <button type="button" class="cxm-btn" @click="isBookFormModalOpen = false">ยกเลิก</button>
                  <button type="submit" class="cxm-btn cxm-btn--main" :disabled="isSubmittingBook">
                    <span v-if="isSubmittingBook" class="cxm-spin"></span>
                    {{ editingBookId ? 'บันทึกการแก้ไข' : 'สร้างสมุด' }}
                  </button>
                </footer>
              </form>
            </div>
          </Transition>
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
.cx { width: 100%; max-width: 1240px; min-width: 0; box-sizing: border-box; margin: 0 auto; padding: 24px 18px 96px; display: flex; flex-direction: column; gap: 18px; color: var(--text-primary); }
.cx *, .cx *::before, .cx *::after { box-sizing: border-box; }
.cx :is(h1, h2, h3, p, ol, ul) { margin: 0; }
.cx :is(ol, ul) { padding: 0; list-style: none; }
.cx .in { color: var(--ink-emerald); }
.cx .out { color: var(--ink-rose); }
.cx .amber { color: var(--ink-amber); }
.cx button { cursor: pointer; font-family: inherit; }
.cx button:disabled { opacity: .45; cursor: not-allowed; }

/* ───── header ───── */
.cx-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; min-width: 0; }
.cx-head-title { min-width: 0; }
.cx-head h1 { font-size: 32px; font-weight: 800; letter-spacing: -.035em; line-height: 1.1; margin-top: 4px; }
.cx-head-title p { margin-top: 6px; font-size: 13px; color: var(--text-muted); }
.cx-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--brand-ink); }
.cx-eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 22%, transparent); }
.cx-eyebrow--light { color: #c7d2fe; }
.cx-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.cx-ghost, .cx-solid { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 999px; font-size: 13px; font-weight: 700; transition: transform .15s, background .15s, box-shadow .15s; }
.cx-ghost { border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); }
.cx-ghost:not(:disabled):hover { background: var(--bg-elevated); color: var(--text-primary); }
.cx-solid { border: 0; color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-2)); box-shadow: 0 8px 22px -8px var(--brand); }
.cx-solid:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 12px 26px -8px var(--brand); }
.cx-spin { display: inline-block; animation: cx-rot 1s linear infinite; }
@keyframes cx-rot { to { transform: rotate(360deg); } }

/* ───── wallets ───── */
.cx-wallets { display: flex; align-items: center; gap: 12px; }
.cx-wallet-row { flex: 1; min-width: 0; display: flex; gap: 10px; overflow-x: auto; padding: 4px 2px 8px; scrollbar-width: none; }
.cx-wallet-row::-webkit-scrollbar { display: none; }
.cx-wallet { --bk: var(--brand); flex-shrink: 0; display: flex; align-items: center; gap: 10px; min-width: 150px; padding: 10px 16px 10px 10px; border-radius: 16px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); text-align: left; transition: transform .15s, border-color .15s, box-shadow .15s; }
.cx-wallet:hover { transform: translateY(-1px); border-color: var(--border-default); }
.cx-wallet.on { border-color: var(--bk); background: color-mix(in srgb, var(--bk) 12%, var(--bg-card)); color: var(--text-primary); box-shadow: 0 10px 24px -14px var(--bk); }
.cx-wallet-ico { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--bg-elevated); font-size: 18px; }
.cx-wallet-ico--tint { background: color-mix(in srgb, var(--bk) 20%, transparent); }
.cx-wallet-txt { display: flex; flex-direction: column; min-width: 0; }
.cx-wallet-txt strong { font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.cx-wallet-txt small { font-size: 11px; color: var(--text-muted); }
.cx-wallet-tools { display: flex; gap: 6px; flex-shrink: 0; }
.cx-pill { height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); font-size: 12px; font-weight: 700; white-space: nowrap; }
.cx-pill:hover { color: var(--text-primary); background: var(--bg-elevated); }
.cx-pill--accent { background: var(--brand-soft); border-color: var(--brand-border); color: var(--brand-ink); }

.cx-alert { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--ink-amber) 40%, transparent); background: color-mix(in srgb, var(--ink-amber) 10%, transparent); color: var(--ink-amber); font-size: 13px; font-weight: 600; }

/* ───── summary ───── */
.cx-summary { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr); gap: 14px; min-width: 0; }
.cx-balance { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 26px; border-radius: 26px; color: #fff; background: linear-gradient(135deg, #1e3a8a, #312e81); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .08), 0 24px 50px -28px #1e3a8a; }
.cx-balance::before, .cx-balance::after { content: ''; position: absolute; border-radius: 50%; background: rgba(255, 255, 255, .05); pointer-events: none; }
.cx-balance::before { width: 220px; height: 220px; right: -60px; top: -90px; }
.cx-balance::after { width: 140px; height: 140px; left: 38%; bottom: -80px; }
.cx-balance-info { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; }
.cx-balance-amt { font-size: 38px; font-weight: 800; letter-spacing: -.035em; line-height: 1.05; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.cx-balance-amt.neg { color: #ffd1d6; }
.cx-state { padding: 3px 12px; border-radius: 99px; background: rgba(255, 255, 255, .12); color: #e0e7ff; font-size: 11px; font-weight: 800; backdrop-filter: blur(4px); }
.cx-balance-note { font-size: 12px; color: #c7d2fe; }
.cx-gauge { position: relative; z-index: 1; width: 104px; height: 104px; flex-shrink: 0; }
.cx-gauge svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.cx-gauge circle { fill: none; stroke-width: 9; }
.cx-gauge-bg { stroke: rgba(255, 255, 255, .12); }
.cx-gauge-fg { stroke: #fff; stroke-linecap: round; transition: stroke-dasharray .6s; }
.cx-gauge > div { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cx-gauge b { font-size: 20px; font-weight: 800; line-height: 1; }
.cx-gauge small { font-size: 10px; opacity: .8; margin-top: 2px; }

.cx-kpi { min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 20px; border-radius: 22px; background: var(--bg-card); border: 1px solid var(--border-subtle); }
.cx-kpi-top { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.cx-kpi-top button { margin-left: auto; height: 26px; padding: 0 11px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-secondary); font-size: 11px; font-weight: 700; }
.cx-kpi-ico { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 10px; font-size: 15px; font-weight: 800; }
.cx-kpi--in .cx-kpi-ico { background: color-mix(in srgb, var(--ink-emerald) 16%, transparent); color: var(--ink-emerald); }
.cx-kpi--out .cx-kpi-ico { background: color-mix(in srgb, var(--ink-rose) 16%, transparent); color: var(--ink-rose); }
.cx-kpi > b { font-size: 24px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.cx-kpi--in > b { color: var(--ink-emerald); }
.cx-kpi--out > b { color: var(--ink-rose); }
.cx-kpi > small { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ───── tabs ───── */
.cx-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--bg-elevated); overflow-x: auto; scrollbar-width: none; align-self: flex-start; max-width: 100%; }
.cx-tabs::-webkit-scrollbar { display: none; }
.cx-tab { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; border-radius: 999px; border: 0; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 700; transition: background .15s, color .15s; }
.cx-tab:hover { color: var(--text-primary); }
.cx-tab.on { background: var(--bg-card); color: var(--brand-ink); box-shadow: 0 2px 10px rgba(0, 0, 0, .12); }
.cx-tab em { font-style: normal; min-width: 20px; padding: 1px 7px; border-radius: 99px; background: var(--brand-soft); color: var(--brand-ink); font-size: 10px; font-weight: 800; text-align: center; }
.cx-pane { display: flex; flex-direction: column; gap: 14px; }

/* ───── shared ───── */
.cx-grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; min-width: 0; }
.cx-card { min-width: 0; display: flex; flex-direction: column; gap: 16px; padding: 20px; border-radius: 22px; background: var(--bg-card); border: 1px solid var(--border-subtle); }
.cx-card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.cx-card-head h2 { font-size: 16px; font-weight: 800; letter-spacing: -.01em; }
.cx-card-head p { margin-top: 2px; font-size: 12px; color: var(--text-muted); }
.cx-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cx-field { height: 38px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-primary); font-size: 13px; }
.cx-field:focus { outline: 2px solid color-mix(in srgb, var(--brand) 35%, transparent); border-color: var(--brand); }
.cx-push { margin-left: auto; }
.cx-count { padding: 5px 12px; border-radius: 99px; background: var(--bg-elevated); font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.cx-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cx-stats > div { padding: 14px 16px; border-radius: 16px; background: var(--bg-elevated); }
.cx-stats span { display: block; font-size: 11px; color: var(--text-muted); }
.cx-stats b { display: block; margin-top: 4px; font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cx-stats b small { font-size: 11px; font-weight: 600; color: var(--text-muted); }
.cx-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 52px 20px; text-align: center; border-radius: 22px; border: 1px dashed var(--border-default); background: color-mix(in srgb, var(--bg-card) 60%, transparent); }
.cx-empty > span { font-size: 38px; }
.cx-empty p { max-width: 420px; font-size: 12px; color: var(--text-muted); }
.cx-skel { display: grid; gap: 10px; }
.cx-skel i { height: 76px; border-radius: 18px; background: var(--bg-elevated); animation: cx-pulse 1.2s ease-in-out infinite; }
@keyframes cx-pulse { 50% { opacity: .5; } }
.cx-bar { height: 7px; border-radius: 99px; overflow: hidden; background: var(--bg-elevated); }
.cx-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ink-rose), color-mix(in srgb, var(--ink-rose) 60%, var(--ink-amber))); transition: width .5s; }
.cx-tag { display: inline-flex; padding: 1px 9px; border-radius: 99px; font-size: 10px; font-weight: 700; }

/* ───── ranking ───── */
.cx-rank { display: flex; flex-direction: column; gap: 14px; }
.cx-rank li { display: flex; align-items: center; gap: 12px; }
.cx-rank-no { width: 30px; height: 30px; flex-shrink: 0; display: grid; place-items: center; border-radius: 10px; background: color-mix(in srgb, var(--ink-rose) 16%, transparent); color: var(--ink-rose); font-size: 13px; font-weight: 800; }
.cx-rank--in .cx-rank-no { background: color-mix(in srgb, var(--ink-emerald) 16%, transparent); color: var(--ink-emerald); }
.cx-rank--in .cx-bar i { background: linear-gradient(90deg, var(--ink-emerald), color-mix(in srgb, var(--ink-emerald) 60%, var(--ink-sky))); }
.cx-rank-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.cx-rank-line { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
.cx-rank-line strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cx-rank-line b { font-variant-numeric: tabular-nums; }
.cx-rank li > em { font-style: normal; width: 44px; text-align: right; font-size: 12px; font-weight: 700; color: var(--text-muted); }

/* ───── recurring ───── */
.cx-group { display: flex; flex-direction: column; gap: 12px; }
.cx-group h3 { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: var(--text-secondary); }
.cx-group h3 em { font-style: normal; padding: 1px 9px; border-radius: 99px; background: var(--bg-elevated); font-size: 11px; }
.cx-bills { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
.cx-bill { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 22px; background: var(--bg-card); border: 1px solid var(--border-subtle); cursor: pointer; transition: transform .15s, border-color .15s; }
.cx-bill:hover { transform: translateY(-2px); border-color: var(--border-default); }
.cx-bill-main { display: flex; align-items: center; gap: 14px; }
.cx-ring { --p: 0; --c: var(--ink-amber); width: 52px; height: 52px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; background: conic-gradient(var(--c) calc(var(--p) * 1%), var(--bg-elevated) 0); position: relative; }
.cx-ring.late { --c: var(--ink-rose); }
.cx-ring::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: var(--bg-card); }
.cx-ring span { position: relative; font-size: 11px; font-weight: 800; }
.cx-bill-title { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.cx-bill-title strong { font-size: 15px; overflow-wrap: anywhere; }
.cx-bill-title small { font-size: 11px; color: var(--text-muted); }
.cx-bill-amt { font-size: 18px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.cx-bill-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px dashed var(--border-subtle); }
.cx-badge { padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; }
.cx-countdown { flex: 1; font-size: 11px; font-weight: 700; color: var(--ink-amber); }
.cx-paid { height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--ink-emerald) 38%, transparent); background: color-mix(in srgb, var(--ink-emerald) 14%, transparent); color: var(--ink-emerald); font-size: 12px; font-weight: 800; }
.cx-paid:not(:disabled):hover { background: var(--ink-emerald); color: #fff; }

/* ───── daily ───── */
.cx-days { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.cx-day { display: grid; grid-template-columns: 54px 1fr; gap: 10px 14px; padding: 14px; border-radius: 22px; background: var(--bg-card); border: 1px solid var(--border-subtle); }
.cx-day-date { grid-row: span 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 0; border-radius: 16px; background: var(--brand-soft); color: var(--brand-ink); }
.cx-day-date b { font-size: 22px; line-height: 1; }
.cx-day-date span { font-size: 10px; margin-top: 2px; }
.cx-day-name { display: flex; flex-direction: column; justify-content: center; }
.cx-day-name strong { font-size: 14px; }
.cx-day-name small { font-size: 11px; color: var(--text-muted); }
.cx-day-fig { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.cx-day-fig span { display: flex; flex-direction: column; padding: 8px 10px; border-radius: 12px; background: var(--bg-elevated); font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; }
.cx-day-fig small { font-size: 10px; font-weight: 600; color: var(--text-muted); }

/* ───── ledger ───── */
.cx-ledger { display: flex; flex-direction: column; gap: 14px; }
.cx-lg { border-radius: 22px; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border-subtle); }
.cx-lg > header { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding: 14px 18px; background: var(--bg-elevated); }
.cx-lg-date { display: flex; flex-direction: column; }
.cx-lg-date strong { font-size: 14px; }
.cx-lg-date small { font-size: 11px; color: var(--text-muted); }
.cx-lg-sum { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.cx-lg li { display: flex; align-items: center; gap: 14px; padding: 13px 18px; border-top: 1px solid var(--border-subtle); transition: background .15s; }
.cx-lg li:first-child { border-top: 0; }
.cx-lg li:hover { background: color-mix(in srgb, var(--bg-elevated) 55%, transparent); }
.cx-av { width: 36px; height: 36px; flex-shrink: 0; display: grid; place-items: center; border-radius: 12px; font-size: 16px; font-weight: 800; background: color-mix(in srgb, var(--ink-rose) 15%, transparent); color: var(--ink-rose); }
.cx-lg li.income .cx-av { background: color-mix(in srgb, var(--ink-emerald) 15%, transparent); color: var(--ink-emerald); }
.cx-li-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cx-li-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cx-li-title strong { font-size: 14px; }
.cx-li-main small, .cx-li-amt small { font-size: 11px; color: var(--text-muted); }
.cx-li-amt { display: flex; flex-direction: column; align-items: flex-end; }
.cx-li-amt b { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cx-li-tools { display: flex; gap: 4px; }
.cx-li-tools button { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-secondary); font-size: 13px; }
.cx-li-tools button:not(:disabled):hover { color: var(--text-primary); border-color: var(--border-default); }
.cx-li-tools .del { color: var(--ink-rose); }
.cx-pager { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; }
.cx-pager > div { display: flex; gap: 4px; overflow-x: auto; }
.cx-pager button { min-width: 36px; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; font-weight: 700; }
.cx-pager button.on { background: var(--brand); border-color: var(--brand); color: #fff; }

@media (max-width: 960px) {
  .cx-summary { grid-template-columns: 1fr 1fr; }
  .cx-balance { grid-column: 1 / -1; }
  .cx-grid2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .cx { padding: 16px 12px 88px; }
  .cx-head h1 { font-size: 26px; }
  .cx-head-actions { width: 100%; }
  .cx-lbl { display: none; }
  .cx-ghost { padding: 0 13px; }
  .cx-solid { flex: 1; justify-content: center; }
  .cx-wallets { flex-direction: column; align-items: stretch; }
  .cx-wallet-tools { justify-content: flex-end; }
  .cx-summary { grid-template-columns: 1fr; }
  .cx-balance { min-width: 0; padding: 20px; }
  .cx-balance-amt { font-size: 30px; }
  .cx-balance-note { overflow-wrap: anywhere; }
  .cx-gauge { width: 84px; height: 84px; }
  .cx-stats { grid-template-columns: 1fr; }
  .cx-bills, .cx-days { grid-template-columns: 1fr; }
  .cx-tabs { border-radius: 18px; }
  .cx-li-tools { flex-direction: column; }
  .cx-lg li { min-width: 0; gap: 10px; padding: 12px; }
  .cx-li-amt { min-width: 0; }
}

/* ───── modals (teleported → :global) ───── */
:global(.cxm-overlay) { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(3, 5, 12, .62); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
:global(.cxm-overlay--top) { z-index: 70; }
:global(.cxm) { --ac: var(--brand); position: relative; width: 100%; max-width: 480px; max-height: min(88vh, 760px); display: flex; flex-direction: column; overflow: hidden; border-radius: 28px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-primary); box-shadow: 0 40px 100px -20px rgba(0, 0, 0, .55); }
:global(.cxm--in) { --ac: var(--ink-emerald); }
:global(.cxm--out) { --ac: var(--ink-rose); }
:global(.cxm--amber) { --ac: var(--ink-amber); }
:global(.cxm-head) { position: relative; display: flex; align-items: center; gap: 14px; padding: 20px 22px 18px; background: linear-gradient(160deg, color-mix(in srgb, var(--ac) 20%, transparent), transparent 75%); }
:global(.cxm-badge) { width: 46px; height: 46px; flex-shrink: 0; display: grid; place-items: center; border-radius: 16px; font-size: 22px; background: color-mix(in srgb, var(--ac) 22%, var(--bg-card)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ac) 40%, transparent); }
:global(.cxm-head-txt) { flex: 1; min-width: 0; }
:global(.cxm-head-txt h3) { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -.01em; }
:global(.cxm-head-txt p) { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }
:global(.cxm-x) { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; border: 0; background: var(--bg-elevated); color: var(--text-secondary); font-size: 13px; cursor: pointer; }
:global(.cxm-x:hover) { color: var(--text-primary); background: var(--bg-surface, var(--bg-elevated)); }
:global(.cxm-form) { display: flex; flex-direction: column; min-height: 0; flex: 1; }
:global(.cxm-body) { display: flex; flex-direction: column; gap: 16px; padding: 4px 22px 20px; overflow-y: auto; flex: 1; min-height: 0; }
:global(.cxm-body--flush) { padding: 0 0 6px; gap: 0; }
:global(.cxm-foot) { display: flex; align-items: center; gap: 10px; padding: 14px 22px; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
:global(.cxm-foot--between) { justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
:global(.cxm-foot--between b) { font-size: 16px; font-weight: 800; color: var(--ac); }
:global(.cxm-grow) { flex: 1; }
:global(.cxm-btn) { height: 42px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 999px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; transition: transform .15s, background .15s; }
:global(.cxm-btn:hover) { color: var(--text-primary); }
:global(.cxm-btn--main) { border: 0; color: #fff; background: linear-gradient(135deg, var(--ac), color-mix(in srgb, var(--ac) 60%, var(--brand-2))); box-shadow: 0 8px 20px -8px var(--ac); }
:global(.cxm-btn--main:hover) { color: #fff; }
:global(.cxm-form .cxm-foot .cxm-btn--main) { flex: 1; }
:global(.cxm-btn--danger) { border-color: color-mix(in srgb, var(--ink-rose) 40%, transparent); background: color-mix(in srgb, var(--ink-rose) 12%, transparent); color: var(--ink-rose); }
:global(.cxm-btn--danger:hover) { color: var(--ink-rose); }
:global(.cxm-btn--sm) { height: 32px; padding: 0 14px; font-size: 12px; }
:global(.cxm-btn:disabled) { opacity: .5; cursor: not-allowed; }
:global(.cxm-spin) { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .4); border-top-color: #fff; animation: cx-rot .8s linear infinite; }

:global(.cxm-row) { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
:global(.cxm-f) { position: relative; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
:global(.cxm-f > label) { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
:global(.cxm-f label i), :global(.cxm-money label i) { font-style: normal; color: var(--ink-rose); }
:global(.cxm-f label small), :global(.cxm-money label small) { font-weight: 500; font-size: 10px; color: var(--text-muted); margin-left: 4px; }
:global(.cxm-in) { width: 100%; padding: 11px 14px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; font-family: inherit; outline: none; transition: border-color .15s, box-shadow .15s; }
:global(.cxm-in:focus) { border-color: var(--ac); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ac) 22%, transparent); }
:global(textarea.cxm-in) { resize: none; }

:global(.cxm-seg) { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 16px; background: var(--bg-elevated); }
:global(.cxm-seg--3) { grid-template-columns: repeat(3, 1fr); }
:global(.cxm-seg button) { height: 40px; border-radius: 12px; border: 0; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background .15s, color .15s; }
:global(.cxm-seg button.on) { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0, 0, 0, .18); }
:global(.cxm-seg button.seg-in.on) { background: var(--ink-emerald); color: #fff; }
:global(.cxm-seg button.seg-out.on) { background: var(--ink-rose); color: #fff; }
:global(.cxm-seg--3 button.on) { background: var(--brand); color: #fff; }

:global(.cxm-money) { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 20px; background: color-mix(in srgb, var(--ac) 9%, var(--bg-elevated)); border: 1px solid color-mix(in srgb, var(--ac) 25%, transparent); }
:global(.cxm-money > label) { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
:global(.cxm-money-box) { display: flex; align-items: center; gap: 8px; }
:global(.cxm-money-box span) { font-size: 28px; font-weight: 800; color: var(--ac); }
:global(.cxm-money-box input) { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary); font-size: 28px; font-weight: 800; font-family: inherit; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
:global(.cxm-money-box input::placeholder) { font-size: 18px; font-weight: 500; color: var(--text-muted); }
:global(.cxm-calc) { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
:global(.cxm-calc b) { color: var(--ac); font-size: 14px; }
:global(.cxm-calc button) { height: 24px; padding: 0 10px; border-radius: 99px; border: 0; background: color-mix(in srgb, var(--ac) 22%, transparent); color: var(--ac); font-size: 11px; font-weight: 800; cursor: pointer; }

:global(.cxm-menu) { position: absolute; left: 0; right: 0; top: 100%; margin-top: 6px; z-index: 30; max-height: 200px; overflow-y: auto; padding: 6px; border-radius: 16px; border: 1px solid var(--border-default); background: var(--bg-card); box-shadow: 0 18px 40px -10px rgba(0, 0, 0, .45); }
:global(.cxm-menu button) { display: block; width: 100%; padding: 9px 12px; border: 0; border-radius: 10px; background: transparent; color: var(--text-secondary); font-size: 13px; text-align: left; font-family: inherit; cursor: pointer; }
:global(.cxm-menu button.hi), :global(.cxm-menu button:hover) { background: color-mix(in srgb, var(--ac) 18%, transparent); color: var(--text-primary); }
:global(.cxm-menu button.new) { color: var(--ac); }
:global(.cxm-menu p) { margin: 0; padding: 10px; font-size: 12px; text-align: center; color: var(--text-muted); }

:global(.cxm-switch) { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border-radius: 18px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); cursor: pointer; }
:global(.cxm-switch span) { display: flex; flex-direction: column; gap: 2px; }
:global(.cxm-switch strong) { font-size: 13px; }
:global(.cxm-switch small) { font-size: 11px; color: var(--text-muted); }
:global(.cxm-switch input) { position: absolute; opacity: 0; pointer-events: none; }
:global(.cxm-switch i) { position: relative; width: 44px; height: 26px; flex-shrink: 0; border-radius: 99px; background: var(--border-default); transition: background .2s; }
:global(.cxm-switch i::after) { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, .3); transition: transform .2s; }
:global(.cxm-switch input:checked + i) { background: var(--ac); }
:global(.cxm-switch input:checked + i::after) { transform: translateX(18px); }
:global(.cxm-switch input:focus-visible + i) { outline: 2px solid var(--ac); outline-offset: 2px; }

:global(.cxm-note) { margin: 0; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--ink-sky) 10%, transparent); color: var(--text-secondary); font-size: 12px; line-height: 1.6; }

:global(.cxm-rank) { margin: 0; padding: 0; list-style: none; }
:global(.cxm-rank li) { display: flex; gap: 14px; padding: 14px 22px; border-top: 1px solid var(--border-subtle); }
:global(.cxm-rank li:first-child) { border-top: 0; }
:global(.cxm-rank li > div) { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
:global(.cxm-rank-no) { width: 30px; height: 30px; flex-shrink: 0; display: grid; place-items: center; border-radius: 10px; background: var(--bg-elevated); color: var(--text-muted); font-size: 13px; font-weight: 800; }
:global(.cxm-rank-no.top) { background: color-mix(in srgb, var(--ac) 20%, transparent); color: var(--ac); }
:global(.cxm-rank-line) { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; }
:global(.cxm-rank-line strong) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:global(.cxm-rank-line b) { color: var(--ac); font-variant-numeric: tabular-nums; }
:global(.cxm-rank small) { font-size: 11px; color: var(--text-muted); }
:global(.cxm--in .cx-bar i) { background: linear-gradient(90deg, var(--ink-emerald), color-mix(in srgb, var(--ink-emerald) 60%, var(--ink-sky))); }
:global(.cxm .cx-bar) { height: 7px; border-radius: 99px; overflow: hidden; background: var(--bg-elevated); }
:global(.cxm .cx-bar i) { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ink-rose), color-mix(in srgb, var(--ink-rose) 60%, var(--ink-amber))); }
:global(.cxm--in .cx-bar i) { background: linear-gradient(90deg, var(--ink-emerald), color-mix(in srgb, var(--ink-emerald) 60%, var(--ink-sky))); }

:global(.cxm-sum) { padding: 14px 16px; border-radius: 18px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 12px; }
:global(.cxm-sum-top) { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; }
:global(.cxm-sum-top span) { padding: 2px 10px; border-radius: 99px; background: var(--brand-soft); color: var(--brand-ink); font-size: 11px; font-weight: 800; flex-shrink: 0; }
:global(.cxm-sum-top span.empty) { background: color-mix(in srgb, var(--ink-rose) 15%, transparent); color: var(--ink-rose); }
:global(.cxm-sum-grid) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; padding-top: 12px; border-top: 1px dashed var(--border-default); }
:global(.cxm-sum-grid small) { display: block; font-size: 10px; color: var(--text-muted); }
:global(.cxm-sum-grid b) { display: block; margin-top: 2px; font-size: 12px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; }
:global(.cxm-sum .in) { color: var(--ink-emerald); }
:global(.cxm-sum .out) { color: var(--ink-rose); }

:global(.cxm-files) { display: flex; flex-direction: column; gap: 8px; }
:global(.cxm-files button) { --fc: var(--brand); display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border-radius: 18px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-primary); text-align: left; font-family: inherit; cursor: pointer; transition: border-color .15s, transform .15s; }
:global(.cxm-files button:not(:disabled):hover) { border-color: var(--fc); transform: translateY(-1px); }
:global(.cxm-files button:disabled) { opacity: .5; cursor: not-allowed; }
:global(.cxm-files .file-pdf) { --fc: var(--ink-rose); }
:global(.cxm-files .file-xls) { --fc: var(--ink-emerald); }
:global(.cxm-files .file-csv) { --fc: var(--ink-sky); }
:global(.cxm-files button > span) { width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; border-radius: 14px; background: color-mix(in srgb, var(--fc) 16%, transparent); color: var(--fc); font-size: 11px; font-weight: 800; }
:global(.cxm-files button > div) { flex: 1; min-width: 0; display: flex; flex-direction: column; }
:global(.cxm-files strong) { font-size: 13px; }
:global(.cxm-files small) { font-size: 11px; color: var(--text-muted); }
:global(.cxm-files em) { display: inline-flex; align-items: center; gap: 6px; font-style: normal; padding: 6px 14px; border-radius: 99px; background: var(--fc); color: #fff; font-size: 12px; font-weight: 800; flex-shrink: 0; }

:global(.cxm-bar) { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
:global(.cxm-books) { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
:global(.cxm-books li) { --bk: var(--brand); display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); }
:global(.cxm-books li > div:nth-child(2)) { flex: 1; min-width: 0; display: flex; flex-direction: column; }
:global(.cxm-books strong) { display: flex; align-items: center; gap: 8px; font-size: 14px; }
:global(.cxm-books em) { font-style: normal; padding: 1px 8px; border-radius: 99px; background: var(--brand-soft); color: var(--brand-ink); font-size: 10px; font-weight: 800; }
:global(.cxm-books small) { font-size: 11px; color: var(--text-muted); }
:global(.cxm-book-ico) { width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; border-radius: 14px; font-size: 20px; background: color-mix(in srgb, var(--bk) 22%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bk) 45%, transparent); }
:global(.cxm-book-tools) { display: flex; gap: 6px; flex-shrink: 0; }

:global(.cxm-icons) { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
:global(.cxm-icons button) { aspect-ratio: 1; display: grid; place-items: center; border-radius: 12px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); font-size: 18px; cursor: pointer; transition: transform .15s; }
:global(.cxm-icons button.on) { border-color: var(--ac); background: color-mix(in srgb, var(--ac) 22%, transparent); transform: scale(1.08); }
:global(.cxm-colors) { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
:global(.cxm-colors button) { height: 34px; border-radius: 12px; border: 2px solid transparent; color: #fff; font-size: 13px; font-weight: 800; cursor: pointer; transition: transform .15s; }
:global(.cxm-colors button.on) { border-color: #fff; transform: scale(1.06); box-shadow: 0 6px 16px -4px currentColor; }

@media (max-width: 640px) {
  :global(.cxm-overlay) { align-items: flex-end; padding: 0; }
  :global(.cxm) { max-width: none; max-height: 92vh; border-radius: 28px 28px 0 0; }
  :global(.cxm-row) { grid-template-columns: 1fr; }
  :global(.cxm-foot) { padding-bottom: calc(14px + env(safe-area-inset-bottom)); }
}
</style>
