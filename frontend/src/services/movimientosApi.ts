/**
 * Servicio API para manejo de movimientos
 * Centraliza todas las operaciones CRUD y maneja la comunicación con el backend
 */

import axios from 'axios'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface Ingreso {
  id: number
  etiqueta: string
  monto: number
  fecha: string
  created_at?: string
}

export interface Gasto {
  id: number
  etiqueta: string
  monto: number
  fecha: string
  es_recurrente?: boolean
  created_at?: string
}

export interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: Ingreso[]
  gastos: Gasto[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

export interface MovimientoCreateData {
  fecha: string
  ingresos: Array<{
    etiqueta: string
    monto: number
  }>
  gastos: Array<{
    etiqueta: string
    monto: number
    es_recurrente?: boolean
  }>
}

export interface MovimientoUpdateData extends MovimientoCreateData {
  id?: number
}

// ========================================
// CONFIGURACIÓN BASE
// ========================================

const API_BASE = '/api/movimientos'

// Helper para manejo de errores
const handleApiError = (error: any, operation: string): never => {
  console.error(`❌ Error en ${operation}:`, error)
  
  let message = `Error en ${operation}`
  if (error.response?.data?.detail) {
    message = error.response.data.detail
  } else if (error.response?.status === 404) {
    message = 'Recurso no encontrado'
  } else if (error.response?.status === 400) {
    message = 'Datos inválidos'
  } else if (error.message) {
    message = error.message
  }
  
  throw new Error(message)
}

// ========================================
// OPERACIONES CRUD PRINCIPALES
// ========================================

/**
 * Obtiene todos los movimientos recientes
 */
export const fetchMovimientos = async (): Promise<MovimientoDiario[]> => {
  try {
    const response = await axios.get(`${API_BASE}/`, {
      params: {
        todos: true,
        limit: 100
      }
    })
    return response.data
  } catch (error) {
    handleApiError(error, 'obtener movimientos')
  }
}

/**
 * Obtiene un movimiento por fecha
 */
export const fetchMovimientoPorFecha = async (fecha: string): Promise<MovimientoDiario | null> => {
  try {
    const response = await axios.get(`${API_BASE}/${fecha}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    handleApiError(error, 'obtener movimiento por fecha')
  }
}

/**
 * Crea un nuevo movimiento
 */
export const createMovimiento = async (movimientoData: MovimientoCreateData): Promise<MovimientoDiario> => {
  try {
    const response = await axios.post(API_BASE, movimientoData)
    return response.data
  } catch (error) {
    handleApiError(error, 'crear movimiento')
  }
}

/**
 * Actualiza un movimiento existente
 * Nota: El backend usa POST para crear/actualizar, pero aquí lo hacemos semánticamente correcto
 */
export const updateMovimiento = async (movimientoData: MovimientoUpdateData): Promise<MovimientoDiario> => {
  try {
    const response = await axios.post(API_BASE, movimientoData)
    return response.data
  } catch (error) {
    handleApiError(error, 'actualizar movimiento')
  }
}

/**
 * Elimina un movimiento completo por fecha
 */
export const deleteMovimiento = async (fecha: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/${fecha}`)
  } catch (error) {
    handleApiError(error, 'eliminar movimiento')
  }
}

// ========================================
// OPERACIONES PARA ITEMS INDIVIDUALES
// ========================================

/**
 * Elimina un ingreso específico
 */
export const deleteIngreso = async (fecha: string, ingresoId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/${fecha}/ingreso/${ingresoId}`)
  } catch (error) {
    if (error.response?.status === 404) {
      return // Ya fue eliminado
    }
    handleApiError(error, 'eliminar ingreso')
  }
}

/**
 * Elimina un gasto específico
 */
export const deleteGasto = async (fecha: string, gastoId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/${fecha}/gasto/${gastoId}`)
  } catch (error) {
    if (error.response?.status === 404) {
      return // Ya fue eliminado
    }
    handleApiError(error, 'eliminar gasto')
  }
}

/**
 * Obtiene un movimiento actualizado después de eliminar un item
 */
export const fetchMovimientoActualizado = async (fecha: string): Promise<MovimientoDiario | null> => {
  return fetchMovimientoPorFecha(fecha)
}

// ========================================
// OPERACIONES DE BÚSQUEDA Y FILTRADO
// ========================================

/**
 * Busca movimientos por etiqueta
 */
export const buscarPorEtiqueta = async (
  etiqueta: string, 
  tipo: 'gastos' | 'ingresos' = 'gastos',
  limit: number = 50
): Promise<any[]> => {
  try {
    console.log('📡 Buscando por etiqueta:', { etiqueta, tipo, limit })
    const response = await axios.get(`${API_BASE}/buscar/etiqueta/${etiqueta}`, {
      params: { tipo, limit }
    })
    console.log('✅ Resultados encontrados:', response.data.length)
    return response.data
  } catch (error) {
    handleApiError(error, 'buscar por etiqueta')
  }
}

/**
 * Obtiene movimientos de un mes específico
 */
export const fetchMovimientosMes = async (año: number, mes: number): Promise<any[]> => {
  try {
    console.log('📡 Obteniendo movimientos del mes:', { año, mes })
    const response = await axios.get(`${API_BASE}/mes/${año}/${mes}`)
    console.log('✅ Movimientos del mes obtenidos:', response.data.length)
    return response.data
  } catch (error) {
    handleApiError(error, 'obtener movimientos del mes')
  }
}

// ========================================
// HELPERS DE TRANSFORMACIÓN DE DATOS
// ========================================

/**
 * Convierte un movimiento del frontend al formato del backend
 */
export const transformarMovimientoParaApi = (movimiento: any): MovimientoCreateData => {
  return {
    fecha: movimiento.fecha,
    ingresos: movimiento.ingresos.map((ingreso: any) => ({
      id: ingreso.id,
      etiqueta: ingreso.etiqueta,
      monto: ingreso.monto
    })),
    gastos: movimiento.gastos.map((gasto: any) => ({
      id: gasto.id,
      etiqueta: gasto.etiqueta,
      monto: gasto.monto,
      es_recurrente: gasto.es_recurrente || false
    }))
  }
}

/**
 * Crea un movimiento desde datos temporales del formulario
 */
export const crearMovimientoDesdeFormulario = async (
  fecha: string,
  ingresos: Array<{ etiqueta: string; monto: number }>,
  gastos: Array<{ etiqueta: string; monto: number; es_recurrente?: boolean }>
): Promise<MovimientoDiario> => {
  const movimientoData: MovimientoCreateData = {
    fecha,
    ingresos,
    gastos
  }
  
  return createMovimiento(movimientoData)
}

// ========================================
// VALIDADORES
// ========================================

/**
 * Valida que un movimiento tenga datos válidos
 */
export const validarMovimiento = (movimiento: MovimientoCreateData): string[] => {
  const errores: string[] = []
  
  if (!movimiento.fecha) {
    errores.push('La fecha es obligatoria')
  }
  
  if (movimiento.ingresos.length === 0 && movimiento.gastos.length === 0) {
    errores.push('Debe haber al menos un ingreso o gasto')
  }
  
  // Validar ingresos
  movimiento.ingresos.forEach((ingreso, index) => {
    if (!ingreso.etiqueta) {
      errores.push(`El ingreso ${index + 1} debe tener etiqueta`)
    }
    if (!ingreso.monto || ingreso.monto <= 0) {
      errores.push(`El ingreso ${index + 1} debe tener un monto válido`)
    }
  })
  
  // Validar gastos
  movimiento.gastos.forEach((gasto, index) => {
    if (!gasto.etiqueta) {
      errores.push(`El gasto ${index + 1} debe tener etiqueta`)
    }
    if (!gasto.monto || gasto.monto <= 0) {
      errores.push(`El gasto ${index + 1} debe tener un monto válido`)
    }
  })
  
  return errores
}

export default {
  // CRUD principal
  fetchMovimientos,
  fetchMovimientoPorFecha,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  
  // Items individuales
  deleteIngreso,
  deleteGasto,
  fetchMovimientoActualizado,
  
  // Búsqueda
  buscarPorEtiqueta,
  fetchMovimientosMes,
  
  // Helpers
  transformarMovimientoParaApi,
  crearMovimientoDesdeFormulario,
  validarMovimiento
}