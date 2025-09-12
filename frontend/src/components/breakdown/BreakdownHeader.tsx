import React from 'react'
import { ChevronLeft, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import GradientButton from '../ui/GradientButton'

interface BreakdownHeaderProps {
  title: string
  subtitle?: string
  isDark: boolean
  onBack?: () => void
  onNavigateToYearly?: () => void
  onNavigateToMonthly?: (month: number, year: number) => void
  currentView: 'monthly' | 'yearly'
  breadcrumbItems?: Array<{
    label: string
    onClick?: () => void
    isActive?: boolean
  }>
  hideBackButton?: boolean
}

const BreakdownHeader: React.FC<BreakdownHeaderProps> = ({
  title,
  subtitle,
  isDark,
  onBack,
  onNavigateToYearly,
  onNavigateToMonthly: _onNavigateToMonthly,
  currentView,
  breadcrumbItems,
  hideBackButton = false
}) => {
  return (
    <div className="space-y-4">
      {/* Navegación principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!hideBackButton && onBack && (
            <GradientButton
              variant="secondary"
              size="md"
              onClick={onBack}
              isDark={isDark}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Volver
            </GradientButton>
          )}
          
          <div className="flex items-center gap-3">
            <Calendar className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Navegación entre vistas */}
        <div className="flex items-center gap-2">
          {currentView === 'monthly' && onNavigateToYearly && (
            <GradientButton
              variant="primary"
              size="sm"
              onClick={onNavigateToYearly}
              isDark={isDark}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Ver Anual
            </GradientButton>
          )}
        </div>
      </div>

      {/* Breadcrumb navigation */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
              <button
                onClick={item.onClick}
                disabled={item.isActive || !item.onClick}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  item.isActive
                    ? isDark
                      ? 'bg-blue-900/30 text-blue-300 font-medium'
                      : 'bg-blue-100 text-blue-700 font-medium'
                    : item.onClick
                      ? isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDark
                        ? 'text-gray-500'
                        : 'text-gray-400'
                }`}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}
    </div>
  )
}

export default BreakdownHeader