import React from 'react'
import GradientButton from '../ui/GradientButton'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string
}

interface ConfirmacionBorradoModalProps {
  isOpen: boolean
  onClose: () => void
  gasto: GastoRecurrente | null
  onConfirmarBorrado: () => void
  isDark: boolean
}

const ConfirmacionBorradoModal: React.FC<ConfirmacionBorradoModalProps> = ({
  isOpen,
  onClose,
  gasto,
  onConfirmarBorrado,
  isDark
}) => {
  if (!isOpen || !gasto) return null

  const getFrecuenciaText = (gasto: GastoRecurrente) => {
    switch (gasto.frecuencia) {
      case 'mensual':
        return `mensual (día ${gasto.diaMes})`
      case 'semanal':
        return `semanal (${gasto.diaSemana})`
      case 'anual':
        if (gasto.fechaAnual) {
          const [mes, dia] = gasto.fechaAnual.split('-')
          const fecha = new Date(2024, parseInt(mes) - 1, parseInt(dia))
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' })
          return `anual (${parseInt(dia)} de ${nombreMes})`
        }
        return 'anual'
      default:
        return gasto.frecuencia
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-lg max-w-md w-full ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Confirmar eliminación
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            ¿Estás seguro de que deseas eliminar este gasto recurrente?
          </div>

          {/* Detalles del gasto */}
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? 'border-gray-600 bg-gray-700' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {gasto.etiqueta}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getFrecuenciaText(gasto)} • €{gasto.monto.toFixed(2)}
            </div>
          </div>

          <div className={`text-sm mt-4 p-3 rounded ${
            isDark 
              ? 'bg-yellow-900 text-yellow-200 border border-yellow-700' 
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            <strong>Importante:</strong> Esta acción no se puede deshacer. El gasto recurrente será eliminado permanentemente y no se generarán más movimientos automáticos.
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex gap-3 justify-end">
            <GradientButton
              variant="secondary"
              onClick={onClose}
              isDark={isDark}
            >
              Cancelar
            </GradientButton>
            <GradientButton
              variant="danger"
              onClick={() => {
                onConfirmarBorrado()
                onClose()
              }}
              isDark={isDark}
            >
              Eliminar Definitivamente
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmacionBorradoModal