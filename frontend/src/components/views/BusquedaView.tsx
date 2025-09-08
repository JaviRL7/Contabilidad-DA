import React, { useState, useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import MovementCard from '../dashboard/MovementCard'
import { useSearch } from '../../hooks/useSearch'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../dashboard/Pagination'
import DatePicker from 'react-datepicker'
import { parseISO } from 'date-fns'

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
}

const BusquedaView: React.FC<BusquedaViewProps> = ({
  movimientos,
  isDark,
  onEditMovimiento,
  onDeleteMovimiento
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
    
    const params: any = {}
    
    if (searchQuery.trim()) {
      params.etiqueta = searchQuery.trim()
    }
    
    if (fechaDesde) {
      params.fechaDesde = formatDateForAPI(fechaDesde)
    }
    
    if (fechaHasta) {
      params.fechaHasta = formatDateForAPI(fechaHasta)
    }
    
    search.updateSearchParam('etiqueta', params.etiqueta)
    setHasSearched(true)
    // TODO: Implementar filtros de fecha en useSearch
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

  return (
    <Card isDark={isDark}>
      <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Buscar Movimientos
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
            <Button variant="primary" onClick={handleSearch} isDark={isDark}>
              Buscar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant="secondary" onClick={clearSearch} isDark={isDark}>
          Limpiar filtros
        </Button>
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
          <div className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Se encontraron {search.filteredMovimientos.length} resultado(s)
          </div>
          
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
        </>
      )}
    </Card>
  )
}

export default BusquedaView