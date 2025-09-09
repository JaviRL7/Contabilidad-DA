import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import ChartContainer from '../charts/ChartContainer'
import SimpleBarChart from '../charts/SimpleBarChart'
import Card from '../ui/Card'
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

interface TrendAnalysisProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  movimientos,
  isDark
}) => {
  const monthlyTrends = useMemo(() => {
    const monthlyData: { [key: string]: { ingresos: number, gastos: number, balance: number, count: number } } = {}
    
    movimientos.forEach(mov => {
      const date = new Date(mov.fecha)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { ingresos: 0, gastos: 0, balance: 0, count: 0 }
      }
      
      monthlyData[monthKey].ingresos += mov.ingreso_total
      monthlyData[monthKey].gastos += mov.total_gastos
      monthlyData[monthKey].balance += mov.balance
      monthlyData[monthKey].count += 1
    })
    
    // Ordenar por fecha y tomar los últimos 6 meses
    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
    
    return sortedMonths.map(([monthKey, data]) => ({
      month: new Date(monthKey + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      monthKey,
      ...data
    }))
  }, [movimientos])

  const trendStats = useMemo(() => {
    if (monthlyTrends.length < 2) return null
    
    const lastMonth = monthlyTrends[monthlyTrends.length - 1]
    const prevMonth = monthlyTrends[monthlyTrends.length - 2]
    
    const ingresoTrend = ((lastMonth.ingresos - prevMonth.ingresos) / prevMonth.ingresos) * 100
    const gastoTrend = ((lastMonth.gastos - prevMonth.gastos) / prevMonth.gastos) * 100
    const balanceTrend = lastMonth.balance - prevMonth.balance
    
    return {
      ingresoTrend: isFinite(ingresoTrend) ? ingresoTrend : 0,
      gastoTrend: isFinite(gastoTrend) ? gastoTrend : 0,
      balanceTrend
    }
  }, [monthlyTrends])

  const TrendCard = ({ 
    title, 
    value, 
    trend, 
    isPercentage = true, 
    icon: Icon,
    color 
  }: {
    title: string
    value: number
    trend: number
    isPercentage?: boolean
    icon: any
    color: string
  }) => (
    <Card variant="default" isDark={isDark}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>
              {formatEuro(value)}
            </p>
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend >= 0 ? '+' : ''}{isPercentage ? trend.toFixed(1) + '%' : formatEuro(trend)}
              </span>
              <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                vs mes anterior
              </span>
            </div>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Tarjetas de tendencias */}
      {trendStats && (
        <div className="grid md:grid-cols-3 gap-6">
          <TrendCard
            title="Ingresos Mensuales"
            value={monthlyTrends[monthlyTrends.length - 1]?.ingresos || 0}
            trend={trendStats.ingresoTrend}
            icon={TrendingUp}
            color="text-green-500"
          />
          <TrendCard
            title="Gastos Mensuales"
            value={monthlyTrends[monthlyTrends.length - 1]?.gastos || 0}
            trend={trendStats.gastoTrend}
            icon={TrendingDown}
            color="text-red-500"
          />
          <TrendCard
            title="Balance Mensual"
            value={monthlyTrends[monthlyTrends.length - 1]?.balance || 0}
            trend={trendStats.balanceTrend}
            isPercentage={false}
            icon={BarChart3}
            color={monthlyTrends[monthlyTrends.length - 1]?.balance >= 0 ? 'text-blue-500' : 'text-red-500'}
          />
        </div>
      )}

      {/* Gráfico de tendencias */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartContainer
          title="Evolución de Ingresos"
          subtitle="Últimos 6 meses"
          isDark={isDark}
        >
          <SimpleBarChart
            data={monthlyTrends.map(month => ({
              label: month.month,
              value: month.ingresos,
              color: isDark ? 'bg-green-500' : 'bg-green-500'
            }))}
            isDark={isDark}
            maxHeight={200}
            showValues={true}
            horizontal={false}
          />
        </ChartContainer>

        <ChartContainer
          title="Evolución de Gastos"
          subtitle="Últimos 6 meses"
          isDark={isDark}
        >
          <SimpleBarChart
            data={monthlyTrends.map(month => ({
              label: month.month,
              value: month.gastos,
              color: isDark ? 'bg-red-500' : 'bg-red-500'
            }))}
            isDark={isDark}
            maxHeight={200}
            showValues={true}
            horizontal={false}
          />
        </ChartContainer>
      </div>

      {/* Gráfico de balance histórico */}
      <ChartContainer
        title="Balance Histórico"
        subtitle="Tendencia de balance mensual"
        isDark={isDark}
      >
        <SimpleBarChart
          data={monthlyTrends.map(month => ({
            label: month.month,
            value: month.balance
          }))}
          isDark={isDark}
          maxHeight={180}
          showValues={true}
          horizontal={false}
        />
      </ChartContainer>
    </div>
  )
}

export default TrendAnalysis