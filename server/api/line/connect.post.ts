import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import {
  getLineConnectionStatus,
  normalizeLineUserId,
  withLineConnectionMetadata,
} from '../../utils/line'

type ConnectLineBody = {
  lineUserId?: string
  notificationsEnabled?: boolean
}

type LineAuthUser = {
  id: string
  user_metadata?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event) as LineAuthUser | null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ LINE',
    })
  }

  const body = await readBody<ConnectLineBody>(event)
  const lineUserId = normalizeLineUserId(body?.lineUserId)

  if (!lineUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'LINE User ID ไม่ถูกต้อง',
    })
  }

  const lineUser = { user_metadata: user.user_metadata || {} }
  const metadata = withLineConnectionMetadata(lineUser, lineUserId, body?.notificationsEnabled !== false)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: metadata,
  })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'ไม่สามารถบันทึกข้อมูล LINE ได้',
    })
  }

  return getLineConnectionStatus({ user_metadata: metadata })
})