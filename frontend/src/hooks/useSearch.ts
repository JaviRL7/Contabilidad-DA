import { useState, useMemo } from 'react'

interface SearchParams {
  etiqueta?: string
  mes?: number
  año?: number
  tipo?: 'ingreso' | 'gasto'
  montoMin?: number
  montoMax?: number
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
}

export const useSearch = (movimientos: MovimientoDiario[]) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMovimientos = useMemo(() => {
    let filtered = movimientos

    // Filtro por etiqueta
    if (searchParams.etiqueta) {
      filtered = filtered.filter(movimiento => {
        const tieneIngresoConEtiqueta = movimiento.ingresos.some(
          ingreso => ingreso.etiqueta?.toLowerCase().includes(searchParams.etiqueta!.toLowerCase())
        )
        const tieneGastoConEtiqueta = movimiento.gastos.some(
          gasto => gasto.etiqueta?.toLowerCase().includes(searchParams.etiqueta!.toLowerCase())
        )
        return tieneIngresoConEtiqueta || tieneGastoConEtiqueta
      })
    }

    // Filtro por mes
    if (searchParams.mes !== undefined) {
      filtered = filtered.filter(movimiento => {
        const fecha = new Date(movimiento.fecha + 'T00:00:00')
        return fecha.getMonth() === searchParams.mes
      })
    }

    // Filtro por año
    if (searchParams.año !== undefined) {
      filtered = filtered.filter(movimiento => {
        const fecha = new Date(movimiento.fecha + 'T00:00:00')
        return fecha.getFullYear() === searchParams.año
      })
    }

    // Filtro por tipo
    if (searchParams.tipo) {
      filtered = filtered.filter(movimiento => {
        if (searchParams.tipo === 'ingreso') {
          return movimiento.ingresos.length > 0
        } else {
          return movimiento.gastos.length > 0
        }
      })
    }

    return filtered
  }, [movimientos, searchParams])

  const performSearch = () => {
    if (!searchQuery.trim()) return

    const params: SearchParams = {}
    
    // Parsear la consulta de búsqueda
    const queryLower = searchQuery.toLowerCase()
    
    if (queryLower.includes('etiqueta:')) {
      const etiquetaMatch = queryLower.match(/etiqueta:(\S+)/)
      if (etiquetaMatch) {
        params.etiqueta = etiquetaMatch[1]
      }
    } else {
      // Búsqueda simple por etiqueta
      params.etiqueta = searchQuery
    }

    setSearchParams(params)
  }

  const clearSearch = () => {
    setSearchParams({})
    setSearchQuery('')
  }

  const updateSearchParam = (key: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return {
    searchParams,
    searchQuery,
    setSearchQuery,
    filteredMovimientos,
    performSearch,
    clearSearch,
    updateSearchParam
  }
}