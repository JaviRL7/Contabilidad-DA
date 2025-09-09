import React, { useEffect, useState } from 'react'
import GradientButton from '../ui/GradientButton'

interface NotificacionGasto {
  id: string
  etiqueta: string
  monto: number
  fecha: string
  fechaCreacion: string
  mostrada: boolean
}

interface NotificacionGastoAutomaticoProps {
  notificacion: NotificacionGasto
  onCerrar: (id: string) => void
  isDark: boolean
  onVerGastosFijos: () => void
}

const NotificacionGastoAutomatico: React.FC<NotificacionGastoAutomaticoProps> = ({
  notificacion,
  onCerrar,
  isDark,
  onVerGastosFijos
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCerrar = () => {
    setVisible(false)
    setTimeout(() => onCerrar(notificacion.id), 300)
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`max-w-sm rounded-xl shadow-lg border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gasto automático creado
            </h3>
            <button
              onClick={handleCerrar}
              className={`text-xl font-bold p-1 rounded hover:bg-gray-100 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <div className={`mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Se ha creado automáticamente el siguiente gasto:
          </div>

          {/* Detalles del gasto */}
          <div className={`p-3 rounded-lg border mb-4 ${
            isDark 
              ? 'border-gray-600 bg-gray-700' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {notificacion.etiqueta}
            </div>
            <div className="text-lg font-bold text-red-500 mb-1">
              -€{notificacion.monto.toFixed(2)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatearFecha(notificacion.fecha)}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <GradientButton
              variant="secondary"
              size="sm"
              onClick={handleCerrar}
              isDark={isDark}
            >
              Cerrar
            </GradientButton>
            <GradientButton
              variant="primary"
              size="sm"
              onClick={() => {
                onVerGastosFijos()
                handleCerrar()
              }}
              isDark={isDark}
            >
              Ver gastos fijos
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificacionGastoAutomatico