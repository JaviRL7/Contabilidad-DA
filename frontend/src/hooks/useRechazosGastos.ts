import { useState, useEffect } from 'react'

interface RechazoGasto {
  etiqueta: string
  fechaEsperada: string
  fechaRechazo: string
}

const STORAGE_KEY = 'rechazos_gastos_recurrentes'

export const useRechazosGastos = () => {
  const [rechazos, setRechazos] = useState<RechazoGasto[]>([])

  // Cargar rechazos del localStorage al inicializar
  useEffect(() => {
    try {
      const rechazosGuardados = localStorage.getItem(STORAGE_KEY)
      if (rechazosGuardados) {
        setRechazos(JSON.parse(rechazosGuardados))
      }
    } catch (error) {
      console.error('Error loading rechazos from localStorage:', error)
    }
  }, [])

  // Guardar rechazos en localStorage cuando cambien
  const saveRechazos = (nuevosRechazos: RechazoGasto[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosRechazos))
      setRechazos(nuevosRechazos)
    } catch (error) {
      console.error('Error saving rechazos to localStorage:', error)
    }
  }

  // Agregar un nuevo rechazo
  const agregarRechazo = (etiqueta: string, fechaEsperada: string) => {
    const nuevoRechazo: RechazoGasto = {
      etiqueta,
      fechaEsperada,
      fechaRechazo: new Date().toISOString().split('T')[0]
    }
    
    // Verificar que no exista ya
    const existe = rechazos.some(r => 
      r.etiqueta === etiqueta && r.fechaEsperada === fechaEsperada
    )
    
    if (!existe) {
      const nuevosRechazos = [...rechazos, nuevoRechazo]
      saveRechazos(nuevosRechazos)
    }
  }

  // Verificar si un gasto fue rechazado
  const estaRechazado = (etiqueta: string, fechaEsperada: string): boolean => {
    return rechazos.some(r => 
      r.etiqueta === etiqueta && r.fechaEsperada === fechaEsperada
    )
  }

  // Obtener el rechazo de un gasto específico
  const obtenerRechazo = (etiqueta: string, fechaEsperada: string): RechazoGasto | undefined => {
    return rechazos.find(r => 
      r.etiqueta === etiqueta && r.fechaEsperada === fechaEsperada
    )
  }

  // Eliminar rechazos de un gasto específico (cuando se elimina permanentemente)
  const limpiarRechazosDeGasto = (etiqueta: string) => {
    const nuevosRechazos = rechazos.filter(r => r.etiqueta !== etiqueta)
    saveRechazos(nuevosRechazos)
  }

  // Obtener todos los rechazos de un gasto específico
  const obtenerRechazosDeGasto = (etiqueta: string): RechazoGasto[] => {
    return rechazos.filter(r => r.etiqueta === etiqueta)
  }

  return {
    rechazos,
    agregarRechazo,
    estaRechazado,
    obtenerRechazo,
    limpiarRechazosDeGasto,
    obtenerRechazosDeGasto
  }
}