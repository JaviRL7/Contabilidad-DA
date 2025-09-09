// ========================================
// IMPORTS ORDENADOS
// ========================================

// Librerías externas
import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { parseISO } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'

// Servicios API
import { 
  fetchEtiquetas, 
  createEtiqueta, 
  updateEtiqueta, 
  deleteEtiqueta, 
  findEtiquetaByName,
  formatEtiquetasForLegacy, 
  type Etiqueta 
} from './services/etiquetasApi'

// Hooks personalizados
import { useRecurrentes } from './hooks/useRecurrentes'
import { useRecurrentesPendientes } from './hooks/useRecurrentesPendientes'
import { useRechazosGastos } from './hooks/useRechazosGastos'
import { useNotificacionesGastos } from './hooks/useNotificacionesGastos'
import { useAnalysis } from './hooks/useAnalysis'

// Componentes de layout y navegación
import Navigation from './components/layout/Navigation'
import ResponsiveHeader from './components/layout/ResponsiveHeader'

// Componentes reutilizables (modales)
import ConfirmModal from './components/modals/ConfirmModal'
import EditModal from './components/modals/EditModal'
import CreateTagModal from './components/modals/CreateTagModal'
import RecurrentesPendientesModal from './components/modals/RecurrentesPendientesModal'

// Componentes de notificaciones
import NotificacionGastoAutomatico from './components/notificaciones/NotificacionGastoAutomatico'

// Vistas principales
import HistorialView from './components/views/HistorialView'
import BusquedaView from './components/views/BusquedaView'
import EtiquetasView from './components/views/EtiquetasView'
import RecurrentesView from './components/views/RecurrentesView'
import YearlyBreakdownView from './components/views/YearlyBreakdownView'
import MonthlyBreakdownView from './components/views/MonthlyBreakdownView'
import AnalysisView from './components/views/AnalysisView'

// Componentes de dashboard
import SummaryPanel from './components/dashboard/SummaryPanel'

// Utilidades
import { triggerConfetti } from './utils/confetti'
import { formatEuro } from './utils/formatters'

// ========================================
// INTERFACES Y TIPOS
// ========================================

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
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
  onLogout 
}) => {
  // ========================================
  // ESTADOS PRINCIPALES
  // ========================================
  
  // Estados de datos
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
  const [etiquetasEsenciales, setEtiquetasEsenciales] = useState<string[]>(() => {
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
        const [movimientosResponse, etiquetasData] = await Promise.all([
          axios.get('/api/movimientos/'),
          fetchEtiquetas()
        ])

        setMovimientos(movimientosResponse.data.sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        ))
        
        setEtiquetasCompletas(etiquetasData)
        setEtiquetas(formatEtiquetasForLegacy(etiquetasData))
        
      } catch (error) {
        console.error('Error loading data:', error)
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
      await axios.delete(`/api/movimientos/${movimientoToDelete.id}/`)
      setMovimientos(prev => prev.filter(m => m.id !== movimientoToDelete.id))
      setShowDeleteConfirm(false)
      setMovimientoToDelete(null)
    } catch (error) {
      console.error('Error al eliminar movimiento:', error)
      alert('Error al eliminar el movimiento')
    }
  }

  const handleDeleteItem = async (tipo: 'ingreso' | 'gasto', itemId: number, movimientoId: number) => {
    try {
      const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos'
      await axios.delete(`/api/${endpoint}/${itemId}/`)
      
      const response = await axios.get(`/api/movimientos/${movimientoId}/`)
      const movimientoActualizado = response.data
      
      setMovimientos(prev => 
        prev.map(m => m.id === movimientoId ? movimientoActualizado : m)
      )
    } catch (error) {
      console.error(`Error al eliminar ${tipo}:`, error)
      alert(`Error al eliminar el ${tipo}`)
    }
  }

  const handleSaveChanges = async (movimiento: MovimientoDiario) => {
    try {
      const movimientoData = {
        fecha: movimiento.fecha,
        ingresos: movimiento.ingresos.map(ing => ({
          id: ing.id,
          monto: ing.monto,
          etiqueta: ing.etiqueta
        })),
        gastos: movimiento.gastos.map(gas => ({
          id: gas.id,
          monto: gas.monto,
          etiqueta: gas.etiqueta,
          es_recurrente: gas.es_recurrente || false
        }))
      }

      const response = await axios.post('/api/movimientos/', movimientoData)
      const movimientoActualizado = response.data
      
      setMovimientos(prev => 
        prev.map(m => m.fecha === movimientoActualizado.fecha ? movimientoActualizado : m)
      )
      
      setShowEditModal(false)
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      
      let errorMessage = 'Error al guardar los cambios del movimiento'
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || errorMessage
      } else if (error.response?.status === 404) {
        errorMessage = 'Movimiento no encontrado'
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  // ========================================
  // HANDLERS DE FORMULARIO INLINE
  // ========================================
  
  const handleAddNewIncome = () => {
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

  const handleAddNewExpense = () => {
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

  const handleCreateMovement = async () => {
    if (tempIncomes.length === 0 && tempExpenses.length === 0) {
      alert('Debes agregar al menos un ingreso o gasto')
      return
    }

    try {
      const ingresos = tempIncomes.map(item => ({
        id: item.id,
        etiqueta: item.etiqueta,
        monto: item.monto,
        fecha: newMovementDate
      }))
      
      const gastos = tempExpenses.map(item => ({
        id: item.id,
        etiqueta: item.etiqueta,
        monto: item.monto,
        fecha: newMovementDate
      }))

      const ingresoTotal = tempIncomes.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = tempExpenses.reduce((sum, item) => sum + item.monto, 0)

      const nuevoMovimiento = {
        fecha: newMovementDate,
        ingreso_total: ingresoTotal,
        ingresos,
        gastos,
        total_gastos: totalGastos,
        balance: ingresoTotal - totalGastos
      }

      const response = await axios.post('/api/movimientos/', nuevoMovimiento)
      const movimientoCreado = response.data
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== newMovementDate)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      const balance = ingresoTotal - totalGastos
      if (balance > 150) {
        triggerConfetti()
      }
      
      setTempIncomes([])
      setTempExpenses([])
      setNewMovementDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
    }
  }

  const handleRemoveTempItem = (tipo: 'ingreso' | 'gasto', id: number) => {
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
      const nuevaEtiqueta = await createEtiqueta({
        nombre: tagName.trim(),
        tipo: createTagType,
        es_predefinida: false,
        es_esencial: false
      })
      
      setEtiquetasCompletas(prev => [...prev, nuevaEtiqueta])
      
      if (createTagType === 'ingreso') {
        setEtiquetas(prev => ({ ...prev, ingresos: [...prev.ingresos, tagName] }))
        if (pendingTagField === 'newIncome.etiqueta') {
          setNewIncome(prev => ({ ...prev, etiqueta: tagName }))
        }
      } else {
        setEtiquetas(prev => ({ ...prev, gastos: [...prev.gastos, tagName] }))
        if (pendingTagField === 'newExpense.etiqueta') {
          setNewExpense(prev => ({ ...prev, etiqueta: tagName }))
        }
      }

      handleNewTagCreatedCallback(pendingTagField, tagName)
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

  const handleEditEtiquetaFromView = async (id: number, datosActualizados: Partial<Etiqueta>) => {
    try {
      const etiquetaActualizada = await updateEtiqueta(id, datosActualizados)
      setEtiquetasCompletas(prev => 
        prev.map(et => et.id === id ? etiquetaActualizada : et)
      )
      setEtiquetas(formatEtiquetasForLegacy(etiquetasCompletas.map(et => et.id === id ? etiquetaActualizada : et)))
    } catch (error) {
      console.error('Error al editar etiqueta:', error)
      throw error
    }
  }

  const handleDeleteEtiquetaFromView = async (id: number) => {
    try {
      await deleteEtiqueta(id)
      const nuevasEtiquetas = etiquetasCompletas.filter(et => et.id !== id)
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
  
  const handleSaveMovementFromForm = (movementData: any) => {
    setPendingMovement(movementData)
    setShowCreateConfirm(true)
  }

  const handleConfirmCreateMovement = async () => {
    if (!pendingMovement) return

    try {
      const ingresoTotal = pendingMovement.ingresos.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = pendingMovement.gastos.reduce((sum, item) => sum + item.monto, 0)

      const nuevoMovimiento = {
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

      const response = await axios.post('/api/movimientos/', nuevoMovimiento)
      const movimientoCreado = response.data
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.id !== movimientoCreado.id)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      const balance = ingresoTotal - totalGastos
      if (balance > 150) {
        triggerConfetti()
      }
      
      setShowAddForm(false)
      setShowCreateConfirm(false)
      setPendingMovement(null)
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      alert('Error al crear el movimiento. Por favor, inténtalo de nuevo.')
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

      const response = await axios.post('/api/movimientos/', movimientoData)
      const movimientoCreado = response.data
      
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== gasto.fechaEsperada)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
    } catch (error) {
      console.error('Error al confirmar gasto recurrente:', error)
      alert('Error al crear el gasto recurrente. Inténtalo de nuevo.')
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
        onShowYearlyBreakdown={() => {
          setShowMonthlyBreakdown(false)
          setShowYearlyBreakdown(true)
        }}
        onShowMonthlyBreakdown={() => {
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
            onNavigateToYearly={() => {
              setShowMonthlyBreakdown(false)
              setShowYearlyBreakdown(true)
            }}
            onEditMovimiento={handleEditMovimiento}
            onDeleteMovimiento={handleDeleteMovimiento}
          />
        ) : activeSection === 'historial' ? (
          
          /* ========================================
              VISTA HISTORIAL CON RESÚMENES INTEGRADOS
              ======================================== */
          <div className="space-y-6">
            {/* Panel de resúmenes arriba */}
            <div className="w-full">
              <SummaryPanel
                movimientos={movimientos}
                isDark={isDark}
                onShowMonthlyBreakdown={() => setShowMonthlyBreakdown(true)}
                onShowYearlyBreakdown={() => setShowYearlyBreakdown(true)}
              />
            </div>
            
            {/* Vista principal abajo */}
            <div className="w-full">
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
              />
            </div>
          </div>
          
        ) : activeSection === 'buscar' ? (
          
          /* ========================================
              VISTA BÚSQUEDA CON RESÚMENES INTEGRADOS  
              ======================================== */
          <div className="space-y-6">
            {/* Panel de resúmenes arriba */}
            <div className="w-full">
              <SummaryPanel
                movimientos={movimientos}
                isDark={isDark}
                onShowMonthlyBreakdown={() => setShowMonthlyBreakdown(true)}
                onShowYearlyBreakdown={() => setShowYearlyBreakdown(true)}
              />
            </div>
            
            {/* Vista principal abajo */}
            <div className="w-full">
              <BusquedaView
                movimientos={movimientos}
                isDark={isDark}
                onEditMovimiento={handleEditMovimiento}
                onDeleteMovimiento={handleDeleteMovimiento}
              />
            </div>
          </div>
          
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
                onViewEtiqueta={(etiqueta) => {
                  console.log('👁️ Viendo estadísticas de etiqueta:', etiqueta)
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

            {/* Vista Análisis */}
            {activeSection === 'analisis' && (
              <AnalysisView
                movimientos={movimientos}
                isDark={isDark}
                onBack={() => setActiveSection('historial')}
                etiquetasEsenciales={etiquetasEsenciales}
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
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingMovimiento(null)
        }}
        movimiento={editingMovimiento}
        isDark={isDark}
        onDeleteItem={handleDeleteItem}
        onSaveChanges={handleSaveChanges}
        etiquetas={etiquetas}
      />

      {/* Modal para crear nueva etiqueta */}
      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => {
          setShowCreateTagModal(false)
          setPendingTagField('')
        }}
        onConfirm={handleCreateTagConfirm}
        tipo={createTagType}
        isDark={isDark}
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