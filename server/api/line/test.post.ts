import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus, pushLineTextMessage } from '../../utils/line'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)
  const connection = await getLineConnectionStatus(config.public.apiBase, authUserId, authHeaders)

  if (!connection.connected) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ยังไม่ได้เชื่อมต่อ LINE - กรุณาไปที่หน้า Profile แล้วทำการเชื่อมต่อ LINE ก่อน',
    })
  }

  if (!config.line.channelAccessToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_ACCESS_TOKEN',
    })
  }

  const sentAt = new Date().toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
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
