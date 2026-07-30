export default defineNuxtRouteMiddleware(() => {
  const { isSessionValid } = useAuth()

  if (isSessionValid()) {
    return navigateTo('/dashboard')
  }
})