import React from 'react'

interface HeaderProps {
  isDark: boolean
  onToggleDark: () => void
  onLogout: () => void
  activeSection: string
  onSectionChange: (section: string) => void
}

const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  onToggleDark, 
  onLogout, 
  activeSection, 
  onSectionChange 
}) => {
  return (
    <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Navegación */}
          <nav className="flex space-x-1">
            <button
              onClick={() => onSectionChange('historial')}
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
              onClick={() => onSectionChange('gastosRecurrentes')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'gastosRecurrentes'
                  ? isDark 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-blue-100 text-blue-700'
                  : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gastos Recurrentes
            </button>
            <button
              onClick={() => onSectionChange('etiquetas')}
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
              onClick={() => onSectionChange('analisis')}
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
          
          {/* Controles del header */}
          <div className="flex items-center space-x-3">
            {/* Toggle modo nocturno - diseño original */}
            <button
              onClick={onToggleDark}
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
            
            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg ${
                isDark
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
              }`}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header