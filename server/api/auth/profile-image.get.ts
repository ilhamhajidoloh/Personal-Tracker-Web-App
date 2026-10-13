import { getBackendAuthHeader, requireBackendUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUserId = await requireBackendUserId(event)
  const config = useRuntimeConfig(event)
  const authHeaders = await getBackendAuthHeader(event, authUserId)

  const response = await fetch(`${config.public.apiBase}/api/Auth/profile-image`, {
    headers: authHeaders,
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status === 401 || response.status === 403
        ? response.status
        : response.status === 404
          ? 404
          : 502,
      statusMessage: response.status === 404 ? 'ไม่พบรูปโปรไฟล์' : 'โหลดรูปโปรไฟล์ไม่สำเร็จ',
    })
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=300')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')

  return Buffer.from(await response.arrayBuffer())
})
