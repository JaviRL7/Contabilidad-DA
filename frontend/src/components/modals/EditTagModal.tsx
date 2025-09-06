import React from 'react'
import { EditTagModalProps } from '../../types'

const EditTagModal: React.FC<EditTagModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onToggleEssential, 
  title, 
  editingTag, 
  editedTagName, 
  setEditedTagName, 
  isDark = false, 
  etiquetasEsenciales 
}) => {
  if (!isOpen) return null

  const isEssential = etiquetasEsenciales.has(editingTag)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nombre de la etiqueta
            </label>
            <input
              type="text"
              value={editedTagName}
              onChange={(e) => setEditedTagName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Nombre de la etiqueta"
              autoFocus
            />
          </div>

          {title.includes('gasto') && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="esencial-checkbox"
                checked={isEssential}
                onChange={(e) => onToggleEssential(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label 
                htmlFor="esencial-checkbox" 
                className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Gasto esencial
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(editedTagName, isEssential)}
            disabled={!editedTagName.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditTagModal