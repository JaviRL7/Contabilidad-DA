from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from core.database import get_db
from models.schemas import (
    NotificacionCalendario,
    NotificacionCalendarioCreate,
    NotificacionCalendarioUpdate
)
from models.models import NotificacionCalendario as NotificacionCalendarioModel

router = APIRouter(prefix="/api/notificaciones", tags=["notificaciones"])

@router.post("", response_model=NotificacionCalendario)
async def crear_notificacion(
    notificacion: NotificacionCalendarioCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva notificación de calendario"""
    # Verificar si la fecha ya pasó
    esta_vencida = notificacion.fecha < date.today()
    
    db_notificacion = NotificacionCalendarioModel(
        fecha=notificacion.fecha,
        texto_descriptivo=notificacion.texto_descriptivo,
        etiqueta=notificacion.etiqueta,
        tipo=notificacion.tipo,
        esta_vencida=esta_vencida
    )
    
    db.add(db_notificacion)
    db.commit()
    db.refresh(db_notificacion)
    
    return db_notificacion

@router.get("", response_model=List[NotificacionCalendario])
async def obtener_notificaciones(
    pendientes_solo: bool = Query(default=False, description="Solo notificaciones pendientes (no canceladas ni convertidas)"),
    vencidas_solo: bool = Query(default=False, description="Solo notificaciones vencidas"),
    futuras: bool = Query(default=False, description="Solo notificaciones futuras"),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtener notificaciones con filtros opcionales"""
    query = db.query(NotificacionCalendarioModel)
    
    if pendientes_solo:
        query = query.filter(
            NotificacionCalendarioModel.fue_cancelada == False,
            NotificacionCalendarioModel.fue_convertida_movimiento == False
        )
    
    if vencidas_solo:
        query = query.filter(NotificacionCalendarioModel.esta_vencida == True)
    
    if futuras:
        query = query.filter(NotificacionCalendarioModel.fecha > date.today())
    
    notificaciones = query.order_by(NotificacionCalendarioModel.fecha.asc()).limit(limit).all()
    
    return notificaciones

@router.get("/pendientes", response_model=List[NotificacionCalendario])
async def obtener_notificaciones_pendientes(
    db: Session = Depends(get_db)
):
    """Obtener notificaciones pendientes (vencidas y no procesadas)"""
    notificaciones = (
        db.query(NotificacionCalendarioModel)
        .filter(
            NotificacionCalendarioModel.esta_vencida == True,
            NotificacionCalendarioModel.fue_cancelada == False,
            NotificacionCalendarioModel.fue_convertida_movimiento == False
        )
        .order_by(NotificacionCalendarioModel.fecha.asc())
        .all()
    )
    
    return notificaciones

@router.get("/calendario/{fecha}", response_model=List[NotificacionCalendario])
async def obtener_notificaciones_por_fecha(
    fecha: date,
    db: Session = Depends(get_db)
):
    """Obtener notificaciones para una fecha específica"""
    notificaciones = (
        db.query(NotificacionCalendarioModel)
        .filter(NotificacionCalendarioModel.fecha == fecha)
        .filter(NotificacionCalendarioModel.fue_cancelada == False)
        .all()
    )
    
    return notificaciones

@router.put("/{notificacion_id}", response_model=NotificacionCalendario)
async def actualizar_notificacion(
    notificacion_id: int,
    notificacion: NotificacionCalendarioUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una notificación existente"""
    db_notificacion = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.id == notificacion_id
    ).first()
    
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    # Actualizar campos si fueron proporcionados
    update_data = notificacion.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_notificacion, field, value)
    
    # Actualizar estado vencido si se cambió la fecha
    if notificacion.fecha:
        db_notificacion.esta_vencida = notificacion.fecha < date.today()
    
    db.commit()
    db.refresh(db_notificacion)
    
    return db_notificacion

@router.post("/{notificacion_id}/cancelar", response_model=NotificacionCalendario)
async def cancelar_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db)
):
    """Cancelar una notificación (marcarla como cancelada)"""
    db_notificacion = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.id == notificacion_id
    ).first()
    
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    db_notificacion.fue_cancelada = True
    db.commit()
    db.refresh(db_notificacion)
    
    return db_notificacion

@router.post("/{notificacion_id}/convertir", response_model=NotificacionCalendario)
async def convertir_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db)
):
    """Marcar una notificación como convertida a movimiento"""
    db_notificacion = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.id == notificacion_id
    ).first()
    
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    db_notificacion.fue_convertida_movimiento = True
    db.commit()
    db.refresh(db_notificacion)
    
    return db_notificacion

@router.delete("/{notificacion_id}")
async def eliminar_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar una notificación permanentemente"""
    db_notificacion = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.id == notificacion_id
    ).first()
    
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    db.delete(db_notificacion)
    db.commit()
    
    return {"message": "Notificación eliminada exitosamente"}

@router.put("/actualizar-vencidas")
async def actualizar_notificaciones_vencidas(
    db: Session = Depends(get_db)
):
    """Actualizar el estado 'esta_vencida' de todas las notificaciones"""
    hoy = date.today()
    
    # Marcar como vencidas las que ya pasaron su fecha
    notificaciones_vencidas = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.fecha < hoy,
        NotificacionCalendarioModel.esta_vencida == False
    ).all()
    
    for notificacion in notificaciones_vencidas:
        notificacion.esta_vencida = True
    
    # Desmarcar como vencidas las que son futuras (en caso de que se haya editado la fecha)
    notificaciones_futuras = db.query(NotificacionCalendarioModel).filter(
        NotificacionCalendarioModel.fecha >= hoy,
        NotificacionCalendarioModel.esta_vencida == True
    ).all()
    
    for notificacion in notificaciones_futuras:
        notificacion.esta_vencida = False
    
    db.commit()
    
    return {
        "message": f"Actualizadas {len(notificaciones_vencidas)} notificaciones vencidas y {len(notificaciones_futuras)} futuras"
    }