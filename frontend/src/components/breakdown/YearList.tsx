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
                <div className="flex items-center gap-4 mb-3">
                  <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {year.year}
                  </h4>
                  <div className="flex gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {year.movimientosCount} movimientos
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                    }`}>
                      {year.monthsWithMovements} meses activos
                    </div>
                  </div>
                </div>
                
                {/* Estadísticas detalladas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-green-600 font-bold text-lg">
                      {formatEuro(year.totalIngresos)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Ingresos
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-red-600 font-bold text-lg">
                      {formatEuro(year.totalGastos)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Gastos
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-bold text-lg ${ 
                      year.balance > 0 ? 'text-green-500' : 
                      year.balance < 0 ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {formatEuro(year.balance)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Balance
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-bold text-lg ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      {formatEuro(year.balanceBruto)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Actividad Total
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicador visual */}
              <div className="flex flex-col items-center gap-2 ml-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-600' : 'bg-white'
                } border-2 border-purple-200`}>
                  <TrendingUp className={`w-8 h-8 ${
                    year.balance > 0 ? 'text-green-500' : 
                    year.balance < 0 ? 'text-red-500' : 
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                
                {/* Progress bar para meses activos */}
                <div className="w-16">
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${(year.monthsWithMovements / 12) * 100}%` }}
                    ></div>
                  </div>
                  <div className={`text-xs text-center mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {Math.round((year.monthsWithMovements / 12) * 100)}%
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