from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.schemas import Etiqueta, EtiquetaCreate
from app.crud import crud_movimientos

router = APIRouter(prefix="/api/etiquetas", tags=["etiquetas"])

@router.get("/", response_model=List[Etiqueta])
async def get_all_etiquetas(db: Session = Depends(get_db)):
    """Obtener todas las etiquetas disponibles"""
    return crud_movimientos.get_all_etiquetas(db)

@router.post("/init")
async def init_default_etiquetas(db: Session = Depends(get_db)):
    """Inicializar etiquetas por defecto"""
    crud_movimientos.init_default_etiquetas(db)
    return {"message": "Etiquetas por defecto inicializadas"}