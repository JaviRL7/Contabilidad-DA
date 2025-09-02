from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

# Schemas para Ingreso
class IngresoBase(BaseModel):
    monto: float
    etiqueta: str

class IngresoCreate(IngresoBase):
    pass

class Ingreso(IngresoBase):
    id: int
    fecha: date
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schemas para Gasto
class GastoBase(BaseModel):
    monto: float
    etiqueta: str

class GastoCreate(GastoBase):
    pass

class Gasto(GastoBase):
    id: int
    fecha: date
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schemas para MovimientoDiario
class MovimientoDiarioBase(BaseModel):
    fecha: date

class MovimientoDiarioCreate(BaseModel):
    fecha: date
    ingresos: List[IngresoCreate] = []
    gastos: List[GastoCreate] = []

class MovimientoDiario(MovimientoDiarioBase):
    id: int
    ingreso_total: float
    ingresos: List[Ingreso] = []
    gastos: List[Gasto] = []
    total_gastos: float = 0.0
    balance: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schemas para respuestas
class MovimientoResumen(BaseModel):
    fecha: date
    ingreso_total: float
    total_gastos: float
    balance: float
    cantidad_ingresos: int
    cantidad_gastos: int

# Schema para etiquetas
class EtiquetaBase(BaseModel):
    nombre: str

class EtiquetaCreate(EtiquetaBase):
    es_predefinida: bool = False

class Etiqueta(EtiquetaBase):
    id: int
    es_predefinida: bool
    
    class Config:
        from_attributes = True