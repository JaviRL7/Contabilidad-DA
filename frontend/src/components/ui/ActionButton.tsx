import React from 'react'

interface ActionButtonProps {
  variant: 'view' | 'edit' | 'delete'
  onClick: () => void
  isDark?: boolean
  children: React.ReactNode
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
          ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow hover:shadow-slate-500/25 hover:from-slate-500 hover:to-slate-400'
          : 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow hover:shadow-slate-400/25 hover:from-slate-400 hover:to-slate-300'
      case 'edit':
        return isDark
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:shadow-indigo-400/25 hover:from-indigo-400 hover:to-purple-400'
      case 'delete':
        return isDark
          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow hover:shadow-red-500/25 hover:from-red-500 hover:to-red-400'
          : 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow hover:shadow-red-400/25 hover:from-red-400 hover:to-red-300'
      default:
        return ''
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
    <button
      onClick={onClick}
      className={`group relative overflow-hidden px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${getVariantStyles()}`}
    >
      <span className="relative z-10 flex items-center gap-1">
        {getIcon()}
        {children}
      </span>
    </button>
  )
}

export default ActionButton