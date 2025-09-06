import React from 'react'

interface GlobalThemeProviderProps {
  children: React.ReactNode
  isDark: boolean
}

const GlobalThemeProvider: React.FC<GlobalThemeProviderProps> = ({ children, isDark }) => {
  React.useEffect(() => {
    // Remover márgenes y padding por defecto
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
    
    // Aplicar tema al documento completo
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      document.body.style.backgroundColor = '#111827' // gray-900
      document.documentElement.style.backgroundColor = '#111827'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.body.style.backgroundColor = '#f9fafb' // gray-50
      document.documentElement.style.backgroundColor = '#f9fafb'
    }
    
    return () => {
      // Cleanup cuando el componente se desmonte
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [isDark])

  return <>{children}</>
}

export default GlobalThemeProvider