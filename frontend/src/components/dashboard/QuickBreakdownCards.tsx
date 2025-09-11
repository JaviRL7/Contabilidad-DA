import React from 'react'
import { Calendar, BarChart } from 'lucide-react'

interface QuickBreakdownCardsProps {
  isDark: boolean
  onShowMonthlyBreakdown?: () => void
  onShowYearlyBreakdown?: () => void
}

const QuickBreakdownCards: React.FC<QuickBreakdownCardsProps> = ({
  isDark,
  onShowMonthlyBreakdown,
  onShowYearlyBreakdown
}) => {
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('es-ES', { 
    month: 'long' 
  }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('es-ES', { 
    month: 'long' 
  }).slice(1)
  const currentYear = currentDate.getFullYear()

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Card Desglose Mensual */}
      <div
        onClick={onShowMonthlyBreakdown}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isDark 
            ? 'bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-700 hover:to-blue-600' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-medium text-white/90">
                Desglose Mensual
              </h3>
            </div>
            <p className="text-lg font-bold text-white">
              {currentMonth} {currentYear}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-white/10' : 'bg-white/20'
          }`}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Card Desglose Anual */}
      <div
        onClick={onShowYearlyBreakdown}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isDark 
            ? 'bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600' 
            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-medium text-white/90">
                Desglose Anual
              </h3>
            </div>
            <p className="text-lg font-bold text-white">
              Año {currentYear}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-white/10' : 'bg-white/20'
          }`}>
            <BarChart className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickBreakdownCards