from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import List, Optional
from datetime import date, timedelta

from app.models.models import MovimientoDiario, Ingreso, Gasto, Etiqueta
from app.models.schemas import MovimientoDiarioCreate, IngresoCreate, GastoCreate

def get_movimiento_by_fecha(db: Session, fecha: date) -> Optional[MovimientoDiario]:
    """Obtener movimiento por fecha específica"""
    return db.query(MovimientoDiario).filter(MovimientoDiario.fecha == fecha).first()

def get_movimientos_recientes(db: Session, fecha_base: date, limit: int = 7) -> List[MovimientoDiario]:
    """Obtener movimientos recientes desde una fecha base"""
    fecha_inicio = fecha_base - timedelta(days=limit-1)
    return (
        db.query(MovimientoDiario)
        .filter(
            and_(
                MovimientoDiario.fecha >= fecha_inicio,
                MovimientoDiario.fecha <= fecha_base
            )
        )
        .order_by(MovimientoDiario.fecha.desc())
        .limit(limit)
        .all()
    )

def get_movimientos_mes(db: Session, año: int, mes: int) -> List[MovimientoDiario]:
    """Obtener todos los movimientos de un mes específico"""
    return (
        db.query(MovimientoDiario)
        .filter(
            and_(
                extract('year', MovimientoDiario.fecha) == año,
                extract('month', MovimientoDiario.fecha) == mes
            )
        )
        .order_by(MovimientoDiario.fecha)
        .all()
    )

def create_or_update_movimiento(
    db: Session, 
    movimiento_data: MovimientoDiarioCreate
) -> MovimientoDiario:
    """Crear o actualizar un movimiento completo"""
    
    # Buscar movimiento existente
    db_movimiento = get_movimiento_by_fecha(db, movimiento_data.fecha)
    
    if db_movimiento:
        # Eliminar ingresos y gastos existentes
        db.query(Ingreso).filter(Ingreso.fecha == movimiento_data.fecha).delete()
        db.query(Gasto).filter(Gasto.fecha == movimiento_data.fecha).delete()
    else:
        # Crear nuevo movimiento
        db_movimiento = MovimientoDiario(fecha=movimiento_data.fecha)
        db.add(db_movimiento)
    
    # Calcular total de ingresos
    total_ingresos = sum(ingreso.monto for ingreso in movimiento_data.ingresos)
    db_movimiento.ingreso_total = total_ingresos
    
    # Agregar ingresos
    for ingreso_data in movimiento_data.ingresos:
        db_ingreso = Ingreso(
            fecha=movimiento_data.fecha,
            monto=ingreso_data.monto,
            etiqueta=ingreso_data.etiqueta
        )
        db.add(db_ingreso)
        
        # Agregar etiqueta si no existe
        _ensure_etiqueta_exists(db, ingreso_data.etiqueta)
    
    # Agregar gastos
    for gasto_data in movimiento_data.gastos:
        db_gasto = Gasto(
            fecha=movimiento_data.fecha,
            monto=gasto_data.monto,
            etiqueta=gasto_data.etiqueta
        )
        db.add(db_gasto)
        
        # Agregar etiqueta si no existe
        _ensure_etiqueta_exists(db, gasto_data.etiqueta)
    
    db.commit()
    db.refresh(db_movimiento)
    
    # Cargar relaciones
    db_movimiento = (
        db.query(MovimientoDiario)
        .filter(MovimientoDiario.fecha == movimiento_data.fecha)
        .first()
    )
    
    return db_movimiento

def delete_movimiento(db: Session, fecha: date) -> bool:
    """Eliminar movimiento por fecha"""
    db_movimiento = get_movimiento_by_fecha(db, fecha)
    if db_movimiento:
        db.delete(db_movimiento)
        db.commit()
        return True
    return False

def buscar_por_etiqueta(
    db: Session, 
    etiqueta: str, 
    tipo: str = "gastos",
    limit: int = 50
) -> List[dict]:
    """Buscar movimientos por etiqueta"""
    
    if tipo == "gastos":
        query = (
            db.query(Gasto, MovimientoDiario.ingreso_total)
            .join(MovimientoDiario, Gasto.fecha == MovimientoDiario.fecha)
            .filter(Gasto.etiqueta.ilike(f"%{etiqueta}%"))
        )
    else:  # ingresos
        query = (
            db.query(Ingreso, MovimientoDiario.ingreso_total)
            .join(MovimientoDiario, Ingreso.fecha == MovimientoDiario.fecha)
            .filter(Ingreso.etiqueta.ilike(f"%{etiqueta}%"))
        )
    
    results = query.order_by(MovimientoDiario.fecha.desc()).limit(limit).all()
    
    return [
        {
            "fecha": item[0].fecha,
            "monto": item[0].monto,
            "etiqueta": item[0].etiqueta,
            "ingreso_dia": item[1],
            "tipo": tipo
        }
        for item in results
    ]

def get_etiquetas_frecuentes(
    db: Session, 
    año: int, 
    mes: int, 
    tipo: str = "gastos",
    limit: int = 10
) -> List[dict]:
    """Obtener etiquetas más frecuentes del mes"""
    
    if tipo == "gastos":
        query = (
            db.query(
                Gasto.etiqueta,
                func.sum(Gasto.monto).label('total'),
                func.count(Gasto.id).label('veces')
            )
            .filter(
                and_(
                    extract('year', Gasto.fecha) == año,
                    extract('month', Gasto.fecha) == mes
                )
            )
            .group_by(Gasto.etiqueta)
        )
    else:  # ingresos
        query = (
            db.query(
                Ingreso.etiqueta,
                func.sum(Ingreso.monto).label('total'),
                func.count(Ingreso.id).label('veces')
            )
            .filter(
                and_(
                    extract('year', Ingreso.fecha) == año,
                    extract('month', Ingreso.fecha) == mes
                )
            )
            .group_by(Ingreso.etiqueta)
        )
    
    results = query.order_by(func.sum(Gasto.monto if tipo == "gastos" else Ingreso.monto).desc()).limit(limit).all()
    
    return [
        {
            "etiqueta": item[0],
            "total": float(item[1]),
            "veces": item[2]
        }
        for item in results
    ]

def _ensure_etiqueta_exists(db: Session, nombre: str):
    """Asegurar que una etiqueta existe en la base de datos"""
    etiqueta = db.query(Etiqueta).filter(Etiqueta.nombre == nombre).first()
    if not etiqueta:
        etiqueta = Etiqueta(nombre=nombre, es_predefinida=False)
        db.add(etiqueta)

def get_all_etiquetas(db: Session) -> List[Etiqueta]:
    """Obtener todas las etiquetas ordenadas"""
    return (
        db.query(Etiqueta)
        .order_by(Etiqueta.es_predefinida.desc(), Etiqueta.nombre)
        .all()
    )

def init_default_etiquetas(db: Session):
    """Inicializar etiquetas por defecto"""
    etiquetas_gastos = ['Luz', 'Agua', 'Comida', 'Transporte', 'Internet', 'Teléfono', 'Alquiler', 'Otros']
    etiquetas_ingresos = ['Sueldo', 'Freelance', 'Ventas', 'Inversiones', 'Regalo', 'Otros']
    
    todas_etiquetas = etiquetas_gastos + etiquetas_ingresos
    
    for nombre in todas_etiquetas:
        etiqueta_existente = db.query(Etiqueta).filter(Etiqueta.nombre == nombre).first()
        if not etiqueta_existente:
            etiqueta = Etiqueta(nombre=nombre, es_predefinida=True)
            db.add(etiqueta)
    
    db.commit()