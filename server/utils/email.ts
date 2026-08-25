import nodemailer from 'nodemailer'

export type EmailConnectionStatus = {
  configured: boolean
  smtpUser: string
  smtpHost: string
  recipientEmail: string
  notificationsEnabled: boolean
  classRemindersEnabled: boolean
  classReminderMinutes: number
  eventRemindersEnabled: boolean
  taskRemindersEnabled: boolean
  billRemindersEnabled: boolean
}

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export type ClassEmailPayload = {
  courseName: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room?: string | null
  instructor?: string | null
  minutesBefore: number
}

export type EventEmailPayload = {
  title: string
  eventType: 'same_day_time' | 'same_day_all_day' | 'multi_day'
  startDate: string
  startTime?: string | null
  endDate?: string | null
  endTime?: string | null
  location?: string | null
  description?: string | null
  reminderMinutes?: number | null
  isEditing?: boolean
}

export type TodoEmailPayload = {
  title: string
  targetDate?: string | null
  priority: 'low' | 'medium' | 'high'
  status?: string
  isEditing?: boolean
}

export type TaskEmailPayload = {
  title: string
  courseName?: string | null
  deadline: string
  isUrgent?: boolean
}

export type BillEmailPayload = {
  title: string
  amount: number
  dueDay: number
  dueDateFormatted: string
  isIncome?: boolean
}

const formatThaiDate = (dateString?: string | null) => {
  if (!dateString) return 'ยังไม่กำหนด'
  try {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

const formatThaiTime = (timeString?: string | null) => {
  if (!timeString) return ''
  return `${timeString.slice(0, 5)} น.`
}

const dayOfWeekLabelMap: Record<string, string> = {
  monday: 'จันทร์',
  tuesday: 'อังคาร',
  wednesday: 'พุธ',
  thursday: 'พฤหัสบดี',
  friday: 'ศุกร์',
  saturday: 'เสาร์',
  sunday: 'อาทิตย์',
}

const priorityLabelMap: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'ด่วนมาก 🔥', color: '#ef4444', bg: '#fee2e2' },
  medium: { label: 'ปานกลาง ⚡', color: '#f59e0b', bg: '#fef3c7' },
  low: { label: 'ปกติ 🟢', color: '#10b981', bg: '#d1fae5' },
}

const eventTypeLabelMap: Record<string, string> = {
  same_day_time: 'วันเดียวมีเวลา',
  same_day_all_day: 'วันเดียวทั้งวัน',
  multi_day: 'หลายวัน',
}

// ── Transporter Factory ──────────────────────────────────────────────────────

export const createEmailTransporter = (smtpConfig: {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
}) => {
  const host = smtpConfig.host || 'smtp.gmail.com'
  const port = Number(smtpConfig.port) || (smtpConfig.secure ? 465 : 587)
  const secure = smtpConfig.secure ?? (port === 465)
  const user = (smtpConfig.user || '').trim()
  // Clean app password (remove spaces)
  const pass = (smtpConfig.pass || '').replace(/\s+/g, '')

  if (!user || !pass) {
    throw new Error('Gmail SMTP credentials (user / pass) are not configured')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export const sendEmail = async (
  options: SendEmailOptions,
  runtimeConfig: any,
) => {
  const smtp = runtimeConfig?.smtp || {}
  const transporter = createEmailTransporter(smtp)

  const defaultFrom = smtp.from || `"MyLife App" <${smtp.user}>`
  const mailOptions = {
    from: options.from || defaultFrom,
    to: options.to,
    subject: options.subject,
    text: options.text || options.html.replace(/<[^>]+>/g, ''),
    html: options.html,
  }

  return await transporter.sendMail(mailOptions)
}

// ── Base HTML Email Layout ───────────────────────────────────────────────────

const wrapEmailLayout = (contentHtml: string, appUrl = 'http://localhost:3000') => `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyLife Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
      padding: 24px 28px;
      text-align: left;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .header-sub {
      color: rgba(255, 255, 255, 0.85);
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
    }
    .content {
      padding: 28px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .card-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 13.5px;
    }
    .item-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .item-label {
      color: #94a3b8;
      font-weight: 500;
    }
    .item-val {
      color: #f8fafc;
      font-weight: 600;
      text-align: right;
    }
    .btn-action {
      display: block;
      width: 100%;
      text-align: center;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 700;
      padding: 13px 20px;
      border-radius: 12px;
      text-decoration: none;
      margin-top: 24px;
      box-sizing: border-box;
    }
    .footer {
      padding: 20px 28px;
      background: #111827;
      border-top: 1px solid #1f2937;
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">✨ MyLife Personal Tracker</div>
        <div class="header-sub">ระบบแจ้งเตือนอัตโนมัติ</div>
      </div>
      <div class="content">
        ${contentHtml}
        <a href="${appUrl}" target="_blank" class="btn-action">🚀 เปิดแอป MyLife</a>
      </div>
      <div class="footer">
        อีเมลนี้ส่งโดยระบบอัตโนมัติของ <a href="${appUrl}">MyLife Web Application</a><br>
        คุณได้รับการแจ้งเตือนนี้เนื่องจากเปิดใช้งานการแจ้งเตือนทาง Email ไว้
      </div>
    </div>
  </div>
</body>
</html>
`

// ── Email Builders ───────────────────────────────────────────────────────────

export const buildClassReminderEmail = (payload: ClassEmailPayload, appUrl?: string) => {
  const dayLabel = dayOfWeekLabelMap[payload.dayOfWeek.toLowerCase()] || payload.dayOfWeek
  const timeRange = `${payload.startTime.slice(0, 5)} - ${payload.endTime.slice(0, 5)} น.`

  const html = wrapEmailLayout(`
    <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4);">
      📚 แจ้งเตือนคาบเรียน
    </span>
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff; font-weight: 800;">
      ${payload.courseName}
    </h2>
    <p style="margin: 0; color: #94a3b8; font-size: 13.5px;">
      ⏰ คาบเรียนจะเริ่มในอีก <strong style="color: #38bdf8;">${payload.minutesBefore} นาที</strong>
    </p>

    <div class="card-box">
      <div class="item-row">
        <span class="item-label">📅 วันเรียน</span>
        <span class="item-val">วัน${dayLabel}</span>
      </div>
      <div class="item-row">
        <span class="item-label">🕐 เวลา</span>
        <span class="item-val">${timeRange}</span>
      </div>
      ${payload.room ? `
      <div class="item-row">
        <span class="item-label">📍 ห้องเรียน</span>
        <span class="item-val">${payload.room}</span>
      </div>` : ''}
      ${payload.instructor ? `
      <div class="item-row">
        <span class="item-label">👨‍🏫 ผู้สอน</span>
        <span class="item-val">${payload.instructor}</span>
      </div>` : ''}
    </div>
  `, appUrl)

  const text = [
    `🔔 [MyLife] แจ้งเตือนคาบเรียน: ${payload.courseName}`,
    `⏰ คาบเรียนจะเริ่มในอีก ${payload.minutesBefore} นาที`,
    `📅 วัน${dayLabel} | เวลา: ${timeRange}`,
    payload.room ? `📍 ห้องเรียน: ${payload.room}` : '',
    payload.instructor ? `👨‍🏫 ผู้สอน: ${payload.instructor}` : '',
    `\nเปิดแอป MyLife: ${appUrl || 'http://localhost:3000'}`,
  ].filter(Boolean).join('\n')

  return {
    subject: `🔔 [MyLife] แจ้งเตือนคาบเรียน: ${payload.courseName} (${timeRange})`,
    html,
    text,
  }
}

export const buildEventReminderEmail = (payload: EventEmailPayload, appUrl?: string) => {
  const actionText = payload.isEditing ? 'อัปเดตกิจกรรม' : 'แจ้งเตือนกิจกรรม'
  const timeSummary = payload.eventType === 'same_day_all_day'
    ? `${formatThaiDate(payload.startDate)} (ตลอดวัน)`
    : (payload.eventType === 'same_day_time'
      ? `${formatThaiDate(payload.startDate)} ${formatThaiTime(payload.startTime)} - ${formatThaiTime(payload.endTime)}`
      : `${formatThaiDate(payload.startDate)} ${formatThaiTime(payload.startTime)} ถึง ${formatThaiDate(payload.endDate)} ${formatThaiTime(payload.endTime)}`)

  const html = wrapEmailLayout(`
    <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);">
      📅 ${actionText}
    </span>
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff; font-weight: 800;">
      ${payload.title}
    </h2>
    <p style="margin: 0; color: #94a3b8; font-size: 13.5px;">
      รูปแบบ: <strong style="color: #f8fafc;">${eventTypeLabelMap[payload.eventType] || payload.eventType}</strong>
    </p>

    <div class="card-box">
      <div class="item-row">
        <span class="item-label">🕐 เวลา</span>
        <span class="item-val">${timeSummary}</span>
      </div>
      ${payload.location ? `
      <div class="item-row">
        <span class="item-label">📍 สถานที่</span>
        <span class="item-val">${payload.location}</span>
      </div>` : ''}
      ${payload.description ? `
      <div class="item-row" style="flex-direction: column; gap: 4px;">
        <span class="item-label">📝 รายละเอียด</span>
        <span class="item-val" style="text-align: left; font-weight: 400; color: #cbd5e1;">${payload.description}</span>
      </div>` : ''}
    </div>
  `, appUrl)

  const text = [
    `📅 [MyLife] ${actionText}: ${payload.title}`,
    `🕐 เวลา: ${timeSummary}`,
    payload.location ? `📍 สถานที่: ${payload.location}` : '',
    payload.description ? `📝 รายละเอียด: ${payload.description}` : '',
    `\nเปิดแอป MyLife: ${appUrl || 'http://localhost:3000'}`,
  ].filter(Boolean).join('\n')

  return {
    subject: `📅 [MyLife] ${actionText}: ${payload.title}`,
    html,
    text,
  }
}

export const buildTodoReminderEmail = (payload: TodoEmailPayload, appUrl?: string) => {
  const pri = priorityLabelMap[payload.priority] || priorityLabelMap.medium
  const actionText = payload.isEditing ? 'อัปเดตงาน' : 'แจ้งเตือนสิ่งที่ต้องทำ'

  const html = wrapEmailLayout(`
    <span class="badge" style="background: ${pri.bg}; color: ${pri.color};">
      ✅ ${actionText}
    </span>
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff; font-weight: 800;">
      ${payload.title}
    </h2>

    <div class="card-box">
      <div class="item-row">
        <span class="item-label">📅 กำหนดส่ง</span>
        <span class="item-val">${formatThaiDate(payload.targetDate)}</span>
      </div>
      <div class="item-row">
        <span class="item-label">🔥 ความสำคัญ</span>
        <span class="item-val" style="color: ${pri.color};">${pri.label}</span>
      </div>
      ${payload.status ? `
      <div class="item-row">
        <span class="item-label">📊 สถานะ</span>
        <span class="item-val">${payload.status}</span>
      </div>` : ''}
    </div>
  `, appUrl)

  const text = [
    `✅ [MyLife] ${actionText}: ${payload.title}`,
    `📅 กำหนดส่ง: ${formatThaiDate(payload.targetDate)}`,
    `🔥 ความสำคัญ: ${pri.label}`,
    `\nเปิดแอป MyLife: ${appUrl || 'http://localhost:3000'}`,
  ].join('\n')

  return {
    subject: `✅ [MyLife] ${actionText}: ${payload.title}`,
    html,
    text,
  }
}

export const buildTaskReminderEmail = (payload: TaskEmailPayload, appUrl?: string) => {
  const html = wrapEmailLayout(`
    <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">
      🚨 แจ้งเตือนงานใกล้ครบกำหนด
    </span>
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff; font-weight: 800;">
      ${payload.title}
    </h2>

    <div class="card-box">
      ${payload.courseName ? `
      <div class="item-row">
        <span class="item-label">📚 วิชา</span>
        <span class="item-val">${payload.courseName}</span>
      </div>` : ''}
      <div class="item-row">
        <span class="item-label">⏰ กำหนดส่ง</span>
        <span class="item-val" style="color: #f87171;">${formatThaiDate(payload.deadline)}</span>
      </div>
      <div class="item-row">
        <span class="item-label">🔥 ระดับความเร่งด่วน</span>
        <span class="item-val" style="color: ${payload.isUrgent ? '#ef4444' : '#f59e0b'};">
          ${payload.isUrgent ? 'ด่วนมาก (Urgent)' : 'ปกติ'}
        </span>
      </div>
    </div>
  `, appUrl)

  const text = [
    `🚨 [MyLife] แจ้งเตือนงานใกล้ครบกำหนด: ${payload.title}`,
    payload.courseName ? `📚 วิชา: ${payload.courseName}` : '',
    `⏰ กำหนดส่ง: ${formatThaiDate(payload.deadline)}`,
    `\nเปิดแอป MyLife: ${appUrl || 'http://localhost:3000'}`,
  ].filter(Boolean).join('\n')

  return {
    subject: `🚨 [MyLife] แจ้งเตือนงานใกล้กำหนดส่ง: ${payload.title}`,
    html,
    text,
  }
}

export const buildBillReminderEmail = (payload: BillEmailPayload, appUrl?: string) => {
  const typeText = payload.isIncome ? 'รายรับประจำ' : 'บิล/รายจ่ายประจำ'
  const color = payload.isIncome ? '#10b981' : '#f43f5e'

  const html = wrapEmailLayout(`
    <span class="badge" style="background: rgba(244, 63, 94, 0.2); color: ${color}; border: 1px solid rgba(244, 63, 94, 0.4);">
      💳 แจ้งเตือน ${typeText}
    </span>
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff; font-weight: 800;">
      ${payload.title}
    </h2>

    <div class="card-box">
      <div class="item-row">
        <span class="item-label">💵 จำนวนเงิน</span>
        <span class="item-val" style="font-size: 16px; color: ${color};">฿${payload.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="item-row">
        <span class="item-label">📅 วันที่ครบกำหนด</span>
        <span class="item-val">${payload.dueDateFormatted} (ทุกวันที่ ${payload.dueDay} ของเดือน)</span>
      </div>
    </div>
  `, appUrl)

  const text = [
    `💳 [MyLife] แจ้งเตือน ${typeText}: ${payload.title}`,
    `💵 จำนวนเงิน: ฿${payload.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
    `📅 วันที่ครบกำหนด: ${payload.dueDateFormatted}`,
    `\nเปิดแอป MyLife: ${appUrl || 'http://localhost:3000'}`,
  ].join('\n')

  return {
    subject: `💳 [MyLife] แจ้งเตือน ${typeText}: ${payload.title} (฿${payload.amount.toLocaleString('th-TH')})`,
    html,
    text,
  }
}

export const buildTestEmail = (targetEmail: string, appUrl?: string) => {
  const html = wrapEmailLayout(`
    <span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);">
      🎉 ยินดีด้วย! การตั้งค่าสำเร็จ
    </span>
    <h2 style="margin: 0 0 8px; font-size: 22px; color: #ffffff; font-weight: 800;">
      ทดสอบการเชื่อมต่อ Gmail SMTP สำเร็จ!
    </h2>
    <p style="margin: 0 0 16px; color: #94a3b8; font-size: 13.5px; line-height: 1.6;">
      อีเมลนี้เป็นการทดสอบส่งจากระบบ <strong>MyLife Web Application</strong> ผ่าน <strong>Gmail SMTP (App Passwords)</strong> ไปยังกล่องข้อความของคุณ
    </p>

    <div class="card-box">
      <div class="item-row">
        <span class="item-label">📧 ส่งถึง</span>
        <span class="item-val">${targetEmail}</span>
      </div>
      <div class="item-row">
        <span class="item-label">⚡ บริการ SMTP</span>
        <span class="item-val">Gmail SMTP (smtp.gmail.com)</span>
      </div>
      <div class="item-row">
        <span class="item-label">🕒 เวลาที่ส่ง</span>
        <span class="item-val">${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.</span>
      </div>
      <div class="item-row">
        <span class="item-label">🟢 สถานะระบบ</span>
        <span class="item-val" style="color: #4ade80;">พร้อมใช้งาน 100%</span>
      </div>
    </div>
  `, appUrl)

  const text = [
    `🎉 [MyLife] ทดสอบการเชื่อมต่อ Gmail SMTP สำเร็จ!`,
    `ส่งถึง: ${targetEmail}`,
    `เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.`,
    `ระบบแจ้งเตือนทาง Email ของ MyLife พร้อมใช้งานแล้ว`,
  ].join('\n')

  return {
    subject: `✨ [MyLife] ทดสอบการเชื่อมต่อ Gmail SMTP สำเร็จ!`,
    html,
    text,
  }
}
