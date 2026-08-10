export type AuthSession = {
  token: string
  userId: string
  email: string
  fullName: string
}

type BackendAuthResponse = {
  message: string
  token: string
  userId: string
  email: string
  fullName: string
}

const decodeJwtExpiry = (token: string): number | null => {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized)) as { exp?: number }
    return typeof json.exp === 'number' ? json.exp : null
  } catch {
    return null
  }
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export const useAuth = () => {
  const config = useRuntimeConfig()
  const session = useCookie<AuthSession | null>('auth_session', {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    default: () => null,
  })

  const currentUser = computed(() => session.value)

  const isSessionValid = () => {
    const token = session.value?.token
    if (!token) return false
    const exp = decodeJwtExpiry(token)
    if (!exp) return false
    return exp * 1000 > Date.now()
  }

  const setSession = (res: BackendAuthResponse) => {
    session.value = {
      token: res.token,
      userId: res.userId,
      email: res.email,
      fullName: res.fullName,
    }
  }

  const clearSession = () => {
    session.value = null
  }

  const login = async (email: string, password: string) => {
    const res = await $fetch<BackendAuthResponse>(`${config.public.apiBase}/api/Auth/login`, {
      method: 'POST',
      body: { email, password },
    })
    setSession(res)
    return res
  }

  const register = async (email: string, password: string, fullName: string) => {
    const res = await $fetch<BackendAuthResponse>(`${config.public.apiBase}/api/Auth/register`, {
      method: 'POST',
      body: { email, password, fullName },
    })
    setSession(res)
    return res
  }

  const loginWithGoogleIdToken = async (idToken: string) => {
    const res = await $fetch<BackendAuthResponse>('/api/auth/google', {
      method: 'POST',
      body: { idToken },
    })
    setSession(res)
    return res
  }

  const signOut = () => {
    clearSession()
  }

  const updateProfile = async (fullName: string) => {
    const token = session.value?.token
    if (!token) throw new Error('ไม่พบข้อมูล session การเข้าสู่ระบบ')
    const res = await $fetch<{ message: string; userId: string; email: string; fullName: string }>(
      `${config.public.apiBase}/api/Auth/profile`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { fullName },
      }
    )
    if (session.value) {
      session.value = {
        ...session.value,
        fullName: res.fullName,
      }
    }
    return res
  }

  const changePassword = async (currentPassword: string | null, newPassword: string) => {
    const token = session.value?.token
    if (!token) throw new Error('ไม่พบข้อมูล session การเข้าสู่ระบบ')
    const res = await $fetch<{ message: string; hasPassword?: boolean }>(
      `${config.public.apiBase}/api/Auth/password`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { currentPassword, newPassword },
      }
    )
    return res
  }

  return {
    currentUser,
    isSessionValid,
    login,
    register,
    loginWithGoogleIdToken,
    signOut,
    setSession,
    clearSession,
    updateProfile,
    changePassword,
  }
}
