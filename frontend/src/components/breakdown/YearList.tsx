import React, { useState } from 'react'
import { Calendar, TrendingUp, ArrowUpDown, BarChart2 } from 'lucide-react'
import Card from '../ui/Card'
import { formatEuro } from '../../utils/formatters'

interface YearData {
  year: number
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientosCount: number
  balanceBruto: number
  monthsWithMovements: number
}

type SortType = 'date' | 'balanceBruto'
type SortOrder = 'asc' | 'desc'

interface YearListProps {
  years: YearData[]
  isDark: boolean
  onYearClick: (year: number) => void
  getSortedYears: (sortType: SortType, sortOrder: SortOrder) => YearData[]
}

const YearList: React.FC<YearListProps> = ({
  years,
  isDark,
  onYearClick,
  getSortedYears
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

  const sortedYears = getSortedYears(sortType, sortOrder)

  return (
    <Card isDark={isDark} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-purple-600/20' : 'bg-purple-100'
          }`}>
            <BarChart2 className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Años Registrados
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {years.length} años con movimientos
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Año
            {sortType === 'date' && (
              <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          <button
            onClick={() => toggleSort('balanceBruto')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              sortType === 'balanceBruto'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
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

      {/* Lista de años */}
      <div className="space-y-4">
        {sortedYears.map((year) => (
          <div
            key={year.year}
            onClick={() => onYearClick(year.year)}
            className={`p-5 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Información del año */}
              <div className="flex-1">
                {/* Header con año destacado */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`text-3xl font-bold ${
                      year.year === 2025 
                        ? 'text-blue-400' 
                        : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {year.year}
                    </h4>
                    {year.year === 2025 && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                        Año Actual
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {year.movimientosCount} movimientos
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                    }`}>
                      {year.monthsWithMovements} meses con actividad
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {Math.round((year.monthsWithMovements / 12) * 100)}% del año
                    </div>
                  </div>
                </div>
                
                {/* Estadísticas principales */}
                <div className="grid grid-cols-2 gap-6 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Total Ingresos
                      </span>
                    </div>
                    <div className="text-green-600 font-bold text-xl">
                      {formatEuro(year.totalIngresos)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Total Gastos
                      </span>
                    </div>
                    <div className="text-red-600 font-bold text-xl">
                      {formatEuro(year.totalGastos)}
                    </div>
                  </div>
                </div>

                {/* Balance destacado */}
                <div className={`p-3 rounded-lg ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                } border-l-4 border-blue-500`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Balance Final {year.year}
                    </span>
                    <div className="font-bold text-xl text-blue-500">
                      {formatEuro(year.balance)}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Actividad total: {formatEuro(year.balanceBruto)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default YearList