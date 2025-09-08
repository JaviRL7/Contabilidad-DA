import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'nav'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  isDark?: boolean
  active?: boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  isDark = false,
  active = false
}) => {
  const baseClasses = 'rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  
  const variantClasses = {
    primary: isDark
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400',
    secondary: isDark
      ? 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500'
      : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-400',
    danger: isDark
      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
    success: isDark
      ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
      : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
    nav: active
      ? isDark 
        ? 'bg-blue-900 text-blue-300' 
        : 'bg-blue-100 text-blue-700'
      : isDark
        ? 'text-gray-300 hover:text-white'
        : 'text-gray-500 hover:text-gray-700'
  }
  
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  )
}

export default Button