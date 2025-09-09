import React from 'react'
import { X, Trash2, AlertTriangle, FileText } from 'lucide-react'

interface DeleteTagConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDark: boolean
  tagName: string
  tagType: 'gasto' | 'ingreso'
  movementsCount: number
  totalAmount: number
}

const DeleteTagConfirmModal: React.FC<DeleteTagConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDark,
  tagName,
  tagType,
  movementsCount,
  totalAmount
}) => {
  if (!isOpen) return null

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl border max-w-md w-full ${
        isDark 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Eliminar Etiqueta
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tag info */}
          <div className={`p-4 rounded-lg mb-6 ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Etiqueta a eliminar:
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                tagType === 'ingreso'
                  ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                  : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {tagType.toUpperCase()}
              </span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {tagName}
              </span>
            </div>
          </div>

          {/* Warning message */}
          <div className={`p-4 rounded-lg border mb-4 ${
            isDark 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className={`font-semibold text-sm mb-2 ${
                  isDark ? 'text-red-200' : 'text-red-800'
                }`}>
                  ¡Atención! Esta acción no se puede deshacer.
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-red-300' : 'text-red-700'
                }`}>
                  Al eliminar esta etiqueta, se realizarán los siguientes cambios:
                </div>
              </div>
            </div>
          </div>

          {/* Impact details */}
          {movementsCount > 0 ? (
            <div className={`p-4 rounded-lg mb-6 ${
              isDark ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  Movimientos Afectados
                </span>
              </div>
              <div className={`space-y-2 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                <div>• <strong>{movementsCount}</strong> movimiento{movementsCount !== 1 ? 's' : ''} perderá{movementsCount !== 1 ? 'n' : ''} esta etiqueta</div>
                <div>• Total afectado: <strong>{formatEuro(totalAmount)}</strong></div>
                <div>• Los movimientos pasarán a estar <strong>"sin etiqueta"</strong></div>
                <div>• Los movimientos NO se eliminarán</div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg mb-6 ${
              isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
            }`}>
              <div className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Esta etiqueta no tiene movimientos asociados, por lo que se puede eliminar sin afectar datos.
              </div>
            </div>
          )}

          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ¿Estás seguro de que quieres eliminar la etiqueta <strong>"{tagName}"</strong>?
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteTagConfirmModal