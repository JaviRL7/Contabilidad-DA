import React, { useState, useEffect } from 'react'
import NumberInput from '../ui/NumberInput'
import DatePicker from 'react-datepicker'
import { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { ChevronDown, Check, Plus } from 'lucide-react'

registerLocale('es', es)

interface AddMovementFormProps {
  isDark: boolean
  etiquetas: { ingresos: string[], gastos: string[] }
  onSave: (movement: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number }>
  }) => void
  onCancel: () => void
  onCreateNewTag: (field: string, tipo: 'ingreso' | 'gasto') => void
  newTagCreated?: {field: string, tagName: string} | null
  preselectedTag?: {etiqueta: string, tipo: 'ingreso' | 'gasto'} | null
}

const AddMovementForm: React.FC<AddMovementFormProps> = ({ 
  isDark, 
  etiquetas, 
  onSave, 
  onCancel, 
  onCreateNewTag,
  newTagCreated,
  preselectedTag
}) => {
  const [fecha, setFecha] = useState<Date>(new Date())
  const [ingresos, setIngresos] = useState<Array<{ id: number, etiqueta: string, monto: number }>>([])
  const [gastos, setGastos] = useState<Array<{ id: number, etiqueta: string, monto: number }>>([])
  const [newIngreso, setNewIngreso] = useState({ etiqueta: '', monto: '' })
  const [newGasto, setNewGasto] = useState({ etiqueta: '', monto: '' })
  
  // Estados para dropdowns
  const [ingresoDropdownOpen, setIngresoDropdownOpen] = useState(false)
  const [gastoDropdownOpen, setGastoDropdownOpen] = useState(false)


  // Effect para auto-seleccionar nueva etiqueta creada
  useEffect(() => {
    if (newTagCreated) {
      
      if (newTagCreated.field === 'newIngreso.etiqueta') {
        setNewIngreso(prev => ({ ...prev, etiqueta: newTagCreated.tagName }))
      } else if (newTagCreated.field === 'newGasto.etiqueta') {
        setNewGasto(prev => ({ ...prev, etiqueta: newTagCreated.tagName }))
      }
    }
  }, [newTagCreated])

  // Effect para preseleccionar etiqueta desde notificación
  useEffect(() => {
    if (preselectedTag) {
      
      if (preselectedTag.tipo === 'ingreso') {
        setNewIngreso(prev => ({ ...prev, etiqueta: preselectedTag.etiqueta }))
      } else if (preselectedTag.tipo === 'gasto') {
        setNewGasto(prev => ({ ...prev, etiqueta: preselectedTag.etiqueta }))
      }
    }
  }, [preselectedTag])

  // Effect para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (ingresoDropdownOpen && !target.closest('.dropdown-ingreso')) {
        setIngresoDropdownOpen(false)
      }
      if (gastoDropdownOpen && !target.closest('.dropdown-gasto')) {
        setGastoDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ingresoDropdownOpen, gastoDropdownOpen])

  // Guard clause - if etiquetas is not loaded yet, show loading
  if (!etiquetas || !etiquetas.ingresos || !etiquetas.gastos) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border p-6 mb-6 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`text-center py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Cargando etiquetas...
        </div>
      </div>
    )
  }

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleAddIngreso = () => {
    if (!newIngreso.etiqueta || !newIngreso.monto) return
    const monto = parseFloat(newIngreso.monto)
    if (isNaN(monto) || monto <= 0) return

    setIngresos(prev => [...prev, {
      id: Date.now(),
      etiqueta: newIngreso.etiqueta,
      monto
    }])
    setNewIngreso({ etiqueta: '', monto: '' })
  }

  const handleAddGasto = () => {
    if (!newGasto.etiqueta || !newGasto.monto) return
    const monto = parseFloat(newGasto.monto)
    if (isNaN(monto) || monto <= 0) return

    setGastos(prev => [...prev, {
      id: Date.now(),
      etiqueta: newGasto.etiqueta,
      monto
    }])
    setNewGasto({ etiqueta: '', monto: '' })
  }

  const handleSave = () => {
    if (ingresos.length === 0 && gastos.length === 0) {
      alert('Debes agregar al menos un ingreso o gasto')
      return
    }

    onSave({
      fecha: fecha.toISOString().split('T')[0],
      ingresos: ingresos.map(i => ({ etiqueta: i.etiqueta, monto: i.monto })),
      gastos: gastos.map(g => ({ etiqueta: g.etiqueta, monto: g.monto }))
    })
  }

  const totalIngresos = ingresos.reduce((sum, item) => sum + item.monto, 0)
  const totalGastos = gastos.reduce((sum, item) => sum + item.monto, 0)
  const balance = totalIngresos - totalGastos

  return (
    <div className={`rounded-xl shadow-xl border-2 p-8 mb-8 transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 hover:border-blue-500/50' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-400/50'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Nuevo Movimiento
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Registra tus ingresos y gastos del día
            </p>
          </div>
        </div>
      </div>
      
      {/* Selector de fecha */}
      <div className="mb-8">
        <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Fecha del movimiento
        </label>
        <DatePicker
          selected={fecha}
          onChange={(date) => setFecha(date || new Date())}
          dateFormat="dd/MM/yyyy"
          locale="es"
          placeholderText="Seleccionar fecha"
          className={`w-56 px-4 py-3 rounded-xl border-2 text-sm font-medium ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none transition-colors duration-200`}
          calendarClassName={isDark ? 'dark-calendar' : ''}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingresos */}
        <div className={`rounded-xl p-6 border-2 ${
          isDark 
            ? 'bg-green-900/10 border-green-500/20' 
            : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-500 font-bold text-xl mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            Ingresos
          </h4>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative dropdown-ingreso">
                <button
                  type="button"
                  onClick={() => setIngresoDropdownOpen(!ingresoDropdownOpen)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-lg font-medium transition-all duration-200 text-left ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400 focus:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-green-500 focus:bg-green-50/30'
                  } focus:outline-none focus:ring-0`}
                >
                  {newIngreso.etiqueta || 'Seleccionar etiqueta...'}
                </button>
                <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform duration-200 ${
                  ingresoDropdownOpen ? 'rotate-180' : ''
                } ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                
                {ingresoDropdownOpen && (
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
                        <button
                          type="button"
                          onClick={() => {
                            setNewIngreso(prev => ({ ...prev, etiqueta: '' }))
                            setIngresoDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                            newIngreso.etiqueta === '' 
                              ? isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                              : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {newIngreso.etiqueta === '' && <Check className="w-4 h-4" />}
                            <span className={newIngreso.etiqueta === '' ? '' : 'ml-7'}>
                              Seleccionar etiqueta...
                            </span>
                          </div>
                        </button>
                        
                        {etiquetas.ingresos.map((etiqueta, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewIngreso(prev => ({ ...prev, etiqueta }))
                              setIngresoDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                              newIngreso.etiqueta === etiqueta
                                ? isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                                : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {newIngreso.etiqueta === etiqueta && <Check className="w-4 h-4" />}
                              <span className={newIngreso.etiqueta === etiqueta ? '' : 'ml-7'}>
                                {etiqueta}
                              </span>
                            </div>
                          </button>
                        ))}
                        
                        <div className={`border-t-2 mt-2 pt-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              onCreateNewTag('newIngreso.etiqueta', 'ingreso')
                              setIngresoDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                              isDark ? 'text-green-400 hover:bg-gray-600' : 'text-green-600 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Plus className="w-4 h-4" />
                              <span>Crear nueva etiqueta</span>
                            </div>
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
              <NumberInput
                value={newIngreso.monto}
                onChange={(value) => setNewIngreso(prev => ({ ...prev, monto: value }))}
                placeholder="0.00"
                step={0.01}
                isDark={isDark}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </div>
            <button 
              onClick={handleAddIngreso}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:from-green-500 hover:to-green-400'
                  : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:from-green-400 hover:to-green-300'
              }`}>
              + Agregar Ingreso
            </button>
          </div>

          {/* Lista de ingresos */}
          {ingresos.map((item) => (
            <div key={item.id} className={`p-3 rounded-lg border mb-2 flex justify-between items-center ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
            }`}>
              <div>
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.etiqueta}
                </div>
                <div className="text-green-500 font-semibold">
                  {formatEuro(item.monto)}
                </div>
              </div>
              <button
                onClick={() => setIngresos(prev => prev.filter(i => i.id !== item.id))}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Gastos */}
        <div className={`rounded-xl p-6 border-2 ${
          isDark 
            ? 'bg-red-900/10 border-red-500/20' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h4 className="text-red-500 font-bold text-xl mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </div>
            Gastos
          </h4>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative dropdown-gasto">
                <button
                  type="button"
                  onClick={() => setGastoDropdownOpen(!gastoDropdownOpen)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-lg font-medium transition-all duration-200 text-left ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-red-400 focus:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:bg-red-50/30'
                  } focus:outline-none focus:ring-0`}
                >
                  {newGasto.etiqueta || 'Seleccionar etiqueta...'}
                </button>
                <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform duration-200 ${
                  gastoDropdownOpen ? 'rotate-180' : ''
                } ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                
                {gastoDropdownOpen && (
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
                        <button
                          type="button"
                          onClick={() => {
                            setNewGasto(prev => ({ ...prev, etiqueta: '' }))
                            setGastoDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                            newGasto.etiqueta === '' 
                              ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                              : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {newGasto.etiqueta === '' && <Check className="w-4 h-4" />}
                            <span className={newGasto.etiqueta === '' ? '' : 'ml-7'}>
                              Seleccionar etiqueta...
                            </span>
                          </div>
                        </button>
                        
                        {etiquetas.gastos.map((etiqueta, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewGasto(prev => ({ ...prev, etiqueta }))
                              setGastoDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                              newGasto.etiqueta === etiqueta
                                ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                                : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {newGasto.etiqueta === etiqueta && <Check className="w-4 h-4" />}
                              <span className={newGasto.etiqueta === etiqueta ? '' : 'ml-7'}>
                                {etiqueta}
                              </span>
                            </div>
                          </button>
                        ))}
                        
                        <div className={`border-t-2 mt-2 pt-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              onCreateNewTag('newGasto.etiqueta', 'gasto')
                              setGastoDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2 text-left text-lg transition-colors ${
                              isDark ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Plus className="w-4 h-4" />
                              <span>Crear nueva etiqueta</span>
                            </div>
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
              <NumberInput
                value={newGasto.monto}
                onChange={(value) => setNewGasto(prev => ({ ...prev, monto: value }))}
                placeholder="0.00"
                step={0.01}
                isDark={isDark}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              />
            </div>
            <button 
              onClick={handleAddGasto}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-400'
                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:from-red-400 hover:to-red-300'
              }`}>
              + Agregar Gasto
            </button>
          </div>

          {/* Lista de gastos */}
          {gastos.map((item) => (
            <div key={item.id} className={`p-3 rounded-lg border mb-2 flex justify-between items-center ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
            }`}>
              <div>
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.etiqueta}
                </div>
                <div className="text-red-500 font-semibold">
                  {formatEuro(item.monto)}
                </div>
              </div>
              <button
                onClick={() => setGastos(prev => prev.filter(g => g.id !== item.id))}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      {(ingresos.length > 0 || gastos.length > 0) && (
        <div className={`mt-6 p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Total de ingresos:
            </span>
            <span className="text-green-500 font-semibold">
              {formatEuro(totalIngresos)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Total de gastos:
            </span>
            <span className="text-red-500 font-semibold">
              {formatEuro(totalGastos)}
            </span>
          </div>
          <div className={`h-px w-full my-2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Balance:
            </span>
            <span className={`font-bold text-lg ${
              balance >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatEuro(balance)}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className={`flex justify-center gap-4 mt-8 pt-8 border-t-2 ${
        isDark ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <button
          onClick={onCancel}
          className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600 hover:border-gray-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 hover:border-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
        
        {(ingresos.length > 0 || gastos.length > 0) && (
          <button
            onClick={handleSave}
            className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 shadow-blue-500/25'
            } transform hover:scale-105`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Crear Movimiento
          </button>
        )}
      </div>
    </div>
  )
}

export default AddMovementForm