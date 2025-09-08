import { useState, useMemo } from 'react'

interface UsePaginationProps<T> {
  data: T[]
  itemsPerPage: number
  maxPages?: number
}

export const usePagination = <T>({ data, itemsPerPage, maxPages = Infinity }: UsePaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0)

  const paginatedData = useMemo(() => {
    const maxMovimientos = itemsPerPage * maxPages
    const limitedData = data.slice(0, maxMovimientos)
    
    const totalPages = Math.ceil(limitedData.length / itemsPerPage)
    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentData = limitedData.slice(startIndex, endIndex)

    return {
      currentData,
      totalPages,
      hasNext: currentPage < totalPages - 1,
      hasPrev: currentPage > 0
    }
  }, [data, currentPage, itemsPerPage, maxPages])

  const goToPage = (page: number) => {
    if (page >= 0 && page < paginatedData.totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const reset = () => setCurrentPage(0)

  return {
    ...paginatedData,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    reset
  }
}