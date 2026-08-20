import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus, pushLineTextMessage } from '../../utils/line'

type NotifyBody = {
  text?: string
}

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

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

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)
  const connection = await getLineConnectionStatus(config.public.apiBase, authUserId, authHeaders)

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
