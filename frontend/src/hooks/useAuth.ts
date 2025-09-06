import { useState, useEffect } from 'react'
import { AUTH_CREDENTIALS } from '../utils/constants'
import { securityUtils } from '../utils/security'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true'
    
    // Verificar inactividad
    if (isLoggedIn && securityUtils.checkInactivity()) {
      logout() // Auto-logout por inactividad
      setLoading(false)
      return
    }
    
    setIsAuthenticated(isLoggedIn)
    setLoading(false)

    // Actualizar actividad si está logueado
    if (isLoggedIn) {
      securityUtils.updateActivity()
    }
  }, [])

  const login = (username: string, password: string) => {
    // Verificar bloqueo por intentos fallidos
    const lockStatus = securityUtils.isLockedOut()
    if (lockStatus.locked) {
      const minutes = Math.ceil((lockStatus.remainingTime || 0) / (1000 * 60))
      return { 
        success: false, 
        message: `Cuenta bloqueada por múltiples intentos. Intenta de nuevo en ${minutes} minutos.` 
      }
    }

    // Sanitizar inputs
    const cleanUsername = securityUtils.sanitizeInput(username)
    const cleanPassword = securityUtils.sanitizeInput(password)

    if (cleanUsername === AUTH_CREDENTIALS.username && cleanPassword === AUTH_CREDENTIALS.password) {
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('loginTime', new Date().getTime().toString())
      securityUtils.updateActivity()
      securityUtils.recordLoginAttempt(true)
      securityUtils.clearLoginAttempts() // Limpiar intentos fallidos
      setIsAuthenticated(true)
      return { success: true, message: 'Login exitoso' }
    } else {
      securityUtils.recordLoginAttempt(false)
      return { success: false, message: 'Usuario o contraseña incorrectos' }
    }
  }

  const logout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('loginTime')
    setIsAuthenticated(false)
  }

  // Verificar si la sesión ha expirado (opcional, 24 horas de sesión)
  const checkSession = () => {
    const loginTime = localStorage.getItem('loginTime')
    if (loginTime) {
      const now = new Date().getTime()
      const sessionDuration = now - parseInt(loginTime)
      // 24 horas en milisegundos
      const maxSessionDuration = 24 * 60 * 60 * 1000
      
      if (sessionDuration > maxSessionDuration) {
        logout()
        return false
      }
    }
    return true
  }

  return { isAuthenticated, loading, login, logout, checkSession }
}