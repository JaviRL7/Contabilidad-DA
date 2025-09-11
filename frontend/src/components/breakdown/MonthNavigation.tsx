import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import GradientButton from '../ui/GradientButton'

interface MonthNavigationProps {
  currentMonth: number // 1-12
  currentYear: number
  availableMonths: Array<{ month: number, year: number, label: string }>
  isDark: boolean
  onMonthChange: (month: number, year: number) => void
  onGoToCurrent?: () => void
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  currentMonth,
  currentYear,
  availableMonths,
  isDark,
  onMonthChange,
  onGoToCurrent
}) => {
  // Encontrar el índice del mes actual
  const currentMonthIndex = availableMonths.findIndex(
    m => m.month === currentMonth && m.year === currentYear
  )
  
  const canGoPrevious = currentMonthIndex < availableMonths.length - 1
  const canGoNext = currentMonthIndex > 0
  
  const currentDate = new Date()
  const isCurrentMonth = currentMonth === currentDate.getMonth() + 1 && currentYear === currentDate.getFullYear()

  const handlePrevious = () => {
    if (canGoPrevious) {
      const prevMonth = availableMonths[currentMonthIndex + 1]
      onMonthChange(prevMonth.month, prevMonth.year)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const nextMonth = availableMonths[currentMonthIndex - 1]
      onMonthChange(nextMonth.month, nextMonth.year)
    }
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const currentMonthLabel = `${monthNames[currentMonth - 1]} ${currentYear}`

  return (
    <div className="space-y-4">
      {/* Navegación principal de mes */}
      <div className="flex items-center justify-center gap-6">
        <GradientButton
          variant="secondary"
          size="md"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          isDark={isDark}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {canGoPrevious ? availableMonths[currentMonthIndex + 1].label : '---'}
        </GradientButton>
        
        <div className="flex items-center gap-3">
          <Calendar className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          <div className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentMonthLabel}
          </div>
        </div>
        
        <GradientButton
          variant="secondary"
          size="md"
          onClick={handleNext}
          disabled={!canGoNext}
          isDark={isDark}
        >
          {canGoNext ? availableMonths[currentMonthIndex - 1].label : '---'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </GradientButton>
      </div>

      {/* Botón para ir al mes actual */}
      {!isCurrentMonth && onGoToCurrent && (
        <div className="flex justify-center">
          <GradientButton
            variant="primary"
            size="sm"
            onClick={onGoToCurrent}
            isDark={isDark}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Ir a {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </GradientButton>
        </div>
      )}

      {/* Indicador de meses disponibles */}
      {availableMonths.length > 3 && (
        <div className="flex justify-center">
          <div className={`text-xs px-3 py-1 rounded-full ${
            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            {availableMonths.length} meses con datos
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthNavigation