import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

import { getAuthUserId, getLineConnectionStatus } from '../../utils/line'

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
      statusMessage: 'กรุณาเข้าสู่ระบบก่อนใช้งาน LINE integration',
    })
  }

  const authUserId = getAuthUserId(user)

  if (!authUserId) {
    return getLineConnectionStatus({ user_metadata: user.user_metadata || {} })
  }

  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(authUserId)

  if (authUserError || !authUserData.user) {
    return getLineConnectionStatus({ user_metadata: user.user_metadata || {} })
  }

  return getLineConnectionStatus({ user_metadata: authUserData.user.user_metadata || {} })
})