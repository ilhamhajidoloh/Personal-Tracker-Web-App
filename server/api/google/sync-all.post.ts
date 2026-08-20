import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'
import { activityToGoogleEventRow, getValidGoogleAccessToken, upsertGoogleCalendarEvent, type BackendActivityForSync } from '../../utils/googleCalendar'

type SyncAllResponse = {
  success: boolean
  processedCount: number
  failedCount: number
  reason?: string
}

export default defineEventHandler(async (event): Promise<SyncAllResponse> => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  const accessToken = await getValidGoogleAccessToken(config.public.apiBase, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  }, authHeaders)

  if (!accessToken) {
    return { success: false, processedCount: 0, failedCount: 0, reason: 'not_connected' }
  }

  // Fetch all activities for the user that have never been synced to Google
  const allActivities = await $fetch<BackendActivityForSync[]>(
    `${config.public.apiBase}/api/Activity/${authUserId}`,
    { headers: authHeaders },
  ).catch((err) => {
    console.error('Google Calendar sync-all fetch error:', err)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลกิจกรรมได้' })
  })

  const pendingActivities = allActivities.filter(a => !a.googleEventId)

  if (pendingActivities.length === 0) {
    return { success: true, processedCount: 0, failedCount: 0 }
  }

  let processedCount = 0
  let failedCount = 0

  for (const activity of pendingActivities) {
    try {
      const googleEventId = await upsertGoogleCalendarEvent(
        accessToken,
        null,
        activityToGoogleEventRow(activity),
      )

      if (googleEventId) {
        try {
          await $fetch(`${config.public.apiBase}/api/Activity/${activity.id}/google-sync`, {
            method: 'PUT',
            headers: authHeaders,
            body: { googleEventId },
          })
          processedCount++
        } catch (updateErr) {
          console.error(`Failed to update googleEventId for activity ${activity.id}:`, updateErr)
          // We still count it as failed because DB sync didn't persist
          failedCount++
        }
      } else {
        failedCount++
      }
    } catch (err) {
      console.error(`Failed to sync activity ${activity.id} to Google Calendar:`, err)
      failedCount++
    }
  }

  return {
    success: failedCount === 0,
    processedCount,
    failedCount,
  }
})
