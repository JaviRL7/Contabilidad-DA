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
    
    const periodStart = movimientos.length > 0 ? new Date(movimientos[0].fecha) : new Date()
    const periodEnd = movimientos.length > 0 ? new Date(movimientos[movimientos.length - 1].fecha) : new Date()
    const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      totalIngresos,
      totalGastos,
      totalBalance,
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

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Balance Total
                </p>
                <p className={`text-lg font-bold ${
                  analysisStats.totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  €{analysisStats.totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Promedio Diario
                </p>
                <p className="text-lg font-bold text-blue-500">
                  €{analysisStats.avgDailyBalance.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Período de Análisis
                </p>
                <p className="text-lg font-bold text-purple-500">
                  {analysisStats.daysPeriod} días
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <PieChart className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Movimientos
                </p>
                <p className="text-lg font-bold text-orange-500">
                  {analysisStats.totalTransactions}
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