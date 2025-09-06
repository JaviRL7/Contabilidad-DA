import api from './api'
import { Ingreso, Gasto } from '../types'

export const movementsService = {
  // Ingresos
  async getIngresos(): Promise<Ingreso[]> {
    const response = await api.get('/ingresos')
    return response.data
  },

  async createIngreso(ingreso: Omit<Ingreso, 'id'>): Promise<Ingreso> {
    const response = await api.post('/ingresos', ingreso)
    return response.data
  },

  async updateIngreso(id: number, ingreso: Partial<Ingreso>): Promise<Ingreso> {
    const response = await api.put(`/ingresos/${id}`, ingreso)
    return response.data
  },

  async deleteIngreso(id: number): Promise<void> {
    await api.delete(`/ingresos/${id}`)
  },

  // Gastos
  async getGastos(): Promise<Gasto[]> {
    const response = await api.get('/gastos')
    return response.data
  },

  async createGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
    const response = await api.post('/gastos', gasto)
    return response.data
  },

  async updateGasto(id: number, gasto: Partial<Gasto>): Promise<Gasto> {
    const response = await api.put(`/gastos/${id}`, gasto)
    return response.data
  },

  async deleteGasto(id: number): Promise<void> {
    await api.delete(`/gastos/${id}`)
  },

  // Etiquetas
  async getEtiquetas(): Promise<{ingresos: string[], gastos: string[]}> {
    const response = await api.get('/etiquetas')
    return response.data
  },

  async createEtiqueta(nombre: string, tipo: 'ingreso' | 'gasto'): Promise<void> {
    await api.post('/etiquetas', { nombre, tipo })
  },

  async updateEtiqueta(oldName: string, newName: string, tipo: 'ingreso' | 'gasto'): Promise<void> {
    await api.put('/etiquetas', { oldName, newName, tipo })
  },

  async deleteEtiqueta(nombre: string, tipo: 'ingreso' | 'gasto'): Promise<void> {
    await api.delete('/etiquetas', { data: { nombre, tipo } })
  }
}