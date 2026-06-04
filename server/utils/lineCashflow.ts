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

export const getLineSession = (metadata: Record<string, unknown>): LineSession | null => {
  const raw = metadata.line_session
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<LineSession>
  if (typeof s.state !== 'string' || typeof s.expires_at !== 'number') return null
  if (Date.now() > s.expires_at) return null
  return s as LineSession
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setLineSession = async (supabase: any, userId: string, currentMetadata: Record<string, unknown>, session: LineSession | null) => {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMetadata, line_session: session ?? null },
  })
  if (error) throw error
}

// ─── User lookup ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findUserByLineId = async (supabase: any, lineUserId: string): Promise<{ userId: string; metadata: Record<string, unknown> } | null> => {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data?.users?.length) return null
  const user = (data.users as Array<{ id: string; user_metadata?: Record<string, unknown> }>)
    .find(u => u.user_metadata?.line_user_id === lineUserId)
  if (!user) return null
  return { userId: user.id, metadata: (user.user_metadata ?? {}) as Record<string, unknown> }
}

// ─── Transaction operations ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveTransaction = async (supabase: any, userId: string, type: 'income' | 'expense', amount: number, category?: string) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    entry_date: today,
    type,
    category: category?.trim() || null,
    description: 'บันทึกผ่าน LINE Bot',
    amount,
  })
  if (error) throw error
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBalance = async (supabase: any, userId: string): Promise<{ income: number; expense: number; balance: number }> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
  if (error || !data) return { income: 0, expense: 0, balance: 0 }
  const rows = data as Array<{ type: string; amount: unknown }>
  const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
  return { income, expense, balance: income - expense }
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

export const getExistingCategories = async (
  supabase: any,
  userId: string,
  type: 'income' | 'expense',
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('category')
    .eq('user_id', userId)
    .eq('type', type)
    .not('category', 'is', null)
  if (error || !data) return []
  const cats = data.map((r: any) => String(r.category).trim()).filter(Boolean) as string[]
  return [...new Set(cats)].sort((a: string, b: string) => a.localeCompare(b, 'th'))
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
