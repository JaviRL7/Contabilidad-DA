import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { parseISO } from 'date-fns'
import { formatEuro } from '../../utils/formatters'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  movimiento: MovimientoDiario | null
  isDark: boolean
  onDeleteItem: (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => void
  onSaveChanges: (movimiento: MovimientoDiario) => void
  etiquetas: {
    ingresos: string[]
    gastos: string[]
  }
}

// Utility functions
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleNumberChange = (
  currentValue: string | number,
  setter: React.Dispatch<React.SetStateAction<any>>,
  key: string,
  delta: number,
  decimalPlaces: number = 2
) => {
  const numValue = parseFloat(currentValue.toString()) || 0
  const newValue = (numValue + delta).toFixed(decimalPlaces)
  setter(prev => ({ ...prev, [key]: newValue }))
}

const EditModal: React.FC<EditModalProps> = ({ 
  isOpen, 
  onClose, 
  movimiento: originalMovimiento, 
  isDark, 
  onDeleteItem, 
  onSaveChanges, 
  etiquetas 
}) => {
  const [editedMovimiento, setEditedMovimiento] = useState<MovimientoDiario | null>(null)
  const [editingItem, setEditingItem] = useState<{tipo: 'ingreso' | 'gasto', id: number} | null>(null)
  const [showAddForm, setShowAddForm] = useState<'ingreso' | 'gasto' | null>(null)
  const [tempValues, setTempValues] = useState({etiqueta: '', monto: ''})
  const [newItem, setNewItem] = useState({tipo: '', etiqueta: '', monto: ''})
  
  // Simple tag creation state
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [createTagType, setCreateTagType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [newTagName, setNewTagName] = useState('')
  const [pendingTagField, setPendingTagField] = useState<string | null>(null)

  useEffect(() => {
    if (originalMovimiento) {
      setEditedMovimiento({...originalMovimiento})
    }
  }, [originalMovimiento])

  if (!isOpen || !editedMovimiento) return null

  const handleSave = () => {
    if (editedMovimiento) {
      onSaveChanges(editedMovimiento)
      onClose()
    }
  }

  const handleDateChange = (newDate: string) => {
    setEditedMovimiento(prev => prev ? {...prev, fecha: newDate} : null)
  }

  const handleEditItem = (tipo: 'ingreso' | 'gasto', id: number, etiqueta: string, monto: number) => {
    setEditingItem({tipo, id})
    setTempValues({etiqueta, monto: monto.toString()})
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    
    const monto = parseFloat(tempValues.monto)
    if (isNaN(monto) || monto <= 0) return

    setEditedMovimiento(prev => {
      if (!prev) return null
      
      if (editingItem.tipo === 'ingreso') {
        const newIngresos = prev.ingresos.map(i => 
          i.id === editingItem.id 
            ? {...i, etiqueta: tempValues.etiqueta, monto}
            : i
        )
        const newTotal = newIngresos.reduce((sum, i) => sum + i.monto, 0)
        return {
          ...prev,
          ingresos: newIngresos,
          ingreso_total: newTotal,
          balance: newTotal - prev.total_gastos
        }
      } else {
        const newGastos = prev.gastos.map(g => 
          g.id === editingItem.id 
            ? {...g, etiqueta: tempValues.etiqueta, monto}
            : g
        )
        const newTotal = newGastos.reduce((sum, g) => sum + g.monto, 0)
        return {
          ...prev,
          gastos: newGastos,
          total_gastos: newTotal,
          balance: prev.ingreso_total - newTotal
        }
      }
    })
    
    setEditingItem(null)
    setTempValues({etiqueta: '', monto: ''})
  }

  const handleCreateNewTag = (field: string, tipo: 'ingreso' | 'gasto') => {
    setPendingTagField(field)
    setCreateTagType(tipo)
    setShowCreateTagModal(true)
  }

  const confirmCreateTag = () => {
    if (newTagName.trim() && pendingTagField) {
      // For this simplified version, we'll just set the value directly
      // In a full implementation, you'd want to update the etiquetas state
      if (pendingTagField === 'newItem.etiqueta') {
        setNewItem(prev => ({ ...prev, etiqueta: newTagName }))
      }
      
      setShowCreateTagModal(false)
      setPendingTagField(null)
      setNewTagName('')
    }
  }

  const handleAddItem = () => {
    const monto = parseFloat(newItem.monto)
    if (!newItem.etiqueta || isNaN(monto) || monto <= 0) return

    const newId = Date.now() // Temporal ID
    const item = {
      id: newId,
      etiqueta: newItem.etiqueta,
      monto,
      fecha: editedMovimiento.fecha,
      created_at: new Date().toISOString()
    }

    setEditedMovimiento(prev => {
      if (!prev) return null
      
      if (showAddForm === 'ingreso') {
        const newIngresos = [...prev.ingresos, item]
        const newTotal = newIngresos.reduce((sum, i) => sum + i.monto, 0)
        return {
          ...prev,
          ingresos: newIngresos,
          ingreso_total: newTotal,
          balance: newTotal - prev.total_gastos
        }
      } else {
        const newGastos = [...prev.gastos, item]
        const newTotal = newGastos.reduce((sum, g) => sum + g.monto, 0)
        return {
          ...prev,
          gastos: newGastos,
          total_gastos: newTotal,
          balance: prev.ingreso_total - newTotal
        }
      }
    })

    setNewItem({tipo: '', etiqueta: '', monto: ''})
    setShowAddForm(null)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-auto`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Editar Movimiento
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <DatePicker
                    selected={parseISO(editedMovimiento.fecha)}
                    onChange={(date: Date) => handleDateChange(formatDateForAPI(date))}
                    className={`w-full px-3 py-1 rounded-lg border text-sm ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    wrapperClassName="w-full"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
            </div>
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
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-green-500 font-semibold text-lg mb-2">
                      Ingresos ({formatEuro(editedMovimiento.ingreso_total)})
                    </h3>
                    <div className={`h-px w-full ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                    }`}></div>
                  </div>
                  <button
                    onClick={() => setShowAddForm('ingreso')}
                    className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                        : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                    }`}
                    title="Agregar ingreso"
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Ingreso
                    </span>
                  </button>
                </div>

                {/* Formulario agregar ingreso */}
                {showAddForm === 'ingreso' && (
                  <div className={`p-4 rounded-lg border mb-4 ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={newItem.etiqueta}
                          onChange={(e) => {
                            if (e.target.value === '__nueva__') {
                              handleCreateNewTag('newItem.etiqueta', 'ingreso')
                            } else {
                              setNewItem(prev => ({...prev, etiqueta: e.target.value}))
                            }
                          }}
                          className={`appearance-none w-full px-3 py-2 pr-10 rounded border ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                        >
                          <option value="">Seleccionar etiqueta...</option>
                          {etiquetas.ingresos.map(etiq => (
                            <option key={etiq} value={etiq}>{etiq}</option>
                          ))}
                          <option value="__nueva__">+ Crear nueva etiqueta</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto"
                          value={newItem.monto}
                          onChange={(e) => setNewItem(prev => ({...prev, monto: e.target.value}))}
                          className={`w-full px-3 py-2 rounded border pr-10 ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pr-2">
                          <button
                            type="button"
                            onClick={() => handleNumberChange(newItem.monto, setNewItem, 'monto', 0.01)}
                            className={`h-1/2 w-6 flex items-center justify-center rounded-t-md ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNumberChange(newItem.monto, setNewItem, 'monto', -0.01)}
                            className={`h-1/2 w-6 flex items-center justify-center rounded-b-md ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddItem}
                          className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isDark
                              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                              : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                          }`}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Agregar
                          </span>
                        </button>
                        <button
                          onClick={() => setShowAddForm(null)}
                          className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                      </div>
                    </div>
                  </div>
                )}
                
                {editedMovimiento.ingresos.length > 0 ? (
                  <div className="space-y-3">
                    {editedMovimiento.ingresos.map((ingreso) => (
                      <div key={ingreso.id} className={`p-3 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                      }`}>
                        {editingItem?.tipo === 'ingreso' && editingItem?.id === ingreso.id ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <select
                                value={tempValues.etiqueta}
                                onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                                className={`appearance-none w-full px-2 py-1 pr-10 rounded border text-sm ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                              >
                                {etiquetas.ingresos.map(etiq => (
                                  <option key={etiq} value={etiq}>{etiq}</option>
                                ))}
                              </select>
                              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                              </div>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={tempValues.monto}
                              onChange={(e) => setTempValues(prev => ({...prev, monto: e.target.value}))}
                              className={`w-full px-2 py-1 rounded border text-sm ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="cursor-pointer" onClick={() => handleEditItem('ingreso', ingreso.id, ingreso.etiqueta, ingreso.monto)}>
                              <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {ingreso.etiqueta}
                              </div>
                              <div className="text-green-500 font-semibold text-sm">
                                {formatEuro(ingreso.monto)}
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteItem(editedMovimiento.id, 'ingreso', ingreso.id)}
                              className="group p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Eliminar ingreso"
                            >
                              <svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm italic">No hay ingresos</p>
                  </div>
                )}
              </div>

              {/* Gastos */}
              <div className="pl-3">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-red-500 font-semibold text-lg mb-2">
                      Gastos ({formatEuro(editedMovimiento.total_gastos)})
                    </h3>
                    <div className={`h-px w-full ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                    }`}></div>
                  </div>
                  <button
                    onClick={() => setShowAddForm('gasto')}
                    className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                    }`}
                    title="Agregar gasto"
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Gasto
                    </span>
                  </button>
                </div>

                {/* Formulario agregar gasto */}
                {showAddForm === 'gasto' && (
                  <div className={`p-4 rounded-lg border mb-4 ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={newItem.etiqueta}
                          onChange={(e) => {
                            if (e.target.value === '__nueva__') {
                              handleCreateNewTag('newItem.etiqueta', 'gasto')
                            } else {
                              setNewItem(prev => ({...prev, etiqueta: e.target.value}))
                            }
                          }}
                          className={`appearance-none w-full px-3 py-2 pr-10 rounded border ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                        >
                          <option value="">Seleccionar etiqueta...</option>
                          {etiquetas.gastos.map(etiq => (
                            <option key={etiq} value={etiq}>{etiq}</option>
                          ))}
                          <option value="__nueva__">+ Crear nueva etiqueta</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={newItem.monto}
                        onChange={(e) => setNewItem(prev => ({...prev, monto: e.target.value}))}
                        className={`w-full px-3 py-2 rounded border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddItem}
                          className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isDark
                              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                              : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                          }`}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Agregar
                          </span>
                        </button>
                        <button
                          onClick={() => setShowAddForm(null)}
                          className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                      </div>
                    </div>
                  </div>
                )}
                
                {editedMovimiento.gastos.length > 0 ? (
                  <div className="space-y-3">
                    {editedMovimiento.gastos.map((gasto) => (
                      <div key={gasto.id} className={`p-3 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                      }`}>
                        {editingItem?.tipo === 'gasto' && editingItem?.id === gasto.id ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <select
                                value={tempValues.etiqueta}
                                onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                                className={`appearance-none w-full px-2 py-1 pr-10 rounded border text-sm ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                              >
                                {etiquetas.gastos.map(etiq => (
                                  <option key={etiq} value={etiq}>{etiq}</option>
                                ))}
                              </select>
                              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                              </div>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={tempValues.monto}
                              onChange={(e) => setTempValues(prev => ({...prev, monto: e.target.value}))}
                              className={`w-full px-2 py-1 rounded border text-sm ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="cursor-pointer" onClick={() => handleEditItem('gasto', gasto.id, gasto.etiqueta, gasto.monto)}>
                              <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {gasto.etiqueta}
                              </div>
                              <div className="text-red-500 font-semibold text-sm">
                                {formatEuro(gasto.monto)}
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteItem(editedMovimiento.id, 'gasto', gasto.id)}
                              className="group p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Eliminar gasto"
                            >
                              <svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm italic">No hay gastos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Balance y botones */}
            <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Balance del día:
                </span>
                <span className="text-2xl font-bold text-blue-500">
                  {formatEuro(editedMovimiento.balance)}
                </span>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Guardar Cambios
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Create Tag Modal */}
      {showCreateTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
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

export default EditModal