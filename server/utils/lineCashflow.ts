export type LineSessionState = 'awaiting_type' | 'awaiting_amount' | 'awaiting_category'

export type LineSession = {
  state: LineSessionState
  type?: 'income' | 'expense'
  category?: string
  amount?: number
  expires_at: number
}

const SESSION_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ─── Text matchers ────────────────────────────────────────────────────────────

const TRIGGER_SET = new Set([
  'บันทึก', 'บันทึกเงิน', 'รายรับรายจ่าย', 'รายรับ-รายจ่าย',
  'cashflow', '💸', 'เงิน', 'ตังค์', 'สตางค์', 'menu', 'เมนู',
])

export const isCashflowTrigger = (text: string) =>
  TRIGGER_SET.has(text.trim()) || TRIGGER_SET.has(text.trim().toLowerCase())

export const isIncomeText = (text: string) => {
  const t = text.trim()
  return ['รายรับ', 'รับ', 'income', '💰 รายรับ', '💰รายรับ'].includes(t)
}

export const isExpenseText = (text: string) => {
  const t = text.trim()
  return ['รายจ่าย', 'จ่าย', 'expense', '💸 รายจ่าย', '💸รายจ่าย'].includes(t)
}

export const isCancelText = (text: string) => {
  const t = text.trim()
  return ['ยกเลิก', 'cancel', 'ออก', '❌ ยกเลิก', 'ยกเลิกรายการ'].includes(t)
}

export const isSkipText = (text: string) => {
  const t = text.trim()
  return ['ข้าม', 'skip', '-', 'ไม่ระบุ', '⏭ ข้ามหมวดหมู่', 'ข้ามหมวดหมู่'].includes(t)
}

export const parseAmount = (text: string): number | null => {
  const cleaned = text.replace(/,/g, '').replace(/฿/g, '').replace(/\s/g, '')
  const num = parseFloat(cleaned)
  if (!isFinite(num) || num <= 0 || num > 100_000_000) return null
  return Math.round(num * 100) / 100
}

// ─── Session management ───────────────────────────────────────────────────────

export const newSession = (
  state: LineSessionState,
  extra?: Partial<Omit<LineSession, 'state' | 'expires_at'>>,
): LineSession => ({
  state,
  expires_at: Date.now() + SESSION_TTL_MS,
  ...extra,
})

export const getLineSession = (sessionStateJson: string | null | undefined): LineSession | null => {
  if (!sessionStateJson) return null
  try {
    const s = JSON.parse(sessionStateJson) as Partial<LineSession>
    if (typeof s.state !== 'string' || typeof s.expires_at !== 'number') return null
    if (Date.now() > s.expires_at) return null
    return s as LineSession
  } catch {
    return null
  }
}

export const setLineSession = async (apiBase: string, userId: string, session: LineSession | null) => {
  await $fetch(`${apiBase}/api/Line/${userId}/session`, {
    method: 'PUT',
    body: {
      sessionStateJson: session ? JSON.stringify(session) : null,
      sessionExpiresAt: session ? new Date(session.expires_at).toISOString() : null,
    },
  })
}

// ─── User lookup ──────────────────────────────────────────────────────────────

type BackendLineConnection = {
  userId: string
  sessionStateJson: string | null
}

export const findUserByLineId = async (apiBase: string, lineUserId: string): Promise<{ userId: string; sessionStateJson: string | null } | null> => {
  const connection = await $fetch<BackendLineConnection>(`${apiBase}/api/Line/by-line-user/${lineUserId}`).catch(() => null)
  if (!connection) return null
  return { userId: connection.userId, sessionStateJson: connection.sessionStateJson }
}

// ─── Transaction operations ───────────────────────────────────────────────────

export const saveTransaction = async (apiBase: string, userId: string, type: 'income' | 'expense', amount: number, category?: string) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  await $fetch(`${apiBase}/api/Finance`, {
    method: 'POST',
    body: {
      userId,
      transactionDate: `${today}T00:00:00`,
      type,
      category: category?.trim() || null,
      note: 'บันทึกผ่าน LINE Bot',
      amount,
    },
  })
}

type BackendFinanceSummary = {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

export const getBalance = async (apiBase: string, userId: string): Promise<{ income: number; expense: number; balance: number }> => {
  const summary = await $fetch<BackendFinanceSummary>(`${apiBase}/api/Finance/summary/${userId}`).catch(() => null)
  if (!summary) return { income: 0, expense: 0, balance: 0 }
  return { income: summary.totalIncome, expense: summary.totalExpense, balance: summary.netBalance }
}

// ─── Message builders ─────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export const buildSummaryMessage = (
  type: 'income' | 'expense',
  amount: number,
  category: string | undefined,
  bal: { income: number; expense: number; balance: number },
) => {
  const icon = type === 'income' ? '💰' : '💸'
  const label = type === 'income' ? 'รายรับ' : 'รายจ่าย'
  const sign = type === 'income' ? '+' : '-'
  const catLine = category ? `\nหมวดหมู่  : ${category}` : ''
  const balIcon = bal.balance >= 0 ? '🟢' : '🔴'
  const balSign = bal.balance < 0 ? '-' : ''

  return [
    '✅ บันทึกสำเร็จ!',
    '━━━━━━━━━━━━━━━━',
    `${icon} ${label}   : ${sign}${fmt(amount)} บ.${catLine}`,
    '━━━━━━━━━━━━━━━━',
    '📊 ยอดคงเหลือ',
    `รายรับรวม  : +${fmt(bal.income)} บ.`,
    `รายจ่ายรวม : -${fmt(bal.expense)} บ.`,
    `${balIcon} คงเหลือ   : ${balSign}${fmt(Math.abs(bal.balance))} บ.`,
  ].join('\n')
}

export const makeTypeSelectMsg = () => ({
  type: 'text',
  text: '📋 เลือกประเภทรายการ:',
  quickReply: {
    items: [
      { type: 'action', action: { type: 'message', label: '💰 รายรับ', text: 'รายรับ' } },
      { type: 'action', action: { type: 'message', label: '💸 รายจ่าย', text: 'รายจ่าย' } },
      { type: 'action', action: { type: 'message', label: '❌ ยกเลิก', text: 'ยกเลิก' } },
    ],
  },
})

type BackendFinanceRow = { type: string; category: string | null }

export const getExistingCategories = async (
  apiBase: string,
  userId: string,
  type: 'income' | 'expense',
): Promise<string[]> => {
  const rows = await $fetch<BackendFinanceRow[]>(`${apiBase}/api/Finance/${userId}`).catch(() => [])
  const cats = rows
    .filter(r => r.type === type && r.category)
    .map(r => String(r.category).trim())
    .filter(Boolean)
  return [...new Set(cats)].sort((a, b) => a.localeCompare(b, 'th'))
}

export const makeAmountMsg = (type: 'income' | 'expense', category: string) => ({
  type: 'text',
  text: [
    `${type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย'} (${category})`,
    '──────────',
    'กรุณาพิมพ์จำนวนเงิน (บาท):',
    'เช่น: 500 หรือ 1,500.50',
    '',
    'พิมพ์ "ยกเลิก" เพื่อยกเลิก',
  ].join('\n'),
  quickReply: {
    items: [
      { type: 'action', action: { type: 'message', label: '❌ ยกเลิก', text: 'ยกเลิก' } },
    ],
  },
})

export const makeCategorySelectMsg = (type: 'income' | 'expense', categories: string[]) => {
  const typeLabel = type === 'income' ? 'รายรับ' : 'รายจ่าย'
  const items = categories.slice(0, 11).map(cat => ({
    type: 'action',
    action: { type: 'message', label: cat, text: cat }
  }))
  items.push({ type: 'action', action: { type: 'message', label: '❌ ยกเลิก', text: 'ยกเลิก' } })

  return {
    type: 'text',
    text: [
      `บันทึก${typeLabel}`,
      '──────────',
      categories.length > 0
        ? 'เลือกหมวดหมู่ด้านล่าง หรือพิมพ์หมวดหมู่ใหม่:'
        : 'กรุณาพิมพ์ชื่อหมวดหมู่ที่ต้องการบันทึก:',
    ].join('\n'),
    quickReply: { items }
  }
}
