import { useState, useEffect, useCallback } from 'react'
import * as MovimientosAPI from '../services/movimientosApi'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface EditingItem {
  tipo: 'ingreso' | 'gasto'
  id: number
}

export const useEditMovimiento = (
  originalMovimiento: MovimientoDiario | null,
  onSave: (movimiento: MovimientoDiario) => Promise<void>
) => {
  const [editedMovimiento, setEditedMovimiento] = useState<MovimientoDiario | null>(null)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  // Inicializar el movimiento editado cuando cambia el original
  useEffect(() => {
    if (originalMovimiento) {
      setEditedMovimiento({ ...originalMovimiento })
      setEditingItem(null)
      setDeletingItems(new Set())
    }
  }, [originalMovimiento])

  // Calcular totales dinámicamente
  const recalculateTotals = useCallback((movimiento: MovimientoDiario): MovimientoDiario => {
    const ingreso_total = movimiento.ingresos.reduce((sum, ing) => sum + ing.monto, 0)
    const total_gastos = movimiento.gastos.reduce((sum, gas) => sum + gas.monto, 0)
    const balance = ingreso_total - total_gastos

    return {
      ...movimiento,
      ingreso_total,
      total_gastos,
      balance
    }
  }, [])

  // Eliminar item individual con actualización inmediata del estado local
  const deleteItem = useCallback(async (tipo: 'ingreso' | 'gasto', itemId: number) => {
    if (!editedMovimiento || deletingItems.has(itemId)) return

    setDeletingItems(prev => new Set([...prev, itemId]))

    try {
      // Optimistic update: actualizar estado local inmediatamente
      setEditedMovimiento(prevMovimiento => {
        if (!prevMovimiento) return null

        let newMovimiento: MovimientoDiario
        
        if (tipo === 'ingreso') {
          newMovimiento = {
            ...prevMovimiento,
            ingresos: prevMovimiento.ingresos.filter(ing => ing.id !== itemId)
          }
        } else {
          newMovimiento = {
            ...prevMovimiento,
            gastos: prevMovimiento.gastos.filter(gas => gas.id !== itemId)
          }
        }

        return recalculateTotals(newMovimiento)
      })

      // Eliminar en el backend
      if (tipo === 'ingreso') {
        await MovimientosAPI.deleteIngreso(editedMovimiento.fecha, itemId)
      } else {
        await MovimientosAPI.deleteGasto(editedMovimiento.fecha, itemId)
      }

    } catch (error) {
      console.error(`Error eliminando ${tipo}:`, error)
      
      // Rollback: revertir cambio optimista si falla
      if (originalMovimiento) {
        setEditedMovimiento({ ...originalMovimiento })
      }
      
      throw error
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }, [editedMovimiento, deletingItems, originalMovimiento, recalculateTotals])

  // Actualizar item individual
  const updateItem = useCallback((tipo: 'ingreso' | 'gasto', itemId: number, newData: { etiqueta: string; monto: number }) => {
    if (!editedMovimiento) return

    setEditedMovimiento(prevMovimiento => {
      if (!prevMovimiento) return null

      let newMovimiento: MovimientoDiario

      if (tipo === 'ingreso') {
        newMovimiento = {
          ...prevMovimiento,
          ingresos: prevMovimiento.ingresos.map(ing => 
            ing.id === itemId 
              ? { ...ing, etiqueta: newData.etiqueta, monto: newData.monto }
              : ing
          )
        }
      } else {
        newMovimiento = {
          ...prevMovimiento,
          gastos: prevMovimiento.gastos.map(gas => 
            gas.id === itemId 
              ? { ...gas, etiqueta: newData.etiqueta, monto: newData.monto }
              : gas
          )
        }
      }

      return recalculateTotals(newMovimiento)
    })
  }, [editedMovimiento, recalculateTotals])

  // Agregar nuevo item
  const addItem = useCallback((tipo: 'ingreso' | 'gasto', itemData: { etiqueta: string; monto: number }) => {
    if (!editedMovimiento) return

    const newId = Date.now() // ID temporal
    const newItem = {
      id: newId,
      etiqueta: itemData.etiqueta,
      monto: itemData.monto,
      fecha: editedMovimiento.fecha,
      created_at: new Date().toISOString(),
      ...(tipo === 'gasto' && { es_recurrente: false, recurrente_id: null })
    }

    setEditedMovimiento(prevMovimiento => {
      if (!prevMovimiento) return null

      let newMovimiento: MovimientoDiario

      if (tipo === 'ingreso') {
        newMovimiento = {
          ...prevMovimiento,
          ingresos: [...prevMovimiento.ingresos, newItem]
        }
      } else {
        newMovimiento = {
          ...prevMovimiento,
          gastos: [...prevMovimiento.gastos, newItem]
        }
      }

      return recalculateTotals(newMovimiento)
    })
  }, [editedMovimiento, recalculateTotals])

  // Cambiar fecha
  const updateDate = useCallback((newDate: string) => {
    if (!editedMovimiento) return

    setEditedMovimiento(prev => prev ? { ...prev, fecha: newDate } : null)
  }, [editedMovimiento])

  // Guardar cambios
  const saveChanges = useCallback(async () => {
    if (!editedMovimiento) return

    setLoading(true)
    try {
      await onSave(editedMovimiento)
    } finally {
      setLoading(false)
    }
  }, [editedMovimiento, onSave])

  return {
    editedMovimiento,
    editingItem,
    setEditingItem,
    deletingItems,
    loading,
    deleteItem,
    updateItem,
    addItem,
    updateDate,
    saveChanges
  }
}