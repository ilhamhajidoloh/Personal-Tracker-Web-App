<template>
  <AppTabsLayout>
    <header class="px-6 md:px-8 py-5 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Dashboard การเงิน</h1>
        <p class="text-sm text-gray-400 mt-1">{{ todayText }}</p>
      </div>
      <NuxtLink
        to="/cashflow"
        class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium transition-colors"
      >
        + เพิ่มรายรับรายจ่าย
      </NuxtLink>
    </header>

    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายรับรวมทั้งหมด</p>
          <p class="text-2xl font-bold text-emerald-400 mt-2">{{ formatCurrency(totalIncome) }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายรวมทั้งหมด</p>
          <p class="text-2xl font-bold text-rose-400 mt-2">{{ formatCurrency(totalExpense) }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">เงินคงเหลือ</p>
          <p class="text-2xl font-bold mt-2" :class="remainingBalance >= 0 ? 'text-sky-300' : 'text-amber-300'">
            {{ formatCurrency(remainingBalance) }}
          </p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายที่มากที่สุด</p>
          <p class="text-lg font-semibold text-white mt-2 truncate">{{ topExpenseCategory.name }}</p>
          <p class="text-sm text-gray-400 mt-1">{{ formatCurrency(topExpenseCategory.amount) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <section class="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">สรุปรายรับรายจ่ายรายวัน</h2>
              <p class="text-sm text-gray-400 mt-1">ภาพรวมรายวันล่าสุด</p>
            </div>
            <button
              @click="loadTransactions"
              :disabled="isLoading"
              class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-xs"
            >
              {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
            </button>
          </div>

          <div v-if="isLoading" class="text-sm text-gray-400">กำลังโหลดข้อมูล...</div>
          <div v-else-if="!dailySummaries.length" class="text-sm text-gray-400">ยังไม่มีรายการรายรับรายจ่าย</div>
          <div v-else class="space-y-3">
            <div
              v-for="day in dailySummaries.slice(0, 7)"
              :key="day.date"
              class="grid grid-cols-1 sm:grid-cols-4 gap-2 border border-gray-800 rounded-xl px-3 py-3"
            >
              <div>
                <p class="text-xs text-gray-500">วันที่</p>
                <p class="text-sm text-white mt-1">{{ formatDate(day.date) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">รายรับ</p>
                <p class="text-sm text-emerald-400 mt-1">{{ formatCurrency(day.income) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">รายจ่าย</p>
                <p class="text-sm text-rose-400 mt-1">{{ formatCurrency(day.expense) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">คงเหลือสุทธิ</p>
                <p class="text-sm mt-1" :class="day.balance >= 0 ? 'text-sky-300' : 'text-amber-300'">
                  {{ formatCurrency(day.balance) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 class="text-lg font-semibold text-white">สรุปหมวดรายจ่ายสูงสุด</h2>
          <p class="text-sm text-gray-400 mt-1 mb-4">เรียงจากใช้จ่ายมากไปน้อย</p>

          <div v-if="!topExpenseCategories.length" class="text-sm text-gray-400">ยังไม่มีข้อมูลรายจ่าย</div>
          <div v-else class="space-y-3">
            <div
              v-for="category in topExpenseCategories"
              :key="category.name"
              class="border border-gray-800 rounded-xl px-3 py-3"
            >
              <p class="text-sm text-white">{{ category.name }}</p>
              <p class="text-xs text-rose-300 mt-1">{{ formatCurrency(category.amount) }}</p>
            </div>
          </div>
        </section>
      </div>

      <section class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h2 class="text-lg font-semibold text-white">รายการล่าสุด</h2>
          <NuxtLink to="/cashflow" class="text-xs text-violet-300 hover:text-violet-200">ไปหน้า รายรับรายจ่าย →</NuxtLink>
        </div>

        <div v-if="!transactions.length" class="text-sm text-gray-400">ยังไม่มีรายการ</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-400 border-b border-gray-800">
                <th class="py-2 pr-4 font-medium">วันที่</th>
                <th class="py-2 pr-4 font-medium">ประเภท</th>
                <th class="py-2 pr-4 font-medium">หมวดหมู่</th>
                <th class="py-2 text-right font-medium">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in transactions.slice(0, 8)"
                :key="item.id"
                class="border-b border-gray-800/70"
              >
                <td class="py-2 pr-4 text-gray-300">{{ formatDate(item.entry_date) }}</td>
                <td class="py-2 pr-4">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs"
                    :class="item.type === 'income' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'"
                  >
                    {{ item.type === 'income' ? 'รายรับ' : 'รายจ่าย' }}
                  </span>
                </td>
                <td class="py-2 pr-4 text-gray-300">{{ item.category || '-' }}</td>
                <td class="py-2 text-right" :class="item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'">
                  {{ formatCurrency(item.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

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

const router = useRouter()
const supabase = useSupabaseClient()

const transactions = ref<TransactionRow[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const todayText = new Date().toLocaleDateString('th-TH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const tableMissingCodes = new Set(['42P01', 'PGRST205'])

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

const totalIncome = computed(() => transactions.value
  .filter((item) => item.type === 'income')
  .reduce((sum, item) => sum + item.amount, 0))

const totalExpense = computed(() => transactions.value
  .filter((item) => item.type === 'expense')
  .reduce((sum, item) => sum + item.amount, 0))

const remainingBalance = computed(() => totalIncome.value - totalExpense.value)

const topExpenseCategories = computed(() => {
  const categoryTotals = transactions.value
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})

  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))
})

const topExpenseCategory = computed(() => topExpenseCategories.value[0] || { name: '-', amount: 0 })

const dailySummaries = computed<DailySummary[]>(() => {
  const grouped = transactions.value.reduce<Record<string, DailySummary>>((acc, item) => {
    if (!acc[item.entry_date]) {
      acc[item.entry_date] = {
        date: item.entry_date,
        income: 0,
        expense: 0,
        balance: 0,
      }
    }

    if (item.type === 'income') {
      acc[item.entry_date].income += item.amount
    } else {
      acc[item.entry_date].expense += item.amount
    }

    acc[item.entry_date].balance = acc[item.entry_date].income - acc[item.entry_date].expense
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
})

const normalizeRows = (rows: any[]): TransactionRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.user_id),
  entry_date: String(row.entry_date),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
  description: typeof row.description === 'string' ? row.description : null,
  amount: Number(row.amount || 0),
  created_at: String(row.created_at || ''),
}))

const loadTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      throw userError
    }

    if (!userData.user) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, entry_date, type, category, description, amount, created_at')
      .eq('user_id', userData.user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      if (tableMissingCodes.has(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง transactions ใน Supabase กรุณาสร้างตารางก่อนใช้งาน'
        transactions.value = []
        return
      }

      throw error
    }

    transactions.value = normalizeRows(data || [])
  } catch (error: any) {
    console.error('Load dashboard finance error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูล Dashboard ไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTransactions()
})
</script>
