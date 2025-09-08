import { useState, useEffect } from 'react'
import { saveGastosRecurrentesToStorage, loadGastosRecurrentesFromStorage } from '../utils/storage'
import { getTiposGastosRecurrentesGlobal } from '../utils/calculations'

interface GastoRecurrente {
  etiqueta: string
  monto: number
  frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual'
  diaMes?: number
  diaSemana?: string
  mesAnual?: string
  diaAnual?: string
}

export const useRecurrentes = (gastos: any[] = []) => {
  const [gastosRecurrentes, setGastosRecurrentes] = useState<GastoRecurrente[]>([])

  useEffect(() => {
    const loaded = loadGastosRecurrentesFromStorage()
    setGastosRecurrentes(loaded || [])
  }, [])

  const saveGastosRecurrentes = (gastos: GastoRecurrente[]) => {
    setGastosRecurrentes(gastos)
    saveGastosRecurrentesToStorage(gastos as any)
  }

  const addGastoRecurrente = (gasto: GastoRecurrente) => {
    const updated = [...gastosRecurrentes, gasto]
    saveGastosRecurrentes(updated)
  }

  const updateGastoRecurrente = (index: number, gasto: GastoRecurrente) => {
    const updated = [...gastosRecurrentes]
    updated[index] = gasto
    saveGastosRecurrentes(updated)
  }

  const removeGastoRecurrente = (index: number) => {
    const updated = gastosRecurrentes.filter((_, i) => i !== index)
    saveGastosRecurrentes(updated)
  }

  const getTiposGastos = () => {
    return getTiposGastosRecurrentesGlobal(gastos, gastosRecurrentes)
  }

  return {
    gastosRecurrentes,
    addGastoRecurrente,
    updateGastoRecurrente,
    removeGastoRecurrente,
    getTiposGastos,
    saveGastosRecurrentes
  }
}