import React, { useState } from 'react'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tagName: string) => void
  tipo: 'gasto' | 'ingreso'
  isDark?: boolean
}

const CreateTagModal: React.FC<CreateTagModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tipo, 
  isDark = false 
}) => {
  const [newTagName, setNewTagName] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (newTagName.trim()) {
      onConfirm(newTagName.trim())
      setNewTagName('')
    }
  }

  const handleClose = () => {
    setNewTagName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Crear nueva etiqueta para {tipo}s
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nombre de la etiqueta
            </label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Escribe el nombre de la nueva etiqueta"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!newTagName.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateTagModal