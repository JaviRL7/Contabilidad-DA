import React from 'react'
import { useAuth } from './hooks/useAuth'
import { useDarkMode } from './hooks/useDarkMode'
import GlobalThemeProvider from './components/GlobalThemeProvider'
import LoginModalLarge from './components/modals/LoginModalLarge'
import './App.css'

// Importar el App.tsx original
import OriginalApp from './AppOriginal'

function App() {
  const { isAuthenticated, loading, logout, checkSession } = useAuth()
  const { isDark, toggleDarkMode } = useDarkMode()

  // Verificar sesión al cargar
  React.useEffect(() => {
    if (isAuthenticated) {
      checkSession()
    }
  }, [isAuthenticated, checkSession])

  return (
    <GlobalThemeProvider isDark={isDark}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            isDark ? 'border-white' : 'border-blue-500'
          }`}></div>
        </div>
      ) : !isAuthenticated ? (
        <LoginModalLarge 
          onLoginSuccess={() => window.location.reload()} 
          isDark={isDark}
        />
      ) : (
        <OriginalApp 
          externalIsDark={isDark}
          onToggleDark={toggleDarkMode}
          onLogout={logout}
        />
      )}
    </GlobalThemeProvider>
  )
}

export default App