import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import Card from '../ui/Card'
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
  isDark: boolean
  onEditMovimiento?: (movimiento: MovimientoDiario) => void
  onDeleteMovimiento?: (movimiento: MovimientoDiario) => void
}

const DetailedMovementsList: React.FC<DetailedMovementsListProps> = ({
  weeklyData,
  isDark,
  onEditMovimiento,
  onDeleteMovimiento
}) => {
  return (
    <Card variant="default" isDark={isDark}>
      <div className="p-6">
        {/* Header mejorado */}
        <div className="mb-6">
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Lista de Movimientos
          </h3>
          
          {/* Tabla header con mejor diseño */}
          <div className={`grid grid-cols-12 gap-4 py-4 px-6 rounded-t-xl ${
            isDark 
              ? 'bg-gray-800/50 border-b border-gray-600' 
              : 'bg-gray-100 border-b border-gray-300'
          }`}>
            <div className={`col-span-3 font-bold text-sm uppercase tracking-wide ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Fecha
            </div>
            <div className={`col-span-2 font-bold text-sm uppercase tracking-wide text-center ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              Ingresos
            </div>
            <div className={`col-span-2 font-bold text-sm uppercase tracking-wide text-center ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`}>
              Gastos
            </div>
            <div className={`col-span-2 font-bold text-sm uppercase tracking-wide text-center ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Balance
            </div>
            <div className={`col-span-3 font-bold text-sm uppercase tracking-wide text-center ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Acciones
            </div>
          </div>
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
                      {mov.ingreso_total > 0 ? (
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
                          0,00€
                        </span>
                      )}
                    </div>

                    {/* Gastos */}
                    <div className="col-span-2 flex items-center justify-center">
                      {mov.total_gastos > 0 ? (
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
                          0,00€
                        </span>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="col-span-2 flex items-center justify-center">
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