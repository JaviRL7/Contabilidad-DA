import React from 'react'

interface ActionButtonProps {
  variant: 'view' | 'edit' | 'delete'
  onClick: () => void
  isDark?: boolean
  children?: React.ReactNode
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  variant, 
  onClick, 
  isDark = false, 
  children 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'view':
        return isDark
          ? 'bg-slate-600 text-white hover:bg-slate-500'
          : 'bg-slate-500 text-white hover:bg-slate-400'
      case 'edit':
        return isDark
          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
          : 'bg-indigo-500 text-white hover:bg-indigo-400'
      case 'delete':
        return isDark
          ? 'bg-red-600 text-white hover:bg-red-500'
          : 'bg-red-500 text-white hover:bg-red-400'
      default:
        return ''
    }
  }

  const getTooltipText = () => {
    switch (variant) {
      case 'view': return 'Ver'
      case 'edit': return 'Editar'
      case 'delete': return 'Borrar'
      default: return ''
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'view':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        )
      case 'edit':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        )
      case 'delete':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2 rounded-full transition-all duration-200 ${getVariantStyles()}`}
        title={getTooltipText()}
      >
        {getIcon()}
      </button>
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

export default ActionButton