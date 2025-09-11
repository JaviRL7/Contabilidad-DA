import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, startOfToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  type NotificacionCalendario, 
  type NotificacionCalendarioCreate,
  notificacionesApi 
} from '../../services/calendarApi'

interface CalendarViewProps {
  isDark: boolean
  etiquetas: { ingresos: string[], gastos: string[] }
  onCreateMovementFromNotification: (notificacion: NotificacionCalendario) => void
}

const CalendarView: React.FC<CalendarViewProps> = ({
  isDark,
  etiquetas,
  onCreateMovementFromNotification
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [notificaciones, setNotificaciones] = useState<NotificacionCalendario[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [newNotification, setNewNotification] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    texto_descriptivo: '',
    etiqueta: '',
    tipo: 'general' as 'general' | 'ingreso' | 'gasto'
  })

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const cargarNotificaciones = async () => {
    try {
      setLoading(true)
      const todasNotificaciones = await notificacionesApi.obtenerNotificaciones({ limit: 100 })
      setNotificaciones(todasNotificaciones)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async () => {
    if (!newNotification.texto_descriptivo.trim()) {
      alert('Por favor, ingresa una descripción para la notificación')
      return
    }

    try {
      const notificationData: NotificacionCalendarioCreate = {
        fecha: newNotification.fecha,
        texto_descriptivo: newNotification.texto_descriptivo,
        etiqueta: newNotification.etiqueta || undefined,
        tipo: newNotification.tipo
      }

      await notificacionesApi.crearNotificacion(notificationData)
      
      setNewNotification({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        texto_descriptivo: '',
        etiqueta: '',
        tipo: 'general'
      })
      
      setShowCreateModal(false)
      await cargarNotificaciones()
    } catch (error) {
      console.error('Error al crear notificación:', error)
      alert('Error al crear la notificación')
    }
  }

  const handleCancelNotification = async (id: number) => {
    try {
      await notificacionesApi.cancelarNotificacion(id)
      await cargarNotificaciones()
    } catch (error) {
      console.error('Error al cancelar notificación:', error)
    }
  }

  const handleConvertToMovement = async (notificacion: NotificacionCalendario) => {
    try {
      await notificacionesApi.convertirNotificacion(notificacion.id!)
      onCreateMovementFromNotification(notificacion)
      await cargarNotificaciones()
    } catch (error) {
      console.error('Error al convertir notificación:', error)
    }
  }

  // Get month calendar
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Filter notifications
  const today = startOfToday()
  const notificacionesPendientes = notificaciones.filter(n => 
    !n.fue_cancelada && !n.fue_convertida_movimiento && 
    (isBefore(new Date(n.fecha), today) || isSameDay(new Date(n.fecha), today))
  )
  const notificacionesFuturas = notificaciones.filter(n => 
    !n.fue_cancelada && !n.fue_convertida_movimiento && 
    isAfter(new Date(n.fecha), today)
  )

  const getNotificationsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return notificaciones.filter(n => n.fecha === dateStr && !n.fue_cancelada)
  }

  const getNotificationColor = (notificacion: NotificacionCalendario) => {
    if (notificacion.fue_convertida_movimiento) return 'border-green-500 bg-green-50 dark:bg-green-900/20'
    if (notificacion.fue_cancelada) return 'border-gray-400 bg-gray-50 dark:bg-gray-800'
    if (isBefore(new Date(notificacion.fecha), today)) return 'border-red-500 bg-red-50 dark:bg-red-900/20'
    return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  return (
    <div className={`transition-all duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario de Notificaciones
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gestiona tus recordatorios y movimientos pendientes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Notificación
          </button>
        </div>

        {/* Alert para notificaciones pendientes */}
        {notificacionesPendientes.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="bg-amber-500 rounded-full p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  {notificacionesPendientes.length} notificación{notificacionesPendientes.length !== 1 ? 'es' : ''} pendiente{notificacionesPendientes.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Hay notificaciones que requieren tu atención
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Calendario principal - ocupará más espacio */}
          <div className="lg:col-span-3">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg`}>
              
              {/* Header del calendario */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className={`p-2 rounded-lg transition-colors hover:shadow-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className={`p-2 rounded-lg transition-colors hover:shadow-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Días de la semana */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grid del calendario */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayNotifications = getNotificationsForDate(day)
                  const isToday = isSameDay(day, today)
                  const isInCurrentMonth = isCurrentMonth(day)
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-100 dark:border-gray-700 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        !isInCurrentMonth ? 'text-gray-300 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-800/50' : ''
                      } ${
                        isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isInCurrentMonth 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {format(day, 'd')}
                        {isToday && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mt-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {dayNotifications.length > 0 && (
                        <div className="space-y-1">
                          {dayNotifications.slice(0, 3).map(notif => (
                            <div
                              key={notif.id}
                              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                notif.esta_vencida && !notif.fue_convertida_movimiento
                                  ? 'bg-red-500 text-white'
                                  : notif.fue_convertida_movimiento
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 text-white'
                              }`}
                              title={notif.texto_descriptivo}
                            >
                              <div className="w-1 h-1 bg-current rounded-full flex-shrink-0"></div>
                              <span className="truncate">{notif.texto_descriptivo}</span>
                            </div>
                          ))}
                          {dayNotifications.length > 3 && (
                            <div className="text-xs text-center font-medium text-gray-500 dark:text-gray-400">
                              +{dayNotifications.length - 3} más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Leyenda */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Vencidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Programadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Completadas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel lateral de notificaciones */}
          <div className="space-y-6">
            
            {/* Notificaciones Pendientes */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Pendientes ({notificacionesPendientes.length})
                </h3>
              </div>
              
              <div className="p-4">
                {notificacionesPendientes.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No hay notificaciones pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {notificacionesPendientes.map((notificacion) => (
                      <div
                        key={notificacion.id}
                        className={`p-3 rounded-lg border ${getNotificationColor(notificacion)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notificacion.texto_descriptivo}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(notificacion.fecha), 'dd/MM/yyyy', { locale: es })}
                            </p>
                            {notificacion.etiqueta && (
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                                {notificacion.etiqueta}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConvertToMovement(notificacion)}
                            className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Crear Movimiento
                          </button>
                          <button
                            onClick={() => handleCancelNotification(notificacion.id!)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notificaciones Futuras */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-blue-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Futuras ({notificacionesFuturas.length})
                </h3>
              </div>
              
              <div className="p-4">
                {notificacionesFuturas.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No hay notificaciones futuras</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {notificacionesFuturas.map((notificacion) => (
                      <div
                        key={notificacion.id}
                        className={`p-3 rounded-lg border ${getNotificationColor(notificacion)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notificacion.texto_descriptivo}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(notificacion.fecha), 'dd/MM/yyyy', { locale: es })}
                            </p>
                            {notificacion.etiqueta && (
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                                {notificacion.etiqueta}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelNotification(notificacion.id!)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Nueva Notificación
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newNotification.fecha}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, fecha: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Descripción
                  </label>
                  <textarea
                    value={newNotification.texto_descriptivo}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, texto_descriptivo: e.target.value }))}
                    placeholder="Describe la notificación..."
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tipo
                  </label>
                  <select
                    value={newNotification.tipo}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="general">General</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Etiqueta (opcional)
                  </label>
                  <select
                    value={newNotification.etiqueta}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, etiqueta: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Ninguna etiqueta</option>
                    {newNotification.tipo === 'ingreso' || newNotification.tipo === 'general' ? (
                      etiquetas.ingresos.map(etiq => (
                        <option key={etiq} value={etiq}>{etiq}</option>
                      ))
                    ) : null}
                    {newNotification.tipo === 'gasto' || newNotification.tipo === 'general' ? (
                      etiquetas.gastos.map(etiq => (
                        <option key={etiq} value={etiq}>{etiq}</option>
                      ))
                    ) : null}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNotification}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Crear Notificación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView