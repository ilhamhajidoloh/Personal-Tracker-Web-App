import { serverSupabaseUser } from '#supabase/server'

import { getLineConnectionStatus, pushLineTextMessage } from '../../utils/line'

type LineAuthUser = {
  user_metadata?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event) as LineAuthUser | null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนส่งข้อความทดสอบ',
    })
  }

  const lineUser = { user_metadata: user.user_metadata || {} }
  const connection = getLineConnectionStatus(lineUser)

  if (!connection.connected) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ยังไม่ได้เชื่อมต่อ LINE User ID',
    })
  }

  const config = useRuntimeConfig(event)

  if (!config.line.channelAccessToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_ACCESS_TOKEN',
    })
  }

  const sentAt = new Date().toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  await pushLineTextMessage(
    config.line.channelAccessToken,
    connection.lineUserId,
    `เชื่อมต่อ LINE กับ MyLife สำเร็จ\nทดสอบล่าสุด: ${sentAt}`,
  )

  return {
    sent: true,
    lineUserId: connection.lineUserId,
  }
})