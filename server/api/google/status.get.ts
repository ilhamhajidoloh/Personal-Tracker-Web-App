import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

export type GoogleCalendarStatus = {
  connected: boolean
  connectedAt: string | null
}

export default defineEventHandler(async (event): Promise<GoogleCalendarStatus> => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null
  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    return { connected: false, connectedAt: null }
  }

  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { data } = await supabaseAdmin
    .from('google_calendar_connections')
    .select('created_at')
    .eq('user_id', authUserId)
    .maybeSingle()

  return {
    connected: Boolean(data),
    connectedAt: (data as { created_at?: string } | null)?.created_at || null,
  }
})
