export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // If user is already loaded in composable, allow access
  if (user.value) {
    return
  }

  // Check if there's a valid session in storage
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    // Session exists, refresh it to ensure it's valid
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      return
    }
  }

  // No valid session found, redirect to login
  return navigateTo('/')
})