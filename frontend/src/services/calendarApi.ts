import axios from 'axios'

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

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/notificaciones`

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
      const response = await axios.post(API_BASE, notificacion)
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
      const response = await axios.get(API_BASE, { params })
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones')
    }
  }

  async obtenerNotificacionesPendientes(): Promise<NotificacionCalendario[]> {
    try {
      const response = await axios.get(`${API_BASE}/pendientes`)
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones pendientes')
    }
  }

  async obtenerNotificacionesPorFecha(fecha: string): Promise<NotificacionCalendario[]> {
    try {
      const response = await axios.get(`${API_BASE}/calendario/${fecha}`)
      return response.data
    } catch (error) {
      handleApiError(error, 'obtener notificaciones por fecha')
    }
  }

  async actualizarNotificacion(id: number, notificacion: NotificacionCalendarioUpdate): Promise<NotificacionCalendario> {
    try {
      const response = await axios.put(`${API_BASE}/${id}`, notificacion)
      return response.data
    } catch (error) {
      handleApiError(error, 'actualizar notificación')
    }
  }

  async cancelarNotificacion(id: number): Promise<NotificacionCalendario> {
    try {
      const response = await axios.post(`${API_BASE}/${id}/cancelar`)
      return response.data
    } catch (error) {
      handleApiError(error, 'cancelar notificación')
    }
  }

  async convertirNotificacion(id: number): Promise<NotificacionCalendario> {
    try {
      const response = await axios.post(`${API_BASE}/${id}/convertir`)
      return response.data
    } catch (error) {
      handleApiError(error, 'convertir notificación')
    }
  }

  async eliminarNotificacion(id: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE}/${id}`)
      return response.data
    } catch (error) {
      handleApiError(error, 'eliminar notificación')
    }
  }

  async actualizarNotificacionesVencidas(): Promise<{ message: string }> {
    try {
      const response = await axios.put(`${API_BASE}/actualizar-vencidas`)
      return response.data
    } catch (error) {
      handleApiError(error, 'actualizar notificaciones vencidas')
    }
  }
}

const notificacionesApi = new NotificacionesCalendarioApi()

export type { NotificacionCalendario, NotificacionCalendarioCreate, NotificacionCalendarioUpdate }
export { notificacionesApi }