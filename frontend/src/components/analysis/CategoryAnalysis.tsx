import React, { useMemo } from 'react'
import { Tag, TrendingUp, TrendingDown, Star } from 'lucide-react'
import ChartContainer from '../charts/ChartContainer'
import SimplePieChart from '../charts/SimplePieChart'
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

interface CategoryAnalysisProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  etiquetasEsenciales?: string[]
}

const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({
  movimientos,
  isDark,
  etiquetasEsenciales = []
}) => {
  const categoryStats = useMemo(() => {
    const gastosCategories: { [key: string]: { total: number, count: number, isEssential: boolean } } = {}
    const ingresosCategories: { [key: string]: { total: number, count: number } } = {}
    
    movimientos.forEach(mov => {
      mov.gastos.forEach((gasto: any) => {
        const etiqueta = gasto.etiqueta
        const isEssential = etiquetasEsenciales.some(essential => 
          essential.toLowerCase() === etiqueta.toLowerCase()
        )
        
        if (!gastosCategories[etiqueta]) {
          gastosCategories[etiqueta] = { total: 0, count: 0, isEssential }
        }
        gastosCategories[etiqueta].total += gasto.monto
        gastosCategories[etiqueta].count += 1
      })
      
      mov.ingresos.forEach((ingreso: any) => {
        const etiqueta = ingreso.etiqueta
        if (!ingresosCategories[etiqueta]) {
          ingresosCategories[etiqueta] = { total: 0, count: 0 }
        }
        ingresosCategories[etiqueta].total += ingreso.monto
        ingresosCategories[etiqueta].count += 1
      })
    })
    
    const topGastos = Object.entries(gastosCategories)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 8)
      .map(([name, data]) => ({ name, ...data }))
    
    const topIngresos = Object.entries(ingresosCategories)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 8)
      .map(([name, data]) => ({ name, ...data }))

    const essentialGastos = topGastos.filter(cat => cat.isEssential)
    const nonEssentialGastos = topGastos.filter(cat => !cat.isEssential)
    
    return {
      topGastos,
      topIngresos,
      essentialGastos,
      nonEssentialGastos
    }
  }, [movimientos, etiquetasEsenciales])

  const categoryInsights = useMemo(() => {
    const totalGastos = categoryStats.topGastos.reduce((sum, cat) => sum + cat.total, 0)
    const essentialTotal = categoryStats.essentialGastos.reduce((sum, cat) => sum + cat.total, 0)
    const essentialPercentage = totalGastos > 0 ? (essentialTotal / totalGastos) * 100 : 0
    
    const mostExpensive = categoryStats.topGastos[0]
    const mostFrequent = categoryStats.topGastos.reduce((prev, current) => 
      (current.count > prev.count) ? current : prev
    )
    
    return {
      essentialPercentage,
      mostExpensive,
      mostFrequent,
      totalCategories: categoryStats.topGastos.length + categoryStats.topIngresos.length
    }
  }, [categoryStats])

  return (
    <div className="space-y-6">
      {/* Tarjetas de insights */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gastos Esenciales
                </p>
                <p className="text-lg font-bold text-yellow-500">
                  {categoryInsights.essentialPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Mayor Gasto
                </p>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {categoryInsights.mostExpensive?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Más Frecuente
                </p>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {categoryInsights.mostFrequent?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" isDark={isDark}>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Categorías Activas
                </p>
                <p className="text-lg font-bold text-green-500">
                  {categoryInsights.totalCategories}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos de análisis por categorías */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribución de gastos */}
        <ChartContainer
          title="Distribución de Gastos"
          subtitle="Por categorías principales"
          isDark={isDark}
        >
          <SimplePieChart
            data={categoryStats.topGastos.slice(0, 6).map(cat => ({
              label: cat.isEssential ? `${cat.name} ⭐` : cat.name,
              value: cat.total
            }))}
            isDark={isDark}
            size={160}
            showLegend={true}
            showValues={true}
          />
        </ChartContainer>

        {/* Ranking de categorías de gastos */}
        <ChartContainer
          title="Top Gastos por Categoría"
          subtitle="Ordenado por monto total"
          isDark={isDark}
        >
          <SimpleBarChart
            data={categoryStats.topGastos.slice(0, 6).map(cat => ({
              label: cat.name.length > 8 ? cat.name.substring(0, 8) + '...' : cat.name,
              value: cat.total,
              color: cat.isEssential ? (isDark ? 'bg-yellow-500' : 'bg-yellow-500') : undefined
            }))}
            isDark={isDark}
            maxHeight={180}
            showValues={true}
            horizontal={true}
          />
        </ChartContainer>

        {/* Distribución de ingresos */}
        <ChartContainer
          title="Fuentes de Ingresos"
          subtitle="Diversificación de ingresos"
          isDark={isDark}
        >
          <SimplePieChart
            data={categoryStats.topIngresos.slice(0, 6).map(cat => ({
              label: cat.name,
              value: cat.total
            }))}
            isDark={isDark}
            size={160}
            showLegend={true}
            showValues={true}
          />
        </ChartContainer>

        {/* Frecuencia vs Monto */}
        <ChartContainer
          title="Frecuencia de Uso"
          subtitle="Número de transacciones por categoría"
          isDark={isDark}
        >
          <SimpleBarChart
            data={categoryStats.topGastos.slice(0, 6).map(cat => ({
              label: cat.name.length > 8 ? cat.name.substring(0, 8) + '...' : cat.name,
              value: cat.count,
              color: isDark ? 'bg-purple-500' : 'bg-purple-500'
            }))}
            isDark={isDark}
            maxHeight={180}
            showValues={true}
            horizontal={true}
          />
        </ChartContainer>
      </div>

      {/* Comparación esenciales vs no esenciales */}
      {categoryStats.essentialGastos.length > 0 && (
        <ChartContainer
          title="Gastos Esenciales vs No Esenciales"
          subtitle="Comparación de distribución"
          isDark={isDark}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Gastos Esenciales ⭐
              </h4>
              <SimpleBarChart
                data={categoryStats.essentialGastos.slice(0, 5).map(cat => ({
                  label: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
                  value: cat.total,
                  color: isDark ? 'bg-yellow-500' : 'bg-yellow-500'
                }))}
                isDark={isDark}
                maxHeight={140}
                showValues={true}
                horizontal={true}
              />
            </div>
            
            <div>
              <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Gastos Opcionales
              </h4>
              <SimpleBarChart
                data={categoryStats.nonEssentialGastos.slice(0, 5).map(cat => ({
                  label: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
                  value: cat.total,
                  color: isDark ? 'bg-blue-500' : 'bg-blue-500'
                }))}
                isDark={isDark}
                maxHeight={140}
                showValues={true}
                horizontal={true}
              />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  )
}

export default CategoryAnalysis