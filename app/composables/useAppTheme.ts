import { computed, onMounted } from 'vue'

export type AppTheme = 'night' | 'light'

const THEME_STORAGE_KEY = 'my-life-app-theme'

const getPreferredTheme = (): AppTheme => {
  if (import.meta.server) {
    return 'light'
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'night') {
    return savedTheme
  }

  // Soft Neo leads with the bright canvas; only honour an explicit dark preference.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'light'
}

export const useAppTheme = () => {
  const theme = useState<AppTheme>('app-theme', () => 'light')
  const initialized = useState<boolean>('app-theme-initialized', () => false)
  const isUserOverride = useState<boolean>('app-theme-override', () => false)

  const applyThemeClass = (nextTheme: AppTheme) => {
    if (import.meta.server) {
      return
    }

    const root = document.documentElement
    root.classList.toggle('theme-light', nextTheme === 'light')
    root.classList.toggle('theme-night', nextTheme === 'night')
  }

  const setTheme = (nextTheme: AppTheme, isOverride = true) => {
    theme.value = nextTheme
    isUserOverride.value = isOverride

    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    }

    applyThemeClass(nextTheme)
  }

  const initializeTheme = () => {
    if (initialized.value) {
      applyThemeClass(theme.value)
      return
    }

    const nextTheme = getPreferredTheme()
    theme.value = nextTheme
    isUserOverride.value = Boolean(localStorage.getItem(THEME_STORAGE_KEY))

    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    }

    applyThemeClass(nextTheme)
    initialized.value = true

    // Listen for system theme changes (only if user hasn't manually overridden)
    if (import.meta.client) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (!isUserOverride.value) {
          const newTheme = e.matches ? 'night' : 'light'
          theme.value = newTheme
          applyThemeClass(newTheme)
        }
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleSystemThemeChange)
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'night' ? 'light' : 'night'
    setTheme(newTheme, true)
  }

  const isLightTheme = computed(() => theme.value === 'light')

  return {
    theme,
    isLightTheme,
    initializeTheme,
    setTheme,
    toggleTheme,
  }
}
