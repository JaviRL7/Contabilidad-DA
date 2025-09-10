import React from 'react'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface WeeklyIncomeChartProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
}

const WeeklyIncomeChart: React.FC<WeeklyIncomeChartProps> = ({
  movimientos,
  isDark
}) => {
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  // Calcular media de ingresos por día de la semana
  const ingresosPorDia = Array(7).fill(0).map(() => ({ total: 0, count: 0 }))
  
  movimientos.forEach(movimiento => {
    const fecha = new Date(movimiento.fecha)
    const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
    ingresosPorDia[diaSemana].total += movimiento.ingreso_total || 0
    ingresosPorDia[diaSemana].count += 1
  })
  
  // Calcular medias
  const medias = ingresosPorDia.map(dia => 
    dia.count > 0 ? dia.total / dia.count : 0
  )
  
  const maxMedia = Math.max(...medias)
  
  return (
    <div className="bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 text-center text-white">
        Media de Ingresos por Día
      </h3>
      
      <div className="space-y-3">
        {diasSemana.map((dia, index) => {
          const media = medias[index]
          const percentage = maxMedia > 0 ? (media / maxMedia) * 100 : 0
          
          return (
            <div key={dia} className="flex items-center gap-3">
              <div className="w-8 text-xs text-gray-400 font-medium">
                {dia}
              </div>
              
              <div className="flex-1 relative">
                <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {media.toFixed(0)}€
                  </span>
                </div>
              </div>
              
              <div className="w-12 text-xs text-right">
                <div className="text-gray-300">
                  {ingresosPorDia[index].count} días
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {maxMedia === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No hay datos suficientes para mostrar la gráfica
        </div>
      )}
    </div>
  )
}

export default WeeklyIncomeChart