import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  onNext: () => void
  onPrev: () => void
  onGoToPage: (page: number) => void
  isDark: boolean
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onGoToPage: _onGoToPage,
  isDark
}) => {
  if (totalPages <= 1) return null

  const _getVisiblePages = () => {
    const pages = []
    const maxVisible = 5
    
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible)
    
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible)
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  return (
    <div className="flex items-center justify-center mt-4 gap-3">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          !hasPrev
            ? isDark
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className={`px-3 py-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {currentPage + 1} de {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          !hasNext
            ? isDark
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Pagination