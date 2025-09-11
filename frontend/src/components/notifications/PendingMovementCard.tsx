import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PendingMovementCardProps {
  pendingCount: number
  isDark: boolean
  onNavigateToCalendar: () => void
}

const PendingMovementCard: React.FC<PendingMovementCardProps> = ({
  pendingCount,
  isDark,
  onNavigateToCalendar
}) => {
  if (pendingCount === 0) return null

  return (
    <div className={`mb-4 rounded-lg p-3 shadow-sm border-l-4 border-blue-400 ${
      isDark 
        ? 'bg-gradient-to-r from-blue-900/10 to-indigo-900/10' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50'
    }`}>
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-3 ${
          isDark ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}>
          <svg 
            className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className={`font-medium text-sm ${
            isDark ? 'text-blue-200' : 'text-blue-800'
          }`}>
            {pendingCount} recordatorio{pendingCount !== 1 ? 's' : ''} de calendario
          </h3>
          <p className={`text-xs ${
            isDark ? 'text-blue-300' : 'text-blue-600'
          }`}>
            Tienes movimientos programados pendientes
          </p>
        </div>
        
        <button
          onClick={onNavigateToCalendar}
          className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Ver
        </button>
      </div>
    </div>
  )
}

export default PendingMovementCard