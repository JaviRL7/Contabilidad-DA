import React from 'react'
import Card from '../ui/Card'
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

interface MovementCardProps {
  movimiento: MovimientoDiario
  isDark: boolean
  isToday?: boolean
  tieneGastosRecurrentes?: boolean
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
}

const MovementCard: React.FC<MovementCardProps> = ({
  movimiento,
  isDark,
  isToday = false,
  tieneGastosRecurrentes = false,
  onEditMovimiento,
  onDeleteMovimiento
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
        {/* Header con fecha y balance */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </h2>
            {isToday && (
              <div className={`mt-1 text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                Hoy
              </div>
            )}
          </div>
          <div className="text-lg font-bold ml-auto text-blue-500">
            Balance: {formatEuro(movimiento.balance)}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* Línea separadora vertical con degradado */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
            <div className={`h-full w-full ${
              isDark 
                ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
            }`}></div>
          </div>
          
          {/* Sección de ingresos */}
          <div className="pr-3">
            <div className="mb-3">
              <h3 className="text-green-500 font-medium mb-2">
                Ingresos ({formatEuro(movimiento.ingreso_total)})
              </h3>
              <div className={`h-px w-full ${
                isDark 
                  ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
              }`}></div>
            </div>
            {movimiento.ingresos && movimiento.ingresos.length > 0 ? (
              <ul className="space-y-2">
                {movimiento.ingresos.map((ingreso) => (
                  <li key={ingreso.id} className={`flex justify-between items-center p-2 rounded ${
                    isDark ? 'bg-gray-700' : 'bg-green-50'
                  }`}>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                      {ingreso.etiqueta}
                    </span>
                    <span className="text-green-500 font-medium">
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
          <div className="pl-3">
            <div className="mb-3">
              <h3 className="text-red-500 font-medium mb-2">
                Gastos ({formatEuro(movimiento.total_gastos)})
              </h3>
              <div className={`h-px w-full ${
                isDark 
                  ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
              }`}></div>
            </div>
            {movimiento.gastos && movimiento.gastos.length > 0 ? (
              <ul className="space-y-2">
                {movimiento.gastos.map((gasto) => (
                  <li key={gasto.id} className={`flex justify-between items-center p-2 rounded ${
                    isDark ? 'bg-gray-700' : 'bg-red-50'
                  } ${gasto.es_recurrente ? 'border-l-4 border-yellow-400' : ''}`}>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      {gasto.etiqueta}
                      {gasto.es_recurrente && (
                        <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                          isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Auto
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-red-500">
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
            <div className={`h-px w-full mt-8 mb-4 ${
              isDark 
                ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' 
                : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'
            }`}></div>
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