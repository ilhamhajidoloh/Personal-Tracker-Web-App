import { serverSupabaseServiceRole } from '#supabase/server'

import { buildGoogleTokenExpiry, exchangeGoogleCode, verifyGoogleState } from '../../utils/googleCalendar'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''

  if (!code || !state) {
    return sendRedirect(event, '/profile?google=error')
  }

  const verifiedState = await verifyGoogleState(state, config.google.clientSecret)

  if (!verifiedState) {
    return sendRedirect(event, '/profile?google=error')
  }

  const redirectUri = `${config.public.appUrl}/api/google/callback`

  try {
    const tokens = await exchangeGoogleCode(code, {
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      redirectUri,
    })

    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on first consent; if the user had already
      // granted access before revoking app access from the MyLife side (not Google's),
      // ask them to remove MyLife from https://myaccount.google.com/permissions and retry.
      return sendRedirect(event, '/profile?google=error')
    }

    const supabaseAdmin = serverSupabaseServiceRole(event)
    const { error } = await supabaseAdmin.from('google_calendar_connections').upsert({
      user_id: verifiedState.userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: buildGoogleTokenExpiry(tokens.expires_in),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return sendRedirect(event, '/profile?google=success')
  } catch (err) {
    console.error('Google Calendar OAuth callback error:', err)
    return sendRedirect(event, '/profile?google=error')
  }
})
