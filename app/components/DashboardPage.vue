<template>
  <AppTabsLayout>
    <header class="px-6 md:px-8 py-5 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Dashboard ภาพรวม</h1>
        <p class="text-sm text-gray-400 mt-1">{{ todayText }}</p>
      </div>
      <NuxtLink
        to="/cashflow"
        class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium transition-colors"
      >
        ไปที่แท็บรายรับรายจ่าย
      </NuxtLink>
    </header>

    <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">เงินคงเหลือรวม</p>
          <p class="text-2xl font-bold mt-2" :class="remainingBalance >= 0 ? 'text-sky-300' : 'text-amber-300'">
            {{ formatCurrency(remainingBalance) }}
          </p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายรับรวม</p>
          <p class="text-2xl font-bold text-emerald-400 mt-2">{{ formatCurrency(totalIncome) }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายรวม</p>
          <p class="text-2xl font-bold text-rose-400 mt-2">{{ formatCurrency(totalExpense) }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p class="text-xs text-gray-400">รายจ่ายที่มากที่สุด</p>
          <p class="text-lg font-semibold text-white mt-2 truncate">{{ topExpenseCategory.name }}</p>
          <p class="text-sm text-gray-400 mt-1">{{ formatCurrency(topExpenseCategory.amount) }}</p>
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div class="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">สรุปการเงินแบบย่อ</h2>
              <p class="text-sm text-gray-400 mt-1">แสดงเฉพาะข้อมูลสำคัญบนหน้า Dashboard</p>
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

          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">จำนวนรายการทั้งหมด</p>
                <p class="text-lg font-semibold text-white mt-1">{{ totalTransactions }} รายการ</p>
              </div>
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">รายการล่าสุด</p>
                <p class="text-sm font-medium text-white mt-1">{{ latestTransactionTitle }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ latestTransactionSubtitle }}</p>
              </div>
              <div class="border border-gray-800 rounded-xl px-3 py-3">
                <p class="text-xs text-gray-500">ค่าใช้จ่ายหมวดสูงสุด</p>
                <p class="text-sm font-medium text-white mt-1">{{ topExpenseCategory.name }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatCurrency(topExpenseCategory.amount) }}</p>
              </div>
            </div>

            <NuxtLink
              to="/cashflow"
              class="inline-flex items-center px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/40 text-sm font-medium"
            >
              ดูรายละเอียดรายรับรายจ่ายทั้งหมด
            </NuxtLink>
          </div>
        </div>

        <div class="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 class="text-lg font-semibold text-white">พื้นที่สำหรับโมดูลเพิ่มเติม</h2>
          <p class="text-sm text-gray-400 mt-1 mb-4">สามารถเพิ่มส่วนอื่นได้โดยไม่ชนกับหน้าเงิน</p>

          <div class="space-y-3">
            <div
              v-for="module in futureModules"
              :key="module.title"
              class="border border-dashed border-gray-700 rounded-xl px-3 py-3"
            >
              <p class="text-sm font-medium text-white">{{ module.title }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ module.description }}</p>
              <p class="text-[11px] text-violet-300 mt-2">{{ module.status }}</p>
            </div>
          </div>
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
  amount: number
  created_at: string
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

const futureModules = [
  {
    title: 'งานและ To-do',
    description: 'สรุปงานวันนี้, สิ่งที่ต้องส่ง, และงานค้าง',
    status: 'Coming soon',
  },
  {
    title: 'สุขภาพและกิจกรรม',
    description: 'สรุปการออกกำลังกาย, น้ำดื่ม, และการนอน',
    status: 'Coming soon',
  },
  {
    title: 'นิสัยและเป้าหมาย',
    description: 'ติดตาม streak และความคืบหน้าของเป้าหมายส่วนตัว',
    status: 'Coming soon',
  },
]

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

const totalTransactions = computed(() => transactions.value.length)

const topExpenseCategory = computed(() => {
  const categoryTotals = transactions.value
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.category?.trim() || 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})

  const [name, amount] = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0] || ['-', 0]

  return { name, amount }
})

const latestTransaction = computed(() => transactions.value[0] || null)

const latestTransactionTitle = computed(() => {
  if (!latestTransaction.value) {
    return 'ยังไม่มีรายการ'
  }

  const typeText = latestTransaction.value.type === 'income' ? 'รายรับ' : 'รายจ่าย'
  return `${typeText} ${formatCurrency(latestTransaction.value.amount)}`
})

const latestTransactionSubtitle = computed(() => {
  if (!latestTransaction.value) {
    return 'เพิ่มรายการแรกในแท็บรายรับรายจ่าย'
  }

  const categoryText = latestTransaction.value.category || 'ไม่ระบุหมวดหมู่'
  return `${formatDate(latestTransaction.value.entry_date)} • ${categoryText}`
})

const normalizeRows = (rows: any[]): TransactionRow[] => rows.map((row) => ({
  id: String(row.id),
  user_id: String(row.user_id),
  entry_date: String(row.entry_date),
  type: row.type === 'income' ? 'income' : 'expense',
  category: typeof row.category === 'string' ? row.category : null,
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
      .select('id, user_id, entry_date, type, category, amount, created_at')
      .eq('user_id', userData.user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

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
