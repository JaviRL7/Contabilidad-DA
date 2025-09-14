import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, startOfToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  type NotificacionCalendario, 
  type NotificacionCalendarioCreate,
  notificacionesApi 
} from '../../services/calendarApi'
import AddMovementForm from '../forms/AddMovementForm'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '../../datepicker.css'

interface CalendarViewProps {
  isDark: boolean
  etiquetas: { ingresos: string[], gastos: string[] }
  onCreateMovementFromNotification: (notificacion: NotificacionCalendario) => void
  onSaveNewMovement: (movement: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number }>
  }) => void
  onCreateNewTag: (field: string, tipo: 'ingreso' | 'gasto') => void
  newTagCreated?: {field: string, tagName: string} | null
}

const CalendarView: React.FC<CalendarViewProps> = ({
  isDark,
  etiquetas,
  onCreateMovementFromNotification,
  onSaveNewMovement,
  onCreateNewTag,
  newTagCreated
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [notificaciones, setNotificaciones] = useState<NotificacionCalendario[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preselectedTag, setPreselectedTag] = useState<{etiqueta: string, tipo: 'ingreso' | 'gasto'} | null>(null)
  
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
    onCreateMovementFromNotification(notificacion)
  }

  const handleSaveMovement = async (movement: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number }>
  }) => {
    try {
      await onSaveNewMovement(movement)
      setShowMovementModal(false)
      setPreselectedTag(null)
    } catch (error) {
      console.error('Error al crear movimiento:', error)
    }
  }

  const handleCancelMovement = () => {
    setShowMovementModal(false)
    setPreselectedTag(null)
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
  const notificacionesConvertidas = notificaciones.filter(n => 
    n.fue_convertida_movimiento && !n.fue_cancelada
  ).slice(0, 10) // Mostrar solo las últimas 10 convertidas

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
          <div className="flex gap-3">
            <button
              onClick={() => setShowMovementModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nuevo Movimiento
            </button>
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
                        index % 7 === 0 ? 'border-l' : ''
                      } ${
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
                              {notif.fue_convertida_movimiento ? (
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-1 h-1 bg-current rounded-full flex-shrink-0"></div>
                              )}
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
                              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-gray-700 rounded-full text-xs text-blue-800 dark:text-gray-300">
                                {notificacion.etiqueta}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {notificacion.fue_convertida_movimiento ? (
                            <div className="flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded-lg flex items-center justify-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Movimiento Creado
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
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
                              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-gray-700 rounded-full text-xs text-blue-800 dark:text-gray-300">
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

        {/* Historial de Notificaciones Convertidas */}
        {notificacionesConvertidas.length > 0 && (
          <div className="mt-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Historial ocupa las 3 columnas como el calendario */}
              <div className="lg:col-span-3">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Historial de Movimientos Creados</h3>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Notificaciones que se convirtieron en movimientos ({notificacionesConvertidas.length})
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <PerfectScrollbar className="max-h-60">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notificacionesConvertidas.map((notificacion) => (
                          <div
                            key={notificacion.id}
                            className={`p-6 rounded-xl border-l-4 transition-all duration-200 ${
                              notificacion.tipo === 'ingreso'
                                ? `border-green-500 ${isDark ? 'bg-gradient-to-r from-green-900/20 to-green-800/10 hover:bg-green-900/30' : 'bg-gradient-to-r from-green-50 to-green-25 hover:bg-green-100'}`
                                : notificacion.tipo === 'gasto'
                                ? `border-red-500 ${isDark ? 'bg-gradient-to-r from-red-900/20 to-red-800/10 hover:bg-red-900/30' : 'bg-gradient-to-r from-red-50 to-red-25 hover:bg-red-100'}`
                                : `border-gray-500 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {notificacion.tipo && notificacion.tipo !== 'general' ? (
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                      notificacion.tipo === 'ingreso'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                    }`}>
                                      {notificacion.tipo === 'ingreso' ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  
                                  <div className="flex-1">
                                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {notificacion.texto_descriptivo}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {format(new Date(notificacion.fecha), 'dd/MM', { locale: es })}
                                      </span>
                                      {notificacion.etiqueta && (
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                          notificacion.tipo === 'ingreso'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                            : notificacion.tipo === 'gasto'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                          {notificacion.etiqueta}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PerfectScrollbar>
                  </div>
                </div>
              </div>
              
              {/* Columna vacía para mantener el layout */}
              <div className="lg:col-span-1 hidden lg:block"></div>
            </div>
          </div>
        )}

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Nueva Notificación</h3>
                      <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Crea un recordatorio para tus movimientos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                <PerfectScrollbar className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Fecha */}
                    <div>
                      <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Fecha
                      </label>
                      <DatePicker
                        selected={new Date(newNotification.fecha)}
                        onChange={(date) => setNewNotification(prev => ({ 
                          ...prev, 
                          fecha: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                        }))}
                        dateFormat="dd/MM/yyyy"
                        locale={es}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholderText="Selecciona una fecha"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Descripción
                      </label>
                      <textarea
                        value={newNotification.texto_descriptivo}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, texto_descriptivo: e.target.value }))}
                        placeholder="Describe el recordatorio..."
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      />
                    </div>

                    {/* Tipo - Botones */}
                    <div>
                      <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tipo de notificación
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewNotification(prev => ({ ...prev, tipo: 'general' }))}
                          className={`p-3 rounded-lg border-2 transition-all font-medium ${
                            newNotification.tipo === 'general'
                              ? 'border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              : isDark
                                ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                                : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'
                          } flex items-center justify-center gap-2`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          General
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewNotification(prev => ({ ...prev, tipo: 'ingreso' }))}
                          className={`p-3 rounded-lg border-2 transition-all font-medium ${
                            newNotification.tipo === 'ingreso'
                              ? 'border-green-500 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : isDark
                                ? 'border-gray-600 hover:border-green-500 text-gray-400 hover:text-green-300'
                                : 'border-gray-300 hover:border-green-400 text-gray-600 hover:text-green-700'
                          } flex items-center justify-center gap-2`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Ingreso
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewNotification(prev => ({ ...prev, tipo: 'gasto' }))}
                          className={`p-3 rounded-lg border-2 transition-all font-medium ${
                            newNotification.tipo === 'gasto'
                              ? 'border-red-500 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              : isDark
                                ? 'border-gray-600 hover:border-red-500 text-gray-400 hover:text-red-300'
                                : 'border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-700'
                          } flex items-center justify-center gap-2`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                          </svg>
                          Gasto
                        </button>
                      </div>
                    </div>

                    {/* Etiqueta */}
                    <div>
                      <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Etiqueta (opcional)
                      </label>
                      <select
                        value={newNotification.etiqueta}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, etiqueta: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border ${
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
                </PerfectScrollbar>
              </div>
              
              {/* Botones del footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNotification}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Crear Notificación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear movimiento */}
        {showMovementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-4xl w-full max-h-[90vh] rounded-xl shadow-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } flex flex-col`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Crear Nuevo Movimiento</h2>
                      <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Registra tus ingresos y gastos del día
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelMovement}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <PerfectScrollbar className="h-full">
                  <div className="p-6">
                    <AddMovementForm
                      isDark={isDark}
                      etiquetas={etiquetas}
                      onSave={handleSaveMovement}
                      onCancel={handleCancelMovement}
                      onCreateNewTag={onCreateNewTag}
                      newTagCreated={newTagCreated}
                      preselectedTag={preselectedTag}
                    />
                  </div>
                </PerfectScrollbar>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView