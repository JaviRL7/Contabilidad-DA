import React from 'react'

interface GenericModalProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  children: React.ReactNode
  className?: string
}

const Modal: React.FC<GenericModalProps> = ({ isOpen, onClose, isDark = false, children, className = '' }) => {
  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className={`rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ${className}`}>
        {children}
      </div>
    </div>
  )
}

export default Modal