import React, { useMemo } from 'react'
import Card from '../ui/Card'
import TotalDaysCounter from '../breakdown/TotalDaysCounter'
import MonthList from '../breakdown/MonthList'
import YearList from '../breakdown/YearList'
import { BarChart, Calendar } from 'lucide-react'
import { useMovementsStats } from '../../hooks/useMovementsStats'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface DesglosesViewProps {
  isDark: boolean
  movimientos: MovimientoDiario[]
  onShowMonthlyBreakdown: (month?: number, year?: number) => void
  onShowYearlyBreakdown: (year?: number) => void
}

const DesglosesView: React.FC<DesglosesViewProps> = ({
  isDark,
  movimientos,
  onShowMonthlyBreakdown,
  onShowYearlyBreakdown
}) => {
  const movementsStats = useMovementsStats(movimientos)

  const handleMonthClick = (month: number, year: number) => {
    // Pasar el mes y año específico al handler
    onShowMonthlyBreakdown(month, year)
  }

  const handleYearClick = (year: number) => {
    // Pasar el año específico al handler
    onShowYearlyBreakdown(year)
  }
  const periodStats = useMemo(() => {
    if (!movimientos.length) return { years: [], months: 0, totalPeriods: 0 }

    const uniqueYears = new Set<number>()
    const uniqueMonths = new Set<string>()

    movimientos.forEach(mov => {
      const fecha = new Date(mov.fecha)
      const year = fecha.getFullYear()
      const monthKey = `${year}-${fecha.getMonth()}`
      
      uniqueYears.add(year)
      uniqueMonths.add(monthKey)
    })

    const years = Array.from(uniqueYears).sort((a, b) => b - a)
    
    return {
      years,
      months: uniqueMonths.size,
      totalPeriods: years.length
    }
  }, [movimientos])


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Desgloses Financieros
        </h1>
        <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Elige el tipo de análisis que deseas realizar
        </p>
        
        {/* Estadísticas generales */}
        {periodStats.totalPeriods > 0 && (
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {periodStats.totalPeriods}
                </p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Años con datos
                </p>
              </div>
              <div className="text-center">
                <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {periodStats.months}
                </p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Meses registrados
                </p>
              </div>
              <div className="text-center">
                <p className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  {periodStats.years.length > 0 ? `${Math.min(...periodStats.years)} - ${Math.max(...periodStats.years)}` : 'N/A'}
                </p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Período disponible
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contador de días totales */}
      <TotalDaysCounter
        totalDays={movementsStats.totalDays}
        totalMovements={movementsStats.totalMovements}
        monthsCount={movementsStats.monthsCount}
        yearsCount={movementsStats.yearsCount}
        isDark={isDark}
      />

      {/* Listas de meses y años */}
      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-6">
          {/* Card Desglose Mensual */}
          <div
            onClick={() => onShowMonthlyBreakdown()}
            className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-700 hover:to-blue-600"
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
                  {new Date().toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('es-ES', { month: 'long' }).slice(1)} {new Date().getFullYear()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <MonthList
            months={movementsStats.months}
            isDark={isDark}
            onMonthClick={handleMonthClick}
            getSortedMonths={movementsStats.getSortedMonths}
          />
        </div>
        
        <div className="space-y-6">
          {/* Card Desglose Anual */}
          <div
            onClick={() => onShowYearlyBreakdown()}
            className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600"
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
                  Año 2025
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                <BarChart className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <YearList
            years={movementsStats.years}
            isDark={isDark}
            onYearClick={handleYearClick}
            getSortedYears={movementsStats.getSortedYears}
          />
        </div>
      </div>

    </div>
  )
}

export default DesglosesView