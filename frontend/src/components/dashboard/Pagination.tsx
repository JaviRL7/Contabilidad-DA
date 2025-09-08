import React from 'react'
import Button from '../ui/Button'

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
  onGoToPage,
  isDark
}) => {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages = []
    const maxVisible = 5
    
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible)
    
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible)
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev}
        isDark={isDark}
      >
        ‹ Anterior
      </Button>
      
      {currentPage > 2 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGoToPage(0)}
            isDark={isDark}
          >
            1
          </Button>
          {currentPage > 3 && (
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>...</span>
          )}
        </>
      )}
      
      {getVisiblePages().map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onGoToPage(page)}
          isDark={isDark}
          className="min-w-[2rem]"
        >
          {page + 1}
        </Button>
      ))}
      
      {currentPage < totalPages - 3 && (
        <>
          {currentPage < totalPages - 4 && (
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>...</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGoToPage(totalPages - 1)}
            isDark={isDark}
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        isDark={isDark}
      >
        Siguiente ›
      </Button>
    </div>
  )
}

export default Pagination