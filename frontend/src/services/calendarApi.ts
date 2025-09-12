import api from './api'

interface NotificacionCalendario {
  id?: number
  fecha: string
  texto_descriptivo: string
  etiqueta?: string
  tipo: 'general' | 'ingreso' | 'gasto'
  esta_vencida?: boolean
  fue_convertida_movimiento?: boolean
  fue_cancelada?: boolean
  created_at?: string
  updated_at?: string
}

interface NotificacionCalendarioCreate {
  fecha: string
  texto_descriptivo: string
  etiqueta?: string
  tipo?: 'general' | 'ingreso' | 'gasto'
}

interface NotificacionCalendarioUpdate {
  fecha?: string
  texto_descriptivo?: string
  etiqueta?: string
  tipo?: 'general' | 'ingreso' | 'gasto'
  fue_convertida_movimiento?: boolean
  fue_cancelada?: boolean
}

// Usar la configuración centralizada de api.ts

const handleApiError = (error: any, operation: string): never => {
  console.error(`❌ Error en ${operation}:`, error)
  
  let message = `Error en ${operation}`
  if (error.response?.data?.detail) {
    message = error.response.data.detail
  } else if (error.response?.status === 404) {
    message = 'Recurso no encontrado'
  } else if (error.response?.status === 400) {
    message = 'Datos inválidos'
  } else if (error.message) {
    message = error.message
  }
  
  throw new Error(message)
}

class NotificacionesCalendarioApi {

  async crearNotificacion(notificacion: NotificacionCalendarioCreate): Promise<NotificacionCalendario> {
    try {
      const response = await api.post('/notificaciones', notificacion)
      return response.data
    } catch (error) {
      handleApiError(error, 'crear notificación')
    }
  }

  async obtenerNotificaciones(params?: {
    pendientes_solo?: boolean
    vencidas_solo?: boolean
    futuras?: boolean
    limit?: number
  }): Promise<NotificacionCalendario[]> {
    try {
      const response = await api.get('/notificaciones', { params })
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones')
    }
  }

  async obtenerNotificacionesPendientes(): Promise<NotificacionCalendario[]> {
    try {
      const response = await api.get('/notificaciones/pendientes')
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones pendientes')
    }
  }

  async obtenerNotificacionesPorFecha(fecha: string): Promise<NotificacionCalendario[]> {
    try {
      const response = await api.get(`/notificaciones/calendario/${fecha}`)
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones por fecha')
    }
  }

  async actualizarNotificacion(id: number, notificacion: NotificacionCalendarioUpdate): Promise<NotificacionCalendario> {
    try {
      const response = await api.put(`/notificaciones/${id}`, notificacion)
      return response.data
    } catch (error) {
      handleApiError(error, 'actualizar notificación')
    }
  }

  async cancelarNotificacion(id: number): Promise<NotificacionCalendario> {
    try {
      const response = await api.post(`/notificaciones/${id}/cancelar`)
      return response.data
    } catch (error) {
      handleApiError(error, 'cancelar notificación')
    }
  }

  async convertirNotificacion(id: number): Promise<NotificacionCalendario> {
    try {
      const response = await api.post(`/notificaciones/${id}/convertir`)
      return response.data
    } catch (error) {
      handleApiError(error, 'convertir notificación')
    }
  }

  async eliminarNotificacion(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/notificaciones/${id}`)
      return response.data
    } catch (error) {
      handleApiError(error, 'eliminar notificación')
    }
  }

  async actualizarNotificacionesVencidas(): Promise<{ message: string }> {
    try {
      const response = await api.put('/notificaciones/actualizar-vencidas')
      return response.data
    } catch (error) {
      handleApiError(error, 'actualizar notificaciones vencidas')
    }
  }
}

const notificacionesApi = new NotificacionesCalendarioApi()

export type { NotificacionCalendario, NotificacionCalendarioCreate, NotificacionCalendarioUpdate }
export { notificacionesApi }