import { useState, useEffect, useCallback, useRef } from 'react'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'anual'
  diaMes?: number
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  fechaAnual?: string // Format: 'MM-DD'
  fechaCreacion?: string // Fecha de creación del gasto recurrente
}

interface GastoPendiente {
  gastoRecurrente: GastoRecurrente
  fechaEsperada: string
  diasRetraso: number
}

export const useRecurrentesPendientes = (
  gastosRecurrentes: GastoRecurrente[], 
  movimientos: any[],
  rechazosGastos?: any
) => {
  const [gastosPendientes, setGastosPendientes] = useState<GastoPendiente[]>([])
  
  // Usar ref para evitar recreación de dependencias
  const rechazosRef = useRef(rechazosGastos)
  rechazosRef.current = rechazosGastos

  // Función para obtener el próximo día de la semana
  const getNextDayOfWeek = (dayName: string, fromDate: Date): Date => {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    const targetDay = days.indexOf(dayName.toLowerCase())
    const currentDay = fromDate.getDay()
    
    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget <= 0) daysUntilTarget += 7
    
    const nextDate = new Date(fromDate)
    nextDate.setDate(fromDate.getDate() + daysUntilTarget)
    return nextDate
  }

  // Función para obtener el próximo día del mes
  const getNextMonthlyDate = (dayOfMonth: number, fromDate: Date): Date => {
    const nextDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), dayOfMonth)
    
    // Si ya pasó este mes, ir al próximo mes
    if (nextDate <= fromDate) {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
    
    return nextDate
  }

  // Función para obtener la próxima fecha anual
  const getNextAnnualDate = (fechaAnual: string, fromDate: Date): Date => {
    const [mes, dia] = fechaAnual.split('-').map(Number)
    const nextDate = new Date(fromDate.getFullYear(), mes - 1, dia)
    
    // Si ya pasó este año, ir al próximo año
    if (nextDate <= fromDate) {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
    
    return nextDate
  }

  // Función para verificar si existe un movimiento con este gasto en la fecha
  const existeMovimientoConGasto = (fecha: string, etiqueta: string): boolean => {
    if (!movimientos || !Array.isArray(movimientos)) return false
    
    const movimiento = movimientos.find(m => m.fecha === fecha)
    if (!movimiento) return false
    
    return movimiento.gastos.some((g: any) => 
      g.etiqueta === etiqueta && g.es_recurrente === true
    )
  }

  // Función principal para detectar gastos pendientes (solo mes actual)
  const detectarGastosPendientes = useCallback(() => {
    if (!movimientos || !Array.isArray(movimientos) || !gastosRecurrentes || !Array.isArray(gastosRecurrentes)) {
      setGastosPendientes([])
      return
    }
    
    const hoy = new Date()
    const pendientes: GastoPendiente[] = []

    gastosRecurrentes.forEach(gasto => {
      // Verificar que el gasto fue creado antes o durante el mes actual
      const fechaCreacion = gasto.fechaCreacion ? new Date(gasto.fechaCreacion + 'T00:00:00') : new Date()
      if (fechaCreacion > hoy) {
        return // No procesar gastos creados en el futuro
      }

      const fechasARevisar: Date[] = []

      // Generar fechas según la frecuencia (solo mes actual)
      switch (gasto.frecuencia) {
        case 'mensual':
          if (gasto.diaMes) {
            // Solo el mes actual
            const fechaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), gasto.diaMes)
            
            // Solo agregar si ya pasó la fecha y el gasto fue creado antes de esa fecha
            if (fechaMesActual <= hoy && fechaCreacion <= fechaMesActual) {
              fechasARevisar.push(fechaMesActual)
            }
          }
          break

        case 'semanal':
          if (gasto.diaSemana) {
            // Solo las semanas del mes actual
            const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
            const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
            
            const fechaRevision = new Date(primerDiaMes)
            while (fechaRevision <= ultimoDiaMes) {
              const fechaEsperada = getNextDayOfWeek(gasto.diaSemana, fechaRevision)
              if (fechaEsperada <= hoy && fechaEsperada >= primerDiaMes && fechaEsperada <= ultimoDiaMes && fechaCreacion <= fechaEsperada) {
                fechasARevisar.push(fechaEsperada)
              }
              fechaRevision.setDate(fechaRevision.getDate() + 7)
            }
          }
          break

        case 'anual':
          if (gasto.fechaAnual) {
            // Solo el año actual
            const [mes, dia] = gasto.fechaAnual.split('-').map(Number)
            const fechaAnual = new Date(hoy.getFullYear(), mes - 1, dia)
            
            // Solo si ya pasó la fecha este año y el gasto fue creado antes
            if (fechaAnual <= hoy && fechaCreacion <= fechaAnual) {
              fechasARevisar.push(fechaAnual)
            }
          }
          break
      }

      // Verificar cuáles fechas no tienen el gasto creado y no han sido rechazadas
      fechasARevisar.forEach(fecha => {
        const fechaString = fecha.toISOString().split('T')[0]
        
        // Verificar si no existe el movimiento y no ha sido rechazado
        const existeMovimiento = existeMovimientoConGasto(fechaString, gasto.etiqueta)
        const estaRechazado = rechazosRef.current?.estaRechazado?.(gasto.etiqueta, fechaString) || false
        
        if (!existeMovimiento && !estaRechazado) {
          const diasRetraso = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
          
          pendientes.push({
            gastoRecurrente: gasto,
            fechaEsperada: fechaString,
            diasRetraso
          })
        }
      })
    })

    setGastosPendientes(pendientes)
  }, [gastosRecurrentes, movimientos])

  // Ejecutar detección cuando cambien los datos
  useEffect(() => {
    if (gastosRecurrentes && gastosRecurrentes.length > 0 && movimientos && Array.isArray(movimientos)) {
      detectarGastosPendientes()
    }
  }, [detectarGastosPendientes, gastosRecurrentes, movimientos])

  return {
    gastosPendientes,
    detectarGastosPendientes
  }
}