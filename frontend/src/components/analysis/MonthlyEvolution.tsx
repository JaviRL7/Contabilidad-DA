import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../ui/Card'

interface EvolucionMensual {
  mes: number
  año: number
  ingresos: number
  gastos: number
  balance: number
  mesNombre: string
}

interface MonthlyEvolutionProps {
  data: EvolucionMensual[]
  isDark: boolean
  title?: string
}

const MonthlyEvolution: React.FC<MonthlyEvolutionProps> = ({ 
  data, 
  isDark, 
  title = "Evolución Mensual" 
}) => {
  if (data.length === 0) {
    return (
      <Card isDark={isDark} variant="analysis">
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h3>
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No hay datos suficientes para mostrar la evolución mensual
        </div>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    mes: item.mesNombre,
    Ingresos: item.ingresos,
    Gastos: item.gastos,
    Balance: item.balance
  }))

  return (
    <Card isDark={isDark} variant="analysis">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {title}
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="mes" 
              stroke={isDark ? '#9ca3af' : '#6b7280'}
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={isDark ? '#9ca3af' : '#6b7280'}
              fontSize={12}
              tickFormatter={(value) => `${value.toFixed(0)}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                borderRadius: '6px',
                color: isDark ? '#ffffff' : '#000000'
              }}
              formatter={(value: any) => [`${value.toFixed(2)}€`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Ingresos" 
              stroke={isDark ? '#10b981' : '#059669'} 
              strokeWidth={2}
              dot={{ fill: isDark ? '#10b981' : '#059669' }}
            />
            <Line 
              type="monotone" 
              dataKey="Gastos" 
              stroke={isDark ? '#ef4444' : '#dc2626'} 
              strokeWidth={2}
              dot={{ fill: isDark ? '#ef4444' : '#dc2626' }}
            />
            <Line 
              type="monotone" 
              dataKey="Balance" 
              stroke={isDark ? '#3b82f6' : '#2563eb'} 
              strokeWidth={3}
              dot={{ fill: isDark ? '#3b82f6' : '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Mostrando evolución de {data.length} meses
      </div>
    </Card>
  )
}

export default MonthlyEvolution