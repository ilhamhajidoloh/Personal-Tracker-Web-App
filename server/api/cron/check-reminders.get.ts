import { serverSupabaseServiceRole } from '#supabase/server'

import { getLineConnectionStatus, pushLineTextMessage } from '../../utils/line'
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
  id: string
  lineUserId: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  if (!config.cronSecret || query.secret !== config.cronSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret' })
  }

  if (!config.line.channelAccessToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing LINE channel access token' })
  }

  const supabase = serverSupabaseServiceRole(event) as any
  const now = getNowTH()

  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (!usersData?.users?.length) {
    return { sent: 0, checked: 0 }
  }

  const lineUsers: LineEnabledUser[] = []
  for (const user of usersData.users as Array<{ id: string; user_metadata?: Record<string, unknown> }>) {
    const connection = getLineConnectionStatus({ user_metadata: user.user_metadata })
    if (connection.connected && connection.notificationsEnabled) {
      lineUsers.push({ id: user.id, lineUserId: connection.lineUserId })
    }
  }

  if (!lineUsers.length) {
    return { sent: 0, checked: 0 }
  }

  const userIds = lineUsers.map(u => u.id)
  const userLineMap = new Map(lineUsers.map(u => [u.id, u.lineUserId]))

  let totalSent = 0

  // ── Event reminders ────────────────────────────────────────────────────────

  const { data: pendingEvents } = await supabase
    .from('events')
    .select('id, user_id, title, event_type, start_date, start_time, end_date, end_time, reminder_minutes')
    .in('user_id', userIds)
    .not('reminder_minutes', 'is', null)
    .is('reminder_sent_at', null)

  if (pendingEvents?.length) {
    for (const ev of pendingEvents as ReminderEvent[]) {
      const reminderTime = getEventReminderTime(ev)
      if (!reminderTime || now < reminderTime) continue

      const lineUserId = userLineMap.get(ev.user_id)
      if (!lineUserId) continue

      try {
        const text = buildEventReminderText(ev)
        await pushLineTextMessage(config.line.channelAccessToken, lineUserId, text)
        await supabase
          .from('events')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', ev.id)
        totalSent++
      } catch (err) {
        console.error(`Event reminder failed for ${ev.id}:`, err)
      }
    }
  }

  // ── Todo reminders ─────────────────────────────────────────────────────────

  const { data: pendingTodos } = await supabase
    .from('todos')
    .select('id, user_id, title, due_date, priority, status')
    .in('user_id', userIds)
    .not('due_date', 'is', null)
    .neq('status', 'completed')
    .is('reminder_sent_at', null)

  if (pendingTodos?.length) {
    for (const todo of pendingTodos as ReminderTodo[]) {
      const reminderTime = getTodoReminderTime(todo)
      if (!reminderTime || now < reminderTime) continue

      const lineUserId = userLineMap.get(todo.user_id)
      if (!lineUserId) continue

      try {
        const text = buildTodoReminderText(todo)
        await pushLineTextMessage(config.line.channelAccessToken, lineUserId, text)
        await supabase
          .from('todos')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', todo.id)
        totalSent++
      } catch (err) {
        console.error(`Todo reminder failed for ${todo.id}:`, err)
      }
    }
  }

  return {
    sent: totalSent,
    checked: (pendingEvents?.length || 0) + (pendingTodos?.length || 0),
  }
})
