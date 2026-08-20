import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { getLineConnectionStatus } from '../../utils/line'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)
  return await getLineConnectionStatus(config.public.apiBase, authUserId, authHeaders)
})
