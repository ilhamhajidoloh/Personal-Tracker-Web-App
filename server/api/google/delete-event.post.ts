import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'
import { deleteGoogleCalendarEvent, getValidGoogleAccessToken } from '../../utils/googleCalendar'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

type DeleteEventBody = {
  googleEventId?: string
}

type DeleteEventResponse = {
  deleted: boolean
  reason?: string
}

export default defineEventHandler(async (event): Promise<DeleteEventResponse> => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null
  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })
  }

  const body = await readBody<DeleteEventBody>(event)
  const googleEventId = typeof body?.googleEventId === 'string' ? body.googleEventId.trim() : ''

  if (!googleEventId) {
    return { deleted: false, reason: 'no_google_event_id' }
  }

  const config = useRuntimeConfig(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const accessToken = await getValidGoogleAccessToken(supabaseAdmin, authUserId, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: `${config.public.appUrl}/api/google/callback`,
  })

  if (!accessToken) {
    return { deleted: false, reason: 'not_connected' }
  }

  try {
    await deleteGoogleCalendarEvent(accessToken, googleEventId)
    return { deleted: true }
  } catch (err) {
    console.error('Google Calendar delete-event error:', err)
    return { deleted: false, reason: 'google_api_error' }
  }
})
