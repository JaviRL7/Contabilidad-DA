import React from 'react'
import MovementCard from '../dashboard/MovementCard'
import Pagination from '../dashboard/Pagination'
import { usePagination } from '../../hooks/usePagination'
import AddMovementForm from '../forms/AddMovementForm'
import WeeklyIncomeChart from '../charts/WeeklyIncomeChart'

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
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  // Ordenar movimientos por fecha ascendente (día 1 arriba, día 31 abajo)
  const sortedMovimientos = [...movimientos].sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })

  const pagination = usePagination({
    data: sortedMovimientos,
    itemsPerPage: 6,
    maxPages: 5 // Máximo 5 páginas (30 movimientos)
  })

  // Calcular resúmenes
  const todayMovement = movimientos.find(m => m.fecha === today)
  const todayIngresos = todayMovement?.ingreso_total || 0
  const todayGastos = todayMovement?.total_gastos || 0
  const todayBalance = todayMovement?.balance || 0

  const monthlyMovements = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  const monthlyIngresos = monthlyMovements.reduce((sum, m) => sum + (m.ingreso_total || 0), 0)
  const monthlyGastos = monthlyMovements.reduce((sum, m) => sum + (m.total_gastos || 0), 0)
  const monthlyBalance = monthlyIngresos - monthlyGastos

  const yearlyMovements = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  const yearlyIngresos = yearlyMovements.reduce((sum, m) => sum + (m.ingreso_total || 0), 0)
  const yearlyGastos = yearlyMovements.reduce((sum, m) => sum + (m.total_gastos || 0), 0)
  const yearlyBalance = yearlyIngresos - yearlyGastos

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Formulario de agregar movimiento */}
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

      {/* Texto de movimientos registrados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
        <div className="lg:col-span-2 flex items-center gap-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Movimientos Registrados
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {movimientos.length} movimientos
          </span>
        </div>
        <div className="lg:col-span-1 flex justify-end">
          <button
            onClick={onToggleAddForm}
            className="rounded-lg font-medium transition-all duration-200 flex items-center gap-1 shadow-md px-6 py-3 text-base bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-5 h-5 mr-2" aria-hidden="true">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            {showAddForm ? 'Cerrar Formulario' : 'Nuevo Movimiento'}
          </button>
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Movimientos */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
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

          <div className="mt-6">
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
        </div>

        {/* Columna derecha - Resúmenes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resumen de Hoy */}
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2 text-center text-white">Hoy</h3>
            <p className="text-sm mb-4 text-center text-gray-400">{new Date().toLocaleDateString('es-ES')}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-500 font-medium">Ingresos:</span>
                <span className="text-lg font-bold text-green-500">{todayIngresos.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-500 font-medium">Gastos:</span>
                <span className="text-lg font-bold text-red-500">{todayGastos.toFixed(2)}€</span>
              </div>
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-500">Balance:</span>
                <span className="font-bold text-blue-500">{todayBalance.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Resumen Mensual */}
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-center text-white">Total del Mes</h3>
            <p className="text-xs mb-4 text-center text-gray-400">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3">
                <span className="text-green-500 font-medium">Ingresos</span>
                <span className="text-lg font-bold text-green-500">{monthlyIngresos.toFixed(2)}€</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
              <div className="flex justify-between items-center py-2 px-3">
                <span className="text-red-500 font-medium">Gastos</span>
                <span className="text-lg font-bold text-red-500">{monthlyGastos.toFixed(2)}€</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
              <div className="pt-2 mt-3">
                <div className="flex justify-between items-center py-2 px-3">
                  <span className="text-blue-500 font-medium">Balance</span>
                  <span className="text-lg font-bold text-blue-500">{monthlyBalance.toFixed(2)}€</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3">
              <button className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500" title="Ver desglose mensual">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column" aria-hidden="true">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
                Ver Desglose Mensual
              </button>
            </div>
          </div>

          {/* Resumen Anual */}
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-center text-white">Total del Año</h3>
            <p className="text-xs mb-4 text-center text-gray-400">Año {new Date().getFullYear()}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-green-500 font-medium">Ingresos</span>
                <span className="text-lg font-bold text-green-500">{yearlyIngresos.toFixed(2)}€</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-red-500 font-medium">Gastos</span>
                <span className="text-lg font-bold text-red-500">{yearlyGastos.toFixed(2)}€</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
              <div className="pt-2 mt-3">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-blue-500 font-medium">Balance</span>
                  <span className="text-lg font-bold text-blue-500">{yearlyBalance.toFixed(2)}€</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3">
              <button className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500" title="Ver desglose anual">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true">
                  <path d="M16 7h6v6"></path>
                  <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                </svg>
                Ver Desglose Anual
              </button>
            </div>
          </div>

          {/* Gráfica de ingresos por día de la semana */}
          <WeeklyIncomeChart 
            movimientos={movimientos}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  )
}

export default HistorialView