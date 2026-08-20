import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus } from '../../utils/line'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  await $fetch(`${config.public.apiBase}/api/Line/${authUserId}/disconnect`, {
    method: 'POST',
    headers: authHeaders,
  }).catch((err) => {
    console.error('LINE disconnect error:', err)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถยกเลิกการเชื่อมต่อ LINE ได้' })
  })

  return await getLineConnectionStatus(config.public.apiBase, authUserId, authHeaders)
})
