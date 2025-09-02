import { useState, useEffect } from 'react'
import axios from 'axios'

interface Ingreso {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

interface Gasto {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingreso_total: number
  ingresos: Ingreso[]
  gastos: Gasto[]
  total_gastos: number
  balance: number
  created_at?: string
  updated_at?: string
}

const API_BASE_URL = 'http://localhost:8000/api'

function App() {
  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMovimientos()
  }, [])

  const fetchMovimientos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movimientos/`)
      setMovimientos(response.data)
    } catch (err) {
      setError('Error al cargar los movimientos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contabilidad Personal</h1>
        
        <div className="grid gap-6">
          {movimientos.map((movimiento) => (
            <div key={movimiento.id} className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-800">
                  {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <div className={`text-lg font-bold ${
                  movimiento.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Balance: ${movimiento.balance.toFixed(2)}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-3">
                    Ingresos (${movimiento.ingreso_total.toFixed(2)})
                  </h3>
                  {movimiento.ingresos.length > 0 ? (
                    <ul className="space-y-2">
                      {movimiento.ingresos.map((ingreso) => (
                        <li key={ingreso.id} className="flex justify-between items-center bg-green-50 p-2 rounded">
                          <span>{ingreso.etiqueta}</span>
                          <span className="font-semibold">${ingreso.monto.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No hay ingresos</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-red-700 mb-3">
                    Gastos (${movimiento.total_gastos.toFixed(2)})
                  </h3>
                  {movimiento.gastos.length > 0 ? (
                    <ul className="space-y-2">
                      {movimiento.gastos.map((gasto) => (
                        <li key={gasto.id} className="flex justify-between items-center bg-red-50 p-2 rounded">
                          <span>{gasto.etiqueta}</span>
                          <span className="font-semibold">${gasto.monto.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No hay gastos</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {movimientos.length === 0 && (
          <div className="card text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay movimientos</h2>
            <p className="text-gray-500">Comienza agregando tus primeros ingresos y gastos</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
