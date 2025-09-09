import axios from 'axios'

export interface Etiqueta {
  id: number
  nombre: string
  tipo: 'gasto' | 'ingreso'
  es_predefinida: boolean
  es_esencial: boolean
}

export interface EtiquetaCreate {
  nombre: string
  tipo: 'gasto' | 'ingreso'
  es_predefinida?: boolean
  es_esencial?: boolean
}

// Obtener todas las etiquetas
export const fetchEtiquetas = async (): Promise<Etiqueta[]> => {
  const response = await axios.get('/api/etiquetas/')
  return response.data
}

// Crear nueva etiqueta
export const createEtiqueta = async (etiquetaData: EtiquetaCreate): Promise<Etiqueta> => {
  const response = await axios.post('/api/etiquetas/', etiquetaData)
  return response.data
}

// Actualizar etiqueta existente
export const updateEtiqueta = async (id: number, etiquetaData: Partial<EtiquetaCreate>): Promise<Etiqueta> => {
  const response = await axios.put(`/api/etiquetas/${id}`, etiquetaData)
  return response.data
}

// Eliminar etiqueta
export const deleteEtiqueta = async (id: number): Promise<void> => {
  await axios.delete(`/api/etiquetas/${id}`)
}

// Buscar etiqueta por nombre
export const findEtiquetaByName = (etiquetas: Etiqueta[], nombre: string): Etiqueta | undefined => {
  return etiquetas.find(e => e.nombre.toLowerCase() === nombre.toLowerCase())
}

// Filtrar etiquetas por tipo
export const filterEtiquetasByTipo = (etiquetas: Etiqueta[], tipo: 'gasto' | 'ingreso'): string[] => {
  return etiquetas
    .filter(e => e.tipo === tipo)
    .map(e => e.nombre)
}

// Convertir formato legacy para compatibilidad
export const formatEtiquetasForLegacy = (etiquetas: Etiqueta[]) => {
  return {
    ingresos: filterEtiquetasByTipo(etiquetas, 'ingreso'),
    gastos: filterEtiquetasByTipo(etiquetas, 'gasto')
  }
}