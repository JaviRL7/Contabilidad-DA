import React from 'react'
import { formatEuro } from '../../utils/formatters'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface SummaryPanelProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  onShowMonthlyBreakdown?: () => void
  onShowYearlyBreakdown?: () => void
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ 
  movimientos, 
  isDark, 
  onShowMonthlyBreakdown,
  onShowYearlyBreakdown
}) => {
  // Obtener movimiento de hoy
  const today = new Date().toISOString().split('T')[0]
  const todayMovimientos = movimientos.find(m => m.fecha === today)

  // Calcular totales del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  const monthlyTotal = monthMovimientos.reduce((sum, m) => sum + m.balance, 0)

  // Calcular totales del año
  const yearMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  const yearlyIngresos = yearMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
  const yearlyGastos = yearMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
  const yearlyTotal = yearlyIngresos - yearlyGastos

  return (
    <div className="mt-6 space-y-6">
      {/* Resumen de hoy */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
        <h3 className={`text-lg font-semibold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Hoy
        </h3>
        <p className={`text-sm mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {new Date().toLocaleDateString('es-ES', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>
        {todayMovimientos ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-500 font-medium">Ingresos:</span>
              <span className="text-lg font-bold text-green-500">
                {formatEuro(todayMovimientos.ingreso_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500 font-medium">Gastos:</span>
              <span className="text-lg font-bold text-red-500">
                {formatEuro(todayMovimientos.total_gastos)}
              </span>
            </div>
            <div className={`my-4 h-px ${
              isDark 
                ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' 
                : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'
            }`}></div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-500">Balance:</span>
              <span className="font-bold text-blue-500">
                {formatEuro(todayMovimientos.balance)}
              </span>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Sin movimientos hoy
          </p>
        )}
      </div>

      {/* Total del mes */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
        <h3 className={`text-lg font-semibold mb-3 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Total del Mes
        </h3>
        <p className={`text-xs mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </p>
        
        <div className="space-y-2">
          {(() => {
            const totalIngresos = monthMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
            const totalGastos = monthMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
            
            return (
              <>
                {/* Ingresos */}
                <div className="flex justify-between items-center py-2 px-3">
                  <span className="text-green-500 font-medium">Ingresos</span>
                  <span className="text-lg font-bold text-green-500">{formatEuro(totalIngresos)}</span>
                </div>
                
                {/* Separador igual al resto de la página */}
                <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                
                {/* Gastos */}
                <div className="flex justify-between items-center py-2 px-3">
                  <span className="text-red-500 font-medium">Gastos</span>
                  <span className="text-lg font-bold text-red-500">{formatEuro(totalGastos)}</span>
                </div>
                
                {/* Línea de resultado */}
                <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                <div className="pt-2 mt-3">
                  <div className="flex justify-between items-center py-2 px-3">
                    <span className="text-blue-500 font-medium">Balance</span>
                    <span className="text-lg font-bold text-blue-500">
                      {formatEuro(monthlyTotal)}
                    </span>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
        
        <div className="mt-4 pt-3">
          <button
            onClick={onShowMonthlyBreakdown}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title="Ver desglose mensual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <path d="M3 10h18"/>
              <path d="M8 14h.01"/>
              <path d="M12 14h.01"/>
              <path d="M16 14h.01"/>
              <path d="M8 18h.01"/>
              <path d="M12 18h.01"/>
            </svg>
            Ver Desglose Mensual
          </button>
        </div>
      </div>

      {/* Total del año */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
        <h3 className={`text-lg font-semibold mb-3 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Total del Año
        </h3>
        <p className={`text-xs mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Año {new Date().getFullYear()}
        </p>
        
        {/* Visual subtraction layout */}
        <div className="space-y-2 mb-4">
          {/* Ingresos */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-green-500 font-medium">
              Ingresos
            </span>
            <span className="text-lg font-bold text-green-500">
              {formatEuro(yearlyIngresos)}
            </span>
          </div>
          
          {/* Separador igual al resto de la página */}
          <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
          
          {/* Gastos */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-red-500 font-medium">
              Gastos
            </span>
            <span className="text-lg font-bold text-red-500">
              {formatEuro(yearlyGastos)}
            </span>
          </div>
          
          {/* Línea de resultado */}
          <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
          <div className="pt-2 mt-3">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-blue-500 font-medium">
                Balance
              </span>
              <span className="text-lg font-bold text-blue-500">
                {formatEuro(yearlyTotal)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3">
          <button
            onClick={onShowYearlyBreakdown}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
            title="Ver desglose anual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
              <path d="M7 11v8"/>
              <path d="M11 7v12"/>
              <path d="M15 3v16"/>
              <path d="M19 8v11"/>
            </svg>
            Ver Desglose Anual
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryPanel