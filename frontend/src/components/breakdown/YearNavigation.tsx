import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import GradientButton from '../ui/GradientButton'

interface YearNavigationProps {
  currentYear: number
  availableYears: number[]
  isDark: boolean
  onYearChange: (year: number) => void
  onGoToCurrent?: () => void
}

const YearNavigation: React.FC<YearNavigationProps> = ({
  currentYear,
  availableYears,
  isDark,
  onYearChange,
  onGoToCurrent
}) => {
  const currentYearIndex = availableYears.indexOf(currentYear)
  const canGoPrevious = currentYearIndex < availableYears.length - 1
  const canGoNext = currentYearIndex > 0
  
  const isCurrentYear = currentYear === new Date().getFullYear()

  const handlePrevious = () => {
    if (canGoPrevious) {
      onYearChange(availableYears[currentYearIndex + 1])
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onYearChange(availableYears[currentYearIndex - 1])
    }
  }

  return (
    <div className="space-y-4">
      {/* Navegación principal de año */}
      <div className="flex items-center justify-center gap-6">
        <GradientButton
          variant="secondary"
          size="md"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          isDark={isDark}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {canGoPrevious ? availableYears[currentYearIndex + 1] : '---'}
        </GradientButton>
        
        <div className="flex items-center gap-3">
          <Calendar className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentYear}
          </div>
        </div>
        
        <GradientButton
          variant="secondary"
          size="md"
          onClick={handleNext}
          disabled={!canGoNext}
          isDark={isDark}
        >
          {canGoNext ? availableYears[currentYearIndex - 1] : '---'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </GradientButton>
      </div>

      {/* Botón para ir al año actual */}
      {!isCurrentYear && onGoToCurrent && (
        <div className="flex justify-center">
          <GradientButton
            variant="primary"
            size="sm"
            onClick={onGoToCurrent}
            isDark={isDark}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Ir a {new Date().getFullYear()}
          </GradientButton>
        </div>
      )}

      {/* Indicador de años disponibles */}
      {availableYears.length > 3 && (
        <div className="flex justify-center">
          <div className={`text-xs px-3 py-1 rounded-full ${
            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            {availableYears.length} años con datos • {availableYears[availableYears.length - 1]} - {availableYears[0]}
          </div>
        </div>
      )}
    </div>
  )
}

export default YearNavigation