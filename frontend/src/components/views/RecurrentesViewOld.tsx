import React, { useState, useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import ConfirmacionBorradoModal from '../modals/ConfirmacionBorradoModal'
import ConfirmacionFechaPasadaModal from '../modals/ConfirmacionFechaPasadaModal'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string // Format: 'MM-DD' (e.g., '03-15' for March 15)
  fechaCreacion?: string // Fecha de creación del gasto recurrente
}

interface ProximoGasto {
  gasto: GastoRecurrente
  proximaFecha: Date
  diasRestantes: number
  progreso: number
}

interface RechazosGastos {
  obtenerRechazosDeGasto: (etiqueta: string) => any[]
  limpiarRechazosDeGasto: (etiqueta: string) => void
}

interface RecurrentesViewProps {
  isDark: boolean
  gastosRecurrentes: GastoRecurrente[]
  onAddGastoRecurrente: (gasto: GastoRecurrente) => void
  onUpdateGastoRecurrente: (index: number, gasto: GastoRecurrente) => void
  onRemoveGastoRecurrente: (index: number) => void
  rechazosGastos: RechazosGastos
  notificacionesGastos?: {
    obtenerNotificacionesRecientes: () => any[]
  }
}

const RecurrentesView: React.FC<RecurrentesViewProps> = ({
  isDark,
  gastosRecurrentes,
  onAddGastoRecurrente,
  onUpdateGastoRecurrente,
  onRemoveGastoRecurrente,
  rechazosGastos,
  notificacionesGastos
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [gastoAEliminar, setGastoAEliminar] = useState<{ gasto: GastoRecurrente, index: number } | null>(null)
  const [showConfirmacionFechaPasada, setShowConfirmacionFechaPasada] = useState(false)
  const [gastoFechaPasada, setGastoFechaPasada] = useState<{ gasto: GastoRecurrente, fecha: string } | null>(null)
  const [formData, setFormData] = useState<GastoRecurrente>({
    etiqueta: '',
    monto: 0,
    frecuencia: 'mensual',
    diaMes: 1,
    diaSemana: 'lunes',
    fechaAnual: '01-01'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.etiqueta || formData.monto <= 0) {
      alert('Por favor, completa todos los campos')
      return
    }

    if (editingIndex !== null) {
      // Si estamos editando, no verificamos fecha pasada
      onUpdateGastoRecurrente(editingIndex, formData)
      resetearFormulario()
    } else {
      // Si estamos creando un nuevo gasto, verificamos si es fecha pasada del mes actual
      const { fecha, esFechaPasada } = calcularFechaGasto(formData)
      
      if (esFechaPasada) {
        // Mostrar modal de confirmación para fecha pasada
        setGastoFechaPasada({
          gasto: formData,
          fecha: fecha.toISOString().split('T')[0]
        })
        setShowConfirmacionFechaPasada(true)
      } else {
        // Crear gasto normalmente
        onAddGastoRecurrente(formData)
        resetearFormulario()
      }
    }
  }

  const handleEdit = (index: number) => {
    setFormData(gastosRecurrentes[index])
    setEditingIndex(index)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingIndex(null)
    setFormData({
      etiqueta: '',
      monto: 0,
      frecuencia: 'mensual',
      diaMes: 1,
      diaSemana: 'lunes',
      fechaAnual: '01-01'
    })
  }

  const handleConfirmarEliminar = (index: number) => {
    const gasto = gastosRecurrentes[index]
    setGastoAEliminar({ gasto, index })
  }

  const handleEliminarGasto = () => {
    if (gastoAEliminar) {
      // Limpiar rechazos del gasto antes de eliminarlo
      rechazosGastos.limpiarRechazosDeGasto(gastoAEliminar.gasto.etiqueta)
      onRemoveGastoRecurrente(gastoAEliminar.index)
      setGastoAEliminar(null)
    }
  }

  // Función para verificar si un gasto tiene rechazos
  const tieneRechazos = (etiqueta: string): boolean => {
    return rechazosGastos.obtenerRechazosDeGasto(etiqueta).length > 0
  }

  // Función para obtener el último rechazo de un gasto
  const obtenerUltimoRechazo = (etiqueta: string) => {
    const rechazos = rechazosGastos.obtenerRechazosDeGasto(etiqueta)
    if (rechazos.length > 0) {
      return rechazos[rechazos.length - 1]
    }
    return null
  }

  // Función para calcular la fecha del gasto según la frecuencia
  const calcularFechaGasto = (gasto: GastoRecurrente): { fecha: Date, esFechaPasada: boolean } => {
    const hoy = new Date()
    const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

    switch (gasto.frecuencia) {
      case 'mensual':
        if (gasto.diaMes) {
          const fechaGasto = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.diaMes)
          const esFechaPasada = fechaGasto >= primerDiaMesActual && fechaGasto < hoy
          return { fecha: fechaGasto, esFechaPasada }
        }
        break
      
      case 'semanal':
        // Para gastos semanales, verificamos si hay alguna ocurrencia en el mes actual que ya pasó
        if (gasto.diaSemana) {
          const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
          const targetDay = dias.indexOf(gasto.diaSemana.toLowerCase())
          
          // Buscar la primera ocurrencia del día de la semana en el mes actual
          const fechaGasto = new Date(primerDiaMesActual)
          while (fechaGasto.getDay() !== targetDay && fechaGasto <= ultimoDiaMesActual) {
            fechaGasto.setDate(fechaGasto.getDate() + 1)
          }
          
          const esFechaPasada = fechaGasto <= hoy && fechaGasto >= primerDiaMesActual
          return { fecha: fechaGasto, esFechaPasada }
        }
        break
      
      case 'anual':
        if (gasto.fechaAnual) {
          const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
          const fechaGasto = new Date(hoy.getFullYear(), mes - 1, dia)
          
          // Solo considerar fecha pasada si es en el mes actual
          const esFechaPasada = fechaGasto.getMonth() === hoy.getMonth() && 
                               fechaGasto.getFullYear() === hoy.getFullYear() && 
                               fechaGasto < hoy
          return { fecha: fechaGasto, esFechaPasada }
        }
        break
    }

    return { fecha: new Date(), esFechaPasada: false }
  }

  // Función para confirmar gasto con fecha pasada
  const confirmarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      // Agregar el gasto y crear el movimiento para la fecha pasada
      onAddGastoRecurrente(gastoFechaPasada.gasto)
      
      // Aquí se debería crear el movimiento para la fecha pasada
      // Por ahora solo agregamos el gasto recurrente
      
      // Resetear formulario y cerrar modales
      resetearFormulario()
      setGastoFechaPasada(null)
      setShowConfirmacionFechaPasada(false)
    }
  }

  // Función para rechazar gasto con fecha pasada
  const rechazarGastoFechaPasada = () => {
    if (gastoFechaPasada) {
      // Solo agregar el gasto recurrente sin crear el movimiento del mes actual
      onAddGastoRecurrente(gastoFechaPasada.gasto)
      
      // Resetear formulario y cerrar modales
      resetearFormulario()
      setGastoFechaPasada(null)
      setShowConfirmacionFechaPasada(false)
    }
  }

  // Función para resetear el formulario
  const resetearFormulario = () => {
    setFormData({
      etiqueta: '',
      monto: 0,
      frecuencia: 'mensual',
      diaMes: 1,
      diaSemana: 'lunes',
      fechaAnual: '01-01'
    })
    setShowAddForm(false)
    setEditingIndex(null)
  }

  const getFrecuenciaText = (gasto: GastoRecurrente) => {
    switch (gasto.frecuencia) {
      case 'mensual':
        return `Mensual (día ${gasto.diaMes})`
      case 'semanal':
        return `Semanal (${gasto.diaSemana})`
      case 'anual':
        if (gasto.fechaAnual) {
          const [mes, dia] = gasto.fechaAnual.split('-')
          const fecha = new Date(2024, parseInt(mes) - 1, parseInt(dia))
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' })
          return `Anual (${parseInt(dia)} de ${nombreMes})`
        }
        return 'Anual'
      default:
        return gasto.frecuencia
    }
  }

  const totalMensual = gastosRecurrentes.reduce((total, gasto) => {
    switch (gasto.frecuencia) {
      case 'semanal':
        return total + (gasto.monto * 4.33) // Aproximación: 4.33 semanas por mes
      case 'mensual':
        return total + gasto.monto
      case 'anual':
        return total + (gasto.monto / 12)
      default:
        return total
    }
  }, 0)

  // Función para calcular próximos gastos
  const calcularProximosGastos = (): ProximoGasto[] => {
    const hoy = new Date()
    const proximosGastos: ProximoGasto[] = []

    gastosRecurrentes.forEach(gasto => {
      let proximaFecha: Date
      let diasCiclo: number

      switch (gasto.frecuencia) {
        case 'mensual':
          if (gasto.diaMes) {
            proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.diaMes)
            if (proximaFecha <= hoy) {
              proximaFecha.setMonth(proximaFecha.getMonth() + 1)
            }
            diasCiclo = 30 // Aproximación
          } else {
            return
          }
          break

        case 'semanal':
          if (gasto.diaSemana) {
            const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
            const targetDay = dias.indexOf(gasto.diaSemana.toLowerCase())
            const currentDay = hoy.getDay()
            
            let daysUntilTarget = targetDay - currentDay
            if (daysUntilTarget <= 0) daysUntilTarget += 7

            proximaFecha = new Date(hoy)
            proximaFecha.setDate(hoy.getDate() + daysUntilTarget)
            diasCiclo = 7
          } else {
            return
          }
          break

        case 'anual':
          if (gasto.fechaAnual) {
            const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
            proximaFecha = new Date(hoy.getFullYear(), mes - 1, dia)
            if (proximaFecha <= hoy) {
              proximaFecha.setFullYear(proximaFecha.getFullYear() + 1)
            }
            diasCiclo = 365
          } else {
            return
          }
          break

        default:
          return
      }

      const diasRestantes = Math.ceil((proximaFecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      const progreso = Math.max(0, Math.min(100, ((diasCiclo - diasRestantes) / diasCiclo) * 100))

      proximosGastos.push({
        gasto,
        proximaFecha,
        diasRestantes,
        progreso
      })
    })

    return proximosGastos.sort((a, b) => a.diasRestantes - b.diasRestantes)
  }

  const proximosGastos = calcularProximosGastos()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header con estadísticas */}
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gastos Recurrentes
          </h2>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setShowAddForm(true)}
            isDark={isDark}
          >
            + Agregar Gasto Recurrente
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-base font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gastos Recurrentes
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {gastosRecurrentes.length}
            </div>
          </div>
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-base font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Estimación Mensual
            </div>
            <div className={`text-3xl font-bold text-red-500`}>
              -€{totalMensual.toFixed(2)}
            </div>
          </div>
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-base font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Estimación Anual
            </div>
            <div className={`text-3xl font-bold text-red-600`}>
              -€{(totalMensual * 12).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Próximos Gastos */}
      {proximosGastos.length > 0 && (
        <Card isDark={isDark}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Próximos Gastos
            </h3>
            <span className={`text-base px-4 py-2 rounded-full font-medium ${
              isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
            }`}>
              {proximosGastos.length} próximos
            </span>
          </div>
          
          <div className="grid gap-4">
            {proximosGastos.slice(0, 3).map((proximo, index) => (
              <div 
                key={`${proximo.gasto.etiqueta}-${index}`}
                className={`p-7 rounded-xl border transition-all duration-200 ${
                  proximo.diasRestantes <= 3 
                    ? isDark 
                      ? 'border-red-600 bg-red-900/20 shadow-red-500/20' 
                      : 'border-red-300 bg-red-50 shadow-red-200/50'
                    : proximo.diasRestantes <= 7 
                      ? isDark 
                        ? 'border-yellow-600 bg-yellow-900/20' 
                        : 'border-yellow-300 bg-yellow-50'
                      : isDark 
                        ? 'border-gray-600 bg-gray-700/30' 
                        : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {proximo.gasto.etiqueta}
                      </h4>
                      {proximo.diasRestantes <= 3 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-500 font-medium text-base">Urgente</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Fecha:
                        </span>
                        <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {proximo.proximaFecha.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                      <div>
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tiempo:
                        </span>
                        <div className={`font-medium ${
                          proximo.diasRestantes === 0 ? 'text-red-500' :
                          proximo.diasRestantes === 1 ? 'text-orange-500' :
                          proximo.diasRestantes <= 3 ? 'text-red-500' :
                          proximo.diasRestantes <= 7 ? 'text-yellow-500' :
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {proximo.diasRestantes === 0 ? 'Hoy' : 
                           proximo.diasRestantes === 1 ? 'Mañana' : 
                           `En ${proximo.diasRestantes} días`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-red-500 mb-1">
                      -€{proximo.gasto.monto.toFixed(2)}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {Math.round(proximo.progreso)}% del ciclo
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {proximosGastos.length > 3 && (
            <div className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <button className={`text-sm hover:underline ${
                isDark ? 'hover:text-gray-300' : 'hover:text-gray-800'
              }`}>
                Ver {proximosGastos.length - 3} gastos más
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Historial de gastos generados automáticamente */}
      {notificacionesGastos && (
        <Card isDark={isDark}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gastos Generados Automáticamente
            </h3>
            <span className={`text-base px-4 py-2 rounded-full font-medium ${
              isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
            }`}>
              Últimos 30 días
            </span>
          </div>

          {(() => {
            const gastosGenerados = notificacionesGastos.obtenerNotificacionesRecientes()
            
            if (gastosGenerados.length === 0) {
              return (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="text-lg font-medium mb-2">Sin gastos generados automáticamente</div>
                  <div className="text-base">
                    Los gastos creados automáticamente aparecerán aquí cuando se generen
                  </div>
                </div>
              )
            }

            return (
              <div className="space-y-4">
                {gastosGenerados.slice(0, 5).map((gasto: any, index: number) => (
                  <div 
                    key={`${gasto.id}-${index}`}
                    className={`p-5 rounded-lg border ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700/30' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {gasto.etiqueta}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                          }`}>
                            Automático
                          </span>
                        </div>
                        
                        <div className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Creado el {new Date(gasto.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-500 mb-1">
                          -€{gasto.monto.toFixed(2)}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Gasto fijo
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {gastosGenerados.length > 5 && (
                  <div className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <button className={`text-sm hover:underline ${
                      isDark ? 'hover:text-gray-300' : 'hover:text-gray-800'
                    }`}>
                      Ver {gastosGenerados.length - 5} gastos más
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}

      {/* Formulario para agregar/editar */}
      {showAddForm && (
        <Card isDark={isDark}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingIndex !== null ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Etiqueta
                </label>
                <input
                  type="text"
                  value={formData.etiqueta}
                  onChange={(e) => setFormData({...formData, etiqueta: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Ej: Alquiler, Netflix, Gimnasio..."
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Monto (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value) || 0})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Frecuencia
                </label>
                <select
                  value={formData.frecuencia}
                  onChange={(e) => setFormData({...formData, frecuencia: e.target.value as any})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="mensual">Mensual</option>
                  <option value="semanal">Semanal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              
              {formData.frecuencia === 'mensual' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Día del mes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.diaMes || 1}
                    onChange={(e) => setFormData({...formData, diaMes: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  
                  {/* Aviso para días que no existen en todos los meses */}
                  {formData.diaMes && formData.diaMes >= 29 && (
                    <div className={`mt-2 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-amber-900/20 border-amber-700 text-amber-200' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold text-sm">⚠</span>
                        <div className="text-sm">
                          <strong>Aviso:</strong> {
                            formData.diaMes === 29 
                              ? 'El día 29 no existe en febrero algunos años (años no bisiestos). En esos casos, el gasto se creará automáticamente el día 28.'
                              : formData.diaMes === 30
                              ? 'El día 30 no existe en febrero. En febrero, el gasto se creará automáticamente el último día del mes.'
                              : 'El día 31 no existe en todos los meses (febrero, abril, junio, septiembre y noviembre). En esos meses, el gasto se creará automáticamente el último día del mes.'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {formData.frecuencia === 'semanal' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Día de la semana
                  </label>
                  <select
                    value={formData.diaSemana || 'lunes'}
                    onChange={(e) => setFormData({...formData, diaSemana: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miercoles">Miércoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                    <option value="sabado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>
              )}
              
              {formData.frecuencia === 'anual' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fecha anual (Mes y día)
                  </label>
                  <input
                    type="date"
                    value={`2024-${formData.fechaAnual || '01-01'}`}
                    onChange={(e) => {
                      const [_, mes, dia] = e.target.value.split('-')
                      setFormData({...formData, fechaAnual: `${mes}-${dia}`})
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Solo se usará el mes y día, el año será automático
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" variant="primary" isDark={isDark}>
                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} isDark={isDark}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de gastos recurrentes */}
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-8">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gastos Configurados
          </h3>
          <span className={`text-base px-4 py-2 rounded-full font-medium ${
            isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {gastosRecurrentes.length} gastos
          </span>
        </div>
        
        {gastosRecurrentes.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-xl font-medium mb-3">Sin gastos recurrentes</div>
            <div className="text-base">
              Comienza agregando tu primer gasto recurrente para automatizar tu contabilidad
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {gastosRecurrentes.map((gasto, index) => {
              const rechazado = tieneRechazos(gasto.etiqueta)
              const ultimoRechazo = obtenerUltimoRechazo(gasto.etiqueta)
              const proximoGasto = proximosGastos.find(p => p.gasto.etiqueta === gasto.etiqueta)
              
              return (
                <div 
                  key={index}
                  className={`p-8 rounded-xl border transition-all duration-200 ${
                    rechazado
                      ? isDark 
                        ? 'border-yellow-700 bg-yellow-900/20' 
                        : 'border-yellow-300 bg-yellow-50'
                      : isDark 
                        ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' 
                        : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                >
                  {/* Header del gasto */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {gasto.etiqueta}
                        </h4>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {gasto.frecuencia}
                        </span>
                        {rechazado && (
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            isDark ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            Rechazado
                          </span>
                        )}
                      </div>
                      
                      {/* Información detallada */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Frecuencia
                          </span>
                          <div className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getFrecuenciaText(gasto)}
                          </div>
                        </div>
                        
                        {gasto.fechaCreacion && (
                          <div>
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Creado el
                            </span>
                            <div className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(gasto.fechaCreacion + 'T00:00:00').toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                        
                        {proximoGasto && !rechazado && (
                          <div className="md:col-span-2">
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Próximo gasto
                            </span>
                            <div className="flex items-center gap-4 mt-1">
                              <div className={`text-base font-bold ${
                                proximoGasto.diasRestantes <= 3 
                                  ? 'text-red-500' 
                                  : proximoGasto.diasRestantes <= 7 
                                    ? 'text-yellow-500' 
                                    : 'text-green-500'
                              }`}>
                                {proximoGasto.proximaFecha.toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                proximoGasto.diasRestantes <= 3 
                                  ? isDark 
                                    ? 'bg-red-900 text-red-200 border border-red-700' 
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                  : proximoGasto.diasRestantes <= 7 
                                    ? isDark 
                                      ? 'bg-yellow-900 text-yellow-200 border border-yellow-700' 
                                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : isDark 
                                      ? 'bg-green-900 text-green-200 border border-green-700' 
                                      : 'bg-green-100 text-green-800 border border-green-300'
                              }`}>
                                {proximoGasto.diasRestantes === 0 ? 'Hoy' :
                                 proximoGasto.diasRestantes === 1 ? 'Mañana' :
                                 `Faltan ${proximoGasto.diasRestantes} días`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección del monto - centrada verticalmente */}
                  <div className="flex items-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500 mb-1">
                        -€{gasto.monto.toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        por {gasto.frecuencia === 'mensual' ? 'mes' : 
                             gasto.frecuencia === 'semanal' ? 'semana' : 'año'}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de rechazo */}
                  {rechazado && ultimoRechazo && (
                    <div className={`p-5 rounded-lg mb-6 ${
                      isDark 
                        ? 'bg-yellow-900/30 border border-yellow-700' 
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className={`text-base font-medium ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                        <strong>Rechazado el {new Date(ultimoRechazo.fechaRechazo + 'T00:00:00').toLocaleDateString('es-ES')}</strong>
                      </div>
                      <div className={`text-base mt-2 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        Este gasto ha sido rechazado. ¿Quieres eliminarlo permanentemente?
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleEdit(index)}
                      isDark={isDark}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => handleConfirmarEliminar(index)}
                      isDark={isDark}
                    >
                      {rechazado ? 'Eliminar Definitivamente' : 'Eliminar'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Modal de confirmación de borrado */}
      <ConfirmacionBorradoModal
        isOpen={gastoAEliminar !== null}
        onClose={() => setGastoAEliminar(null)}
        gasto={gastoAEliminar?.gasto || null}
        onConfirmarBorrado={handleEliminarGasto}
        isDark={isDark}
      />

      {/* Modal de confirmación de fecha pasada */}
      <ConfirmacionFechaPasadaModal
        isOpen={showConfirmacionFechaPasada}
        onClose={() => {
          setShowConfirmacionFechaPasada(false)
          setGastoFechaPasada(null)
        }}
        gasto={gastoFechaPasada?.gasto || null}
        fechaCalculada={gastoFechaPasada?.fecha || ''}
        onConfirmar={confirmarGastoFechaPasada}
        onRechazar={rechazarGastoFechaPasada}
        isDark={isDark}
      />
    </div>
  )
}

export default RecurrentesView