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

const extractToken = (event: any): string => {
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
