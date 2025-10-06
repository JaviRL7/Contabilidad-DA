import { useState, useEffect } from 'react'
import api from '../services/api'
import { securityUtils } from '../utils/security'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    // Verificar inactividad
    if (token && securityUtils.checkInactivity()) {
      logout() // Auto-logout por inactividad
      setLoading(false)
      return
    }

    setIsAuthenticated(!!token)
    setLoading(false)

    // Actualizar actividad si está logueado
    if (token) {
      securityUtils.updateActivity()
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      // Verificar bloqueo por intentos fallidos
      const lockStatus = securityUtils.isLockedOut()
      if (lockStatus.locked) {
        const minutes = Math.ceil((lockStatus.remainingTime || 0) / (1000 * 60))
        return {
          success: false,
          message: `Cuenta bloqueada por múltiples intentos. Intenta de nuevo en ${minutes} minutos.`
        }
      }

      // NO sanitizar credenciales - pueden contener caracteres especiales válidos
      const cleanUsername = username.trim()
      const cleanPassword = password.trim()

      // Llamar a la API de login
      console.log('🔐 Intentando login con:', { username: cleanUsername })
      const response = await api.post('/auth/login', {
        username: cleanUsername,
        password: cleanPassword
      })
      console.log('✅ Respuesta del servidor:', response)

      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token)
        localStorage.setItem('loginTime', new Date().getTime().toString())
        securityUtils.updateActivity()
        securityUtils.recordLoginAttempt(true)
        securityUtils.clearLoginAttempts()
        setIsAuthenticated(true)
        return { success: true, message: 'Login exitoso' }
      } else {
        securityUtils.recordLoginAttempt(false)
        return { success: false, message: 'Error en la autenticación' }
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      console.error('❌ Error response:', error.response)
      securityUtils.recordLoginAttempt(false)
      const errorMessage = error.response?.data?.detail || 'Usuario o contraseña incorrectos'
      return { success: false, message: errorMessage }
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const cleanUsername = username.trim()
      const cleanEmail = email.trim()
      const cleanPassword = password.trim()

      console.log('📝 Intentando registro con:', { username: cleanUsername, email: cleanEmail })
      const response = await api.post('/auth/register', {
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword
      })
      console.log('✅ Respuesta del servidor (registro):', response)

      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token)
        localStorage.setItem('loginTime', new Date().getTime().toString())
        securityUtils.updateActivity()
        setIsAuthenticated(true)
        return { success: true, message: 'Registro exitoso' }
      } else {
        return { success: false, message: 'Error en el registro' }
      }
    } catch (error: any) {
      console.error('❌ Error en registro:', error)
      console.error('❌ Error response:', error.response)
      const errorMessage = error.response?.data?.detail || 'Error al crear la cuenta'
      return { success: false, message: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
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

  return { isAuthenticated, loading, login, register, logout, checkSession }
}