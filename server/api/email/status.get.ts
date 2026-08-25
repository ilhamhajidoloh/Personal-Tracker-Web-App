import { getBackendUserId, verifyBackendJwt, extractToken } from '../../utils/auth'

export type EmailStatusResponse = {
  configured: boolean
  smtpHost: string
  smtpPort: number
  smtpUserMasked: string
  userEmail: string
}

export default defineEventHandler(async (event): Promise<EmailStatusResponse> => {
  const config = useRuntimeConfig(event)
  const token = extractToken(event)
  let userEmail = ''

  if (token && config.jwt?.key) {
    const payload = await verifyBackendJwt(token, {
      key: config.jwt.key,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    })
    userEmail = payload?.email || ''
  }

  const smtpUser = config.smtp?.user || ''
  const smtpPass = config.smtp?.pass || ''
  const configured = Boolean(smtpUser && smtpPass)

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return ''
    const [name, domain] = email.split('@')
    if (name.length <= 2) return `${name}***@${domain}`
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`
  }

  return {
    configured,
    smtpHost: config.smtp?.host || 'smtp.gmail.com',
    smtpPort: Number(config.smtp?.port) || 465,
    smtpUserMasked: maskEmail(smtpUser),
    userEmail,
  }
})
