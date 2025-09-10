interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface MonthData {
  year: number
  month: number
  monthName: string
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientosCount: number
  balanceBruto: number
}

interface YearData {
  year: number
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientosCount: number
  balanceBruto: number
  monthsWithMovements: number
}

// Export types for other files to use
export type { MovimientoDiario, MonthData, YearData }

export const getMonthsWithMovements = (movimientos: MovimientoDiario[]): MonthData[] => {
  const monthsMap = new Map<string, MonthData>()
  
  movimientos.forEach(mov => {
    const fecha = new Date(mov.fecha)
    const year = fecha.getFullYear()
    const month = fecha.getMonth()
    const key = `${year}-${month}`
    
    if (!monthsMap.has(key)) {
      monthsMap.set(key, {
        year,
        month,
        monthName: fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        totalIngresos: 0,
        totalGastos: 0,
        balance: 0,
        movimientosCount: 0,
        balanceBruto: 0
      })
    }
    
    const monthData = monthsMap.get(key)!
    monthData.totalIngresos += mov.ingreso_total
    monthData.totalGastos += mov.total_gastos
    monthData.balance += mov.balance
    monthData.movimientosCount += 1
    monthData.balanceBruto += mov.ingreso_total + mov.total_gastos
  })
  
  return Array.from(monthsMap.values())
}

export const getYearsWithMovements = (movimientos: MovimientoDiario[]): YearData[] => {
  const yearsMap = new Map<number, YearData>()
  const monthsPerYear = new Map<number, Set<number>>()
  
  movimientos.forEach(mov => {
    const fecha = new Date(mov.fecha)
    const year = fecha.getFullYear()
    const month = fecha.getMonth()
    
    // Contar meses únicos por año
    if (!monthsPerYear.has(year)) {
      monthsPerYear.set(year, new Set())
    }
    monthsPerYear.get(year)!.add(month)
    
    if (!yearsMap.has(year)) {
      yearsMap.set(year, {
        year,
        totalIngresos: 0,
        totalGastos: 0,
        balance: 0,
        movimientosCount: 0,
        balanceBruto: 0,
        monthsWithMovements: 0
      })
    }
    
    const yearData = yearsMap.get(year)!
    yearData.totalIngresos += mov.ingreso_total
    yearData.totalGastos += mov.total_gastos
    yearData.balance += mov.balance
    yearData.movimientosCount += 1
    yearData.balanceBruto += mov.ingreso_total + mov.total_gastos
  })
  
  // Asignar número de meses con movimientos
  yearsMap.forEach((yearData, year) => {
    yearData.monthsWithMovements = monthsPerYear.get(year)?.size || 0
  })
  
  return Array.from(yearsMap.values())
}

export const getTotalDaysWithMovements = (movimientos: MovimientoDiario[]): number => {
  const uniqueDates = new Set(movimientos.map(mov => mov.fecha))
  return uniqueDates.size
}

export const sortMonthsByDate = (months: MonthData[], ascending: boolean = false): MonthData[] => {
  return [...months].sort((a, b) => {
    const dateA = new Date(a.year, a.month)
    const dateB = new Date(b.year, b.month)
    return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
  })
}

export const sortMonthsByBalanceBruto = (months: MonthData[], ascending: boolean = false): MonthData[] => {
  return [...months].sort((a, b) => {
    return ascending ? a.balanceBruto - b.balanceBruto : b.balanceBruto - a.balanceBruto
  })
}

export const sortYearsByDate = (years: YearData[], ascending: boolean = false): YearData[] => {
  return [...years].sort((a, b) => {
    return ascending ? a.year - b.year : b.year - a.year
  })
}

export const sortYearsByBalanceBruto = (years: YearData[], ascending: boolean = false): YearData[] => {
  return [...years].sort((a, b) => {
    return ascending ? a.balanceBruto - b.balanceBruto : b.balanceBruto - a.balanceBruto
  })
}