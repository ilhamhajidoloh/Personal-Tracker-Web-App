const textEncoder = new TextEncoder()

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  return atob(paddedBase64)
}

export type BackendJwtPayload = {
  sub: string
  email: string
  fullName: string
  jti: string
  exp: number
  iss: string
  aud: string
}

type JwtVerifyConfig = { key: string; issuer: string; audience: string }

export const verifyBackendJwt = async (token: string, config: JwtVerifyConfig): Promise<BackendJwtPayload | null> => {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(config.key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const signatureBinary = fromBase64Url(signatureB64)
    const signatureBytes = Uint8Array.from(signatureBinary, c => c.charCodeAt(0))

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      textEncoder.encode(`${headerB64}.${payloadB64}`),
    )
    if (!isValid) return null

    const payload = JSON.parse(fromBase64Url(payloadB64)) as Partial<BackendJwtPayload>
    if (typeof payload.sub !== 'string' || !payload.sub) return null
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null
    if (config.issuer && payload.iss !== config.issuer) return null
    if (config.audience && payload.aud !== config.audience) return null

    return payload as BackendJwtPayload
  } catch {
    return null
  }
}

export const extractToken = (event: any): string => {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  const cookieValue = getCookie(event, 'auth_session')
  if (!cookieValue) return ''

  const tryParse = (raw: string) => {
    try {
      const session = JSON.parse(raw) as { token?: string }
      return typeof session?.token === 'string' ? session.token : ''
    } catch {
      return ''
    }
  }

  return tryParse(cookieValue) || tryParse(decodeURIComponent(cookieValue))
}

const toBase64Url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const bytesToBinary = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return binary
}

export const createBackendJwt = async (
  userId: string,
  config: JwtVerifyConfig,
  ttlSeconds = 3600,
): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: userId,
    email: '',
    fullName: '',
    jti: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    iat: now,
    nbf: now - 5,
    exp: now + ttlSeconds,
    iss: config.issuer || 'mylife-app',
    aud: config.audience || 'mylife-app',
  }

  const headerB64 = toBase64Url(JSON.stringify(header))
  const payloadB64 = toBase64Url(JSON.stringify(payload))
  const unsignedToken = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(config.key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(unsignedToken))
  const signatureB64 = toBase64Url(bytesToBinary(new Uint8Array(signatureBuffer)))

  return `${unsignedToken}.${signatureB64}`
}

export const getBackendAuthHeader = async (event?: any, userId?: string): Promise<Record<string, string>> => {
  let token = ''
  if (event) {
    token = extractToken(event)
  }

  if (!token && userId) {
    try {
      const config = useRuntimeConfig(event)
      if (config.jwt?.key) {
        token = await createBackendJwt(userId, {
          key: config.jwt.key,
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        })
      }
    } catch (e) {
      console.error('Failed to create server backend JWT:', e)
    }
  }

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getBackendUserId = async (event: any): Promise<string> => {
  const token = extractToken(event)
  if (!token) return ''

  const config = useRuntimeConfig(event)
  const payload = await verifyBackendJwt(token, {
    key: config.jwt.key,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  })

  return payload?.sub || ''
}

export const requireBackendUserId = async (event: any): Promise<string> => {
  const userId = await getBackendUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })
  }
  return userId
}
