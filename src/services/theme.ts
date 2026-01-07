const THEME_STORAGE_KEY = 'wunder-theme'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'

type Theme = 'dark' | 'light'

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return (stored === THEME_DARK || stored === THEME_LIGHT ? stored : null) as Theme | null
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return THEME_LIGHT
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT
}

const getInitialTheme = (): Theme => {
  return getStoredTheme() || getSystemTheme()
}

const applyTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (theme === THEME_DARK) {
    root.classList.add(THEME_DARK)
  } else {
    root.classList.remove(THEME_DARK)
  }
}

const setTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
}

const toggleTheme = (): Theme => {
  const current = getCurrentTheme()
  const newTheme = current === THEME_DARK ? THEME_LIGHT : THEME_DARK
  setTheme(newTheme)
  return newTheme
}

const getCurrentTheme = (): Theme => {
  if (typeof window === 'undefined') return THEME_LIGHT
  return document.documentElement.classList.contains(THEME_DARK) ? THEME_DARK : THEME_LIGHT
}

const watchSystemTheme = (callback: (theme: Theme) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    // Обновляем только если пользователь не выбрал тему вручную
    if (!getStoredTheme()) {
      const newTheme = e.matches ? THEME_DARK : THEME_LIGHT
      applyTheme(newTheme)
      callback(newTheme)
    }
  }
  
  // Современный способ
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }
  
  // Fallback для старых браузеров
  mediaQuery.addListener(handleChange)
  return () => mediaQuery.removeListener(handleChange)
}

export { getInitialTheme, setTheme, toggleTheme, getCurrentTheme, applyTheme, watchSystemTheme }

