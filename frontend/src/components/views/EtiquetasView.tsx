import React, { useState, useMemo } from 'react'
import Card from '../ui/Card'
import GradientButton from '../ui/GradientButton'
import ActionButton from '../ui/ActionButton'
import TagStatsModal from '../modals/TagStatsModal'
import EditTagModal from '../modals/EditTagModal'
import DeleteTagConfirmModal from '../modals/DeleteTagConfirmModal'
import CreateTagModal from '../modals/CreateTagModal'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface EtiquetasViewProps {
  etiquetas: {ingresos: string[], gastos: string[]}
  isDark: boolean
  etiquetasEsenciales?: string[]
  movimientos?: MovimientoDiario[]
  onCreateEtiqueta?: (name: string, type: 'gasto' | 'ingreso', isEssential?: boolean) => void
  onEditEtiqueta?: (oldName: string, newName: string, newType: 'gasto' | 'ingreso') => void  
  onDeleteEtiqueta?: (etiqueta: string) => void
  onViewEtiqueta?: (etiqueta: string) => void
}

const EtiquetasView: React.FC<EtiquetasViewProps> = ({
  etiquetas,
  isDark,
  etiquetasEsenciales = [],
  movimientos = [],
  onCreateEtiqueta,
  onEditEtiqueta,
  onDeleteEtiqueta,
  onViewEtiqueta
}) => {

  // Estados para modales
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState<{name: string, type: 'gasto' | 'ingreso'} | null>(null)

  // Combinar todas las etiquetas y eliminar duplicados
  const todasLasEtiquetas = [...new Set([...(etiquetas.ingresos || []), ...(etiquetas.gastos || [])])].sort()
  
  // Separar por tipo
  const etiquetasIngresos = etiquetas.ingresos.sort()
  const etiquetasGastos = etiquetas.gastos.sort()

  // Función para calcular estadísticas de una etiqueta
  const calculateTagStats = (tagName: string, tagType: 'gasto' | 'ingreso') => {
    if (!movimientos || movimientos.length === 0) {
      return {
        etiqueta: tagName,
        tipo: tagType,
        totalMovimientos: 0,
        montoTotal: 0,
        promedioMensual: 0,
        ultimoMovimiento: '',
        porcentajeDelTotal: 0,
        movimientosPorMes: []
      }
    }

    const allMovements = movimientos.flatMap(mov => {
      const ingresos = Array.isArray(mov.ingresos) ? mov.ingresos.map(ing => ({...ing, fecha: mov.fecha})) : []
      const gastos = Array.isArray(mov.gastos) ? mov.gastos.map(gas => ({...gas, fecha: mov.fecha})) : []
      return [...ingresos, ...gastos]
    })

    const tagMovements = allMovements.filter(mov => {
      if (!mov || !mov.etiqueta) return false
      return mov.etiqueta.toLowerCase().trim() === tagName.toLowerCase().trim()
    })
    
    const totalAmount = tagMovements.reduce((sum, mov) => {
      const amount = parseFloat(mov.monto) || 0
      return sum + amount
    }, 0)
    const lastMovement = tagMovements.length > 0 
      ? tagMovements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0].fecha
      : null
    
    // Calcular movimientos por mes
    const movementsByMonth = tagMovements.reduce((acc, mov) => {
      const date = new Date(mov.fecha)
      const monthKey = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      
      if (!acc[monthKey]) {
        acc[monthKey] = { cantidad: 0, monto: 0 }
      }
      acc[monthKey].cantidad += 1
      acc[monthKey].monto += mov.monto
      
      return acc
    }, {} as Record<string, {cantidad: number, monto: number}>)

    const movimientosPorMes = Object.entries(movementsByMonth).map(([mes, data]) => ({
      mes,
      cantidad: data.cantidad,
      monto: data.monto
    })).sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime())

    // Calcular porcentaje del total
    const totalGlobalAmount = tagType === 'ingreso' 
      ? movimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0)
      : movimientos.reduce((sum, mov) => sum + mov.total_gastos, 0)
    
    const percentage = totalGlobalAmount > 0 ? (totalAmount / totalGlobalAmount) * 100 : 0

    return {
      etiqueta: tagName,
      tipo: tagType,
      totalMovimientos: tagMovements.length,
      montoTotal: totalAmount,
      promedioMensual: movimientosPorMes.length > 0 ? totalAmount / movimientosPorMes.length : 0,
      ultimoMovimiento: lastMovement || '',
      porcentajeDelTotal: percentage,
      movimientosPorMes
    }
  }

  const handleVer = (etiqueta: string, tipo: 'gasto' | 'ingreso') => {
    setSelectedTag({name: etiqueta, type: tipo})
    setShowStatsModal(true)
  }

  const handleEditar = (etiqueta: string, tipo: 'gasto' | 'ingreso') => {
    setSelectedTag({name: etiqueta, type: tipo})
    setShowEditModal(true)
  }

  const handleBorrar = (etiqueta: string, tipo: 'gasto' | 'ingreso') => {
    setSelectedTag({name: etiqueta, type: tipo})
    setShowDeleteModal(true)
  }

  const handleCreateTag = (name: string, type: 'gasto' | 'ingreso', isEssential?: boolean) => {
    if (onCreateEtiqueta) {
      onCreateEtiqueta(name, type, isEssential)
    }
  }

  const handleEditTag = (oldName: string, newName: string, newType: 'gasto' | 'ingreso', isEssential?: boolean) => {
    if (onEditEtiqueta) {
      onEditEtiqueta(oldName, newName, newType)
    }
    // Aquí se debería manejar también el cambio de estado esencial
    // Esto depende de cómo se implemente en el componente padre
  }

  const handleDeleteTag = () => {
    if (selectedTag && onDeleteEtiqueta) {
      onDeleteEtiqueta(selectedTag.name)
    }
    setShowDeleteModal(false)
    setSelectedTag(null)
  }

  const getTagMovementInfo = (tagName: string) => {
    if (!movimientos || movimientos.length === 0) {
      return { count: 0, total: 0 }
    }

    const allMovements = movimientos.flatMap(mov => {
      const ingresos = Array.isArray(mov.ingresos) ? mov.ingresos.map(ing => ({...ing, fecha: mov.fecha})) : []
      const gastos = Array.isArray(mov.gastos) ? mov.gastos.map(gas => ({...gas, fecha: mov.fecha})) : []
      return [...ingresos, ...gastos]
    })

    const tagMovements = allMovements.filter(mov => {
      if (!mov || !mov.etiqueta) return false
      return mov.etiqueta.toLowerCase().trim() === tagName.toLowerCase().trim()
    })

    const totalAmount = tagMovements.reduce((sum, mov) => {
      const amount = parseFloat(mov.monto) || 0
      return sum + amount
    }, 0)

    
    return { count: tagMovements.length, total: totalAmount }
  }

  const EtiquetaItem = ({ etiqueta, tipo }: { etiqueta: string, tipo: 'gasto' | 'ingreso' }) => {
    const esEsencial = etiquetasEsenciales.includes(etiqueta.toLowerCase())
    const movementInfo = useMemo(() => getTagMovementInfo(etiqueta), [etiqueta, movimientos])
    
    return (
      <Card isDark={isDark} className={`p-4 transition-all duration-200 hover:shadow-lg ${
        tipo === 'ingreso' 
          ? isDark ? 'hover:border-green-400/50' : 'hover:border-green-300'
          : isDark ? 'hover:border-red-400/50' : 'hover:border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {etiqueta}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                tipo === 'ingreso'
                  ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                  : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
              </span>
              {esEsencial && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                  isDark 
                    ? 'bg-amber-900/30 text-amber-300' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  Esencial
                </span>
              )}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {movementInfo.count > 0 ? (
                <>
                  {movementInfo.count} mov • {new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(movementInfo.total)}
                </>
              ) : (
                'Sin movimientos'
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <ActionButton
              variant="view"
              onClick={() => handleVer(etiqueta, tipo)}
              isDark={isDark}
            >
              Ver
            </ActionButton>
            <ActionButton
              variant="edit"
              onClick={() => handleEditar(etiqueta, tipo)}
              isDark={isDark}
            >
              Editar
            </ActionButton>
            <ActionButton
              variant="delete"
              onClick={() => handleBorrar(etiqueta, tipo)}
              isDark={isDark}
            >
              Borrar
            </ActionButton>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header elegante */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestión de Etiquetas
          </h1>
          <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Organiza y administra tus categorías de ingresos y gastos
          </p>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {todasLasEtiquetas.length}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total de etiquetas
            </p>
          </Card>
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {etiquetasIngresos.length}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Etiquetas de ingresos
            </p>
          </Card>
          <Card isDark={isDark} className="text-center p-6">
            <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {etiquetasGastos.length}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Etiquetas de gastos
            </p>
          </Card>
        </div>

        {/* Botón para crear nueva etiqueta */}
        <div className="text-center">
          <GradientButton 
            variant="primary" 
            size="lg"
            onClick={() => setShowCreateModal(true)}
            isDark={isDark}
            className="px-8 py-3"
          >
            + Nueva Etiqueta
          </GradientButton>
        </div>
      </div>

      {/* Secciones de etiquetas con diseño mejorado */}
      <div className="space-y-12">
        {/* Sección de Ingresos */}
        <div>
          <div className={`flex items-center justify-center mb-6 pb-3 border-b-2 ${isDark ? 'border-green-400/30' : 'border-green-300/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Etiquetas de Ingresos
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {etiquetasIngresos.length} etiquetas
              </span>
            </div>
          </div>
          
          {etiquetasIngresos.length === 0 ? (
            <Card isDark={isDark} className="text-center py-12">
              <div className={`text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                
              </div>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No tienes etiquetas de ingresos aún
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Crea tu primera etiqueta de ingreso para comenzar a organizar tus finanzas
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {etiquetasIngresos.map((etiqueta) => (
                <EtiquetaItem key={`ingreso-${etiqueta}`} etiqueta={etiqueta} tipo="ingreso" />
              ))}
            </div>
          )}
        </div>

        {/* Sección de Gastos */}
        <div>
          <div className={`flex items-center justify-center mb-6 pb-3 border-b-2 ${isDark ? 'border-red-400/30' : 'border-red-300/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-red-600/20' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Etiquetas de Gastos
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {etiquetasGastos.length} etiquetas
              </span>
            </div>
          </div>
          
          {etiquetasGastos.length === 0 ? (
            <Card isDark={isDark} className="text-center py-12">
              <div className={`text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                
              </div>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No tienes etiquetas de gastos aún
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Crea tu primera etiqueta de gasto para comenzar a categorizar tus gastos
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {etiquetasGastos.map((etiqueta) => (
                <EtiquetaItem key={`gasto-${etiqueta}`} etiqueta={etiqueta} tipo="gasto" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <TagStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        isDark={isDark}
        data={selectedTag ? calculateTagStats(selectedTag.name, selectedTag.type) : null}
      />

      <EditTagModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditTag}
        isDark={isDark}
        tagName={selectedTag?.name || ''}
        currentType={selectedTag?.type || 'gasto'}
        isCurrentlyEssential={selectedTag ? etiquetasEsenciales.includes(selectedTag.name.toLowerCase()) : false}
      />

      <DeleteTagConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTag}
        isDark={isDark}
        tagName={selectedTag?.name || ''}
        tagType={selectedTag?.type || 'gasto'}
        movementsCount={selectedTag ? getTagMovementInfo(selectedTag.name).count : 0}
        totalAmount={selectedTag ? getTagMovementInfo(selectedTag.name).total : 0}
      />

      <CreateTagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTag}
        isDark={isDark}
        existingTags={todasLasEtiquetas}
      />
    </div>
  )
}

export default EtiquetasView