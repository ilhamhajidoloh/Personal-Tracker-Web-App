const TH_TIME_ZONE = 'Asia/Bangkok'

const getThaiDateParts = () => {
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

  return Object.fromEntries(parts.map(part => [part.type, part.value]))
}

/**
 * คืนค่าวันที่ปัจจุบันตาม timezone ไทย (UTC+7) ในรูปแบบ 'YYYY-MM-DD'
 */
export const getTodayTH = (): string => {
  const parts = getThaiDateParts()
  return `${parts.year}-${parts.month}-${parts.day}`
}

/**
 * คืนค่าเดือนปัจจุบันตาม timezone ไทย (UTC+7) ในรูปแบบ 'YYYY-MM'
 */
export const getThisMonthTH = (): string => {
  const parts = getThaiDateParts()
  return `${parts.year}-${parts.month}`
}

/**
 * คืนค่า Date object ที่ปรับเป็นเวลาไทยแล้ว (ใช้สำหรับ .getDay(), .getHours() ฯลฯ)
 */
export const nowTH = (): Date => {
  const parts = getThaiDateParts()
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
}
