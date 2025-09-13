// ========================================
// IMPORTS ORDENADOS
// ========================================

// Librerías externas
import React, { useState, useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'

// Servicios API
import { 
  fetchEtiquetas, 
  createEtiqueta, 
  updateEtiqueta, 
  deleteEtiqueta, 
  formatEtiquetasForLegacy, 
  type Etiqueta 
} from './services/etiquetasApi'
import * as MovimientosAPI from './services/movimientosApi'
import { notificacionesApi, type NotificacionCalendario } from './services/calendarApi'

// Hooks personalizados
import { useRecurrentes } from './hooks/useRecurrentes'
import { useRecurrentesPendientes } from './hooks/useRecurrentesPendientes'
import { useRechazosGastos } from './hooks/useRechazosGastos'
import { useNotificacionesGastos } from './hooks/useNotificacionesGastos'

// Componentes de layout y navegación
import ResponsiveHeader from './components/layout/ResponsiveHeader'

// Componentes reutilizables (modales)
import ConfirmModal from './components/modals/ConfirmModal'
import EditModalRefactored from './components/modals/EditModalRefactored'
import CreateTagModal from './components/modals/CreateTagModal'
import RecurrentesPendientesModal from './components/modals/RecurrentesPendientesModal'

// Componentes de notificaciones
import NotificacionGastoAutomatico from './components/notificaciones/NotificacionGastoAutomatico'

// Vistas principales
import HistorialView from './components/views/HistorialView'
import BusquedaView from './components/views/BusquedaView'
import EtiquetasView from './components/views/EtiquetasView'
import RecurrentesView from './components/views/RecurrentesView'
import DesglosesView from './components/views/DesglosesView'
import YearlyBreakdownView from './components/views/YearlyBreakdownView'
import MonthlyBreakdownView from './components/views/MonthlyBreakdownView'
import AnalysisView from './components/views/AnalysisView'
import CalendarView from './components/views/CalendarView'

// Componentes de dashboard

// Utilidades
import { triggerConfetti } from './utils/confetti'

// ========================================
// INTERFACES Y TIPOS
// ========================================

interface Ingreso {
  id: number
  monto: number
  etiqueta: string
}

interface Gasto {
  id: number
  monto: number
  etiqueta: string
  es_recurrente?: boolean
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: Ingreso[]
  gastos: Gasto[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface AppRefactoredProps {
  externalIsDark?: boolean
  onToggleDark?: () => void
  onLogout?: () => void
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const AppRefactored: React.FC<AppRefactoredProps> = ({ 
  externalIsDark = false, 
  onToggleDark,
  onLogout: _onLogout 
}) => {
  // ========================================
  // ESTADOS PRINCIPALES
  // ========================================
  
  // Estados de datos
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [_pendingNotifications, setPendingNotifications] = useState<NotificacionCalendario[]>([])
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0)
  
  // Estados de navegación
  const [activeSection, setActiveSection] = useState('historial')
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [selectedMonthYear, setSelectedMonthYear] = useState({ month: 0, year: 2024 })
  
  // Estados de UI
  const [isDark, setIsDark] = useState(externalIsDark)

  // ========================================
  // ESTADOS DE ETIQUETAS
  // ========================================
  
  const [etiquetas, setEtiquetas] = useState({ ingresos: [], gastos: [] })
  const [etiquetasCompletas, setEtiquetasCompletas] = useState<Etiqueta[]>([])
  const [etiquetasEsenciales, _setEtiquetasEsenciales] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('etiquetasEsenciales')
      return stored ? JSON.parse(stored) : [
        'Alquiler', 'Hipoteca', 'Agua', 'Luz', 'Gas', 'Internet', 
        'Teléfono', 'Seguro hogar', 'Seguro coche', 'Combustible',
        'Supermercado', 'Farmacia', 'Transporte público'
      ]
    } catch {
      return []
    }
  })

  // ========================================
  // ESTADOS DE FORMULARIOS Y MODALES
  // ========================================
  
  // Estados para formulario de agregar movimiento
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMovementDate, setNewMovementDate] = useState(new Date().toISOString().split('T')[0])
  const [tempIncomes, setTempIncomes] = useState([])
  const [tempExpenses, setTempExpenses] = useState([])
  const [newIncome, setNewIncome] = useState({ etiqueta: '', monto: '' })
  const [newExpense, setNewExpense] = useState({ etiqueta: '', monto: '' })
  
  // Estados para EditModal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoDiario | null>(null)
  
  // Estados para ConfirmModal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<MovimientoDiario | null>(null)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [pendingMovement, setPendingMovement] = useState(null)
  
  // Estados para CreateTagModal
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [pendingTagField, setPendingTagField] = useState('')
  const [createTagType, setCreateTagType] = useState<'ingreso' | 'gasto'>('gasto')
  const [newTagCreated, setNewTagCreated] = useState({ field: '', value: '' })
  
  // Estados para RecurrentesPendientesModal
  const [showRecurrentesPendientes, setShowRecurrentesPendientes] = useState(false)
  
  // Estado para notificación pendiente
  const [pendingNotificationId, setPendingNotificationId] = useState<number | null>(null)

  // ========================================
  // HOOKS PERSONALIZADOS
  // ========================================
  
  const recurrentes = useRecurrentes()
  const gastosPendientes = useRecurrentesPendientes(recurrentes.gastosRecurrentes)
  const rechazosGastos = useRechazosGastos()
  const notificacionesGastos = useNotificacionesGastos(recurrentes.gastosRecurrentes)
  // const analysis = useAnalysis(movimientos) // Temporalmente deshabilitado para debug

  // ========================================
  // EFECTOS DE INICIALIZACIÓN
  // ========================================
  
  useEffect(() => {
    setIsDark(externalIsDark)
  }, [externalIsDark])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [movimientosData, etiquetasData, pendientesData] = await Promise.all([
          MovimientosAPI.fetchMovimientos(),
          fetchEtiquetas(),
          notificacionesApi.obtenerNotificacionesPendientes().catch(() => []) // No fallar si las notificaciones fallan
        ])

        setMovimientos(movimientosData.sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        ))
        
        setEtiquetasCompletas(etiquetasData)
        setEtiquetas(formatEtiquetasForLegacy(etiquetasData))
        
        setPendingNotifications(pendientesData)
        setPendingNotificationsCount(pendientesData.length)
        
      } catch (error) {
        console.error('Error loading data:', error)
        alert('Error al cargar los datos: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Mostrar gastos pendientes si los hay
  useEffect(() => {
    if (gastosPendientes.length > 0) {
      setShowRecurrentesPendientes(true)
    }
  }, [gastosPendientes])

  // Guardar etiquetas esenciales en localStorage
  useEffect(() => {
    localStorage.setItem('etiquetasEsenciales', JSON.stringify(etiquetasEsenciales))
  }, [etiquetasEsenciales])

  // ========================================
  // HANDLERS DE MOVIMIENTOS
  // ========================================
  
  const handleEditMovimiento = (movimiento: MovimientoDiario) => {
    setEditingMovimiento(movimiento)
    setShowEditModal(true)
  }

  const handleDeleteMovimiento = (movimiento: MovimientoDiario) => {
    setMovimientoToDelete(movimiento)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteMovimiento = async () => {
    if (!movimientoToDelete) return

    try {
      await MovimientosAPI.deleteMovimiento(movimientoToDelete.fecha)
      setMovimientos(prev => prev.filter(m => m.id !== movimientoToDelete.id))
      setShowDeleteConfirm(false)
      setMovimientoToDelete(null)
    } catch (error) {
      console.error('Error al eliminar movimiento:', error)
      alert('Error al eliminar el movimiento: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  // Eliminado - ahora se maneja dentro del EditModalRefactored

  const handleSaveChanges = async (movimiento: MovimientoDiario) => {
    try {
      const movimientoData = MovimientosAPI.transformarMovimientoParaApi(movimiento)
      
      // Validar antes de enviar
      const errores = MovimientosAPI.validarMovimiento(movimientoData)
      if (errores.length > 0) {
        throw new Error('Errores de validación:\n' + errores.join('\n'))
      }

      const movimientoActualizado = await MovimientosAPI.updateMovimiento(movimientoData)
      
      // Actualizar el estado principal
      setMovimientos(prev => {
        const existingIndex = prev.findIndex(m => m.fecha === movimientoActualizado.fecha)
        
        if (existingIndex >= 0) {
          const newMovimientos = [...prev]
          newMovimientos[existingIndex] = movimientoActualizado
          return newMovimientos
        }
        
        return [movimientoActualizado, ...prev].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      setShowEditModal(false)
      setEditingMovimiento(null)
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      throw error // Relanzar para que el modal lo maneje
    }
  }

  // ========================================
  // HANDLERS DE NOTIFICACIONES
  // ========================================

  const _handleCreateMovementFromNotification = (notificacion: NotificacionCalendario) => {
    // Cambiar a vista historial para mostrar el formulario
    setActiveSection('historial')
    setShowAddForm(true)
    
    // Pre-cargar la fecha de la notificación
    setNewMovementDate(notificacion.fecha)
    
    // Si hay etiqueta, pre-cargarla según el tipo
    if (notificacion.etiqueta) {
      if (notificacion.tipo === 'ingreso') {
        setNewIncome(prev => ({ ...prev, etiqueta: notificacion.etiqueta! }))
      } else if (notificacion.tipo === 'gasto') {
        setNewExpense(prev => ({ ...prev, etiqueta: notificacion.etiqueta! }))
      }
    }
  }

  const handleCreateMovementFromCalendarNotification = (notificacion: NotificacionCalendario) => {
    // Guardar el ID de la notificación para convertirla después
    setPendingNotificationId(notificacion.id!)
    
    // Cambiar a vista historial para mostrar el formulario
    setActiveSection('historial')
    setShowAddForm(true)
    
    // Pre-cargar la fecha de la notificación
    setNewMovementDate(notificacion.fecha)
    
    // Si hay etiqueta, pre-cargarla según el tipo
    if (notificacion.etiqueta) {
      if (notificacion.tipo === 'ingreso') {
        setNewIncome(prev => ({ ...prev, etiqueta: notificacion.etiqueta! }))
      } else if (notificacion.tipo === 'gasto') {
        setNewExpense(prev => ({ ...prev, etiqueta: notificacion.etiqueta! }))
      }
    }
  }

  const handleNavigateToCalendar = () => {
    setActiveSection('calendario')
  }

  const reloadPendingNotifications = async () => {
    try {
      const pendientes = await notificacionesApi.obtenerNotificacionesPendientes()
      setPendingNotifications(pendientes)
      setPendingNotificationsCount(pendientes.length)
    } catch (error) {
      console.error('Error al recargar notificaciones pendientes:', error)
    }
  }

  // ========================================
  // HANDLERS DE FORMULARIO INLINE
  // ========================================
  
  const _handleAddNewIncome = () => {
    const monto = parseFloat(newIncome.monto)
    if (!newIncome.etiqueta || isNaN(monto) || monto <= 0) return

    const newItem = {
      id: Date.now(),
      etiqueta: newIncome.etiqueta,
      monto
    }
    
    setTempIncomes(prev => [...prev, newItem])
    setNewIncome({ etiqueta: '', monto: '' })
  }

  const _handleAddNewExpense = () => {
    const monto = parseFloat(newExpense.monto)
    if (!newExpense.etiqueta || isNaN(monto) || monto <= 0) return

    const newItem = {
      id: Date.now(),
      etiqueta: newExpense.etiqueta,
      monto
    }
    
    setTempExpenses(prev => [...prev, newItem])
    setNewExpense({ etiqueta: '', monto: '' })
  }

  const _handleCreateMovement = async () => {
    if (tempIncomes.length === 0 && tempExpenses.length === 0) {
      alert('Debes agregar al menos un ingreso o gasto')
      return
    }

    try {
      const ingresos = tempIncomes.map(item => ({
        etiqueta: item.etiqueta,
        monto: item.monto
      }))
      
      const gastos = tempExpenses.map(item => ({
        etiqueta: item.etiqueta,
        monto: item.monto
      }))

      const movimientoCreado = await MovimientosAPI.crearMovimientoDesdeFormulario(
        newMovementDate,
        ingresos,
        gastos
      )
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== newMovementDate)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      const ingresoTotal = tempIncomes.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = tempExpenses.reduce((sum, item) => sum + item.monto, 0)
      const balance = ingresoTotal - totalGastos
      
      if (balance > 150) {
        triggerConfetti()
      }
      
      setTempIncomes([])
      setTempExpenses([])
      setNewMovementDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
      
      // Recargar notificaciones pendientes automáticamente
      await reloadPendingNotifications()
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      alert('Error al crear el movimiento: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const _handleRemoveTempItem = (tipo: 'ingreso' | 'gasto', id: number) => {
    if (tipo === 'ingreso') {
      setTempIncomes(prev => prev.filter(item => item.id !== id))
    } else {
      setTempExpenses(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm)
    if (showAddForm) {
      setTempIncomes([])
      setTempExpenses([])
      setNewIncome({ etiqueta: '', monto: '' })
      setNewExpense({ etiqueta: '', monto: '' })
      setNewMovementDate(new Date().toISOString().split('T')[0])
    }
  }

  // ========================================
  // HANDLERS DE ETIQUETAS
  // ========================================
  
  const handleCreateNewTag = (field: string, tipo: 'ingreso' | 'gasto') => {
    setPendingTagField(field)
    setCreateTagType(tipo)
    setShowCreateTagModal(true)
  }

  const handleCreateTagConfirm = async (tagName: string) => {
    try {
      const trimmedName = tagName.trim()
      
      // Validación client-side para evitar llamadas API innecesarias
      if (!trimmedName) {
        console.error('Error al crear etiqueta: El nombre no puede estar vacío')
        return
      }
      
      const nuevaEtiqueta = await createEtiqueta({
        nombre: trimmedName,
        tipo: createTagType,
        es_predefinida: false,
        es_esencial: false
      })
      
      setEtiquetasCompletas(prev => [...prev, nuevaEtiqueta])
      
      if (createTagType === 'ingreso') {
        setEtiquetas(prev => ({ ...prev, ingresos: [...prev.ingresos, trimmedName] }))
        if (pendingTagField === 'newIncome.etiqueta') {
          setNewIncome(prev => ({ ...prev, etiqueta: trimmedName }))
        }
      } else {
        setEtiquetas(prev => ({ ...prev, gastos: [...prev.gastos, trimmedName] }))
        if (pendingTagField === 'newExpense.etiqueta') {
          setNewExpense(prev => ({ ...prev, etiqueta: trimmedName }))
        }
      }

      handleNewTagCreatedCallback(pendingTagField, trimmedName)
      setShowCreateTagModal(false)
      setPendingTagField('')
      
    } catch (error) {
      console.error('Error al crear etiqueta:', error)
      alert('Error al crear la etiqueta')
    }
  }

  const handleNewTagCreatedCallback = (field: string, value: string) => {
    setNewTagCreated({ field, value })
  }

  // Handlers para EtiquetasView
  const handleCreateEtiquetaFromView = async (nuevaEtiqueta: Omit<Etiqueta, 'id'>) => {
    try {
      const etiquetaCreada = await createEtiqueta(nuevaEtiqueta)
      setEtiquetasCompletas(prev => [...prev, etiquetaCreada])
      setEtiquetas(formatEtiquetasForLegacy([...etiquetasCompletas, etiquetaCreada]))
    } catch (error) {
      console.error('Error al crear etiqueta:', error)
      throw error
    }
  }

  const handleEditEtiquetaFromView = async (nombreAntiguo: string, nombreNuevo: string, nuevoTipo: 'gasto' | 'ingreso') => {
    try {
      // Encontrar la etiqueta por nombre anterior para obtener el ID
      const etiqueta = etiquetasCompletas.find(et => et.nombre === nombreAntiguo)
      if (!etiqueta) {
        console.error('Error: Etiqueta no encontrada:', nombreAntiguo)
        return
      }
      
      const datosActualizados = {
        nombre: nombreNuevo,
        tipo: nuevoTipo
      }
      
      const etiquetaActualizada = await updateEtiqueta(etiqueta.id, datosActualizados)
      setEtiquetasCompletas(prev => 
        prev.map(et => et.id === etiqueta.id ? etiquetaActualizada : et)
      )
      setEtiquetas(formatEtiquetasForLegacy(etiquetasCompletas.map(et => et.id === etiqueta.id ? etiquetaActualizada : et)))
    } catch (error) {
      console.error('Error al editar etiqueta:', error)
      throw error
    }
  }

  const handleDeleteEtiquetaFromView = async (nombre: string) => {
    try {
      // Encontrar la etiqueta por nombre para obtener el ID
      const etiqueta = etiquetasCompletas.find(et => et.nombre === nombre)
      if (!etiqueta) {
        console.error('Error: Etiqueta no encontrada:', nombre)
        return
      }
      
      await deleteEtiqueta(etiqueta.id)
      const nuevasEtiquetas = etiquetasCompletas.filter(et => et.id !== etiqueta.id)
      setEtiquetasCompletas(nuevasEtiquetas)
      setEtiquetas(formatEtiquetasForLegacy(nuevasEtiquetas))
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error)
      throw error
    }
  }

  // ========================================
  // HANDLERS DE MOVIMIENTOS AVANZADOS
  // ========================================
  
  const handleSaveMovementFromForm = (movementData: MovimientoDiario) => {
    setPendingMovement(movementData)
    setShowCreateConfirm(true)
  }

  const handleConfirmCreateMovement = async () => {
    if (!pendingMovement) return

    try {
      const movimientoData = {
        fecha: pendingMovement.fecha,
        ingresos: pendingMovement.ingresos.map(item => ({
          etiqueta: item.etiqueta,
          monto: item.monto
        })),
        gastos: pendingMovement.gastos.map(item => ({
          etiqueta: item.etiqueta,
          monto: item.monto
        }))
      }

      const movimientoCreado = await MovimientosAPI.createMovimiento(movimientoData)
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== movimientoCreado.fecha)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      const ingresoTotal = pendingMovement.ingresos.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = pendingMovement.gastos.reduce((sum, item) => sum + item.monto, 0)
      const balance = ingresoTotal - totalGastos
      
      if (balance > 150) {
        triggerConfetti()
      }
      
      setShowAddForm(false)
      setShowCreateConfirm(false)
      setPendingMovement(null)
      
      // Si el movimiento fue creado desde una notificación, marcarla como convertida
      if (pendingNotificationId) {
        try {
          const { notificacionesApi } = await import('./services/calendarApi')
          await notificacionesApi.convertirNotificacion(pendingNotificationId)
        } catch (conversionError) {
          console.error('Error al marcar notificación como convertida:', conversionError)
        }
        setPendingNotificationId(null)
      }
      
      // Recargar notificaciones pendientes automáticamente
      await reloadPendingNotifications()
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      alert('Error al crear el movimiento: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setShowCreateConfirm(false)
      setPendingMovement(null)
    }
  }

  // ========================================
  // HANDLERS DE GASTOS RECURRENTES
  // ========================================
  
  const handleConfirmarGasto = async (gasto: any) => {
    try {
      const movimientoData = {
        fecha: gasto.fechaEsperada,
        ingresos: [],
        gastos: [{
          etiqueta: gasto.gastoRecurrente.etiqueta,
          monto: gasto.gastoRecurrente.monto,
          es_recurrente: true
        }]
      }

      const movimientoCreado = await MovimientosAPI.createMovimiento(movimientoData)
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== gasto.fechaEsperada)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
    } catch (error) {
      console.error('Error al confirmar gasto recurrente:', error)
      alert('Error al crear el gasto recurrente: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const handleRechazarGasto = (gasto: any) => {
    rechazosGastos.agregarRechazo(gasto.gastoRecurrente.etiqueta, gasto.fechaEsperada)
  }

  const handleConfirmarTodosGastos = async () => {
    try {
      for (const gasto of gastosPendientes) {
        await handleConfirmarGasto(gasto)
      }
      setShowRecurrentesPendientes(false)
    } catch (error) {
      console.error('Error al confirmar todos los gastos:', error)
    }
  }

  const handleRechazarTodosGastos = () => {
    gastosPendientes.forEach(gasto => {
      rechazosGastos.agregarRechazo(gasto.gastoRecurrente.etiqueta, gasto.fechaEsperada)
    })
    setShowRecurrentesPendientes(false)
  }

  // ========================================
  // RENDER LOADING
  // ========================================
  
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className={`text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Cargando...
        </div>
      </div>
    )
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      
      {/* ========================================
          HEADER RESPONSIVE
          ======================================== */}
      <ResponsiveHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isDark={isDark}
        onToggleDark={onToggleDark}
        setIsDark={setIsDark}
        showBreakdownTabs={showYearlyBreakdown || showMonthlyBreakdown}
        onResetBreakdowns={() => {
          setShowYearlyBreakdown(false)
          setShowMonthlyBreakdown(false)
        }}
        onShowYearlyBreakdown={() => {
          setShowMonthlyBreakdown(false)
          setShowYearlyBreakdown(true)
        }}
        onShowMonthlyBreakdown={() => {
          const now = new Date()
          setSelectedMonthYear({ month: now.getMonth(), year: now.getFullYear() })
          setShowYearlyBreakdown(false)
          setShowMonthlyBreakdown(true)
        }}
        showYearlyBreakdown={showYearlyBreakdown}
        showMonthlyBreakdown={showMonthlyBreakdown}
      />

      {/* ========================================
          CONTENIDO PRINCIPAL
          ======================================== */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Vistas de Desglose - Navegación integrada en header */}
        {showYearlyBreakdown ? (
          <YearlyBreakdownView
            movimientos={movimientos}
            isDark={isDark}
            onBack={() => {
              setShowYearlyBreakdown(false)
              setActiveSection('historial')
            }}
            onNavigateToDesgloses={() => {
              setShowYearlyBreakdown(false)
              setActiveSection('desgloses')
            }}
            onGoToMonthly={(month, year) => {
              setSelectedMonthYear({ month, year })
              setShowYearlyBreakdown(false)
              setShowMonthlyBreakdown(true)
            }}
          />
        ) : showMonthlyBreakdown ? (
          <MonthlyBreakdownView
            movimientos={movimientos}
            selectedMonth={selectedMonthYear.month + 1}
            selectedYear={selectedMonthYear.year}
            isDark={isDark}
            onBack={() => {
              setShowMonthlyBreakdown(false)
              setActiveSection('historial')
            }}
            onNavigateToDesgloses={() => {
              setShowMonthlyBreakdown(false)
              setActiveSection('desgloses')
            }}
            onNavigateToYearly={() => {
              setShowMonthlyBreakdown(false)
              setShowYearlyBreakdown(true)
            }}
            onMonthChange={(month, year) => {
              setSelectedMonthYear({ month: month - 1, year })
            }}
            onEditMovimiento={handleEditMovimiento}
            onDeleteMovimiento={handleDeleteMovimiento}
          />
        ) : activeSection === 'historial' ? (
          
          /* ========================================
              VISTA HISTORIAL CON RESÚMENES INTEGRADOS
              ======================================== */
          <HistorialView
                movimientos={movimientos}
                isDark={isDark}
                onEditMovimiento={handleEditMovimiento}
                onDeleteMovimiento={handleDeleteMovimiento}
                showAddForm={showAddForm}
                onToggleAddForm={handleToggleAddForm}
                onSaveNewMovement={handleSaveMovementFromForm}
                etiquetas={etiquetas}
                onCreateNewTag={handleCreateNewTag}
                newTagCreated={newTagCreated}
                pendingNotificationsCount={pendingNotificationsCount}
                onNavigateToCalendar={handleNavigateToCalendar}
                onShowMonthlyBreakdown={() => {
                  const now = new Date()
                  setSelectedMonthYear({ month: now.getMonth(), year: now.getFullYear() })
                  setShowYearlyBreakdown(false)
                  setShowMonthlyBreakdown(true)
                }}
                onShowYearlyBreakdown={() => {
                  setShowMonthlyBreakdown(false)
                  setShowYearlyBreakdown(true)
                }}
              />
          
        ) : activeSection === 'buscar' ? (
          
          /* ========================================
              VISTA BÚSQUEDA CON RESÚMENES INTEGRADOS  
              ======================================== */
          <BusquedaView
                movimientos={movimientos}
                isDark={isDark}
                onEditMovimiento={handleEditMovimiento}
                onDeleteMovimiento={handleDeleteMovimiento}
                onShowMonthlyBreakdown={() => {
                  const now = new Date()
                  setSelectedMonthYear({ month: now.getMonth(), year: now.getFullYear() })
                  setShowYearlyBreakdown(false)
                  setShowMonthlyBreakdown(true)
                }}
                onShowYearlyBreakdown={() => {
                  setShowMonthlyBreakdown(false)
                  setShowYearlyBreakdown(true)
                }}
              />
          
        ) : (
          
          /* ========================================
              OTRAS VISTAS PRINCIPALES
              ======================================== */
          <div className="space-y-8">
            
            {/* Vista Etiquetas */}
            {activeSection === 'etiquetas' && (
              <EtiquetasView
                etiquetas={etiquetas}
                isDark={isDark}
                etiquetasEsenciales={etiquetasEsenciales}
                movimientos={movimientos}
                onCreateEtiqueta={handleCreateEtiquetaFromView}
                onEditEtiqueta={handleEditEtiquetaFromView}
                onDeleteEtiqueta={handleDeleteEtiquetaFromView}
                onViewEtiqueta={(_etiqueta) => {
                  // TODO: Implementar vista de estadísticas de etiqueta
                }}
              />
            )}

            {/* Vista Recurrentes */}
            {activeSection === 'recurrentes' && (
              <RecurrentesView
                isDark={isDark}
                gastosRecurrentes={recurrentes.gastosRecurrentes}
                onAddGastoRecurrente={recurrentes.addGastoRecurrente}
                onUpdateGastoRecurrente={recurrentes.updateGastoRecurrente}
                onRemoveGastoRecurrente={recurrentes.removeGastoRecurrente}
                rechazosGastos={rechazosGastos}
                notificacionesGastos={notificacionesGastos}
                etiquetas={etiquetas}
                onCreateNewTag={handleCreateNewTag}
                newTagCreated={newTagCreated}
              />
            )}

            {/* Vista Desgloses */}
            {activeSection === 'desgloses' && (
              <DesglosesView
                isDark={isDark}
                movimientos={movimientos}
                onShowMonthlyBreakdown={(month, year) => {
                  if (month !== undefined && year !== undefined) {
                    setSelectedMonthYear({ month, year })
                  } else {
                    const now = new Date()
                    setSelectedMonthYear({ month: now.getMonth(), year: now.getFullYear() })
                  }
                  setShowYearlyBreakdown(false)
                  setShowMonthlyBreakdown(true)
                }}
                onShowYearlyBreakdown={(_year) => {
                  // Podríamos usar el año si fuera necesario para filtrar
                  setShowMonthlyBreakdown(false)
                  setShowYearlyBreakdown(true)
                }}
              />
            )}

            {/* Vista Análisis */}
            {activeSection === 'analisis' && (
              <AnalysisView
                movimientos={movimientos}
                isDark={isDark}
                onBack={() => setActiveSection('historial')}
                etiquetasEsenciales={etiquetasEsenciales}
              />
            )}

            {/* Vista Calendario */}
            {activeSection === 'calendario' && (
              <CalendarView
                isDark={isDark}
                etiquetas={etiquetas}
                onCreateMovementFromNotification={handleCreateMovementFromCalendarNotification}
                onSaveNewMovement={handleSaveMovementFromForm}
                onCreateNewTag={handleCreateNewTag}
                newTagCreated={newTagCreated}
              />
            )}

          </div>
        )}
      </div>

      {/* ========================================
          MODALES
          ======================================== */}
      
      {/* Modal de confirmación para borrar movimiento */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setMovimientoToDelete(null)
        }}
        onConfirm={confirmDeleteMovimiento}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar el movimiento del ${movimientoToDelete ? new Date(movimientoToDelete.fecha).toLocaleDateString('es-ES') : ''}?`}
        isDark={isDark}
      />

      {/* Modal de confirmación para crear movimiento */}
      <ConfirmModal
        isOpen={showCreateConfirm}
        onClose={() => {
          setShowCreateConfirm(false)
          setPendingMovement(null)
        }}
        onConfirm={handleConfirmCreateMovement}
        title="Confirmar creación de movimiento"
        message={pendingMovement ? `¿Estás seguro de que quieres crear el movimiento del ${new Date(pendingMovement.fecha).toLocaleDateString('es-ES')}?` : ''}
        isDark={isDark}
      />

      {/* Modal de edición de movimiento */}
      <EditModalRefactored
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingMovimiento(null)
        }}
        movimiento={editingMovimiento}
        isDark={isDark}
        onSave={handleSaveChanges}
        etiquetas={etiquetas}
        onCreateNewTag={handleCreateNewTag}
        newTagCreated={newTagCreated}
      />

      {/* Modal para crear nueva etiqueta */}
      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => {
          setShowCreateTagModal(false)
          setPendingTagField('')
        }}
        onCreate={(name, _type, _isEssential) => {
          handleCreateTagConfirm(name)
        }}
        isDark={isDark}
        existingTags={[...(etiquetas.ingresos || []), ...(etiquetas.gastos || [])]}
        preselectedType={createTagType}
      />

      {/* Modal para gastos recurrentes pendientes */}
      <RecurrentesPendientesModal
        isOpen={showRecurrentesPendientes}
        onClose={() => setShowRecurrentesPendientes(false)}
        gastosPendientes={gastosPendientes}
        onConfirmarGasto={handleConfirmarGasto}
        onRechazarGasto={handleRechazarGasto}
        onConfirmarTodos={handleConfirmarTodosGastos}
        onRechazarTodos={handleRechazarTodosGastos}
        isDark={isDark}
      />

      {/* ========================================
          NOTIFICACIONES
          ======================================== */}
      
      {/* Notificaciones de gastos automáticos */}
      {notificacionesGastos.notificacionesActivas.map(notificacion => (
        <NotificacionGastoAutomatico
          key={notificacion.id}
          notificacion={notificacion}
          onCerrar={notificacionesGastos.cerrarNotificacion}
          isDark={isDark}
          onVerGastosFijos={() => setActiveSection('recurrentes')}
        />
      ))}
    </div>
  )
}

export default AppRefactored