import React from 'react'
import Card from '../ui/Card'
import { formatEuro } from '../../utils/formatters'

interface CategoryItem {
  name: string
  amount: number
}

interface CategoryRankingsProps {
  gastosCategories: CategoryItem[]
  ingresosCategories: CategoryItem[]
  isDark: boolean
  period?: string
}

const CategoryRankings: React.FC<CategoryRankingsProps> = ({
  gastosCategories,
  ingresosCategories,
  isDark,
  period
}) => {
  const CategoryList = ({ 
    title, 
    items, 
    type 
  }: { 
    title: string
    items: CategoryItem[]
    type: 'gasto' | 'ingreso' 
  }) => (
    <Card variant="default" isDark={isDark}>
      <div className="p-6">
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        {items.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sin {type}s{period ? ` en ${period}` : ''}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${type}-${item.name}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    type === 'ingreso'
                      ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'
                      : isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                </div>
                <span className={`font-semibold ${
                  type === 'ingreso' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatEuro(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CategoryList 
        title={`Principales Gastos${period ? ` - ${period}` : ''}`}
        items={gastosCategories}
        type="gasto"
      />
      <CategoryList 
        title={`Principales Ingresos${period ? ` - ${period}` : ''}`}
        items={ingresosCategories}
        type="ingreso"
      />
    </div>
  )
}

export default CategoryRankings