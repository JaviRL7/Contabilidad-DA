from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, timedelta

from models.models import MovimientoDiario, Ingreso, Gasto, Etiqueta
from models.schemas import MovimientoDiarioCreate, IngresoCreate, GastoCreate, EtiquetaUpdate, EtiquetaCreate

def get_movimiento_by_fecha(db: Session, fecha: date, user_id: int) -> Optional[MovimientoDiario]:
    """Obtener movimiento por fecha específica"""
    return db.query(MovimientoDiario).filter(
        MovimientoDiario.fecha == fecha,
        MovimientoDiario.user_id == user_id
    ).first()

def get_movimientos_recientes(db: Session, fecha_base: date, user_id: int, limit: int = 7) -> List[MovimientoDiario]:
    """Obtener los últimos N movimientos desde una fecha base"""
    return (
        db.query(MovimientoDiario)
        .filter(
            MovimientoDiario.fecha <= fecha_base,
            MovimientoDiario.user_id == user_id
        )
        .order_by(MovimientoDiario.fecha.desc())
        .limit(limit)
        .all()
    )

def get_movimientos_mes(db: Session, año: int, mes: int, user_id: int) -> List[MovimientoDiario]:
    """Obtener todos los movimientos de un mes específico"""
    return (
        db.query(MovimientoDiario)
        .filter(
            and_(
                extract('year', MovimientoDiario.fecha) == año,
                extract('month', MovimientoDiario.fecha) == mes,
                MovimientoDiario.user_id == user_id
            )
        )
        .order_by(MovimientoDiario.fecha)
        .all()
    )

def create_or_update_movimiento(
    db: Session,
    movimiento_data: MovimientoDiarioCreate,
    user_id: int
) -> MovimientoDiario:
    """Crear o actualizar un movimiento completo"""

    # Buscar movimiento existente
    db_movimiento = get_movimiento_by_fecha(db, movimiento_data.fecha, user_id)

    if db_movimiento:
        # Para movimiento existente, manejar updates inteligentemente
        # (No eliminar todo, sino actualizar/crear/eliminar según sea necesario)
        print(f"🔄 Actualizando movimiento existente para fecha: {movimiento_data.fecha}")
    else:
        # Crear nuevo movimiento
        db_movimiento = MovimientoDiario(fecha=movimiento_data.fecha, user_id=user_id)
        db.add(db_movimiento)
        try:
            # Flush para detectar violaciones de constraint antes de continuar
            db.flush()
            print(f"✨ Creando nuevo movimiento para fecha: {movimiento_data.fecha}")
        except IntegrityError:
            # Si hay un error de constraint (ej. otro proceso creó el movimiento)
            # hacemos rollback y buscamos el movimiento existente
            db.rollback()
            db_movimiento = get_movimiento_by_fecha(db, movimiento_data.fecha, user_id)
            if not db_movimiento:
                # Si aún no existe, re-lanzar el error original
                raise
            print(f"⚠️  Movimiento ya existía, usando el existente para fecha: {movimiento_data.fecha}")
    
    # Calcular total de ingresos
    total_ingresos = sum(ingreso.monto for ingreso in movimiento_data.ingresos)
    db_movimiento.ingreso_total = total_ingresos
    
    # Agregar ingresos (preservando IDs si existen)
    for ingreso_data in movimiento_data.ingresos:
        # Si el ingreso tiene ID, intentar actualizarlo en lugar de crear uno nuevo
        if hasattr(ingreso_data, 'id') and ingreso_data.id:
            db_ingreso = db.query(Ingreso).filter(
                Ingreso.id == ingreso_data.id,
                Ingreso.fecha == movimiento_data.fecha,
                Ingreso.user_id == user_id
            ).first()

            if db_ingreso:
                # Actualizar ingreso existente
                db_ingreso.monto = ingreso_data.monto
                db_ingreso.etiqueta = ingreso_data.etiqueta
            else:
                # El ID no existe, crear nuevo
                db_ingreso = Ingreso(
                    fecha=movimiento_data.fecha,
                    monto=ingreso_data.monto,
                    etiqueta=ingreso_data.etiqueta,
                    user_id=user_id
                )
                db.add(db_ingreso)
        else:
            # No hay ID, crear nuevo ingreso
            db_ingreso = Ingreso(
                fecha=movimiento_data.fecha,
                monto=ingreso_data.monto,
                etiqueta=ingreso_data.etiqueta,
                user_id=user_id
            )
            db.add(db_ingreso)

        # Agregar etiqueta si no existe
        _ensure_etiqueta_exists(db, ingreso_data.etiqueta, 'ingreso', user_id)
    
    # Agregar gastos (preservando IDs si existen)
    for gasto_data in movimiento_data.gastos:
        # Si el gasto tiene ID, intentar actualizarlo en lugar de crear uno nuevo
        if hasattr(gasto_data, 'id') and gasto_data.id:
            db_gasto = db.query(Gasto).filter(
                Gasto.id == gasto_data.id,
                Gasto.fecha == movimiento_data.fecha,
                Gasto.user_id == user_id
            ).first()

            if db_gasto:
                # Actualizar gasto existente
                db_gasto.monto = gasto_data.monto
                db_gasto.etiqueta = gasto_data.etiqueta
                db_gasto.es_recurrente = getattr(gasto_data, 'es_recurrente', False)
                db_gasto.recurrente_id = getattr(gasto_data, 'recurrente_id', None)
            else:
                # El ID no existe, crear nuevo
                db_gasto = Gasto(
                    fecha=movimiento_data.fecha,
                    monto=gasto_data.monto,
                    etiqueta=gasto_data.etiqueta,
                    es_recurrente=getattr(gasto_data, 'es_recurrente', False),
                    recurrente_id=getattr(gasto_data, 'recurrente_id', None),
                    user_id=user_id
                )
                db.add(db_gasto)
        else:
            # No hay ID, crear nuevo gasto
            db_gasto = Gasto(
                fecha=movimiento_data.fecha,
                monto=gasto_data.monto,
                etiqueta=gasto_data.etiqueta,
                es_recurrente=getattr(gasto_data, 'es_recurrente', False),
                recurrente_id=getattr(gasto_data, 'recurrente_id', None),
                user_id=user_id
            )
            db.add(db_gasto)

        # Agregar etiqueta si no existe
        _ensure_etiqueta_exists(db, gasto_data.etiqueta, 'gasto', user_id)
    
    # Eliminar ingresos/gastos que ya no están en el payload (fueron eliminados por el usuario)
    if db_movimiento.id:  # Solo para movimientos existentes
        # IDs de ingresos que deben mantenerse
        ingresos_ids_to_keep = [ing.id for ing in movimiento_data.ingresos if hasattr(ing, 'id') and ing.id]
        if ingresos_ids_to_keep:
            db.query(Ingreso).filter(
                Ingreso.fecha == movimiento_data.fecha,
                Ingreso.user_id == user_id,
                Ingreso.id.notin_(ingresos_ids_to_keep)
            ).delete(synchronize_session=False)

        # IDs de gastos que deben mantenerse
        gastos_ids_to_keep = [gas.id for gas in movimiento_data.gastos if hasattr(gas, 'id') and gas.id]
        if gastos_ids_to_keep:
            db.query(Gasto).filter(
                Gasto.fecha == movimiento_data.fecha,
                Gasto.user_id == user_id,
                Gasto.id.notin_(gastos_ids_to_keep)
            ).delete(synchronize_session=False)

    db.commit()
    db.refresh(db_movimiento)

    # Cargar relaciones
    db_movimiento = (
        db.query(MovimientoDiario)
        .filter(
            MovimientoDiario.fecha == movimiento_data.fecha,
            MovimientoDiario.user_id == user_id
        )
        .first()
    )

    return db_movimiento

def delete_movimiento(db: Session, fecha: date, user_id: int) -> bool:
    """Eliminar movimiento por fecha"""
    db_movimiento = get_movimiento_by_fecha(db, fecha, user_id)
    if db_movimiento:
        db.delete(db_movimiento)
        db.commit()
        return True
    return False

def buscar_por_etiqueta(
    db: Session,
    etiqueta: str,
    user_id: int,
    tipo: str = "gastos",
    limit: int = 50
) -> List[dict]:
    """Buscar movimientos por etiqueta"""

    if tipo == "gastos":
        query = (
            db.query(Gasto, MovimientoDiario.ingreso_total)
            .join(MovimientoDiario, Gasto.fecha == MovimientoDiario.fecha)
            .filter(
                Gasto.etiqueta.ilike(f"%{etiqueta}%"),
                Gasto.user_id == user_id
            )
        )
    else:  # ingresos
        query = (
            db.query(Ingreso, MovimientoDiario.ingreso_total)
            .join(MovimientoDiario, Ingreso.fecha == MovimientoDiario.fecha)
            .filter(
                Ingreso.etiqueta.ilike(f"%{etiqueta}%"),
                Ingreso.user_id == user_id
            )
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
    user_id: int,
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
                    extract('month', Gasto.fecha) == mes,
                    Gasto.user_id == user_id
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
                    extract('month', Ingreso.fecha) == mes,
                    Ingreso.user_id == user_id
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

def _ensure_etiqueta_exists(db: Session, nombre: str, tipo: str = 'gasto', user_id: int = None):
    """Asegurar que una etiqueta existe en la base de datos"""
    if user_id is None:
        return  # No crear etiquetas sin usuario

    etiqueta = db.query(Etiqueta).filter(
        Etiqueta.nombre == nombre,
        Etiqueta.user_id == user_id
    ).first()
    if not etiqueta:
        etiqueta = Etiqueta(nombre=nombre, tipo=tipo, es_predefinida=False, user_id=user_id)
        db.add(etiqueta)

def get_all_etiquetas(db: Session, user_id: int) -> List[Etiqueta]:
    """Obtener todas las etiquetas ordenadas"""
    return (
        db.query(Etiqueta)
        .filter(Etiqueta.user_id == user_id)
        .order_by(Etiqueta.es_predefinida.desc(), Etiqueta.nombre)
        .all()
    )

def delete_ingreso(db: Session, ingreso_id: int, user_id: int) -> bool:
    """Eliminar un ingreso específico"""
    ingreso = db.query(Ingreso).filter(
        Ingreso.id == ingreso_id,
        Ingreso.user_id == user_id
    ).first()
    if not ingreso:
        return False

    fecha = ingreso.fecha
    db.delete(ingreso)
    db.flush()  # Aplicar cambios sin hacer commit todavía

    # Recalcular totales del movimiento
    _recalcular_y_limpiar_movimiento(db, fecha, user_id)
    db.commit()
    return True

def delete_gasto(db: Session, gasto_id: int, user_id: int) -> bool:
    """Eliminar un gasto específico"""
    gasto = db.query(Gasto).filter(
        Gasto.id == gasto_id,
        Gasto.user_id == user_id
    ).first()
    if not gasto:
        return False

    fecha = gasto.fecha
    db.delete(gasto)
    db.flush()  # Aplicar cambios sin hacer commit todavía

    # Limpiar movimiento si queda vacío
    _recalcular_y_limpiar_movimiento(db, fecha, user_id)
    db.commit()
    return True

def _recalcular_y_limpiar_movimiento(db: Session, fecha: date, user_id: int):
    """Función interna para recalcular totales y limpiar movimientos vacíos"""
    movimiento = get_movimiento_by_fecha(db, fecha, user_id)
    if not movimiento:
        return

    # Contar ingresos y gastos restantes
    count_ingresos = db.query(Ingreso).filter(
        Ingreso.fecha == fecha,
        Ingreso.user_id == user_id
    ).count()
    count_gastos = db.query(Gasto).filter(
        Gasto.fecha == fecha,
        Gasto.user_id == user_id
    ).count()

    if count_ingresos == 0 and count_gastos == 0:
        # No quedan datos, eliminar el movimiento completo
        db.delete(movimiento)
    else:
        # Recalcular ingreso_total
        total_ingresos = db.query(func.sum(Ingreso.monto)).filter(
            Ingreso.fecha == fecha,
            Ingreso.user_id == user_id
        ).scalar()
        movimiento.ingreso_total = float(total_ingresos or 0)

def recalcular_totales_movimiento(db: Session, fecha: date, user_id: int):
    """Recalcular el ingreso_total de un movimiento (función pública)"""
    _recalcular_y_limpiar_movimiento(db, fecha, user_id)
    db.commit()

def init_default_etiquetas(db: Session, user_id: int):
    """Inicializar etiquetas por defecto para un usuario"""
    etiquetas_gastos = ['Luz', 'Agua', 'Comida', 'Transporte', 'Internet', 'Teléfono', 'Alquiler', 'Otros']
    etiquetas_ingresos = ['Sueldo', 'Freelance', 'Ventas', 'Inversiones', 'Regalo', 'Otros']

    # Crear etiquetas de gastos
    for nombre in etiquetas_gastos:
        etiqueta_existente = db.query(Etiqueta).filter(
            Etiqueta.nombre == nombre,
            Etiqueta.user_id == user_id
        ).first()
        if not etiqueta_existente:
            etiqueta = Etiqueta(nombre=nombre, tipo='gasto', es_predefinida=True, user_id=user_id)
            db.add(etiqueta)

    # Crear etiquetas de ingresos
    for nombre in etiquetas_ingresos:
        etiqueta_existente = db.query(Etiqueta).filter(
            Etiqueta.nombre == nombre,
            Etiqueta.user_id == user_id
        ).first()
        if not etiqueta_existente:
            etiqueta = Etiqueta(nombre=nombre, tipo='ingreso', es_predefinida=True, user_id=user_id)
            db.add(etiqueta)

    db.commit()

def update_etiqueta(db: Session, etiqueta_id: int, etiqueta_update: EtiquetaUpdate, user_id: int) -> Optional[Etiqueta]:
    """Actualizar una etiqueta"""
    etiqueta = db.query(Etiqueta).filter(
        Etiqueta.id == etiqueta_id,
        Etiqueta.user_id == user_id
    ).first()
    if not etiqueta:
        return None

    if etiqueta_update.nombre is not None:
        etiqueta.nombre = etiqueta_update.nombre
    if etiqueta_update.es_esencial is not None:
        etiqueta.es_esencial = etiqueta_update.es_esencial

    db.commit()
    db.refresh(etiqueta)
    return etiqueta

def get_etiqueta_by_id(db: Session, etiqueta_id: int, user_id: int) -> Optional[Etiqueta]:
    """Obtener etiqueta por ID"""
    return db.query(Etiqueta).filter(
        Etiqueta.id == etiqueta_id,
        Etiqueta.user_id == user_id
    ).first()

def get_etiqueta_by_nombre(db: Session, nombre: str, user_id: int) -> Optional[Etiqueta]:
    """Obtener etiqueta por nombre"""
    return db.query(Etiqueta).filter(
        Etiqueta.nombre == nombre,
        Etiqueta.user_id == user_id
    ).first()

def create_etiqueta(db: Session, etiqueta: EtiquetaCreate, user_id: int) -> Etiqueta:
    """Crear una nueva etiqueta"""
    db_etiqueta = Etiqueta(
        nombre=etiqueta.nombre,
        tipo=etiqueta.tipo,
        es_predefinida=etiqueta.es_predefinida,
        es_esencial=etiqueta.es_esencial,
        user_id=user_id
    )
    db.add(db_etiqueta)
    db.commit()
    db.refresh(db_etiqueta)
    return db_etiqueta

def delete_etiqueta(db: Session, etiqueta_id: int, user_id: int) -> bool:
    """Eliminar una etiqueta"""
    etiqueta = db.query(Etiqueta).filter(
        Etiqueta.id == etiqueta_id,
        Etiqueta.user_id == user_id
    ).first()
    if not etiqueta:
        return False

    db.delete(etiqueta)
    db.commit()
    return True