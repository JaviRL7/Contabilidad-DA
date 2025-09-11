import React from 'react'
import { formatEuro } from '../../utils/formatters'

interface BarData {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: BarData[]
  isDark: boolean
  maxHeight?: number
  showValues?: boolean
  horizontal?: boolean
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  isDark,
  maxHeight = 200,
  showValues = true,
  horizontal = false
}) => {
  const maxValue = Math.max(...data.map(item => Math.abs(item.value)))
  
  const getBarColor = (item: BarData, index: number) => {
    if (item.color) return item.color
    
    // Colores por defecto alternando
    const colors = [
      isDark ? 'bg-blue-500' : 'bg-blue-500',
      isDark ? 'bg-green-500' : 'bg-green-500', 
      isDark ? 'bg-purple-500' : 'bg-purple-500',
      isDark ? 'bg-yellow-500' : 'bg-yellow-500',
      isDark ? 'bg-red-500' : 'bg-red-500',
    ]
    return colors[index % colors.length]
  }

  if (horizontal) {
    return (
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {showValues && (
                  <span className={`text-sm font-semibold ${
                    item.value >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {typeof item.value === 'number' ? formatEuro(item.value) : item.value}
                  </span>
                )}
              </div>
              <div className={`w-full h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(item, index)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Gráfico vertical
  const textTopHeight = showValues ? 20 : 0 // Espacio reservado para texto superior
  const textBottomHeight = 25 // Espacio reservado para etiquetas inferiores
  const availableBarHeight = maxHeight - textTopHeight - textBottomHeight
  
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: maxHeight }}>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0
        const height = (percentage / 100) * availableBarHeight
        
        return (
          <div key={index} className="flex flex-col justify-end items-center flex-1" style={{ height: maxHeight }}>
            {showValues && (
              <div 
                className={`text-xs font-medium mb-2 ${
                  item.value >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
                style={{ minHeight: textTopHeight }}
              >
                {typeof item.value === 'number' ? formatEuro(item.value) : item.value}
              </div>
            )}
            <div
              className={`w-full rounded-t transition-all duration-500 ${getBarColor(item, index)} min-h-[4px] mb-2`}
              style={{ height: Math.max(4, height) }}
            />
            <div 
              className={`text-xs text-center font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              style={{ minHeight: textBottomHeight }}
            >
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SimpleBarChart