const LINE_USER_ID_PATTERN = /^U[0-9a-f]{32}$/i
const LINE_LINK_TOKEN_PREFIX = 'mylife-link'
const LINE_LINK_MESSAGE_PREFIX = 'MYLIFE-LINK'
const textEncoder = new TextEncoder()

type LineMetadataCarrier = {
  user_metadata?: Record<string, unknown>
}

export type LineConnectionStatus = {
  connected: boolean
  lineUserId: string
  notificationsEnabled: boolean
  connectedAt: string | null
}

type LineLinkTokenPayload = {
  version: 1
  userId: string
  notificationsEnabled: boolean
  expiresAt: number
}

const parseJsonSafely = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const toBase64Url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  return atob(paddedBase64)
}

const bytesToBinary = (bytes: Uint8Array) => {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return binary
}

const signLineValue = async (value: string, secret: string) => {
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

export const normalizeLineUserId = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim()
  return LINE_USER_ID_PATTERN.test(normalized) ? normalized : ''
}

export const getLineConnectionStatus = (user: LineMetadataCarrier | null | undefined): LineConnectionStatus => {
  const metadata = (user?.user_metadata || {}) as Record<string, unknown>
  const lineUserId = normalizeLineUserId(metadata.line_user_id)

  return {
    connected: Boolean(lineUserId),
    lineUserId,
    notificationsEnabled: lineUserId ? metadata.line_notifications_enabled !== false : false,
    connectedAt: typeof metadata.line_connected_at === 'string' ? metadata.line_connected_at : null,
  }
}

export const withLineConnectionMetadata = (
  user: LineMetadataCarrier,
  lineUserId: string,
  notificationsEnabled = true,
) => ({
  ...(user.user_metadata || {}),
  line_user_id: lineUserId,
  line_notifications_enabled: notificationsEnabled,
  line_connected_at: new Date().toISOString(),
})

export const withoutLineConnectionMetadata = (user: LineMetadataCarrier) => {
  const metadata = { ...(user.user_metadata || {}) } as Record<string, unknown>

  delete metadata.line_user_id
  delete metadata.line_notifications_enabled
  delete metadata.line_connected_at

  return metadata
}

export const createLineLinkToken = async (
  secret: string,
  payload: Omit<LineLinkTokenPayload, 'version'>,
) => {
  const normalizedPayload: LineLinkTokenPayload = {
    version: 1,
    userId: payload.userId,
    notificationsEnabled: payload.notificationsEnabled,
    expiresAt: payload.expiresAt,
  }

  const encodedPayload = toBase64Url(JSON.stringify(normalizedPayload))
  const signature = await signLineValue(encodedPayload, secret)

  return `${LINE_LINK_TOKEN_PREFIX}.${encodedPayload}.${signature}`
}

export const getLineLinkMessage = (token: string) => `${LINE_LINK_MESSAGE_PREFIX} ${token}`

export const extractLineLinkToken = (message: string) => {
  const trimmedMessage = message.trim()

  if (!trimmedMessage) {
    return ''
  }

  if (trimmedMessage.startsWith(`${LINE_LINK_MESSAGE_PREFIX} `)) {
    return trimmedMessage.slice(LINE_LINK_MESSAGE_PREFIX.length).trim()
  }

  return trimmedMessage.startsWith(`${LINE_LINK_TOKEN_PREFIX}.`) ? trimmedMessage : ''
}

export const verifyLineLinkToken = async (token: string, secret: string) => {
  const [prefix, encodedPayload, signature] = token.trim().split('.')

  if (prefix !== LINE_LINK_TOKEN_PREFIX || !encodedPayload || !signature) {
    return null
  }

  const expectedSignature = await signLineValue(encodedPayload, secret)

  if (signature !== expectedSignature) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<LineLinkTokenPayload>

    if (
      payload.version !== 1 ||
      typeof payload.userId !== 'string' ||
      typeof payload.notificationsEnabled !== 'boolean' ||
      typeof payload.expiresAt !== 'number'
    ) {
      return null
    }

    if (payload.expiresAt <= Date.now()) {
      return null
    }

    return payload as LineLinkTokenPayload
  } catch {
    return null
  }
}

export const verifyLineWebhookSignature = async (rawBody: string, signature: string, channelSecret: string) => {
  if (!rawBody || !signature || !channelSecret) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(rawBody))
  const expectedSignature = btoa(bytesToBinary(new Uint8Array(signatureBuffer)))

  return signature === expectedSignature
}

export const pushLineTextMessage = async (
  channelAccessToken: string,
  lineUserId: string,
  message: string,
) => {
  const normalizedMessage = message.trim()

  if (!channelAccessToken.trim()) {
    throw new Error('Missing LINE channel access token')
  }

  if (!normalizeLineUserId(lineUserId)) {
    throw new Error('Invalid LINE user ID')
  }

  if (!normalizedMessage) {
    throw new Error('LINE message is empty')
  }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: normalizedMessage }],
    }),
  })

  if (response.ok) {
    return
  }

  const responseText = await response.text()
  const errorBody = responseText ? parseJsonSafely(responseText) : null
  throw new Error(`LINE push failed (${response.status}): ${JSON.stringify(errorBody)}`)
}

export const replyLineTextMessage = async (
  channelAccessToken: string,
  replyToken: string,
  message: string,
) => {
  const normalizedMessage = message.trim()

  if (!channelAccessToken.trim()) {
    throw new Error('Missing LINE channel access token')
  }

  if (!replyToken.trim()) {
    throw new Error('Missing LINE reply token')
  }

  if (!normalizedMessage) {
    throw new Error('LINE reply message is empty')
  }

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: normalizedMessage }],
    }),
  })

  if (response.ok) {
    return
  }

  const responseText = await response.text()
  const errorBody = responseText ? parseJsonSafely(responseText) : null
  throw new Error(`LINE reply failed (${response.status}): ${JSON.stringify(errorBody)}`)
}