import React from 'react'
import { formatEuro } from '../../utils/formatters'

interface PieData {
  label: string
  value: number
  color?: string
}

interface SimplePieChartProps {
  data: PieData[]
  isDark: boolean
  size?: number
  showLegend?: boolean
  showValues?: boolean
}

const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  isDark,
  size = 200,
  showLegend = true,
  showValues = true
}) => {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0)
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className={`w-16 h-16 mx-auto mb-2 rounded-full border-4 ${
            isDark ? 'border-gray-700' : 'border-gray-300'
          }`} />
          <p className="text-sm">Sin datos</p>
        </div>
      </div>
    )
  }
  
  const getColor = (index: number, customColor?: string) => {
    if (customColor) return customColor
    
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green  
      '#8b5cf6', // purple
      '#f59e0b', // yellow
      '#ef4444', // red
      '#6b7280', // gray
      '#ec4899', // pink
      '#14b8a6', // teal
    ]
    return colors[index % colors.length]
  }

  let cumulativePercentage = 0
  const segments = data.map((item, index) => {
    const percentage = (Math.abs(item.value) / total) * 100
    const startAngle = cumulativePercentage * 3.6 // Convert to degrees
    const endAngle = (cumulativePercentage + percentage) * 3.6
    cumulativePercentage += percentage
    
    // SVG path para el segmento
    const center = size / 2
    const radius = (size - 20) / 2
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = center + radius * Math.cos(startAngleRad)
    const y1 = center + radius * Math.sin(startAngleRad)
    const x2 = center + radius * Math.cos(endAngleRad)
    const y2 = center + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = percentage > 50 ? 1 : 0
    
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    return {
      ...item,
      percentage,
      pathData,
      color: getColor(index, item.color)
    }
  })

  return (
    <div className="flex items-center gap-6">
      {/* Gráfico circular */}
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              stroke={isDark ? '#1f2937' : '#ffffff'}
              strokeWidth="2"
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
        </svg>
      </div>

      {/* Leyenda */}
      {showLegend && (
        <div className="space-y-2 flex-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {segment.label}
                </span>
              </div>
              <div className="text-right">
                {showValues && (
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {typeof segment.value === 'number' ? formatEuro(segment.value) : segment.value}
                  </div>
                )}
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {segment.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SimplePieChart