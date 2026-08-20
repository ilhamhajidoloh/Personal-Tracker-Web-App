import { requireBackendUserId } from '../../utils/auth'
import { buildGoogleAuthUrl, signGoogleState } from '../../utils/googleCalendar'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)

  const config = useRuntimeConfig(event)

  if (!config.google.clientId || !config.google.clientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_GOOGLE_CLIENT_ID / NUXT_GOOGLE_CLIENT_SECRET',
    })
  }

  const appUrl = (config.public.appUrl || '').replace(/\/+$/, '')
  const redirectUri = `${appUrl}/api/google/callback`
  const state = await signGoogleState(authUserId, config.google.clientSecret)
  const authUrl = buildGoogleAuthUrl(state, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri,
  })

  return sendRedirect(event, authUrl)
})
