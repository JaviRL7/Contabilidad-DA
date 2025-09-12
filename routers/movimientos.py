from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from core.database import get_db
from models.schemas import (
    MovimientoDiario, 
    MovimientoDiarioCreate, 
    MovimientoResumen,
    Etiqueta
)
from models.models import MovimientoDiario as MovimientoDiarioModel
from crud import crud_movimientos

router = APIRouter(prefix="/api/movimientos", tags=["movimientos"])

@router.get("/", response_model=List[MovimientoDiario])
async def get_movimientos_recientes(
    todos: bool = Query(default=False, description="Si es True, devuelve todos los movimientos sin restricción de fecha"),
    fecha_base: date = Query(default_factory=date.today),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtener movimientos recientes desde una fecha base o todos los movimientos"""
    if todos:
        # Obtener todos los movimientos ordenados por fecha descendente
        movimientos = (
            db.query(MovimientoDiarioModel)
            .order_by(MovimientoDiarioModel.fecha.desc())
            .limit(limit)
            .all()
        )
    else:
        movimientos = crud_movimientos.get_movimientos_recientes(db, fecha_base, limit)
    
    # Calcular campos calculados
    for mov in movimientos:
        mov.total_gastos = sum(gasto.monto for gasto in mov.gastos)
        mov.balance = mov.ingreso_total - mov.total_gastos
    
    return movimientos

@router.get("/{fecha}", response_model=Optional[MovimientoDiario])
async def get_movimiento_by_fecha(
    fecha: date,
    db: Session = Depends(get_db)
):
    """Obtener movimiento por fecha específica"""
    movimiento = crud_movimientos.get_movimiento_by_fecha(db, fecha)
    
    if movimiento:
        movimiento.total_gastos = sum(gasto.monto for gasto in movimiento.gastos)
        movimiento.balance = movimiento.ingreso_total - movimiento.total_gastos
    
    return movimiento

@router.post("/", response_model=MovimientoDiario)
async def create_or_update_movimiento(
    movimiento: MovimientoDiarioCreate,
    db: Session = Depends(get_db)
):
    """Crear o actualizar un movimiento completo"""
    try:
        db_movimiento = crud_movimientos.create_or_update_movimiento(db, movimiento)
        
        # Calcular campos calculados
        db_movimiento.total_gastos = sum(gasto.monto for gasto in db_movimiento.gastos)
        db_movimiento.balance = db_movimiento.ingreso_total - db_movimiento.total_gastos
        
        return db_movimiento
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear movimiento: {str(e)}")

@router.delete("/{fecha}")
async def delete_movimiento(
    fecha: date,
    db: Session = Depends(get_db)
):
    """Eliminar movimiento por fecha"""
    success = crud_movimientos.delete_movimiento(db, fecha)
    if not success:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return {"message": "Movimiento eliminado correctamente"}

@router.delete("/{fecha}/ingreso/{ingreso_id}")
async def delete_ingreso(
    fecha: date,
    ingreso_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar un ingreso específico"""
    success = crud_movimientos.delete_ingreso(db, ingreso_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado correctamente"}

@router.delete("/{fecha}/gasto/{gasto_id}")
async def delete_gasto(
    fecha: date,
    gasto_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar un gasto específico"""
    success = crud_movimientos.delete_gasto(db, gasto_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado correctamente"}

@router.get("/mes/{año}/{mes}", response_model=List[MovimientoResumen])
async def get_movimientos_mes(
    año: int,
    mes: int,
    db: Session = Depends(get_db)
):
    """Obtener resumen de movimientos del mes"""
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="Mes debe estar entre 1 y 12")
    
    movimientos = crud_movimientos.get_movimientos_mes(db, año, mes)
    
    resumen = []
    for mov in movimientos:
        total_gastos = sum(gasto.monto for gasto in mov.gastos)
        resumen.append(MovimientoResumen(
            fecha=mov.fecha,
            ingreso_total=mov.ingreso_total,
            total_gastos=total_gastos,
            balance=mov.ingreso_total - total_gastos,
            cantidad_ingresos=len(mov.ingresos),
            cantidad_gastos=len(mov.gastos)
        ))
    
    return resumen

@router.get("/buscar/etiqueta/{etiqueta}")
async def buscar_por_etiqueta(
    etiqueta: str,
    tipo: str = Query(default="gastos", regex="^(gastos|ingresos)$"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Buscar movimientos por etiqueta"""
    resultados = crud_movimientos.buscar_por_etiqueta(db, etiqueta, tipo, limit)
    return resultados

@router.get("/estadisticas/etiquetas/{año}/{mes}")
async def get_etiquetas_frecuentes(
    año: int,
    mes: int,
    tipo: str = Query(default="gastos", regex="^(gastos|ingresos)$"),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de etiquetas del mes"""
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="Mes debe estar entre 1 y 12")
    
    estadisticas = crud_movimientos.get_etiquetas_frecuentes(db, año, mes, tipo, limit)
    return estadisticas