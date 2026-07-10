const GOOGLE_STATE_PREFIX = 'mylife-google'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_CALENDAR_EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const TH_TIME_ZONE = 'Asia/Bangkok'
const TOKEN_REFRESH_BUFFER_MS = 60_000

const textEncoder = new TextEncoder()

type GoogleEventType = 'same_day_time' | 'same_day_all_day' | 'multi_day'

export type GoogleEventRow = {
  id: string
  title: string
  description: string | null
  event_type: GoogleEventType
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  reminder_minutes: number | null
}

type GoogleStatePayload = {
  version: 1
  userId: string
  expiresAt: number
}

type GoogleConnectionRow = {
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

type GoogleOAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

const toBase64Url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  return atob(paddedBase64)
}

const bytesToBinary = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return binary
}

const signValue = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
  return toBase64Url(bytesToBinary(new Uint8Array(signatureBuffer)))
}

export const signGoogleState = async (userId: string, secret: string, ttlMs = 10 * 60_000) => {
  const payload: GoogleStatePayload = { version: 1, userId, expiresAt: Date.now() + ttlMs }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await signValue(encodedPayload, secret)
  return `${GOOGLE_STATE_PREFIX}.${encodedPayload}.${signature}`
}

export const verifyGoogleState = async (state: string, secret: string): Promise<{ userId: string } | null> => {
  const [prefix, encodedPayload, signature] = state.trim().split('.')
  if (prefix !== GOOGLE_STATE_PREFIX || !encodedPayload || !signature) return null

  const expectedSignature = await signValue(encodedPayload, secret)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<GoogleStatePayload>
    if (payload.version !== 1 || typeof payload.userId !== 'string' || typeof payload.expiresAt !== 'number') return null
    if (payload.expiresAt <= Date.now()) return null
    return { userId: payload.userId }
  } catch {
    return null
  }
}

export const buildGoogleAuthUrl = (state: string, config: GoogleOAuthConfig) => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

type GoogleTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export const exchangeGoogleCode = async (code: string, config: GoogleOAuthConfig): Promise<GoogleTokenResponse> => {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`)
  }

  return await response.json() as GoogleTokenResponse
}

const refreshGoogleAccessToken = async (refreshToken: string, config: GoogleOAuthConfig): Promise<GoogleTokenResponse | null> => {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) return null
  return await response.json() as GoogleTokenResponse
}

export const revokeGoogleToken = async (token: string) => {
  await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {})
}

export const getValidGoogleAccessToken = async (
  supabaseAdmin: any,
  userId: string,
  config: GoogleOAuthConfig,
): Promise<string | null> => {
  const { data, error } = await supabaseAdmin
    .from('google_calendar_connections')
    .select('user_id, access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  const connection = data as GoogleConnectionRow
  const expiresAt = new Date(connection.token_expires_at).getTime()

  if (expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return connection.access_token
  }

  const refreshed = await refreshGoogleAccessToken(connection.refresh_token, config)

  if (!refreshed) {
    await supabaseAdmin.from('google_calendar_connections').delete().eq('user_id', userId)
    return null
  }

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await supabaseAdmin
    .from('google_calendar_connections')
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiresAt, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return refreshed.access_token
}

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const toGoogleCalendarEvent = (eventRow: GoogleEventRow) => {
  const body: Record<string, unknown> = {
    summary: eventRow.title,
    description: eventRow.description || undefined,
  }

  if (eventRow.event_type === 'same_day_all_day') {
    body.start = { date: eventRow.start_date }
    body.end = { date: addDays(eventRow.start_date, 1) }
  } else if (eventRow.event_type === 'same_day_time') {
    body.start = { dateTime: `${eventRow.start_date}T${eventRow.start_time || '00:00:00'}`, timeZone: TH_TIME_ZONE }
    body.end = { dateTime: `${eventRow.start_date}T${eventRow.end_time || '23:59:59'}`, timeZone: TH_TIME_ZONE }
  } else {
    const endDate = eventRow.end_date || eventRow.start_date
    body.start = { dateTime: `${eventRow.start_date}T${eventRow.start_time || '00:00:00'}`, timeZone: TH_TIME_ZONE }
    body.end = { dateTime: `${endDate}T${eventRow.end_time || '23:59:59'}`, timeZone: TH_TIME_ZONE }
  }

  body.reminders = eventRow.reminder_minutes
    ? { useDefault: false, overrides: [{ method: 'popup', minutes: eventRow.reminder_minutes }] }
    : { useDefault: true }

  return body
}

export const upsertGoogleCalendarEvent = async (
  accessToken: string,
  googleEventId: string | null,
  eventRow: GoogleEventRow,
): Promise<string> => {
  const body = toGoogleCalendarEvent(eventRow)
  const url = googleEventId
    ? `${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/${googleEventId}`
    : GOOGLE_CALENDAR_EVENTS_ENDPOINT
  const method = googleEventId ? 'PATCH' : 'POST'

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Google Calendar upsert failed (${response.status}): ${await response.text()}`)
  }

  const data = await response.json() as { id: string }
  return data.id
}

export const deleteGoogleCalendarEvent = async (accessToken: string, googleEventId: string) => {
  const response = await fetch(`${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/${googleEventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.ok || response.status === 404 || response.status === 410) return

  throw new Error(`Google Calendar delete failed (${response.status}): ${await response.text()}`)
}

export const buildGoogleTokenExpiry = (expiresIn: number) => new Date(Date.now() + expiresIn * 1000).toISOString()
