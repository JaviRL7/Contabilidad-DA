import React, { useState } from 'react'
import { formatEuro } from '../../utils/formatters'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface YearlyBreakdownViewProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  onBack: () => void
  onGoToMonthly: (month: number, year: number) => void
}

const YearlyBreakdownView: React.FC<YearlyBreakdownViewProps> = ({ 
  movimientos, 
  onBack, 
  isDark,
  onGoToMonthly
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showYearCard, setShowYearCard] = useState(false)
  const [yearCardPage, setYearCardPage] = useState(0)
  
  // Obtener años que tienen movimientos
  const getAvailableYears = () => {
    const yearsWithMovements = new Set<number>()
    
    movimientos.forEach(mov => {
      const date = new Date(mov.fecha)
      yearsWithMovements.add(date.getFullYear())
    })
    
    return Array.from(yearsWithMovements).sort((a, b) => b - a) // Años más recientes primero
  }
  
  const availableYears = getAvailableYears()
  
  const yearlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  // Agrupar por mes
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthMovimientos = yearlyMovimientos.filter(m => {
      const date = new Date(m.fecha)
      return date.getMonth() === monthIndex
    })
    
    const totalIngresos = monthMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
    const totalGastos = monthMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
    const balance = totalIngresos - totalGastos
    
    return {
      month: monthIndex,
      monthName: new Date(currentYear, monthIndex).toLocaleDateString('es-ES', { month: 'long' }),
      totalIngresos,
      totalGastos,
      balance,
      movimientosCount: monthMovimientos.length
    }
  }).reverse() // Diciembre arriba, enero abajo
  
  const yearlyTotals = {
    ingresos: monthlyData.reduce((sum, m) => sum + m.totalIngresos, 0),
    gastos: monthlyData.reduce((sum, m) => sum + m.totalGastos, 0),
    balance: monthlyData.reduce((sum, m) => sum + m.balance, 0)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">

        {/* Cabecera del desglose anual */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
          {/* Primera línea: Título y botón volver */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={`group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver
                </span>
              </button>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Resumen anual
              </h2>
            </div>
          </div>
          
          {/* Segunda línea: Año con navegación */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {currentYear - 1}
              </span>
            </button>
            
            <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentYear}
            </div>
            
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {currentYear + 1}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
          
          {/* Botón para volver al año actual */}
          {currentYear !== new Date().getFullYear() && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setCurrentYear(new Date().getFullYear())}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
                }`}
              >
                Volver a {new Date().getFullYear()}
              </button>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
            }`}>
              <div className="text-2xl font-bold text-green-500 mb-1">
                {formatEuro(yearlyTotals.ingresos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Ingresos
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-2xl font-bold text-red-500 mb-1">
                {formatEuro(yearlyTotals.gastos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Gastos
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="text-2xl font-bold mb-1 text-blue-500">
                {formatEuro(yearlyTotals.balance)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Balance Total
              </div>
            </div>
          </div>
        </div>

        {/* Card expandible para años */}
        <div className={`rounded-lg shadow p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => setShowYearCard(!showYearCard)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Comprobar los años con movimientos
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showYearCard ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showYearCard && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              {(() => {
                const itemsPerPage = 12
                const totalPages = Math.ceil(availableYears.length / itemsPerPage)
                const startIndex = yearCardPage * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const currentPageItems = availableYears.slice(startIndex, endIndex)
                
                return (
                  <>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {currentPageItems.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setCurrentYear(year)
                            setShowYearCard(false)
                            setYearCardPage(0) // Reset page when selecting
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            year === currentYear
                              ? isDark
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-500 text-white shadow-md'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center mt-4 gap-3">
                        <button
                          onClick={() => setYearCardPage(prev => Math.max(0, prev - 1))}
                          disabled={yearCardPage === 0}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            yearCardPage === 0
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          ←
                        </button>
                        
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {yearCardPage + 1} de {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setYearCardPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={yearCardPage === totalPages - 1}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            yearCardPage === totalPages - 1
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Tabla de meses */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Mes
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Días
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Ingresos
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Gastos
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Balance
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {monthlyData.map((month) => (
                  <tr key={month.month} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {month.monthName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {month.movimientosCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-500">
                      {formatEuro(month.totalIngresos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-500">
                      {formatEuro(month.totalGastos)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      month.balance >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatEuro(month.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {month.movimientosCount > 0 && (
                        <button
                          onClick={() => onGoToMonthly(month.month, currentYear)}
                          className={`text-blue-500 hover:text-blue-600 transition-colors`}
                        >
                          Ver detalles
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YearlyBreakdownView