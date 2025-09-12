import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Plus } from 'lucide-react'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, type: 'gasto' | 'ingreso', isEssential?: boolean) => void
  isDark: boolean
  existingTags?: string[]
}

const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isDark,
  existingTags
}) => {
  const [tagName, setTagName] = useState('')
  const [tagType, setTagType] = useState<'gasto' | 'ingreso'>('gasto')
  const [isEssential, setIsEssential] = useState(false)
  const [error, setError] = useState('')
  const [similarWarning, setSimilarWarning] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTagName('')
      setTagType('gasto')
      setIsEssential(false)
      setError('')
      setSimilarWarning('')
    }
  }, [isOpen])

  // Función para detectar nombres similares
  const findSimilarTags = (inputName: string): string[] => {
    const normalizedInput = inputName.toLowerCase().trim()
    const similar = []

    for (const existing of (existingTags || [])) {
      const normalizedExisting = existing.toLowerCase()
      
      // Verificar coincidencias exactas (case insensitive)
      if (normalizedExisting === normalizedInput) {
        continue // Ya se maneja en handleCreate
      }
      
      // Verificar plurales/singulares
      if (
        (normalizedExisting === normalizedInput + 's') ||
        (normalizedExisting === normalizedInput + 'es') ||
        (normalizedInput === normalizedExisting + 's') ||
        (normalizedInput === normalizedExisting + 'es')
      ) {
        similar.push(existing)
      }
      
      // Verificar acentos y caracteres similares
      const withoutAccents = (str: string) => str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      
      if (withoutAccents(normalizedExisting) === withoutAccents(normalizedInput)) {
        similar.push(existing)
      }
      
      // Verificar similitud por distancia de Levenshtein simple
      if (normalizedInput.length >= 3 && normalizedExisting.length >= 3) {
        const distance = levenshteinDistance(normalizedInput, normalizedExisting)
        const maxLength = Math.max(normalizedInput.length, normalizedExisting.length)
        const similarity = 1 - distance / maxLength
        
        if (similarity >= 0.8) { // 80% similitud
          similar.push(existing)
        }
      }
    }
    
    return similar.slice(0, 3) // Máximo 3 sugerencias
  }

  // Función de distancia de Levenshtein simplificada
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const handleCreate = () => {
    const trimmedName = tagName.trim()
    
    if (!trimmedName) {
      setError('El nombre de la etiqueta no puede estar vacío')
      return
    }
    
    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (trimmedName.length > 50) {
      setError('El nombre no puede exceder 50 caracteres')
      return
    }

    // Check if tag already exists (case insensitive)
    if ((existingTags || []).some(tag => tag.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Ya existe una etiqueta con este nombre')
      return
    }

    onCreate(trimmedName, tagType, isEssential)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
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
            <Plus className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Crear Nueva Etiqueta
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
            {/* Name input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Nombre de la Etiqueta
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => {
                  const value = e.target.value
                  setTagName(value)
                  setError('')
                  
                  // Detectar etiquetas similares en tiempo real
                  if (value.trim().length >= 3) {
                    const similar = findSimilarTags(value.trim())
                    if (similar.length > 0) {
                      setSimilarWarning(`Etiquetas similares encontradas: ${similar.join(', ')}`)
                    } else {
                      setSimilarWarning('')
                    }
                  } else {
                    setSimilarWarning('')
                  }
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
                placeholder="Ej: Supermercado, Freelance, Alquiler..."
                maxLength={50}
                autoFocus
              />
              {error && (
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {similarWarning && !error && (
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {similarWarning}
                </div>
              )}
              <div className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {tagName.length}/50 caracteres
              </div>
            </div>

            {/* Type selector */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Tipo de Etiqueta
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTagType('gasto')}
                  className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 text-left ${
                    tagType === 'gasto'
                      ? isDark
                        ? 'border-red-500 bg-red-900/20 text-red-300'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : isDark
                        ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">Gasto</div>
                  <div className="text-xs opacity-75">
                    Para categorizar salidas de dinero
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTagType('ingreso')}
                  className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 text-left ${
                    tagType === 'ingreso'
                      ? isDark
                        ? 'border-green-500 bg-green-900/20 text-green-300'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : isDark
                        ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">Ingreso</div>
                  <div className="text-xs opacity-75">
                    Para categorizar entradas de dinero
                  </div>
                </button>
              </div>
            </div>

            {/* Essential checkbox for gastos */}
            {tagType === 'gasto' && (
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

            {/* Preview */}
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Vista previa:
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
                  {tagName || 'Nombre de etiqueta'}
                </span>
                {isEssential && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800'
                  }`}>
                    ESENCIAL
                  </span>
                )}
              </div>
            </div>
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
            onClick={handleCreate}
            disabled={!tagName.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !tagName.trim()
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : isDark
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Crear Etiqueta
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateTagModal