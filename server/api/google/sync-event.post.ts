import { requireBackendUserId } from '../../utils/auth'
import { activityToGoogleEventRow, getValidGoogleAccessToken, upsertGoogleCalendarEvent, type BackendActivityForSync } from '../../utils/googleCalendar'

type SyncEventBody = {
  eventId?: string
}

type SyncEventResponse = {
  synced: boolean
  reason?: string
}

export default defineEventHandler(async (event): Promise<SyncEventResponse> => {
  const authUserId = await requireBackendUserId(event)

  const body = await readBody<SyncEventBody>(event)
  const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : ''

  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบ eventId' })
  }

  const config = useRuntimeConfig(event)

  const accessToken = await getValidGoogleAccessToken(config.public.apiBase, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  })

  if (!accessToken) {
    return { synced: false, reason: 'not_connected' }
  }

  const activity = await $fetch<BackendActivityForSync & { userId: string }>(`${config.public.apiBase}/api/Activity/single/${eventId}`).catch(() => null)

  if (!activity || activity.userId !== authUserId) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบกิจกรรมนี้' })
  }

  try {
    console.log('[sync-event] Syncing event:', eventId, 'existing googleEventId:', activity.googleEventId)
    const googleEventId = await upsertGoogleCalendarEvent(accessToken, activity.googleEventId, activityToGoogleEventRow(activity))
    console.log('[sync-event] Google returned event ID:', googleEventId)

    if (googleEventId !== activity.googleEventId) {
      await $fetch(`${config.public.apiBase}/api/Activity/${eventId}/google-sync`, {
        method: 'PUT',
        body: { googleEventId },
      })
      console.log('[sync-event] Updated googleEventId in back_mylife to:', googleEventId)
    }

    return { synced: true }
  } catch (err) {
    console.error('Google Calendar sync-event error:', err)
    return { synced: false, reason: 'google_api_error' }
  }
})
