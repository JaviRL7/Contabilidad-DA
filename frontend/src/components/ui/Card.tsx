import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  isDark?: boolean
  variant?: 'default' | 'today' | 'recurring' | 'analysis'
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  isDark = false,
  variant = 'default',
  onClick,
  padding = 'md'
}) => {
  const baseClasses = 'rounded-lg shadow transition-all duration-200'
  
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const variantClasses = {
    default: isDark 
      ? 'bg-gray-800 text-white' 
      : 'bg-white text-gray-900',
    today: isDark
      ? 'bg-gray-800 text-white ring-2 ring-blue-500/30 shadow-blue-500/20'
      : 'bg-white text-gray-900 ring-2 ring-blue-400/30 shadow-blue-400/20',
    recurring: isDark
      ? 'bg-gray-800 text-white border-2 border-yellow-300/40 shadow-yellow-300/10'
      : 'bg-white text-gray-900 border-2 border-yellow-400/50 shadow-yellow-400/10',
    analysis: isDark
      ? 'bg-gray-800 border border-gray-700 text-white hover:shadow-lg'
      : 'bg-white border border-gray-200 text-gray-900 hover:shadow-lg'
  }
  
  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-lg' : ''
  
  const classes = `${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${hoverClasses} ${className}`
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

export default Card