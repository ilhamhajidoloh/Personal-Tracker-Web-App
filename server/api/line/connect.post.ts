import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus, normalizeLineUserId } from '../../utils/line'

type ConnectLineBody = {
  lineUserId?: string
  notificationsEnabled?: boolean
  classRemindersEnabled?: boolean
  classReminderMinutes?: number
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
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  await $fetch(`${config.public.apiBase}/api/Line/${authUserId}/connect`, {
    method: 'POST',
    headers: authHeaders,
    body: {
      lineUserId,
      notificationsEnabled: body?.notificationsEnabled !== false,
      classRemindersEnabled: Boolean(body?.classRemindersEnabled),
      classReminderMinutes: typeof body?.classReminderMinutes === 'number' ? body.classReminderMinutes : 15,
    },
  }).catch((err) => {
    console.error('LINE connect error:', err)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถบันทึกข้อมูล LINE ได้' })
  })

  return await getLineConnectionStatus(config.public.apiBase, authUserId, authHeaders)
})
