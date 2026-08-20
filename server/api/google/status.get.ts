import { getBackendAuthHeader, getBackendUserId } from '../../utils/auth'

export type GoogleCalendarStatus = {
  connected: boolean
  connectedAt: string | null
}

type BackendGoogleConnection = {
  createdAt: string
}

export default defineEventHandler(async (event): Promise<GoogleCalendarStatus> => {
  const authUserId = await getBackendUserId(event)

  if (!authUserId) {
    return { connected: false, connectedAt: null }
  }

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)
  const connection = await $fetch<BackendGoogleConnection>(
    `${config.public.apiBase}/api/GoogleCalendar/${authUserId}`,
    { headers: authHeaders },
  ).catch(() => null)

  return {
    connected: Boolean(connection),
    connectedAt: connection?.createdAt || null,
  }
})
