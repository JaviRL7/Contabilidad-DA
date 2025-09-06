export const saveGastosRecurrentesToStorage = (gastos: Array<{
  id: string
  monto: string
  etiqueta: string
  esencial: boolean
}>) => {
  localStorage.setItem('gastosRecurrentes', JSON.stringify(gastos))
}

export const loadGastosRecurrentesFromStorage = () => {
  try {
    const stored = localStorage.getItem('gastosRecurrentes')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading gastos recurrentes from storage:', error)
  }
  return []
}