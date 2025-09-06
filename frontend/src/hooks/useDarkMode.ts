import { useState, useEffect } from 'react'

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved) {
      setIsDark(JSON.parse(saved))
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
    }
  }, [])

  const toggleDarkMode = () => {
    const newValue = !isDark
    setIsDark(newValue)
    localStorage.setItem('darkMode', JSON.stringify(newValue))
    
    // Aplicar clase al documento
    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Aplicar tema inicial
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return { isDark, toggleDarkMode }
}