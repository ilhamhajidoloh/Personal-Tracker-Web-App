import { serverSupabaseUser } from '#supabase/server'

import { getLineConnectionStatus, pushLineTextMessage } from '../../utils/line'

type NotifyBody = {
  text?: string
}

type LineAuthUser = {
  id: string
  user_metadata?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event) as LineAuthUser | null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนส่งแจ้งเตือน LINE',
    })
  }

  const body = await readBody<NotifyBody>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'กรุณาระบุข้อความที่ต้องการส่ง',
    })
  }

  if (text.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ข้อความยาวเกินไปสำหรับการแจ้งเตือน LINE',
    })
  }

  const lineUser = { user_metadata: user.user_metadata || {} }
  const connection = getLineConnectionStatus(lineUser)

  if (!connection.connected) {
    return {
      sent: false,
      skipped: true,
      reason: 'not_connected',
    }
  }

  if (!connection.notificationsEnabled) {
    return {
      sent: false,
      skipped: true,
      reason: 'disabled',
    }
  }

  const config = useRuntimeConfig(event)

  if (!config.line.channelAccessToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_ACCESS_TOKEN',
    })
  }

  await pushLineTextMessage(config.line.channelAccessToken, connection.lineUserId, text)

  return {
    sent: true,
  }
})