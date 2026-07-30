import { requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus, normalizeLineUserId } from '../../utils/line'

type ConnectLineBody = {
  lineUserId?: string
  notificationsEnabled?: boolean
}

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const body = await readBody<ConnectLineBody>(event)
  const lineUserId = normalizeLineUserId(body?.lineUserId)

  if (!lineUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'LINE User ID ไม่ถูกต้อง',
    })
  }

  const config = useRuntimeConfig(event)

  await $fetch(`${config.public.apiBase}/api/Line/${authUserId}/connect`, {
    method: 'POST',
    body: {
      lineUserId,
      notificationsEnabled: body?.notificationsEnabled !== false,
    },
  }).catch((err) => {
    console.error('LINE connect error:', err)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถบันทึกข้อมูล LINE ได้' })
  })

  return await getLineConnectionStatus(config.public.apiBase, authUserId)
})
