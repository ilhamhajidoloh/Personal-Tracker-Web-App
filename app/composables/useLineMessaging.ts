type TodoLineNotificationPayload = {
  title: string
  dueDate?: string | null
  priority: 'low' | 'medium' | 'high'
  isEditing?: boolean
}

type EventLineNotificationPayload = {
  title: string
  eventType: 'same_day_time' | 'same_day_all_day' | 'multi_day'
  startDate: string
  startTime?: string | null
  endDate?: string | null
  endTime?: string | null
  isEditing?: boolean
}

type LineNotifyResponse = {
  sent: boolean
  skipped?: boolean
  reason?: string
}

const formatThaiDate = (dateString?: string | null) => {
  if (!dateString) {
    return 'ยังไม่กำหนด'
  }

  return new Date(dateString).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatThaiTime = (timeString?: string | null) => {
  if (!timeString) {
    return ''
  }

  return `${timeString.slice(0, 5)} น.`
}

const priorityLabelMap: Record<TodoLineNotificationPayload['priority'], string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'ด่วน',
}

const eventTypeLabelMap: Record<EventLineNotificationPayload['eventType'], string> = {
  same_day_time: 'วันเดียวมีเวลา',
  same_day_all_day: 'วันเดียวทั้งวัน',
  multi_day: 'หลายวัน',
}

const buildEventTimeSummary = (payload: EventLineNotificationPayload) => {
  if (payload.eventType === 'same_day_all_day') {
    return `${formatThaiDate(payload.startDate)} (ตลอดวัน)`
  }

  if (payload.eventType === 'same_day_time') {
    return `${formatThaiDate(payload.startDate)} ${formatThaiTime(payload.startTime)} - ${formatThaiTime(payload.endTime)}`
  }

  return `${formatThaiDate(payload.startDate)} ${formatThaiTime(payload.startTime)} ถึง ${formatThaiDate(payload.endDate)} ${formatThaiTime(payload.endTime)}`
}

export const useLineMessaging = () => {
  const notify = async (text: string): Promise<LineNotifyResponse> => {
    if (!import.meta.client) {
      return {
        sent: false,
        skipped: true,
        reason: 'server',
      }
    }

    try {
      return await $fetch<LineNotifyResponse>('/api/line/notify', {
        method: 'POST',
        body: { text },
      })
    } catch (error) {
      console.error('LINE notify error:', error)
      return {
        sent: false,
        skipped: true,
        reason: 'error',
      }
    }
  }

  const buildTodoSavedMessage = (payload: TodoLineNotificationPayload) => {
    const actionText = payload.isEditing ? 'อัปเดตงาน' : 'เพิ่มงานใหม่'

    return [
      `MyLife: ${actionText}`,
      `งาน: ${payload.title}`,
      `กำหนดส่ง: ${formatThaiDate(payload.dueDate)}`,
      `ความสำคัญ: ${priorityLabelMap[payload.priority]}`,
    ].join('\n')
  }

  const buildEventSavedMessage = (payload: EventLineNotificationPayload) => {
    const actionText = payload.isEditing ? 'อัปเดตกิจกรรม' : 'เพิ่มกิจกรรมใหม่'

    return [
      `MyLife: ${actionText}`,
      `กิจกรรม: ${payload.title}`,
      `รูปแบบ: ${eventTypeLabelMap[payload.eventType]}`,
      `เวลา: ${buildEventTimeSummary(payload)}`,
    ].join('\n')
  }

  return {
    notify,
    buildTodoSavedMessage,
    buildEventSavedMessage,
  }
}