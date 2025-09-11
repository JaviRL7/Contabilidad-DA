import React, { useMemo } from 'react'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface YearlyIncomeEvolutionProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  year: number
}

const YearlyIncomeEvolution: React.FC<YearlyIncomeEvolutionProps> = ({
  movimientos,
  isDark,
  year
}) => {
  const monthlyData = useMemo(() => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    
    const monthlyIngresos = Array(12).fill(0)
    
    movimientos.forEach(mov => {
      const fecha = new Date(mov.fecha)
      if (fecha.getFullYear() === year) {
        const month = fecha.getMonth()
        monthlyIngresos[month] += mov.ingreso_total || 0
      }
    })
    
    return months.map((month, index) => ({
      month,
      amount: monthlyIngresos[index],
      monthIndex: index
    }))
  }, [movimientos, year])

  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1)
  const chartHeight = 300
  const chartWidth = 800
  const padding = 60

  // Calcular puntos para la línea
  const points = monthlyData.map((data, index) => {
    const x = padding + (index * (chartWidth - 2 * padding)) / 11
    const y = chartHeight - padding - ((data.amount / maxAmount) * (chartHeight - 2 * padding))
    return { x, y, ...data }
  })

  // Crear el path de la línea
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className={`text-xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Evolución de Ingresos {year}
      </h3>
      
      <div className="flex justify-center overflow-x-auto">
        <svg 
          width={chartWidth} 
          height={chartHeight + 40} 
          className="overflow-visible min-w-full max-w-none"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1={padding}
                y1={chartHeight - padding - (ratio * (chartHeight - 2 * padding))}
                x2={chartWidth - padding}
                y2={chartHeight - padding - (ratio * (chartHeight - 2 * padding))}
                stroke={isDark ? '#374151' : '#e5e7eb'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={padding - 10}
                y={chartHeight - padding - (ratio * (chartHeight - 2 * padding))}
                textAnchor="end"
                dominantBaseline="central"
                className={`text-xs ${isDark ? 'fill-gray-400' : 'fill-gray-600'}`}
              >
                {Math.round(maxAmount * ratio)}€
              </text>
            </g>
          ))}
          
          {/* Línea principal */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Puntos */}
          {points.map((point, index) => (
            <g key={index}>
              {/* Punto */}
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#3b82f6"
                stroke={isDark ? '#1f2937' : '#ffffff'}
                strokeWidth="3"
                className="hover:r-8 transition-all cursor-pointer"
              />
              
              {/* Etiqueta de mes */}
              <text
                x={point.x}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className={`text-xs font-medium ${isDark ? 'fill-gray-300' : 'fill-gray-700'}`}
              >
                {point.month}
              </text>
              
              {/* Tooltip en hover */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={point.x - 35}
                  y={point.y - 35}
                  width="70"
                  height="25"
                  rx="4"
                  fill={isDark ? '#374151' : '#1f2937'}
                />
                <text
                  x={point.x}
                  y={point.y - 20}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  {point.amount.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Promedio</p>
          <p className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {Math.round(monthlyData.reduce((sum, d) => sum + d.amount, 0) / 12).toLocaleString('es-ES')}€
          </p>
        </div>
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mejor mes</p>
          <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {Math.max(...monthlyData.map(d => d.amount)).toLocaleString('es-ES')}€
          </p>
        </div>
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total anual</p>
          <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {monthlyData.reduce((sum, d) => sum + d.amount, 0).toLocaleString('es-ES')}€
          </p>
        </div>
      </div>
    </div>
  )
}

export default YearlyIncomeEvolution