import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import { parseISO } from 'date-fns'
import { X, Edit, Plus, Trash2, ChevronDown, Check } from 'lucide-react'
import { formatEuro } from '../../utils/formatters'
import { useEditMovimiento } from '../../hooks/useEditMovimiento'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

interface MovimientoDiario {
  id: number
  fecha: string
  ingresos: any[]
  gastos: any[]
  ingreso_total: number
  total_gastos: number
  balance: number
}

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  movimiento: MovimientoDiario | null
  isDark: boolean
  onSave: (movimiento: MovimientoDiario) => Promise<void>
  etiquetas: {
    ingresos: string[]
    gastos: string[]
  }
  onCreateNewTag?: (field: string, tipo: 'ingreso' | 'gasto') => void
}

// ========================================
// COMPONENTES AUXILIARES
// ========================================

interface ItemFormProps {
  tipo: 'ingreso' | 'gasto'
  etiquetas: string[]
  isDark: boolean
  onAdd: (data: { etiqueta: string; monto: number }) => void
  onCancel: () => void
  onCreateNewTag?: (field: string, tipo: 'ingreso' | 'gasto') => void
}

const ItemForm: React.FC<ItemFormProps> = ({ tipo, etiquetas, isDark, onAdd, onCancel, onCreateNewTag }) => {
  const [formData, setFormData] = useState({ etiqueta: '', monto: '' })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(formData.monto)
    if (!formData.etiqueta || isNaN(monto) || monto <= 0) return
    
    onAdd({ etiqueta: formData.etiqueta, monto })
    setFormData({ etiqueta: '', monto: '' })
  }

  const colorClass = tipo === 'ingreso' ? 'green' : 'red'

  return (
    <form onSubmit={handleSubmit} className={`p-4 rounded-lg border mb-4 ${
      isDark ? 'bg-gray-700 border-gray-600' : `bg-${colorClass}-50 border-${colorClass}-200`
    }`}>
      <div className="space-y-3">
        {/* Dropdown personalizado con PerfectScrollbar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full px-3 py-2 pr-10 rounded border text-left transition-all duration-200 ${
              isDark 
                ? 'bg-gray-600 border-gray-500 text-white hover:border-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {formData.etiqueta || 'Seleccionar etiqueta...'}
          </button>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          
          {dropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}>
              <PerfectScrollbar
                options={{
                  suppressScrollX: true,
                  wheelPropagation: false
                }}
                style={{ maxHeight: '150px' }}
              >
                <div className="py-1">
                  {/* Opción placeholder */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, etiqueta: '' }))
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      formData.etiqueta === '' 
                        ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.etiqueta === '' && <Check className="w-3 h-3" />}
                      <span className={formData.etiqueta === '' ? '' : 'ml-5'}>
                        Seleccionar etiqueta...
                      </span>
                    </div>
                  </button>
                  
                  {/* Etiquetas disponibles */}
                  {etiquetas.map((etiqueta, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, etiqueta }))
                        setDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        formData.etiqueta === etiqueta 
                          ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {formData.etiqueta === etiqueta && <Check className="w-3 h-3" />}
                        <span className={formData.etiqueta === etiqueta ? '' : 'ml-5'}>
                          {etiqueta}
                        </span>
                      </div>
                    </button>
                  ))}
                  
                  {/* Opción crear nueva etiqueta */}
                  {onCreateNewTag && (
                    <div className={`border-t mt-1 pt-1 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onCreateNewTag('etiqueta', tipo)
                          setDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          isDark ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-3 h-3" />
                          <span>Crear nueva etiqueta</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </PerfectScrollbar>
            </div>
          )}
        </div>
        
        {/* Input de monto sin spinners */}
        <input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={formData.monto}
          onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
          className={`w-full px-3 py-2 rounded border ${
            isDark 
              ? 'bg-gray-600 border-gray-500 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          required
        />
        
        {/* Botones con estilos mejorados */}
        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
              tipo === 'ingreso' 
                ? 'bg-green-600 hover:bg-green-700 hover:shadow-md' 
                : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
            }`}
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-gray-600 text-white hover:bg-gray-500 hover:shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}

interface ItemEditFormProps {
  item: any
  tipo: 'ingreso' | 'gasto'
  etiquetas: string[]
  isDark: boolean
  onSave: (data: { etiqueta: string; monto: number }) => void
  onCancel: () => void
  onCreateNewTag?: (field: string, tipo: 'ingreso' | 'gasto') => void
}

const ItemEditForm: React.FC<ItemEditFormProps> = ({ item, tipo, etiquetas, isDark, onSave, onCancel, onCreateNewTag }) => {
  const [formData, setFormData] = useState({ 
    etiqueta: item.etiqueta, 
    monto: item.monto.toString() 
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(formData.monto)
    if (!formData.etiqueta || isNaN(monto) || monto <= 0) return
    
    onSave({ etiqueta: formData.etiqueta, monto })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Dropdown personalizado con PerfectScrollbar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full px-3 py-2 pr-8 rounded-lg border text-left text-sm transition-all duration-200 ${
            isDark 
              ? 'bg-gray-600 border-gray-500 text-white hover:border-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          {formData.etiqueta || 'Seleccionar etiqueta...'}
        </button>
        <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 pointer-events-none transition-transform duration-200 ${
          dropdownOpen ? 'rotate-180' : ''
        } ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        
        {dropdownOpen && (
          <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <PerfectScrollbar
              options={{
                suppressScrollX: true,
                wheelPropagation: false
              }}
              style={{ maxHeight: '120px' }}
            >
              <div className="py-1">
                {/* Etiquetas disponibles */}
                {etiquetas.map((etiqueta, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, etiqueta }))
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                      formData.etiqueta === etiqueta 
                        ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.etiqueta === etiqueta && <Check className="w-3 h-3" />}
                      <span className={formData.etiqueta === etiqueta ? '' : 'ml-5'}>
                        {etiqueta}
                      </span>
                    </div>
                  </button>
                ))}
                
                {/* Opción crear nueva etiqueta */}
                {onCreateNewTag && (
                  <div className={`border-t mt-1 pt-1 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNewTag('etiqueta', tipo)
                        setDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                        isDark ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        <span>Crear nueva etiqueta</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </PerfectScrollbar>
          </div>
        )}
      </div>
      
      {/* Input de monto sin spinners */}
      <input
        type="number"
        step="0.01"
        value={formData.monto}
        onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
        className={`w-full px-3 py-2 rounded-lg border text-sm ${
          isDark 
            ? 'bg-gray-600 border-gray-500 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      
      {/* Botones mejorados con iconos y mejor styling */}
      <div className="flex gap-2">
        <button
          type="submit"
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-200 ${
            tipo === 'ingreso' 
              ? 'bg-green-600 hover:bg-green-700 hover:shadow-md' 
              : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
          }`}
        >
          <Check className="w-4 h-4" />
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            isDark 
              ? 'bg-gray-600 text-white hover:bg-gray-500 hover:shadow-md' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
          }`}
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </form>
  )
}

interface ItemListProps {
  items: any[]
  tipo: 'ingreso' | 'gasto'
  editingItem: { tipo: 'ingreso' | 'gasto'; id: number } | null
  deletingItems: Set<number>
  etiquetas: string[]
  isDark: boolean
  onEdit: (item: any) => void
  onSave: (itemId: number, data: { etiqueta: string; monto: number }) => void
  onCancelEdit: () => void
  onDelete: (itemId: number) => void
}

const ItemList: React.FC<ItemListProps> = ({
  items,
  tipo,
  editingItem,
  deletingItems,
  etiquetas,
  isDark,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete
}) => {
  const colorClass = tipo === 'ingreso' ? 'green' : 'red'

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-sm italic">No hay {tipo}s</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className={`p-3 rounded-lg border transition-all duration-200 ${
          isDark 
            ? 'bg-gray-700 border-gray-600' 
            : `bg-${colorClass}-50 border-${colorClass}-200`
        }`}>
          {editingItem?.tipo === tipo && editingItem?.id === item.id ? (
            <ItemEditForm
              item={item}
              tipo={tipo}
              etiquetas={etiquetas}
              isDark={isDark}
              onSave={(data) => onSave(item.id, data)}
              onCancel={onCancelEdit}
              onCreateNewTag={onCreateNewTag}
            />
          ) : (
            <div className="flex justify-between items-center">
              <div 
                className="cursor-pointer flex-1" 
                onClick={() => onEdit(item)}
              >
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.etiqueta}
                </div>
                <div className={`font-semibold text-sm text-${colorClass}-500`}>
                  {tipo === 'ingreso' ? '+' : ''}{formatEuro(item.monto)}
                </div>
              </div>
              
              <button
                onClick={() => onDelete(item.id)}
                disabled={deletingItems.has(item.id)}
                className={`p-2 rounded-lg transition-colors ${
                  deletingItems.has(item.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-red-500/10'
                }`}
                title={`Eliminar ${tipo}`}
              >
                <Trash2 className={`w-4 h-4 ${
                  deletingItems.has(item.id) ? 'text-gray-400' : 'text-red-500'
                }`} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const EditModalRefactored: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  movimiento,
  isDark,
  onSave,
  etiquetas,
  onCreateNewTag
}) => {
  const [showAddForm, setShowAddForm] = useState<'ingreso' | 'gasto' | null>(null)

  const {
    editedMovimiento,
    editingItem,
    setEditingItem,
    deletingItems,
    loading,
    deleteItem,
    updateItem,
    addItem,
    updateDate,
    saveChanges
  } = useEditMovimiento(movimiento, onSave)

  if (!isOpen || !editedMovimiento) return null

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateChange = (date: Date) => {
    updateDate(formatDateForAPI(date))
  }

  const handleItemEdit = (tipo: 'ingreso' | 'gasto', item: any) => {
    setEditingItem({ tipo, id: item.id })
  }

  const handleItemSave = (itemId: number, data: { etiqueta: string; monto: number }) => {
    if (!editingItem) return
    updateItem(editingItem.tipo, itemId, data)
    setEditingItem(null)
  }

  const handleItemDelete = async (tipo: 'ingreso' | 'gasto', itemId: number) => {
    try {
      await deleteItem(tipo, itemId)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const handleAddItem = (tipo: 'ingreso' | 'gasto', data: { etiqueta: string; monto: number }) => {
    addItem(tipo, data)
    setShowAddForm(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-auto`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-600/20' : 'bg-blue-100'
              }`}>
                <Edit className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Editar Movimiento
                </h2>
                <DatePicker
                  selected={parseISO(editedMovimiento.fecha)}
                  onChange={handleDateChange}
                  className={`mt-2 px-3 py-1 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Línea separadora vertical */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px transform -translate-x-1/2">
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Agregar
                </button>
              </div>

              {showAddForm === 'ingreso' && (
                <ItemForm
                  tipo="ingreso"
                  etiquetas={etiquetas.ingresos}
                  isDark={isDark}
                  onAdd={(data) => handleAddItem('ingreso', data)}
                  onCancel={() => setShowAddForm(null)}
                  onCreateNewTag={onCreateNewTag}
                />
              )}

              <ItemList
                items={editedMovimiento.ingresos}
                tipo="ingreso"
                editingItem={editingItem}
                deletingItems={deletingItems}
                etiquetas={etiquetas.ingresos}
                isDark={isDark}
                onEdit={(item) => handleItemEdit('ingreso', item)}
                onSave={handleItemSave}
                onCancelEdit={() => setEditingItem(null)}
                onDelete={(itemId) => handleItemDelete('ingreso', itemId)}
              />
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Agregar
                </button>
              </div>

              {showAddForm === 'gasto' && (
                <ItemForm
                  tipo="gasto"
                  etiquetas={etiquetas.gastos}
                  isDark={isDark}
                  onAdd={(data) => handleAddItem('gasto', data)}
                  onCancel={() => setShowAddForm(null)}
                  onCreateNewTag={onCreateNewTag}
                />
              )}

              <ItemList
                items={editedMovimiento.gastos}
                tipo="gasto"
                editingItem={editingItem}
                deletingItems={deletingItems}
                etiquetas={etiquetas.gastos}
                isDark={isDark}
                onEdit={(item) => handleItemEdit('gasto', item)}
                onSave={handleItemSave}
                onCancelEdit={() => setEditingItem(null)}
                onDelete={(itemId) => handleItemDelete('gasto', itemId)}
              />
            </div>
          </div>

          {/* Balance y botones */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
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
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancelar
              </button>
              <button
                onClick={saveChanges}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditModalRefactored