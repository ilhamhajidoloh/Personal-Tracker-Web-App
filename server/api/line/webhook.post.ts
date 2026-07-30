import {
  extractLineLinkToken,
  replyLineMessages,
  replyLineTextMessage,
  verifyLineLinkToken,
  verifyLineWebhookSignature,
} from '../../utils/line'

import {
  buildSummaryMessage,
  findUserByLineId,
  getBalance,
  getExistingCategories,
  getLineSession,
  isCancelText,
  isCashflowTrigger,
  isExpenseText,
  isIncomeText,
  makeCategorySelectMsg,
  makeAmountMsg,
  makeTypeSelectMsg,
  newSession,
  parseAmount,
  saveTransaction,
  setLineSession,
} from '../../utils/lineCashflow'

type LineWebhookTextMessageEvent = {
  type: 'message'
  replyToken?: string
  message?: { type?: string; text?: string }
  source?: { type?: string; userId?: string }
}

type LineWebhookFollowEvent = {
  type: 'follow'
  replyToken?: string
}

type LineWebhookPayload = {
  events?: Array<LineWebhookTextMessageEvent | LineWebhookFollowEvent | Record<string, unknown>>
}

const followMessage = 'สวัสดี! 👋 เพิ่มเพื่อนสำเร็จแล้ว\nกลับไปที่หน้า Profile ของ MyLife แล้วกดสร้างโค้ดเชื่อมต่อ จากนั้นส่งมาที่แชตนี้ได้เลย'
const invalidCodeMessage = 'โค้ดเชื่อมต่อไม่ถูกต้องหรือหมดอายุแล้ว กรุณากลับไปสร้างใหม่ที่หน้า Profile'
const successMessage = '✅ เชื่อมต่อ LINE กับ MyLife สำเร็จแล้ว!\nตอนนี้คุณสามารถบันทึกรายรับรายจ่ายผ่าน LINE ได้แล้ว\nพิมพ์ "บันทึก" เพื่อเริ่มต้น'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.line.channelSecret) {
    throw createError({ statusCode: 500, statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_SECRET' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  const signature = getHeader(event, 'x-line-signature') || ''

  if (!rawBody) throw createError({ statusCode: 400, statusMessage: 'Missing LINE webhook body' })

  if (!(await verifyLineWebhookSignature(rawBody, signature, config.line.channelSecret))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid LINE webhook signature' })
  }

  const payload = JSON.parse(rawBody) as LineWebhookPayload
  const apiBase = config.public.apiBase
  const accessToken = config.line.channelAccessToken

  // ── Helpers ────────────────────────────────────────────────────────────────

  const reply = async (replyToken: string | undefined, text: string) => {
    if (!replyToken || !accessToken) return
    try { await replyLineTextMessage(accessToken, replyToken, text) }
    catch (err) { console.error('LINE reply error:', err) }
  }

  const replyMsgs = async (replyToken: string | undefined, messages: Record<string, unknown>[]) => {
    if (!replyToken || !accessToken) return
    try { await replyLineMessages(accessToken, replyToken, messages) }
    catch (err) { console.error('LINE replyMessages error:', err) }
  }

  // ── Event loop ─────────────────────────────────────────────────────────────

  for (const lineEvent of payload.events || []) {
    // Follow
    if (lineEvent.type === 'follow') {
      await reply((lineEvent as LineWebhookFollowEvent).replyToken, followMessage)
      continue
    }

    if (lineEvent.type !== 'message') continue

    const msgEvent = lineEvent as LineWebhookTextMessageEvent
    if (msgEvent.message?.type !== 'text') continue

    if (msgEvent.source?.type !== 'user' || !msgEvent.source.userId) {
      await reply(msgEvent.replyToken, 'กรุณาส่งข้อความจากแชตส่วนตัวกับ LINE Bot เท่านั้น')
      continue
    }

    const lineUserId = msgEvent.source.userId
    const text = (msgEvent.message.text || '').trim()
    const replyToken = msgEvent.replyToken

    // ── 1. Link token → account linking (existing flow) ────────────────────

    const linkToken = extractLineLinkToken(text)
    if (linkToken) {
      const linkPayload = await verifyLineLinkToken(linkToken, config.line.channelSecret)
      if (!linkPayload) { await reply(replyToken, invalidCodeMessage); continue }

      try {
        await $fetch(`${apiBase}/api/Line/${linkPayload.userId}/connect`, {
          method: 'POST',
          body: { lineUserId, notificationsEnabled: linkPayload.notificationsEnabled },
        })
        await reply(replyToken, successMessage)
      } catch (err) {
        console.error('LINE link connect error:', err)
        await reply(replyToken, 'ไม่พบบัญชี MyLife ที่ต้องการเชื่อม กรุณากลับไปสร้างโค้ดใหม่')
      }
      continue
    }

    // ── 2. Find linked MyLife user ───────────────────────────────────────────

    const userInfo = await findUserByLineId(apiBase, lineUserId)
    if (!userInfo) {
      await reply(replyToken, 'ยังไม่ได้เชื่อมต่อ LINE กับ MyLife\nกรุณาเปิดแอปแล้วไปที่ Profile → สร้างโค้ดเชื่อมต่อ')
      continue
    }

    const { userId } = userInfo
    const session = getLineSession(userInfo.sessionStateJson)

    // ── 3. Cancel (any state) ───────────────────────────────────────────────

    if (isCancelText(text)) {
      if (session) {
        await setLineSession(apiBase, userId, null)
        await reply(replyToken, '❌ ยกเลิกแล้ว\nพิมพ์ "บันทึก" เพื่อเริ่มใหม่')
      } else {
        await reply(replyToken, 'ไม่มีรายการที่กำลังบันทึกอยู่\nพิมพ์ "บันทึก" เพื่อเริ่มต้น')
      }
      continue
    }

    // ── 4. No active session ────────────────────────────────────────────────

    if (!session) {
      if (isIncomeText(text)) {
        const categories = await getExistingCategories(apiBase, userId, 'income')
        await setLineSession(apiBase, userId, newSession('awaiting_category', { type: 'income' }))
        await replyMsgs(replyToken, [makeCategorySelectMsg('income', categories)])
        continue
      }
      if (isExpenseText(text)) {
        const categories = await getExistingCategories(apiBase, userId, 'expense')
        await setLineSession(apiBase, userId, newSession('awaiting_category', { type: 'expense' }))
        await replyMsgs(replyToken, [makeCategorySelectMsg('expense', categories)])
        continue
      }
      // Trigger word or any unknown text → show menu
      if (isCashflowTrigger(text)) {
        await setLineSession(apiBase, userId, newSession('awaiting_type'))
      }
      await replyMsgs(replyToken, [makeTypeSelectMsg()])
      continue
    }

    // ── 5. awaiting_type ────────────────────────────────────────────────────

    if (session.state === 'awaiting_type') {
      if (isIncomeText(text)) {
        const categories = await getExistingCategories(apiBase, userId, 'income')
        await setLineSession(apiBase, userId, newSession('awaiting_category', { type: 'income' }))
        await replyMsgs(replyToken, [makeCategorySelectMsg('income', categories)])
        continue
      }
      if (isExpenseText(text)) {
        const categories = await getExistingCategories(apiBase, userId, 'expense')
        await setLineSession(apiBase, userId, newSession('awaiting_category', { type: 'expense' }))
        await replyMsgs(replyToken, [makeCategorySelectMsg('expense', categories)])
        continue
      }
      await replyMsgs(replyToken, [makeTypeSelectMsg()])
      continue
    }

    // ── 6. awaiting_category ────────────────────────────────────────────────

    if (session.state === 'awaiting_category') {
      const type = session.type!
      const category = text
      await setLineSession(apiBase, userId, newSession('awaiting_amount', { type, category }))
      await replyMsgs(replyToken, [makeAmountMsg(type, category)])
      continue
    }

    // ── 7. awaiting_amount ──────────────────────────────────────────────────

    if (session.state === 'awaiting_amount') {
      const amount = parseAmount(text)
      if (!amount) {
        await reply(replyToken, '⚠️ กรุณาพิมพ์ตัวเลขจำนวนเงิน\nเช่น: 100 หรือ 1,500.50\nหรือ "ยกเลิก" เพื่อยกเลิก')
        continue
      }
      const type = session.type!
      const category = session.category

      try {
        await saveTransaction(apiBase, userId, type, amount, category)
        const balance = await getBalance(apiBase, userId)
        const summary = buildSummaryMessage(type, amount, category, balance)
        await setLineSession(apiBase, userId, null)
        await reply(replyToken, summary)
      } catch (err) {
        console.error('LINE cashflow save error:', err)
        await setLineSession(apiBase, userId, null)
        await reply(replyToken, '❌ บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง\nพิมพ์ "บันทึก" เพื่อเริ่มใหม่')
      }
      continue
    }
  }

  return 'OK'
})
