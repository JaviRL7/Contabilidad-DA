from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.schemas import Etiqueta, EtiquetaCreate, EtiquetaUpdate
from models.models import Usuario
from crud import crud_movimientos
from routers.auth import get_current_user

router = APIRouter(prefix="/etiquetas", tags=["etiquetas"])

@router.get("", response_model=List[Etiqueta])
async def get_all_etiquetas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener todas las etiquetas disponibles"""
    return crud_movimientos.get_all_etiquetas(db, current_user.id)

@router.post("", response_model=Etiqueta)
async def create_etiqueta(
    etiqueta: EtiquetaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva etiqueta"""
    # Validar tipo
    if etiqueta.tipo not in ['gasto', 'ingreso']:
        raise HTTPException(status_code=400, detail="El tipo debe ser 'gasto' o 'ingreso'")

    # Verificar si ya existe
    existing = crud_movimientos.get_etiqueta_by_nombre(db, etiqueta.nombre, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una etiqueta con ese nombre")

    return crud_movimientos.create_etiqueta(db, etiqueta, current_user.id)

@router.post("/init")
async def init_default_etiquetas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Inicializar etiquetas por defecto"""
    crud_movimientos.init_default_etiquetas(db, current_user.id)
    return {"message": "Etiquetas por defecto inicializadas"}

@router.put("/{etiqueta_id}", response_model=Etiqueta)
async def update_etiqueta(
    etiqueta_id: int,
    etiqueta_update: EtiquetaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar una etiqueta (principalmente para marcar como esencial)"""
    etiqueta = crud_movimientos.update_etiqueta(db, etiqueta_id, etiqueta_update, current_user.id)
    if not etiqueta:
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    return etiqueta

@router.delete("/{etiqueta_id}")
async def delete_etiqueta(
    etiqueta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar una etiqueta"""
    success = crud_movimientos.delete_etiqueta(db, etiqueta_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    return {"message": "Etiqueta eliminada correctamente"}