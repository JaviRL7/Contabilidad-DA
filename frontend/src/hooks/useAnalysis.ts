import { useMemo } from 'react'
import { getAvailableYears, getAvailableMonths } from '../utils/calculations'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
}

export const useAnalysis = (movimientos: MovimientoDiario[], currentYear?: number) => {
  const estadisticas = useMemo(() => {
    console.log('useAnalysis - movimientos type:', typeof movimientos, 'length:', movimientos?.length, 'isArray:', Array.isArray(movimientos))
    
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return {
        totalIngresos: 0,
        totalGastos: 0,
        balance: 0,
        promedioIngresos: 0,
        promedioGastos: 0,
        diasConMovimientos: 0
      }
    }

    const totalIngresos = movimientos.reduce((acc, mov) => 
      acc + mov.ingresos.reduce((sum, ing) => sum + ing.monto, 0), 0)
    
    const totalGastos = movimientos.reduce((acc, mov) => 
      acc + mov.gastos.reduce((sum, gas) => sum + gas.monto, 0), 0)
    
    const balance = totalIngresos - totalGastos
    const diasConMovimientos = movimientos.length
    
    return {
      totalIngresos,
      totalGastos,
      balance,
      promedioIngresos: diasConMovimientos > 0 ? totalIngresos / diasConMovimientos : 0,
      promedioGastos: diasConMovimientos > 0 ? totalGastos / diasConMovimientos : 0,
      diasConMovimientos
    }
  }, [movimientos])

  const availableYears = useMemo(() => {
    return getAvailableYears(movimientos)
  }, [movimientos])

  const availableMonths = useMemo(() => {
    if (!currentYear) return []
    return getAvailableMonths(movimientos, currentYear)
  }, [movimientos, currentYear])

  const movimientosPorCategoria = useMemo(() => {
    const categorias = new Map()
    
    movimientos.forEach(mov => {
      // Procesar gastos
      mov.gastos.forEach(gasto => {
        const categoria = gasto.etiqueta || 'Sin categoría'
        if (!categorias.has(categoria)) {
          categorias.set(categoria, { gastos: 0, ingresos: 0 })
        }
        categorias.get(categoria).gastos += gasto.monto
      })
      
      // Procesar ingresos
      mov.ingresos.forEach(ingreso => {
        const categoria = ingreso.etiqueta || 'Sin categoría'
        if (!categorias.has(categoria)) {
          categorias.set(categoria, { gastos: 0, ingresos: 0 })
        }
        categorias.get(categoria).ingresos += ingreso.monto
      })
    })
    
    return Array.from(categorias.entries()).map(([categoria, datos]) => ({
      categoria,
      ...datos,
      total: datos.ingresos - datos.gastos
    }))
  }, [movimientos])

  const evolucionMensual = useMemo(() => {
    const meses = new Map()
    
    movimientos.forEach(mov => {
      const fecha = new Date(mov.fecha + 'T00:00:00')
      const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`
      
      if (!meses.has(mesKey)) {
        meses.set(mesKey, {
          mes: fecha.getMonth(),
          año: fecha.getFullYear(),
          ingresos: 0,
          gastos: 0
        })
      }
      
      const mesData = meses.get(mesKey)
      mesData.ingresos += mov.ingresos.reduce((sum, ing) => sum + ing.monto, 0)
      mesData.gastos += mov.gastos.reduce((sum, gas) => sum + gas.monto, 0)
    })
    
    return Array.from(meses.values())
      .map(mes => ({
        ...mes,
        balance: mes.ingresos - mes.gastos,
        mesNombre: new Date(mes.año, mes.mes).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      }))
      .sort((a, b) => a.año - b.año || a.mes - b.mes)
  }, [movimientos])

  return {
    estadisticas,
    availableYears,
    availableMonths,
    movimientosPorCategoria,
    evolucionMensual
  }
}