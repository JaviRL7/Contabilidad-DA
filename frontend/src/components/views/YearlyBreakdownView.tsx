import React, { useState, useMemo } from 'react'
import BreakdownHeader from '../breakdown/BreakdownHeader'
import BreakdownStats from '../breakdown/BreakdownStats'
import CategoryRankings from '../breakdown/CategoryRankings'
import YearNavigation from '../breakdown/YearNavigation'
import MonthlyGrid from '../breakdown/MonthlyGrid'
import YearlyIncomeEvolution from '../charts/YearlyIncomeEvolution'
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
  onNavigateToDesgloses?: () => void
  onGoToMonthly: (month: number, year: number) => void
}

const YearlyBreakdownView: React.FC<YearlyBreakdownViewProps> = ({ 
  movimientos, 
  onBack, 
  isDark,
  onNavigateToDesgloses,
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

  // Calcular categorías anuales
  const yearlyCategories = useMemo(() => {
    const gastosCategories: { [key: string]: number } = {}
    const ingresosCategories: { [key: string]: number } = {}
    
    yearlyMovimientos.forEach(mov => {
      mov.gastos.forEach((gasto: any) => {
        gastosCategories[gasto.etiqueta] = (gastosCategories[gasto.etiqueta] || 0) + gasto.monto
      })
      mov.ingresos.forEach((ingreso: any) => {
        ingresosCategories[ingreso.etiqueta] = (ingresosCategories[ingreso.etiqueta] || 0) + ingreso.monto
      })
    })
    
    return {
      gastos: Object.entries(gastosCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount })),
      ingresos: Object.entries(ingresosCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }))
    }
  }, [yearlyMovimientos])

  const breadcrumbItems = [
    {
      label: 'Análisis Financiero',
      onClick: onBack
    },
    {
      label: 'Desgloses',
      onClick: onNavigateToDesgloses
    },
    {
      label: `Desglose Anual ${currentYear}`,
      isActive: true
    }
  ]

  const handleGoToCurrentYear = () => {
    const currentYear = new Date().getFullYear()
    if (availableYears.includes(currentYear)) {
      setCurrentYear(currentYear)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header modular */}
      <BreakdownHeader
        title={`Resumen Anual ${currentYear}`}
        subtitle={`${yearlyMovimientos.length} movimientos en el año`}
        isDark={isDark}
        onBack={onBack}
        currentView="yearly"
        breadcrumbItems={breadcrumbItems}
        hideBackButton={true}
      />

      {/* Navegación de año modular */}
      <YearNavigation
        currentYear={currentYear}
        availableYears={availableYears}
        isDark={isDark}
        onYearChange={setCurrentYear}
        onGoToCurrent={handleGoToCurrentYear}
      />

      {/* Estadísticas anuales */}
      <BreakdownStats
        totalIngresos={yearlyTotals.ingresos}
        totalGastos={yearlyTotals.gastos}
        balance={yearlyTotals.balance}
        isDark={isDark}
        period={`${currentYear}`}
        onGoToCurrentMonth={() => {
          const currentDate = new Date()
          const currentMonth = currentDate.getMonth()
          const currentYear = currentDate.getFullYear()
          onGoToMonthly(currentMonth, currentYear)
        }}
      />

      {/* Ranking de categorías anuales */}
      <CategoryRankings
        gastosCategories={yearlyCategories.gastos}
        ingresosCategories={yearlyCategories.ingresos}
        isDark={isDark}
        period={`${currentYear}`}
      />

      {/* Grilla de meses modular */}
      <MonthlyGrid
        monthlyData={monthlyData}
        currentYear={currentYear}
        isDark={isDark}
        onMonthClick={onGoToMonthly}
      />

      {/* Gráfica de evolución de ingresos */}
      <YearlyIncomeEvolution
        movimientos={movimientos}
        isDark={isDark}
        year={currentYear}
      />
    </div>
  )
}

export default YearlyBreakdownView