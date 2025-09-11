import React, { useState } from 'react'
import { Calendar, BarChart3, ArrowUpDown, TrendingUp } from 'lucide-react'
import Card from '../ui/Card'
import { formatEuro } from '../../utils/formatters'

interface MonthData {
  year: number
  month: number
  monthName: string
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientosCount: number
  balanceBruto: number
}

type SortType = 'date' | 'balanceBruto'
type SortOrder = 'asc' | 'desc'

interface MonthListProps {
  months: MonthData[]
  isDark: boolean
  onMonthClick: (month: number, year: number) => void
  getSortedMonths: (sortType: SortType, sortOrder: SortOrder) => MonthData[]
}

const MonthList: React.FC<MonthListProps> = ({
  months,
  isDark,
  onMonthClick,
  getSortedMonths
}) => {
  const [sortType, setSortType] = useState<SortType>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const toggleSort = (newSortType: SortType) => {
    if (sortType === newSortType) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortType(newSortType)
      setSortOrder('desc')
    }
  }

  const sortedMonths = getSortedMonths(sortType, sortOrder)

  return (
    <Card isDark={isDark} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-blue-600/20' : 'bg-blue-100'
          }`}>
            <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Meses Registrados
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {months.length} meses con movimientos
            </p>
          </div>
        </div>

        {/* Botones de ordenación */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              sortType === 'date'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Fecha
            {sortType === 'date' && (
              <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          <button
            onClick={() => toggleSort('balanceBruto')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              sortType === 'balanceBruto'
                ? isDark
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Actividad
            {sortType === 'balanceBruto' && (
              <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>

      {/* Lista de meses */}
      <div className="space-y-3">
        {sortedMonths.map((month) => (
          <div
            key={`${month.year}-${month.month}`}
            onClick={() => onMonthClick(month.month, month.year)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Información del mes */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {month.monthName}
                  </h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {month.movimientosCount} movimientos
                  </div>
                </div>
                
                {/* Estadísticas en una línea compacta */}
                <div className={`text-sm mt-2 flex items-center gap-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-600 font-medium">{formatEuro(month.totalIngresos)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-600 font-medium">{formatEuro(month.totalGastos)}</span>
                  </span>
                  <span className="font-semibold text-blue-500">
                    Balance: {formatEuro(month.balance)}
                  </span>
                </div>
              </div>

              {/* Indicador visual de actividad */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-600' : 'bg-white'
                } border-2 border-blue-200`}>
                  <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatEuro(month.balanceBruto)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default MonthList