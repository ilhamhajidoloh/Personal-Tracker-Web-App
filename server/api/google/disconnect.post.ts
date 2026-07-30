import { requireBackendUserId } from '../../utils/auth'
import { revokeGoogleToken } from '../../utils/googleCalendar'
import type { GoogleCalendarStatus } from './status.get'

type BackendGoogleConnection = {
  accessToken: string
  refreshToken: string
}

export default defineEventHandler(async (event): Promise<GoogleCalendarStatus> => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)
  const connection = await $fetch<BackendGoogleConnection>(`${config.public.apiBase}/api/GoogleCalendar/${authUserId}`).catch(() => null)

  if (connection) {
    await revokeGoogleToken(connection.refreshToken || connection.accessToken)
    await $fetch(`${config.public.apiBase}/api/GoogleCalendar/${authUserId}`, { method: 'DELETE' }).catch(() => {})
  }

  return { connected: false, connectedAt: null }
})
