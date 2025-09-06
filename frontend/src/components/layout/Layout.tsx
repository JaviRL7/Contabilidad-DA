import React from 'react'

interface LayoutProps {
  children: React.ReactNode
  isDark?: boolean
}

const Layout: React.FC<LayoutProps> = ({ children, isDark = false }) => {
  // Aplicar clase dark al html para que sea global
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#111827' // gray-900
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#f9fafb' // gray-50
    }
    
    // Cleanup
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [isDark])

  return (
    <>
      {children}
    </>
  )
}

export default Layout