type FetchOptions = Parameters<typeof $fetch>[1]

export const useBackendApi = () => {
  const config = useRuntimeConfig()
  const { currentUser } = useAuth()

  const userId = computed(() => currentUser.value?.userId || '')

  const apiFetch = <T>(path: string, opts: FetchOptions = {}) => {
    const token = currentUser.value?.token
    return $fetch<T>(`${config.public.apiBase}${path}`, {
      ...opts,
      headers: {
        ...(opts?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  return {
    userId,
    apiFetch,
  }
}
