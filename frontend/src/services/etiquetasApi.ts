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