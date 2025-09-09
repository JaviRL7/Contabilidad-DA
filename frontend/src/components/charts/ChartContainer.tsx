import React from 'react'
import Card from '../ui/Card'

interface ChartContainerProps {
  title: string
  subtitle?: string
  isDark: boolean
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  isDark,
  children,
  actions,
  className = ''
}) => {
  return (
    <Card variant="default" isDark={isDark} className={className}>
      <div className="p-6">
        {/* Header del chart */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Contenido del chart */}
        <div className="relative">
          {children}
        </div>
      </div>
    </Card>
  )
}

export default ChartContainer