import React from 'react'
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