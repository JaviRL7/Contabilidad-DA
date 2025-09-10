import React from 'react'
import { Calendar, BarChart3, TrendingUp, Clock } from 'lucide-react'
import Card from '../ui/Card'

interface TotalDaysCounterProps {
  totalDays: number
  totalMovements: number
  monthsCount: number
  yearsCount: number
  isDark: boolean
}

const TotalDaysCounter: React.FC<TotalDaysCounterProps> = ({
  totalDays,
  totalMovements,
  monthsCount,
  yearsCount,
  isDark
}) => {
  // Calcular estadísticas derivadas
  const avgMovementsPerDay = totalDays > 0 ? (totalMovements / totalDays).toFixed(1) : '0'
  const avgDaysPerMonth = monthsCount > 0 ? (totalDays / monthsCount).toFixed(1) : '0'

  const stats = [
    {
      icon: Calendar,
      value: totalDays.toString(),
      label: 'Días con movimientos',
      color: 'blue',
      description: 'Total de días únicos registrados'
    },
    {
      icon: BarChart3,
      value: totalMovements.toString(),
      label: 'Movimientos totales',
      color: 'green',
      description: 'Suma de todos los registros'
    },
    {
      icon: TrendingUp,
      value: avgMovementsPerDay,
      label: 'Promedio por día',
      color: 'purple',
      description: 'Movimientos promedio por día activo'
    },
    {
      icon: Clock,
      value: avgDaysPerMonth,
      label: 'Días activos/mes',
      color: 'orange',
      description: 'Promedio de días con actividad por mes'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-600/20' : 'bg-blue-100',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
        accent: isDark ? 'text-blue-300' : 'text-blue-700'
      },
      green: {
        bg: isDark ? 'bg-green-600/20' : 'bg-green-100',
        text: isDark ? 'text-green-400' : 'text-green-600',
        accent: isDark ? 'text-green-300' : 'text-green-700'
      },
      purple: {
        bg: isDark ? 'bg-purple-600/20' : 'bg-purple-100',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
        accent: isDark ? 'text-purple-300' : 'text-purple-700'
      },
      orange: {
        bg: isDark ? 'bg-orange-600/20' : 'bg-orange-100',
        text: isDark ? 'text-orange-400' : 'text-orange-600',
        accent: isDark ? 'text-orange-300' : 'text-orange-700'
      }
    }
    return colors[color] || colors.blue
  }

  return (
    <Card isDark={isDark} className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-r from-blue-100 to-purple-100'
        }`}>
          <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Estadísticas de Actividad
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Resumen general de tu actividad financiera
          </p>
        </div>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color)
          const IconComponent = stat.icon
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg transition-all duration-200 ${
                isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses.bg}`}>
                  <IconComponent className={`w-4 h-4 ${colorClasses.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-2xl font-bold ${colorClasses.accent}`}>
                    {stat.value}
                  </div>
                </div>
              </div>
              
              <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {stat.label}
              </div>
              
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.description}
              </div>
            </div>
          )
        })}
      </div>

      {/* Información adicional */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="text-center">
            <div className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {yearsCount}
            </div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Años registrados
            </div>
          </div>
          
          <div className={`w-px h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          
          <div className="text-center">
            <div className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {monthsCount}
            </div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Meses con actividad
            </div>
          </div>
          
          <div className={`w-px h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          
          <div className="text-center">
            <div className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {totalDays > 0 ? ((totalDays / (yearsCount * 365)) * 100).toFixed(1) : 0}%
            </div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Cobertura de días
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TotalDaysCounter