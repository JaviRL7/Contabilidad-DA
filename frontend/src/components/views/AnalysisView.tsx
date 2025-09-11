import React, { useState, useMemo } from 'react'
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'
import GradientButton from '../ui/GradientButton'
import Card from '../ui/Card'
import TrendAnalysis from '../analysis/TrendAnalysis'
import CategoryAnalysis from '../analysis/CategoryAnalysis'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface AnalysisViewProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  onBack: () => void
  etiquetasEsenciales?: string[]
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
  movimientos,
  isDark,
  onBack,
  etiquetasEsenciales = []
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'categories'>('trends')

  const analysisStats = useMemo(() => {
    const totalIngresos = movimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0)
    const totalGastos = movimientos.reduce((sum, mov) => sum + mov.total_gastos, 0)
    const totalBalance = totalIngresos - totalGastos
    
    // Obtener fechas ordenadas para calcular el período correctamente
    if (movimientos.length === 0) {
      return {
        totalIngresos,
        totalGastos,
        totalBalance,
        periodStart: null,
        periodEnd: null,
        daysPeriod: 0,
        avgDailyBalance: 0,
        totalTransactions: 0
      }
    }

    const fechas = movimientos.map(mov => new Date(mov.fecha)).sort((a, b) => a.getTime() - b.getTime())
    const periodStart = fechas[0]
    const periodEnd = fechas[fechas.length - 1]
    const daysDiff = Math.abs(Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))) + 1
    
    return {
      totalIngresos,
      totalGastos,
      totalBalance,
      periodStart,
      periodEnd,
      daysPeriod: daysDiff,
      avgDailyBalance: daysDiff > 0 ? totalBalance / daysDiff : 0,
      totalTransactions: movimientos.length
    }
  }, [movimientos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GradientButton
            variant="secondary"
            size="sm"
            onClick={onBack}
            isDark={isDark}
          >
            ← Volver
          </GradientButton>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Análisis Avanzado
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Insights detallados de tu actividad financiera
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <GradientButton
            variant={activeTab === 'trends' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('trends')}
            isDark={isDark}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Tendencias
          </GradientButton>
          <GradientButton
            variant={activeTab === 'categories' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('categories')}
            isDark={isDark}
          >
            <PieChart className="w-4 h-4 mr-1" />
            Categorías
          </GradientButton>
        </div>
      </div>

      {/* Summary Cards - Mejoradas */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card variant="default" isDark={isDark}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Balance Total
                </p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-bold ${
                    analysisStats.totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {analysisStats.totalBalance.toLocaleString()}
                  </p>
                  <span className={`text-xl font-semibold ${
                    analysisStats.totalBalance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>€</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {analysisStats.totalBalance >= 0 ? '↗ Positivo' : '↘ Negativo'} • {analysisStats.daysPeriod} días
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <BarChart3 className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Promedio Diario
                </p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-blue-500">
                    {analysisStats.avgDailyBalance.toFixed(0)}
                  </p>
                  <span className="text-xl font-semibold text-blue-400">€</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Balance promedio por día
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <PieChart className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Movimientos
                </p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-orange-500">
                    {analysisStats.totalTransactions}
                  </p>
                  <span className="text-xl font-semibold text-orange-400">días</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Ingresos: {analysisStats.totalIngresos.toLocaleString()}€ • Gastos: {analysisStats.totalGastos.toLocaleString()}€
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Content */}
      {activeTab === 'trends' && (
        <TrendAnalysis
          movimientos={movimientos}
          isDark={isDark}
        />
      )}

      {activeTab === 'categories' && (
        <CategoryAnalysis
          movimientos={movimientos}
          isDark={isDark}
          etiquetasEsenciales={etiquetasEsenciales}
        />
      )}
    </div>
  )
}

export default AnalysisView