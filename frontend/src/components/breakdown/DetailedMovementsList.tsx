import React from 'react'
import { Filter, Edit, Trash2 } from 'lucide-react'
import Card from '../ui/Card'
import GradientButton from '../ui/GradientButton'
import ActionButton from '../ui/ActionButton'
import { formatEuro } from '../../utils/formatters'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface WeeklyData {
  [weekName: string]: MovimientoDiario[]
}

interface DetailedMovementsListProps {
  weeklyData: WeeklyData
  filterType: 'all' | 'ingreso' | 'gasto'
  isDark: boolean
  onFilterChange: (filter: 'all' | 'ingreso' | 'gasto') => void
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
}

const DetailedMovementsList: React.FC<DetailedMovementsListProps> = ({
  weeklyData,
  filterType,
  isDark,
  onFilterChange,
  onEditMovimiento,
  onDeleteMovimiento
}) => {
  return (
    <Card variant="default" isDark={isDark}>
      <div className="p-6">
        {/* Header con controles */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Movimientos Detallados
          </h3>
          <div className="flex gap-2">
            <GradientButton
              variant={filterType === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onFilterChange('all')}
              isDark={isDark}
            >
              <Filter className="w-4 h-4 mr-1" />
              Todos
            </GradientButton>
            <GradientButton
              variant={filterType === 'ingreso' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => onFilterChange('ingreso')}
              isDark={isDark}
            >
              Ingresos
            </GradientButton>
            <GradientButton
              variant={filterType === 'gasto' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => onFilterChange('gasto')}
              isDark={isDark}
            >
              Gastos
            </GradientButton>
          </div>
        </div>

        {/* Tabla header */}
        <div className={`grid grid-cols-12 gap-4 py-3 px-4 mb-4 rounded-lg border-b-2 ${
          isDark 
            ? 'bg-gray-700/50 border-gray-600 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="col-span-3 font-semibold">Fecha</div>
          <div className="col-span-2 font-semibold text-center">Ingresos</div>
          <div className="col-span-2 font-semibold text-center">Gastos</div>
          <div className="col-span-2 font-semibold text-center">Balance</div>
          <div className="col-span-3 font-semibold text-center">Acciones</div>
        </div>

        {/* Lista de movimientos por semana */}
        <div className="space-y-6">
          {Object.entries(weeklyData).map(([weekName, movements]) => (
            <div key={weekName}>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {weekName}
              </h4>
              
              <div className="space-y-1">
                {movements.map((mov) => (
                  <div
                    key={mov.id}
                    className={`grid grid-cols-12 gap-4 py-3 px-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
                      isDark 
                        ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {/* Fecha */}
                    <div className="col-span-3 flex items-center">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {new Date(mov.fecha).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(mov.fecha).toLocaleDateString('es-ES', { year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Ingresos */}
                    <div className="col-span-2 flex items-center justify-center">
                      {(filterType === 'all' || filterType === 'ingreso') && mov.ingreso_total > 0 ? (
                        <div className="text-center">
                          <div className="text-green-500 font-bold">
                            +{formatEuro(mov.ingreso_total)}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {mov.ingresos.length} item{mov.ingresos.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          --
                        </span>
                      )}
                    </div>

                    {/* Gastos */}
                    <div className="col-span-2 flex items-center justify-center">
                      {(filterType === 'all' || filterType === 'gasto') && mov.total_gastos > 0 ? (
                        <div className="text-center">
                          <div className="text-red-500 font-bold">
                            -{formatEuro(mov.total_gastos)}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {mov.gastos.length} item{mov.gastos.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          --
                        </span>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="col-span-2 flex items-center justify-center">
                      {filterType === 'all' ? (
                        <div className="text-center">
                          <div className={`font-bold ${
                            mov.balance >= 0 ? 'text-blue-500' : 'text-red-500'
                          }`}>
                            {formatEuro(mov.balance)}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {mov.balance >= 0 ? 'Positivo' : 'Negativo'}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          --
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      {onEditMovimiento && (
                        <ActionButton
                          variant="edit"
                          onClick={() => onEditMovimiento(mov)}
                          isDark={isDark}
                          size="sm"
                        >
                          <Edit className="w-3 h-3" />
                        </ActionButton>
                      )}
                      {onDeleteMovimiento && (
                        <ActionButton
                          variant="delete"
                          onClick={() => onDeleteMovimiento(mov)}
                          isDark={isDark}
                          size="sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </ActionButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(weeklyData).length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <p>No hay movimientos para mostrar en este período</p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default DetailedMovementsList