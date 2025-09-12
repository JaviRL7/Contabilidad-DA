import React, { useState, useEffect } from 'react'
import { Plus, X, Edit, Trash2, Calendar, DollarSign } from 'lucide-react'
import Card from '../ui/Card'
import GradientButton from '../ui/GradientButton'
import ConfirmacionBorradoModal from '../modals/ConfirmacionBorradoModal'
import ConfirmacionFechaPasadaModal from '../modals/ConfirmacionFechaPasadaModal'
import EditRecurringExpenseModal from '../modals/EditRecurringExpenseModal'
import PerfectScrollbar from 'react-perfect-scrollbar'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string // Format: 'MM-DD' (e.g., '03-15' for March 15)
  fechaCreacion?: string // Fecha de creación del gasto recurrente
}

interface ProximoGasto {
  gasto: GastoRecurrente
  proximaFecha: Date
  diasRestantes: number
  progreso: number
}

interface RechazosGastos {
  obtenerRechazosDeGasto: (etiqueta: string) => any[]
  limpiarRechazosDeGasto: (etiqueta: string) => void
}

interface RecurrentesViewProps {
  isDark: boolean
  gastosRecurrentes: GastoRecurrente[]
  onAddGastoRecurrente: (gasto: GastoRecurrente) => void
  onUpdateGastoRecurrente: (index: number, gasto: GastoRecurrente) => void
  onRemoveGastoRecurrente: (index: number) => void
  rechazosGastos: RechazosGastos
  notificacionesGastos?: {
    obtenerNotificacionesRecientes: () => any[]
  }
  etiquetas: { ingresos: string[], gastos: string[] }
  onCreateNewTag: (field: string, tipo: 'ingreso' | 'gasto') => void
  newTagCreated?: { field: string, tagName: string } | null
}

const RecurrentesView: React.FC<RecurrentesViewProps> = ({
  isDark,
  gastosRecurrentes,
  onAddGastoRecurrente,
  onUpdateGastoRecurrente,
  onRemoveGastoRecurrente,
  rechazosGastos,
  notificacionesGastos,
  etiquetas,
  onCreateNewTag,
  newTagCreated
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGasto, setEditingGasto] = useState<{ gasto: GastoRecurrente; index: number } | null>(null)
  const [formData, setFormData] = useState<GastoRecurrente>({
    etiqueta: '',
    monto: 0,
    frecuencia: 'mensual',
    diaMes: undefined
  })
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [isMontoFocused, setIsMontoFocused] = useState(false)
  const [isDiaMesFocused, setIsDiaMesFocused] = useState(false)
  
  // Funciones de validación
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.etiqueta.trim()) {
      errors.etiqueta = 'La etiqueta es obligatoria'
    }
    
    if (formData.monto <= 0) {
      errors.monto = 'El monto debe ser mayor que 0'
    } else if (formData.monto > 10000) {
      errors.monto = 'El monto no puede exceder 10,000€'
    }
    
    if (formData.frecuencia === 'mensual' && (!formData.diaMes || formData.diaMes < 1 || formData.diaMes > 31)) {
      errors.diaMes = 'Debe seleccionar un día válido (1-31)'
    }
    
    if (formData.frecuencia === 'anual' && !formData.fechaAnual) {
      errors.fechaAnual = 'Debe seleccionar una fecha anual'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  // Estados para modales
  const [gastoAEliminar, setGastoAEliminar] = useState<{ index: number, gasto: GastoRecurrente } | null>(null)
  const [showConfirmacionFechaPasada, setShowConfirmacionFechaPasada] = useState(false)
  const [gastoFechaPasada, setGastoFechaPasada] = useState<{ gasto: GastoRecurrente, fecha: string } | null>(null)

  // Effect para auto-seleccionar nueva etiqueta creada
  useEffect(() => {
    if (newTagCreated && newTagCreated.field === 'etiqueta') {
      setFormData(prev => ({ ...prev, etiqueta: newTagCreated.tagName }))
    }
  }, [newTagCreated])

  // Función para formatear dinero
  const formatEuro = (amount: number) => {
    return `${amount.toFixed(2)} €`
  }

  // Función para obtener el texto de frecuencia
  const getFrecuenciaText = (gasto: GastoRecurrente): string => {
    switch (gasto.frecuencia) {
      case 'mensual':
        return `Mensual (día ${gasto.diaMes})`
      case 'semanal':
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        const diaIndex = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].indexOf(gasto.diaSemana || 'lunes')
        return `Semanal (${dias[diaIndex]})`
      case 'anual':
        if (gasto.fechaAnual) {
          const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
          const fecha = new Date(2024, mes - 1, dia)
          return `Anual (${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})`
        }
        return 'Anual'
      default:
        return gasto.frecuencia
    }
  }

  // Función para verificar si hay rechazos
  const tieneRechazos = (etiqueta: string): boolean => {
    const rechazos = rechazosGastos.obtenerRechazosDeGasto(etiqueta)
    return rechazos.length > 0
  }

  // Función para obtener el último rechazo
  const obtenerUltimoRechazo = (etiqueta: string) => {
    const rechazos = rechazosGastos.obtenerRechazosDeGasto(etiqueta)
    if (rechazos.length === 0) return null
    return rechazos.sort((a, b) => b.fechaRechazo.localeCompare(a.fechaRechazo))[0]
  }

  // Calcular total mensual
  const totalMensual = gastosRecurrentes.reduce((total, gasto) => {
    switch (gasto.frecuencia) {
      case 'mensual':
        return total + gasto.monto
      case 'semanal':
        return total + (gasto.monto * 4.33) // Aproximadamente 4.33 semanas por mes
      case 'anual':
        return total + (gasto.monto / 12)
      default:
        return total
    }
  }, 0)

  // Función para calcular próximos gastos
  const calcularProximosGastos = (): ProximoGasto[] => {
    const hoy = new Date()
    const proximosGastos: ProximoGasto[] = []

    gastosRecurrentes.forEach(gasto => {
      if (tieneRechazos(gasto.etiqueta)) return

      let proximaFecha: Date
      let progreso: number = 0

      switch (gasto.frecuencia) {
        case 'mensual':
          if (gasto.diaMes) {
            proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.diaMes)
            if (proximaFecha <= hoy) {
              proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, gasto.diaMes)
            }
            
            const inicioMes = new Date(proximaFecha.getFullYear(), proximaFecha.getMonth(), 1)
            const diasEnMes = new Date(proximaFecha.getFullYear(), proximaFecha.getMonth() + 1, 0).getDate()
            const diasTranscurridos = hoy.getDate() - 1
            progreso = (diasTranscurridos / diasEnMes) * 100
          } else {
            proximaFecha = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
          break
        
        case 'semanal':
          const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
          const diaObjetivo = diasSemana.indexOf(gasto.diaSemana || 'lunes')
          const diaActual = hoy.getDay()
          
          let diasHastaObjetivo = diaObjetivo - diaActual
          if (diasHastaObjetivo <= 0) diasHastaObjetivo += 7
          
          proximaFecha = new Date(hoy.getTime() + diasHastaObjetivo * 24 * 60 * 60 * 1000)
          
          const inicioSemana = new Date(hoy.getTime() - diaActual * 24 * 60 * 60 * 1000)
          const diasTranscurridosSemana = (hoy.getTime() - inicioSemana.getTime()) / (24 * 60 * 60 * 1000)
          progreso = (diasTranscurridosSemana / 7) * 100
          break
        
        case 'anual':
          if (gasto.fechaAnual) {
            const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
            proximaFecha = new Date(hoy.getFullYear(), mes - 1, dia)
            if (proximaFecha <= hoy) {
              proximaFecha = new Date(hoy.getFullYear() + 1, mes - 1, dia)
            }
            
            const inicioAno = new Date(proximaFecha.getFullYear() - (proximaFecha <= hoy ? 0 : 1), 0, 1)
            const diasEnAno = new Date(inicioAno.getFullYear(), 11, 31).getDate() === 31 ? 365 : 366
            const diasTranscurridosAno = Math.floor((hoy.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000))
            progreso = (diasTranscurridosAno / diasEnAno) * 100
          } else {
            proximaFecha = new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate())
          }
          break
        
        default:
          proximaFecha = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
      }

      const diasRestantes = Math.ceil((proximaFecha.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000))
      
      proximosGastos.push({
        gasto,
        proximaFecha,
        diasRestantes,
        progreso: Math.max(0, Math.min(100, progreso))
      })
    })

    return proximosGastos.sort((a, b) => a.diasRestantes - b.diasRestantes)
  }

  const proximosGastos = calcularProximosGastos()

  // Funciones de manejo del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario antes de proceder
    if (!validateForm()) {
      return
    }
    
    const nuevoGasto = {
      ...formData,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }

    // Verificar si es una fecha pasada en el mes actual para gastos mensuales
    if (formData.frecuencia === 'mensual' && formData.diaMes) {
      const hoy = new Date()
      const fechaEsperada = new Date(hoy.getFullYear(), hoy.getMonth(), formData.diaMes)
      
      if (fechaEsperada < hoy && editingIndex === null) {
        // Es una fecha pasada en el mes actual y es un gasto nuevo
        setGastoFechaPasada({
          gasto: nuevoGasto,
          fecha: fechaEsperada.toISOString().split('T')[0]
        })
        setShowConfirmacionFechaPasada(true)
        return
      }
    }

    onAddGastoRecurrente(nuevoGasto)
    
    handleCancel()
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setFormData({
      etiqueta: '',
      monto: 0,
      frecuencia: 'mensual',
      diaMes: undefined
    })
  }

  const handleSaveEdit = (gastoActualizado: GastoRecurrente) => {
    if (editingGasto) {
      onUpdateGastoRecurrente(editingGasto.index, gastoActualizado)
      setEditingGasto(null)
      setShowEditModal(false)
    }
  }

  const handleEdit = (index: number) => {
    const gasto = gastosRecurrentes[index]
    setEditingGasto({ gasto, index })
    setShowEditModal(true)
  }

  const handleConfirmarEliminar = (index: number) => {
    setGastoAEliminar({ index, gasto: gastosRecurrentes[index] })
  }

  const handleEliminarGasto = () => {
    if (gastoAEliminar) {
      onRemoveGastoRecurrente(gastoAEliminar.index)
      
      // Limpiar rechazos del gasto eliminado
      rechazosGastos.limpiarRechazosDeGasto(gastoAEliminar.gasto.etiqueta)
      
      setGastoAEliminar(null)
    }
  }

  const confirmarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      onAddGastoRecurrente(gastoFechaPasada.gasto)
    }
    setShowConfirmacionFechaPasada(false)
    setGastoFechaPasada(null)
    handleCancel()
  }

  const rechazarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      onAddGastoRecurrente(gastoFechaPasada.gasto)
    }
    setShowConfirmacionFechaPasada(false)
    setGastoFechaPasada(null)
    handleCancel()
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header elegante */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gastos Continuos
          </h1>
          <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Automatiza y controla tus gastos regulares con inteligencia
          </p>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {gastosRecurrentes.length}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gastos configurados
            </p>
          </Card>
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {formatEuro(totalMensual)}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Estimación mensual
            </p>
          </Card>
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {formatEuro(totalMensual * 12)}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Proyección anual
            </p>
          </Card>
        </div>

        {/* Botón para crear nuevo gasto */}
        <div className="text-center">
          <GradientButton 
            variant="primary" 
            size="lg"
            onClick={() => setShowAddForm(!showAddForm)}
            isDark={isDark}
            className="px-8 py-3"
          >
            {showAddForm ? (
              <>
                <X className="w-5 h-5 mr-2" />
                Cerrar Formulario
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Gasto Continuo
              </>
            )}
          </GradientButton>
        </div>
      </div>

      {/* Formulario colapsable */}
      {showAddForm && (
        <Card isDark={isDark}>
          <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Nuevo Gasto Recurrente
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Etiqueta
                </label>
                <div className="relative">
                  <select
                    value={formData.etiqueta}
                    onChange={(e) => {
                      if (e.target.value === '__nueva__') {
                        onCreateNewTag('etiqueta', 'gasto')
                      } else {
                        setFormData({...formData, etiqueta: e.target.value})
                        clearError('etiqueta')
                      }
                    }}
                    className={`appearance-none w-full px-4 py-3 pr-12 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                      formErrors.etiqueta 
                        ? isDark 
                          ? 'border-yellow-500 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500' 
                          : 'border-yellow-500 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500'
                        : isDark 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    } focus:outline-none`}
                  >
                    <option value="">Seleccionar etiqueta...</option>
                    {etiquetas.gastos.map(etiq => (
                      <option key={etiq} value={etiq}>{etiq}</option>
                    ))}
                    <option value="__nueva__">+ Crear nueva etiqueta</option>
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`}>
                    <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                {formErrors.etiqueta && (
                  <div className={`mt-2 text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.etiqueta}
                  </div>
                )}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Monto
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isMontoFocused || formData.monto > 0 ? formData.monto.toString() : ''}
                    onFocus={() => {
                      setIsMontoFocused(true)
                      clearError('monto')
                    }}
                    onBlur={() => setIsMontoFocused(false)}
                    onChange={(e) => {
                      const value = e.target.value
                      // Solo permitir números y un punto decimal
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value) || 0
                        setFormData({...formData, monto: numValue})
                        clearError('monto')
                      }
                    }}
                    className={`w-full pl-4 pr-12 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                      formErrors.monto 
                        ? isDark 
                          ? 'border-yellow-500 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500' 
                          : 'border-yellow-500 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500'
                        : isDark 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    } focus:outline-none`}
                    placeholder={isMontoFocused ? "0.00" : "Introduce el monto"}
                  />
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold pointer-events-none ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`}>
                    €
                  </div>
                </div>
                {formErrors.monto && (
                  <div className={`mt-2 text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.monto}
                  </div>
                )}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Frecuencia
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'mensual', label: 'Mensual' },
                    { value: 'semanal', label: 'Semanal' },
                    { value: 'anual', label: 'Anual' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, frecuencia: option.value as any})}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        formData.frecuencia === option.value
                          ? isDark
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white shadow-md'
                          : isDark
                            ? 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-400 hover:to-gray-300 text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {formData.frecuencia === 'mensual' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Día del mes
                  </label>
                  <input
                    type="text"
                    value={formData.diaMes ? formData.diaMes.toString() : ''}
                    onFocus={() => {
                      setIsDiaMesFocused(true)
                      clearError('diaMes')
                    }}
                    onBlur={() => setIsDiaMesFocused(false)}
                    onChange={(e) => {
                      const value = e.target.value
                      // Solo permitir números entre 1 y 31
                      if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 31)) {
                        const numValue = parseInt(value) || undefined
                        setFormData({...formData, diaMes: numValue})
                        clearError('diaMes')
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                      formErrors.diaMes 
                        ? isDark
                          ? 'border-yellow-500 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500'
                          : 'border-yellow-500 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500'
                        : isDark
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    } focus:outline-none`}
                    placeholder={isDiaMesFocused ? "1" : "Día del mes (1-31)"}
                  />
                  {formErrors.diaMes && (
                    <div className={`mt-2 text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {formErrors.diaMes}
                    </div>
                  )}
                  
                  {formData.diaMes && formData.diaMes >= 29 && (
                    <div className={`mt-3 p-4 rounded-lg border ${isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-500 font-bold text-sm">⚠</span>
                        <div className="text-sm">
                          <strong>Aviso:</strong> {
                            formData.diaMes === 29 
                              ? 'El día 29 no existe en febrero algunos años (años no bisiestos). En esos casos, el gasto se creará automáticamente el día 28.'
                              : formData.diaMes === 30
                              ? 'El día 30 no existe en febrero. En febrero, el gasto se creará automáticamente el último día del mes.'
                              : 'El día 31 no existe en todos los meses (febrero, abril, junio, septiembre y noviembre). En esos meses, el gasto se creará automáticamente el último día del mes.'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {formData.frecuencia === 'semanal' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Día de la semana
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <select
                      value={formData.diaSemana || 'lunes'}
                      onChange={(e) => setFormData({...formData, diaSemana: e.target.value as any})}
                      className={`appearance-none w-full pl-12 pr-12 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
                    >
                      <option value="lunes">Lunes</option>
                      <option value="martes">Martes</option>
                      <option value="miercoles">Miércoles</option>
                      <option value="jueves">Jueves</option>
                      <option value="viernes">Viernes</option>
                      <option value="sabado">Sábado</option>
                      <option value="domingo">Domingo</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.frecuencia === 'anual' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fecha anual (Mes y día)
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="date"
                      value={`2024-${formData.fechaAnual || '01-01'}`}
                      onChange={(e) => {
                        const [_, mes, dia] = e.target.value.split('-')
                        setFormData({...formData, fechaAnual: `${mes}-${dia}`})
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
                    />
                  </div>
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Solo se usará el mes y día, el año será automático
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <GradientButton type="submit" variant="primary" size="lg" isDark={isDark}>
                <Plus className="w-5 h-5 mr-2" />
                Agregar
              </GradientButton>
              <GradientButton type="button" variant="secondary" size="lg" onClick={handleCancel} isDark={isDark}>
                <X className="w-5 h-5 mr-2" />
                Cancelar
              </GradientButton>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-8"></div>

      {/* Contenido principal */}
      <div className="space-y-12">
        {/* Sección de gastos configurados */}
        <div>
          <div className={`flex items-center justify-center mb-6 pb-3 border-b-2 ${isDark ? 'border-blue-400/30' : 'border-blue-300/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Gastos Configurados
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                {gastosRecurrentes.length} gastos
              </span>
            </div>
          </div>
            
          {gastosRecurrentes.length === 0 ? (
            <Card isDark={isDark} className="text-center py-12">
              <div className={`text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                ⚡
              </div>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No tienes gastos continuos configurados
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Automatiza tus gastos regulares para una gestión financiera más eficiente
              </p>
              <div className="mt-6">
                <GradientButton 
                  variant="primary" 
                  onClick={() => setShowAddForm(true)}
                  isDark={isDark}
                >
                  + Agregar Primer Gasto
                </GradientButton>
              </div>
            </Card>
          ) : (
            <PerfectScrollbar className="max-h-96">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 pr-2">
                {gastosRecurrentes.map((gasto, index) => {
                const rechazado = tieneRechazos(gasto.etiqueta)
                const ultimoRechazo = obtenerUltimoRechazo(gasto.etiqueta)
                const proximoGasto = proximosGastos.find(p => p.gasto.etiqueta === gasto.etiqueta)
                
                return (
                  <Card 
                    key={index}
                    isDark={isDark}
                    className={`p-4 transition-all duration-200 hover:shadow-lg ${rechazado ? isDark ? 'border-amber-400/50' : 'border-amber-300' : isDark ? 'hover:border-blue-400/50' : 'hover:border-blue-300'}`}
                  >
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {gasto.etiqueta}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            gasto.frecuencia === 'mensual'
                              ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                              : gasto.frecuencia === 'semanal'
                              ? isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                              : isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {gasto.frecuencia}
                          </span>
                          {rechazado && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                              Pausado
                            </span>
                          )}
                        </div>
                        
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getFrecuenciaText(gasto)}
                        </div>
                        
                        {/* Monto destacado */}
                        <div className="mt-3">
                          <div className={`text-2xl font-bold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {formatEuro(gasto.monto)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {gasto.frecuencia === 'mensual' ? 'por mes' : gasto.frecuencia === 'semanal' ? 'por semana' : 'por año'}
                          </div>
                        </div>
                        
                        {rechazado && ultimoRechazo && (
                          <div className={`p-3 rounded-lg mt-3 ${isDark ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
                            <div className={`text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                              Pausado el {new Date(ultimoRechazo.fechaRechazo + 'T00:00:00').toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Spacer */}
                      <div className="flex-1"></div>
                      
                      {/* Próximo */}
                      {proximoGasto && !rechazado && (
                        <div className={`mb-4 p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Próximo:</span>
                            <span className={`text-xs font-medium ${
                              proximoGasto.diasRestantes <= 3 
                                ? isDark ? 'text-orange-400' : 'text-orange-600'
                                : proximoGasto.diasRestantes <= 7 
                                ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                                : isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {proximoGasto.proximaFecha.toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short'
                              })} ({proximoGasto.diasRestantes === 0 ? 'Hoy' : proximoGasto.diasRestantes === 1 ? 'Mañana' : `${proximoGasto.diasRestantes}d`})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <GradientButton variant="secondary" size="sm" onClick={() => handleEdit(index)} isDark={isDark} className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </GradientButton>
                        <GradientButton variant="danger" size="sm" onClick={() => handleConfirmarEliminar(index)} isDark={isDark} className="flex-1">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </GradientButton>
                      </div>
                    </div>
                  </Card>
                  )
                })}
              </div>
            </PerfectScrollbar>
          )}
        </div>

        {/* Sección de próximos gastos */}
        {proximosGastos.length > 0 && (
          <div>
            <div className={`flex items-center justify-center mb-6 pb-3 border-b-2 ${isDark ? 'border-purple-400/30' : 'border-purple-300/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  Próximos Gastos
                </h2>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                }`}>
                  {proximosGastos.length} pendientes
                </span>
              </div>
            </div>
            
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {proximosGastos.slice(0, 6).map((proximo, index) => (
                <Card 
                  key={`${proximo.gasto.etiqueta}-${index}`}
                  isDark={isDark}
                  className={`p-4 transition-all duration-200 ${
                    proximo.diasRestantes <= 3 
                      ? isDark ? 'border-orange-400/50 hover:border-orange-400' : 'border-orange-300 hover:border-orange-400'
                      : proximo.diasRestantes <= 7 
                      ? isDark ? 'border-yellow-400/50 hover:border-yellow-400' : 'border-yellow-300 hover:border-yellow-400'
                      : isDark ? 'hover:border-green-400/50' : 'hover:border-green-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {proximo.gasto.etiqueta}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        proximo.diasRestantes <= 3 
                          ? isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800'
                          : proximo.diasRestantes <= 7 
                          ? isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        {proximo.diasRestantes === 0 ? 'Hoy' : proximo.diasRestantes === 1 ? 'Mañana' : `${proximo.diasRestantes}d`}
                      </span>
                    </div>
                    
                    <div className={`text-xl font-bold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {formatEuro(proximo.gasto.monto)}
                    </div>
                    
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {proximo.proximaFecha.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Historial reciente */}
        {notificacionesGastos && (() => {
          const gastosGenerados = notificacionesGastos.obtenerNotificacionesRecientes()
          return gastosGenerados.length > 0 ? (
            <div>
              <div className={`flex items-center justify-center mb-6 pb-3 border-b-2 ${isDark ? 'border-indigo-400/30' : 'border-indigo-300/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                    <svg className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Gastos Recientes
                  </h2>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    Últimos 30 días
                  </span>
                </div>
              </div>
              
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {gastosGenerados.slice(0, 6).map((gasto: any, index: number) => (
                  <Card 
                    key={`${gasto.id}-${index}`}
                    isDark={isDark}
                    className="p-4 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {gasto.etiqueta}
                        </h3>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(gasto.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {formatEuro(gasto.monto)}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                          Automático
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null
        })()}
      </div>

      {/* MODALES */}
      <EditRecurringExpenseModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingGasto(null)
        }}
        onSave={handleSaveEdit}
        gasto={editingGasto?.gasto || null}
        isDark={isDark}
        etiquetas={etiquetas}
        onCreateNewTag={onCreateNewTag}
        newTagCreated={newTagCreated}
      />

      <ConfirmacionBorradoModal
        isOpen={gastoAEliminar !== null}
        onClose={() => setGastoAEliminar(null)}
        gasto={gastoAEliminar?.gasto || null}
        onConfirmarBorrado={handleEliminarGasto}
        isDark={isDark}
      />

      <ConfirmacionFechaPasadaModal
        isOpen={showConfirmacionFechaPasada}
        onClose={() => {
          setShowConfirmacionFechaPasada(false)
          setGastoFechaPasada(null)
        }}
        gasto={gastoFechaPasada?.gasto || null}
        fechaCalculada={gastoFechaPasada?.fecha || ''}
        onConfirmar={confirmarGastoFechaPasada}
        onRechazar={rechazarGastoFechaPasada}
        isDark={isDark}
      />
    </div>
  )
}

export default RecurrentesView