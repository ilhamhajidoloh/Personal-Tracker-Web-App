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
  userId: string
  title: string
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
  isMultiDay: boolean
  reminderMinutes: number | null
}

export type ReminderTodo = {
  id: string
  userId: string
  title: string
  targetDate: string
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
  if (event.reminderMinutes == null || !event.startTime) return null

  if (event.isAllDay) {
    const dayBefore = new Date(`${event.startTime.slice(0, 10)}T08:00:00`)
    dayBefore.setDate(dayBefore.getDate() - 1)
    return dayBefore
  }

  const startMs = new Date(event.startTime).getTime()
  return new Date(startMs - event.reminderMinutes * 60_000)
}

export const getTodoReminderTime = (todo: ReminderTodo): Date | null => {
  if (!todo.targetDate) return null
  const dateOnly = todo.targetDate.slice(0, 10)

  if (todo.priority === 'high') {
    const dayBefore = new Date(`${dateOnly}T08:00:00`)
    dayBefore.setDate(dayBefore.getDate() - 1)
    return dayBefore
  }

  const hour = todo.priority === 'low' ? '09:00:00' : '08:00:00'
  return new Date(`${dateOnly}T${hour}`)
}

export const buildEventReminderText = (event: ReminderEvent): string => {
  const label = getReminderLabel(event.reminderMinutes || 0)
  const startDate = event.startTime ? event.startTime.slice(0, 10) : ''
  const startTimeStr = event.startTime ? event.startTime.slice(11, 16) : null
  const endDate = event.endTime ? event.endTime.slice(0, 10) : startDate
  const endTimeStr = event.endTime ? event.endTime.slice(11, 16) : null

  let timeInfo: string
  if (event.isAllDay) {
    timeInfo = `${formatThaiDate(startDate)} (ตลอดวัน)`
  } else if (event.isMultiDay) {
    timeInfo = `${formatThaiDate(startDate)} ${formatThaiTime(startTimeStr)} ถึง ${formatThaiDate(endDate)} ${formatThaiTime(endTimeStr)}`
  } else {
    timeInfo = `${formatThaiDate(startDate)} ${formatThaiTime(startTimeStr)} - ${formatThaiTime(endTimeStr)}`
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
    `กำหนดส่ง: ${formatThaiDate(todo.targetDate.slice(0, 10))}`,
  ].join('\n')
}
