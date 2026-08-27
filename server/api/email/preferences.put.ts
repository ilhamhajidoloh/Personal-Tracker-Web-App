import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)
  const body = await readBody(event)
  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  return await $fetch(`${config.public.apiBase}/api/EmailNotification/${authUserId}/preferences`, {
    method: 'PUT',
    headers: authHeaders,
    body,
  })
})
