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
          className={`px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2 ${
            isDark
              ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-md'
              : 'bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-white shadow-md'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showAddForm ? 'Cerrar Formulario' : 'Añadir Movimiento'}
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