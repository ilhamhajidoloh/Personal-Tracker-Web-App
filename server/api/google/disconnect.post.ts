import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'
import { revokeGoogleToken } from '../../utils/googleCalendar'
import type { GoogleCalendarStatus } from './status.get'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

export default defineEventHandler(async (event): Promise<GoogleCalendarStatus> => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null
  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนยกเลิกการเชื่อมต่อ Google Calendar',
    })
  }

  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { data } = await supabaseAdmin
    .from('google_calendar_connections')
    .select('access_token, refresh_token')
    .eq('user_id', authUserId)
    .maybeSingle()

  if (data) {
    const connection = data as { access_token: string; refresh_token: string }
    await revokeGoogleToken(connection.refresh_token || connection.access_token)
    await supabaseAdmin.from('google_calendar_connections').delete().eq('user_id', authUserId)
  }

  return { connected: false, connectedAt: null }
})
