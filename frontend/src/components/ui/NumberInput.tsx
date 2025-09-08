import React from 'react'

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

export default NumberInput