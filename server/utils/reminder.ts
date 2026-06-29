const TH_TIME_ZONE = 'Asia/Bangkok'

const reminderLabelMap: Record<number, string> = {
  5: '5 นาที',
  15: '15 นาที',
  30: '30 นาที',
  60: '1 ชั่วโมง',
  120: '2 ชั่วโมง',
  1440: '1 วัน',
}

const priorityLabelMap: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'ด่วน',
}

export const getReminderLabel = (minutes: number): string =>
  reminderLabelMap[minutes] || `${minutes} นาที`

const formatThaiDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatThaiTime = (timeString: string | null) =>
  timeString ? `${timeString.slice(0, 5)} น.` : ''

export type ReminderEvent = {
  id: string
  user_id: string
  title: string
  event_type: string
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  reminder_minutes: number
}

export type ReminderTodo = {
  id: string
  user_id: string
  title: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: string
}

export const getNowTH = (): Date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const p = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return new Date(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second),
  )
}

export const getEventReminderTime = (event: ReminderEvent): Date | null => {
  if (event.event_type === 'same_day_all_day') {
    const dayBefore = new Date(`${event.start_date}T08:00:00`)
    dayBefore.setDate(dayBefore.getDate() - 1)
    return dayBefore
  }

  if (!event.start_time) return null

  const startMs = new Date(`${event.start_date}T${event.start_time}`).getTime()
  return new Date(startMs - event.reminder_minutes * 60_000)
}

export const getTodoReminderTime = (todo: ReminderTodo): Date | null => {
  if (!todo.due_date) return null

  if (todo.priority === 'high') {
    const dayBefore = new Date(`${todo.due_date}T08:00:00`)
    dayBefore.setDate(dayBefore.getDate() - 1)
    return dayBefore
  }

  const hour = todo.priority === 'low' ? '09:00:00' : '08:00:00'
  return new Date(`${todo.due_date}T${hour}`)
}

export const buildEventReminderText = (event: ReminderEvent): string => {
  const label = getReminderLabel(event.reminder_minutes)

  let timeInfo: string
  if (event.event_type === 'same_day_all_day') {
    timeInfo = `${formatThaiDate(event.start_date)} (ตลอดวัน)`
  } else if (event.event_type === 'same_day_time') {
    timeInfo = `${formatThaiDate(event.start_date)} ${formatThaiTime(event.start_time)} - ${formatThaiTime(event.end_time)}`
  } else {
    timeInfo = `${formatThaiDate(event.start_date)} ${formatThaiTime(event.start_time)} ถึง ${formatThaiDate(event.end_date || event.start_date)} ${formatThaiTime(event.end_time)}`
  }

  return [
    `🔔 แจ้งเตือนกิจกรรม`,
    `กิจกรรม: ${event.title}`,
    `กำลังจะเริ่มใน ${label}`,
    `เวลา: ${timeInfo}`,
  ].join('\n')
}

export const buildTodoReminderText = (todo: ReminderTodo): string => {
  const isHighPriority = todo.priority === 'high'
  const deadlineText = isHighPriority ? 'ครบกำหนดพรุ่งนี้' : 'ครบกำหนดวันนี้'

  return [
    `🔔 แจ้งเตือนงาน`,
    `งาน: ${todo.title}`,
    `สถานะ: ${deadlineText}`,
    `ความสำคัญ: ${priorityLabelMap[todo.priority] || todo.priority}`,
    `กำหนดส่ง: ${formatThaiDate(todo.due_date)}`,
  ].join('\n')
}
