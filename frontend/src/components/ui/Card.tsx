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
      ? 'bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-500 shadow-xl shadow-blue-500/25 text-white'
      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl shadow-blue-200/25 text-gray-900',
    recurring: isDark
      ? 'bg-gradient-to-r from-green-900 to-teal-900 border border-green-500 shadow-lg shadow-green-500/20 text-white'
      : 'bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 shadow-lg shadow-green-200/20 text-gray-900',
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