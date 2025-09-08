import React, { useState, useEffect } from 'react'
import NumberInput from '../ui/NumberInput'

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
  onNewTagCreated?: (field: string, tagName: string) => void
}

const AddMovementForm: React.FC<AddMovementFormProps> = ({ 
  isDark, 
  etiquetas, 
  onSave, 
  onCancel, 
  onCreateNewTag,
  onNewTagCreated
}) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [ingresos, setIngresos] = useState<Array<{ id: number, etiqueta: string, monto: number }>>([])
  const [gastos, setGastos] = useState<Array<{ id: number, etiqueta: string, monto: number }>>([])
  const [newIngreso, setNewIngreso] = useState({ etiqueta: '', monto: '' })
  const [newGasto, setNewGasto] = useState({ etiqueta: '', monto: '' })

  console.log('💰 AddMovementForm render - isDark:', isDark, 'etiquetas:', etiquetas)

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
      fecha,
      ingresos: ingresos.map(i => ({ etiqueta: i.etiqueta, monto: i.monto })),
      gastos: gastos.map(g => ({ etiqueta: g.etiqueta, monto: g.monto }))
    })
  }

  const totalIngresos = ingresos.reduce((sum, item) => sum + item.monto, 0)
  const totalGastos = gastos.reduce((sum, item) => sum + item.monto, 0)
  const balance = totalIngresos - totalGastos

  return (
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
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={`w-48 px-3 py-2 rounded-lg border text-sm ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingresos */}
        <div>
          <h4 className="text-green-500 font-semibold text-lg mb-4">Ingresos</h4>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative">
                <select
                  value={newIngreso.etiqueta}
                  onChange={(e) => {
                    if (e.target.value === '__nueva__') {
                      onCreateNewTag('newIngreso.etiqueta', 'ingreso')
                    } else {
                      setNewIngreso(prev => ({ ...prev, etiqueta: e.target.value }))
                    }
                  }}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200`}
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
        <div>
          <h4 className="text-red-500 font-semibold text-lg mb-4">Gastos</h4>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative">
                <select
                  value={newGasto.etiqueta}
                  onChange={(e) => {
                    if (e.target.value === '__nueva__') {
                      onCreateNewTag('newGasto.etiqueta', 'gasto')
                    } else {
                      setNewGasto(prev => ({ ...prev, etiqueta: e.target.value }))
                    }
                  }}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200`}
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
      <div className={`flex justify-end gap-3 mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onCancel}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDark 
              ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:from-gray-500 hover:to-gray-400' 
              : 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md hover:from-gray-300 hover:to-gray-200'
          }`}
        >
          Cancelar
        </button>
        
        {(ingresos.length > 0 || gastos.length > 0) && (
          <button
            onClick={handleSave}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:from-emerald-500 hover:to-emerald-400'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md hover:from-emerald-400 hover:to-emerald-300'
            }`}
          >
            Crear Movimiento
          </button>
        )}
      </div>
    </div>
  )
}

export default AddMovementForm