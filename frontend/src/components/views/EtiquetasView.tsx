import React, { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface EtiquetasViewProps {
  etiquetas: {ingresos: string[], gastos: string[]}
  isDark: boolean
  onCreateEtiqueta?: () => void
  onEditEtiqueta?: (etiqueta: string) => void  
  onDeleteEtiqueta?: (etiqueta: string) => void
}

const EtiquetasView: React.FC<EtiquetasViewProps> = ({
  etiquetas,
  isDark,
  onCreateEtiqueta,
  onEditEtiqueta,
  onDeleteEtiqueta
}) => {
  // Combinar todas las etiquetas y eliminar duplicados
  const todasLasEtiquetas = [...new Set([...etiquetas.ingresos, ...etiquetas.gastos])].sort()
  
  // Separar por tipo
  const etiquetasIngresos = etiquetas.ingresos.sort()
  const etiquetasGastos = etiquetas.gastos.sort()

  const handleVer = (etiqueta: string) => {
    // Por ahora solo mostrar alert, se puede expandir después
    alert(`Ver detalles de la etiqueta: ${etiqueta}`)
  }

  const handleEditar = (etiqueta: string) => {
    if (onEditEtiqueta) {
      onEditEtiqueta(etiqueta)
    } else {
      alert(`Editar etiqueta: ${etiqueta}`)
    }
  }

  const handleBorrar = (etiqueta: string) => {
    if (confirm(`¿Estás seguro de que quieres borrar la etiqueta "${etiqueta}"?`)) {
      if (onDeleteEtiqueta) {
        onDeleteEtiqueta(etiqueta)
      } else {
        alert(`Borrar etiqueta: ${etiqueta}`)
      }
    }
  }

  const EtiquetaItem = ({ etiqueta, tipo }: { etiqueta: string, tipo: string }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
    }`}>
      <div className="flex-1">
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {etiqueta}
        </span>
        <span className={`ml-2 text-xs px-2 py-1 rounded ${
          tipo === 'ingreso' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {tipo}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleVer(etiqueta)}
          isDark={isDark}
        >
          Ver
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleEditar(etiqueta)}
          isDark={isDark}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleBorrar(etiqueta)}
          isDark={isDark}
        >
          Borrar
        </Button>
      </div>
    </div>
  )

  return (
    <Card isDark={isDark}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Gestión de Etiquetas
        </h2>
        <Button 
          variant="primary" 
          onClick={onCreateEtiqueta || (() => alert('Crear nueva etiqueta'))}
          isDark={isDark}
        >
          + Nueva Etiqueta
        </Button>
      </div>

      {/* Etiquetas de Ingresos */}
      <div className="mb-8">
        <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
          Etiquetas de Ingresos ({etiquetasIngresos.length})
        </h3>
        
        {etiquetasIngresos.length === 0 ? (
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No hay etiquetas de ingresos disponibles.
          </p>
        ) : (
          <div className="grid gap-3">
            {etiquetasIngresos.map((etiqueta) => (
              <EtiquetaItem key={`ingreso-${etiqueta}`} etiqueta={etiqueta} tipo="ingreso" />
            ))}
          </div>
        )}
      </div>

      {/* Etiquetas de Gastos */}
      <div>
        <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Etiquetas de Gastos ({etiquetasGastos.length})
        </h3>
        
        {etiquetasGastos.length === 0 ? (
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No hay etiquetas de gastos disponibles.
          </p>
        ) : (
          <div className="grid gap-3">
            {etiquetasGastos.map((etiqueta) => (
              <EtiquetaItem key={`gasto-${etiqueta}`} etiqueta={etiqueta} tipo="gasto" />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default EtiquetasView