import React from 'react'

interface NavigationProps {
  activeSection: string
  setActiveSection: (section: string) => void
  isDark: boolean
  onToggleDark?: () => void
  setIsDark?: (dark: boolean) => void
}

const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  setActiveSection,
  isDark,
  onToggleDark,
  setIsDark
}) => {
  const navItems = [
    { key: 'historial', label: 'Historial' },
    { key: 'buscar', label: 'Buscar' },
    { key: 'etiquetas', label: 'Etiquetas' },
    { key: 'recurrentes', label: 'Gastos Continuos' },
    { key: 'analisis', label: 'Análisis' }
  ]

  return (
    <div className="flex items-center gap-4">
      <nav className="flex space-x-6">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`text-lg font-medium transition-colors duration-200 hover:opacity-75 ${
              item.key === 'recurrentes' ? 'whitespace-nowrap' : ''
            } ${
              activeSection === item.key
                ? isDark 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-gray-900 border-b-2 border-gray-900'
                : isDark
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      {/* Toggle modo nocturno */}
      <button
        onClick={() => {
          if (onToggleDark) {
            onToggleDark()
          } else if (setIsDark) {
            setIsDark(!isDark)
          }
        }}
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
    </div>
  )
}

export default Navigation