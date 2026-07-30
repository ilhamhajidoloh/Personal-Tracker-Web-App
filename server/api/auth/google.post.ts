import { OAuth2Client } from 'google-auth-library'

type GoogleSignInBody = {
  idToken?: string
}

type BackendSocialLoginResponse = {
  message: string
  token: string
  userId: string
  email: string
  fullName: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.google.clientId) {
    throw createError({ statusCode: 500, statusMessage: 'ยังไม่ได้ตั้งค่า NUXT_GOOGLE_CLIENT_ID' })
  }

  const body = await readBody<GoogleSignInBody>(event)
  const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : ''

  if (!idToken) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบ Google ID token' })
  }

  const client = new OAuth2Client(config.google.clientId)

  let payload: { sub?: string; email?: string; name?: string } | undefined
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: config.google.clientId })
    payload = ticket.getPayload()
  } catch (err) {
    console.error('Google ID token verification failed:', err)
    throw createError({ statusCode: 401, statusMessage: 'Google ID token ไม่ถูกต้อง' })
  }

  if (!payload?.sub || !payload.email) {
    throw createError({ statusCode: 401, statusMessage: 'ไม่พบข้อมูลผู้ใช้จาก Google' })
  }

  const response = await $fetch<BackendSocialLoginResponse>(`${config.public.apiBase}/api/Auth/social-login`, {
    method: 'POST',
    body: {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email.split('@')[0],
    },
  }).catch((err) => {
    console.error('back_mylife social-login error:', err)
    throw createError({ statusCode: 502, statusMessage: 'เข้าสู่ระบบผ่าน Google ไม่สำเร็จ' })
  })

  return response
})
