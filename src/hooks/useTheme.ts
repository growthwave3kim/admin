import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const getStoredTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getCurrentTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

if (typeof window !== 'undefined') {
  applyTheme(getStoredTheme())
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  return { theme, toggleTheme }
}
