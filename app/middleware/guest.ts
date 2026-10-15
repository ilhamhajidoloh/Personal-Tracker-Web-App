export default defineNuxtRouteMiddleware(async () => {
  const { isSessionValid } = useAuth()

  // Wait a tiny bit to ensure cookie operations complete
  if (import.meta.client) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  if (isSessionValid()) {
    return navigateTo('/dashboard')
  }
})