import React from 'react'
import GradientButton from '../ui/GradientButton'
import { formatEuro } from '../../utils/formatters'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string
}

interface GastoPendiente {
  gastoRecurrente: GastoRecurrente
  fechaEsperada: string
  diasRetraso: number
}

interface RecurrentesPendientesModalProps {
  isOpen: boolean
  onClose: () => void
  gastosPendientes: GastoPendiente[]
  onConfirmarGasto: (gasto: GastoPendiente) => void
  onRechazarGasto: (gasto: GastoPendiente) => void
  onConfirmarTodos: () => void
  onRechazarTodos: () => void
  isDark: boolean
}

const RecurrentesPendientesModal: React.FC<RecurrentesPendientesModalProps> = ({
  isOpen,
  onClose,
  gastosPendientes,
  onConfirmarGasto,
  onRechazarGasto,
  onConfirmarTodos,
  onRechazarTodos,
  isDark
}) => {
  if (!isOpen || gastosPendientes.length === 0) return null

  const formatFecha = (fechaString: string) => {
    const fecha = new Date(fechaString + 'T00:00:00')
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTipoRetraso = (dias: number) => {
    if (dias === 0) return 'hoy'
    if (dias === 1) return 'ayer'
    if (dias <= 7) return `hace ${dias} días`
    if (dias <= 30) return `hace ${Math.floor(dias / 7)} semanas`
    return `hace ${Math.floor(dias / 30)} meses`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gastos Recurrentes Pendientes
            </h2>
            <button
              onClick={onClose}
              className={`text-2xl font-bold ${
                isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ×
            </button>
          </div>
          <p className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Se detectaron gastos recurrentes que deberían haberse creado. ¿Deseas agregarlos?
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {gastosPendientes.map((gasto, index) => (
              <div 
                key={`${gasto.fechaEsperada}-${gasto.gastoRecurrente.etiqueta}`}
                className={`p-4 rounded-lg border ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {gasto.gastoRecurrente.etiqueta}
                      </h3>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        isDark 
                          ? 'bg-blue-800 text-blue-200' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {gasto.gastoRecurrente.frecuencia}
                      </span>
                    </div>
                    
                    <div className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Fecha esperada:</strong> {formatFecha(gasto.fechaEsperada)}
                    </div>
                    
                    <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Pendiente desde:</strong> {getTipoRetraso(gasto.diasRetraso)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-500">
                      -{formatEuro(gasto.gastoRecurrente.monto)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <GradientButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onRechazarGasto(gasto)}
                    isDark={isDark}
                  >
                    Rechazar
                  </GradientButton>
                  <GradientButton
                    variant="primary"
                    size="sm"
                    onClick={() => onConfirmarGasto(gasto)}
                    isDark={isDark}
                  >
                    Crear Movimiento
                  </GradientButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex gap-3 justify-end">
            <GradientButton
              variant="secondary"
              onClick={onRechazarTodos}
              isDark={isDark}
            >
              Rechazar Todos ({gastosPendientes.length})
            </GradientButton>
            <GradientButton
              variant="primary"
              onClick={onConfirmarTodos}
              isDark={isDark}
            >
              Crear Todos ({gastosPendientes.length})
            </GradientButton>
          </div>
          
          <div className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Información:</strong> Los gastos recurrentes se crearán automáticamente en las fechas correspondientes
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecurrentesPendientesModal