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
    <div className={`mb-6 ${
      isDark 
        ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-600/50' 
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
    } border-2 rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className={`p-3 rounded-full ${
            isDark ? 'bg-amber-600' : 'bg-amber-500'
          }`}>
            <svg 
              className="w-6 h-6 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Content */}
          <div>
            <h3 className={`font-semibold text-lg ${
              isDark ? 'text-amber-200' : 'text-amber-800'
            }`}>
              Tienes movimientos pendientes
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>
              {pendingCount} notificación{pendingCount !== 1 ? 'es' : ''} 
              {pendingCount === 1 ? ' requiere' : ' requieren'} tu atención
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNavigateToCalendar}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
            isDark
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg hover:shadow-amber-500/25'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-amber-500/25'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Ir al Calendario</span>
          </div>
        </button>
      </div>

      {/* Progress indicator */}
      <div className={`mt-4 p-2 rounded-lg ${
        isDark ? 'bg-amber-800/30' : 'bg-amber-100'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>
            Pendientes de procesar
          </span>
          <span className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
            {pendingCount}
          </span>
        </div>
        <div className={`mt-2 w-full h-2 rounded-full ${
          isDark ? 'bg-amber-700' : 'bg-amber-200'
        }`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isDark ? 'bg-amber-500' : 'bg-amber-600'
            }`}
            style={{ width: pendingCount > 0 ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}

export default PendingMovementCard