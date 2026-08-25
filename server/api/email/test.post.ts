import { extractToken, verifyBackendJwt } from '../../utils/auth'
import { buildTestEmail, createEmailTransporter } from '../../utils/email'

type EmailTestBody = {
  to?: string
  smtpUser?: string
  smtpPass?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<EmailTestBody>(event).catch(() => ({} as EmailTestBody))

  // Determine recipient
  let recipientEmail = body?.to?.trim()

  if (!recipientEmail) {
    const token = extractToken(event)
    if (token && config.jwt?.key) {
      const payload = await verifyBackendJwt(token, {
        key: config.jwt.key,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      })
      recipientEmail = payload?.email || ''
    }
  }

  // Fallback to configured SMTP user if no recipient provided
  if (!recipientEmail) {
    recipientEmail = body?.smtpUser?.trim() || config.smtp?.user || ''
  }

  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'กรุณาระบุอีเมลผู้รับที่ถูกต้อง',
    })
  }

  const smtpUser = body?.smtpUser?.trim() || config.smtp?.user || ''
  const smtpPass = (body?.smtpPass || config.smtp?.pass || '').replace(/\s+/g, '')

  if (!smtpUser || !smtpPass) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ยังไม่ได้ระบุ Gmail Address หรือ App Password',
    })
  }

  const host = config.smtp?.host || 'smtp.gmail.com'
  const port = Number(config.smtp?.port) || 465
  const secure = config.smtp?.secure ?? (port === 465)

  try {
    const transporter = createEmailTransporter({
      host,
      port,
      secure,
      user: smtpUser,
      pass: smtpPass,
    })

    // Verify SMTP connection first
    await transporter.verify()

    const appUrl = config.public?.appUrl || 'http://localhost:3000'
    const mail = buildTestEmail(recipientEmail, appUrl)
    const defaultFrom = config.smtp?.from || `"MyLife App" <${smtpUser}>`

    const info = await transporter.sendMail({
      from: defaultFrom,
      to: recipientEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })

    return {
      success: true,
      message: `ส่งอีเมลทดสอบไปยัง ${recipientEmail} สำเร็จเรียบร้อยแล้ว`,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('SMTP test error:', error)
    const errCode = error?.code || ''
    let friendlyMessage = error?.message || 'ไม่สามารถส่งอีเมลได้'

    if (errCode === 'EAUTH' || friendlyMessage.includes('Invalid login') || friendlyMessage.includes('Username and Password not accepted')) {
      friendlyMessage = 'การยืนยันตัวตนล้มเหลว: กรุณาตรวจสอบ Gmail Address และ App Password 16 หลัก ให้ถูกต้อง'
    } else if (errCode === 'ESOCKET' || errCode === 'ETIMEDOUT' || errCode === 'ECONNREFUSED') {
      friendlyMessage = 'ไม่สามารถเชื่อมต่อไปยัง smtp.gmail.com ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือพอร์ต'
    }

    throw createError({
      statusCode: 500,
      statusMessage: friendlyMessage,
    })
  }
})
