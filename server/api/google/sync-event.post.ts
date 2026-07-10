import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'
import { getValidGoogleAccessToken, upsertGoogleCalendarEvent, type GoogleEventRow } from '../../utils/googleCalendar'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

type SyncEventBody = {
  eventId?: string
}

type SyncEventResponse = {
  synced: boolean
  reason?: string
}

export default defineEventHandler(async (event): Promise<SyncEventResponse> => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null
  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })
  }

  const body = await readBody<SyncEventBody>(event)
  const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : ''

  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบ eventId' })
  }

  const config = useRuntimeConfig(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const accessToken = await getValidGoogleAccessToken(supabaseAdmin, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  })

  if (!accessToken) {
    return { synced: false, reason: 'not_connected' }
  }

  const { data: eventRowData, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id, user_id, title, description, event_type, start_date, start_time, end_date, end_time, reminder_minutes, google_event_id')
    .eq('id', eventId)
    .eq('user_id', authUserId)
    .maybeSingle()

  if (eventError || !eventRowData) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบกิจกรรมนี้' })
  }

  const eventRow = eventRowData as GoogleEventRow & { user_id: string; google_event_id: string | null }

  try {
    const googleEventId = await upsertGoogleCalendarEvent(accessToken, eventRow.google_event_id, eventRow)

    if (googleEventId !== eventRow.google_event_id) {
      await supabaseAdmin.from('events').update({ google_event_id: googleEventId }).eq('id', eventId)
    }

    return { synced: true }
  } catch (err) {
    console.error('Google Calendar sync-event error:', err)
    return { synced: false, reason: 'google_api_error' }
  }
})
