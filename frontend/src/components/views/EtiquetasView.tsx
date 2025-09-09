import React, { useState } from 'react'
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
  // Debug: Verificar qué datos llegan al componente
  console.log('🏷️ EtiquetasView - Datos recibidos:')
  console.log('- movimientos:', movimientos?.length || 0, 'items')
  console.log('- etiquetas:', etiquetas)
  console.log('- Primer movimiento:', movimientos?.[0])

  // Estados para modales
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState<{name: string, type: 'gasto' | 'ingreso'} | null>(null)

  // Combinar todas las etiquetas y eliminar duplicados
  const todasLasEtiquetas = [...new Set([...etiquetas.ingresos, ...etiquetas.gastos])].sort()
  
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
    } else {
      console.warn('No se pudo eliminar la etiqueta:', { selectedTag, onDeleteEtiqueta })
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

    console.log(`Etiqueta: ${tagName}`)
    console.log('Todos los movimientos:', allMovements.length)
    console.log('Movimientos de esta etiqueta:', tagMovements)
    console.log('Total encontrado:', totalAmount)
    
    return { count: tagMovements.length, total: totalAmount }
  }

  const EtiquetaItem = ({ etiqueta, tipo }: { etiqueta: string, tipo: 'gasto' | 'ingreso' }) => {
    const esEsencial = etiquetasEsenciales.includes(etiqueta.toLowerCase())
    const movementInfo = getTagMovementInfo(etiqueta)
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
        isDark 
          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
          : tipo === 'ingreso' 
            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
            : 'bg-red-50 border-red-200 hover:bg-red-100'
      }`}>
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
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestión de Etiquetas
          </h2>
          <GradientButton 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
            isDark={isDark}
          >
            + Nueva
          </GradientButton>
        </div>

        {/* Layout de dos columnas más compacto */}
        <div className="grid md:grid-cols-2 gap-6">
        {/* Etiquetas de Ingresos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Ingresos
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
            }`}>
              {etiquetasIngresos.length}
            </span>
          </div>
          
          {etiquetasIngresos.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sin etiquetas de ingresos
            </p>
          ) : (
            <div className="space-y-2">
              {etiquetasIngresos.map((etiqueta) => (
                <EtiquetaItem key={`ingreso-${etiqueta}`} etiqueta={etiqueta} tipo="ingreso" />
              ))}
            </div>
          )}
        </div>

        {/* Etiquetas de Gastos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Gastos
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
            }`}>
              {etiquetasGastos.length}
            </span>
          </div>
          
          {etiquetasGastos.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sin etiquetas de gastos
            </p>
          ) : (
            <div className="space-y-2">
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
      </Card>
    </div>
  )
}

export default EtiquetasView