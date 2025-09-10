import { useMemo } from 'react'
import { 
  getMonthsWithMovements, 
  getYearsWithMovements, 
  getTotalDaysWithMovements,
  sortMonthsByDate,
  sortMonthsByBalanceBruto,
  sortYearsByDate,
  sortYearsByBalanceBruto
} from '../utils/movementsCalculations'

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

type SortType = 'date' | 'balanceBruto'
type SortOrder = 'asc' | 'desc'

export const useMovementsStats = (movimientos: MovimientoDiario[]) => {
  const stats = useMemo(() => {
    const months = getMonthsWithMovements(movimientos)
    const years = getYearsWithMovements(movimientos)
    const totalDays = getTotalDaysWithMovements(movimientos)
    
    return {
      months,
      years,
      totalDays,
      totalMovements: movimientos.length,
      monthsCount: months.length,
      yearsCount: years.length
    }
  }, [movimientos])

  const getSortedMonths = useMemo(() => {
    return (sortType: SortType = 'date', sortOrder: SortOrder = 'desc') => {
      if (sortType === 'date') {
        return sortMonthsByDate(stats.months, sortOrder === 'asc')
      } else {
        return sortMonthsByBalanceBruto(stats.months, sortOrder === 'asc')
      }
    }
  }, [stats.months])

  const getSortedYears = useMemo(() => {
    return (sortType: SortType = 'date', sortOrder: SortOrder = 'desc') => {
      if (sortType === 'date') {
        return sortYearsByDate(stats.years, sortOrder === 'asc')
      } else {
        return sortYearsByBalanceBruto(stats.years, sortOrder === 'asc')
      }
    }
  }, [stats.years])

  return {
    ...stats,
    getSortedMonths,
    getSortedYears
  }
}