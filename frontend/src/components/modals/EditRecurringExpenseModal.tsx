import React, { useState, useEffect } from 'react'
import { X, Edit, Calendar, DollarSign, ChevronDown, Check } from 'lucide-react'
import Modal from '../ui/Modal'
import GradientButton from '../ui/GradientButton'
import ConfirmacionFechaPasadaModal from './ConfirmacionFechaPasadaModal'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string // Format: 'MM-DD' (e.g., '03-15' for March 15)
  fechaCreacion?: string // Fecha de creación del gasto recurrente
}

interface EditRecurringExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (gasto: GastoRecurrente) => void
  gasto: GastoRecurrente | null
  isDark: boolean
  etiquetas: { ingresos: string[], gastos: string[] }
  onCreateNewTag: (field: string, tipo: 'ingreso' | 'gasto') => void
  newTagCreated?: { field: string, tagName: string } | null
}

const EditRecurringExpenseModal: React.FC<EditRecurringExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  gasto,
  isDark,
  etiquetas,
  onCreateNewTag,
  newTagCreated
}) => {
  const [formData, setFormData] = useState<GastoRecurrente>({
    etiqueta: '',
    monto: 0,
    frecuencia: 'mensual',
    diaMes: undefined
  })
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [isMontoFocused, setIsMontoFocused] = useState(false)
  const [isDiaMesFocused, setIsDiaMesFocused] = useState(false)
  const [showConfirmacionFechaPasada, setShowConfirmacionFechaPasada] = useState(false)
  const [gastoFechaPasada, setGastoFechaPasada] = useState<{ gasto: GastoRecurrente; proximaFecha: Date } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Inicializar formulario cuando se abre el modal con datos
  useEffect(() => {
    if (isOpen && gasto) {
      setFormData({ ...gasto })
      setFormErrors({})
    } else if (isOpen && !gasto) {
      // Limpiar formulario si no hay gasto (modo crear)
      setFormData({
        etiqueta: '',
        monto: 0,
        frecuencia: 'mensual',
        diaMes: undefined
      })
      setFormErrors({})
    }
  }, [isOpen, gasto])

  // Manejar nueva etiqueta creada
  useEffect(() => {
    if (newTagCreated && newTagCreated.field === 'etiqueta' && isOpen) {
      setFormData(prev => ({ ...prev, etiqueta: newTagCreated.tagName }))
    }
  }, [newTagCreated, isOpen])

  // Cerrar dropdown cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

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

  // Calcular próxima fecha
  const calcularProximaFecha = (gasto: GastoRecurrente): Date => {
    const now = new Date()
    let proximaFecha = new Date()

    switch (gasto.frecuencia) {
      case 'mensual':
        proximaFecha = new Date(now.getFullYear(), now.getMonth(), gasto.diaMes!)
        if (proximaFecha <= now) {
          proximaFecha.setMonth(proximaFecha.getMonth() + 1)
        }
        break
      case 'semanal': {
        const diasSemana = {
          'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 
          'viernes': 5, 'sabado': 6, 'domingo': 0
        }
        const targetDay = diasSemana[gasto.diaSemana!]
        const today = now.getDay()
        let daysUntil = (targetDay - today + 7) % 7
        if (daysUntil === 0) daysUntil = 7
        
        proximaFecha = new Date(now)
        proximaFecha.setDate(now.getDate() + daysUntil)
        break
      }
      case 'anual':
        if (gasto.fechaAnual) {
          const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
          proximaFecha = new Date(now.getFullYear(), mes - 1, dia)
          if (proximaFecha <= now) {
            proximaFecha.setFullYear(proximaFecha.getFullYear() + 1)
          }
        }
        break
    }

    return proximaFecha
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const nuevoGasto: GastoRecurrente = {
      etiqueta: formData.etiqueta.trim(),
      monto: Number(formData.monto),
      frecuencia: formData.frecuencia,
      ...(formData.frecuencia === 'mensual' && { diaMes: formData.diaMes }),
      ...(formData.frecuencia === 'semanal' && { diaSemana: formData.diaSemana }),
      ...(formData.frecuencia === 'anual' && { fechaAnual: formData.fechaAnual }),
      fechaCreacion: gasto?.fechaCreacion || new Date().toISOString()
    }

    // Verificar si la próxima fecha es en el pasado
    const proximaFecha = calcularProximaFecha(nuevoGasto)
    const ahora = new Date()
    
    if (proximaFecha < ahora) {
      setGastoFechaPasada({ gasto: nuevoGasto, proximaFecha })
      setShowConfirmacionFechaPasada(true)
      return
    }

    onSave(nuevoGasto)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      etiqueta: '',
      monto: 0,
      frecuencia: 'mensual',
      diaMes: undefined
    })
    setFormErrors({})
    onClose()
  }

  const confirmarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      onSave(gastoFechaPasada.gasto)
    }
    setShowConfirmacionFechaPasada(false)
    setGastoFechaPasada(null)
    handleClose()
  }

  const rechazarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      onSave(gastoFechaPasada.gasto)
    }
    setShowConfirmacionFechaPasada(false)
    setGastoFechaPasada(null)
    handleClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isDark={isDark}>
        <div className="p-8 max-w-5xl w-full mx-auto">
          {/* Header del modal */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-600/20' : 'bg-blue-100'
              }`}>
                <Edit className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {gasto ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {gasto ? 'Modifica los detalles del gasto existente' : 'Configura un nuevo gasto automático'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Etiqueta */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Etiqueta
                </label>
                <div className="relative dropdown-container">
                  {/* Custom Dropdown with Perfect Scrollbar */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-lg font-medium transition-all duration-200 text-left ${
                      formErrors.etiqueta
                        ? 'border-red-300 bg-red-50/50 text-red-800'
                        : isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                    } focus:outline-none focus:ring-0`}
                  >
                    {formData.etiqueta || 'Selecciona una etiqueta'}
                  </button>
                  <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  } ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  
                  {/* Dropdown Options with Perfect Scrollbar */}
                  {isDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-lg z-50 ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}>
                      <PerfectScrollbar
                        options={{
                          suppressScrollX: true,
                          wheelPropagation: false
                        }}
                        style={{ maxHeight: '200px' }}
                      >
                        <div className="py-2">
                          {/* Empty option */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({...formData, etiqueta: ''})
                              clearError('etiqueta')
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                              formData.etiqueta === '' 
                                ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {formData.etiqueta === '' && <Check className="w-4 h-4" />}
                              <span className={formData.etiqueta === '' ? '' : 'ml-7'}>
                                Selecciona una etiqueta
                              </span>
                            </div>
                          </button>
                          
                          {/* Existing tags */}
                          {etiquetas.gastos.map((etiqueta, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, etiqueta})
                                clearError('etiqueta')
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                                formData.etiqueta === etiqueta 
                                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                  : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {formData.etiqueta === etiqueta && <Check className="w-4 h-4" />}
                                <span className={formData.etiqueta === etiqueta ? '' : 'ml-7'}>
                                  {etiqueta}
                                </span>
                              </div>
                            </button>
                          ))}
                          
                          {/* Create new tag option */}
                          <div className={`border-t-2 mt-2 pt-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <button
                              type="button"
                              onClick={() => {
                                onCreateNewTag('etiqueta', 'gasto')
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                                isDark ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">+</span>
                                <span>Crear nueva etiqueta</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </PerfectScrollbar>
                    </div>
                  )}
                </div>
                {formErrors.etiqueta && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {formErrors.etiqueta}
                  </p>
                )}
              </div>

              {/* Monto */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Monto (€)
                </label>
                <div className="relative">
                  <span className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium pointer-events-none ${
                    isMontoFocused
                      ? isDark ? 'text-blue-400' : 'text-blue-500'
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    €
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={formData.monto || ''}
                    onChange={(e) => {
                      setFormData({...formData, monto: parseFloat(e.target.value) || 0})
                      clearError('monto')
                    }}
                    onFocus={() => setIsMontoFocused(true)}
                    onBlur={() => setIsMontoFocused(false)}
                    style={{
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                    className={`w-full pl-4 pr-12 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      formErrors.monto
                        ? 'border-red-300 bg-red-50/50 text-red-800'
                        : isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                    } focus:outline-none focus:ring-0`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.monto && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {formErrors.monto}
                  </p>
                )}
              </div>
            </div>

            {/* Frecuencia */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Frecuencia
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['mensual', 'semanal', 'anual'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFormData({...formData, frecuencia: freq})}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                      formData.frecuencia === freq
                        ? isDark
                          ? 'bg-blue-600/20 border-blue-400 text-blue-300'
                          : 'bg-blue-100 border-blue-500 text-blue-700'
                        : isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold capitalize">{freq}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración específica según frecuencia */}
            {formData.frecuencia === 'mensual' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Día del mes
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
                    isDiaMesFocused
                      ? isDark ? 'text-blue-400' : 'text-blue-500'
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.diaMes || ''}
                    onChange={(e) => {
                      setFormData({...formData, diaMes: parseInt(e.target.value) || undefined})
                      clearError('diaMes')
                    }}
                    onFocus={() => setIsDiaMesFocused(true)}
                    onBlur={() => setIsDiaMesFocused(false)}
                    style={{
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      formErrors.diaMes
                        ? 'border-red-300 bg-red-50/50 text-red-800'
                        : isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                    } focus:outline-none focus:ring-0`}
                    placeholder="Día (1-31)"
                  />
                </div>
                {formErrors.diaMes && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {formErrors.diaMes}
                  </p>
                )}
              </div>
            )}

            {formData.frecuencia === 'semanal' && (
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Día de la semana
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setFormData({...formData, diaSemana: dia as any})}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.diaSemana === dia
                          ? isDark
                            ? 'bg-blue-600/20 border-2 border-blue-400 text-blue-300'
                            : 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                          : isDark
                          ? 'bg-gray-700 border-2 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {dia.charAt(0).toUpperCase() + dia.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.frecuencia === 'anual' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha anual (MM-DD)
                </label>
                <input
                  type="text"
                  pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"
                  placeholder="03-15 (15 de Marzo)"
                  value={formData.fechaAnual || ''}
                  onChange={(e) => {
                    setFormData({...formData, fechaAnual: e.target.value})
                    clearError('fechaAnual')
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                    formErrors.fechaAnual
                      ? 'border-red-300 bg-red-50/50 text-red-800'
                      : isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                  } focus:outline-none focus:ring-0`}
                />
                {formErrors.fechaAnual && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {formErrors.fechaAnual}
                  </p>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 justify-end">
              <GradientButton type="submit" variant="primary" size="md" isDark={isDark}>
                <Edit className="w-4 h-4 mr-2" />
                {gasto ? 'Actualizar' : 'Crear'}
              </GradientButton>
              <GradientButton type="button" variant="secondary" size="md" onClick={handleClose} isDark={isDark}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </GradientButton>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de confirmación para fecha pasada */}
      <ConfirmacionFechaPasadaModal
        isOpen={showConfirmacionFechaPasada}
        onClose={() => setShowConfirmacionFechaPasada(false)}
        onConfirmar={confirmarGastoFechaPasada}
        onRechazar={rechazarGastoFechaPasada}
        gastoData={gastoFechaPasada}
        isDark={isDark}
      />
    </>
  )
}

export default EditRecurringExpenseModal