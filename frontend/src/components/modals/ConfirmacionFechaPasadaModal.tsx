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

interface ConfirmacionFechaPasadaModalProps {
  isOpen: boolean
  onClose: () => void
  gasto: GastoRecurrente | null
  fechaCalculada: string
  onConfirmar: () => void
  onRechazar: () => void
  isDark: boolean
}

const ConfirmacionFechaPasadaModal: React.FC<ConfirmacionFechaPasadaModalProps> = ({
  isOpen,
  onClose,
  gasto,
  fechaCalculada,
  onConfirmar,
  onRechazar,
  isDark
}) => {
  if (!isOpen || !gasto) return null

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl max-w-md w-full ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-5 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Confirmar creación de gasto
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Has creado un gasto fijo con fecha en el pasado de este mes:
          </div>

          {/* Detalles del gasto */}
          <div className={`p-4 rounded-lg border mb-4 ${
            isDark 
              ? 'border-gray-600 bg-gray-700' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {gasto.etiqueta}
            </div>
            <div className="text-2xl font-bold text-red-500 mb-2">
              -€{gasto.monto.toFixed(2)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <strong>Fecha programada:</strong> {formatearFecha(fechaCalculada)}
            </div>
          </div>

          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            ¿Quieres crear el movimiento correspondiente a este mes para esa fecha?
          </div>

          <div className={`text-xs mt-3 p-3 rounded ${
            isDark 
              ? 'bg-blue-900/30 text-blue-200' 
              : 'bg-blue-50 text-blue-800'
          }`}>
            <strong>Nota:</strong> A partir del próximo mes, este gasto se generará automáticamente.
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex gap-3 justify-end">
            <GradientButton
              variant="secondary"
              onClick={() => {
                onRechazar()
                onClose()
              }}
              isDark={isDark}
            >
              No crear este mes
            </GradientButton>
            <GradientButton
              variant="primary"
              onClick={() => {
                onConfirmar()
                onClose()
              }}
              isDark={isDark}
            >
              Crear movimiento
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmacionFechaPasadaModal