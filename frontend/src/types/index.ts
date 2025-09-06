export interface Ingreso {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

export interface Gasto {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
  esencial?: boolean
}

export interface MovimientoDiario {
  fecha: string
  ingresos: number
  gastos: number
  total: number
  esGanancia: boolean
  detalles: {
    ingresos: Ingreso[]
    gastos: Gasto[]
  }
}

export interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  step?: number
  min?: number
  max?: number
  className?: string
  isDark?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
}

export interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newName: string, isEssential: boolean) => void
  onToggleEssential: (isEssential: boolean) => void
  title: string
  editingTag: string
  editedTagName: string
  setEditedTagName: (name: string) => void
  isDark?: boolean
  etiquetasEsenciales: Set<string>
}

export interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tagName: string) => void
  tipo: 'gasto' | 'ingreso'
  isDark?: boolean
}

export interface ViewTagModalProps {
  isOpen: boolean
  onClose: () => void
  tag: string
  movimientos: (Ingreso | Gasto)[]
  isDark?: boolean
}

export interface EditRecurrentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (recurrent: any) => void
  recurrent: {
    id: string
    monto: string
    etiqueta: string
    esencial: boolean
  }
  etiquetas: string[]
  isDark?: boolean
}

export interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  movimiento: Ingreso | Gasto
  isDark?: boolean
  onDeleteItem: () => void
  onSaveChanges: (changes: any) => void
  etiquetas: string[]
}