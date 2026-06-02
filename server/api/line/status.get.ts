import { serverSupabaseUser } from '#supabase/server'

import { getLineConnectionStatus } from '../../utils/line'

type LineAuthUser = {
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

  return getLineConnectionStatus({ user_metadata: user.user_metadata || {} })
})