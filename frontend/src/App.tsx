import { useState, useEffect } from 'react'
import axios from 'axios'

interface Ingreso {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

interface Gasto {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingreso_total: number
  ingresos: Ingreso[]
  gastos: Gasto[]
  total_gastos: number
  balance: number
  created_at?: string
  updated_at?: string
}

const API_BASE_URL = 'http://localhost:8000/api'

const formatEuro = (amount: number): string => {
  return `${amount.toFixed(2)} €`
}

// Etiquetas predefinidas
const ETIQUETAS_PREDEFINIDAS = {
  ingresos: [
    'Ventas', 'Ventas con tarjeta', 'Ventas Bolsos', 'Ventas conjuntos a mano'
  ],
  gastos: [
    'luz', 'agua', 'hipoteca', 'internet', 'telefono', 'gas', 'Seguro', 'gastos de sevilla', 'inversiones', 'obras'
  ]
}

// Componente Modal de confirmación
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

const Modal = ({ isOpen, onClose, onConfirm, title, message }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de edición avanzado
interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  movimiento: MovimientoDiario | null
  isDark: boolean
  onDeleteItem: (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => void
  onSaveChanges: (movimiento: MovimientoDiario) => void
}

const EditModal = ({ isOpen, onClose, movimiento: originalMovimiento, isDark, onDeleteItem, onSaveChanges }: EditModalProps) => {
  const [editedMovimiento, setEditedMovimiento] = useState<MovimientoDiario | null>(null)
  const [editingItem, setEditingItem] = useState<{tipo: 'ingreso' | 'gasto', id: number} | null>(null)
  const [showAddForm, setShowAddForm] = useState<'ingreso' | 'gasto' | null>(null)
  const [tempValues, setTempValues] = useState({etiqueta: '', monto: ''})
  const [newItem, setNewItem] = useState({tipo: '', etiqueta: '', monto: ''})

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
                <input
                  type="date"
                  value={editedMovimiento.fecha}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`px-3 py-1 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
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
                  className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                  title="Agregar ingreso"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Formulario agregar ingreso */}
              {showAddForm === 'ingreso' && (
                <div className={`p-4 rounded-lg border mb-4 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="space-y-3">
                    <select
                      value={newItem.etiqueta}
                      onChange={(e) => setNewItem(prev => ({...prev, etiqueta: e.target.value}))}
                      className={`w-full px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Seleccionar etiqueta...</option>
                      {ETIQUETAS_PREDEFINIDAS.ingresos.map(etiq => (
                        <option key={etiq} value={etiq}>{etiq}</option>
                      ))}
                    </select>
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setShowAddForm(null)}
                        className={`px-4 py-2 rounded transition-colors ${
                          isDark 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                      >
                        Cancelar
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
                          <select
                            value={tempValues.etiqueta}
                            onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                            className={`w-full px-2 py-1 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {ETIQUETAS_PREDEFINIDAS.ingresos.map(etiq => (
                              <option key={etiq} value={etiq}>{etiq}</option>
                            ))}
                          </select>
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
                            <svg className="w-4 h-4 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                  className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="Agregar gasto"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Formulario agregar gasto */}
              {showAddForm === 'gasto' && (
                <div className={`p-4 rounded-lg border mb-4 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="space-y-3">
                    <select
                      value={newItem.etiqueta}
                      onChange={(e) => setNewItem(prev => ({...prev, etiqueta: e.target.value}))}
                      className={`w-full px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Seleccionar etiqueta...</option>
                      {ETIQUETAS_PREDEFINIDAS.gastos.map(etiq => (
                        <option key={etiq} value={etiq}>{etiq}</option>
                      ))}
                    </select>
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
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setShowAddForm(null)}
                        className={`px-4 py-2 rounded transition-colors ${
                          isDark 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                      >
                        Cancelar
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
                          <select
                            value={tempValues.etiqueta}
                            onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                            className={`w-full px-2 py-1 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {ETIQUETAS_PREDEFINIDAS.gastos.map(etiq => (
                              <option key={etiq} value={etiq}>{etiq}</option>
                            ))}
                          </select>
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
                            <svg className="w-4 h-4 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
              <span className={`text-2xl font-bold ${
                editedMovimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatEuro(editedMovimiento.balance)}
              </span>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de página de desglose anual
const YearlyBreakdown = ({ 
  movimientos, 
  onBack, 
  isDark 
}: { 
  movimientos: MovimientoDiario[]
  onBack: () => void
  isDark: boolean 
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  const yearlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  // Agrupar por mes
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthMovimientos = yearlyMovimientos.filter(m => {
      const date = new Date(m.fecha)
      return date.getMonth() === monthIndex
    })
    
    const totalIngresos = monthMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
    const totalGastos = monthMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
    const balance = totalIngresos - totalGastos
    
    return {
      month: monthIndex,
      monthName: new Date(currentYear, monthIndex).toLocaleDateString('es-ES', { month: 'long' }),
      totalIngresos,
      totalGastos,
      balance,
      movimientosCount: monthMovimientos.length
    }
  }).reverse() // Diciembre arriba, enero abajo
  
  const yearlyTotals = {
    ingresos: monthlyData.reduce((sum, m) => sum + m.totalIngresos, 0),
    gastos: monthlyData.reduce((sum, m) => sum + m.totalGastos, 0),
    balance: monthlyData.reduce((sum, m) => sum + m.balance, 0)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header con navegación */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                  : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </span>
            </button>
            
            {/* Navegación de años */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentYear(prev => prev - 1)}
                className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                    : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                }`}
              >
                <span className="relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              </button>
              
              <button
                onClick={() => setCurrentYear(prev => prev + 1)}
                className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                    : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                }`}
              >
                <span className="relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          
          {/* Título del año centrado */}
          <div className="text-center">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resumen Anual: {currentYear}
            </h1>
            <div className={`h-1 w-32 mx-auto rounded-full ${
              isDark 
                ? 'bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50' 
                : 'bg-gradient-to-r from-purple-400/60 via-blue-400/60 to-purple-400/60'
            }`}></div>
          </div>
        </div>

        {/* Resumen total del año */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
          <h2 className={`text-2xl font-semibold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Totales del Año {currentYear}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-2">
                {formatEuro(yearlyTotals.ingresos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Ingresos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500 mb-2">
                {formatEuro(yearlyTotals.gastos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Gastos
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${yearlyTotals.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatEuro(yearlyTotals.balance)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Balance Final
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por meses */}
        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Desglose Mensual
          </h3>
          {monthlyData.map((monthData) => (
            <div key={monthData.month} className={`rounded-lg shadow p-6 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-lg font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {monthData.monthName}
                </h4>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {monthData.movimientosCount} días con movimientos
                  </span>
                  <div className={`text-lg font-bold ${
                    monthData.balance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatEuro(monthData.balance)}
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center">
                  <span className="text-green-500 font-medium">Ingresos:</span>
                  <span className="font-semibold text-green-500">
                    {formatEuro(monthData.totalIngresos)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-medium">Gastos:</span>
                  <span className="font-semibold text-red-500">
                    {formatEuro(monthData.totalGastos)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {monthlyData.every(m => m.movimientosCount === 0) && (
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No hay movimientos registrados para el año {currentYear}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de página de desglose mensual
const MonthlyBreakdown = ({ 
  movimientos, 
  onBack, 
  isDark 
}: { 
  movimientos: MovimientoDiario[]
  onBack: () => void
  isDark: boolean 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  const monthlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).sort((a, b) => new Date(b.fecha).getDate() - new Date(a.fecha).getDate()) // Orden descendente por día

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(prev => prev - 1)
      } else {
        setCurrentMonth(prev => prev - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header con navegación mejorada */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                  : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </span>
            </button>
            
            {/* Navegación de meses */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                }`}
              >
                <span className="relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              </button>
              
              <button
                onClick={() => navigateMonth('next')}
                className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                }`}
              >
                <span className="relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          
          {/* Título del mes centrado y más grande */}
          <div className="text-center">
            <h1 className={`text-4xl font-bold capitalize mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Desglose de: {monthName}
            </h1>
            <div className={`h-1 w-32 mx-auto rounded-full ${
              isDark 
                ? 'bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50' 
                : 'bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-blue-400/60'
            }`}></div>
          </div>
        </div>

        <div className="space-y-6">
          {monthlyMovimientos.map((movimiento) => (
            <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <div className={`text-lg font-bold ${
                  movimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatEuro(movimiento.balance)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-3">
                    <h3 className="text-green-500 font-medium mb-2">
                      Ingresos ({formatEuro(movimiento.ingreso_total)})
                    </h3>
                    <div className={`h-px w-full ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                    }`}></div>
                  </div>
                  {movimiento.ingresos.map((ingreso) => (
                    <div key={ingreso.id} className="flex justify-between py-1">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{ingreso.etiqueta}</span>
                      <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                    </div>
                  ))}
                </div>
                
                <div>
                  <div className="mb-3">
                    <h3 className="text-red-500 font-medium mb-2">
                      Gastos ({formatEuro(movimiento.total_gastos)})
                    </h3>
                    <div className={`h-px w-full ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                    }`}></div>
                  </div>
                  {movimiento.gastos.map((gasto) => (
                    <div key={gasto.id} className="flex justify-between py-1">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{gasto.etiqueta}</span>
                      <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('historial')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoDiario | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false)
  
  // Estados para gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<Array<{
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
  }>>([])
  const [newRecurrent, setNewRecurrent] = useState({
    etiqueta: '',
    monto: '',
    frecuencia: 'mensual' as 'mensual' | 'semanal' | 'diario' | 'anual',
    diaMes: ''
  })
  
  // Estados para búsqueda
  const [searchParams, setSearchParams] = useState({
    fechaDesde: '',
    fechaHasta: '',
    etiqueta: ''
  })
  const [searchResults, setSearchResults] = useState<MovimientoDiario[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Estados para edición de etiquetas
  const [editingTag, setEditingTag] = useState<{tipo: 'ingreso' | 'gasto', etiqueta: string} | null>(null)
  const [showEditTagModal, setShowEditTagModal] = useState(false)
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false)
  const [editedTagName, setEditedTagName] = useState('')

  useEffect(() => {
    fetchMovimientos()
  }, [])
  
  // Función de búsqueda
  const performSearch = () => {
    setIsSearching(true)
    
    let results = movimientos.filter(mov => {
      let matches = true
      
      // Filtro por fecha desde
      if (searchParams.fechaDesde) {
        const fechaMovimiento = new Date(mov.fecha)
        const fechaDesde = new Date(searchParams.fechaDesde)
        matches = matches && fechaMovimiento >= fechaDesde
      }
      
      // Filtro por fecha hasta
      if (searchParams.fechaHasta) {
        const fechaMovimiento = new Date(mov.fecha)
        const fechaHasta = new Date(searchParams.fechaHasta)
        matches = matches && fechaMovimiento <= fechaHasta
      }
      
      // Filtro por etiqueta
      if (searchParams.etiqueta) {
        const etiquetaBusqueda = searchParams.etiqueta.toLowerCase()
        const tieneEtiquetaIngreso = mov.ingresos.some(ing => 
          ing.etiqueta.toLowerCase().includes(etiquetaBusqueda)
        )
        const tieneEtiquetaGasto = mov.gastos.some(gasto => 
          gasto.etiqueta.toLowerCase().includes(etiquetaBusqueda)
        )
        matches = matches && (tieneEtiquetaIngreso || tieneEtiquetaGasto)
      }
      
      return matches
    })
    
    setSearchResults(results)
    setIsSearching(false)
  }
  
  // Búsqueda en tiempo real cuando cambia la etiqueta
  useEffect(() => {
    if (activeSection === 'buscar' && searchParams.etiqueta) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce de 300ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchParams.etiqueta, activeSection])
  
  // Limpiar resultados al cambiar de sección
  useEffect(() => {
    if (activeSection !== 'buscar') {
      setSearchResults([])
      setSearchParams({ fechaDesde: '', fechaHasta: '', etiqueta: '' })
    }
  }, [activeSection])

  const fetchMovimientos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movimientos/`)
      setMovimientos(response.data)
    } catch (err) {
      setError('Error al cargar los movimientos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => {
    setDeleteAction(() => () => deleteMovimiento(movimientoId, tipo, itemId))
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteAction) {
      deleteAction()
      setShowDeleteModal(false)
      setDeleteAction(null)
    }
  }

  const deleteMovimiento = async (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => {
    // Placeholder para funcionalidad de borrar
    console.log('Borrar:', { movimientoId, tipo, itemId })
  }

  // Funciones para manejo de etiquetas
  const handleEditTag = (tipo: 'ingreso' | 'gasto', etiqueta: string) => {
    setEditingTag({ tipo, etiqueta })
    setEditedTagName(etiqueta)
    setShowEditTagModal(true)
  }

  const handleDeleteTag = (tipo: 'ingreso' | 'gasto', etiqueta: string) => {
    setEditingTag({ tipo, etiqueta })
    setShowDeleteTagModal(true)
  }

  const confirmEditTag = () => {
    if (editingTag && editedTagName.trim()) {
      // Aquí normalmente actualizarías las etiquetas en el backend
      // Por ahora solo mostramos un console.log
      console.log(`Editar etiqueta de ${editingTag.tipo}: "${editingTag.etiqueta}" -> "${editedTagName.trim()}"`)
      setShowEditTagModal(false)
      setEditingTag(null)
      setEditedTagName('')
    }
  }

  const confirmDeleteTag = () => {
    if (editingTag) {
      // Aquí normalmente borrarías la etiqueta del backend
      // Por ahora solo mostramos un console.log
      console.log(`Borrar etiqueta de ${editingTag.tipo}: "${editingTag.etiqueta}"`)
      setShowDeleteTagModal(false)
      setEditingTag(null)
    }
  }

  const getTodayMovimientos = () => {
    const today = new Date().toISOString().split('T')[0]
    return movimientos.find(m => m.fecha === today) || null
  }

  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.balance, 0)
  }

  const getYearlyTotal = () => {
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.balance, 0)
  }

  const todayMovimientos = getTodayMovimientos()
  const monthlyTotal = getMonthlyTotal()
  const yearlyTotal = getYearlyTotal()

  if (showMonthlyBreakdown) {
    return (
      <MonthlyBreakdown 
        movimientos={movimientos}
        onBack={() => setShowMonthlyBreakdown(false)}
        isDark={isDark}
      />
    )
  }

  if (showYearlyBreakdown) {
    return (
      <YearlyBreakdown 
        movimientos={movimientos}
        onBack={() => setShowYearlyBreakdown(false)}
        isDark={isDark}
      />
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-xl ${isDark ? 'text-white' : 'text-black'}`}>Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres borrar este movimiento? Esta acción no se puede deshacer."
      />
      
      <EditModal
        isOpen={!!editingMovimiento}
        onClose={() => setEditingMovimiento(null)}
        movimiento={editingMovimiento}
        isDark={isDark}
        onDeleteItem={handleDeleteClick}
        onSaveChanges={(updatedMovimiento) => {
          // Aquí iría la lógica para guardar cambios en el backend
          console.log('Guardando cambios:', updatedMovimiento)
          // Por ahora solo actualizamos el estado local
          setMovimientos(prev => prev.map(m => 
            m.id === updatedMovimiento.id ? updatedMovimiento : m
          ))
        }}
      />
      
      {/* Modal para editar etiquetas */}
      <Modal
        isOpen={showEditTagModal}
        onClose={() => {
          setShowEditTagModal(false)
          setEditingTag(null)
          setEditedTagName('')
        }}
        onConfirm={confirmEditTag}
        title="Editar Etiqueta"
        message={
          <div>
            <p className="mb-4">Editar etiqueta de {editingTag?.tipo === 'ingreso' ? 'ingreso' : 'gasto'}:</p>
            <input
              type="text"
              value={editedTagName}
              onChange={(e) => setEditedTagName(e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                isDark 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Nombre de la etiqueta"
              autoFocus
            />
          </div>
        }
      />

      {/* Modal para borrar etiquetas */}
      <Modal
        isOpen={showDeleteTagModal}
        onClose={() => {
          setShowDeleteTagModal(false)
          setEditingTag(null)
        }}
        onConfirm={confirmDeleteTag}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres borrar la etiqueta "${editingTag?.etiqueta}"? Esta acción no se puede deshacer.`}
      />
      
      {/* Menú horizontal superior */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDark ? 'border-gray-700' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contabilidad Personal
            </h1>
            <div className="flex items-center gap-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveSection('historial')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'historial'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Historial
                </button>
                <button
                  onClick={() => setActiveSection('buscar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'buscar'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Buscar
                </button>
                <button
                  onClick={() => setActiveSection('etiquetas')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'etiquetas'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Etiquetas
                </button>
                <button
                  onClick={() => setActiveSection('recurrentes')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'recurrentes'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gastos Continuos
                </button>
                <button
                  onClick={() => setActiveSection('analisis')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'analisis'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Análisis
                </button>
              </nav>
              
              {/* Toggle modo nocturno */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-md hover:shadow-yellow-400/25 hover:from-yellow-400 hover:to-orange-300' 
                    : 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-md hover:shadow-slate-400/25 hover:from-slate-500 hover:to-slate-400'
                }`}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Contenido principal (75%) */}
          <main className="flex-1 w-3/4">
            {/* Botón agregar movimiento */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Añadir Movimiento
                </span>
              </button>
            </div>

            {/* Formulario de agregar completo */}
            {showAddForm && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border p-6 mb-6 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Agregar Nuevo Movimiento
                </h3>
                
                {/* Selector de fecha */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fecha del movimiento
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className={`px-4 py-3 rounded-lg border text-sm w-full md:w-auto ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
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

                  {/* Formulario de Ingresos */}
                  <div className="pr-3">
                    <div className="mb-4">
                      <h4 className="text-green-500 font-semibold text-lg mb-2">Agregar Ingreso</h4>
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
                        <select className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}>
                          <option value="">Seleccionar etiqueta...</option>
                          {ETIQUETAS_PREDEFINIDAS.ingresos.map(etiq => (
                            <option key={etiq} value={etiq}>{etiq}</option>
                          ))}
                          <option value="__nueva__">+ Crear nueva etiqueta</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Monto
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <button className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  </div>

                  {/* Formulario de Gastos */}
                  <div className="pl-3">
                    <div className="mb-4">
                      <h4 className="text-red-500 font-semibold text-lg mb-2">Agregar Gasto</h4>
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
                        <select className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}>
                          <option value="">Seleccionar etiqueta...</option>
                          {ETIQUETAS_PREDEFINIDAS.gastos.map(etiq => (
                            <option key={etiq} value={etiq}>{etiq}</option>
                          ))}
                          <option value="__nueva__">+ Crear nueva etiqueta</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Monto
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <button className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  </div>
                </div>

                {/* Botones de acción */}
                <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className={`group relative overflow-hidden px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-300 hover:to-gray-200'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'historial' && (
              <div className="grid gap-6">
                {movimientos.map((movimiento) => (
                  <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h2>
                      <div className={`text-lg font-bold ml-auto ${
                        movimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        Balance: {formatEuro(movimiento.balance)}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 relative">
                      {/* Línea separadora vertical con degradado */}
                      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
                        <div className={`h-full w-full ${
                          isDark 
                            ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                            : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
                        }`}></div>
                      </div>
                      
                      <div className="pr-3">
                        <div className="mb-3">
                          <h3 className="text-green-500 font-medium mb-2">
                            Ingresos ({formatEuro(movimiento.ingreso_total)})
                          </h3>
                          <div className={`h-px w-full ${
                            isDark 
                              ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                              : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                          }`}></div>
                        </div>
                        {movimiento.ingresos.length > 0 ? (
                          <ul className="space-y-2">
                            {movimiento.ingresos.map((ingreso) => (
                              <li key={ingreso.id} className={`flex justify-between items-center p-2 rounded ${
                                isDark ? 'bg-gray-700' : 'bg-green-50'
                              }`}>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{ingreso.etiqueta}</span>
                                <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay ingresos</p>
                        )}
                      </div>
                      
                      <div className="pl-3">
                        <div className="mb-3">
                          <h3 className="text-red-500 font-medium mb-2">
                            Gastos ({formatEuro(movimiento.total_gastos)})
                          </h3>
                          <div className={`h-px w-full ${
                            isDark 
                              ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                              : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                          }`}></div>
                        </div>
                        {movimiento.gastos.length > 0 ? (
                          <ul className="space-y-2">
                            {movimiento.gastos.map((gasto) => (
                              <li key={gasto.id} className={`flex justify-between items-center p-2 rounded ${
                                isDark ? 'bg-gray-700' : 'bg-red-50'
                              }`}>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{gasto.etiqueta}</span>
                                <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay gastos</p>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción en la parte inferior */}
                    <div className="flex gap-2 mt-8 justify-end">
                      <button
                        onClick={() => setEditingMovimiento(movimiento)}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Editar
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(movimiento.id, 'ingreso', 0)}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md hover:shadow-rose-500/25 hover:from-rose-500 hover:to-rose-400'
                            : 'bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-md hover:shadow-rose-400/25 hover:from-rose-400 hover:to-rose-300'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Borrar
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {movimientos.length === 0 && (
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
                    <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      No hay movimientos
                    </h2>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Comienza agregando tus primeros ingresos y gastos
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'buscar' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Buscar Movimientos
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Buscar por fecha
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={searchParams.fechaDesde}
                        onChange={(e) => setSearchParams(prev => ({...prev, fechaDesde: e.target.value}))}
                        className={`flex-1 px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Fecha desde"
                      />
                      <input
                        type="date"
                        value={searchParams.fechaHasta}
                        onChange={(e) => setSearchParams(prev => ({...prev, fechaHasta: e.target.value}))}
                        className={`flex-1 px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Fecha hasta"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Buscar por etiqueta
                    </label>
                    <input
                      type="text"
                      placeholder="Escribir etiqueta..."
                      value={searchParams.etiqueta}
                      onChange={(e) => setSearchParams(prev => ({...prev, etiqueta: e.target.value}))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={performSearch}
                    disabled={isSearching}
                    className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSearching
                        ? isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                          : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      setSearchParams({ fechaDesde: '', fechaHasta: '', etiqueta: '' })
                      setSearchResults([])
                    }}
                    className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-300 hover:to-gray-200'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Limpiar
                    </span>
                  </button>
                </div>
                
                {/* Resultados de búsqueda */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Resultados de búsqueda
                  </h3>
                  
                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map((movimiento) => (
                        <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h4>
                            <div className={`text-lg font-bold ml-auto ${
                              movimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              Balance: {formatEuro(movimiento.balance)}
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-green-500 font-medium mb-2">
                                Ingresos ({formatEuro(movimiento.ingreso_total)})
                              </h5>
                              {movimiento.ingresos.length > 0 ? (
                                <ul className="space-y-1">
                                  {movimiento.ingresos.map((ingreso) => (
                                    <li key={ingreso.id} className={`flex justify-between p-2 rounded ${
                                      isDark ? 'bg-gray-600' : 'bg-green-50'
                                    }`}>
                                      <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{ingreso.etiqueta}</span>
                                      <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay ingresos</p>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="text-red-500 font-medium mb-2">
                                Gastos ({formatEuro(movimiento.total_gastos)})
                              </h5>
                              {movimiento.gastos.length > 0 ? (
                                <ul className="space-y-1">
                                  {movimiento.gastos.map((gasto) => (
                                    <li key={gasto.id} className={`flex justify-between p-2 rounded ${
                                      isDark ? 'bg-gray-600' : 'bg-red-50'
                                    }`}>
                                      <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{gasto.etiqueta}</span>
                                      <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay gastos</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchParams.fechaDesde || searchParams.fechaHasta || searchParams.etiqueta ? (
                    <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.441-1.086-5.813-2.709A7.962 7.962 0 0112 9c2.34 0 4.441 1.086 5.813 2.291A7.962 7.962 0 0112 15z" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No se encontraron resultados para los criterios de búsqueda
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Usa los filtros de arriba para buscar movimientos específicos
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`mt-6 p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                      Resultados de búsqueda aparecerán aquí
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'etiquetas' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestión de Etiquetas
                </h2>
                
                {/* Estadísticas de gastos por etiqueta - Rediseño limpio */}
                <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Análisis de Gastos por Categoría
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Total del año
                    </div>
                  </div>

                  {(() => {
                    // Calcular gastos por etiqueta y estadísticas
                    const gastosPorEtiqueta = {};
                    const currentYear = new Date().getFullYear();
                    const etiquetasEsenciales = ['Luz', 'Agua', 'Gas', 'Teléfono', 'Internet', 'Alquiler'];
                    
                    movimientos.forEach(mov => {
                      mov.gastos.forEach(gasto => {
                        gastosPorEtiqueta[gasto.etiqueta] = (gastosPorEtiqueta[gasto.etiqueta] || 0) + gasto.monto;
                      });
                    });
                    
                    const gastosOrdenados = Object.entries(gastosPorEtiqueta)
                      .filter(([, monto]) => monto > 0)
                      .sort(([,a], [,b]) => b - a);
                    
                    const totalGastos = gastosOrdenados.reduce((sum, [, monto]) => sum + monto, 0);
                    const gastosEsenciales = gastosOrdenados
                      .filter(([etiqueta]) => etiquetasEsenciales.includes(etiqueta))
                      .reduce((sum, [, monto]) => sum + monto, 0);
                    
                    // Calcular meses con gastos esenciales reales
                    const mesesConGastosEsenciales = new Set();
                    movimientos.forEach(mov => {
                      const tieneGastosEsenciales = mov.gastos.some(gasto => 
                        etiquetasEsenciales.includes(gasto.etiqueta)
                      );
                      if (tieneGastosEsenciales) {
                        const fecha = new Date(mov.fecha);
                        const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                        mesesConGastosEsenciales.add(mesKey);
                      }
                    });
                    
                    const numeroMesesPagados = mesesConGastosEsenciales.size;
                    const mediaMensualEsenciales = numeroMesesPagados > 0 ? gastosEsenciales / numeroMesesPagados : 0;

                    if (gastosOrdenados.length === 0) {
                      return (
                        <div className={`p-8 text-center rounded-lg border ${
                          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                        }`}>
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            No hay gastos registrados para mostrar estadísticas
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Resumen de estadísticas principales */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-red-500 mb-1">
                              {formatEuro(totalGastos)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Total gastado {currentYear}
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-orange-500 mb-1">
                              {formatEuro(gastosEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Gastos esenciales
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-blue-500 mb-1">
                              {formatEuro(mediaMensualEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Media mensual esenciales ({numeroMesesPagados} meses pagados)
                            </div>
                          </div>
                        </div>

                        {/* Lista de categorías con barras de progreso */}
                        <div className="space-y-3">
                          {gastosOrdenados.slice(0, 10).map(([etiqueta, monto], index) => {
                            const porcentaje = (monto / totalGastos) * 100;
                            const esEsencial = etiquetasEsenciales.includes(etiqueta);
                            
                            return (
                              <div key={etiqueta} className={`p-4 rounded-lg ${
                                isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                              } hover:shadow-md transition-shadow`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                      index === 0 ? 'bg-red-500' : 
                                      index === 1 ? 'bg-orange-500' : 
                                      index === 2 ? 'bg-yellow-500' : 
                                      'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {etiqueta}
                                        {esEsencial && (
                                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                            Esencial
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {porcentaje.toFixed(1)}% del total
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-red-500 text-lg">
                                      {formatEuro(monto)}
                                    </div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {formatEuro(monto / 12)}/mes
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      index === 0 ? 'bg-red-500' : 
                                      index === 1 ? 'bg-orange-500' : 
                                      index === 2 ? 'bg-yellow-500' : 
                                      'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          
                          {gastosOrdenados.length > 10 && (
                            <div className={`p-3 text-center rounded-lg ${
                              isDark ? 'bg-gray-800 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                            }`}>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ... y {gastosOrdenados.length - 10} categorías más
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Formulario para crear nueva etiqueta */}
                <div className={`mb-8 p-4 rounded-lg border-2 border-dashed ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Crear Nueva Etiqueta
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva etiqueta"
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <select
                      className={`px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                    </select>
                    <button
                      className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                          : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Crear
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-green-500 font-medium mb-4">Etiquetas de Ingresos</h3>
                    <div className="space-y-2">
                      {ETIQUETAS_PREDEFINIDAS.ingresos.map(etiqueta => (
                        <div key={etiqueta} className={`flex justify-between items-center p-3 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                        }`}>
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{etiqueta}</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditTag('ingreso', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteTag('ingreso', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Borrar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-red-500 font-medium mb-4">Etiquetas de Gastos</h3>
                    <div className="space-y-2">
                      {ETIQUETAS_PREDEFINIDAS.gastos.map(etiqueta => (
                        <div key={etiqueta} className={`flex justify-between items-center p-3 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                        }`}>
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{etiqueta}</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditTag('gasto', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteTag('gasto', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Borrar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'recurrentes' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gastos Continuos
                </h2>
                
                <div className={`p-6 rounded-lg border-2 border-dashed mb-6 ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Agregar Gasto Recurrente
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <select 
                      value={newRecurrent.etiqueta}
                      onChange={(e) => setNewRecurrent(prev => ({...prev, etiqueta: e.target.value}))}
                      className={`px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Seleccionar etiqueta...</option>
                      {ETIQUETAS_PREDEFINIDAS.gastos.map(etiq => (
                        <option key={etiq} value={etiq}>{etiq}</option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      value={newRecurrent.monto}
                      onChange={(e) => setNewRecurrent(prev => ({...prev, monto: e.target.value}))}
                      className={`px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Frecuencia
                      </label>
                      <select 
                        value={newRecurrent.frecuencia}
                        onChange={(e) => setNewRecurrent(prev => ({...prev, frecuencia: e.target.value as any}))}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="mensual">Mensual</option>
                        <option value="semanal">Semanal</option>
                        <option value="diario">Diario</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Día del mes (para mensual)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ej: 1"
                        value={newRecurrent.diaMes}
                        onChange={(e) => setNewRecurrent(prev => ({...prev, diaMes: e.target.value}))}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (!newRecurrent.etiqueta || !newRecurrent.monto) return;
                      
                      const nuevoGasto = {
                        id: Date.now(),
                        etiqueta: newRecurrent.etiqueta,
                        monto: parseFloat(newRecurrent.monto),
                        frecuencia: newRecurrent.frecuencia,
                        diaMes: newRecurrent.diaMes ? parseInt(newRecurrent.diaMes) : undefined
                      };
                      
                      setGastosRecurrentes(prev => [...prev, nuevoGasto]);
                      setNewRecurrent({
                        etiqueta: '',
                        monto: '',
                        frecuencia: 'mensual',
                        diaMes: ''
                      });
                    }}
                    disabled={!newRecurrent.etiqueta || !newRecurrent.monto}
                    className={`group relative overflow-hidden px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !newRecurrent.etiqueta || !newRecurrent.monto
                        ? isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                          : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Gasto Recurrente
                    </span>
                  </button>
                </div>

                <div>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Gastos Recurrentes Activos
                  </h3>
                  {gastosRecurrentes.length > 0 ? (
                    <div className="space-y-3">
                      {gastosRecurrentes.map(gasto => (
                        <div key={gasto.id} className={`p-4 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        } flex justify-between items-center`}>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {gasto.etiqueta}
                              </span>
                              <span className="font-bold text-red-500">
                                {formatEuro(gasto.monto)}
                              </span>
                            </div>
                            <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {gasto.frecuencia.charAt(0).toUpperCase() + gasto.frecuencia.slice(1)}
                              {gasto.frecuencia === 'mensual' && gasto.diaMes && ` - Día ${gasto.diaMes}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => setGastosRecurrentes(prev => prev.filter(g => g.id !== gasto.id))}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Eliminar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No hay gastos recurrentes configurados
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'analisis' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Análisis Financiero
                </h2>
                
                {(() => {
                  // Calcular estadísticas
                  const currentYear = new Date().getFullYear()
                  const ingresosPorEtiqueta = {}
                  const gastosPorEtiqueta = {}
                  const etiquetasEsenciales = ['luz', 'agua', 'gas', 'telefono', 'internet', 'hipoteca']
                  
                  // Calcular por mes para comparaciones
                  const datosPorMes = {}
                  
                  movimientos.forEach(mov => {
                    const fecha = new Date(mov.fecha)
                    const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
                    
                    if (!datosPorMes[mes]) {
                      datosPorMes[mes] = { ingresos: 0, gastos: 0, ingresosPorEtiqueta: {}, gastosPorEtiqueta: {} }
                    }
                    
                    // Ingresos por etiqueta
                    mov.ingresos.forEach(ingreso => {
                      ingresosPorEtiqueta[ingreso.etiqueta] = (ingresosPorEtiqueta[ingreso.etiqueta] || 0) + ingreso.monto
                      datosPorMes[mes].ingresosPorEtiqueta[ingreso.etiqueta] = (datosPorMes[mes].ingresosPorEtiqueta[ingreso.etiqueta] || 0) + ingreso.monto
                      datosPorMes[mes].ingresos += ingreso.monto
                    })
                    
                    // Gastos por etiqueta
                    mov.gastos.forEach(gasto => {
                      gastosPorEtiqueta[gasto.etiqueta] = (gastosPorEtiqueta[gasto.etiqueta] || 0) + gasto.monto
                      datosPorMes[mes].gastosPorEtiqueta[gasto.etiqueta] = (datosPorMes[mes].gastosPorEtiqueta[gasto.etiqueta] || 0) + gasto.monto
                      datosPorMes[mes].gastos += gasto.monto
                    })
                  })
                  
                  const meses = Object.keys(datosPorMes).sort()
                  const ingresosTotales = Object.values(ingresosPorEtiqueta).reduce((sum, val) => sum + val, 0)
                  const gastosTotales = Object.values(gastosPorEtiqueta).reduce((sum, val) => sum + val, 0)
                  const gastosEsenciales = Object.entries(gastosPorEtiqueta)
                    .filter(([etiqueta]) => etiquetasEsenciales.includes(etiqueta.toLowerCase()))
                    .reduce((sum, [, monto]) => sum + monto, 0)
                  const mesesConGastosEsenciales = meses.filter(mes => 
                    Object.entries(datosPorMes[mes].gastosPorEtiqueta).some(([etiqueta]) => 
                      etiquetasEsenciales.includes(etiqueta.toLowerCase())
                    )
                  ).length
                  
                  if (movimientos.length === 0) {
                    return (
                      <div className={`p-8 text-center rounded-lg border ${
                        isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No hay datos para mostrar análisis
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-8">
                      {/* KPIs principales */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                        }`}>
                          <div className="text-2xl font-bold text-blue-500 mb-2">
                            {formatEuro(ingresosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Ingresos {currentYear}
                          </div>
                        </div>
                        
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                        }`}>
                          <div className="text-2xl font-bold text-red-500 mb-2">
                            {formatEuro(gastosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Gastos {currentYear}
                          </div>
                        </div>
                        
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className={`text-2xl font-bold ${ingresosTotales - gastosTotales >= 0 ? 'text-green-500' : 'text-red-500'} mb-2`}>
                            {formatEuro(ingresosTotales - gastosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Balance {currentYear}
                          </div>
                        </div>
                      </div>
                      
                      {/* Análisis de ingresos por etiqueta */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Ingresos por Categoría
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(ingresosPorEtiqueta)
                            .sort(([,a], [,b]) => b - a)
                            .map(([etiqueta, monto]) => {
                              const porcentaje = (monto / ingresosTotales) * 100
                              const mediaMensual = monto / Math.max(meses.length, 1)
                              
                              return (
                                <div key={etiqueta} className={`p-4 rounded-lg border ${
                                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {etiqueta}
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-green-500">{formatEuro(monto)}</div>
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {formatEuro(mediaMensual)}/mes
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${porcentaje}%` }}
                                    ></div>
                                  </div>
                                  <div className={`text-xs text-right mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {porcentaje.toFixed(1)}%
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                      
                      {/* Análisis de gastos esenciales corregido */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Gastos Esenciales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className={`p-4 rounded-lg border ${
                            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-orange-200'
                          }`}>
                            <div className="text-2xl font-bold text-orange-500 mb-1">
                              {formatEuro(gastosEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Total gastos esenciales
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg border ${
                            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-200'
                          }`}>
                            <div className="text-2xl font-bold text-blue-500 mb-1">
                              {mesesConGastosEsenciales > 0 ? formatEuro(gastosEsenciales / mesesConGastosEsenciales) : formatEuro(0)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Media mensual ({mesesConGastosEsenciales} meses pagados)
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(gastosPorEtiqueta)
                            .filter(([etiqueta]) => etiquetasEsenciales.includes(etiqueta.toLowerCase()))
                            .sort(([,a], [,b]) => b - a)
                            .map(([etiqueta, monto]) => {
                              const mesesPagados = meses.filter(mes => 
                                datosPorMes[mes].gastosPorEtiqueta[etiqueta] > 0
                              ).length
                              const mediaMensual = mesesPagados > 0 ? monto / mesesPagados : 0
                              
                              return (
                                <div key={etiqueta} className={`p-4 rounded-lg border ${
                                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {etiqueta}
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-orange-500">{formatEuro(monto)}</div>
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {formatEuro(mediaMensual)}/mes ({mesesPagados} meses)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                      
                      {/* Comparación mensual */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Evolución Mensual
                        </h3>
                        <div className="space-y-3">
                          {meses.map(mes => {
                            const datos = datosPorMes[mes]
                            const balance = datos.ingresos - datos.gastos
                            
                            return (
                              <div key={mes} className={`p-4 rounded-lg border ${
                                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {new Date(mes + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                                  </span>
                                  <div className={`font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatEuro(balance)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Ingresos: </span>
                                    <span className="text-green-500 font-medium">{formatEuro(datos.ingresos)}</span>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Gastos: </span>
                                    <span className="text-red-500 font-medium">{formatEuro(datos.gastos)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </main>

          {/* Columna lateral derecha (25%) */}
          <aside className="w-1/4">
            <div className="space-y-6">
              {/* Resumen de hoy */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Hoy</h3>
                {todayMovimientos ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-500">Ingresos:</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {formatEuro(todayMovimientos.ingreso_total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Gastos:</span>
                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {formatEuro(todayMovimientos.total_gastos)}
                      </span>
                    </div>
                    <div className={`my-4 h-px ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'
                    }`}></div>
                    <div className="flex justify-between">
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Balance:</span>
                      <span className={`font-bold ${todayMovimientos.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatEuro(todayMovimientos.balance)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sin movimientos hoy
                  </p>
                )}
              </div>

              {/* Total del mes */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Total del Mes
                </h3>
                <div className={`text-2xl font-bold mb-2 ${monthlyTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatEuro(monthlyTotal)}
                </div>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => setShowMonthlyBreakdown(true)}
                  className={`w-full group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                  }`}
                  title="Ver desglose mensual"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Ver Desglose Mensual
                  </span>
                </button>
              </div>

              {/* Total del año */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Total del Año
                </h3>
                <div className={`text-2xl font-bold ${yearlyTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatEuro(yearlyTotal)}
                </div>
                <p className={`text-sm mt-1 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Año {new Date().getFullYear()}
                </p>
                <button
                  onClick={() => setShowYearlyBreakdown(true)}
                  className={`w-full group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                      : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                  }`}
                  title="Ver desglose anual"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Ver Desglose Anual
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
