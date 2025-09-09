import React from 'react'
import { Calendar } from 'lucide-react'
import Card from '../ui/Card'
import GradientButton from '../ui/GradientButton'
import { formatEuro } from '../../utils/formatters'

interface MonthData {
  month: number
  monthName: string
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientosCount: number
}

interface MonthlyGridProps {
  monthlyData: MonthData[]
  currentYear: number
  isDark: boolean
  onMonthClick: (month: number, year: number) => void
}

const MonthlyGrid: React.FC<MonthlyGridProps> = ({
  monthlyData,
  currentYear,
  isDark,
  onMonthClick
}) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monthlyData.map((month) => (
        <Card key={month.month} variant="default" isDark={isDark}>
          <div 
            className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
            }`}
            onClick={() => onMonthClick(month.month, currentYear)}
          >
            {/* Header del mes */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {month.monthName}
                </h3>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                month.movimientosCount > 0
                  ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {month.movimientosCount} mov
              </div>
            </div>

            {/* Estadísticas del mes */}
            {month.movimientosCount > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Ingresos:
                  </span>
                  <span className="text-green-500 font-medium">
                    {formatEuro(month.totalIngresos)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Gastos:
                  </span>
                  <span className="text-red-500 font-medium">
                    {formatEuro(month.totalGastos)}
                  </span>
                </div>
                <div className={`flex justify-between text-sm font-semibold border-t pt-2 ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Balance:
                  </span>
                  <span className={month.balance >= 0 ? 'text-blue-500' : 'text-red-500'}>
                    {formatEuro(month.balance)}
                  </span>
                </div>
                
                {/* Barra de progreso visual del balance */}
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-full transition-all duration-300 ${
                      month.balance >= 0 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.abs(month.balance) / 1000 * 100)}%` 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={`text-center py-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Sin movimientos este mes
              </div>
            )}

            {/* Botón de acción */}
            {month.movimientosCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={() => onMonthClick(month.month, currentYear)}
                  isDark={isDark}
                  className="w-full"
                >
                  Ver Detalles
                </GradientButton>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

export default MonthlyGrid