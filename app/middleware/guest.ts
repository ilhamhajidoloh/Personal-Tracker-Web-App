export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/dashboard')
  }

  const isOAuthCallback = Boolean(
    to.query.code ||
    to.query.access_token ||
    to.hash.includes('access_token')
  )

  if (isOAuthCallback) {
    return
  }

  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    return navigateTo('/dashboard')
  }
})