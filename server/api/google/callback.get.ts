import { buildGoogleTokenExpiry, exchangeGoogleCode, verifyGoogleState } from '../../utils/googleCalendar'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''

  if (query.error) {
    const googleErr = String(query.error_description || query.error)
    return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent(`Google: ${googleErr}`)}`)
  }

  if (!code || !state) {
    return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent('ไม่พบ authorization code หรือ state จาก Google')}`)
  }

  const verifiedState = await verifyGoogleState(state, config.google.clientSecret)

  if (!verifiedState) {
    return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent('State หมดอายุ หรือ clientSecret ไม่ตรงกัน')}`)
  }

  const appUrl = (config.public.appUrl || '').replace(/\/+$/, '')
  const redirectUri = `${appUrl}/api/google/callback`

  try {
    const tokens = await exchangeGoogleCode(code, {
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      redirectUri,
    })

    if (!tokens.refresh_token) {
      return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent('Google ไม่ได้ส่ง refresh_token มา กรุณาลบสิทธิ์แอพใน myaccount.google.com/connections ก่อน')}`)
    }

    try {
      await $fetch(`${config.public.apiBase}/api/GoogleCalendar/${verifiedState.userId}`, {
        method: 'PUT',
        body: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: buildGoogleTokenExpiry(tokens.expires_in),
        },
      })
    } catch (backendErr: any) {
      console.error('Save Google connection to backend error:', backendErr)
      const msg = backendErr?.data?.message || backendErr?.statusMessage || backendErr?.message || 'บันทึกลง Backend ไม่สำเร็จ'
      return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent(`Backend (${backendErr?.statusCode || 500}): ${msg}`)}`)
    }

    return sendRedirect(event, '/profile?google=success')
  } catch (err: any) {
    console.error('Google Calendar OAuth callback error:', err)
    const errText = err?.message || 'แลกเปลี่ยน token กับ Google ไม่สำเร็จ'
    return sendRedirect(event, `/profile?google=error&reason=${encodeURIComponent(errText)}`)
  }
})
