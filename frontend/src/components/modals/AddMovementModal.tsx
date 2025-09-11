import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import { parseISO } from 'date-fns'
import { formatEuro } from '../../utils/formatters'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

interface AddMovementModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  onSave: (movementData: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number, es_recurrente: boolean }>
  }) => void
  etiquetas: {
    ingresos: string[]
    gastos: string[]
  }
}

// Utility function
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const AddMovementModal: React.FC<AddMovementModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onSave,
  etiquetas
}) => {
  const [selectedDate, setSelectedDate] = useState(formatDateForAPI(new Date()))
  const [newIncome, setNewIncome] = useState({ etiqueta: '', monto: '' })
  const [newExpense, setNewExpense] = useState({ etiqueta: '', monto: '' })
  const [ingresos, setIngresos] = useState<Array<{ etiqueta: string, monto: number }>>([])
  const [gastos, setGastos] = useState<Array<{ etiqueta: string, monto: number, es_recurrente: boolean }>>([])
  
  // Simple tag creation state
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [createTagType, setCreateTagType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [newTagName, setNewTagName] = useState('')
  const [pendingTagField, setPendingTagField] = useState<string | null>(null)
  
  // Dropdown states
  const [isIngresoDropdownOpen, setIsIngresoDropdownOpen] = useState(false)
  const [isGastoDropdownOpen, setIsGastoDropdownOpen] = useState(false)

  if (!isOpen) return null

  const handleCreateNewTag = (field: string, tipo: 'ingreso' | 'gasto') => {
    setPendingTagField(field)
    setCreateTagType(tipo)
    setShowCreateTagModal(true)
  }

  const confirmCreateTag = () => {
    if (newTagName.trim() && pendingTagField) {
      if (pendingTagField === 'newIncome.etiqueta') {
        setNewIncome(prev => ({ ...prev, etiqueta: newTagName }))
      } else if (pendingTagField === 'newExpense.etiqueta') {
        setNewExpense(prev => ({ ...prev, etiqueta: newTagName }))
      }
      
      setShowCreateTagModal(false)
      setPendingTagField(null)
      setNewTagName('')
    }
  }

  const handleAddIncome = () => {
    const monto = parseFloat(newIncome.monto)
    if (!newIncome.etiqueta || isNaN(monto) || monto <= 0) return

    setIngresos(prev => [...prev, { etiqueta: newIncome.etiqueta, monto }])
    setNewIncome({ etiqueta: '', monto: '' })
  }

  const handleAddExpense = () => {
    const monto = parseFloat(newExpense.monto)
    if (!newExpense.etiqueta || isNaN(monto) || monto <= 0) return

    setGastos(prev => [...prev, { etiqueta: newExpense.etiqueta, monto, es_recurrente: false }])
    setNewExpense({ etiqueta: '', monto: '' })
  }

  const handleRemoveIncome = (index: number) => {
    setIngresos(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExpense = (index: number) => {
    setGastos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (ingresos.length === 0 && gastos.length === 0) {
      alert('Debes agregar al menos un ingreso o un gasto')
      return
    }

    onSave({
      fecha: selectedDate,
      ingresos,
      gastos
    })

    // Reset form
    setSelectedDate(formatDateForAPI(new Date()))
    setIngresos([])
    setGastos([])
    setNewIncome({ etiqueta: '', monto: '' })
    setNewExpense({ etiqueta: '', monto: '' })
    onClose()
  }

  const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0)
  const totalGastos = gastos.reduce((sum, gas) => sum + gas.monto, 0)
  const balance = totalIngresos - totalGastos

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-auto`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Agregar Nuevo Movimiento
            </h2>
            <button
              onClick={onClose}
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

          {/* Content */}
          <div className="p-6">
            {/* Date Selector */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fecha del movimiento
              </label>
              <DatePicker
                selected={parseISO(selectedDate)}
                onChange={(date: Date) => setSelectedDate(formatDateForAPI(date))}
                className={`w-full px-4 py-3 rounded-lg border text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                wrapperClassName="w-full md:w-auto"
                dateFormat="dd/MM/yyyy"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8 relative">
              {/* Línea separadora vertical */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
                <div className={`h-full w-full ${
                  isDark 
                    ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                    : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
                }`}></div>
              </div>

              {/* Ingresos */}
              <div className="pr-3">
                <div className="mb-4">
                  <h4 className="text-green-500 font-semibold text-lg mb-2">Agregar Ingresos</h4>
                  <div className={`h-px w-full ${
                    isDark 
                      ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                  }`}></div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Etiqueta
                    </label>
                    <div className="relative">
                      {/* Custom Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsIngresoDropdownOpen(!isIngresoDropdownOpen)}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border text-left ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200`}>
                        {newIncome.etiqueta || "Seleccionar etiqueta..."}
                      </button>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>

                      {/* Dropdown Options with Perfect Scrollbar */}
                      {isIngresoDropdownOpen && (
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
                              <div className="px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewIncome(prev => ({...prev, etiqueta: ''}))
                                    setIsIngresoDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                    isDark 
                                      ? 'hover:bg-gray-600 text-gray-300 hover:text-white' 
                                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                  } ${!newIncome.etiqueta ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900') : ''}`}
                                >
                                  <span>Seleccionar etiqueta...</span>
                                </button>
                              </div>
                              {etiquetas.ingresos.map((etiq) => (
                                <div key={etiq} className="px-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewIncome(prev => ({...prev, etiqueta: etiq}))
                                      setIsIngresoDropdownOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                      isDark 
                                        ? 'hover:bg-gray-600 text-gray-300 hover:text-white' 
                                        : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                    } ${newIncome.etiqueta === etiq ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900') : ''}`}
                                  >
                                    <span>{etiq}</span>
                                  </button>
                                </div>
                              ))}
                              <div className="px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCreateNewTag('newIncome.etiqueta', 'ingreso')
                                    setIsIngresoDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                    isDark 
                                      ? 'hover:bg-green-600 text-green-400 hover:text-white' 
                                      : 'hover:bg-green-100 text-green-700 hover:text-green-800'
                                  }`}
                                >
                                  <span>+ Crear nueva etiqueta</span>
                                </button>
                              </div>
                            </div>
                          </PerfectScrollbar>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Monto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newIncome.monto}
                      onChange={(e) => setNewIncome(prev => ({...prev, monto: e.target.value}))}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    />
                  </div>
                  
                  <button 
                    onClick={handleAddIncome}
                    className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                      : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                  }`}>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Ingreso
                    </span>
                  </button>
                </div>

                {/* Lista de ingresos agregados */}
                {ingresos.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-600 mb-3">Ingresos agregados:</h5>
                    <div className="space-y-2">
                      {ingresos.map((ingreso, index) => (
                        <div key={index} className={`flex justify-between items-center p-2 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-green-50'
                        }`}>
                          <div>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{ingreso.etiqueta}</span>
                            <span className="text-green-500 font-medium ml-2">{formatEuro(ingreso.monto)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveIncome(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Gastos */}
              <div className="pl-3">
                <div className="mb-4">
                  <h4 className="text-red-500 font-semibold text-lg mb-2">Agregar Gastos</h4>
                  <div className={`h-px w-full ${
                    isDark 
                      ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                  }`}></div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Etiqueta
                    </label>
                    <div className="relative">
                      {/* Custom Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsGastoDropdownOpen(!isGastoDropdownOpen)}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border text-left ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200`}>
                        {newExpense.etiqueta || "Seleccionar etiqueta..."}
                      </button>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>

                      {/* Dropdown Options with Perfect Scrollbar */}
                      {isGastoDropdownOpen && (
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
                              <div className="px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewExpense(prev => ({...prev, etiqueta: ''}))
                                    setIsGastoDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                    isDark 
                                      ? 'hover:bg-gray-600 text-gray-300 hover:text-white' 
                                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                  } ${!newExpense.etiqueta ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900') : ''}`}
                                >
                                  <span>Seleccionar etiqueta...</span>
                                </button>
                              </div>
                              {etiquetas.gastos.map((etiq) => (
                                <div key={etiq} className="px-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewExpense(prev => ({...prev, etiqueta: etiq}))
                                      setIsGastoDropdownOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                      isDark 
                                        ? 'hover:bg-gray-600 text-gray-300 hover:text-white' 
                                        : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                    } ${newExpense.etiqueta === etiq ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900') : ''}`}
                                  >
                                    <span>{etiq}</span>
                                  </button>
                                </div>
                              ))}
                              <div className="px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCreateNewTag('newExpense.etiqueta', 'gasto')
                                    setIsGastoDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                                    isDark 
                                      ? 'hover:bg-red-600 text-red-400 hover:text-white' 
                                      : 'hover:bg-red-100 text-red-700 hover:text-red-800'
                                  }`}
                                >
                                  <span>+ Crear nueva etiqueta</span>
                                </button>
                              </div>
                            </div>
                          </PerfectScrollbar>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Monto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.monto}
                      onChange={(e) => setNewExpense(prev => ({...prev, monto: e.target.value}))}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    />
                  </div>
                  
                  <button 
                    onClick={handleAddExpense}
                    className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                  }`}>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Gasto
                    </span>
                  </button>
                </div>

                {/* Lista de gastos agregados */}
                {gastos.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-600 mb-3">Gastos agregados:</h5>
                    <div className="space-y-2">
                      {gastos.map((gasto, index) => (
                        <div key={index} className={`flex justify-between items-center p-2 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-red-50'
                        }`}>
                          <div>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{gasto.etiqueta}</span>
                            <span className="text-red-500 font-medium ml-2">{formatEuro(gasto.monto)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveExpense(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Balance y botones */}
            {(ingresos.length > 0 || gastos.length > 0) && (
              <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Ingresos</div>
                    <div className="text-lg font-bold text-green-500">{formatEuro(totalIngresos)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Gastos</div>
                    <div className="text-lg font-bold text-red-500">{formatEuro(totalGastos)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className="text-xl font-bold text-blue-500">{formatEuro(balance)}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={onClose}
                className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </span>
              </button>
              <button
                onClick={handleSave}
                className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Crear Movimiento
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Create Tag Modal */}
      {showCreateTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Crear Nueva Etiqueta
            </h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder={`Nueva etiqueta de ${createTagType}`}
              className={`w-full px-3 py-2 rounded border mb-4 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateTagModal(false)
                  setPendingTagField(null)
                  setNewTagName('')
                }}
                className={`px-3 py-2 rounded text-sm ${
                  isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmCreateTag}
                className={`px-3 py-2 rounded text-sm ${
                  isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddMovementModal