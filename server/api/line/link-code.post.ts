import { requireBackendUserId } from '../../utils/auth'
import { createLineLinkToken, getLineLinkMessage } from '../../utils/line'

type LinkCodeBody = {
  notificationsEnabled?: boolean
}

const LINE_LINK_CODE_TTL_MS = 10 * 60 * 1000

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)

  if (!config.line.channelSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_LINE_CHANNEL_SECRET',
    })
  }

  const body = await readBody<LinkCodeBody>(event)
  const expiresAt = Date.now() + LINE_LINK_CODE_TTL_MS
  const token = await createLineLinkToken(config.line.channelSecret, {
    userId: authUserId,
    notificationsEnabled: body?.notificationsEnabled !== false,
    expiresAt,
  })

  return {
    code: getLineLinkMessage(token),
    expiresAt: new Date(expiresAt).toISOString(),
    expiresInSeconds: Math.floor(LINE_LINK_CODE_TTL_MS / 1000),
  }
})
