import { serverSupabaseServiceRole } from '#supabase/server'

import {
  extractLineLinkToken,
  replyLineTextMessage,
  verifyLineLinkToken,
  verifyLineWebhookSignature,
  withLineConnectionMetadata,
} from '../../utils/line'

type LineWebhookTextMessageEvent = {
  type: 'message'
  replyToken?: string
  message?: {
    type?: string
    text?: string
  }
  source?: {
    type?: string
    userId?: string
  }
}

type LineWebhookFollowEvent = {
  type: 'follow'
  replyToken?: string
}

type LineWebhookPayload = {
  events?: Array<LineWebhookTextMessageEvent | LineWebhookFollowEvent | Record<string, unknown>>
}

const followMessage = 'เพิ่มเพื่อนสำเร็จแล้ว กลับไปที่หน้า Profile ของ MyLife แล้วกดสร้างโค้ดเชื่อมต่อ จากนั้นส่งข้อความนั้นมาที่แชตนี้ได้เลย'
const helpMessage = 'ถ้าต้องการเชื่อม MyLife กับ LINE ให้กลับไปที่หน้า Profile แล้วกดสร้างโค้ดเชื่อมต่อ จากนั้นส่งข้อความนั้นมาที่แชตนี้'
const invalidCodeMessage = 'โค้ดเชื่อมต่อไม่ถูกต้องหรือหมดอายุแล้ว กรุณากลับไปสร้างใหม่ที่หน้า Profile'
const successMessage = 'เชื่อมต่อ LINE กับ MyLife สำเร็จแล้ว คุณจะได้รับการแจ้งเตือนจากแอปในแชตนี้'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.line.channelSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_SECRET',
    })
  }

  const rawBody = await readRawBody(event, 'utf8')
  const signature = getHeader(event, 'x-line-signature') || ''

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing LINE webhook body',
    })
  }

  if (!(await verifyLineWebhookSignature(rawBody, signature, config.line.channelSecret))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid LINE webhook signature',
    })
  }

  const payload = JSON.parse(rawBody) as LineWebhookPayload
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const sendReplyIfPossible = async (replyToken: string | undefined, message: string) => {
    if (!replyToken || !config.line.channelAccessToken) {
      return
    }

    try {
      await replyLineTextMessage(config.line.channelAccessToken, replyToken, message)
    } catch (error) {
      console.error('LINE webhook reply error:', error)
    }
  }

  for (const lineEvent of payload.events || []) {
    if (lineEvent.type === 'follow') {
      await sendReplyIfPossible((lineEvent as LineWebhookFollowEvent).replyToken, followMessage)
      continue
    }

    if (lineEvent.type !== 'message') {
      continue
    }

    const messageEvent = lineEvent as LineWebhookTextMessageEvent

    if (messageEvent.message?.type !== 'text') {
      continue
    }

    if (messageEvent.source?.type !== 'user' || !messageEvent.source.userId) {
      await sendReplyIfPossible(messageEvent.replyToken, 'กรุณาส่งโค้ดจากแชตส่วนตัวกับ LINE bot เท่านั้น')
      continue
    }

    const token = extractLineLinkToken(messageEvent.message.text || '')

    if (!token) {
      await sendReplyIfPossible(messageEvent.replyToken, helpMessage)
      continue
    }

    const linkPayload = await verifyLineLinkToken(token, config.line.channelSecret)

    if (!linkPayload) {
      await sendReplyIfPossible(messageEvent.replyToken, invalidCodeMessage)
      continue
    }

    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(linkPayload.userId)

    if (authUserError || !authUserData.user) {
      await sendReplyIfPossible(messageEvent.replyToken, 'ไม่พบบัญชี MyLife ที่ต้องการเชื่อม กรุณากลับไปสร้างโค้ดใหม่')
      continue
    }

    const metadata = withLineConnectionMetadata(
      { user_metadata: authUserData.user.user_metadata || {} },
      messageEvent.source.userId,
      linkPayload.notificationsEnabled,
    )

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(linkPayload.userId, {
      user_metadata: metadata,
    })

    if (updateError) {
      await sendReplyIfPossible(messageEvent.replyToken, 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      continue
    }

    await sendReplyIfPossible(messageEvent.replyToken, successMessage)
  }

  return 'OK'
})