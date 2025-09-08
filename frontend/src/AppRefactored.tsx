import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { parseISO } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'

// Servicios API
import { fetchEtiquetas, createEtiqueta, formatEtiquetasForLegacy, type Etiqueta } from './services/etiquetasApi'

// Componentes reutilizables
import Navigation from './components/layout/Navigation'
import ConfirmModal from './components/modals/ConfirmModal'
import EditModal from './components/modals/EditModal'
import CreateTagModal from './components/modals/CreateTagModal'

// Vistas
import HistorialView from './components/views/HistorialView'
import BusquedaView from './components/views/BusquedaView'
import EtiquetasView from './components/views/EtiquetasView'
import YearlyBreakdownView from './components/views/YearlyBreakdownView'

// Dashboard components
import SummaryPanel from './components/dashboard/SummaryPanel'

// Hooks personalizados
import { useRecurrentes } from './hooks/useRecurrentes'
import { useAnalysis } from './hooks/useAnalysis'

// Utilities
import { triggerConfetti } from './utils/confetti'
import { formatEuro } from './utils/formatters'

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

const AppRefactored: React.FC<AppRefactoredProps> = ({ 
  externalIsDark = false, 
  onToggleDark,
  onLogout 
}) => {
  console.log('AppRefactored render - props:', { externalIsDark, onToggleDark: !!onToggleDark })
  // Estados principales
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [activeSection, setActiveSection] = useState('historial')
  const [isLoading, setIsLoading] = useState(true)
  const [isDark, setIsDark] = useState(externalIsDark)

  // Estado para formulario de agregar item (simplificado) - ELIMINADO, ahora usando formulario inline

  // Estados para etiquetas esenciales
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


  // Estados para EditModal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoDiario | null>(null)
  
  // Estados para ConfirmModal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<MovimientoDiario | null>(null)

  // Estados para CreateTagModal
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [createTagType, setCreateTagType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [pendingTagField, setPendingTagField] = useState<string>('')

  // Estados para formulario inline de añadir movimiento
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMovementDate, setNewMovementDate] = useState(new Date().toISOString().split('T')[0])
  const [newIncome, setNewIncome] = useState({ etiqueta: '', monto: '' })
  const [newExpense, setNewExpense] = useState({ etiqueta: '', monto: '' })
  const [tempIncomes, setTempIncomes] = useState<Array<{id: number, etiqueta: string, monto: number}>>([])
  const [tempExpenses, setTempExpenses] = useState<Array<{id: number, etiqueta: string, monto: number}>>([])

  // Estados para vistas de desglose
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false)
  const [selectedMonthYear, setSelectedMonthYear] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  
  // Estados para etiquetas
  const [etiquetasCompletas, setEtiquetasCompletas] = useState<Etiqueta[]>([])
  const [etiquetas, setEtiquetas] = useState<{ingresos: string[], gastos: string[]}>({
    ingresos: [],
    gastos: []
  })

  // Hooks personalizados
  const recurrentes = useRecurrentes()
  // const analysis = useAnalysis(movimientos) // Temporalmente deshabilitado para debug

  // Sincronizar tema externo
  useEffect(() => {
    setIsDark(externalIsDark)
  }, [externalIsDark])

  // Función para formatear fecha para la API
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Función para obtener movimientos
  const fetchMovimientos = async () => {
    try {
      console.log('Fetching movimientos...')
      setIsLoading(true)
      const response = await axios.get('/api/movimientos/?todos=true&limit=100', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      console.log('Response received:', response.data?.length || 0, 'items')
      console.log('Response data type:', typeof response.data, 'isArray:', Array.isArray(response.data))
      console.log('Response status:', response.status, 'headers:', response.headers['content-type'])
      console.log('First item structure:', JSON.stringify(response.data?.[0], null, 2))
      
      if (Array.isArray(response.data)) {
        setMovimientos(response.data)
        console.log('✅ Movimientos loaded successfully:', response.data.length)
      } else {
        console.error('❌ API returned non-array:', typeof response.data)
        setMovimientos([])
      }
    } catch (error) {
      console.error('Error al obtener movimientos:', error)
      setMovimientos([]) // Set empty array on error
    } finally {
      console.log('Setting isLoading to false')
      setIsLoading(false)
    }
  }

  // Función para obtener etiquetas
  const fetchEtiquetasFromAPI = async () => {
    try {
      console.log('🔄 Fetching etiquetas from API...')
      const etiquetasData = await fetchEtiquetas()
      
      // Guardar etiquetas completas
      setEtiquetasCompletas(etiquetasData)
      
      // Convertir a formato legacy para compatibilidad
      const etiquetasLegacy = formatEtiquetasForLegacy(etiquetasData)
      setEtiquetas(etiquetasLegacy)
      
      console.log('✅ Etiquetas loaded:', {
        total: etiquetasData.length,
        ingresos: etiquetasLegacy.ingresos.length,
        gastos: etiquetasLegacy.gastos.length
      })
    } catch (error) {
      console.error('❌ Error al obtener etiquetas:', error)
      // Mantener arrays vacíos en caso de error
      setEtiquetas({ ingresos: [], gastos: [] })
      setEtiquetasCompletas([])
    }
  }

  // Cargar datos al iniciar
  useEffect(() => {
    fetchMovimientos()
    fetchEtiquetasFromAPI()
  }, [])




  // Manejar agregar nuevo item
  const handleAddItem = async () => {
    if (!newItem.etiqueta || !newItem.monto || !newItem.tipo) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar o crear movimiento del día
      let movimientoHoy = movimientos.find(m => m.fecha === today)
      
      if (!movimientoHoy) {
        const response = await axios.post('/api/movimientos/', { fecha: today })
        movimientoHoy = response.data
      }

      // Agregar el item al movimiento
      const itemData = {
        monto: parseFloat(newItem.monto),
        etiqueta: newItem.etiqueta,
        es_recurrente: false
      }

      const movimientoData = {
        fecha: today,
        ingresos: newItem.tipo === 'ingreso' ? [itemData] : [],
        gastos: newItem.tipo === 'gasto' ? [itemData] : []
      }

      await axios.post('/api/movimientos/', movimientoData)

      await fetchMovimientos()
      
      setShowAddForm(null)
      setNewItem({tipo: '', etiqueta: '', monto: ''})
    } catch (error) {
      console.error('Error al agregar item:', error)
    }
  }

  // Handlers para movimientos completos
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
      await axios.delete(`/api/movimientos/${movimientoToDelete.fecha}`)
      
      // Actualizar estado local inmediatamente (optimización de velocidad)
      setMovimientos(prev => prev.filter(m => m.fecha !== movimientoToDelete.fecha))
      
      setShowDeleteConfirm(false)
      setMovimientoToDelete(null)
    } catch (error) {
      console.error('❌ Error al eliminar movimiento:', error)
      alert('Error al eliminar el movimiento. Por favor, inténtalo de nuevo.')
    }
  }

  // Handlers para EditModal
  const handleDeleteItem = async (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => {
    const movimiento = movimientos.find(m => m.id === movimientoId)
    if (!movimiento) return

    try {
      const endpoint = tipo === 'ingreso'
        ? `/api/movimientos/${movimiento.fecha}/ingreso/${itemId}`
        : `/api/movimientos/${movimiento.fecha}/gasto/${itemId}`

      await axios.delete(endpoint)
      
      // Actualizar estado local inmediatamente (optimización de velocidad)
      setMovimientos(prev => prev.map(m => {
        if (m.fecha === movimiento.fecha) {
          if (tipo === 'ingreso') {
            const updatedIngresos = m.ingresos.filter(ing => ing.id !== itemId)
            return {
              ...m,
              ingresos: updatedIngresos,
              ingreso_total: updatedIngresos.reduce((sum, ing) => sum + ing.monto, 0),
              balance: updatedIngresos.reduce((sum, ing) => sum + ing.monto, 0) - m.total_gastos
            }
          } else {
            const updatedGastos = m.gastos.filter(gas => gas.id !== itemId)
            return {
              ...m,
              gastos: updatedGastos,
              total_gastos: updatedGastos.reduce((sum, gas) => sum + gas.monto, 0),
              balance: m.ingreso_total - updatedGastos.reduce((sum, gas) => sum + gas.monto, 0)
            }
          }
        }
        return m
      }))
    } catch (error) {
      console.error('Error al eliminar item:', error)
    }
  }

  const handleSaveChanges = async (movimiento: MovimientoDiario) => {
    try {
      const movimientoData = {
        fecha: movimiento.fecha,
        ingresos: movimiento.ingresos.map(ing => ({
          monto: ing.monto,
          etiqueta: ing.etiqueta
        })),
        gastos: movimiento.gastos.map(gas => ({
          monto: gas.monto,
          etiqueta: gas.etiqueta,
          es_recurrente: gas.es_recurrente || false
        }))
      }

      const response = await axios.post('/api/movimientos/', movimientoData)
      const movimientoActualizado = response.data
      
      // Actualizar estado local inmediatamente (optimización de velocidad)
      setMovimientos(prev => 
        prev.map(m => m.fecha === movimientoActualizado.fecha ? movimientoActualizado : m)
      )
      
      setShowEditModal(false)
    } catch (error) {
      console.error('❌ Error al guardar cambios:', error)
      
      // Mostrar error específico al usuario
      let errorMessage = 'Error al guardar los cambios del movimiento'
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || errorMessage
      } else if (error.response?.status === 404) {
        errorMessage = 'Movimiento no encontrado'
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  // Handlers para formulario inline de añadir movimiento
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
      // Crear el movimiento con la fecha seleccionada
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

      // Enviar al backend
      const response = await axios.post('/api/movimientos/', nuevoMovimiento)
      const movimientoCreado = response.data
      
      // Actualizar estado local inmediatamente (optimización de velocidad)
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== newMovementDate)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      // Mostrar confetti solo si el balance final es positivo y > 150€
      const balance = ingresoTotal - totalGastos
      if (balance > 150) {
        triggerConfetti()
      }
      
      // Limpiar el formulario
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
    console.log('🔄 Toggle Add Form - Before:', showAddForm)
    setShowAddForm(!showAddForm)
    console.log('🔄 Toggle Add Form - After:', !showAddForm)
    // Limpiar formulario al cerrar
    if (showAddForm) {
      setTempIncomes([])
      setTempExpenses([])
      setNewIncome({ etiqueta: '', monto: '' })
      setNewExpense({ etiqueta: '', monto: '' })
      setNewMovementDate(new Date().toISOString().split('T')[0])
      console.log('🧹 Form cleaned')
    }
  }

  const handleCreateNewTag = (field: string, tipo: 'ingreso' | 'gasto') => {
    setPendingTagField(field)
    setCreateTagType(tipo)
    setShowCreateTagModal(true)
  }

  const handleCreateTagConfirm = async (tagName: string) => {
    try {
      console.log('🔄 Creando etiqueta:', tagName, 'tipo:', createTagType)
      
      // Crear etiqueta en backend
      const nuevaEtiqueta = await createEtiqueta({
        nombre: tagName.trim(),
        tipo: createTagType,
        es_predefinida: false,
        es_esencial: false
      })
      
      console.log('✅ Etiqueta creada exitosamente:', nuevaEtiqueta)
      
      // Actualizar estado completo de etiquetas
      setEtiquetasCompletas(prev => [...prev, nuevaEtiqueta])
      
      // Actualizar formato legacy
      if (createTagType === 'ingreso') {
        setEtiquetas(prev => ({ ...prev, ingresos: [...prev.ingresos, tagName] }))
        // Para el EditModal (código legacy)
        if (pendingTagField === 'newIncome.etiqueta') {
          setNewIncome(prev => ({ ...prev, etiqueta: tagName }))
        }
      } else {
        setEtiquetas(prev => ({ ...prev, gastos: [...prev.gastos, tagName] }))
        // Para el EditModal (código legacy)
        if (pendingTagField === 'newExpense.etiqueta') {
          setNewExpense(prev => ({ ...prev, etiqueta: tagName }))
        }
      }

      // Notificar al AddMovementForm sobre la nueva etiqueta
      handleNewTagCreatedCallback(pendingTagField, tagName)
      
      // Cerrar modal
      setShowCreateTagModal(false)
      setPendingTagField('')
      
    } catch (error) {
      console.error('❌ Error al crear etiqueta:', error)
      
      // Mostrar error al usuario
      let errorMessage = 'Error al crear la etiqueta'
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || errorMessage
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  // Estado para comunicarse con AddMovementForm sobre nuevas etiquetas
  const [newTagCreated, setNewTagCreated] = useState<{field: string, tagName: string} | null>(null)

  const handleNewTagCreatedCallback = (field: string, tagName: string) => {
    setNewTagCreated({ field, tagName })
    // Limpiar después de un breve delay para permitir que el AddMovementForm procese
    setTimeout(() => setNewTagCreated(null), 100)
  }

  // Nueva función para el componente AddMovementForm
  const handleSaveMovementFromForm = async (movement: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number }>
  }) => {
    console.log('💾 Saving movement from form:', movement)
    
    try {
      const ingresoTotal = movement.ingresos.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = movement.gastos.reduce((sum, item) => sum + item.monto, 0)

      const nuevoMovimiento = {
        fecha: movement.fecha,
        ingreso_total: ingresoTotal,
        ingresos: movement.ingresos.map(item => ({
          id: Date.now() + Math.random(),
          etiqueta: item.etiqueta,
          monto: item.monto,
          fecha: movement.fecha
        })),
        gastos: movement.gastos.map(item => ({
          id: Date.now() + Math.random(),
          etiqueta: item.etiqueta,
          monto: item.monto,
          fecha: movement.fecha
        })),
        total_gastos: totalGastos,
        balance: ingresoTotal - totalGastos
      }

      console.log('📤 Sending to API:', nuevoMovimiento)

      // Enviar al backend
      const response = await axios.post('/api/movimientos/', nuevoMovimiento)
      const movimientoCreado = response.data
      
      // Actualizar estado local inmediatamente (optimización de velocidad)
      setMovimientos(prev => {
        const filtered = prev.filter(m => m.fecha !== movement.fecha)
        return [movimientoCreado, ...filtered].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      })
      
      // Mostrar confetti solo si el balance final es positivo y > 150€
      const balance = ingresoTotal - totalGastos
      if (balance > 150) {
        triggerConfetti()
      }
      
      // Cerrar formulario
      setShowAddForm(false)
      
    } catch (error) {
      console.error('❌ Error al crear movimiento:', error)
      alert('Error al crear el movimiento. Por favor, inténtalo de nuevo.')
    }
  }

  // Debug: Mostrar estado de carga
  console.log('AppRefactored - isLoading:', isLoading, 'movimientos:', movimientos.length)
  
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className={`text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header original restaurado */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDark ? 'border-gray-700' : ''} py-4`}>
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <div className="flex-1 w-3/4">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-pink-300/70 hover:border-pink-400/80 transition-colors duration-300">
                <img 
                  src="/Logo1.png" 
                  alt="Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <div className="w-1/4 flex items-center justify-end">
              <Navigation
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isDark={isDark}
                onToggleDark={onToggleDark}
                setIsDark={setIsDark}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {showYearlyBreakdown ? (
          <YearlyBreakdownView
            movimientos={movimientos}
            isDark={isDark}
            onBack={() => setShowYearlyBreakdown(false)}
            onGoToMonthly={(month, year) => {
              setSelectedMonthYear({ month, year })
              setShowYearlyBreakdown(false)
              setShowMonthlyBreakdown(true)
            }}
          />
        ) : showMonthlyBreakdown ? (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowMonthlyBreakdown(false)}
                className={`group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver
                </span>
              </button>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Desglose mensual - {new Date(selectedMonthYear.year, selectedMonthYear.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Vista de desglose mensual en desarrollo...
            </p>
          </div>
        ) : activeSection === 'historial' ? (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Contenido principal - 3/4 del ancho */}
            <div className="lg:col-span-3">
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
            
            {/* Panel lateral de resumen - 1/4 del ancho */}
            <div className="lg:col-span-1">
              <SummaryPanel
                movimientos={movimientos}
                isDark={isDark}
                onShowMonthlyBreakdown={() => setShowMonthlyBreakdown(true)}
                onShowYearlyBreakdown={() => setShowYearlyBreakdown(true)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">

          {activeSection === 'buscar' && (
            <BusquedaView
              movimientos={movimientos}
              isDark={isDark}
              onEditMovimiento={handleEditMovimiento}
              onDeleteMovimiento={handleDeleteMovimiento}
            />
          )}

          {activeSection === 'etiquetas' && (
            <EtiquetasView
              etiquetas={etiquetas}
              isDark={isDark}
              onCreateEtiqueta={() => alert('Crear nueva etiqueta')}
              onEditEtiqueta={(etiqueta) => alert(`Editar ${etiqueta}`)}
              onDeleteEtiqueta={(etiqueta) => alert(`Borrar ${etiqueta}`)}
            />
          )}

          {activeSection === 'recurrentes' && (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Gastos Recurrentes
              </h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Vista en desarrollo...
              </p>
            </div>
          )}

          {activeSection === 'analisis' && (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Análisis Financiero
              </h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Vista en desarrollo...
              </p>
            </div>
          )}

          </div>
        )}
      </div>

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

      {/* Modal de agregar movimiento */}
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
    </div>
  )
}

export default AppRefactored

