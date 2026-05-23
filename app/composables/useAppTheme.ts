import { computed } from 'vue'

export type AppTheme = 'night' | 'light'

const THEME_STORAGE_KEY = 'my-life-app-theme'

const getPreferredTheme = (): AppTheme => {
  if (import.meta.server) {
    return 'night'
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'night') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'night'
}

export const useAppTheme = () => {
  const theme = useState<AppTheme>('app-theme', () => 'night')
  const initialized = useState<boolean>('app-theme-initialized', () => false)

  const applyThemeClass = (nextTheme: AppTheme) => {
    if (import.meta.server) {
      return
    }

    const root = document.documentElement
    root.classList.toggle('theme-light', nextTheme === 'light')
    root.classList.toggle('theme-night', nextTheme === 'night')
  }

  const setTheme = (nextTheme: AppTheme) => {
    theme.value = nextTheme

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

    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    }

    applyThemeClass(nextTheme)
    initialized.value = true
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'night' ? 'light' : 'night')
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
