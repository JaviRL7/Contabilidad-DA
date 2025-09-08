import React from 'react'
import MovementCard from '../dashboard/MovementCard'
import Pagination from '../dashboard/Pagination'
import { usePagination } from '../../hooks/usePagination'
import AddMovementForm from '../forms/AddMovementForm'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface HistorialViewProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
  showAddForm: boolean
  onToggleAddForm: () => void
  onSaveNewMovement: (movement: {
    fecha: string
    ingresos: Array<{ etiqueta: string, monto: number }>
    gastos: Array<{ etiqueta: string, monto: number }>
  }) => void
  etiquetas: { ingresos: string[], gastos: string[] }
  onCreateNewTag: (field: string, tipo: 'ingreso' | 'gasto') => void
  newTagCreated?: {field: string, tagName: string} | null
}

const HistorialView: React.FC<HistorialViewProps> = ({
  movimientos,
  isDark,
  onEditMovimiento,
  onDeleteMovimiento,
  showAddForm,
  onToggleAddForm,
  onSaveNewMovement,
  etiquetas,
  onCreateNewTag,
  newTagCreated
}) => {
  console.log('📋 HistorialView render - showAddForm:', showAddForm)
  const today = new Date().toISOString().split('T')[0]
  
  // Ordenar movimientos por fecha ascendente (día 1 arriba, día 31 abajo)
  const sortedMovimientos = [...movimientos].sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })

  const pagination = usePagination({
    data: sortedMovimientos,
    itemsPerPage: 6,
    maxPages: 5 // Máximo 5 páginas (30 movimientos)
  })

  return (
    <div>
      {/* Botón agregar movimiento */}
      <div className="mb-6">
        <button
          onClick={onToggleAddForm}
          className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDark
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Añadir Movimiento
          </span>
        </button>
      </div>

      {/* Componente nuevo simple para agregar movimiento */}
      {showAddForm && (
        <AddMovementForm
          isDark={isDark}
          etiquetas={etiquetas}
          onSave={onSaveNewMovement}
          onCancel={onToggleAddForm}
          onCreateNewTag={onCreateNewTag}
          newTagCreated={newTagCreated}
        />
      )}
      
      <div className="grid gap-6">
        {pagination.currentData.map((movimiento) => {
          const isToday = movimiento.fecha === today
          const tieneGastosRecurrentes = movimiento.gastos.some(gasto => 
            gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1'
          )
          
          return (
            <MovementCard
              key={movimiento.id}
              movimiento={movimiento}
              isDark={isDark}
              isToday={isToday}
              tieneGastosRecurrentes={tieneGastosRecurrentes}
              onEditMovimiento={onEditMovimiento}
              onDeleteMovimiento={onDeleteMovimiento}
            />
          )
        })}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        onNext={pagination.nextPage}
        onPrev={pagination.prevPage}
        onGoToPage={pagination.goToPage}
        isDark={isDark}
      />
    </div>
  )
}

export default HistorialView