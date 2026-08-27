export type AuthSession = {
  token: string
  userId: string
  email: string
  fullName: string
  profileImageUrl?: string | null
}

type BackendAuthResponse = {
  message: string
  token: string
  userId: string
  email: string
  fullName: string
  profileImageUrl?: string | null
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

  const normalizeProfileImageUrl = (userId?: string | null, profileImageUrl?: string | null) => {
    if (!profileImageUrl) return null
    if (!userId) return profileImageUrl
    if (
      profileImageUrl.startsWith('profiles/') ||
      profileImageUrl.includes('objectstorage.') ||
      profileImageUrl.includes('.compat.objectstorage.')
    ) {
      return `${config.public.apiBase}/api/Auth/profile-image/${userId}?v=${encodeURIComponent(profileImageUrl)}`
    }
    return profileImageUrl
  }

  const currentUser = computed(() => {
    if (!session.value) return null
    return {
      ...session.value,
      profileImageUrl: normalizeProfileImageUrl(session.value.userId, session.value.profileImageUrl),
    }
  })

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
      profileImageUrl: normalizeProfileImageUrl(res.userId, res.profileImageUrl ?? session.value?.profileImageUrl ?? null),
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
    const res = await $fetch<{ message: string; userId: string; email: string; fullName: string; profileImageUrl?: string | null }>(
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
        profileImageUrl: normalizeProfileImageUrl(res.userId, res.profileImageUrl ?? session.value.profileImageUrl),
      }
    }
    return res
  }

  const uploadProfileImage = async (file: File) => {
    const token = session.value?.token
    if (!token) throw new Error('ไม่พบข้อมูล session การเข้าสู่ระบบ')
    const formData = new FormData()
    formData.append('file', file)

    const res = await $fetch<{ message: string; profileImageUrl: string }>(
      `${config.public.apiBase}/api/Auth/profile-image`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    )

    if (session.value) {
      session.value = {
        ...session.value,
        profileImageUrl: normalizeProfileImageUrl(session.value.userId, res.profileImageUrl),
      }
    }
    return res
  }

  const deleteProfileImage = async () => {
    const token = session.value?.token
    if (!token) throw new Error('ไม่พบข้อมูล session การเข้าสู่ระบบ')
    const res = await $fetch<{ message: string; profileImageUrl: string | null }>(
      `${config.public.apiBase}/api/Auth/profile-image`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (session.value) {
      session.value = {
        ...session.value,
        profileImageUrl: null,
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
    normalizeProfileImageUrl,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    changePassword,
  }
}
