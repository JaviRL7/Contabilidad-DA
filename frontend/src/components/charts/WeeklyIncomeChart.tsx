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
    <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-green-600/20' : 'bg-green-100'
        }`}>
          <svg className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Media de Ingresos por Día
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Distribución semanal de tus ingresos
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {diasSemana.map((dia, index) => {
          const media = medias[index]
          const percentage = maxMedia > 0 ? (media / maxMedia) * 100 : 0
          
          return (
            <div key={dia} className={`p-3 rounded-lg transition-all duration-200 ${
              isDark ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 text-sm font-semibold text-center ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {dia}
                </div>
                
                <div className="flex-1 relative">
                  <div className={`h-8 rounded-lg overflow-hidden ${
                    isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out rounded-lg"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${
                      percentage > 50 ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {media.toFixed(0)}€
                    </span>
                  </div>
                </div>
                
                <div className={`w-16 text-xs text-right ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="font-medium">
                    {ingresosPorDia[index].count}
                  </div>
                  <div className="text-xs opacity-75">
                    días
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {maxMedia === 0 && (
        <div className={`text-center py-8 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <svg className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="font-medium mb-1">No hay datos suficientes</div>
          <div className="text-xs opacity-75">Agrega algunos movimientos para ver la gráfica</div>
        </div>
      )}
    </div>
  )
}

export default WeeklyIncomeChart