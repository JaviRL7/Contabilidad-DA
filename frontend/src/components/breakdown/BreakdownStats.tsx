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
      value: totalIngresos,
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      color: 'text-green-500'
    },
    {
      label: `Gastos${period ? ` ${period}` : ''}`,
      value: totalGastos,
      icon: <TrendingDown className="w-8 h-8 text-red-500" />,
      color: 'text-red-500'
    },
    {
      label: 'Balance Final',
      value: balance,
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
                <p className={`text-2xl font-bold mt-1 ${
                  stat.color || (index < 3 ? mainStats[index].color : getColorClasses())
                }`}>
                  {formatValue(stat.value)}
                </p>
              </div>
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default BreakdownStats