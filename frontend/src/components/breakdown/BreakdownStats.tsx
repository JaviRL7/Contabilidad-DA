import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from '../ui/Card'
import { formatEuro } from '../../utils/formatters'

interface BreakdownStatsProps {
  totalIngresos: number
  totalGastos: number
  balance: number
  isDark: boolean
  period?: string
  additionalStats?: Array<{
    label: string
    value: string | number
    icon?: React.ReactNode
    color?: 'green' | 'red' | 'blue' | 'gray'
  }>
}

const BreakdownStats: React.FC<BreakdownStatsProps> = ({
  totalIngresos,
  totalGastos,
  balance,
  isDark,
  period,
  additionalStats
}) => {
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      return formatEuro(value)
    }
    return value
  }

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'green':
        return 'text-green-500'
      case 'red':
        return 'text-red-500'
      case 'blue':
        return 'text-blue-500'
      default:
        return isDark ? 'text-gray-300' : 'text-gray-700'
    }
  }

  const mainStats = [
    {
      label: `Ingresos${period ? ` ${period}` : ''}`,
      value: totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-500">
          €
        </div>
      ),
      color: 'text-green-500'
    },
    {
      label: `Gastos${period ? ` ${period}` : ''}`,
      value: totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 text-red-500">
          €
        </div>
      ),
      color: 'text-red-500'
    },
    {
      label: 'Balance Final',
      value: balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          balance >= 0 
            ? 'bg-blue-500/20 text-blue-500' 
            : 'bg-red-500/20 text-red-500'
        }`}>
          €
        </div>
      ),
      color: balance >= 0 ? 'text-blue-500' : 'text-red-500'
    }
  ]

  const allStats = [...mainStats, ...(additionalStats || [])]

  return (
    <div className={`grid gap-6 ${allStats.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
      {allStats.map((stat, index) => (
        <Card key={index} variant="default" isDark={isDark}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </h3>
                {index < 3 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    {stat.icon}
                  </div>
                ) : typeof stat.value === 'number' && stat.icon ? (
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-2xl font-bold ${stat.color || getColorClasses()}`}>
                      {stat.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {stat.icon}
                  </div>
                ) : (
                  <p className={`text-2xl font-bold mt-1 ${
                    stat.color || getColorClasses()
                  }`}>
                    {formatValue(stat.value)}
                  </p>
                )}
              </div>
              {index >= 3 && !(typeof stat.value === 'number' && stat.icon) && stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default BreakdownStats