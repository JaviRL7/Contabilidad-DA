import React, { useState, useEffect } from 'react'
import Card from '../ui/Card'
import MovementCard from '../dashboard/MovementCard'
import { useSearch } from '../../hooks/useSearch'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../dashboard/Pagination'
import DatePicker from 'react-datepicker'
import { parseISO } from 'date-fns'
import WeeklyIncomeChart from '../charts/WeeklyIncomeChart'
import { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'

registerLocale('es', es)

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface BusquedaViewProps {
  movimientos: MovimientoDiario[]
  isDark: boolean
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
  onShowMonthlyBreakdown?: () => void
  onShowYearlyBreakdown?: () => void
}

const BusquedaView: React.FC<BusquedaViewProps> = ({
  movimientos,
  isDark,
  onEditMovimiento,
  onDeleteMovimiento,
  onShowMonthlyBreakdown,
  onShowYearlyBreakdown
}) => {
  const search = useSearch(movimientos)
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null)
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const handleSearch = () => {
    // Solo buscar si hay algún criterio de búsqueda
    if (!searchQuery.trim() && !fechaDesde && !fechaHasta) {
      return
    }
    
    // Limpiar parámetros previos
    search.clearSearch()
    
    // Aplicar filtro de etiqueta si existe
    if (searchQuery.trim()) {
      search.updateSearchParam('etiqueta', searchQuery.trim())
    }
    
    // Aplicar filtros de fecha
    if (fechaDesde) {
      const mes = fechaDesde.getMonth()
      const año = fechaDesde.getFullYear()
      search.updateSearchParam('mes', mes)
      search.updateSearchParam('año', año)
    }
    
    setHasSearched(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setFechaDesde(null)
    setFechaHasta(null)
    search.clearSearch()
    setHasSearched(false)
  }

  const pagination = usePagination({
    data: hasSearched ? search.filteredMovimientos : [],
    itemsPerPage: 6
  })

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  // Calcular resúmenes basados en resultados de búsqueda
  const searchResults = hasSearched ? search.filteredMovimientos : []
  
  const todayMovement = searchResults.find(m => m.fecha === today)
  const todayIngresos = todayMovement?.ingreso_total || 0
  const todayGastos = todayMovement?.total_gastos || 0
  const todayBalance = todayMovement?.balance || 0

  const monthlyMovements = searchResults.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  const monthlyIngresos = monthlyMovements.reduce((sum, m) => sum + (m.ingreso_total || 0), 0)
  const monthlyGastos = monthlyMovements.reduce((sum, m) => sum + (m.total_gastos || 0), 0)
  const monthlyBalance = monthlyIngresos - monthlyGastos

  const yearlyMovements = searchResults.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  const yearlyIngresos = yearlyMovements.reduce((sum, m) => sum + (m.ingreso_total || 0), 0)
  const yearlyGastos = yearlyMovements.reduce((sum, m) => sum + (m.total_gastos || 0), 0)
  const yearlyBalance = yearlyIngresos - yearlyGastos

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Buscar Movimientos
        </h1>
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Búsqueda y resultados */}
        <div className="lg:col-span-2">
          {/* Formulario de búsqueda */}
          <div className={`rounded-lg shadow transition-all duration-200 p-6 mb-8 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Filtros de Búsqueda
            </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Buscar por fecha
                  </label>
                  <div className="flex gap-2">
                    <DatePicker
                      selected={fechaDesde}
                      onChange={(date) => setFechaDesde(date)}
                      placeholderText="Desde"
                      dateFormat="dd/MM/yyyy"
                      locale="es"
                      className={`w-full flex-1 px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      wrapperClassName="flex-1"
                    />
                    <DatePicker
                      selected={fechaHasta}
                      onChange={(date) => setFechaHasta(date)}
                      placeholderText="Hasta"
                      dateFormat="dd/MM/yyyy"
                      locale="es"
                      className={`w-full flex-1 px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      wrapperClassName="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Buscar por etiqueta
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Escribe una etiqueta..."
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Buscar
                </button>
                <button
                  onClick={clearSearch}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                  Limpiar
                </button>
              </div>
          </div>

          {/* Resultados */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resultados de Búsqueda
            </h2>
            {hasSearched && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
              }`}>
                {search.filteredMovimientos.length} resultados
              </span>
            )}
          </div>

          {!hasSearched ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Introduce un término de búsqueda para encontrar movimientos específicos.
            </div>
          ) : pagination.currentData.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No se encontraron resultados para tu búsqueda.
            </div>
          ) : (
            <>
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
            </>
          )}
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
              <button 
                onClick={onShowMonthlyBreakdown}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500" 
                title="Ver desglose mensual"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"/>
                  <path d="M16 2v4"/>
                  <rect width="18" height="18" x="3" y="4" rx="2"/>
                  <path d="M3 10h18"/>
                  <path d="M8 14h.01"/>
                  <path d="M12 14h.01"/>
                  <path d="M16 14h.01"/>
                  <path d="M8 18h.01"/>
                  <path d="M12 18h.01"/>
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
              <button 
                onClick={onShowYearlyBreakdown}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500" 
                title="Ver desglose anual"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
                  <path d="M7 11v8"/>
                  <path d="M11 7v12"/>
                  <path d="M15 3v16"/>
                  <path d="M19 8v11"/>
                </svg>
                Ver Desglose Anual
              </button>
            </div>
          </div>

          {/* Gráfica de ingresos por día de la semana */}
          <WeeklyIncomeChart 
            movimientos={hasSearched ? search.filteredMovimientos : movimientos}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  )
}

export default BusquedaView