import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId, getLineConnectionStatus, withoutLineConnectionMetadata } from '../../utils/line'

type LineAuthUser = {
  id?: string
  sub?: string
  user_metadata?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event) as LineAuthUser | null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนยกเลิกการเชื่อมต่อ LINE',
    })
  }

  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่พบรหัสผู้ใช้สำหรับยกเลิกการเชื่อมต่อ LINE',
    })
  }

  const lineUser = { user_metadata: user.user_metadata || {} }
  const metadata = withoutLineConnectionMetadata(lineUser)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    user_metadata: metadata,
  })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'ไม่สามารถยกเลิกการเชื่อมต่อ LINE ได้',
    })
  }

  return getLineConnectionStatus({ user_metadata: metadata })
})