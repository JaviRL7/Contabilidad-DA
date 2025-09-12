import React, { useState, useMemo } from 'react'
import { PieChart, BarChart3 } from 'lucide-react'
import GradientButton from '../ui/GradientButton'
import BreakdownHeader from '../breakdown/BreakdownHeader'
import BreakdownStats from '../breakdown/BreakdownStats'
import CategoryRankings from '../breakdown/CategoryRankings'
import DetailedMovementsList from '../breakdown/DetailedMovementsList'
import MonthNavigation from '../breakdown/MonthNavigation'
import ChartContainer from '../charts/ChartContainer'
import SimpleBarChart from '../charts/SimpleBarChart'
import SimplePieChart from '../charts/SimplePieChart'
import SimpleLineChart from '../charts/SimpleLineChart'
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

interface MonthlyBreakdownViewProps {
  movimientos: MovimientoDiario[]
  selectedMonth: number // 1-12
  selectedYear: number
  isDark: boolean
  onBack: () => void
  onNavigateToDesgloses?: () => void
  onNavigateToYearly?: () => void
  onMonthChange?: (month: number, year: number) => void
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
}

const MonthlyBreakdownView: React.FC<MonthlyBreakdownViewProps> = ({
  movimientos,
  selectedMonth,
  selectedYear,
  isDark,
  onBack,
  onNavigateToDesgloses,
  onNavigateToYearly,
  onMonthChange,
  onEditMovimiento,
  onDeleteMovimiento
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart')

  // Obtener meses disponibles con movimientos
  const availableMonths = useMemo(() => {
    const monthsWithData = new Set<string>()
    
    movimientos.forEach(mov => {
      const fecha = new Date(mov.fecha)
      const month = fecha.getMonth() + 1
      const year = fecha.getFullYear()
      monthsWithData.add(`${year}-${month}`)
    })
    
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    
    return Array.from(monthsWithData)
      .map(dateStr => {
        const [year, month] = dateStr.split('-').map(Number)
        return {
          month,
          year,
          label: `${monthNames[month - 1]} ${year}`
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }, [movimientos])

  // Filtrar movimientos del mes seleccionado
  const monthlyMovimientos = useMemo(() => {
    return movimientos.filter(mov => {
      const fecha = new Date(mov.fecha)
      return fecha.getFullYear() === selectedYear && fecha.getMonth() + 1 === selectedMonth
    })
  }, [movimientos, selectedMonth, selectedYear])

  // Calcular estadísticas del mes
  const monthStats = useMemo(() => {
    const totalIngresos = monthlyMovimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0)
    const totalGastos = monthlyMovimientos.reduce((sum, mov) => sum + mov.total_gastos, 0)
    const balance = totalIngresos - totalGastos

    return {
      totalIngresos,
      totalGastos,
      balance,
      promedioBalance: monthlyMovimientos.length > 0 ? balance / monthlyMovimientos.length : 0,
      diasConMovimiento: monthlyMovimientos.length
    }
  }, [monthlyMovimientos])

  // Categorías de gastos más frecuentes
  const gastosCategories = useMemo(() => {
    const categories: { [key: string]: number } = {}
    
    monthlyMovimientos.forEach(mov => {
      mov.gastos.forEach((gasto: any) => {
        categories[gasto.etiqueta] = (categories[gasto.etiqueta] || 0) + gasto.monto
      })
    })
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))
  }, [monthlyMovimientos])

  // Categorías de ingresos más frecuentes
  const ingresosCategories = useMemo(() => {
    const categories: { [key: string]: number } = {}
    
    monthlyMovimientos.forEach(mov => {
      mov.ingresos.forEach((ingreso: any) => {
        categories[ingreso.etiqueta] = (categories[ingreso.etiqueta] || 0) + ingreso.monto
      })
    })
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))
  }, [monthlyMovimientos])

  // Agrupar por semanas
  const weeklyData = useMemo(() => {
    const weeks: { [key: string]: MovimientoDiario[] } = {}
    
    monthlyMovimientos.forEach(mov => {
      const fecha = new Date(mov.fecha)
      const weekNumber = Math.ceil(fecha.getDate() / 7)
      const weekKey = `Semana ${weekNumber}`
      
      if (!weeks[weekKey]) weeks[weekKey] = []
      weeks[weekKey].push(mov)
    })
    
    return weeks
  }, [monthlyMovimientos])

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const monthName = monthNames[selectedMonth - 1]
  const periodLabel = `${monthName} ${selectedYear}`

  // Funciones para navegación de meses
  const handleGoToCurrentMonth = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    // Verificar si existe ese mes en los datos disponibles
    const hasCurrentMonth = availableMonths.some(
      m => m.month === currentMonth && m.year === currentYear
    )
    
    if (hasCurrentMonth && onMonthChange) {
      onMonthChange(currentMonth, currentYear)
    }
  }

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
      label: 'Desglose Anual',
      onClick: onNavigateToYearly
    },
    {
      label: periodLabel,
      isActive: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header modular */}
      <BreakdownHeader
        title={`Desglose de ${periodLabel}`}
        subtitle={`${monthStats.diasConMovimiento} días con actividad`}
        isDark={isDark}
        onBack={onBack}
        onNavigateToYearly={onNavigateToYearly}
        currentView="monthly"
        breadcrumbItems={breadcrumbItems}
        hideBackButton={true}
      />

      {/* Navegación de mes */}
      {onMonthChange && (
        <MonthNavigation
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          availableMonths={availableMonths}
          isDark={isDark}
          onMonthChange={onMonthChange}
          onGoToCurrent={handleGoToCurrentMonth}
        />
      )}

      {/* Controles de vista */}
      <div className="flex justify-end gap-2">
        <GradientButton
          variant={viewMode === 'chart' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('chart')}
          isDark={isDark}
        >
          <PieChart className="w-4 h-4 mr-1" />
          Gráficos
        </GradientButton>
        <GradientButton
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('list')}
          isDark={isDark}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Lista
        </GradientButton>
      </div>

      {/* Estadísticas principales */}
      <BreakdownStats
        totalIngresos={monthStats.totalIngresos}
        totalGastos={monthStats.totalGastos}
        balance={monthStats.balance}
        isDark={isDark}
        period={monthName}
        additionalStats={[
          {
            label: 'Promedio Diario',
            value: monthStats.promedioBalance,
            color: 'gray'
          }
        ]}
      />

      {/* Ranking de categorías */}
      <CategoryRankings
        gastosCategories={gastosCategories}
        ingresosCategories={ingresosCategories}
        isDark={isDark}
        period={monthName}
      />

      {/* Gráficos modernos */}
      {viewMode === 'chart' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gráfico de distribución de gastos */}
          <ChartContainer
            title="Distribución de Gastos"
            subtitle="Top categorías del mes"
            isDark={isDark}
          >
            <SimplePieChart
              data={gastosCategories.slice(0, 6).map(cat => ({
                label: cat.name,
                value: cat.amount
              }))}
              isDark={isDark}
              size={180}
              showLegend={true}
              showValues={true}
            />
          </ChartContainer>

          {/* Gráfico de comparación ingresos vs gastos por semana */}
          <ChartContainer
            title="Balance Semanal"
            subtitle="Comparación de ingresos y gastos"
            isDark={isDark}
          >
            <SimpleBarChart
              data={Object.entries(weeklyData).map(([weekName, movements]) => {
                const weekIngresos = movements.reduce((sum, mov) => sum + mov.ingreso_total, 0)
                const weekGastos = movements.reduce((sum, mov) => sum + mov.total_gastos, 0)
                return {
                  label: weekName.replace('Semana ', 'S'),
                  value: weekIngresos - weekGastos
                }
              }).reverse()}
              isDark={isDark}
              maxHeight={200}
              showValues={true}
              horizontal={false}
            />
          </ChartContainer>

          {/* Gráfico de evolución diaria */}
          <ChartContainer
            title="Evolución Diaria"
            subtitle="Balance por día del mes"
            isDark={isDark}
            className="md:col-span-2"
          >
            <SimpleLineChart
              data={(() => {
                // Obtener el número de días del mes actual
                const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
                const dailyData = []
                
                // Crear un mapa de movimientos por día
                const movimientosPorDia = new Map()
                monthlyMovimientos.forEach(mov => {
                  const day = new Date(mov.fecha).getDate()
                  movimientosPorDia.set(day, mov.balance)
                })
                
                // Crear datos para todos los días del mes
                for (let day = 1; day <= daysInMonth; day++) {
                  dailyData.push({
                    label: day.toString(),
                    value: movimientosPorDia.get(day) || 0
                  })
                }
                
                return dailyData
              })()}
              isDark={isDark}
              maxHeight={180}
              showValues={true}
              showGrid={true}
            />
          </ChartContainer>
        </div>
      )}

      {/* Lista mejorada de movimientos detallados */}
      {viewMode === 'list' && (
        <DetailedMovementsList
          weeklyData={weeklyData}
          isDark={isDark}
          onEditMovimiento={onEditMovimiento}
          onDeleteMovimiento={onDeleteMovimiento}
        />
      )}
    </div>
  )
}

export default MonthlyBreakdownView