import React, { useState } from 'react'
import { Calendar, TrendingUp, ArrowUpDown, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 6

  const toggleSort = (newSortType: SortType) => {
    if (sortType === newSortType) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortType(newSortType)
      setSortOrder('desc')
    }
    setCurrentPage(0) // Reset to first page when sorting changes
  }

  const sortedYears = getSortedYears(sortType, sortOrder)
  const totalPages = Math.ceil(sortedYears.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentYears = sortedYears.slice(startIndex, endIndex)

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

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
      <div className="space-y-3">
        {currentYears.map((year) => (
          <div
            key={year.year}
            onClick={() => onYearClick(year.year)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Información del año */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className={`text-lg font-semibold ${
                    year.year === new Date().getFullYear() 
                      ? isDark ? 'text-blue-400' : 'text-blue-600'
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {year.year}
                  </h4>
                  {year.year === new Date().getFullYear() && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      Actual
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {year.movimientosCount} movimientos
                  </div>
                </div>
                <div className="text-sm mt-2 flex items-center gap-4 text-gray-300">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-600 font-medium">{formatEuro(year.totalIngresos)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-600 font-medium">{formatEuro(year.totalGastos)}</span>
                  </span>
                  <span className="font-semibold text-blue-500">Balance: {formatEuro(year.balance)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-600' : 'bg-gray-200'
                } border-2 border-blue-200`}>
                  <BarChart2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total: {formatEuro(year.balanceBruto)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de paginación en la parte inferior */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4 gap-3">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentPage === 0
                ? isDark
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`px-3 py-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentPage + 1} de {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentPage >= totalPages - 1
                ? isDark
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  )
}

export default YearList