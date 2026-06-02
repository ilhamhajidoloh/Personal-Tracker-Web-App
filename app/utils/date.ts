/** Thai timezone offset (+7 hours in ms) */
const TH_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * คืนค่าวันที่ปัจจุบันตาม timezone ไทย (UTC+7) ในรูปแบบ 'YYYY-MM-DD'
 */
export const getTodayTH = (): string => {
  return new Date(Date.now() + TH_OFFSET_MS).toISOString().slice(0, 10)
}

/**
 * คืนค่าเดือนปัจจุบันตาม timezone ไทย (UTC+7) ในรูปแบบ 'YYYY-MM'
 */
export const getThisMonthTH = (): string => {
  return new Date(Date.now() + TH_OFFSET_MS).toISOString().slice(0, 7)
}

/**
 * คืนค่า Date object ที่ปรับเป็นเวลาไทยแล้ว (ใช้สำหรับ .getDay(), .getHours() ฯลฯ)
 */
export const nowTH = (): Date => {
  return new Date(Date.now() + TH_OFFSET_MS)
}
