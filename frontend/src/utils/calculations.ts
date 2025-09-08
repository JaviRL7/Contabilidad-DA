interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual'
  diaMes?: number
  diaSemana?: string
  mesAnual?: string
  diaAnual?: string
}

export const getTiposGastosRecurrentesGlobal = (gastos: any[], gastosRecurrentes: any[]) => {
  const tiposSet = new Set<string>()
  
  gastos.forEach(gasto => {
    if (gasto.etiqueta) {
      tiposSet.add(gasto.etiqueta)
    }
  })
  
  gastosRecurrentes.forEach(gastoRecurrente => {
    if (gastoRecurrente.etiqueta) {
      tiposSet.add(gastoRecurrente.etiqueta)
    }
  })
  
  const tipos = Array.from(tiposSet).map(etiqueta => {
    const gastoRecurrente = gastosRecurrentes.find(gr => gr.etiqueta === etiqueta)
    return {
      etiqueta,
      frecuencia: gastoRecurrente ? 
        gastoRecurrente.frecuencia === 'mensual' ? 'Mensual' : 'Anual' :
        'Manual'
    }
  })
  
  const orden = ['Mensual', 'Anual', 'Manual']
  return tipos.sort((a, b) => {
    return orden.indexOf(a.frecuencia) - orden.indexOf(b.frecuencia)
  })
}

export const getAvailableYears = (movimientos: any[]) => {
  const yearsWithMovements = new Set()
  
  movimientos.forEach(movimiento => {
    const date = new Date(movimiento.fecha + 'T00:00:00')
    yearsWithMovements.add(date.getFullYear())
  })
  
  return Array.from(yearsWithMovements).sort((a: any, b: any) => b - a)
}

export const getAvailableMonths = (movimientos: any[], currentYear: number) => {
  const monthsWithMovements = new Set()
  
  movimientos
    .filter(movimiento => {
      const date = new Date(movimiento.fecha + 'T00:00:00')
      return date.getFullYear() === currentYear
    })
    .forEach(movimiento => {
      const date = new Date(movimiento.fecha + 'T00:00:00')
      return date.getMonth() === monthsWithMovements
    })
  
  return Array.from(monthsWithMovements)
}