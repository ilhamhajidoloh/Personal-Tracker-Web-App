import { serverSupabaseUser } from '#supabase/server'

import { getAuthUserId } from '../../utils/line'
import { buildGoogleAuthUrl, signGoogleState } from '../../utils/googleCalendar'

type GoogleAuthUser = {
  id?: string
  sub?: string
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event) as GoogleAuthUser | null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ Google Calendar',
    })
  }

  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่พบรหัสผู้ใช้สำหรับเชื่อมต่อ Google Calendar',
    })
  }

  const config = useRuntimeConfig(event)

  if (!config.google.clientId || !config.google.clientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_GOOGLE_CLIENT_ID / NUXT_GOOGLE_CLIENT_SECRET',
    })
  }

  const redirectUri = `${config.public.appUrl}/api/google/callback`
  const state = await signGoogleState(authUserId, config.google.clientSecret)
  const authUrl = buildGoogleAuthUrl(state, {
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri,
  })

  return sendRedirect(event, authUrl)
})
