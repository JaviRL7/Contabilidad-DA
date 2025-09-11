import React from 'react'
import { formatEuro } from '../../utils/formatters'

interface LineData {
  label: string
  value: number
}

interface SimpleLineChartProps {
  data: LineData[]
  isDark: boolean
  maxHeight?: number
  showValues?: boolean
  showGrid?: boolean
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  isDark,
  maxHeight = 200,
  showValues = false,
  showGrid = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        style={{ height: maxHeight }}
      >
        No hay datos para mostrar
      </div>
    )
  }

  // Configuración del área del gráfico
  const width = 800
  const height = maxHeight + 40
  const leftPadding = 60
  const rightPadding = 20
  const topPadding = 30
  const bottomPadding = 40
  const chartWidth = width - leftPadding - rightPadding
  const chartHeight = height - topPadding - bottomPadding

  // Calcular valores min/max con padding
  const values = data.map(item => item.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue
  const padding = range * 0.1 // 10% padding
  const adjustedMin = minValue - padding
  const adjustedMax = maxValue + padding
  const adjustedRange = adjustedMax - adjustedMin

  // Función para calcular coordenadas
  const getY = (value: number) => {
    if (adjustedRange === 0) return topPadding + chartHeight / 2
    return topPadding + chartHeight - ((value - adjustedMin) / adjustedRange) * chartHeight
  }

  const getX = (index: number) => {
    if (data.length === 1) return leftPadding + chartWidth / 2
    return leftPadding + (index / (data.length - 1)) * chartWidth
  }

  // Crear puntos para la línea
  const points = data.map((item, index) => ({
    x: getX(index),
    y: getY(item.value),
    value: item.value,
    label: item.label
  }))

  // Crear path para la línea (solo si hay más de un punto)
  const pathData = data.length > 1 
    ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    : ''

  // Crear etiquetas del eje Y
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = adjustedMin + (adjustedRange * i) / 4
    return {
      value,
      y: getY(value),
      label: formatEuro(value)
    }
  })

  return (
    <div className="w-full">
      <div className="relative overflow-x-auto">
        <svg 
          width={width}
          height={height}
          className="overflow-visible min-w-full max-w-none"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines y etiquetas del eje Y */}
          {showGrid && yLabels.map((label, i) => (
            <g key={`y-grid-${i}`}>
              <line
                x1={leftPadding}
                y1={label.y}
                x2={width - rightPadding}
                y2={label.y}
                stroke={isDark ? '#374151' : '#e5e7eb'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={leftPadding - 10}
                y={label.y}
                textAnchor="end"
                dominantBaseline="central"
                className={`text-xs ${isDark ? 'fill-gray-400' : 'fill-gray-600'}`}
              >
                {label.label}
              </text>
            </g>
          ))}

          {/* Línea principal (solo si hay más de un punto) */}
          {data.length > 1 && (
            <path
              d={pathData}
              fill="none"
              stroke={isDark ? '#3b82f6' : '#2563eb'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos */}
          {points.map((point, index) => (
            <g key={index}>
              {/* Punto principal */}
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={isDark ? '#3b82f6' : '#2563eb'}
                stroke={isDark ? '#1f2937' : '#ffffff'}
                strokeWidth="3"
                className="hover:r-8 transition-all cursor-pointer"
              />
              
              {/* Etiqueta del eje X */}
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                className={`text-xs font-medium ${isDark ? 'fill-gray-300' : 'fill-gray-600'}`}
              >
                {point.label}
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
                  {formatEuro(point.value)}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default SimpleLineChart