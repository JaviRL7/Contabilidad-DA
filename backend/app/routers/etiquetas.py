from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.schemas import Etiqueta, EtiquetaCreate, EtiquetaUpdate
from app.crud import crud_movimientos

router = APIRouter(prefix="/api/etiquetas", tags=["etiquetas"])

@router.get("/", response_model=List[Etiqueta])
async def get_all_etiquetas(db: Session = Depends(get_db)):
    """Obtener todas las etiquetas disponibles"""
    return crud_movimientos.get_all_etiquetas(db)

@router.post("/", response_model=Etiqueta)
async def create_etiqueta(
    etiqueta: EtiquetaCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva etiqueta"""
    # Validar tipo
    if etiqueta.tipo not in ['gasto', 'ingreso']:
        raise HTTPException(status_code=400, detail="El tipo debe ser 'gasto' o 'ingreso'")
    
    # Verificar si ya existe
    existing = crud_movimientos.get_etiqueta_by_nombre(db, etiqueta.nombre)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una etiqueta con ese nombre")
    
    return crud_movimientos.create_etiqueta(db, etiqueta)

@router.post("/init")
async def init_default_etiquetas(db: Session = Depends(get_db)):
    """Inicializar etiquetas por defecto"""
    crud_movimientos.init_default_etiquetas(db)
    return {"message": "Etiquetas por defecto inicializadas"}

@router.put("/{etiqueta_id}", response_model=Etiqueta)
async def update_etiqueta(
    etiqueta_id: int,
    etiqueta_update: EtiquetaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una etiqueta (principalmente para marcar como esencial)"""
    etiqueta = crud_movimientos.update_etiqueta(db, etiqueta_id, etiqueta_update)
    if not etiqueta:
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    return etiqueta