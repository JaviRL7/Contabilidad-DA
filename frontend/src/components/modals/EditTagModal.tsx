import React, { useState, useEffect } from 'react'
import { X, Tag, AlertCircle } from 'lucide-react'

interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (oldName: string, newName: string, newType: 'gasto' | 'ingreso', isEssential?: boolean) => void
  isDark: boolean
  tagName: string
  currentType: 'gasto' | 'ingreso'
  isCurrentlyEssential?: boolean
}

const EditTagModal: React.FC<EditTagModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isDark,
  tagName,
  currentType,
  isCurrentlyEssential = false
}) => {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'gasto' | 'ingreso'>('gasto')
  const [isEssential, setIsEssential] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNewName(tagName)
      setNewType(currentType)
      setIsEssential(isCurrentlyEssential)
      setError('')
    }
  }, [isOpen, tagName, currentType, isCurrentlyEssential])

  const handleSave = () => {
    if (!newName.trim()) {
      setError('El nombre de la etiqueta no puede estar vacío')
      return
    }
    
    if (newName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (newName.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres')
      return
    }

    onSave(tagName, newName.trim(), newType, isEssential)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  if (!isOpen) return null

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
            <Tag className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Editar Etiqueta
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
          <div className="space-y-6">
            {/* Current tag info */}
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta Actual:
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentType === 'ingreso'
                    ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                    : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                }`}>
                  {currentType.toUpperCase()}
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tagName}
                </span>
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Nuevo Nombre
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setError('')
                }}
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                  error
                    ? isDark
                      ? 'border-yellow-500 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500'
                      : 'border-yellow-500 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500'
                    : isDark
                      ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                } focus:outline-none`}
                placeholder="Nombre de la etiqueta"
                maxLength={50}
              />
              {error && (
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* Type selector */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewType('gasto')}
                  className={`p-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    newType === 'gasto'
                      ? isDark
                        ? 'border-red-500 bg-red-900/20 text-red-300'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : isDark
                        ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('ingreso')}
                  className={`p-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    newType === 'ingreso'
                      ? isDark
                        ? 'border-green-500 bg-green-900/20 text-green-300'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : isDark
                        ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Ingreso
                </button>
              </div>
            </div>

            {/* Essential checkbox for gastos */}
            {newType === 'gasto' && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEssential}
                    onChange={(e) => setIsEssential(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Marcar como gasto esencial
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Los gastos esenciales se destacan visualmente y se priorizan en análisis
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Warning if type changed */}
            {newType !== currentType && (
              <div className={`p-4 rounded-lg border ${
                isDark 
                  ? 'bg-amber-900/20 border-amber-700 text-amber-200' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <strong>Atención:</strong> Cambiar el tipo afectará a todos los movimientos asociados con esta etiqueta.
                    Los movimientos cambiarán de {currentType} a {newType}.
                  </div>
                </div>
              </div>
            )}
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
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditTagModal