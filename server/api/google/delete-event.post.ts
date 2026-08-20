import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { deleteGoogleCalendarEvent, getValidGoogleAccessToken } from '../../utils/googleCalendar'

type DeleteEventBody = {
  googleEventId?: string
}

type DeleteEventResponse = {
  deleted: boolean
  reason?: string
}

export default defineEventHandler(async (event): Promise<DeleteEventResponse> => {
  const authUserId = await requireBackendUserId(event)

  const body = await readBody<DeleteEventBody>(event)
  const googleEventId = typeof body?.googleEventId === 'string' ? body.googleEventId.trim() : ''

  if (!googleEventId) {
    return { deleted: false, reason: 'no_google_event_id' }
  }

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  console.log('[delete-event] Request to delete Google Event ID:', googleEventId)

  const accessToken = await getValidGoogleAccessToken(config.public.apiBase, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  }, authHeaders)

  if (!accessToken) {
    console.log('[delete-event] Access token not found or not connected')
    return { deleted: false, reason: 'not_connected' }
  }

  try {
    await deleteGoogleCalendarEvent(accessToken, googleEventId)
    console.log('[delete-event] Successfully deleted event from Google Calendar:', googleEventId)
    return { deleted: true }
  } catch (err) {
    console.error('Google Calendar delete-event error:', err)
    return { deleted: false, reason: 'google_api_error' }
  }
})
