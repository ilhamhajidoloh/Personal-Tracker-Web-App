const LINE_USER_ID_PATTERN = /^U[0-9a-f]{32}$/i
const LINE_LINK_TOKEN_PREFIX = 'mylife-link'
const LINE_LINK_MESSAGE_PREFIX = 'MYLIFE-LINK'
const textEncoder = new TextEncoder()

export type LineConnectionStatus = {
  connected: boolean
  lineUserId: string
  notificationsEnabled: boolean
  classRemindersEnabled: boolean
  classReminderMinutes: number
  connectedAt: string | null
}

type LineLinkTokenPayload = {
  version: 1
  userId: string
  notificationsEnabled: boolean
  classRemindersEnabled?: boolean
  classReminderMinutes?: number
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

type BackendLineStatus = {
  connected: boolean
  lineUserId: string | null
  notificationsEnabled: boolean
  classRemindersEnabled?: boolean
  classReminderMinutes?: number
  connectedAt: string | null
}

export const getLineConnectionStatus = async (apiBase: string, userId: string, authHeaders: Record<string, string> = {}): Promise<LineConnectionStatus> => {
  const data = await $fetch<BackendLineStatus>(`${apiBase}/api/Line/${userId}`, {
    headers: authHeaders,
  }).catch(() => null)
  if (!data?.connected) return { connected: false, lineUserId: '', notificationsEnabled: false, classRemindersEnabled: false, classReminderMinutes: 15, connectedAt: null }
  return {
    connected: true,
    lineUserId: data.lineUserId || '',
    notificationsEnabled: data.notificationsEnabled,
    classRemindersEnabled: Boolean(data.classRemindersEnabled),
    classReminderMinutes: typeof data.classReminderMinutes === 'number' ? data.classReminderMinutes : 15,
    connectedAt: data.connectedAt,
  }
}

export const createLineLinkToken = async (
  secret: string,
  payload: Omit<LineLinkTokenPayload, 'version'>,
) => {
  if (typeof payload.userId !== 'string' || !payload.userId.trim()) {
    throw new Error('Missing MyLife user ID for LINE link token')
  }

  const normalizedPayload: LineLinkTokenPayload = {
    version: 1,
    userId: payload.userId.trim(),
    notificationsEnabled: payload.notificationsEnabled,
    classRemindersEnabled: payload.classRemindersEnabled ?? false,
    classReminderMinutes: payload.classReminderMinutes ?? 15,
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

export const replyLineMessages = async (
  channelAccessToken: string,
  replyToken: string,
  messages: Record<string, unknown>[],
) => {
  if (!channelAccessToken.trim()) throw new Error('Missing LINE channel access token')
  if (!replyToken.trim()) throw new Error('Missing LINE reply token')
  if (!messages.length) throw new Error('No messages to send')

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })

  if (response.ok) return

  const responseText = await response.text()
  const errorBody = responseText ? parseJsonSafely(responseText) : null
  throw new Error(`LINE reply failed (${response.status}): ${JSON.stringify(errorBody)}`)
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