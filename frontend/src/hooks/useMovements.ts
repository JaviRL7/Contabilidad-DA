import { useState, useEffect } from 'react'
import { Ingreso, Gasto } from '../types'
import { movementsService } from '../services/movementsService'

export const useMovements = () => {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [etiquetas, setEtiquetas] = useState<{ingresos: string[], gastos: string[]}>({
    ingresos: [],
    gastos: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [ingresosData, gastosData, etiquetasData] = await Promise.all([
        movementsService.getIngresos(),
        movementsService.getGastos(),
        movementsService.getEtiquetas()
      ])
      
      setIngresos(ingresosData)
      setGastos(gastosData)
      setEtiquetas(etiquetasData)
      setError(null)
    } catch (err) {
      setError('Error al cargar los datos')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Funciones para ingresos
  const addIngreso = async (ingreso: Omit<Ingreso, 'id'>) => {
    try {
      const newIngreso = await movementsService.createIngreso(ingreso)
      setIngresos(prev => [...prev, newIngreso])
      return newIngreso
    } catch (err) {
      setError('Error al crear ingreso')
      throw err
    }
  }

  const updateIngreso = async (id: number, updates: Partial<Ingreso>) => {
    try {
      const updated = await movementsService.updateIngreso(id, updates)
      setIngresos(prev => prev.map(item => item.id === id ? updated : item))
      return updated
    } catch (err) {
      setError('Error al actualizar ingreso')
      throw err
    }
  }

  const deleteIngreso = async (id: number) => {
    try {
      await movementsService.deleteIngreso(id)
      setIngresos(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError('Error al eliminar ingreso')
      throw err
    }
  }

  // Funciones para gastos
  const addGasto = async (gasto: Omit<Gasto, 'id'>) => {
    try {
      const newGasto = await movementsService.createGasto(gasto)
      setGastos(prev => [...prev, newGasto])
      return newGasto
    } catch (err) {
      setError('Error al crear gasto')
      throw err
    }
  }

  const updateGasto = async (id: number, updates: Partial<Gasto>) => {
    try {
      const updated = await movementsService.updateGasto(id, updates)
      setGastos(prev => prev.map(item => item.id === id ? updated : item))
      return updated
    } catch (err) {
      setError('Error al actualizar gasto')
      throw err
    }
  }

  const deleteGasto = async (id: number) => {
    try {
      await movementsService.deleteGasto(id)
      setGastos(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError('Error al eliminar gasto')
      throw err
    }
  }

  // Funciones para etiquetas
  const addEtiqueta = async (nombre: string, tipo: 'ingreso' | 'gasto') => {
    try {
      await movementsService.createEtiqueta(nombre, tipo)
      setEtiquetas(prev => ({
        ...prev,
        [tipo === 'ingreso' ? 'ingresos' : 'gastos']: [...prev[tipo === 'ingreso' ? 'ingresos' : 'gastos'], nombre]
      }))
    } catch (err) {
      setError('Error al crear etiqueta')
      throw err
    }
  }

  const updateEtiqueta = async (oldName: string, newName: string, tipo: 'ingreso' | 'gasto') => {
    try {
      await movementsService.updateEtiqueta(oldName, newName, tipo)
      const key = tipo === 'ingreso' ? 'ingresos' : 'gastos'
      setEtiquetas(prev => ({
        ...prev,
        [key]: prev[key].map(etiq => etiq === oldName ? newName : etiq)
      }))
    } catch (err) {
      setError('Error al actualizar etiqueta')
      throw err
    }
  }

  const deleteEtiqueta = async (nombre: string, tipo: 'ingreso' | 'gasto') => {
    try {
      await movementsService.deleteEtiqueta(nombre, tipo)
      const key = tipo === 'ingreso' ? 'ingresos' : 'gastos'
      setEtiquetas(prev => ({
        ...prev,
        [key]: prev[key].filter(etiq => etiq !== nombre)
      }))
    } catch (err) {
      setError('Error al eliminar etiqueta')
      throw err
    }
  }

  return {
    // Data
    ingresos,
    gastos,
    etiquetas,
    loading,
    error,
    
    // Actions
    loadAllData,
    addIngreso,
    updateIngreso,
    deleteIngreso,
    addGasto,
    updateGasto,
    deleteGasto,
    addEtiqueta,
    updateEtiqueta,
    deleteEtiqueta
  }
}