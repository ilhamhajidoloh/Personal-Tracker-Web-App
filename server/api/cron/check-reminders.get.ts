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

  const apiBase = config.public.apiBase
  const now = getNowTH()

  const lineUsers = await $fetch<LineEnabledUser[]>(`${apiBase}/api/Line/connected`).catch(() => [])
  if (!lineUsers.length) {
    return { sent: 0, checked: 0 }
  }

  let totalSent = 0
  let totalChecked = 0

  for (const lineUser of lineUsers) {
    const [activities, todos] = await Promise.all([
      $fetch<BackendActivity[]>(`${apiBase}/api/Activity/${lineUser.userId}`).catch(() => []),
      $fetch<BackendTodo[]>(`${apiBase}/api/Todo/${lineUser.userId}`).catch(() => []),
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
        await $fetch(`${apiBase}/api/Activity/${ev.id}/reminder-sent`, { method: 'PUT' })
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
        await $fetch(`${apiBase}/api/Todo/${todo.id}/reminder-sent`, { method: 'PUT' })
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
