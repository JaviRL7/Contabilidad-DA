import React, { useState } from 'react'

interface ResponsiveHeaderProps {
  activeSection: string
  setActiveSection: (section: string) => void
  isDark: boolean
  onToggleDark?: () => void
  setIsDark?: (dark: boolean) => void
  showBreakdownTabs?: boolean
  onShowYearlyBreakdown?: () => void
  onShowMonthlyBreakdown?: () => void
  onResetBreakdowns?: () => void
  showYearlyBreakdown?: boolean
  showMonthlyBreakdown?: boolean
}

const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  activeSection,
  setActiveSection,
  isDark,
  onToggleDark,
  setIsDark,
  showBreakdownTabs = false,
  onShowYearlyBreakdown,
  onShowMonthlyBreakdown,
  onResetBreakdowns,
  showYearlyBreakdown = false,
  showMonthlyBreakdown = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { key: 'historial', label: 'Historial' },
    { key: 'buscar', label: 'Buscar' },
    { key: 'etiquetas', label: 'Etiquetas' },
    { key: 'recurrentes', label: 'Gastos Continuos' },
    { key: 'desgloses', label: 'Desgloses' },
    { key: 'analisis', label: 'Análisis' },
    { key: 'calendario', label: 'Calendario' }
  ]

  const breakdownTabs = [
    { key: 'yearly', label: 'Vista Anual', active: showYearlyBreakdown, onClick: onShowYearlyBreakdown },
    { key: 'monthly', label: 'Vista Mensual', active: showMonthlyBreakdown, onClick: onShowMonthlyBreakdown }
  ]

  const handleDarkToggle = () => {
    if (onToggleDark) {
      onToggleDark()
    } else if (setIsDark) {
      setIsDark(!isDark)
    }
  }

  const NavButton = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => (
    <button
      onClick={() => {
        setActiveSection(item.key)
        if (isMobile) setMobileMenuOpen(false)
        // Resetear estados de desglose cuando se navegue a otra sección o específicamente a desgloses
        if (onResetBreakdowns) {
          onResetBreakdowns()
        }
      }}
      className={`
        ${isMobile ? 'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3' : 'px-3 py-2 rounded-md text-sm font-medium'}
        transition-all duration-200
        ${activeSection === item.key
          ? isDark 
            ? `${isMobile ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600 text-white shadow-md'}`
            : `${isMobile ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-600 text-white shadow-md'}`
          : isDark
            ? `${isMobile ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
            : `${isMobile ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`
        }
      `}
    >
      {item.label}
    </button>
  )

  const BreakdownTab = ({ tab, isMobile = false }: { tab: any, isMobile?: boolean }) => (
    <button
      onClick={() => {
        if (tab.onClick) tab.onClick()
        if (isMobile) setMobileMenuOpen(false)
      }}
      className={`
        ${isMobile ? 'w-full text-left px-4 py-2 rounded-md' : 'px-3 py-1 rounded-md text-xs font-medium'}
        transition-all duration-200
        ${tab.active
          ? isDark 
            ? `${isMobile ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-purple-600 text-white'}`
            : `${isMobile ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-purple-600 text-white'}`
          : isDark
            ? `${isMobile ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-400 hover:bg-gray-700'}`
            : `${isMobile ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`
        }
      `}
    >
      {tab.label}
    </button>
  )

  return (
    <header className={`sticky top-0 z-50 shadow-lg ${isDark ? '' : 'border-b border-gray-200'}`} style={{backgroundColor: isDark ? '#1f2937' : 'white'}}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-32">
          
          {/* Logo y Navigation con espacio distribuido */}
          <div className="hidden lg:flex items-center justify-between flex-1 max-w-6xl mx-auto">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div 
                className="w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pink-300/70 hover:border-pink-400/80 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => {
                  setActiveSection('historial')
                  if (onResetBreakdowns) onResetBreakdowns()
                }}
              >
                <img 
                  src="/Logo1.png" 
                  alt="Logo" 
                  className="w-14 h-14 lg:w-16 lg:h-16 object-contain"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-8">
              {/* Main Navigation */}
              <nav className="flex space-x-4">
                {navItems.map((item) => (
                  <NavButton key={item.key} item={item} />
                ))}
              </nav>

              {/* Breakdown Tabs - Only show when needed */}
              {showBreakdownTabs && (
                <div className="flex items-center gap-2 pl-4">
                  {breakdownTabs.map((tab) => (
                    <BreakdownTab key={tab.key} tab={tab} />
                  ))}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={handleDarkToggle}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-lg hover:shadow-yellow-400/25 hover:from-yellow-400 hover:to-orange-300' 
                    : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg hover:shadow-gray-400/25 hover:from-gray-600 hover:to-gray-500'
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
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center flex-1">
            <div className="flex-shrink-0">
              <div 
                className="w-18 h-18 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pink-300/70 hover:border-pink-400/80 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => {
                  setActiveSection('historial')
                  if (onResetBreakdowns) onResetBreakdowns()
                }}
              >
                <img 
                  src="/Logo1.png" 
                  alt="Logo" 
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden flex items-center gap-4 absolute right-6">
            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={handleDarkToggle}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-md' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-md'
              }`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark ? 'text-blue-300 hover:text-white hover:bg-blue-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden absolute left-0 right-0 mt-2 mx-4 p-4 rounded-xl shadow-lg border transition-all duration-200 ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavButton key={item.key} item={item} isMobile />
              ))}
            </nav>

            {/* Mobile Breakdown Tabs */}
            {showBreakdownTabs && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Vistas de Desglose
                </div>
                <div className="space-y-1">
                  {breakdownTabs.map((tab) => (
                    <BreakdownTab key={tab.key} tab={tab} isMobile />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default ResponsiveHeader