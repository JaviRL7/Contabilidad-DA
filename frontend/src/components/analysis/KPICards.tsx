import React from 'react'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/formatters'

interface KPIData {
  totalIngresos: number
  totalGastos: number
  balance: number
  promedioIngresos: number
  promedioGastos: number
  diasConMovimientos: number
}

interface KPICardsProps {
  data: KPIData
  isDark: boolean
}

const KPICards: React.FC<KPICardsProps> = ({ data, isDark }) => {
  const kpis = [
    {
      title: 'Ingresos Totales',
      value: data.totalIngresos,
      color: isDark ? 'text-green-400' : 'text-green-600',
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      icon: '📈',
      format: formatCurrency
    },
    {
      title: 'Gastos Totales',
      value: data.totalGastos,
      color: isDark ? 'text-red-400' : 'text-red-600',
      bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
      icon: '📉',
      format: formatCurrency
    },
    {
      title: 'Balance',
      value: data.balance,
      color: data.balance >= 0 
        ? isDark ? 'text-green-400' : 'text-green-600'
        : isDark ? 'text-red-400' : 'text-red-600',
      bgColor: data.balance >= 0
        ? isDark ? 'bg-green-900/20' : 'bg-green-50'
        : isDark ? 'bg-red-900/20' : 'bg-red-50',
      icon: data.balance >= 0 ? '💰' : '⚠️',
      format: formatCurrency
    },
    {
      title: 'Promedio Diario Ingresos',
      value: data.promedioIngresos,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      icon: '📊',
      format: formatCurrency
    },
    {
      title: 'Promedio Diario Gastos',
      value: data.promedioGastos,
      color: isDark ? 'text-orange-400' : 'text-orange-600',
      bgColor: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      icon: '📋',
      format: formatCurrency
    },
    {
      title: 'Días con Movimientos',
      value: data.diasConMovimientos,
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      icon: '📅',
      format: (value: number) => value.toString()
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <Card key={index} isDark={isDark} variant="analysis" padding="md">
          <div className={`p-4 rounded-lg ${kpi.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {kpi.title}
                </p>
                <p className={`text-2xl font-bold ${kpi.color}`}>
                  {kpi.format(kpi.value)}
                </p>
              </div>
              <div className="text-3xl opacity-60">
                {kpi.icon}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default KPICards