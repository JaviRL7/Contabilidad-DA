import React from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  isDark?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isDark = false 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className={`rounded-2xl shadow-2xl max-w-md w-full transform transition-all ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header con ícono */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isDark ? 'bg-green-900/20' : 'bg-green-50'
            }`}>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className={`text-base leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message}
          </p>
        </div>

        {/* Footer con botones */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Confirmar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ConfirmModal