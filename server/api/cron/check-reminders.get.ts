import { createBackendJwt } from '../../utils/auth'
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

type LineEnabledUser = {
  userId: string
  lineUserId: string
}

type BackendActivity = ReminderEvent & { reminderSentAt: string | null }
type BackendTodo = ReminderTodo & { reminderSentAt: string | null }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  if (!config.cronSecret || query.secret !== config.cronSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret' })
  }

  if (!config.line.channelAccessToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing LINE channel access token' })
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
  const now = getNowTH()

  const systemHeaders = await getCronAuthHeaders('system-cron')
  const lineUsers = await $fetch<LineEnabledUser[]>(
    `${apiBase}/api/Line/connected`,
    { headers: systemHeaders },
  ).catch(() => [])

  if (!lineUsers.length) {
    return { sent: 0, checked: 0 }
  }

  let totalSent = 0
  let totalChecked = 0

  for (const lineUser of lineUsers) {
    const userHeaders = await getCronAuthHeaders(lineUser.userId)
    const [activities, todos] = await Promise.all([
      $fetch<BackendActivity[]>(`${apiBase}/api/Activity/${lineUser.userId}`, { headers: userHeaders }).catch(() => []),
      $fetch<BackendTodo[]>(`${apiBase}/api/Todo/${lineUser.userId}`, { headers: userHeaders }).catch(() => []),
    ])

    // ── Event reminders ────────────────────────────────────────────────────────

    const pendingEvents = activities.filter(a => a.reminderMinutes != null && !a.reminderSentAt)
    totalChecked += pendingEvents.length

    for (const ev of pendingEvents) {
      const reminderTime = getEventReminderTime(ev)
      if (!reminderTime || now < reminderTime) continue

      try {
        const text = buildEventReminderText(ev)
        await pushLineTextMessage(config.line.channelAccessToken, lineUser.lineUserId, text)
        await $fetch(`${apiBase}/api/Activity/${ev.id}/reminder-sent`, {
          method: 'PUT',
          headers: userHeaders,
        })
        totalSent++
      } catch (err) {
        console.error(`Event reminder failed for ${ev.id}:`, err)
      }
    }

    // ── Todo reminders ─────────────────────────────────────────────────────────

    const pendingTodos = todos.filter(t => t.targetDate && t.status !== 'completed' && !t.reminderSentAt)
    totalChecked += pendingTodos.length

    for (const todo of pendingTodos) {
      const reminderTime = getTodoReminderTime(todo)
      if (!reminderTime || now < reminderTime) continue

      try {
        const text = buildTodoReminderText(todo)
        await pushLineTextMessage(config.line.channelAccessToken, lineUser.lineUserId, text)
        await $fetch(`${apiBase}/api/Todo/${todo.id}/reminder-sent`, {
          method: 'PUT',
          headers: userHeaders,
        })
        totalSent++
      } catch (err) {
        console.error(`Todo reminder failed for ${todo.id}:`, err)
      }
    }
  }

  return {
    sent: totalSent,
    checked: totalChecked,
  }
})
