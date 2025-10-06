import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Register from '../Register'

interface LoginModalLargeProps {
  isDark?: boolean
  onLoginSuccess: () => void
}

const LoginModalLarge: React.FC<LoginModalLargeProps> = ({ isDark = false, onLoginSuccess }) => {
  const [showRegister, setShowRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  // Si está mostrando el registro, renderizar ese componente
  if (showRegister) {
    return (
      <Register
        onRegisterSuccess={onLoginSuccess}
        onBackToLogin={() => setShowRegister(false)}
        isDark={isDark}
      />
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(username, password)

      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className={`w-full max-w-lg p-8 rounded-2xl shadow-2xl backdrop-blur-sm ${
        isDark 
          ? 'bg-gray-800/95 border border-gray-700/50' 
          : 'bg-white/95 border border-white/20'
      }`}>
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pink-300/70">
            <img 
              src="/Logo1.png" 
              alt="Contabilidad Doña Araña" 
              className="w-16 h-16 object-contain"
            />
          </div>
          
          <h1 className={`text-3xl font-bold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Contabilidad Doña Araña
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 text-lg border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Introduce tu usuario"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 text-lg border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Introduce tu contraseña"
              />
              <button
                type="button"
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-lg font-medium transition-colors shadow-lg hover:shadow-blue-500/25"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className={`text-base font-medium ${
              isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-500'
            } transition-colors`}
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>

        <div className={`text-center text-sm mt-4 ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          <p>Acceso seguro al sistema de gestión financiera</p>
        </div>
      </div>
    </div>
  )
}

export default LoginModalLarge