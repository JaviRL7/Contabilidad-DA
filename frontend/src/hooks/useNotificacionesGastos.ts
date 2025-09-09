import { useState, useEffect } from 'react'

interface NotificacionGasto {
  id: string
  etiqueta: string
  monto: number
  fecha: string
  fechaCreacion: string
  mostrada: boolean
}

const STORAGE_KEY = 'notificaciones_gastos_automaticos'

export const useNotificacionesGastos = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionGasto[]>([])
  const [notificacionesActivas, setNotificacionesActivas] = useState<NotificacionGasto[]>([])

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    try {
      const notificacionesGuardadas = localStorage.getItem(STORAGE_KEY)
      if (notificacionesGuardadas) {
        const notificacionesParsed = JSON.parse(notificacionesGuardadas)
        setNotificaciones(notificacionesParsed)
        
        // Mostrar notificaciones no mostradas aún
        const noMostradas = notificacionesParsed.filter((n: NotificacionGasto) => !n.mostrada)
        setNotificacionesActivas(noMostradas)
      }
    } catch (error) {
      console.error('Error loading notificaciones from localStorage:', error)
    }
  }, [])

  // Guardar notificaciones en localStorage cuando cambien
  const saveNotificaciones = (nuevasNotificaciones: NotificacionGasto[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasNotificaciones))
      setNotificaciones(nuevasNotificaciones)
    } catch (error) {
      console.error('Error saving notificaciones to localStorage:', error)
    }
  }

  // Agregar una nueva notificación
  const agregarNotificacion = (etiqueta: string, monto: number, fecha: string) => {
    const nuevaNotificacion: NotificacionGasto = {
      id: `${etiqueta}-${fecha}-${Date.now()}`,
      etiqueta,
      monto,
      fecha,
      fechaCreacion: new Date().toISOString().split('T')[0],
      mostrada: false
    }
    
    // Verificar que no exista ya una notificación similar
    const existe = notificaciones.some(n => 
      n.etiqueta === etiqueta && n.fecha === fecha
    )
    
    if (!existe) {
      const nuevasNotificaciones = [...notificaciones, nuevaNotificacion]
      saveNotificaciones(nuevasNotificaciones)
      setNotificacionesActivas(prev => [...prev, nuevaNotificacion])
    }
  }

  // Marcar notificación como mostrada
  const marcarComoMostrada = (id: string) => {
    const notificacionesActualizadas = notificaciones.map(n => 
      n.id === id ? { ...n, mostrada: true } : n
    )
    saveNotificaciones(notificacionesActualizadas)
    setNotificacionesActivas(prev => prev.filter(n => n.id !== id))
  }

  // Cerrar notificación activa
  const cerrarNotificacion = (id: string) => {
    marcarComoMostrada(id)
  }

  // Obtener notificaciones recientes (últimos 30 días)
  const obtenerNotificacionesRecientes = (): NotificacionGasto[] => {
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)
    
    return notificaciones.filter(n => {
      const fechaNotificacion = new Date(n.fechaCreacion + 'T00:00:00')
      return fechaNotificacion >= hace30Dias
    }).sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  }

  // Limpiar notificaciones antiguas (más de 60 días)
  const limpiarNotificacionesAntiguas = () => {
    const hace60Dias = new Date()
    hace60Dias.setDate(hace60Dias.getDate() - 60)
    
    const notificacionesFiltradas = notificaciones.filter(n => {
      const fechaNotificacion = new Date(n.fechaCreacion + 'T00:00:00')
      return fechaNotificacion >= hace60Dias
    })
    
    if (notificacionesFiltradas.length !== notificaciones.length) {
      saveNotificaciones(notificacionesFiltradas)
    }
  }

  // Ejecutar limpieza al cargar
  useEffect(() => {
    limpiarNotificacionesAntiguas()
  }, [])

  return {
    notificaciones,
    notificacionesActivas,
    agregarNotificacion,
    cerrarNotificacion,
    obtenerNotificacionesRecientes,
    limpiarNotificacionesAntiguas
  }
}