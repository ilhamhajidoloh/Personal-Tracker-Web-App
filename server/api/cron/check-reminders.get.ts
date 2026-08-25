import { createBackendJwt } from '../../utils/auth'
import {
  buildClassReminderEmail,
  buildEventReminderEmail,
  buildTodoReminderEmail,
  sendEmail,
} from '../../utils/email'
import { pushLineTextMessage } from '../../utils/line'
import {
  buildEventReminderText,
  buildTodoReminderText,
  getEventReminderTime,
  getNowTH,
  getTodoReminderTime,
  type ReminderEvent,
  type ReminderTodo,
} from '../../utils/reminder'

type ConnectedUser = {
  userId: string
  lineUserId?: string
  email?: string
  classRemindersEnabled?: boolean
  classReminderMinutes?: number
}

type BackendActivity = ReminderEvent & { reminderSentAt: string | null; location?: string | null; description?: string | null }
type BackendTodo = ReminderTodo & { reminderSentAt: string | null }

type BackendCourse = {
  id: string
  courseName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
  instructor?: string | null
}

const dayOfWeekNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  if (config.cronSecret && query.secret !== config.cronSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret' })
  }

  const hasLine = Boolean(config.line?.channelAccessToken)
  const hasSmtp = Boolean(config.smtp?.user && config.smtp?.pass)

  if (!hasLine && !hasSmtp) {
    return {
      sent: 0,
      checked: 0,
      message: 'Neither LINE nor SMTP are configured for cron notifications',
    }
  }

  const getCronAuthHeaders = async (targetUserId: string): Promise<Record<string, string>> => {
    if (!config.jwt?.key) return {}
    try {
      const token = await createBackendJwt(targetUserId, {
        key: config.jwt.key,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      })
      return { Authorization: `Bearer ${token}` }
    } catch {
      return {}
    }
  }

  const apiBase = config.public.apiBase
  const appUrl = config.public.appUrl || 'http://localhost:3000'
  const now = getNowTH()

  const systemHeaders = await getCronAuthHeaders('system-cron')
  const connectedUsers = await $fetch<ConnectedUser[]>(
    `${apiBase}/api/Line/connected`,
    { headers: systemHeaders },
  ).catch(() => [])

  let totalSent = 0
  let totalChecked = 0

  for (const user of connectedUsers) {
    const userHeaders = await getCronAuthHeaders(user.userId)
    const [activities, todos, scheduleData, userProfile] = await Promise.all([
      $fetch<BackendActivity[]>(`${apiBase}/api/Activity/${user.userId}`, { headers: userHeaders }).catch(() => []),
      $fetch<BackendTodo[]>(`${apiBase}/api/Todo/${user.userId}`, { headers: userHeaders }).catch(() => []),
      $fetch<any>(`${apiBase}/api/Schedule/today/${user.userId}`, { headers: userHeaders }).catch(() => null),
      $fetch<{ email?: string }>(`${apiBase}/api/Auth/profile`, { headers: userHeaders }).catch(() => null),
    ])

    const userEmail = user.email || userProfile?.email || ''

    // ── 1. Event reminders ───────────────────────────────────────────────────
    const pendingEvents = activities.filter(a => a.reminderMinutes != null && !a.reminderSentAt)
    totalChecked += pendingEvents.length

    for (const ev of pendingEvents) {
      const reminderTime = getEventReminderTime(ev)
      if (!reminderTime || now < reminderTime) continue

      let sentAny = false

      // Send LINE
      if (hasLine && user.lineUserId) {
        try {
          const text = buildEventReminderText(ev)
          await pushLineTextMessage(config.line.channelAccessToken, user.lineUserId, text)
          sentAny = true
        } catch (err) {
          console.error(`LINE Event reminder failed for ${ev.id}:`, err)
        }
      }

      // Send Email
      if (hasSmtp && userEmail) {
        try {
          const eventEmailPayload = {
            title: ev.title,
            eventType: (ev.isAllDay ? 'same_day_all_day' : (ev.isMultiDay ? 'multi_day' : 'same_day_time')) as any,
            startDate: ev.startTime ? ev.startTime.slice(0, 10) : '',
            startTime: ev.startTime ? ev.startTime.slice(11, 16) : null,
            endDate: ev.endTime ? ev.endTime.slice(0, 10) : null,
            endTime: ev.endTime ? ev.endTime.slice(11, 16) : null,
            location: ev.location,
            description: ev.description,
            reminderMinutes: ev.reminderMinutes,
          }
          const email = buildEventReminderEmail(eventEmailPayload, appUrl)
          await sendEmail({ to: userEmail, subject: email.subject, html: email.html, text: email.text }, config)
          sentAny = true
        } catch (err) {
          console.error(`Email Event reminder failed for ${ev.id}:`, err)
        }
      }

      if (sentAny) {
        await $fetch(`${apiBase}/api/Activity/${ev.id}/reminder-sent`, {
          method: 'PUT',
          headers: userHeaders,
        }).catch(() => null)
        totalSent++
      }
    }

    // ── 2. Todo reminders ────────────────────────────────────────────────────
    const pendingTodos = todos.filter(t => t.targetDate && t.status !== 'completed' && !t.reminderSentAt)
    totalChecked += pendingTodos.length

    for (const todo of pendingTodos) {
      const reminderTime = getTodoReminderTime(todo)
      if (!reminderTime || now < reminderTime) continue

      let sentAny = false

      // Send LINE
      if (hasLine && user.lineUserId) {
        try {
          const text = buildTodoReminderText(todo)
          await pushLineTextMessage(config.line.channelAccessToken, user.lineUserId, text)
          sentAny = true
        } catch (err) {
          console.error(`LINE Todo reminder failed for ${todo.id}:`, err)
        }
      }

      // Send Email
      if (hasSmtp && userEmail) {
        try {
          const email = buildTodoReminderEmail({
            title: todo.title,
            targetDate: todo.targetDate,
            priority: todo.priority,
            status: todo.status,
          }, appUrl)
          await sendEmail({ to: userEmail, subject: email.subject, html: email.html, text: email.text }, config)
          sentAny = true
        } catch (err) {
          console.error(`Email Todo reminder failed for ${todo.id}:`, err)
        }
      }

      if (sentAny) {
        await $fetch(`${apiBase}/api/Todo/${todo.id}/reminder-sent`, {
          method: 'PUT',
          headers: userHeaders,
        }).catch(() => null)
        totalSent++
      }
    }

    // ── 3. Class schedule reminders (Today) ──────────────────────────────────
    if (scheduleData?.nextList && Array.isArray(scheduleData.nextList) && user.classRemindersEnabled) {
      const reminderMins = user.classReminderMinutes || 15
      const currentThMinutes = now.getHours() * 60 + now.getMinutes()

      for (const nextClass of scheduleData.nextList) {
        if (!nextClass.startTime) continue
        const [h, m] = nextClass.startTime.split(':').map(Number)
        const classStartMinutes = h * 60 + m
        const diffMinutes = classStartMinutes - currentThMinutes

        // Check if class starts within the configured reminder window (e.g. within 0 to reminderMins)
        if (diffMinutes > 0 && diffMinutes <= reminderMins) {
          const dayName = dayOfWeekNames[now.getDay()] || 'monday'
          const classPayload = {
            courseName: nextClass.courseName || nextClass.name || 'วิชาเรียน',
            dayOfWeek: dayName,
            startTime: nextClass.startTime,
            endTime: nextClass.endTime || '',
            room: nextClass.room || nextClass.location || null,
            instructor: nextClass.instructor || null,
            minutesBefore: diffMinutes,
          }

          if (hasSmtp && userEmail) {
            try {
              const email = buildClassReminderEmail(classPayload, appUrl)
              await sendEmail({ to: userEmail, subject: email.subject, html: email.html, text: email.text }, config)
              totalSent++
            } catch (err) {
              console.error(`Email Class reminder failed:`, err)
            }
          }
        }
      }
    }
  }

  return {
    sent: totalSent,
    checked: totalChecked,
  }
})
