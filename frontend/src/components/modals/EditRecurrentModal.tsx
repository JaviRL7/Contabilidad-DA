import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

interface EditRecurrentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (recurrent: {etiqueta: string, monto: number, frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual', diaMes?: number}) => void
  recurrent: {
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
  } | null
  etiquetas: string[]
  isDark: boolean
  onCreateNewTag?: (field: string, tipo: 'gasto' | 'ingreso') => void
}

const EditRecurrentModal: React.FC<EditRecurrentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recurrent, 
  etiquetas, 
  isDark,
  onCreateNewTag 
}) => {
  const [editedRecurrent, setEditedRecurrent] = useState({
    etiqueta: '',
    monto: '',
    frecuencia: 'mensual' as 'mensual' | 'semanal' | 'diario' | 'anual',
    diaMes: ''
  })

  useEffect(() => {
    if (recurrent) {
      setEditedRecurrent({
        etiqueta: recurrent.etiqueta,
        monto: recurrent.monto.toString(),
        frecuencia: recurrent.frecuencia,
        diaMes: recurrent.diaMes?.toString() || ''
      })
    }
  }, [recurrent])

  if (!isOpen || !recurrent) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedRecurrent.etiqueta || !editedRecurrent.monto) return

    onConfirm({
      etiqueta: editedRecurrent.etiqueta,
      monto: parseFloat(editedRecurrent.monto),
      frecuencia: editedRecurrent.frecuencia,
      diaMes: editedRecurrent.diaMes ? parseInt(editedRecurrent.diaMes) : undefined
    })
  }

  const handleCreateNewTag = (field: string, tipo: 'gasto' | 'ingreso') => {
    if (onCreateNewTag) {
      onCreateNewTag(field, tipo)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md mx-4 w-full`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Editar Gasto Recurrente
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative">
                <select 
                  value={editedRecurrent.etiqueta}
                  onChange={(e) => {
                    if (e.target.value === '__nueva__') {
                      handleCreateNewTag('editedRecurrent.etiqueta', 'gasto')
                    } else {
                      setEditedRecurrent(prev => ({...prev, etiqueta: e.target.value}))
                    }
                  }}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                >
                  <option value="">Seleccionar etiqueta...</option>
                  {etiquetas.map(etiq => (
                    <option key={etiq} value={etiq}>{etiq}</option>
                  ))}
                  <option value="__nueva__">
                    Crear nueva etiqueta
                  </option>
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
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={editedRecurrent.monto}
                  onChange={(e) => setEditedRecurrent(prev => ({...prev, monto: e.target.value}))}
                  className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(editedRecurrent.monto) || 0;
                      setEditedRecurrent(prev => ({...prev, monto: (currentValue + 0.01).toFixed(2)}));
                    }}
                    className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                    }`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(editedRecurrent.monto) || 0;
                      const newValue = Math.max(0, currentValue - 0.01);
                      setEditedRecurrent(prev => ({...prev, monto: newValue.toFixed(2)}));
                    }}
                    className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                    }`}
                  >
                    −
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Frecuencia
              </label>
              <div className="relative">
                <select 
                  value={editedRecurrent.frecuencia}
                  onChange={(e) => setEditedRecurrent(prev => ({...prev, frecuencia: e.target.value as any}))}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                >
                  <option value="mensual">Mensual</option>
                  <option value="semanal">Semanal</option>
                  <option value="diario">Diario</option>
                  <option value="anual">Anual</option>
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {editedRecurrent.frecuencia === 'mensual' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Día del mes
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editedRecurrent.diaMes}
                    onChange={(e) => setEditedRecurrent(prev => ({...prev, diaMes: e.target.value}))}
                    className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Ej: 1"
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(editedRecurrent.diaMes) || 0;
                        const newValue = Math.min(31, currentValue + 1);
                        setEditedRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                      }}
                      className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                      }`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(editedRecurrent.diaMes) || 0;
                        const newValue = Math.max(1, currentValue - 1);
                        setEditedRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                      }}
                      className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                      }`}
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                  : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
              }`}
            >
              <span className="relative z-10">Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={!editedRecurrent.etiqueta || !editedRecurrent.monto}
              className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !editedRecurrent.etiqueta || !editedRecurrent.monto
                  ? isDark
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDark
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Guardar
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRecurrentModal