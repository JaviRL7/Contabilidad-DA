import React from 'react'

interface MonthlyBreakdownProps {
  movimientos: any[]
  onBack: () => void
  isDark: boolean
  onUpdateMovimiento?: (movimiento: any) => Promise<void>
  onDeleteMovimiento?: (movimiento: any) => void
  onDeleteItem?: (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => Promise<void>
  setDeleteAction?: (action: (() => void) | null) => void
  setShowDeleteModal?: (show: boolean) => void
  initialMonth?: number
  initialYear?: number
  etiquetas?: {
    ingresos: string[]
    gastos: string[]
  }
}

const MonthlyBreakdown: React.FC<MonthlyBreakdownProps> = ({ 
  movimientos, 
  onBack, 
  isDark 
}) => {
  console.log('MonthlyBreakdown rendering - Temporary version')
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDark 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border transition-colors`}
          >
            ← Volver
          </button>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Desglose Mensual - {monthName}
          </h1>
          <div />
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
          }`}>
            <div className="text-2xl font-bold text-green-500 mb-1">
              {monthlyMovimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0).toFixed(2)} €
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Ingresos
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-2xl font-bold text-red-500 mb-1">
              {monthlyMovimientos.reduce((sum, mov) => sum + mov.total_gastos, 0).toFixed(2)} €
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Gastos
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0) >= 0
              ? (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')
              : (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
          }`}>
            <div className={`text-2xl font-bold mb-1 ${
              monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0).toFixed(2)} €
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Balance
            </div>
          </div>
        </div>

        {/* Lista de movimientos */}
        <div className="space-y-4">
          {monthlyMovimientos.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay movimientos para este mes
            </div>
          ) : (
            monthlyMovimientos.map((movimiento) => (
              <div key={movimiento.id} className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(movimiento.fecha).toLocaleDateString('es-ES')}
                  </h3>
                  <div className={`text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className="text-green-500 font-medium">
                      +{movimiento.ingreso_total.toFixed(2)} €
                    </div>
                    <div className="text-red-500 font-medium">
                      -{movimiento.total_gastos.toFixed(2)} €
                    </div>
                    <div className={`font-bold ${
                      movimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {movimiento.balance >= 0 ? '+' : ''}{movimiento.balance.toFixed(2)} €
                    </div>
                  </div>
                </div>
                
                {/* Ingresos */}
                {movimiento.ingresos.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ingresos:
                    </h4>
                    <div className="space-y-1">
                      {movimiento.ingresos.map((ingreso: any) => (
                        <div key={ingreso.id} className="flex justify-between text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {ingreso.etiqueta}
                          </span>
                          <span className="text-green-500 font-medium">
                            +{ingreso.monto.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Gastos */}
                {movimiento.gastos.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Gastos:
                    </h4>
                    <div className="space-y-1">
                      {movimiento.gastos.map((gasto: any) => (
                        <div key={gasto.id} className="flex justify-between text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {gasto.etiqueta}
                          </span>
                          <span className="text-red-500 font-medium">
                            -{gasto.monto.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MonthlyBreakdown