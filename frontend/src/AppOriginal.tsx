import React, { useState, useEffect } from 'react'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { parseISO } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'
import { BarChart3, TrendingUp, Plus } from 'lucide-react'
import ConfirmModal from './components/modals/ConfirmModal'

// Component for custom number input with styled buttons
interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  step?: number
  min?: number
  max?: number
  className?: string
  isDark?: boolean
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder = "0.00",
  step = 0.01,
  min,
  max,
  className = "",
  isDark = false
}) => {
  const increment = () => {
    const current = parseFloat(value) || 0
    const newValue = Math.min(current + step, max || Infinity)
    onChange(newValue.toFixed(2))
  }

  const decrement = () => {
    const current = parseFloat(value) || 0
    const newValue = Math.max(current - step, min || 0)
    onChange(newValue.toFixed(2))
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className={`pr-8 ${className} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none`}
        style={{ MozAppearance: 'textfield' }}
      />
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
        <button
          type="button"
          onClick={increment}
          className={`px-1 py-0.5 text-xs hover:scale-110 transition-transform ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={decrement}
          className={`px-1 py-0.5 text-xs hover:scale-110 transition-transform ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

interface Ingreso {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
}

interface Gasto {
  id: number
  monto: number
  etiqueta: string
  fecha: string
  created_at?: string
  es_recurrente?: boolean
  recurrente_id?: number
}

interface MovimientoDiario {
  id: number
  fecha: string
  ingreso_total: number
  ingresos: Ingreso[]
  gastos: Gasto[]
  total_gastos: number
  balance: number
  created_at?: string
  updated_at?: string
}

const API_BASE_URL = 'http://localhost:8000/api'

const formatEuro = (amount: number): string => {
  return `${amount.toFixed(2)} €`
}

const handleNumberChange = (
  currentValue: string | number,
  setter: React.Dispatch<React.SetStateAction<any>>,
  key: string,
  delta: number,
  decimalPlaces: number = 2 // Default to 2 for currency
) => {
  const numValue = parseFloat(currentValue.toString()) || 0;
  const newValue = (numValue + delta).toFixed(decimalPlaces);
  setter(prev => ({ ...prev, [key]: newValue }));
};

// Funciones para localStorage
const saveGastosRecurrentesToStorage = (gastos: Array<{
  id: number;
  etiqueta: string;
  monto: number;
  frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
  diaMes?: number;
  diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  mesAnual?: string;
  diaAnual?: string;
  ultimoProcesado?: string;
}>) => {
  localStorage.setItem('gastosRecurrentes', JSON.stringify(gastos))
}

const loadGastosRecurrentesFromStorage = () => {
  const saved = localStorage.getItem('gastosRecurrentes')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (error) {
      console.error('Error al cargar gastos recurrentes del localStorage:', error)
      return []
    }
  }
  return []
}

// Función para determinar si un gasto es recurrente y qué tipo es
const getGastoRecurrenteInfoGlobal = (etiqueta: string, gastosRecurrentes: any[]) => {
  const gastoRecurrente = gastosRecurrentes.find(gr => gr.etiqueta === etiqueta)
  if (gastoRecurrente) {
    return {
      esRecurrente: true,
      frecuencia: gastoRecurrente.frecuencia,
      label: gastoRecurrente.frecuencia === 'diario' ? 'Diario' :
             gastoRecurrente.frecuencia === 'semanal' ? 'Semanal' :
             gastoRecurrente.frecuencia === 'mensual' ? 'Mensual' : 'Anual',
      colorClass: gastoRecurrente.frecuencia === 'diario' ? 'bg-blue-500 text-white' :
                  gastoRecurrente.frecuencia === 'semanal' ? 'bg-green-500 text-white' :
                  gastoRecurrente.frecuencia === 'mensual' ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white',
      colorClassDark: gastoRecurrente.frecuencia === 'diario' ? 'bg-blue-600 text-blue-100' :
                      gastoRecurrente.frecuencia === 'semanal' ? 'bg-green-600 text-green-100' :
                      gastoRecurrente.frecuencia === 'mensual' ? 'bg-purple-600 text-purple-100' : 'bg-orange-600 text-orange-100'
    }
  }
  return { esRecurrente: false }
}

// Función para obtener los tipos de gastos recurrentes de un movimiento
const getTiposGastosRecurrentesGlobal = (gastos: any[], gastosRecurrentes: any[]) => {
  const tipos = gastos
    .map(gasto => getGastoRecurrenteInfoGlobal(gasto.etiqueta, gastosRecurrentes))
    .filter(info => info.esRecurrente)
    .reduce((acc, info) => {
      if (!acc.find(item => item.frecuencia === info.frecuencia)) {
        acc.push(info)
      }
      return acc
    }, [] as any[])
  
  return tipos.sort((a, b) => {
    const orden = ['diario', 'semanal', 'mensual', 'anual']
    return orden.indexOf(a.frecuencia) - orden.indexOf(b.frecuencia)
  })
}

// Etiquetas predefinidas
const ETIQUETAS_PREDEFINIDAS = {
  ingresos: [
    'Ventas', 'Ventas con tarjeta', 'Ventas Bolsos', 'Ventas conjuntos a mano'
  ],
  gastos: [
    'luz', 'agua', 'hipoteca', 'internet', 'telefono', 'gas', 'Seguro', 'gastos de sevilla', 'inversiones', 'obras'
  ]
}

// Componente Modal de confirmación

// Componente Modal para editar etiquetas
interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onToggleEssential: () => void
  title: string
  editingTag: {tipo: 'ingreso' | 'gasto', etiqueta: string} | null
  editedTagName: string
  setEditedTagName: (value: string) => void
  isDark: boolean
  etiquetasEsenciales: string[]
}

const EditTagModal = ({ isOpen, onClose, onConfirm, onToggleEssential, title, editingTag, editedTagName, setEditedTagName, isDark, etiquetasEsenciales }: EditTagModalProps) => {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm()
  }

  const isEssential = editingTag ? etiquetasEsenciales.includes(editingTag.etiqueta.toLowerCase()) : false
  const isGastoTag = editingTag?.tipo === 'gasto'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Editar etiqueta de {editingTag?.tipo === 'ingreso' ? 'ingreso' : 'gasto'}:
          </p>
          <input
            type="text"
            value={editedTagName}
            onChange={(e) => setEditedTagName(e.target.value)}
            className={`w-full px-3 py-2 rounded border mb-4 ${
              isDark 
                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Nombre de la etiqueta"
            autoFocus
          />
          
          {/* Toggle para etiquetas esenciales (solo para gastos) */}
          {isGastoTag && (
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isEssential}
                  onChange={onToggleEssential}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Marcar como gasto esencial
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Los gastos esenciales aparecen destacados en los análisis
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal para crear nueva etiqueta durante creación de movimientos
interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tagName: string, tipo: 'ingreso' | 'gasto') => void
  tipo: 'ingreso' | 'gasto'
  isDark: boolean
}

const CreateTagModal = ({ isOpen, onClose, onConfirm, tipo, isDark }: CreateTagModalProps) => {
  const [tagName, setTagName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tagName.trim()) {
      onConfirm(tagName.trim(), tipo)
      setTagName('')
    }
  }

  const handleClose = () => {
    setTagName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Crear Nueva Etiqueta
        </h3>
        <form onSubmit={handleSubmit}>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Crear etiqueta de {tipo === 'ingreso' ? 'ingreso' : 'gasto'}:
          </p>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            className={`w-full px-3 py-2 rounded border mb-4 ${
              isDark 
                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Nombre de la nueva etiqueta"
            autoFocus
          />
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!tagName.trim()}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !tagName.trim()
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : isDark
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal para ver detalles de etiqueta
interface ViewTagModalProps {
  isOpen: boolean
  onClose: () => void
  tag: {tipo: 'ingreso' | 'gasto', etiqueta: string} | null
  movimientos: MovimientoDiario[]
  isDark: boolean
}

const ViewTagModal = ({ isOpen, onClose, tag, movimientos, isDark }: ViewTagModalProps) => {
  if (!isOpen || !tag) return null

  // Calcular estadísticas de la etiqueta
  const estadisticas = (() => {
    let totalMonto = 0
    let conteoTransacciones = 0
    const mesesConTransacciones = new Set<string>()
    const transaccionesPorMes: { [mes: string]: number } = {}

    movimientos.forEach(mov => {
      const fecha = new Date(mov.fecha)
      const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

      if (tag.tipo === 'ingreso') {
        mov.ingresos.forEach(ingreso => {
          if (ingreso.etiqueta === tag.etiqueta) {
            totalMonto += ingreso.monto
            conteoTransacciones++
            mesesConTransacciones.add(mesNombre)
            transaccionesPorMes[mesNombre] = (transaccionesPorMes[mesNombre] || 0) + ingreso.monto
          }
        })
      } else {
        mov.gastos.forEach(gasto => {
          if (gasto.etiqueta === tag.etiqueta) {
            totalMonto += gasto.monto
            conteoTransacciones++
            mesesConTransacciones.add(mesNombre)
            transaccionesPorMes[mesNombre] = (transaccionesPorMes[mesNombre] || 0) + gasto.monto
          }
        })
      }
    })

    const mesesOrdenados = Object.keys(transaccionesPorMes).sort()
    const mediaMensual = mesesConTransacciones.size > 0 ? totalMonto / mesesConTransacciones.size : 0

    return {
      totalMonto,
      conteoTransacciones,
      mesesActivos: mesesConTransacciones.size,
      mediaMensual,
      transaccionesPorMes,
      mesesOrdenados
    }
  })()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Resumen de "{tag.etiqueta}"
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-opacity-10 ${
              isDark ? 'hover:bg-white text-gray-400' : 'hover:bg-gray-600 text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Estadísticas principales */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-2xl font-bold mb-1 ${
              tag.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatEuro(estadisticas.totalMonto)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Total {tag.tipo === 'ingreso' ? 'ingresos' : 'gastos'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {estadisticas.conteoTransacciones}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Transacciones
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-purple-500 mb-1">
              {formatEuro(estadisticas.mediaMensual)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Media mensual ({estadisticas.mesesActivos} meses)
            </div>
          </div>
        </div>

        {/* Desglose por meses */}
        {estadisticas.mesesOrdenados.length > 0 && (
          <div>
            <h4 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Desglose por Meses
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {estadisticas.mesesOrdenados.map(mes => (
                <div key={mes} className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                } flex justify-between items-center`}>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {mes}
                  </span>
                  <span className={`font-bold ${
                    tag.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatEuro(estadisticas.transaccionesPorMes[mes])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {estadisticas.conteoTransacciones === 0 && (
          <div className={`p-8 text-center rounded-lg border ${
            isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay transacciones registradas para esta etiqueta
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente Modal para editar gastos recurrentes
interface EditRecurrentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (recurrent: {etiqueta: string, monto: number, frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual', diaMes?: number, diaSemana?: string, mesAnual?: string, diaAnual?: string}) => void
  recurrent: {
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
    diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    mesAnual?: string;
    diaAnual?: string;
  } | null
  etiquetas: string[]
  isDark: boolean
}

const EditRecurrentModal = ({ isOpen, onClose, onConfirm, recurrent, etiquetas, isDark }: EditRecurrentModalProps) => {
  const [editedRecurrent, setEditedRecurrent] = useState({
    etiqueta: '',
    monto: '',
    frecuencia: 'mensual' as 'mensual' | 'semanal' | 'diario' | 'anual',
    diaMes: ''
  })

  useEffect(() => {
    if (recurrent) {
      setEditedRecurrent({
        etiqueta: recurrent.etiqueta,
        monto: recurrent.monto.toString(),
        frecuencia: recurrent.frecuencia,
        diaMes: recurrent.diaMes?.toString() || ''
      })
    }
  }, [recurrent])

  if (!isOpen || !recurrent) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedRecurrent.etiqueta || !editedRecurrent.monto) return

    onConfirm({
      etiqueta: editedRecurrent.etiqueta,
      monto: parseFloat(editedRecurrent.monto),
      frecuencia: editedRecurrent.frecuencia,
      diaMes: editedRecurrent.diaMes ? parseInt(editedRecurrent.diaMes) : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md mx-4 w-full`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Editar Gasto Recurrente
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Etiqueta
              </label>
              <div className="relative">
                <select 
                  value={editedRecurrent.etiqueta}
                  onChange={(e) => {
                    if (e.target.value === '__nueva__') {
                      handleCreateNewTag('editedRecurrent.etiqueta', 'gasto')
                    } else {
                      setEditedRecurrent(prev => ({...prev, etiqueta: e.target.value}))
                    }
                  }}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                >
                  <option value="">Seleccionar etiqueta...</option>
                  {etiquetas.map(etiq => (
                    <option key={etiq} value={etiq}>{etiq}</option>
                  ))}
                  <option value="__nueva__">
                    <Plus size={14} className="inline mr-1" />
                    Crear nueva etiqueta
                  </option>
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Monto
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={editedRecurrent.monto}
                  onChange={(e) => setEditedRecurrent(prev => ({...prev, monto: e.target.value}))}
                  className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="0.00"
                />
                {/* Custom increment/decrement buttons */}
                <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(editedRecurrent.monto) || 0;
                      setEditedRecurrent(prev => ({...prev, monto: (currentValue + 0.01).toFixed(2)}));
                    }}
                    className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                    }`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(editedRecurrent.monto) || 0;
                      const newValue = Math.max(0, currentValue - 0.01);
                      setEditedRecurrent(prev => ({...prev, monto: newValue.toFixed(2)}));
                    }}
                    className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                    }`}
                  >
                    −
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Frecuencia
              </label>
              <div className="relative">
                <select 
                  value={editedRecurrent.frecuencia}
                  onChange={(e) => setEditedRecurrent(prev => ({...prev, frecuencia: e.target.value as any}))}
                  className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                >
                  <option value="mensual">Mensual</option>
                  <option value="semanal">Semanal</option>
                  <option value="diario">Diario</option>
                  <option value="anual">Anual</option>
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {editedRecurrent.frecuencia === 'mensual' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Día del mes
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editedRecurrent.diaMes}
                    onChange={(e) => setEditedRecurrent(prev => ({...prev, diaMes: e.target.value}))}
                    className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Ej: 1"
                  />
                  {/* Custom increment/decrement buttons */}
                  <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(editedRecurrent.diaMes) || 0;
                        const newValue = Math.min(31, currentValue + 1);
                        setEditedRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                      }}
                      className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                      }`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(editedRecurrent.diaMes) || 0;
                        const newValue = Math.max(1, currentValue - 1);
                        setEditedRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                      }}
                      className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                      }`}
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                  : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
              }`}
            >
              <span className="relative z-10">Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={!editedRecurrent.etiqueta || !editedRecurrent.monto}
              className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !editedRecurrent.etiqueta || !editedRecurrent.monto
                  ? isDark
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDark
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Guardar
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de edición avanzado
interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  movimiento: MovimientoDiario | null
  isDark: boolean
  onDeleteItem: (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => void
  onSaveChanges: (movimiento: MovimientoDiario) => void
  etiquetas: {
    ingresos: string[]
    gastos: string[]
  }
}

const EditModal = ({ isOpen, onClose, movimiento: originalMovimiento, isDark, onDeleteItem, onSaveChanges, etiquetas }: EditModalProps) => {
  const [editedMovimiento, setEditedMovimiento] = useState<MovimientoDiario | null>(null)
  const [editingItem, setEditingItem] = useState<{tipo: 'ingreso' | 'gasto', id: number} | null>(null)
  const [showAddForm, setShowAddForm] = useState<'ingreso' | 'gasto' | null>(null)
  const [tempValues, setTempValues] = useState({etiqueta: '', monto: ''})
  const [newItem, setNewItem] = useState({tipo: '', etiqueta: '', monto: ''})

  useEffect(() => {
    if (originalMovimiento) {
      setEditedMovimiento({...originalMovimiento})
    }
  }, [originalMovimiento])

  if (!isOpen || !editedMovimiento) return null

  const handleSave = () => {
    if (editedMovimiento) {
      onSaveChanges(editedMovimiento)
      onClose()
    }
  }

  const handleDateChange = (newDate: string) => {
    setEditedMovimiento(prev => prev ? {...prev, fecha: newDate} : null)
  }

  const handleEditItem = (tipo: 'ingreso' | 'gasto', id: number, etiqueta: string, monto: number) => {
    setEditingItem({tipo, id})
    setTempValues({etiqueta, monto: monto.toString()})
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    
    const monto = parseFloat(tempValues.monto)
    if (isNaN(monto) || monto <= 0) return

    setEditedMovimiento(prev => {
      if (!prev) return null
      
      if (editingItem.tipo === 'ingreso') {
        const newIngresos = prev.ingresos.map(i => 
          i.id === editingItem.id 
            ? {...i, etiqueta: tempValues.etiqueta, monto}
            : i
        )
        const newTotal = newIngresos.reduce((sum, i) => sum + i.monto, 0)
        return {
          ...prev,
          ingresos: newIngresos,
          ingreso_total: newTotal,
          balance: newTotal - prev.total_gastos
        }
      } else {
        const newGastos = prev.gastos.map(g => 
          g.id === editingItem.id 
            ? {...g, etiqueta: tempValues.etiqueta, monto}
            : g
        )
        const newTotal = newGastos.reduce((sum, g) => sum + g.monto, 0)
        return {
          ...prev,
          gastos: newGastos,
          total_gastos: newTotal,
          balance: prev.ingreso_total - newTotal
        }
      }
    })
    
    setEditingItem(null)
    setTempValues({etiqueta: '', monto: ''})
  }

  const handleAddItem = () => {
    const monto = parseFloat(newItem.monto)
    if (!newItem.etiqueta || isNaN(monto) || monto <= 0) return

    const newId = Date.now() // Temporal ID
    const item = {
      id: newId,
      etiqueta: newItem.etiqueta,
      monto,
      fecha: editedMovimiento.fecha,
      created_at: new Date().toISOString()
    }

    setEditedMovimiento(prev => {
      if (!prev) return null
      
      if (showAddForm === 'ingreso') {
        const newIngresos = [...prev.ingresos, item]
        const newTotal = newIngresos.reduce((sum, i) => sum + i.monto, 0)
        return {
          ...prev,
          ingresos: newIngresos,
          ingreso_total: newTotal,
          balance: newTotal - prev.total_gastos
        }
      } else {
        const newGastos = [...prev.gastos, item]
        const newTotal = newGastos.reduce((sum, g) => sum + g.monto, 0)
        return {
          ...prev,
          gastos: newGastos,
          total_gastos: newTotal,
          balance: prev.ingreso_total - newTotal
        }
      }
    })

    setNewItem({tipo: '', etiqueta: '', monto: ''})
    setShowAddForm(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-auto`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Editar Movimiento
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <DatePicker
                  selected={parseISO(editedMovimiento.fecha)}
                  onChange={(date: Date) => handleDateChange(formatDateForAPI(date))}
                  className={`w-full px-3 py-1 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  wrapperClassName="w-full"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Línea separadora vertical */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
              <div className={`h-full w-full ${
                isDark 
                  ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                  : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
              }`}></div>
            </div>

            {/* Ingresos */}
            <div className="pr-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-green-500 font-semibold text-lg mb-2">
                    Ingresos ({formatEuro(editedMovimiento.ingreso_total)})
                  </h3>
                  <div className={`h-px w-full ${
                    isDark 
                      ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                  }`}></div>
                </div>
                <button
                  onClick={() => setShowAddForm('ingreso')}
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                      : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                  }`}
                  title="Agregar ingreso"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agregar Ingreso
                  </span>
                </button>
              </div>

              {/* Formulario agregar ingreso */}
              {showAddForm === 'ingreso' && (
                <div className={`p-4 rounded-lg border mb-4 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="space-y-3">
                    <div className="relative">
                      <select
                        value={newItem.etiqueta}
                        onChange={(e) => {
                          if (e.target.value === '__nueva__') {
                            handleCreateNewTag('newItem.etiqueta', 'ingreso')
                          } else {
                            setNewItem(prev => ({...prev, etiqueta: e.target.value}))
                          }
                        }}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                      >
                        <option value="">Seleccionar etiqueta...</option>
                        {etiquetas.ingresos.map(etiq => (
                          <option key={etiq} value={etiq}>{etiq}</option>
                        ))}
                        <option value="__nueva__">+ Crear nueva etiqueta</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={newItem.monto}
                        onChange={(e) => setNewItem(prev => ({...prev, monto: e.target.value}))}
                        className={`w-full px-3 py-2 rounded border pr-10 ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                      <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pr-2">
                        <button
                          type="button"
                          onClick={() => handleNumberChange(newItem.monto, setNewItem, 'monto', 0.01)}
                          className={`h-1/2 w-6 flex items-center justify-center rounded-t-md ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNumberChange(newItem.monto, setNewItem, 'monto', -0.01)}
                          className={`h-1/2 w-6 flex items-center justify-center rounded-b-md ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddItem}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                            : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Agregar
                        </span>
                      </button>
                      <button
                        onClick={() => setShowAddForm(null)}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                            : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {editedMovimiento.ingresos.length > 0 ? (
                <div className="space-y-3">
                  {editedMovimiento.ingresos.map((ingreso) => (
                    <div key={ingreso.id} className={`p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                    }`}>
                      {editingItem?.tipo === 'ingreso' && editingItem?.id === ingreso.id ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={tempValues.etiqueta}
                              onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                              className={`appearance-none w-full px-2 py-1 pr-10 rounded border text-sm ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                            >
                              {etiquetas.ingresos.map(etiq => (
                                <option key={etiq} value={etiq}>{etiq}</option>
                              ))}
                            </select>
                            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={tempValues.monto}
                            onChange={(e) => setTempValues(prev => ({...prev, monto: e.target.value}))}
                            className={`w-full px-2 py-1 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="cursor-pointer" onClick={() => handleEditItem('ingreso', ingreso.id, ingreso.etiqueta, ingreso.monto)}>
                            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {ingreso.etiqueta}
                            </div>
                            <div className="text-green-500 font-semibold text-sm">
                              {formatEuro(ingreso.monto)}
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteItem(editedMovimiento.id, 'ingreso', ingreso.id)}
                            className="group p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Eliminar ingreso"
                          >
                            <svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-sm italic">No hay ingresos</p>
                </div>
              )}
            </div>

            {/* Gastos */}
            <div className="pl-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-red-500 font-semibold text-lg mb-2">
                    Gastos ({formatEuro(editedMovimiento.total_gastos)})
                  </h3>
                  <div className={`h-px w-full ${
                    isDark 
                      ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                  }`}></div>
                </div>
                <button
                  onClick={() => setShowAddForm('gasto')}
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                  }`}
                  title="Agregar gasto"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agregar Gasto
                  </span>
                </button>
              </div>

              {/* Formulario agregar gasto */}
              {showAddForm === 'gasto' && (
                <div className={`p-4 rounded-lg border mb-4 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="space-y-3">
                    <div className="relative">
                      <select
                        value={newItem.etiqueta}
                        onChange={(e) => {
                          if (e.target.value === '__nueva__') {
                            handleCreateNewTag('newItem.etiqueta', 'gasto')
                          } else {
                            setNewItem(prev => ({...prev, etiqueta: e.target.value}))
                          }
                        }}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                      >
                        <option value="">Seleccionar etiqueta...</option>
                        {etiquetas.gastos.map(etiq => (
                          <option key={etiq} value={etiq}>{etiq}</option>
                        ))}
                        <option value="__nueva__">+ Crear nueva etiqueta</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      value={newItem.monto}
                      onChange={(e) => setNewItem(prev => ({...prev, monto: e.target.value}))}
                      className={`w-full px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddItem}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                            : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Agregar
                        </span>
                      </button>
                      <button
                        onClick={() => setShowAddForm(null)}
                        className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                            : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {editedMovimiento.gastos.length > 0 ? (
                <div className="space-y-3">
                  {editedMovimiento.gastos.map((gasto) => (
                    <div key={gasto.id} className={`p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                    }`}>
                      {editingItem?.tipo === 'gasto' && editingItem?.id === gasto.id ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={tempValues.etiqueta}
                              onChange={(e) => setTempValues(prev => ({...prev, etiqueta: e.target.value}))}
                              className={`appearance-none w-full px-2 py-1 pr-10 rounded border text-sm ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                            >
                              {etiquetas.gastos.map(etiq => (
                                <option key={etiq} value={etiq}>{etiq}</option>
                              ))}
                            </select>
                            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={tempValues.monto}
                            onChange={(e) => setTempValues(prev => ({...prev, monto: e.target.value}))}
                            className={`w-full px-2 py-1 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="cursor-pointer" onClick={() => handleEditItem('gasto', gasto.id, gasto.etiqueta, gasto.monto)}>
                            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {gasto.etiqueta}
                            </div>
                            <div className="text-red-500 font-semibold text-sm">
                              {formatEuro(gasto.monto)}
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteItem(editedMovimiento.id, 'gasto', gasto.id)}
                            className="group p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Eliminar gasto"
                          >
                            <svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-sm italic">No hay gastos</p>
                </div>
              )}
            </div>
          </div>

          {/* Balance y botones */}
          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Balance del día:
              </span>
              <span className="text-2xl font-bold text-blue-500">
                {formatEuro(editedMovimiento.balance)}
              </span>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </span>
              </button>
              <button
                onClick={handleSave}
                className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guardar Cambios
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de página de desglose anual
const YearlyBreakdown = ({ 
  movimientos, 
  onBack, 
  isDark,
  onGoToMonthly
}: { 
  movimientos: MovimientoDiario[]
  onBack: () => void
  isDark: boolean
  onGoToMonthly: (month: number, year: number) => void
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showYearCard, setShowYearCard] = useState(false)
  const [yearCardPage, setYearCardPage] = useState(0)
  
  // Obtener años que tienen movimientos
  const getAvailableYears = () => {
    const yearsWithMovements = new Set<number>()
    
    movimientos.forEach(mov => {
      const date = new Date(mov.fecha)
      yearsWithMovements.add(date.getFullYear())
    })
    
    return Array.from(yearsWithMovements).sort((a, b) => b - a) // Años más recientes primero
  }
  
  const availableYears = getAvailableYears()
  
  const yearlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getFullYear() === currentYear
  })
  
  // Agrupar por mes
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthMovimientos = yearlyMovimientos.filter(m => {
      const date = new Date(m.fecha)
      return date.getMonth() === monthIndex
    })
    
    const totalIngresos = monthMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
    const totalGastos = monthMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
    const balance = totalIngresos - totalGastos
    
    return {
      month: monthIndex,
      monthName: new Date(currentYear, monthIndex).toLocaleDateString('es-ES', { month: 'long' }),
      totalIngresos,
      totalGastos,
      balance,
      movimientosCount: monthMovimientos.length
    }
  }).reverse() // Diciembre arriba, enero abajo
  
  const yearlyTotals = {
    ingresos: monthlyData.reduce((sum, m) => sum + m.totalIngresos, 0),
    gastos: monthlyData.reduce((sum, m) => sum + m.totalGastos, 0),
    balance: monthlyData.reduce((sum, m) => sum + m.balance, 0)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">

        {/* Cabecera del desglose anual */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
          {/* Primera línea: Título y botón volver */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={`group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver
                </span>
              </button>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Resumen anual
              </h2>
            </div>
          </div>
          
          {/* Segunda línea: Año con navegación */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {currentYear - 1}
              </span>
            </button>
            
            <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentYear}
            </div>
            
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {currentYear + 1}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
          
          {/* Botón para volver al año actual */}
          {currentYear !== new Date().getFullYear() && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setCurrentYear(new Date().getFullYear())}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
                }`}
              >
                Volver a {new Date().getFullYear()}
              </button>
            </div>
          )}
          
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
            }`}>
              <div className="text-2xl font-bold text-green-500 mb-1">
                {formatEuro(yearlyTotals.ingresos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Ingresos
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-2xl font-bold text-red-500 mb-1">
                {formatEuro(yearlyTotals.gastos)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Gastos
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="text-2xl font-bold mb-1 text-blue-500">
                {formatEuro(yearlyTotals.balance)}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Balance Total
              </div>
            </div>
          </div>
        </div>

        {/* Card expandible para años */}
        <div className={`rounded-lg shadow p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => setShowYearCard(!showYearCard)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Comprobar los años con movimientos
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showYearCard ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showYearCard && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              {(() => {
                const itemsPerPage = 12
                const totalPages = Math.ceil(availableYears.length / itemsPerPage)
                const startIndex = yearCardPage * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const currentPageItems = availableYears.slice(startIndex, endIndex)
                
                return (
                  <>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {currentPageItems.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setCurrentYear(year)
                            setShowYearCard(false)
                            setYearCardPage(0) // Reset page when selecting
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            year === currentYear
                              ? isDark
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-500 text-white shadow-md'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center mt-4 gap-3">
                        <button
                          onClick={() => setYearCardPage(prev => Math.max(0, prev - 1))}
                          disabled={yearCardPage === 0}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            yearCardPage === 0
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          ←
                        </button>
                        
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {yearCardPage + 1} de {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setYearCardPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={yearCardPage === totalPages - 1}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            yearCardPage === totalPages - 1
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Comparativa Anual - mostrar solo si hay movimientos en el año actual y otros años */}
        {yearlyMovimientos.length > 0 && availableYears.length > 1 && (
          (() => {
            // Filtrar otros años (excluir el año actual)
            const otrosAños = availableYears.filter(año => año !== currentYear)
            
            if (otrosAños.length === 0) {
              return null
            }
            
            // Calcular totales por año
            const totalesPorAño = otrosAños.map(año => {
              const movimientosAño = movimientos.filter(mov => {
                const fechaMov = new Date(mov.fecha)
                return fechaMov.getFullYear() === año
              })
              
              return {
                año,
                totalIngresos: movimientosAño.reduce((sum, mov) => sum + mov.ingreso_total, 0),
                totalGastos: movimientosAño.reduce((sum, mov) => sum + mov.total_gastos, 0),
                balance: movimientosAño.reduce((sum, mov) => sum + mov.balance, 0),
                diasConMovimientos: movimientosAño.length
              }
            }).sort((a, b) => b.año - a.año)
            
            return (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-8 mb-8`}>
                <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Comparativa Anual
                </h3>
                <p className={`text-base mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Análisis comparativo entre diferentes años con movimientos
                </p>
                
                <div className="space-y-8">
                  {/* Año actual destacado */}
                  <div className={`p-6 rounded-lg border-2 ${
                    isDark ? 'bg-purple-900/20 border-purple-500' : 'bg-purple-50 border-purple-400'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        {currentYear} (Año Actual)
                      </h4>
                      {/* Mostrar comparación con el año anterior si existe */}
                      {(() => {
                        const añoAnterior = totalesPorAño.find(t => t.año === currentYear - 1)
                        if (añoAnterior) {
                          const diferencia = yearlyTotals.balance - añoAnterior.balance
                          const porcentaje = añoAnterior.balance !== 0 ? ((diferencia / Math.abs(añoAnterior.balance)) * 100) : 0
                          if (diferencia !== 0) {
                            return (
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                diferencia > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {diferencia > 0 ? '↗' : '↘'} {Math.abs(porcentaje).toFixed(1)}% vs {añoAnterior.año}
                              </div>
                            )
                          }
                        }
                        return null
                      })()}
                    </div>
                    
                    {/* X días con movimientos */}
                    <div className="mb-4 text-center">
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {yearlyMovimientos.length} días con movimientos
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center gap-8">
                      <div className="text-center">
                        <div className={`text-lg font-bold mb-2 text-green-500`}>
                          Ingresos
                        </div>
                        <div className="text-2xl font-bold text-green-500">
                          {formatEuro(yearlyTotals.ingresos)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold mb-2 text-red-500`}>
                          Gastos
                        </div>
                        <div className="text-2xl font-bold text-red-500">
                          {formatEuro(yearlyTotals.gastos)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold mb-2 text-blue-500`}>
                          Balance
                        </div>
                        <div className="text-2xl font-bold text-blue-500">
                          {formatEuro(yearlyTotals.balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Otros años */}
                  <div className="space-y-6">
                    {totalesPorAño.map(año => (
                      <div key={año.año} className={`p-5 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {año.año}
                          </h4>
                          {/* Comparación con año actual */}
                          {(() => {
                            const diferencia = yearlyTotals.balance - año.balance
                            const porcentaje = año.balance !== 0 ? ((diferencia / Math.abs(año.balance)) * 100) : 0
                            if (diferencia !== 0) {
                              return (
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  diferencia > 0 
                                    ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                                    : isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                                }`}>
                                  {diferencia > 0 ? '+' : ''}{Math.abs(porcentaje).toFixed(1)}% vs {currentYear}
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                        
                        {/* X días con movimientos */}
                        <div className="mb-4 text-center">
                          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {año.diasConMovimientos} días con movimientos
                          </div>
                        </div>
                        
                        <div className="flex justify-center items-center gap-8">
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 text-green-500`}>
                              Ingresos
                            </div>
                            <div className="text-2xl font-bold text-green-500">
                              {formatEuro(año.totalIngresos)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 text-red-500`}>
                              Gastos
                            </div>
                            <div className="text-2xl font-bold text-red-500">
                              {formatEuro(año.totalGastos)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 text-blue-500`}>
                              Balance
                            </div>
                            <div className="text-2xl font-bold text-blue-500">
                              {formatEuro(año.balance)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Gráfica comparativa de ingresos por años */}
                  <div className={`mt-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Comparativa de Ingresos por Año
                    </h4>
                    
                    {(() => {
                      // Obtener todos los años con datos incluyendo el actual
                      const todosLosAños = [
                        { año: currentYear, totalIngresos: yearlyTotals.ingresos },
                        ...totalesPorAño.map(año => ({ año: año.año, totalIngresos: año.totalIngresos }))
                      ].sort((a, b) => a.año - b.año) // Ordenar por año ascendente
                      
                      // Encontrar el valor máximo para escalar las barras
                      const maxIngresos = Math.max(...todosLosAños.map(año => año.totalIngresos))
                      
                      return (
                        <div className="space-y-4">
                          {todosLosAños.map((año) => (
                            <div key={año.año} className="flex items-center gap-4">
                              <div className={`w-16 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {año.año}
                              </div>
                              <div className="flex-1 relative">
                                <div className={`h-8 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'} relative overflow-hidden`}>
                                  <div 
                                    className={`h-full rounded-lg transition-all duration-700 ${
                                      año.año === currentYear 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                        : 'bg-gradient-to-r from-green-400 to-green-600'
                                    }`}
                                    style={{
                                      width: maxIngresos > 0 ? `${(año.totalIngresos / maxIngresos) * 100}%` : '0%'
                                    }}
                                  />
                                  <div className={`absolute inset-0 flex items-center px-3 text-sm font-medium ${
                                    año.año === currentYear ? 'text-white' : 'text-white'
                                  }`}>
                                    {formatEuro(año.totalIngresos)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })()
        )}

        {/* Desglose por meses */}
        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Desglose Mensual
          </h3>
          {monthlyData.map((monthData) => (
            <div key={monthData.month} className={`rounded-lg shadow p-6 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => onGoToMonthly(monthData.month, currentYear)}
                  className={`group relative overflow-hidden px-4 py-2 rounded-lg text-lg font-semibold capitalize transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                      : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {monthData.monthName}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {monthData.movimientosCount} días con movimientos
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center">
                  <span className="text-green-500 font-medium">Ingresos:</span>
                  <span className="font-semibold text-green-500">
                    {formatEuro(monthData.totalIngresos)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-px h-8 mr-6 ${
                    isDark 
                      ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                      : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
                  }`}></div>
                  <div className="flex justify-between items-center flex-1">
                    <span className="text-red-500 font-medium">Gastos:</span>
                    <span className="font-semibold text-red-500">
                      {formatEuro(monthData.totalGastos)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className={`h-px w-full mb-3 ${
                  isDark 
                    ? 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent' 
                    : 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent'
                }`}></div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-500">Balance:</span>
                  <span className="font-bold text-blue-500">
                    {formatEuro(monthData.balance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {monthlyData.every(m => m.movimientosCount === 0) && (
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No hay movimientos registrados para el año {currentYear}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de página de desglose mensual
const MonthlyBreakdown = ({ 
  movimientos, 
  onBack, 
  isDark,
  onUpdateMovimiento,
  onDeleteMovimiento,
  onDeleteItem,
  initialMonth = new Date().getMonth(),
  initialYear = new Date().getFullYear(),
  etiquetas,
  onGoToYearly,
  onRefreshMovimientos,
  onError,
  gastosRecurrentes
}: { 
  movimientos: MovimientoDiario[]
  onBack: () => void
  isDark: boolean
  onUpdateMovimiento: (updatedMovimiento: MovimientoDiario) => Promise<void>
  onDeleteMovimiento: (movimiento: MovimientoDiario) => void
  onDeleteItem: (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => Promise<void>
  initialMonth?: number
  initialYear?: number
  etiquetas: {
    ingresos: string[]
    gastos: string[]
  }
  onGoToYearly?: (year: number) => void
  onRefreshMovimientos?: () => Promise<void>
  onError?: (error: string) => void
  gastosRecurrentes?: any[]
}) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [currentYear, setCurrentYear] = useState(initialYear)
  
  // Estados locales para modales
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoDiario | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null)
  
  // Estado para la card expandible de meses
  const [showMonthCard, setShowMonthCard] = useState(false)
  const [monthCardPage, setMonthCardPage] = useState(0)
  
  // Obtener meses que tienen movimientos
  const getAvailableMonths = () => {
    const monthsWithMovements = new Set<string>()
    
    movimientos.forEach(mov => {
      const date = new Date(mov.fecha)
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`
      monthsWithMovements.add(monthYear)
    })
    
    return Array.from(monthsWithMovements)
      .map(monthYear => {
        const [year, month] = monthYear.split('-')
        return {
          year: parseInt(year),
          month: parseInt(month),
          key: monthYear,
          label: new Date(parseInt(year), parseInt(month)).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
          })
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year // Años más recientes primero
        return b.month - a.month // Meses más recientes primero
      })
  }
  
  const availableMonths = getAvailableMonths()
  
  const monthlyMovimientos = movimientos.filter(m => {
    const date = new Date(m.fecha)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).sort((a, b) => new Date(b.fecha).getDate() - new Date(a.fecha).getDate()) // Orden descendente por día

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(prev => prev - 1)
      } else {
        setCurrentMonth(prev => prev - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
    }
  }

  return (
    <>
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Cabecera del desglose mensual */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
          {/* Primera línea: Título y botón volver */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={`group relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400'
                    : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-400 hover:to-gray-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver
                </span>
              </button>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Desglose mensual
              </h2>
            </div>
            <button
              onClick={() => {
                if (onGoToYearly) {
                  onGoToYearly(currentYear)
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                  : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
              }`}
              title="Ver desglose anual"
            >
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Ver Anual
              </span>
            </button>
          </div>
          
          {/* Segunda línea: Mes con navegación */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {new Date(currentYear, currentMonth - 1).toLocaleDateString('es-ES', { month: 'short' })}
              </span>
            </button>
            
            <div className={`text-4xl font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long' })} {currentYear}
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {new Date(currentYear, currentMonth + 1).toLocaleDateString('es-ES', { month: 'short' })}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
          
          {/* Cards de totales - solo mostrar si hay movimientos */}
          {monthlyMovimientos.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              }`}>
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {formatEuro(monthlyMovimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0))}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Ingresos
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-2xl font-bold text-red-500 mb-1">
                  {formatEuro(monthlyMovimientos.reduce((sum, mov) => sum + mov.total_gastos, 0))}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Gastos
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="text-2xl font-bold mb-1 text-blue-500">
                  {formatEuro(monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0))}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Balance Total
                </div>
              </div>
            </div>
          )}
          
          {/* Botón para volver al mes actual */}
          {(currentYear !== new Date().getFullYear() || currentMonth !== new Date().getMonth()) && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => {
                  setCurrentYear(new Date().getFullYear())
                  setCurrentMonth(new Date().getMonth())
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
                }`}
              >
                Volver a {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </button>
            </div>
          )}
          
        </div>

        
        {/* Card expandible para meses */}
        <div className={`rounded-lg shadow p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => setShowMonthCard(!showMonthCard)}
            className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-medium">Comprobar los meses con movimientos</span>
            <svg
              className={`w-4 h-4 transition-transform ${showMonthCard ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showMonthCard && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              {(() => {
                const itemsPerPage = 12
                const totalPages = Math.ceil(availableMonths.length / itemsPerPage)
                const startIndex = monthCardPage * itemsPerPage
                const endIndex = startIndex + itemsPerPage
                const currentPageItems = availableMonths.slice(startIndex, endIndex)
                
                return (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {currentPageItems.map(({ year, month, key, label }) => (
                        <button
                          key={key}
                          onClick={() => {
                            const [yearStr, monthStr] = key.split('-')
                            setCurrentYear(parseInt(yearStr))
                            setCurrentMonth(parseInt(monthStr))
                            setShowMonthCard(false)
                            setMonthCardPage(0) // Reset page when selecting
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            key === `${currentYear}-${currentMonth}`
                              ? isDark
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-500 text-white shadow-md'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center mt-4 gap-3">
                        <button
                          onClick={() => setMonthCardPage(prev => Math.max(0, prev - 1))}
                          disabled={monthCardPage === 0}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            monthCardPage === 0
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          ←
                        </button>
                        
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {monthCardPage + 1} de {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setMonthCardPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={monthCardPage === totalPages - 1}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            monthCardPage === totalPages - 1
                              ? isDark
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                          }`}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
        

        {/* Sección de Análisis Comparativo */}
        {monthlyMovimientos.length > 0 && (
          (() => {
            // Obtener el mes y año actuales del desglose
            const mesActual = currentMonth
            const añoActual = currentYear
            
            // Buscar movimientos del mismo mes en otros años
            const movimientosComparativos = movimientos.filter(mov => {
              const fechaMov = new Date(mov.fecha)
              return fechaMov.getMonth() === mesActual && fechaMov.getFullYear() !== añoActual
            })
            
            if (movimientosComparativos.length === 0) {
              return null
            }
            
            // Agrupar por años
            const movimientosPorAño = {}
            movimientosComparativos.forEach(mov => {
              const año = new Date(mov.fecha).getFullYear()
              if (!movimientosPorAño[año]) {
                movimientosPorAño[año] = []
              }
              movimientosPorAño[año].push(mov)
            })
            
            // Calcular totales por año
            const totalesPorAño = Object.keys(movimientosPorAño).map(año => {
              const movs = movimientosPorAño[año]
              return {
                año: parseInt(año),
                totalIngresos: movs.reduce((sum, mov) => sum + mov.ingreso_total, 0),
                totalGastos: movs.reduce((sum, mov) => sum + mov.total_gastos, 0),
                balance: movs.reduce((sum, mov) => sum + mov.balance, 0)
              }
            }).sort((a, b) => b.año - a.año)
            
            // Totales del mes actual
            const totalesActuales = {
              totalIngresos: monthlyMovimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0),
              totalGastos: monthlyMovimientos.reduce((sum, mov) => sum + mov.total_gastos, 0),
              balance: monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0)
            }
            
            // Obtener todos los años disponibles para comparar
            const añosDisponibles = movimientos.reduce((años, mov) => {
              const año = new Date(mov.fecha).getFullYear()
              if (!años.includes(año) && año !== añoActual) {
                años.push(año)
              }
              return años
            }, []).sort((a, b) => b - a)

            return (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Comparativa de {new Date(añoActual, mesActual).toLocaleDateString('es-ES', { month: 'long' })}
                </h3>
                <p className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Análisis comparativo del mismo mes en diferentes años
                </p>
                
                <div className="space-y-6">
                  {/* Módulo actual destacado */}
                  <div className={`p-5 rounded-lg border-2 ${
                    isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        {new Date(añoActual, mesActual).toLocaleDateString('es-ES', { month: 'long' })} {añoActual}
                      </h4>
                      <div className="flex items-center gap-3">
                        {/* Mostrar comparación con el año anterior si existe */}
                        {(() => {
                          const añoAnterior = totalesPorAño.find(t => t.año === añoActual - 1)
                          if (añoAnterior) {
                            const diferencia = totalesActuales.balance - añoAnterior.balance
                            const porcentaje = añoAnterior.balance !== 0 ? ((diferencia / Math.abs(añoAnterior.balance)) * 100) : 0
                            if (diferencia !== 0) {
                              return (
                                <span className={`text-sm px-3 py-1 rounded-full ${
                                  diferencia > 0
                                    ? isDark ? 'bg-green-800/50 text-green-300' : 'bg-green-100 text-green-800'
                                    : isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-800'
                                }`}>
                                  {diferencia > 0 ? '↗' : '↘'} {Math.abs(porcentaje).toFixed(1)}% vs {añoAnterior.año}
                                </span>
                              )
                            }
                          }
                          return null
                        })()}
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          isDark ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Mes actual
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-left">
                        <span className={`text-green-500 font-medium text-base`}>Ingresos:</span>
                        <div className="font-semibold text-lg text-green-500">
                          {formatEuro(totalesActuales.totalIngresos)}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className={`text-red-500 font-medium text-base`}>Gastos:</span>
                        <div className="font-semibold text-lg text-red-500">
                          {formatEuro(totalesActuales.totalGastos)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium text-base ${totalesActuales.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                          Balance:
                        </span>
                        <div className={`font-semibold text-lg ${totalesActuales.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                          {formatEuro(totalesActuales.balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Años de comparación */}
                  {añosDisponibles.map(año => {
                    const movimientosDelAño = movimientosPorAño[año]
                    
                    if (!movimientosDelAño || movimientosDelAño.length === 0) {
                      return (
                        <div key={año} className={`p-5 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                        }`}>
                          <div className="flex justify-between items-center">
                            <h4 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {new Date(año, mesActual).toLocaleDateString('es-ES', { month: 'long' })} {año}
                            </h4>
                            <span className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Sin movimientos registrados
                            </span>
                          </div>
                        </div>
                      )
                    }

                    const totalesAño = totalesPorAño.find(t => t.año === año)
                    
                    return (
                      <div key={año} className={`p-5 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                      }`}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {new Date(año, mesActual).toLocaleDateString('es-ES', { month: 'long' })} {año}
                          </h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-left">
                            <span className={`text-green-500 font-medium text-base`}>Ingresos:</span>
                            <div className="font-semibold text-lg text-green-500">
                              {formatEuro(totalesAño.totalIngresos)}
                            </div>
                          </div>
                          <div className="text-center">
                            <span className={`text-red-500 font-medium text-base`}>Gastos:</span>
                            <div className="font-semibold text-lg text-red-500">
                              {formatEuro(totalesAño.totalGastos)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-medium text-base ${totalesAño.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                              Balance:
                            </span>
                            <div className={`font-semibold text-lg ${totalesAño.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                              {formatEuro(totalesAño.balance)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()
        )}

        {/* Gráfica de barras con recharts debajo de la comparativa */}
        {monthlyMovimientos.length > 0 && (
          (() => {
            // Obtener el mes y año actuales del desglose
            const mesActual = currentMonth
            const añoActual = currentYear
            
            // Buscar movimientos del mismo mes en otros años
            const movimientosComparativos = movimientos.filter(mov => {
              const fechaMov = new Date(mov.fecha)
              return fechaMov.getMonth() === mesActual && fechaMov.getFullYear() !== añoActual
            })
            
            if (movimientosComparativos.length === 0) {
              return null
            }
            
            // Agrupar por años
            const movimientosPorAño = {}
            movimientosComparativos.forEach(mov => {
              const año = new Date(mov.fecha).getFullYear()
              if (!movimientosPorAño[año]) {
                movimientosPorAño[año] = []
              }
              movimientosPorAño[año].push(mov)
            })
            
            // Calcular totales por año
            const totalesPorAño = Object.keys(movimientosPorAño).map(año => {
              const movs = movimientosPorAño[año]
              return {
                año: parseInt(año),
                totalIngresos: movs.reduce((sum, mov) => sum + mov.ingreso_total, 0),
                totalGastos: movs.reduce((sum, mov) => sum + mov.total_gastos, 0),
                balance: movs.reduce((sum, mov) => sum + mov.balance, 0)
              }
            }).sort((a, b) => a.año - b.año)
            
            // Totales del mes actual
            const totalesActuales = {
              año: añoActual,
              totalIngresos: monthlyMovimientos.reduce((sum, mov) => sum + mov.ingreso_total, 0),
              totalGastos: monthlyMovimientos.reduce((sum, mov) => sum + mov.total_gastos, 0),
              balance: monthlyMovimientos.reduce((sum, mov) => sum + mov.balance, 0)
            }
            
            // Combinar todos los datos para la gráfica
            const datosGrafica = [
              ...totalesPorAño.map(año => ({
                año: año.año.toString(),
                ingresos: año.totalIngresos,
                gastos: año.totalGastos,
                balance: año.balance
              })),
              {
                año: añoActual.toString(),
                ingresos: totalesActuales.totalIngresos,
                gastos: totalesActuales.totalGastos,
                balance: totalesActuales.balance
              }
            ].sort((a, b) => parseInt(a.año) - parseInt(b.año))
            
            return (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Comparativa Gráfica por Años - {new Date(añoActual, mesActual).toLocaleDateString('es-ES', { month: 'long' })}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGrafica} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
                      <XAxis 
                        dataKey="año" 
                        stroke={isDark ? '#9CA3AF' : '#6B7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDark ? '#9CA3AF' : '#6B7280'}
                        fontSize={12}
                        tickFormatter={(value) => `${value.toFixed(0)}€`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#374151' : '#FFFFFF',
                          borderColor: isDark ? '#4B5563' : '#D1D5DB',
                          color: isDark ? '#F3F4F6' : '#111827'
                        }}
                        formatter={(value, name) => [
                          `${value.toFixed(2)}€`, 
                          name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Balance'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                      <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
                      <Bar dataKey="balance" fill="#3B82F6" name="Balance" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })()
        )}

        <div className="space-y-6">
          {monthlyMovimientos.map((movimiento) => {
            const tieneGastosRecurrentes = movimiento.gastos.some(gasto => 
              gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1'
            )
            
            return (
            <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
              tieneGastosRecurrentes
                ? isDark 
                  ? 'bg-gray-800 border-2 border-yellow-300/40 shadow-yellow-300/10' 
                  : 'bg-white border-2 border-yellow-400/50 shadow-yellow-400/10'
                : isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </h2>
                </div>
                <div className={`text-lg font-bold ${
                    movimiento.balance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatEuro(movimiento.balance)}
                  </div>
              </div>

              <div className={tieneGastosRecurrentes ? "" : "grid md:grid-cols-2 gap-6"}>
                {/* Sección de ingresos - solo si no es movimiento de gasto fijo */}
                {!tieneGastosRecurrentes && (
                  <div>
                    <div className="mb-3">
                      <h3 className="text-green-500 font-medium mb-2">
                        Ingresos ({formatEuro(movimiento.ingreso_total)})
                      </h3>
                      <div className={`h-px w-full ${
                        isDark 
                          ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                          : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                      }`}></div>
                    </div>
                    {movimiento.ingresos.map((ingreso) => (
                      <div key={ingreso.id} className="flex justify-between py-1">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{ingreso.etiqueta}</span>
                        <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <div className="mb-3">
                    <h3 className="text-red-500 font-medium mb-2">
                      Gastos ({formatEuro(movimiento.total_gastos)})
                    </h3>
                    <div className={`h-px w-full ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                    }`}></div>
                  </div>
                  {movimiento.gastos.map((gasto) => (
                    <div key={gasto.id} className="flex justify-between py-1">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {gasto.etiqueta}
                      </span>
                      <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                    </div>
                  ))}
                </div>
                
              </div>
              
              {/* Indicador prominente para gastos recurrentes */}
              {tieneGastosRecurrentes && (
                <div className={`mt-4 pt-3 border-t ${
                  isDark ? 'border-yellow-400/50' : 'border-yellow-500/50'
                }`}>
                  <div className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg ${
                    isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      isDark ? 'bg-yellow-400' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm font-semibold ${
                      isDark ? 'text-yellow-200' : 'text-yellow-800'
                    }`}>
                      Movimiento creado por gasto fijo automático
                    </span>
                    {getTiposGastosRecurrentesGlobal(movimiento.gastos, gastosRecurrentes || []).map((tipo, index) => (
                      <div key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDark ? tipo.colorClassDark : tipo.colorClass
                      }`}>
                        {tipo.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="mt-4">
                <div className={`h-px w-full mb-4 ${
                  isDark 
                    ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' 
                    : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'
                }`}></div>
                <div className="flex justify-end items-center gap-3">
                <button
                  onClick={() => setEditingMovimiento(movimiento)}
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Editar
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDeleteAction(() => async () => {
                      try {
                        const response = await axios.delete(`${API_BASE_URL}/movimientos/${movimiento.fecha}`)
                        
                        // Recargar movimientos desde el backend
                        if (onRefreshMovimientos) {
                          await onRefreshMovimientos()
                        }
                      } catch (error) {
                        console.error('Error al eliminar movimiento completo:', error)
                        
                        if (onError) {
                          onError('Error al eliminar movimiento completo')
                        }
                      }
                    })
                    setShowDeleteModal(true)
                  }}
                  className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </span>
                </button>
                </div>
              </div>
            </div>
          )
          })}
        </div>
      </div>
    </div>

      {/* Modales locales para MonthlyBreakdown */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
        }}
        onConfirm={() => {
          if (deleteAction) {
            deleteAction()
            setShowDeleteModal(false)
            setDeleteAction(null)
          }
        }}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres borrar este movimiento? Esta acción no se puede deshacer."
        isDark={isDark}
      />
      
      <EditModal
        isOpen={!!editingMovimiento}
        onClose={() => setEditingMovimiento(null)}
        movimiento={editingMovimiento}
        isDark={isDark}
        onDeleteItem={onDeleteItem}
        onSaveChanges={async (updatedMovimiento) => {
          await onUpdateMovimiento(updatedMovimiento)
          setEditingMovimiento(null)
        }}
        etiquetas={etiquetas}
      />
    </>
  )
}

interface AppOriginalProps {
  externalIsDark?: boolean
  onToggleDark?: () => void
  onLogout?: () => void
}

function App({ 
  externalIsDark, 
  onToggleDark, 
  onLogout
}: AppOriginalProps = {}) {
  // Helper function to convert Date to local date string
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [movimientos, setMovimientos] = useState<MovimientoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para las etiquetas
  const [etiquetas, setEtiquetas] = useState({
    ingresos: [...ETIQUETAS_PREDEFINIDAS.ingresos],
    gastos: [...ETIQUETAS_PREDEFINIDAS.gastos]
  })
  const [activeSection, setActiveSection] = useState('historial')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoDiario | null>(null)
  const [isDark, setIsDark] = useState(externalIsDark || false)
  
  // Sincronizar con el estado externo
  React.useEffect(() => {
    if (externalIsDark !== undefined) {
      setIsDark(externalIsDark)
    }
  }, [externalIsDark])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false)
  
  // Estados para notificaciones de movimientos grandes
  const [bigMovementNotification, setBigMovementNotification] = useState<{
    show: boolean;
    amount: number;
    type: 'income' | 'expense' | 'balance';
  }>({ show: false, amount: 0, type: 'balance' })

  // Función para mostrar confeti
  const triggerConfetti = () => {
    // Lanzar confeti desde múltiples puntos
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Confeti desde la izquierda
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }))
      
      // Confeti desde la derecha
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }))
    }, 250)
  }

  // Función para mostrar notificación de movimiento grande
  const showBigMovementNotification = (amount: number, type: 'income' | 'expense' | 'balance') => {
    setBigMovementNotification({ show: true, amount, type })
    triggerConfetti()
    
    // Ocultar notificación después de 5 segundos
    setTimeout(() => {
      setBigMovementNotification({ show: false, amount: 0, type: 'balance' })
    }, 5000)
  }
  
  // Estados para navegación entre desgloses
  const [sharedMonth, setSharedMonth] = useState(new Date().getMonth())
  const [sharedYear, setSharedYear] = useState(new Date().getFullYear())
  
  // Estados para gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<Array<{
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
    diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    mesAnual?: string;
    diaAnual?: string;
    ultimoProcesado?: string; // fecha YYYY-MM-DD de cuando fue procesado por última vez
  }>>(() => loadGastosRecurrentesFromStorage())
  const [newRecurrent, setNewRecurrent] = useState({
    etiqueta: '',
    monto: '',
    frecuencia: 'mensual' as 'mensual' | 'semanal' | 'diario' | 'anual',
    diaMes: '',
    diaSemana: 'lunes' as 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo',
    mesAnual: '1',
    diaAnual: '1'
  })

  // Estados para editar gastos recurrentes
  const [editingRecurrent, setEditingRecurrent] = useState<{
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
    diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    mesAnual?: string;
    diaAnual?: string;
  } | null>(null)
  const [showEditRecurrentModal, setShowEditRecurrentModal] = useState(false)
  
  // Estados para búsqueda
  const [searchParams, setSearchParams] = useState({
    fechaDesde: '',
    fechaHasta: '',
    etiqueta: ''
  })
  const [searchResults, setSearchResults] = useState<MovimientoDiario[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Estados para edición de etiquetas
  const [editingTag, setEditingTag] = useState<{tipo: 'ingreso' | 'gasto', etiqueta: string} | null>(null)
  const [showEditTagModal, setShowEditTagModal] = useState(false)
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false)
  const [editedTagName, setEditedTagName] = useState('')
  
  // Estados para crear nuevas etiquetas
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [createTagType, setCreateTagType] = useState<'ingreso' | 'gasto'>('gasto')
  const [pendingTagSelection, setPendingTagSelection] = useState<{
    field: string,
    tipo: 'ingreso' | 'gasto'
  } | null>(null)
  
  // Estados para ver detalles de etiquetas
  const [viewingTag, setViewingTag] = useState<{tipo: 'ingreso' | 'gasto', etiqueta: string} | null>(null)
  const [showViewTagModal, setShowViewTagModal] = useState(false)

  // Estados para el carousel del historial
  const [currentHistoryPage, setCurrentHistoryPage] = useState(0)
  const itemsPerPage = 6

  // Estados para crear nuevo movimiento
  const [newMovementDate, setNewMovementDate] = useState(formatDateForAPI(new Date()))
  const [newIncome, setNewIncome] = useState({ etiqueta: '', monto: '' })
  const [newExpense, setNewExpense] = useState({ etiqueta: '', monto: '' })
  const [tempIncomes, setTempIncomes] = useState<Array<{id: number, etiqueta: string, monto: number}>>([])
  const [tempExpenses, setTempExpenses] = useState<Array<{id: number, etiqueta: string, monto: number}>>([])

  // Estado para etiquetas esenciales (guardado en localStorage)
  const [etiquetasEsenciales, setEtiquetasEsenciales] = useState<string[]>(() => {
    const saved = localStorage.getItem('etiquetasEsenciales')
    return saved ? JSON.parse(saved) : ['luz', 'agua', 'gas', 'telefono', 'internet', 'hipoteca']
  })

  useEffect(() => {
    fetchMovimientos()
  }, [])

  // Guardar gastos recurrentes en localStorage cuando cambien
  useEffect(() => {
    saveGastosRecurrentesToStorage(gastosRecurrentes)
  }, [gastosRecurrentes])

  // Guardar etiquetas esenciales en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('etiquetasEsenciales', JSON.stringify(etiquetasEsenciales))
  }, [etiquetasEsenciales])

  // Procesar gastos recurrentes cuando se cargan los datos
  useEffect(() => {
    if (movimientos.length > 0 && gastosRecurrentes.length > 0) {
      procesarGastosRecurrentes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastosRecurrentes.length]) // Solo cuando hay cambios en la cantidad de gastos recurrentes
  
  // Función de búsqueda
  const performSearch = () => {
    setIsSearching(true)
    
    const results = movimientos.filter(mov => {
      let matches = true
      
      // Filtro por fecha desde
      if (searchParams.fechaDesde) {
        const fechaMovimiento = new Date(mov.fecha)
        const fechaDesde = new Date(searchParams.fechaDesde)
        matches = matches && fechaMovimiento >= fechaDesde
      }
      
      // Filtro por fecha hasta
      if (searchParams.fechaHasta) {
        const fechaMovimiento = new Date(mov.fecha)
        const fechaHasta = new Date(searchParams.fechaHasta)
        matches = matches && fechaMovimiento <= fechaHasta
      }
      
      // Filtro por etiqueta
      if (searchParams.etiqueta) {
        const etiquetaBusqueda = searchParams.etiqueta.toLowerCase()
        const tieneEtiquetaIngreso = mov.ingresos.some(ing => 
          ing.etiqueta.toLowerCase().includes(etiquetaBusqueda)
        )
        const tieneEtiquetaGasto = mov.gastos.some(gasto => 
          gasto.etiqueta.toLowerCase().includes(etiquetaBusqueda)
        )
        matches = matches && (tieneEtiquetaIngreso || tieneEtiquetaGasto)
      }
      
      return matches
    })
    
    setSearchResults(results)
    setIsSearching(false)
  }
  
  // Búsqueda en tiempo real cuando cambia la etiqueta
  useEffect(() => {
    if (activeSection === 'buscar' && searchParams.etiqueta) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce de 300ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchParams.etiqueta, activeSection])
  
  // Limpiar resultados al cambiar de sección
  useEffect(() => {
    if (activeSection !== 'buscar') {
      setSearchResults([])
      setSearchParams({ fechaDesde: '', fechaHasta: '', etiqueta: '' })
    }
  }, [activeSection])

  // useEffect para ajustar la página del carousel para mostrar la fecha actual por defecto
  useEffect(() => {
    if (movimientos.length > 0 && activeSection === 'historial') {
      const hoy = new Date().toISOString().split('T')[0]
      
      // Ordenar movimientos por fecha descendente (más recientes primero)
      const sortedMovimientos = [...movimientos].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      
      // Encontrar el índice del movimiento con fecha actual o el más cercano
      let targetIndex = sortedMovimientos.findIndex(mov => mov.fecha <= hoy)
      
      // Si no hay movimientos hasta hoy, mostrar la primera página (movimientos más recientes)
      if (targetIndex === -1) targetIndex = 0
      
      // Calcular en qué página está ese índice
      const targetPage = Math.floor(targetIndex / itemsPerPage)
      
      // Limitar a máximo 5 páginas hacia atrás desde la primera
      const maxPage = Math.min(4, Math.ceil(sortedMovimientos.length / itemsPerPage) - 1)
      const finalPage = Math.min(targetPage, maxPage)
      
      setCurrentHistoryPage(finalPage)
    }
  }, [movimientos, activeSection])

  const fetchMovimientos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movimientos/?todos=true&limit=100`)
      setMovimientos(response.data)
    } catch (err) {
      setError('Error al cargar los movimientos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => {
    setDeleteAction(() => () => deleteMovimiento(movimientoId, tipo, itemId))
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteAction) {
      deleteAction()
      setShowDeleteModal(false)
      setDeleteAction(null)
    }
  }

  const deleteMovimiento = async (movimientoId: number, tipo: 'ingreso' | 'gasto', itemId: number) => {
    try {
      // Buscar el movimiento para obtener la fecha
      const movimiento = movimientos.find(m => m.id === movimientoId)
      if (!movimiento) {
        console.error('Movimiento no encontrado')
        return
      }

      let endpoint = ''
      if (tipo === 'ingreso') {
        endpoint = `${API_BASE_URL}/movimientos/${movimientoId}/ingreso/${itemId}`
      } else {
        endpoint = `${API_BASE_URL}/movimientos/${movimientoId}/gasto/${itemId}`
      }

      const response = await axios.delete(endpoint)
      
      // Recargar movimientos desde el backend
      await fetchMovimientos()
      
    } catch (error) {
      console.error(`Error al eliminar ${tipo}:`, error)
      setError(`Error al eliminar ${tipo}`)
    }
  }

  const handleDeleteMovimiento = (movimiento: MovimientoDiario) => {
    setDeleteAction(() => async () => {
      try {
        const response = await axios.delete(`${API_BASE_URL}/movimientos/${movimiento.fecha}`)
        
        // Recargar movimientos desde el backend
        await fetchMovimientos()
      } catch (error) {
        console.error('Error al eliminar movimiento completo:', error)
        setError('Error al eliminar movimiento completo')
      }
    })
    setShowDeleteModal(true)
  }

  // Funciones para crear nuevo movimiento
  const handleAddNewIncome = () => {
    const monto = parseFloat(newIncome.monto)
    if (!newIncome.etiqueta || isNaN(monto) || monto <= 0) return

    const newItem = {
      id: Date.now(),
      etiqueta: newIncome.etiqueta,
      monto
    }
    
    setTempIncomes(prev => [...prev, newItem])
    setNewIncome({ etiqueta: '', monto: '' })
  }

  const handleAddNewExpense = () => {
    const monto = parseFloat(newExpense.monto)
    if (!newExpense.etiqueta || isNaN(monto) || monto <= 0) return

    const newItem = {
      id: Date.now(),
      etiqueta: newExpense.etiqueta,
      monto
    }
    
    setTempExpenses(prev => [...prev, newItem])
    setNewExpense({ etiqueta: '', monto: '' })
  }

  const handleCreateMovement = async () => {
    if (tempIncomes.length === 0 && tempExpenses.length === 0) {
      alert('Debes agregar al menos un ingreso o gasto')
      return
    }

    try {
      // Crear el movimiento con la fecha seleccionada
      const ingresos = tempIncomes.map(item => ({
        id: item.id,
        etiqueta: item.etiqueta,
        monto: item.monto,
        fecha: newMovementDate
      }))
      
      const gastos = tempExpenses.map(item => ({
        id: item.id,
        etiqueta: item.etiqueta,
        monto: item.monto,
        fecha: newMovementDate
      }))

      const ingresoTotal = tempIncomes.reduce((sum, item) => sum + item.monto, 0)
      const totalGastos = tempExpenses.reduce((sum, item) => sum + item.monto, 0)

      const nuevoMovimiento = {
        fecha: newMovementDate,
        ingreso_total: ingresoTotal,
        ingresos,
        gastos,
        total_gastos: totalGastos,
        balance: ingresoTotal - totalGastos
      }

      // Enviar al backend
      const response = await axios.post(`${API_BASE_URL}/movimientos/`, nuevoMovimiento)
      
      // Recargar movimientos desde el backend
      await fetchMovimientos()
      
      // Detectar movimientos grandes y mostrar notificación
      const balance = ingresoTotal - totalGastos
      if (Math.abs(balance) >= 150) {
        const type = balance > 0 ? 'income' : 'expense'
        showBigMovementNotification(Math.abs(balance), type)
      } else if (ingresoTotal >= 150) {
        showBigMovementNotification(ingresoTotal, 'income')
      } else if (totalGastos >= 150) {
        showBigMovementNotification(totalGastos, 'expense')
      }
      
      // Limpiar el formulario
      setTempIncomes([])
      setTempExpenses([])
      setNewMovementDate(formatDateForAPI(new Date()))
      setShowAddForm(false)
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
    }
  }

  const handleRemoveTempItem = (tipo: 'ingreso' | 'gasto', id: number) => {
    if (tipo === 'ingreso') {
      setTempIncomes(prev => prev.filter(item => item.id !== id))
    } else {
      setTempExpenses(prev => prev.filter(item => item.id !== id))
    }
  }

  // Función para determinar si un gasto es recurrente y qué tipo es
  const getGastoRecurrenteInfo = (etiqueta: string) => {
    return getGastoRecurrenteInfoGlobal(etiqueta, gastosRecurrentes)
  }

  // Función para obtener los tipos de gastos recurrentes de un movimiento
  const getTiposGastosRecurrentes = (gastos: any[]) => {
    return getTiposGastosRecurrentesGlobal(gastos, gastosRecurrentes)
  }

  // Función para procesar gastos recurrentes automáticamente
  const procesarGastosRecurrentes = async () => {
    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]
    
    if (gastosRecurrentes.length === 0) {
      return
    }
    
    try {
      for (const gastoRecurrente of gastosRecurrentes) {
        let debeCrearse = false
        let fechaMovimiento = hoyStr
        
        // Verificar si el gasto debe ser creado según la frecuencia
        if (gastoRecurrente.frecuencia === 'mensual' && gastoRecurrente.diaMes) {
          const diaDelMes = gastoRecurrente.diaMes
          
          // Crear fecha con cuidado: si el día no existe en el mes actual, usar el último día del mes
          const añoActual = hoy.getFullYear()
          const mesActual = hoy.getMonth()
          const ultimoDiaDelMes = new Date(añoActual, mesActual + 1, 0).getDate()
          const diaAjustado = Math.min(diaDelMes, ultimoDiaDelMes)
          
          const fechaEsperada = new Date(añoActual, mesActual, diaAjustado)
          
          // Formatear fecha sin problemas de timezone
          const fechaEsperadaStr = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaAjustado).padStart(2, '0')}`
          
          
          // Si ya pasó el día del mes actual o es hoy
          if (hoy.getDate() >= diaAjustado) {
            fechaMovimiento = fechaEsperadaStr
            
            // Verificar si ya fue procesado este mes
            if (gastoRecurrente.ultimoProcesado) {
              const ultimoProcesado = new Date(gastoRecurrente.ultimoProcesado)
              // Solo crear si no se procesó este mes
              if (ultimoProcesado.getMonth() !== hoy.getMonth() || 
                  ultimoProcesado.getFullYear() !== hoy.getFullYear()) {
                debeCrearse = true
              }
            } else {
              // Primera vez que se procesa
              debeCrearse = true
            }
          }
        } else if (gastoRecurrente.frecuencia === 'diario') {
          // Para gastos diarios, verificar si ya fue procesado hoy
          fechaMovimiento = hoyStr
          
          if (gastoRecurrente.ultimoProcesado) {
            const ultimoProcesado = new Date(gastoRecurrente.ultimoProcesado)
            const ultimoProcesadoStr = ultimoProcesado.toISOString().split('T')[0]
            
            // Solo crear si no se procesó hoy
            if (ultimoProcesadoStr !== hoyStr) {
              debeCrearse = true
            }
          } else {
            // Primera vez que se procesa
            debeCrearse = true
          }
        } else if (gastoRecurrente.frecuencia === 'semanal' && gastoRecurrente.diaSemana) {
          // Para gastos semanales, verificar si hoy corresponde al día de la semana
          const diasSemana = {
            'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
            'jueves': 4, 'viernes': 5, 'sabado': 6
          }
          
          const diaEsperado = diasSemana[gastoRecurrente.diaSemana]
          const diaHoy = hoy.getDay()
          
          if (diaHoy === diaEsperado) {
            fechaMovimiento = hoyStr
            
            if (gastoRecurrente.ultimoProcesado) {
              const ultimoProcesado = new Date(gastoRecurrente.ultimoProcesado)
              const ultimoProcesadoStr = ultimoProcesado.toISOString().split('T')[0]
              
              // Solo crear si no se procesó esta semana
              const inicioSemana = new Date(hoy)
              inicioSemana.setDate(hoy.getDate() - hoy.getDay())
              const inicioSemanaStr = inicioSemana.toISOString().split('T')[0]
              
              if (ultimoProcesadoStr < inicioSemanaStr) {
                debeCrearse = true
              }
            } else {
              // Primera vez que se procesa
              debeCrearse = true
            }
          }
        } else if (gastoRecurrente.frecuencia === 'anual' && gastoRecurrente.mesAnual && gastoRecurrente.diaAnual) {
          // Para gastos anuales, verificar si hoy corresponde al día y mes del año
          const mesEsperado = parseInt(gastoRecurrente.mesAnual) - 1 // Los meses en JS son 0-indexados
          const diaEsperado = parseInt(gastoRecurrente.diaAnual)
          
          if (hoy.getMonth() === mesEsperado && hoy.getDate() === diaEsperado) {
            fechaMovimiento = hoyStr
            
            if (gastoRecurrente.ultimoProcesado) {
              const ultimoProcesado = new Date(gastoRecurrente.ultimoProcesado)
              
              // Solo crear si no se procesó este año
              if (ultimoProcesado.getFullYear() !== hoy.getFullYear()) {
                debeCrearse = true
              }
            } else {
              // Primera vez que se procesa
              debeCrearse = true
            }
          }
        }
        
        if (debeCrearse) {
          // Crear nuevo movimiento solo con el gasto recurrente
          const gastoRecurrenteItem = {
            etiqueta: gastoRecurrente.etiqueta,
            monto: gastoRecurrente.monto,
            fecha: fechaMovimiento,
            es_recurrente: true,
            recurrente_id: gastoRecurrente.id
          }
          
          const nuevoMovimiento = {
            fecha: fechaMovimiento,
            ingreso_total: 0,
            ingresos: [],
            gastos: [gastoRecurrenteItem],
            total_gastos: gastoRecurrente.monto,
            balance: -gastoRecurrente.monto
          }
          
          // Enviar al backend
          try {
            await axios.post(`${API_BASE_URL}/movimientos/`, nuevoMovimiento)
          } catch (error) {
            console.error('Error al crear gasto recurrente:', error)
          }
          
          // Actualizar la fecha de último procesamiento
          setGastosRecurrentes(prev => prev.map(gr => 
            gr.id === gastoRecurrente.id 
              ? { ...gr, ultimoProcesado: hoyStr }
              : gr
          ))
        }
      }
      
      // Recargar movimientos desde el backend después de procesar
      await fetchMovimientos()
    } catch (error) {
      console.error('Error al procesar gastos recurrentes:', error)
    }
  }

  // Funciones para manejo de etiquetas
  const handleEditTag = (tipo: 'ingreso' | 'gasto', etiqueta: string) => {
    setEditingTag({ tipo, etiqueta })
    setEditedTagName(etiqueta)
    setShowEditTagModal(true)
  }

  const handleDeleteTag = (tipo: 'ingreso' | 'gasto', etiqueta: string) => {
    setEditingTag({ tipo, etiqueta })
    setShowDeleteTagModal(true)
  }

  const handleViewTag = (tipo: 'ingreso' | 'gasto', etiqueta: string) => {
    setViewingTag({ tipo, etiqueta })
    setShowViewTagModal(true)
  }

  const handleEditRecurrent = (recurrent: {
    id: number;
    etiqueta: string;
    monto: number;
    frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual';
    diaMes?: number;
    diaSemana?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    mesAnual?: string;
    diaAnual?: string;
  }) => {
    setEditingRecurrent(recurrent)
    setShowEditRecurrentModal(true)
  }

  const confirmEditRecurrent = (updatedRecurrent: {etiqueta: string, monto: number, frecuencia: 'mensual' | 'semanal' | 'diario' | 'anual', diaMes?: number, diaSemana?: string, mesAnual?: string, diaAnual?: string}) => {
    if (editingRecurrent) {
      setGastosRecurrentes(prev => prev.map(item => 
        item.id === editingRecurrent.id 
          ? { ...item, ...updatedRecurrent }
          : item
      ))
      setShowEditRecurrentModal(false)
      setEditingRecurrent(null)
    }
  }

  const toggleEssentialTag = () => {
    if (editingTag) {
      const tagName = editingTag.etiqueta.toLowerCase()
      setEtiquetasEsenciales(prev => 
        prev.includes(tagName) 
          ? prev.filter(tag => tag !== tagName)
          : [...prev, tagName]
      )
    }
  }

  const confirmEditTag = () => {
    if (editingTag && editedTagName.trim() && editedTagName.trim() !== editingTag.etiqueta) {
      const newTagName = editedTagName.trim()
      setEtiquetas(prev => {
        const newEtiquetas = { ...prev }
        const tipoArray = editingTag.tipo === 'ingreso' ? 'ingresos' : 'gastos'
        const index = newEtiquetas[tipoArray].indexOf(editingTag.etiqueta)
        
        if (index !== -1) {
          newEtiquetas[tipoArray][index] = newTagName
        }
        
        return newEtiquetas
      })
      
      setShowEditTagModal(false)
      setEditingTag(null)
      setEditedTagName('')
    }
  }

  const confirmDeleteTag = () => {
    if (editingTag) {
      setEtiquetas(prev => {
        const newEtiquetas = { ...prev }
        const tipoArray = editingTag.tipo === 'ingreso' ? 'ingresos' : 'gastos'
        newEtiquetas[tipoArray] = newEtiquetas[tipoArray].filter(etiq => etiq !== editingTag.etiqueta)
        return newEtiquetas
      })
      
      setShowDeleteTagModal(false)
      setEditingTag(null)
    }
  }

  const handleCreateNewTag = (field: string, tipo: 'ingreso' | 'gasto') => {
    setPendingTagSelection({ field, tipo })
    setCreateTagType(tipo)
    setShowCreateTagModal(true)
  }

  const confirmCreateTag = (tagName: string, tipo: 'ingreso' | 'gasto') => {
    if (tagName.trim() && pendingTagSelection) {
      // Añadir la nueva etiqueta a la lista
      setEtiquetas(prev => {
        const newEtiquetas = { ...prev }
        const tipoArray = tipo === 'ingreso' ? 'ingresos' : 'gastos'
        if (!newEtiquetas[tipoArray].includes(tagName)) {
          newEtiquetas[tipoArray] = [...newEtiquetas[tipoArray], tagName]
        }
        return newEtiquetas
      })

      // Asignar la nueva etiqueta al campo correspondiente
      const field = pendingTagSelection.field
      if (field === 'newItem.etiqueta') {
        setNewItem(prev => ({ ...prev, etiqueta: tagName }))
      } else if (field === 'newRecurrent.etiqueta') {
        setNewRecurrent(prev => ({ ...prev, etiqueta: tagName }))
      } else if (field === 'editedRecurrent.etiqueta') {
        setEditedRecurrent(prev => ({ ...prev, etiqueta: tagName }))
      } else if (field === 'newIncome.etiqueta') {
        setNewIncome(prev => ({ ...prev, etiqueta: tagName }))
      } else if (field === 'newExpense.etiqueta') {
        setNewExpense(prev => ({ ...prev, etiqueta: tagName }))
      }

      setShowCreateTagModal(false)
      setPendingTagSelection(null)
    }
  }

  const getTodayMovimientos = () => {
    const today = new Date().toISOString().split('T')[0]
    return movimientos.find(m => m.fecha === today) || null
  }

  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.balance, 0)
  }

  const getYearlyTotal = () => {
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.balance, 0)
  }

  const getYearlyIngresos = () => {
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.ingreso_total, 0)
  }

  const getYearlyGastos = () => {
    const currentYear = new Date().getFullYear()
    
    return movimientos
      .filter(m => {
        const date = new Date(m.fecha)
        return date.getFullYear() === currentYear
      })
      .reduce((total, m) => total + m.total_gastos, 0)
  }

  const todayMovimientos = getTodayMovimientos()
  const monthlyTotal = getMonthlyTotal()
  const yearlyTotal = getYearlyTotal()
  const yearlyIngresos = getYearlyIngresos()
  const yearlyGastos = getYearlyGastos()

  if (showMonthlyBreakdown) {
    return (
      <MonthlyBreakdown 
        movimientos={movimientos}
        onBack={() => {
          setShowMonthlyBreakdown(false)
          // Limpiar cualquier modal pendiente para evitar que se abra al salir
          setEditingMovimiento(null)
          setShowDeleteModal(false)
          setDeleteAction(null)
        }}
        isDark={isDark}
        onRefreshMovimientos={fetchMovimientos}
        onError={setError}
        gastosRecurrentes={gastosRecurrentes}
        onUpdateMovimiento={async (updatedMovimiento) => {
          try {
            // Enviar cambios al backend
            const response = await axios.put(`${API_BASE_URL}/movimientos/${updatedMovimiento.id}/`, updatedMovimiento)
            
            // Recargar movimientos desde el backend
            await fetchMovimientos()
          } catch (error) {
            console.error('Error al actualizar movimiento:', error)
            // En caso de error, actualizar solo localmente como fallback
            setMovimientos(prev => prev.map(m => 
              m.id === updatedMovimiento.id ? updatedMovimiento : m
            ))
          }
        }}
        onDeleteMovimiento={(movimiento) => {
          // Usar el modal local del MonthlyBreakdown, no del componente principal
          setDeleteAction(() => async () => {
            try {
              const response = await axios.delete(`${API_BASE_URL}/movimientos/${movimiento.fecha}`)
              
              // Recargar movimientos desde el backend
              await fetchMovimientos()
            } catch (error) {
              console.error('Error al eliminar movimiento completo:', error)
              setError('Error al eliminar movimiento completo')
            }
          })
          setShowDeleteModal(true)
        }}
        onDeleteItem={deleteMovimiento}
        initialMonth={sharedMonth}
        initialYear={sharedYear}
        etiquetas={etiquetas}
        onGoToYearly={(year) => {
          setShowMonthlyBreakdown(false)
          setShowYearlyBreakdown(true)
          // Aquí podríamos también setear el año específico si el YearlyBreakdown lo soporta
        }}
      />
    )
  }

  if (showYearlyBreakdown) {
    return (
      <YearlyBreakdown 
        movimientos={movimientos}
        onBack={() => {
          setShowYearlyBreakdown(false)
          // Limpiar cualquier modal pendiente
          setEditingMovimiento(null)
          setShowDeleteModal(false)
          setDeleteAction(null)
        }}
        isDark={isDark}
        onGoToMonthly={(month, year) => {
          setSharedMonth(month)
          setSharedYear(year)
          setShowYearlyBreakdown(false)
          setShowMonthlyBreakdown(true)
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-xl ${isDark ? 'text-white' : 'text-black'}`}>Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres borrar este movimiento? Esta acción no se puede deshacer."
        isDark={isDark}
      />
      
      <EditModal
        isOpen={!!editingMovimiento}
        onClose={() => setEditingMovimiento(null)}
        movimiento={editingMovimiento}
        isDark={isDark}
        etiquetas={etiquetas}
        onDeleteItem={handleDeleteClick}
        onSaveChanges={async (updatedMovimiento) => {
          try {
            // Enviar cambios al backend
            const response = await axios.put(`${API_BASE_URL}/movimientos/${updatedMovimiento.id}/`, updatedMovimiento)
            
            // Recargar movimientos desde el backend
            await fetchMovimientos()
          } catch (error) {
            console.error('Error al actualizar movimiento:', error)
            // En caso de error, actualizar solo localmente como fallback
            setMovimientos(prev => prev.map(m => 
              m.id === updatedMovimiento.id ? updatedMovimiento : m
            ))
          }
        }}
      />
      
      {/* Modal para editar etiquetas */}
      <EditTagModal
        isOpen={showEditTagModal}
        onClose={() => {
          setShowEditTagModal(false)
          setEditingTag(null)
          setEditedTagName('')
        }}
        onConfirm={confirmEditTag}
        onToggleEssential={toggleEssentialTag}
        title="Editar Etiqueta"
        editingTag={editingTag}
        editedTagName={editedTagName}
        setEditedTagName={setEditedTagName}
        isDark={isDark}
        etiquetasEsenciales={etiquetasEsenciales}
      />

      {/* Modal para ver detalles de etiquetas */}
      <ViewTagModal
        isOpen={showViewTagModal}
        onClose={() => {
          setShowViewTagModal(false)
          setViewingTag(null)
        }}
        tag={viewingTag}
        movimientos={movimientos}
        isDark={isDark}
      />

      {/* Modal para crear nuevas etiquetas */}
      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => {
          setShowCreateTagModal(false)
          setPendingTagSelection(null)
        }}
        onConfirm={confirmCreateTag}
        tipo={createTagType}
        isDark={isDark}
      />

      {/* Modal para editar gastos recurrentes */}
      <EditRecurrentModal
        isOpen={showEditRecurrentModal}
        onClose={() => {
          setShowEditRecurrentModal(false)
          setEditingRecurrent(null)
        }}
        onConfirm={confirmEditRecurrent}
        recurrent={editingRecurrent}
        etiquetas={etiquetas.gastos}
        isDark={isDark}
      />

      {/* Modal para borrar etiquetas */}
      <ConfirmModal
        isOpen={showDeleteTagModal}
        onClose={() => {
          setShowDeleteTagModal(false)
          setEditingTag(null)
        }}
        onConfirm={confirmDeleteTag}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres borrar la etiqueta "${editingTag?.etiqueta}"? Esta acción no se puede deshacer.`}
        isDark={isDark}
      />
      
      {/* Menú horizontal superior */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDark ? 'border-gray-700' : ''} py-4`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <div className="flex-1 w-3/4">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-pink-300/70 hover:border-pink-400/80 transition-colors duration-300">
                <img 
                  src="/Logo1.png" 
                  alt="Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <div className="w-1/4 flex items-center justify-end">
              <div className="flex items-center gap-4">
                <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveSection('historial')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'historial'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Historial
                </button>
                <button
                  onClick={() => setActiveSection('buscar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'buscar'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Buscar
                </button>
                <button
                  onClick={() => setActiveSection('etiquetas')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'etiquetas'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Etiquetas
                </button>
                <button
                  onClick={() => setActiveSection('recurrentes')}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    activeSection === 'recurrentes'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gastos Continuos
                </button>
                <button
                  onClick={() => setActiveSection('analisis')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'analisis'
                      ? isDark 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Análisis
                </button>
              </nav>
              
              {/* Toggle modo nocturno */}
              <button
                onClick={() => {
                  if (onToggleDark) {
                    onToggleDark()
                  } else {
                    setIsDark(!isDark)
                  }
                }}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-md hover:shadow-yellow-400/25 hover:from-yellow-400 hover:to-orange-300' 
                    : 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-md hover:shadow-slate-400/25 hover:from-slate-500 hover:to-slate-400'
                }`}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              {/* Botón Salir */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg ${
                    isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  }`}
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Contenido principal (75%) */}
          <main className="flex-1 w-3/4">
            {/* Botón agregar movimiento */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Añadir Movimiento
                </span>
              </button>
            </div>

            {/* Formulario de agregar completo */}
            {showAddForm && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border p-6 mb-6 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Agregar Nuevo Movimiento
                </h3>
                
                {/* Selector de fecha */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fecha del movimiento
                  </label>
                  <DatePicker
                    selected={parseISO(newMovementDate)}
                    onChange={(date: Date) => setNewMovementDate(formatDateForAPI(date))}
                    className={`w-full px-4 py-3 rounded-lg border text-sm ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                    wrapperClassName="w-full md:w-auto"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative">
                  {/* Línea separadora vertical */}
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
                    <div className={`h-full w-full ${
                      isDark 
                        ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                        : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
                    }`}></div>
                  </div>

                  {/* Formulario de Ingresos */}
                  <div className="pr-3">
                    <div className="mb-4">
                      <h4 className="text-green-500 font-semibold text-lg mb-2">Agregar Ingreso</h4>
                      <div className={`h-px w-full ${
                        isDark 
                          ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                          : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Etiqueta
                        </label>
                        <div className="relative">
                          <select 
                            value={newIncome.etiqueta}
                            onChange={(e) => {
                              if (e.target.value === '__nueva__') {
                                handleCreateNewTag('newIncome.etiqueta', 'ingreso')
                              } else {
                                setNewIncome(prev => ({...prev, etiqueta: e.target.value}))
                              }
                            }}
                            className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200`}>
                            <option value="">Seleccionar etiqueta...</option>
                            {etiquetas.ingresos.map(etiq => (
                              <option key={etiq} value={etiq}>{etiq}</option>
                            ))}
                            <option value="__nueva__">+ Crear nueva etiqueta</option>
                          </select>
                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Monto
                        </label>
                        <NumberInput
                          value={newIncome.monto}
                          onChange={(value) => setNewIncome(prev => ({...prev, monto: value}))}
                          placeholder="0.00"
                          step={0.01}
                          isDark={isDark}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <button 
                        onClick={handleAddNewIncome}
                        className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                          : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                      }`}>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Agregar Ingreso
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Formulario de Gastos */}
                  <div className="pl-3">
                    <div className="mb-4">
                      <h4 className="text-red-500 font-semibold text-lg mb-2">Agregar Gasto</h4>
                      <div className={`h-px w-full ${
                        isDark 
                          ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                          : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Etiqueta
                        </label>
                        <div className="relative">
                          <select 
                            value={newExpense.etiqueta}
                            onChange={(e) => {
                              if (e.target.value === '__nueva__') {
                                handleCreateNewTag('newExpense.etiqueta', 'gasto')
                              } else {
                                setNewExpense(prev => ({...prev, etiqueta: e.target.value}))
                              }
                            }}
                            className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200`}>
                            <option value="">Seleccionar etiqueta...</option>
                            {etiquetas.gastos.map(etiq => (
                              <option key={etiq} value={etiq}>{etiq}</option>
                            ))}
                            <option value="__nueva__">+ Crear nueva etiqueta</option>
                          </select>
                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Monto
                        </label>
                        <NumberInput
                          value={newExpense.monto}
                          onChange={(value) => setNewExpense(prev => ({...prev, monto: value}))}
                          placeholder="0.00"
                          step={0.01}
                          isDark={isDark}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <button 
                        onClick={handleAddNewExpense}
                        className={`w-full group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                      }`}>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Agregar Gasto
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de items temporales agregados */}
                {(tempIncomes.length > 0 || tempExpenses.length > 0) && (
                  <div className="mt-8 space-y-6">
                    <div className={`h-px w-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Ingresos temporales */}
                      {tempIncomes.length > 0 && (
                        <div>
                          <h4 className="text-green-500 font-semibold text-lg mb-3">
                            Ingresos agregados ({tempIncomes.length})
                          </h4>
                          <div className="space-y-2">
                            {tempIncomes.map((item) => (
                              <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                              }`}>
                                <div>
                                  <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {item.etiqueta}
                                  </div>
                                  <div className="text-green-500 font-semibold">
                                    {formatEuro(item.monto)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveTempItem('ingreso', item.id)}
                                  className="p-1 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gastos temporales */}
                      {tempExpenses.length > 0 && (
                        <div>
                          <h4 className="text-red-500 font-semibold text-lg mb-3">
                            Gastos agregados ({tempExpenses.length})
                          </h4>
                          <div className="space-y-2">
                            {tempExpenses.map((item) => (
                              <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                              }`}>
                                <div>
                                  <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {item.etiqueta}
                                  </div>
                                  <div className="text-red-500 font-semibold">
                                    {formatEuro(item.monto)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveTempItem('gasto', item.id)}
                                  className="p-1 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resumen */}
                    <div className={`p-4 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          Total de ingresos:
                        </span>
                        <span className="text-green-500 font-semibold">
                          {formatEuro(tempIncomes.reduce((sum, item) => sum + item.monto, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          Total de gastos:
                        </span>
                        <span className="text-red-500 font-semibold">
                          {formatEuro(tempExpenses.reduce((sum, item) => sum + item.monto, 0))}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center mt-2 pt-2 border-t ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Balance final:
                        </span>
                        <span className="font-bold text-lg text-blue-500">
                          {formatEuro(tempIncomes.reduce((sum, item) => sum + item.monto, 0) - tempExpenses.reduce((sum, item) => sum + item.monto, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setTempIncomes([])
                      setTempExpenses([])
                      setNewIncome({ etiqueta: '', monto: '' })
                      setNewExpense({ etiqueta: '', monto: '' })
                      setNewMovementDate(formatDateForAPI(new Date()))
                    }}
                    className={`group relative overflow-hidden px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-300 hover:to-gray-200'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </span>
                  </button>
                  
                  {/* Botón Crear Movimiento - Solo visible si hay items temporales */}
                  {(tempIncomes.length > 0 || tempExpenses.length > 0) && (
                    <button
                      onClick={handleCreateMovement}
                      className={`group relative overflow-hidden px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md hover:shadow-emerald-400/25 hover:from-emerald-400 hover:to-emerald-300'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Crear Movimiento
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'historial' && (
              <div>
                {(() => {
                  // Ordenar movimientos por fecha ascendente (día 1 arriba, día 31 abajo)
                  const today = new Date().toISOString().split('T')[0]
                  const sortedMovimientos = [...movimientos].sort((a, b) => {
                    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                  })
                  
                  // Limitar a máximo 5 páginas (30 movimientos con 6 por página)
                  const maxMovimientos = itemsPerPage * 5
                  const limitedMovimientos = sortedMovimientos.slice(0, maxMovimientos)
                  
                  const totalPages = Math.ceil(limitedMovimientos.length / itemsPerPage)
                  const startIndex = currentHistoryPage * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const currentMovimientos = limitedMovimientos.slice(startIndex, endIndex)

                  return (
                    <>
                      <div className="grid gap-6">
                        {currentMovimientos.map((movimiento) => {
                          const isToday = movimiento.fecha === today
                          
                          const tieneGastosRecurrentes = movimiento.gastos.some(gasto => 
                            gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1'
                          )
                          
                          return (
                          <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
                            tieneGastosRecurrentes
                              ? isDark 
                                ? 'bg-gray-800 border-2 border-yellow-300/40 shadow-yellow-300/10' 
                                : 'bg-white border-2 border-yellow-400/50 shadow-yellow-400/10'
                              : isToday 
                                ? isDark 
                                  ? 'bg-gray-800 ring-2 ring-blue-500/30 shadow-blue-500/20' 
                                  : 'bg-white ring-2 ring-blue-400/30 shadow-blue-400/20'
                                : isDark ? 'bg-gray-800' : 'bg-white'
                          }`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col">
                                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </h2>
                                {tieneGastosRecurrentes && (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      isDark 
                                        ? 'bg-yellow-300/10 text-yellow-200 border border-yellow-300/20' 
                                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    }`}>
                                      Movimiento de gasto fijo automático
                                    </div>
                                    {getTiposGastosRecurrentes(movimiento.gastos).map((tipo, index) => (
                                      <div key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isDark ? tipo.colorClassDark : tipo.colorClass
                                      }`}>
                                        {tipo.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-lg font-bold ml-auto text-blue-500">
                                Balance: {formatEuro(movimiento.balance)}
                              </div>
                            </div>
                            
                            <div className={tieneGastosRecurrentes ? "" : "grid md:grid-cols-2 gap-8 relative"}>
                              {/* Línea separadora vertical con degradado - solo si no es movimiento de gasto fijo */}
                              {!tieneGastosRecurrentes && (
                                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
                                  <div className={`h-full w-full ${
                                    isDark 
                                      ? 'bg-gradient-to-b from-transparent via-gray-500/30 to-transparent' 
                                      : 'bg-gradient-to-b from-transparent via-gray-300/40 to-transparent'
                                  }`}></div>
                                </div>
                              )}
                              
                              {/* Sección de ingresos - solo si no es movimiento de gasto fijo */}
                              {!tieneGastosRecurrentes && (
                                <div className="pr-3">
                                  <div className="mb-3">
                                    <h3 className="text-green-500 font-medium mb-2">
                                      Ingresos ({formatEuro(movimiento.ingreso_total)})
                                    </h3>
                                    <div className={`h-px w-full ${
                                      isDark 
                                        ? 'bg-gradient-to-r from-transparent via-green-400/30 to-transparent' 
                                        : 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'
                                    }`}></div>
                                  </div>
                                  {movimiento.ingresos.length > 0 ? (
                                    <ul className="space-y-2">
                                      {movimiento.ingresos.map((ingreso) => (
                                        <li key={ingreso.id} className={`flex justify-between items-center p-2 rounded ${
                                          isDark ? 'bg-gray-700' : 'bg-green-50'
                                        }`}>
                                          <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{ingreso.etiqueta}</span>
                                          <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay ingresos</p>
                                  )}
                                </div>
                              )}
                              
                              <div className={tieneGastosRecurrentes ? "" : "pl-3"}>
                                <div className="mb-3">
                                  <h3 className="text-red-500 font-medium mb-2">
                                    Gastos ({formatEuro(movimiento.total_gastos)})
                                  </h3>
                                  <div className={`h-px w-full ${
                                    isDark 
                                      ? 'bg-gradient-to-r from-transparent via-red-400/30 to-transparent' 
                                      : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'
                                  }`}></div>
                                </div>
                                {movimiento.gastos.length > 0 ? (
                                  <ul className="space-y-2">
                                    {movimiento.gastos.map((gasto) => (
                                      <li key={gasto.id} className={`flex justify-between items-center p-2 rounded ${
                                        isDark ? 'bg-gray-700' : 'bg-red-50'
                                      }`}>
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                                          {gasto.etiqueta}
                                        </span>
                                        <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay gastos</p>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción en la parte inferior */}
                            <div className="flex gap-2 mt-8 justify-end">
                              <button
                                onClick={() => setEditingMovimiento(movimiento)}
                                className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isDark
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                                }`}
                              >
                                <span className="relative z-10 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Editar
                                </span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  handleDeleteMovimiento(movimiento)
                                }}
                                className={`group relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isDark
                                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md hover:shadow-rose-500/25 hover:from-rose-500 hover:to-rose-400'
                                    : 'bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-md hover:shadow-rose-400/25 hover:from-rose-400 hover:to-rose-300'
                                }`}
                              >
                                <span className="relative z-10 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  Borrar Movimiento
                                </span>
                              </button>
                            </div>
                          </div>
                          )
                        })}
                        
                        {sortedMovimientos.length === 0 && (
                          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
                            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              No hay movimientos
                            </h2>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                              Comienza agregando tus primeros ingresos y gastos
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Controles de paginación carousel */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center space-x-4">
                          {/* Flecha izquierda */}
                          <button
                            onClick={() => setCurrentHistoryPage(Math.max(0, currentHistoryPage - 1))}
                            disabled={currentHistoryPage === 0}
                            className={`p-2 rounded-full transition-all ${
                              currentHistoryPage === 0
                                ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                                : isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Puntos indicadores */}
                          <div className="flex space-x-2">
                            {Array.from({ length: totalPages }, (_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentHistoryPage(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  index === currentHistoryPage
                                    ? 'bg-blue-500'
                                    : isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Flecha derecha */}
                          <button
                            onClick={() => setCurrentHistoryPage(Math.min(totalPages - 1, currentHistoryPage + 1))}
                            disabled={currentHistoryPage === totalPages - 1}
                            className={`p-2 rounded-full transition-all ${
                              currentHistoryPage === totalPages - 1
                                ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                                : isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {activeSection === 'buscar' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Buscar Movimientos
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Buscar por fecha
                    </label>
                    <div className="flex gap-2">
                      <DatePicker
                        selected={searchParams.fechaDesde ? parseISO(searchParams.fechaDesde) : null}
                        onChange={(date: Date | null) => setSearchParams(prev => ({...prev, fechaDesde: date ? formatDateForAPI(date) : ''}))}
                        className={`w-full flex-1 px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        wrapperClassName="flex-1"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Fecha desde"
                        isClearable
                      />
                      <DatePicker
                        selected={searchParams.fechaHasta ? parseISO(searchParams.fechaHasta) : null}
                        onChange={(date: Date | null) => setSearchParams(prev => ({...prev, fechaHasta: date ? formatDateForAPI(date) : ''}))}
                        className={`w-full flex-1 px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        wrapperClassName="flex-1"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Fecha hasta"
                        isClearable
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Buscar por etiqueta
                    </label>
                    <input
                      type="text"
                      placeholder="Escribir etiqueta..."
                      value={searchParams.etiqueta}
                      onChange={(e) => setSearchParams(prev => ({...prev, etiqueta: e.target.value}))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={performSearch}
                    disabled={isSearching}
                    className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSearching
                        ? isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md hover:shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400'
                          : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md hover:shadow-blue-400/25 hover:from-blue-400 hover:to-blue-300'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      setSearchParams({ fechaDesde: '', fechaHasta: '', etiqueta: '' })
                      setSearchResults([])
                    }}
                    className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md hover:shadow-gray-500/25 hover:from-gray-500 hover:to-gray-400' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md hover:shadow-gray-400/25 hover:from-gray-300 hover:to-gray-200'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Limpiar
                    </span>
                  </button>
                </div>
                
                {/* Resultados de búsqueda */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Resultados de búsqueda
                  </h3>
                  
                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map((movimiento) => {
                        const tieneGastosRecurrentes = movimiento.gastos.some(gasto => {
                          // Verificar tanto boolean como string
                          return gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1'
                        })
                        return (
                        <div key={movimiento.id} className={`rounded-lg shadow p-6 ${
                          tieneGastosRecurrentes
                            ? isDark 
                              ? 'bg-gray-700 border-2 border-yellow-300/40 shadow-yellow-300/10' 
                              : 'bg-gray-50 border-2 border-yellow-400/50 shadow-yellow-400/10'
                            : isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {new Date(movimiento.fecha).toLocaleDateString('es-ES', { 
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </h4>
                              {/* Indicador de gasto recurrente */}
                              {movimiento.gastos.some(gasto => gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1') && (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                  isDark 
                                    ? 'bg-yellow-300/10 text-yellow-200 border-yellow-300/20' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                  Movimiento de gasto fijo automático
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-bold ml-auto text-blue-500">
                              Balance: {formatEuro(movimiento.balance)}
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-green-500 font-medium mb-2">
                                Ingresos ({formatEuro(movimiento.ingreso_total)})
                              </h5>
                              {movimiento.ingresos.length > 0 ? (
                                <ul className="space-y-1">
                                  {movimiento.ingresos.map((ingreso) => (
                                    <li key={ingreso.id} className={`flex justify-between p-2 rounded ${
                                      isDark ? 'bg-gray-600' : 'bg-green-50'
                                    }`}>
                                      <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{ingreso.etiqueta}</span>
                                      <span className="font-semibold text-green-500">{formatEuro(ingreso.monto)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay ingresos</p>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="text-red-500 font-medium mb-2">
                                Gastos ({formatEuro(movimiento.total_gastos)})
                              </h5>
                              {movimiento.gastos.length > 0 ? (
                                <ul className="space-y-1">
                                  {movimiento.gastos.map((gasto) => (
                                    <li key={gasto.id} className={`flex justify-between p-2 rounded ${
                                      isDark ? 'bg-gray-600' : 'bg-red-50'
                                    }`}>
                                      <span className={`flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                                        {gasto.etiqueta}
                                        {(gasto.es_recurrente === true || gasto.es_recurrente === 1 || gasto.es_recurrente === '1') && (
                                          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="Gasto recurrente">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </span>
                                      <span className="font-semibold text-red-500">{formatEuro(gasto.monto)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay gastos</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Indicador prominente para gastos recurrentes */}
                          {tieneGastosRecurrentes && (
                            <div className={`mt-4 pt-3 border-t ${
                              isDark ? 'border-yellow-400/50' : 'border-yellow-500/50'
                            }`}>
                              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                                isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'
                              }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                  isDark ? 'bg-yellow-400' : 'bg-yellow-500'
                                }`}></div>
                                <span className={`text-sm font-semibold ${
                                  isDark ? 'text-yellow-200' : 'text-yellow-800'
                                }`}>
                                  💰 MOVIMIENTO CREADO POR GASTO FIJO AUTOMÁTICO
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  ) : searchParams.fechaDesde || searchParams.fechaHasta || searchParams.etiqueta ? (
                    <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.441-1.086-5.813-2.709A7.962 7.962 0 0112 9c2.34 0 4.441 1.086 5.813 2.291A7.962 7.962 0 0112 15z" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No se encontraron resultados para los criterios de búsqueda
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={`mt-6 p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                      Resultados de búsqueda aparecerán aquí
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'etiquetas' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestión de Etiquetas
                </h2>

                {/* Formulario para crear nueva etiqueta */}
                <div className={`mb-8 p-4 rounded-lg border-2 border-dashed ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Crear Nueva Etiqueta
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva etiqueta"
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <div className="relative">
                      <select
                        className={`appearance-none px-3 py-2 pr-10 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                      >
                        <option value="gasto">Gasto</option>
                        <option value="ingreso">Ingreso</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                    <button
                      className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25 hover:from-green-500 hover:to-green-400'
                          : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-green-400/25 hover:from-green-400 hover:to-green-300'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Crear
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-green-500 font-medium mb-4">Etiquetas de Ingresos</h3>
                    <div className="space-y-2">
                      {etiquetas.ingresos.map(etiqueta => (
                        <div key={etiqueta} className={`flex justify-between items-center p-3 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{etiqueta}</span>
                            {etiquetasEsenciales.includes(etiqueta.toLowerCase()) && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isDark ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                Esencial
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleViewTag('ingreso', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow hover:shadow-slate-500/25 hover:from-slate-500 hover:to-slate-400'
                                  : 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow hover:shadow-slate-400/25 hover:from-slate-400 hover:to-slate-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Ver
                              </span>
                            </button>
                            <button
                              onClick={() => handleEditTag('ingreso', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteTag('ingreso', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Borrar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-red-500 font-medium mb-4">Etiquetas de Gastos</h3>
                    <div className="space-y-2">
                      {etiquetas.gastos.map(etiqueta => (
                        <div key={etiqueta} className={`flex justify-between items-center p-3 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{etiqueta}</span>
                            {etiquetasEsenciales.includes(etiqueta.toLowerCase()) && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isDark ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                Esencial
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleViewTag('gasto', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow hover:shadow-slate-500/25 hover:from-slate-500 hover:to-slate-400'
                                  : 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow hover:shadow-slate-400/25 hover:from-slate-400 hover:to-slate-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Ver
                              </span>
                            </button>
                            <button
                              onClick={() => handleEditTag('gasto', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteTag('gasto', etiqueta)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Borrar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'recurrentes' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Gastos Continuos
                  </h2>
                  
                </div>
                
                <div className={`p-6 rounded-lg border-2 border-dashed mb-6 ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Agregar Gasto Recurrente
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <select 
                        value={newRecurrent.etiqueta}
                        onChange={(e) => {
                          if (e.target.value === '__nueva__') {
                            handleCreateNewTag('newRecurrent.etiqueta', 'gasto')
                          } else {
                            setNewRecurrent(prev => ({...prev, etiqueta: e.target.value}))
                          }
                        }}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                      >
                        <option value="">Seleccionar etiqueta...</option>
                        {etiquetas.gastos.map(etiq => (
                          <option key={etiq} value={etiq}>{etiq}</option>
                        ))}
                        <option value="__nueva__">+ Crear nueva etiqueta</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newRecurrent.monto}
                        onChange={(e) => setNewRecurrent(prev => ({...prev, monto: e.target.value}))}
                        className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {/* Custom increment/decrement buttons */}
                      <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseFloat(newRecurrent.monto) || 0;
                            setNewRecurrent(prev => ({...prev, monto: (currentValue + 0.01).toFixed(2)}));
                          }}
                          className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                            isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                          }`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseFloat(newRecurrent.monto) || 0;
                            const newValue = Math.max(0, currentValue - 0.01);
                            setNewRecurrent(prev => ({...prev, monto: newValue.toFixed(2)}));
                          }}
                          className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                            isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                          }`}
                        >
                          −
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Frecuencia
                    </label>
                    <div className="relative">
                      <select 
                        value={newRecurrent.frecuencia}
                        onChange={(e) => setNewRecurrent(prev => ({...prev, frecuencia: e.target.value as any}))}
                        className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                      >
                        <option value="mensual">Mensual</option>
                        <option value="semanal">Semanal</option>
                        <option value="diario">Diario</option>
                        <option value="anual">Anual</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Opciones dinámicas según la frecuencia */}
                  {newRecurrent.frecuencia === 'mensual' && (
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Día del mes
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ej: 1"
                          value={newRecurrent.diaMes}
                          onChange={(e) => setNewRecurrent(prev => ({...prev, diaMes: e.target.value}))}
                          className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                        {/* Custom increment/decrement buttons */}
                        <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = parseInt(newRecurrent.diaMes) || 0;
                              const newValue = Math.min(31, currentValue + 1);
                              setNewRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                            }}
                            className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                              isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                            }`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = parseInt(newRecurrent.diaMes) || 0;
                              const newValue = Math.max(1, currentValue - 1);
                              setNewRecurrent(prev => ({...prev, diaMes: newValue.toString()}));
                            }}
                            className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                              isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                            }`}
                          >
                            −
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {newRecurrent.frecuencia === 'semanal' && (
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Día de la semana
                      </label>
                      <div className="relative">
                        <select 
                          value={newRecurrent.diaSemana}
                          onChange={(e) => setNewRecurrent(prev => ({...prev, diaSemana: e.target.value as any}))}
                          className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                        >
                          <option value="lunes">Lunes</option>
                          <option value="martes">Martes</option>
                          <option value="miercoles">Miércoles</option>
                          <option value="jueves">Jueves</option>
                          <option value="viernes">Viernes</option>
                          <option value="sabado">Sábado</option>
                          <option value="domingo">Domingo</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {newRecurrent.frecuencia === 'anual' && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Mes
                        </label>
                        <div className="relative">
                          <select 
                            value={newRecurrent.mesAnual}
                            onChange={(e) => setNewRecurrent(prev => ({...prev, mesAnual: e.target.value}))}
                            className={`appearance-none w-full px-3 py-2 pr-10 rounded-lg border ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200`}
                          >
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                          </select>
                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Día
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Ej: 1"
                            value={newRecurrent.diaAnual}
                            onChange={(e) => setNewRecurrent(prev => ({...prev, diaAnual: e.target.value}))}
                            className={`pr-8 w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          {/* Custom increment/decrement buttons */}
                          <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                const currentValue = parseInt(newRecurrent.diaAnual) || 0;
                                const newValue = Math.min(31, currentValue + 1);
                                setNewRecurrent(prev => ({...prev, diaAnual: newValue.toString()}));
                              }}
                              className={`flex-1 px-2 rounded-t border-l text-xs font-bold transition-colors ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                              }`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const currentValue = parseInt(newRecurrent.diaAnual) || 0;
                                const newValue = Math.max(1, currentValue - 1);
                                setNewRecurrent(prev => ({...prev, diaAnual: newValue.toString()}));
                              }}
                              className={`flex-1 px-2 rounded-b border-l border-t text-xs font-bold transition-colors ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-gray-300'
                              }`}
                            >
                              −
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      if (!newRecurrent.etiqueta || !newRecurrent.monto) return;
                      
                      const nuevoGasto = {
                        id: Date.now(),
                        etiqueta: newRecurrent.etiqueta,
                        monto: parseFloat(newRecurrent.monto),
                        frecuencia: newRecurrent.frecuencia,
                        diaMes: newRecurrent.diaMes ? parseInt(newRecurrent.diaMes) : undefined,
                        diaSemana: newRecurrent.diaSemana,
                        mesAnual: newRecurrent.mesAnual,
                        diaAnual: newRecurrent.diaAnual
                      };
                      
                      setGastosRecurrentes(prev => [...prev, nuevoGasto]);
                      setNewRecurrent({
                        etiqueta: '',
                        monto: '',
                        frecuencia: 'mensual',
                        diaMes: '',
                        diaSemana: 'lunes',
                        mesAnual: '1',
                        diaAnual: '1'
                      });
                    }}
                    disabled={!newRecurrent.etiqueta || !newRecurrent.monto}
                    className={`group relative overflow-hidden px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !newRecurrent.etiqueta || !newRecurrent.monto
                        ? isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                          : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md hover:shadow-purple-400/25 hover:from-purple-400 hover:to-purple-300'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Agregar Gasto Recurrente
                    </span>
                  </button>
                </div>

                <div>
                  <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Gastos Recurrentes Activos
                  </h3>
                  {gastosRecurrentes.length > 0 ? (
                    <div className="space-y-3">
                      {gastosRecurrentes.map(gasto => (
                        <div key={gasto.id} className={`p-4 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        } flex justify-between items-center`}>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {gasto.etiqueta}
                              </span>
                              <span className="font-bold text-red-500">
                                {formatEuro(gasto.monto)}
                              </span>
                            </div>
                            <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {gasto.frecuencia.charAt(0).toUpperCase() + gasto.frecuencia.slice(1)}
                              {gasto.frecuencia === 'mensual' && gasto.diaMes && ` - Día ${gasto.diaMes}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRecurrent(gasto)}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => setGastosRecurrentes(prev => prev.filter(g => g.id !== gasto.id))}
                              className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                isDark
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Eliminar
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No hay gastos recurrentes configurados
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'analisis' && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Análisis Financiero
                </h2>

                {/* Análisis de Gastos por Categoría */}
                <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Análisis de Gastos por Categoría
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Total del año
                    </div>
                  </div>

                  {(() => {
                    // Calcular gastos por etiqueta y estadísticas
                    const gastosPorEtiquetaAnalisis = {};
                    const currentYearAnalisis = new Date().getFullYear();
                    
                    movimientos.forEach(mov => {
                      mov.gastos.forEach(gasto => {
                        gastosPorEtiquetaAnalisis[gasto.etiqueta] = (gastosPorEtiquetaAnalisis[gasto.etiqueta] || 0) + gasto.monto;
                      });
                    });
                    
                    const gastosOrdenados = Object.entries(gastosPorEtiquetaAnalisis)
                      .filter(([, monto]) => monto > 0)
                      .sort(([,a], [,b]) => b - a);
                    
                    const totalGastos = gastosOrdenados.reduce((sum, [, monto]) => sum + monto, 0);
                    const gastosEsenciales = gastosOrdenados
                      .filter(([etiqueta]) => etiquetasEsenciales.some(esencial => 
                        etiqueta.toLowerCase().includes(esencial)
                      ))
                      .reduce((sum, [, monto]) => sum + monto, 0);
                    
                    // Calcular meses con gastos esenciales reales
                    const mesesConGastosEsenciales = new Set();
                    movimientos.forEach(mov => {
                      const tieneGastosEsenciales = mov.gastos.some(gasto => 
                        etiquetasEsenciales.some(esencial => 
                          gasto.etiqueta.toLowerCase().includes(esencial)
                        )
                      );
                      if (tieneGastosEsenciales) {
                        const fecha = new Date(mov.fecha);
                        const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                        mesesConGastosEsenciales.add(mesKey);
                      }
                    });
                    
                    const numeroMesesPagados = mesesConGastosEsenciales.size;
                    const mediaMensualEsenciales = numeroMesesPagados > 0 ? gastosEsenciales / numeroMesesPagados : 0;

                    if (gastosOrdenados.length === 0) {
                      return (
                        <div className={`p-8 text-center rounded-lg border ${
                          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                        }`}>
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            No hay gastos registrados para mostrar estadísticas
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Resumen de estadísticas principales */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-red-500 mb-1">
                              {formatEuro(totalGastos)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Total gastado {currentYearAnalisis}
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-orange-500 mb-1">
                              {formatEuro(gastosEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Gastos esenciales
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="text-2xl font-bold text-blue-500 mb-1">
                              {formatEuro(mediaMensualEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Media mensual esenciales ({numeroMesesPagados} meses pagados)
                            </div>
                          </div>
                        </div>

                        {/* Lista de categorías con barras de progreso */}
                        <div className="space-y-3">
                          {gastosOrdenados.slice(0, 10).map(([etiqueta, monto], index) => {
                            const porcentaje = (monto / totalGastos) * 100;
                            const esEsencial = etiquetasEsenciales.some(esencial => 
                              etiqueta.toLowerCase().includes(esencial)
                            );
                            
                            return (
                              <div key={etiqueta} className={`p-4 rounded-lg ${
                                isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                              } hover:shadow-md transition-shadow`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                      index === 0 ? 'bg-red-500' : 
                                      index === 1 ? 'bg-orange-500' : 
                                      index === 2 ? 'bg-yellow-500' : 
                                      'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {etiqueta}
                                        {esEsencial && (
                                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800">
                                            Esencial
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {porcentaje.toFixed(1)}% del total
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-red-500 text-lg">
                                      {formatEuro(monto)}
                                    </div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {formatEuro(monto / 12)}/mes
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      index === 0 ? 'bg-red-500' : 
                                      index === 1 ? 'bg-orange-500' : 
                                      index === 2 ? 'bg-yellow-500' : 
                                      'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          
                          {gastosOrdenados.length > 10 && (
                            <div className={`p-3 text-center rounded-lg ${
                              isDark ? 'bg-gray-800 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                            }`}>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ... y {gastosOrdenados.length - 10} categorías más
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Gráficos de evolución mensual */}
                <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Evolución Mensual de Ingresos y Gastos
                  </h3>
                  
                  {(() => {
                    // Preparar datos para los gráficos
                    const datosPorMes = {};
                    const currentYear = new Date().getFullYear();
                    
                    movimientos.forEach(mov => {
                      const fecha = new Date(mov.fecha);
                      if (fecha.getFullYear() === currentYear) {
                        const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                        const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                        
                        if (!datosPorMes[mesKey]) {
                          datosPorMes[mesKey] = {
                            mes: mesNombre,
                            ingresos: 0,
                            gastos: 0,
                            balance: 0
                          };
                        }
                        
                        datosPorMes[mesKey].ingresos += mov.ingreso_total;
                        datosPorMes[mesKey].gastos += mov.total_gastos;
                        datosPorMes[mesKey].balance = datosPorMes[mesKey].ingresos - datosPorMes[mesKey].gastos;
                      }
                    });
                    
                    const datosOrdenados = Object.keys(datosPorMes)
                      .sort()
                      .map(key => datosPorMes[key]);
                    
                    if (datosOrdenados.length === 0) {
                      return (
                        <div className={`p-8 text-center rounded-lg border ${
                          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                        }`}>
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            No hay datos suficientes para mostrar gráficos mensuales
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-8">
                        {/* Gráfico de líneas - Evolución temporal */}
                        <div>
                          <h4 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            Tendencia por Meses
                          </h4>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={datosOrdenados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
                                <XAxis 
                                  dataKey="mes" 
                                  stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                  fontSize={12}
                                />
                                <YAxis 
                                  stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                  fontSize={12}
                                  tickFormatter={(value) => `${value.toFixed(0)}€`}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: isDark ? '#374151' : '#FFFFFF',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                    color: isDark ? '#F3F4F6' : '#111827'
                                  }}
                                  formatter={(value, name) => [`${value.toFixed(2)}€`, name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Balance']}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="ingresos" 
                                  stroke="#10B981" 
                                  strokeWidth={2}
                                  name="Ingresos"
                                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="gastos" 
                                  stroke="#EF4444" 
                                  strokeWidth={2}
                                  name="Gastos"
                                  dot={{ fill: '#EF4444', strokeWidth: 2 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="balance" 
                                  stroke="#3B82F6" 
                                  strokeWidth={2}
                                  name="Balance"
                                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Gráfico de barras - Comparación mensual */}
                        <div>
                          <h4 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            Comparación Mensual
                          </h4>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={datosOrdenados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
                                <XAxis 
                                  dataKey="mes" 
                                  stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                  fontSize={12}
                                />
                                <YAxis 
                                  stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                  fontSize={12}
                                  tickFormatter={(value) => `${value.toFixed(0)}€`}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: isDark ? '#374151' : '#FFFFFF',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                    color: isDark ? '#F3F4F6' : '#111827'
                                  }}
                                  formatter={(value, name) => [`${value.toFixed(2)}€`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                                />
                                <Legend />
                                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                                <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                
                {(() => {
                  // Calcular estadísticas
                  const currentYear = new Date().getFullYear()
                  const ingresosPorEtiqueta = {}
                  const gastosPorEtiqueta = {}
                  
                  // Calcular por mes para comparaciones
                  const datosPorMes = {}
                  
                  movimientos.forEach(mov => {
                    const fecha = new Date(mov.fecha)
                    const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
                    
                    if (!datosPorMes[mes]) {
                      datosPorMes[mes] = { ingresos: 0, gastos: 0, ingresosPorEtiqueta: {}, gastosPorEtiqueta: {} }
                    }
                    
                    // Ingresos por etiqueta
                    mov.ingresos.forEach(ingreso => {
                      ingresosPorEtiqueta[ingreso.etiqueta] = (ingresosPorEtiqueta[ingreso.etiqueta] || 0) + ingreso.monto
                      datosPorMes[mes].ingresosPorEtiqueta[ingreso.etiqueta] = (datosPorMes[mes].ingresosPorEtiqueta[ingreso.etiqueta] || 0) + ingreso.monto
                      datosPorMes[mes].ingresos += ingreso.monto
                    })
                    
                    // Gastos por etiqueta
                    mov.gastos.forEach(gasto => {
                      gastosPorEtiqueta[gasto.etiqueta] = (gastosPorEtiqueta[gasto.etiqueta] || 0) + gasto.monto
                      datosPorMes[mes].gastosPorEtiqueta[gasto.etiqueta] = (datosPorMes[mes].gastosPorEtiqueta[gasto.etiqueta] || 0) + gasto.monto
                      datosPorMes[mes].gastos += gasto.monto
                    })
                  })
                  
                  const meses = Object.keys(datosPorMes).sort()
                  const ingresosTotales = Object.values(ingresosPorEtiqueta).reduce((sum, val) => sum + val, 0)
                  const gastosTotales = Object.values(gastosPorEtiqueta).reduce((sum, val) => sum + val, 0)
                  const gastosEsenciales = Object.entries(gastosPorEtiqueta)
                    .filter(([etiqueta]) => etiquetasEsenciales.includes(etiqueta.toLowerCase()))
                    .reduce((sum, [, monto]) => sum + monto, 0)
                  const mesesConGastosEsenciales = meses.filter(mes => 
                    Object.entries(datosPorMes[mes].gastosPorEtiqueta).some(([etiqueta]) => 
                      etiquetasEsenciales.includes(etiqueta.toLowerCase())
                    )
                  ).length
                  
                  if (movimientos.length === 0) {
                    return (
                      <div className={`p-8 text-center rounded-lg border ${
                        isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No hay datos para mostrar análisis
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-8">
                      {/* KPIs principales */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                        }`}>
                          <div className="text-2xl font-bold text-blue-500 mb-2">
                            {formatEuro(ingresosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Ingresos {currentYear}
                          </div>
                        </div>
                        
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                        }`}>
                          <div className="text-2xl font-bold text-red-500 mb-2">
                            {formatEuro(gastosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Gastos {currentYear}
                          </div>
                        </div>
                        
                        <div className={`p-6 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className={`text-2xl font-bold ${ingresosTotales - gastosTotales >= 0 ? 'text-green-500' : 'text-red-500'} mb-2`}>
                            {formatEuro(ingresosTotales - gastosTotales)}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Balance {currentYear}
                          </div>
                        </div>
                      </div>
                      
                      {/* Análisis de ingresos por etiqueta */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Ingresos por Categoría
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(ingresosPorEtiqueta)
                            .sort(([,a], [,b]) => b - a)
                            .map(([etiqueta, monto]) => {
                              const porcentaje = (monto / ingresosTotales) * 100
                              const mediaMensual = monto / Math.max(meses.length, 1)
                              
                              return (
                                <div key={etiqueta} className={`p-4 rounded-lg border ${
                                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {etiqueta}
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-green-500">{formatEuro(monto)}</div>
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {formatEuro(mediaMensual)}/mes
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${porcentaje}%` }}
                                    ></div>
                                  </div>
                                  <div className={`text-xs text-right mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {porcentaje.toFixed(1)}%
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                      
                      {/* Análisis de gastos esenciales corregido */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Gastos Esenciales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className={`p-4 rounded-lg border ${
                            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-orange-200'
                          }`}>
                            <div className="text-2xl font-bold text-orange-500 mb-1">
                              {formatEuro(gastosEsenciales)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Total gastos esenciales
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg border ${
                            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-200'
                          }`}>
                            <div className="text-2xl font-bold text-blue-500 mb-1">
                              {mesesConGastosEsenciales > 0 ? formatEuro(gastosEsenciales / mesesConGastosEsenciales) : formatEuro(0)}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Media mensual ({mesesConGastosEsenciales} meses pagados)
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(gastosPorEtiqueta)
                            .filter(([etiqueta]) => etiquetasEsenciales.includes(etiqueta.toLowerCase()))
                            .sort(([,a], [,b]) => b - a)
                            .map(([etiqueta, monto]) => {
                              const mesesPagados = meses.filter(mes => 
                                datosPorMes[mes].gastosPorEtiqueta[etiqueta] > 0
                              ).length
                              const mediaMensual = mesesPagados > 0 ? monto / mesesPagados : 0
                              
                              return (
                                <div key={etiqueta} className={`p-4 rounded-lg border ${
                                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {etiqueta}
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-orange-500">{formatEuro(monto)}</div>
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {formatEuro(mediaMensual)}/mes ({mesesPagados} meses)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                      
                      {/* Comparación mensual */}
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Evolución Mensual
                        </h3>
                        <div className="space-y-3">
                          {meses.map(mes => {
                            const datos = datosPorMes[mes]
                            const balance = datos.ingresos - datos.gastos
                            
                            return (
                              <div key={mes} className={`p-4 rounded-lg border ${
                                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {new Date(mes + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                                  </span>
                                  <div className={`font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatEuro(balance)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Ingresos: </span>
                                    <span className="text-green-500 font-medium">{formatEuro(datos.ingresos)}</span>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Gastos: </span>
                                    <span className="text-red-500 font-medium">{formatEuro(datos.gastos)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </main>

          {/* Columna lateral derecha (25%) */}
          <aside className="w-1/4" style={{ paddingTop: '68px' }}>
            <div className="space-y-6">
              {/* Resumen de hoy */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Hoy
                </h3>
                <p className={`text-sm mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date().toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
                {todayMovimientos ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-500 font-medium">Ingresos:</span>
                      <span className="text-lg font-bold text-green-500">
                        {formatEuro(todayMovimientos.ingreso_total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500 font-medium">Gastos:</span>
                      <span className="text-lg font-bold text-red-500">
                        {formatEuro(todayMovimientos.total_gastos)}
                      </span>
                    </div>
                    <div className={`my-4 h-px ${
                      isDark 
                        ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' 
                        : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'
                    }`}></div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-500">Balance:</span>
                      <span className="font-bold text-blue-500">
                        {formatEuro(todayMovimientos.balance)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sin movimientos hoy
                  </p>
                )}
              </div>

              {/* Total del mes */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-3 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Total del Mes
                </h3>
                <p className={`text-xs mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </p>
                
                {/* Diseño de resta visual */}
                <div className="space-y-2">
                  {(() => {
                    const currentMonth = new Date().getMonth()
                    const currentYear = new Date().getFullYear()
                    const monthMovimientos = movimientos.filter(m => {
                      const date = new Date(m.fecha)
                      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
                    })
                    
                    const totalIngresos = monthMovimientos.reduce((sum, m) => sum + m.ingreso_total, 0)
                    const totalGastos = monthMovimientos.reduce((sum, m) => sum + m.total_gastos, 0)
                    
                    return (
                      <>
                        {/* Ingresos */}
                        <div className="flex justify-between items-center py-2 px-3">
                          <span className="text-green-500 font-medium">Ingresos</span>
                          <span className="text-lg font-bold text-green-500">{formatEuro(totalIngresos)}</span>
                        </div>
                        
                        {/* Separador igual al resto de la página */}
                        <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                        
                        {/* Gastos */}
                        <div className="flex justify-between items-center py-2 px-3">
                          <span className="text-red-500 font-medium">Gastos</span>
                          <span className="text-lg font-bold text-red-500">{formatEuro(totalGastos)}</span>
                        </div>
                        
                        {/* Línea de resultado */}
                        <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                        <div className="pt-2 mt-3">
                          <div className="flex justify-between items-center py-2 px-3">
                            <span className="text-blue-500 font-medium">Balance</span>
                            <span className="text-lg font-bold text-blue-500">
                              {formatEuro(monthlyTotal)}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                
                <div className="mt-4 pt-3">
                  <button
                    onClick={() => setShowMonthlyBreakdown(true)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title="Ver desglose mensual"
                  >
                    <BarChart3 size={16} />
                    Ver Desglose Mensual
                  </button>
                </div>
              </div>

              {/* Total del año */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
                <h3 className={`text-lg font-semibold mb-3 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Total del Año
                </h3>
                <p className={`text-xs mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Año {new Date().getFullYear()}
                </p>
                
                {/* Visual subtraction layout */}
                <div className="space-y-2 mb-4">
                  {/* Ingresos */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-green-500 font-medium">
                      Ingresos
                    </span>
                    <span className="text-lg font-bold text-green-500">
                      {formatEuro(yearlyIngresos)}
                    </span>
                  </div>
                  
                  {/* Separador igual al resto de la página */}
                  <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                  
                  {/* Gastos */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-red-500 font-medium">
                      Gastos
                    </span>
                    <span className="text-lg font-bold text-red-500">
                      {formatEuro(yearlyGastos)}
                    </span>
                  </div>
                  
                  {/* Línea de resultado */}
                  <div className={`h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300/40 to-transparent'}`}></div>
                  <div className="pt-2 mt-3">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-blue-500 font-medium">
                        Balance
                      </span>
                      <span className="text-lg font-bold text-blue-500">
                        {formatEuro(yearlyTotal)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3">
                  <button
                    onClick={() => setShowYearlyBreakdown(true)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                    title="Ver desglose anual"
                  >
                    <TrendingUp size={16} />
                    Ver Desglose Anual
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Notificación de movimiento grande */}
      {bigMovementNotification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`rounded-lg shadow-2xl p-6 transform transition-all duration-500 ease-in-out ${
            bigMovementNotification.type === 'income' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
              : bigMovementNotification.type === 'expense'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
              : bigMovementNotification.amount > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
          } border-2 border-white/20`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {bigMovementNotification.type === 'income' ? '🎉' : 
                 bigMovementNotification.type === 'expense' ? '💸' : 
                 bigMovementNotification.amount > 0 ? '🎊' : '⚠️'}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {bigMovementNotification.type === 'income' ? '¡Excelentes ingresos!' : 
                   bigMovementNotification.type === 'expense' ? '¡Gasto importante!' :
                   bigMovementNotification.amount > 0 ? '¡Gran balance positivo!' : '¡Atención al balance!'}
                </h3>
                <p className="text-sm opacity-90">
                  {formatEuro(bigMovementNotification.amount)}
                  {bigMovementNotification.type === 'income' ? ' en ingresos' :
                   bigMovementNotification.type === 'expense' ? ' en gastos' :
                   ' de balance'}
                </p>
                <p className="text-xs opacity-80 mt-1 font-medium">
                  mama eres la mejor te quiero ❤️
                </p>
              </div>
              <button
                onClick={() => setBigMovementNotification({ show: false, amount: 0, type: 'balance' })}
                className="ml-auto text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App