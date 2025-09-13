import React from 'react'
import Card from '../ui/Card'
import { formatEuro } from '../../utils/formatters'

// Helper function to handle deleted tags
const getEtiquetaDisplay = (etiqueta: string, availableTags: string[]): string => {
  if (!etiqueta || !availableTags.includes(etiqueta)) {
    return 'Sin etiquetas'
  }
  return etiqueta
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface MovementCardProps {
  movimiento: MovimientoDiario
  isDark: boolean
  isToday?: boolean
  tieneGastosRecurrentes?: boolean
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
  etiquetas?: { ingresos: string[], gastos: string[] }
}

const MovementCard: React.FC<MovementCardProps> = ({
  movimiento,
  isDark,
  isToday = false,
  tieneGastosRecurrentes = false,
  onEditMovimiento,
  onDeleteMovimiento,
  etiquetas
}) => {

  return (
    <Card variant="default" isDark={isDark} className={`${
      tieneGastosRecurrentes
        ? isDark 
          ? 'border-2 border-yellow-300/40 shadow-yellow-300/10' 
          : 'border-2 border-yellow-400/50 shadow-yellow-400/10'
        : isToday 
          ? isDark 
            ? 'ring-2 ring-blue-500/30 shadow-blue-500/20' 
            : 'ring-2 ring-blue-400/30 shadow-blue-400/20'
          : ''
    }`}>
      <div className="p-6">
        {/* Header con fecha y balance mejorado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                  day: '2-digit',
                  month: '2-digit'
                })}
              </h2>
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'}`}>
                {new Date(movimiento.fecha).toLocaleDateString('es-ES', { year: 'numeric' })}
              </div>
              {isToday && (
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'text-blue-200 bg-blue-800' : 'text-blue-700 bg-blue-100'}`}>
                  HOY
                </div>
              )}
            </div>
            {tieneGastosRecurrentes && (
              <div className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-yellow-300' : 'bg-yellow-500'}`}></div>
                Contiene gastos automáticos
              </div>
            )}
          </div>
          <div className={`text-right`}>
            <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              Balance Total
            </div>
            <div className={`text-2xl font-bold text-blue-500`}>
              {formatEuro(movimiento.balance)}
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* Línea separadora vertical con degradado - más corta */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px transform -translate-x-1/2">
            <div className={`h-full w-full ${
              isDark 
                ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
            }`}></div>
          </div>
          
          {/* Sección de ingresos */}
          <div className="pr-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-green-500 font-semibold text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Ingresos
                </h3>
                <div className="text-green-600 font-bold text-lg">
                  {formatEuro(movimiento.ingreso_total)}
                </div>
              </div>
              <div className={`h-px w-full ${
                isDark 
                  ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
              }`}></div>
            </div>
            {movimiento.ingresos && movimiento.ingresos.length > 0 ? (
              <ul className="space-y-2">
                {movimiento.ingresos.map((ingreso) => (
                  <li key={ingreso.id} className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                    isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-green-50 hover:bg-green-100'
                  }`}>
                    <span className={`font-medium ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {getEtiquetaDisplay(ingreso.etiqueta, etiquetas?.ingresos || [])}
                    </span>
                    <span className="text-green-600 font-bold text-base">
                      +{formatEuro(ingreso.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sin ingresos</p>
            )}
          </div>
          
          {/* Sección de gastos */}
          <div className="pl-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-red-500 font-semibold text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Gastos
                </h3>
                <div className="text-red-600 font-bold text-lg">
                  {formatEuro(movimiento.total_gastos)}
                </div>
              </div>
              <div className={`h-px w-full ${
                isDark 
                  ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
              }`}></div>
            </div>
            {movimiento.gastos && movimiento.gastos.length > 0 ? (
              <ul className="space-y-2">
                {movimiento.gastos.map((gasto) => (
                  <li key={gasto.id} className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                    isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-red-50 hover:bg-red-100'
                  } ${gasto.es_recurrente ? 'border-l-4 border-yellow-400 bg-gradient-to-r ' + (isDark ? 'from-yellow-900/20 to-transparent' : 'from-yellow-50 to-transparent') : ''}`}>
                    <div className="flex flex-col">
                      <span className={`font-medium ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {getEtiquetaDisplay(gasto.etiqueta, etiquetas?.gastos || [])}
                      </span>
                      {gasto.es_recurrente && (
                        <span className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                          isDark ? 'text-yellow-300' : 'text-yellow-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-yellow-300' : 'bg-yellow-500'}`}></div>
                          Gasto automático
                        </span>
                      )}
                    </div>
                    <span className="text-red-600 font-bold text-base">
                      {formatEuro(gasto.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sin gastos</p>
            )}
          </div>
        </div>

        {/* Botones de acción en la parte inferior */}
        {(onEditMovimiento || onDeleteMovimiento) && (
          <>
            <div className="mt-8 mb-4"></div>
            <div className="flex gap-3 justify-end">
              {onEditMovimiento && (
                <button
                  onClick={() => onEditMovimiento(movimiento)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white shadow-md'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              )}
              
              {onDeleteMovimiento && (
                <button
                  onClick={() => onDeleteMovimiento(movimiento)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    isDark
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-md'
                      : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-400 hover:to-red-300 text-white shadow-md'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default MovementCard