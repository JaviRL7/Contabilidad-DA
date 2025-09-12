import React from 'react'

interface BreakdownStatsProps {
  totalIngresos: number
  totalGastos: number
  balance: number
  isDark: boolean
  period?: string
  onGoToCurrentMonth?: () => void
}

const BreakdownStats: React.FC<BreakdownStatsProps> = ({
  totalIngresos,
  totalGastos: _totalGastos,
  balance,
  isDark,
  period,
  onGoToCurrentMonth
}) => {
  const balancePercentage = totalIngresos > 0 ? ((balance / totalIngresos) * 100) : 0

  return (
    <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Resumen {period || 'Anual'}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Balance: <span className="font-medium text-blue-500">{balancePercentage.toFixed(1)}%</span>
            {balancePercentage >= 0 ? ' positivo' : ' negativo'}
          </p>
        </div>
        {onGoToCurrentMonth && (
          <button
            onClick={onGoToCurrentMonth}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Ir al mes actual
          </button>
        )}
      </div>
    </div>
  )
}

export default BreakdownStats