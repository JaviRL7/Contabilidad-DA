import React from 'react'
import { X, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react'
import { formatEuro } from '../../utils/formatters'

interface TagStatsData {
  etiqueta: string
  tipo: 'gasto' | 'ingreso'
  totalMovimientos: number
  montoTotal: number
  promedioMensual: number
  ultimoMovimiento: string
  porcentajeDelTotal: number
  movimientosPorMes: { mes: string, cantidad: number, monto: number }[]
}

interface TagStatsModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  data: TagStatsData | null
}

const TagStatsModal: React.FC<TagStatsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  data
}) => {
  if (!isOpen || !data) return null

  const { etiqueta, tipo, totalMovimientos, montoTotal, promedioMensual, ultimoMovimiento, porcentajeDelTotal, movimientosPorMes } = data

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
        isDark 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Estadísticas de Etiqueta
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                tipo === 'ingreso'
                  ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                  : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {tipo.toUpperCase()}
              </span>
              <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {etiqueta}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Movimientos
                </span>
              </div>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalMovimientos}
              </span>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {tipo === 'ingreso' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total
                </span>
              </div>
              <span className={`text-xl font-bold ${
                tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatEuro(montoTotal)}
              </span>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <PieChart className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Promedio
                </span>
              </div>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatEuro(promedioMensual)}
                <span className={`text-xs font-normal ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  /mes
                </span>
              </span>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  % del Total
                </span>
              </div>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {porcentajeDelTotal.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Último movimiento */}
          <div className={`p-4 rounded-lg mb-6 ${
            isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              Último Movimiento
            </h3>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
              {ultimoMovimiento ? new Date(ultimoMovimiento).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : 'Sin movimientos recientes'}
            </p>
          </div>

          {/* Movimientos por mes */}
          {movimientosPorMes.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Actividad por Mes
              </h3>
              <div className="space-y-3">
                {movimientosPorMes.slice(0, 6).map((mes, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {mes.mes}
                      </span>
                      <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ({mes.cantidad} movimiento{mes.cantidad !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className={`font-semibold ${
                      tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatEuro(mes.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end p-6 border-t ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagStatsModal