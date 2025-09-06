// Sistema de seguridad básico para la aplicación

interface LoginAttempt {
  timestamp: number
  success: boolean
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

export const securityUtils = {
  // Control de intentos de login
  recordLoginAttempt(success: boolean) {
    const attempts: LoginAttempt[] = JSON.parse(
      localStorage.getItem('loginAttempts') || '[]'
    )
    
    attempts.push({
      timestamp: Date.now(),
      success
    })
    
    // Mantener solo los últimos 10 intentos
    const recentAttempts = attempts.slice(-10)
    localStorage.setItem('loginAttempts', JSON.stringify(recentAttempts))
  },

  // Verificar si está bloqueado
  isLockedOut(): { locked: boolean, remainingTime?: number } {
    const attempts: LoginAttempt[] = JSON.parse(
      localStorage.getItem('loginAttempts') || '[]'
    )
    
    const now = Date.now()
    const recentFailed = attempts.filter(
      attempt => !attempt.success && (now - attempt.timestamp) < LOCKOUT_DURATION
    )
    
    if (recentFailed.length >= MAX_FAILED_ATTEMPTS) {
      const oldestFailedTime = Math.min(...recentFailed.map(a => a.timestamp))
      const remainingTime = LOCKOUT_DURATION - (now - oldestFailedTime)
      
      if (remainingTime > 0) {
        return { locked: true, remainingTime }
      }
    }
    
    return { locked: false }
  },

  // Limpiar intentos después de login exitoso
  clearLoginAttempts() {
    localStorage.removeItem('loginAttempts')
  },

  // Sanitizar input del usuario
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
      .substring(0, 100) // Limitar longitud
  },

  // Verificar si la sesión es válida basada en actividad
  updateActivity() {
    localStorage.setItem('lastActivity', Date.now().toString())
  },

  // Verificar inactividad (30 minutos)
  checkInactivity(): boolean {
    const lastActivity = localStorage.getItem('lastActivity')
    if (!lastActivity) return false
    
    const inactiveTime = Date.now() - parseInt(lastActivity)
    const maxInactiveTime = 30 * 60 * 1000 // 30 minutos
    
    return inactiveTime > maxInactiveTime
  },

  // Generar headers de seguridad básicos
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
}