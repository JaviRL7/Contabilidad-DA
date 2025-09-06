import React from 'react'
import { ViewTagModalProps } from '../../types'
import { formatEuro } from '../../utils/formatters'
import { format } from 'date-fns'

const ViewTagModal: React.FC<ViewTagModalProps> = ({ 
  isOpen, 
  onClose, 
  tag, 
  movimientos, 
  isDark = false 
}) => {
  if (!isOpen) return null

  const totalMonto = movimientos.reduce((sum, mov) => sum + mov.monto, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Movimientos de "{tag}"
          </h3>
          <button
            onClick={onClose}
            className={`text-2xl font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
          >
            ×
          </button>
        </div>
        
        <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Total: {formatEuro(totalMonto)}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-y-auto max-h-96">
          {movimientos.length === 0 ? (
            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay movimientos para esta etiqueta
            </p>
          ) : (
            <div className="space-y-2">
              {movimientos.map((movimiento) => (
                <div 
                  key={movimiento.id} 
                  className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatEuro(movimiento.monto)}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {format(new Date(movimiento.fecha), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  {'esencial' in movimiento && movimiento.esencial && (
                    <span className="px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded-full">
                      Esencial
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewTagModal