import { extractToken, verifyBackendJwt } from '../../utils/auth'
import {
  buildBillReminderEmail,
  buildClassReminderEmail,
  buildEventReminderEmail,
  buildTaskReminderEmail,
  buildTodoReminderEmail,
  sendEmail,
} from '../../utils/email'

type NotifyBody = {
  type: 'class' | 'event' | 'todo' | 'task' | 'bill' | 'custom'
  to?: string
  payload?: any
  subject?: string
  html?: string
  text?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<NotifyBody>(event)

  if (!body || !body.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'กรุณาระบุประเภทการแจ้งเตือน (type)',
    })
  }

  // Check if SMTP is configured
  if (!config.smtp?.user || !config.smtp?.pass) {
    return {
      sent: false,
      skipped: true,
      reason: 'smtp_not_configured',
    }
  }

  // Determine recipient
  let recipientEmail = body.to?.trim()
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

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return {
      sent: false,
      skipped: true,
      reason: 'no_recipient_email',
    }
  }

  const appUrl = config.public?.appUrl || 'http://localhost:3000'
  let emailContent: { subject: string; html: string; text?: string }

  switch (body.type) {
    case 'class':
      emailContent = buildClassReminderEmail(body.payload, appUrl)
      break
    case 'event':
      emailContent = buildEventReminderEmail(body.payload, appUrl)
      break
    case 'todo':
      emailContent = buildTodoReminderEmail(body.payload, appUrl)
      break
    case 'task':
      emailContent = buildTaskReminderEmail(body.payload, appUrl)
      break
    case 'bill':
      emailContent = buildBillReminderEmail(body.payload, appUrl)
      break
    case 'custom':
      emailContent = {
        subject: body.subject || '🔔 [MyLife] แจ้งเตือนจากระบบ',
        html: body.html || `<p>${body.text || ''}</p>`,
        text: body.text,
      }
      break
    default:
      throw createError({
        statusCode: 400,
        statusMessage: `ไม่รองรับประเภทการแจ้งเตือน: ${body.type}`,
      })
  }

  try {
    const info = await sendEmail(
      {
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
      config,
    )

    return {
      sent: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send email notification:', error)
    return {
      sent: false,
      skipped: false,
      error: error?.message || 'ส่งอีเมลไม่สำเร็จ',
    }
  }
})
