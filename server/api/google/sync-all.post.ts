import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'
import { getValidGoogleAccessToken, upsertGoogleCalendarEvent, type GoogleEventRow } from '../../utils/googleCalendar'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

type SyncAllResponse = {
  success: boolean
  processedCount: number
  failedCount: number
  reason?: string
}

export default defineEventHandler(async (event): Promise<SyncAllResponse> => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null
  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })
  }

  const config = useRuntimeConfig(event)
  const supabaseAdmin = serverSupabaseServiceRole(event) as any

  const accessToken = await getValidGoogleAccessToken(supabaseAdmin, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  })

  if (!accessToken) {
    return { success: false, processedCount: 0, failedCount: 0, reason: 'not_connected' }
  }

  // Fetch all events for the user where google_event_id is null
  const { data: events, error: dbError } = await supabaseAdmin
    .from('events')
    .select('id, user_id, title, description, event_type, start_date, start_time, end_date, end_time, reminder_minutes, google_event_id')
    .eq('user_id', authUserId)
    .is('google_event_id', null)

  if (dbError) {
    console.error('Google Calendar sync-all DB error:', dbError)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลกิจกรรมได้' })
  }

  if (!events || events.length === 0) {
    return { success: true, processedCount: 0, failedCount: 0 }
  }

  let processedCount = 0
  let failedCount = 0

  for (const eventRow of events) {
    try {
      const googleEventId = await upsertGoogleCalendarEvent(
        accessToken,
        null,
        eventRow as GoogleEventRow
      )

      if (googleEventId) {
        const { error: updateError } = await supabaseAdmin
          .from('events')
          .update({ google_event_id: googleEventId })
          .eq('id', eventRow.id)

        if (updateError) {
          console.error(`Failed to update google_event_id for event ${eventRow.id}:`, updateError)
          // We still count it as failed because DB sync didn't persist
          failedCount++
        } else {
          processedCount++
        }
      } else {
        failedCount++
      }
    } catch (err) {
      console.error(`Failed to sync event ${eventRow.id} to Google Calendar:`, err)
      failedCount++
    }
  }

  return {
    success: failedCount === 0,
    processedCount,
    failedCount,
  }
})
