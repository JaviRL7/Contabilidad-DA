import React, { useMemo } from 'react'
import Card from '../ui/Card'
import TotalDaysCounter from '../breakdown/TotalDaysCounter'
import MonthList from '../breakdown/MonthList'
import YearList from '../breakdown/YearList'
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

  const breakdownOptions = [
    {
      title: 'Desglose Mensual',
      description: 'Analiza tus finanzas mes a mes con gráficas detalladas y comparativas',
      color: 'from-blue-600 to-blue-500',
      hoverColor: 'hover:from-blue-500 hover:to-blue-400',
      onClick: onShowMonthlyBreakdown,
      stats: `${periodStats.months} meses registrados`
    },
    {
      title: 'Desglose Anual',
      description: 'Visualiza la evolución de tus finanzas durante todo el año con tendencias y patrones',
      color: 'from-purple-600 to-purple-500',
      hoverColor: 'hover:from-purple-500 hover:to-purple-400',
      onClick: onShowYearlyBreakdown,
      stats: `${periodStats.totalPeriods} años disponibles`
    }
  ]

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
        <MonthList
          months={movementsStats.months}
          isDark={isDark}
          onMonthClick={handleMonthClick}
          getSortedMonths={movementsStats.getSortedMonths}
        />
        
        <YearList
          years={movementsStats.years}
          isDark={isDark}
          onYearClick={handleYearClick}
          getSortedYears={movementsStats.getSortedYears}
        />
      </div>

      {/* Opciones de desglose */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {breakdownOptions.map((option, index) => (
          <Card key={index} variant="default" isDark={isDark} className="hover:shadow-xl transition-all duration-300">
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Contenido */}
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {option.title}
                </h3>
                <p className={`text-base mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {option.description}
                </p>
                
                {/* Estadísticas específicas */}
                <div className={`mb-6 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {option.stats}
                </div>
                
                {/* Botón */}
                <button
                  onClick={option.onClick}
                  className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-md bg-gradient-to-r ${option.color} ${option.hoverColor} transform hover:scale-105`}
                >
                  Ver {option.title}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DesglosesView