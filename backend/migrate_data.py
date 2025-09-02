#!/usr/bin/env python3
"""
Script de migración de SQLite a PostgreSQL
Migra todos los datos de la aplicación antigua a la nueva estructura
"""

import sys
import sqlite3
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Agregar el directorio de la app al path
sys.path.append(str(Path(__file__).parent))

from app.models.models import Base, MovimientoDiario, Ingreso, Gasto, Etiqueta
from app.core.database import DATABASE_URL

def migrate_from_sqlite(sqlite_path: str):
    """Migrar datos desde SQLite a PostgreSQL"""
    
    print("🔄 Iniciando migración de SQLite a PostgreSQL...")
    
    # Conectar a SQLite (origen)
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row  # Para acceder por nombre de columna
    
    # Conectar a PostgreSQL (destino)
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Migrar etiquetas
        print("📋 Migrando etiquetas...")
        migrate_etiquetas(sqlite_conn, db)
        
        # 2. Migrar movimientos diarios
        print("📅 Migrando movimientos diarios...")
        migrate_movimientos_diarios(sqlite_conn, db)
        
        # 3. Migrar gastos individuales
        print("💸 Migrando gastos...")
        migrate_gastos(sqlite_conn, db)
        
        # 4. Migrar ingresos (si existen en SQLite)
        print("💰 Migrando ingresos...")
        migrate_ingresos(sqlite_conn, db)
        
        print("✅ Migración completada exitosamente!")
        
        # Mostrar estadísticas
        show_migration_stats(db)
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        db.rollback()
        raise
    finally:
        sqlite_conn.close()
        db.close()

def migrate_etiquetas(sqlite_conn, db):
    """Migrar etiquetas desde SQLite"""
    cursor = sqlite_conn.cursor()
    
    # Verificar si la tabla etiquetas existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='etiquetas'")
    if cursor.fetchone():
        cursor.execute("SELECT nombre, es_predefinida FROM etiquetas")
        etiquetas_sqlite = cursor.fetchall()
        
        for row in etiquetas_sqlite:
            # Verificar si ya existe
            existing = db.query(Etiqueta).filter(Etiqueta.nombre == row['nombre']).first()
            if not existing:
                etiqueta = Etiqueta(
                    nombre=row['nombre'],
                    es_predefinida=bool(row['es_predefinida'])
                )
                db.add(etiqueta)
        
        db.commit()
        print(f"   ✓ Migradas {len(etiquetas_sqlite)} etiquetas")
    else:
        # Crear etiquetas por defecto si no existen
        print("   ℹ️  Tabla etiquetas no encontrada, creando etiquetas por defecto...")
        create_default_etiquetas(db)

def migrate_movimientos_diarios(sqlite_conn, db):
    """Migrar movimientos diarios desde SQLite"""
    cursor = sqlite_conn.cursor()
    cursor.execute("""
        SELECT fecha, ingreso_total, created_at, updated_at 
        FROM movimientos_diarios 
        ORDER BY fecha
    """)
    
    movimientos_sqlite = cursor.fetchall()
    
    for row in movimientos_sqlite:
        fecha = datetime.strptime(row['fecha'], '%Y-%m-%d').date()
        
        # Verificar si ya existe
        existing = db.query(MovimientoDiario).filter(MovimientoDiario.fecha == fecha).first()
        if not existing:
            movimiento = MovimientoDiario(
                fecha=fecha,
                ingreso_total=row['ingreso_total'] or 0.0,
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now(),
                updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else datetime.now()
            )
            db.add(movimiento)
    
    db.commit()
    print(f"   ✓ Migrados {len(movimientos_sqlite)} movimientos diarios")

def migrate_gastos(sqlite_conn, db):
    """Migrar gastos desde SQLite"""
    cursor = sqlite_conn.cursor()
    cursor.execute("""
        SELECT fecha, monto, etiqueta, created_at 
        FROM gastos 
        ORDER BY fecha, id
    """)
    
    gastos_sqlite = cursor.fetchall()
    
    for row in gastos_sqlite:
        fecha = datetime.strptime(row['fecha'], '%Y-%m-%d').date()
        
        gasto = Gasto(
            fecha=fecha,
            monto=row['monto'],
            etiqueta=row['etiqueta'],
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now()
        )
        db.add(gasto)
    
    db.commit()
    print(f"   ✓ Migrados {len(gastos_sqlite)} gastos")

def migrate_ingresos(sqlite_conn, db):
    """Migrar ingresos desde SQLite (si la tabla existe)"""
    cursor = sqlite_conn.cursor()
    
    # Verificar si la tabla ingresos existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ingresos'")
    if cursor.fetchone():
        cursor.execute("""
            SELECT fecha, monto, etiqueta, created_at 
            FROM ingresos 
            ORDER BY fecha, id
        """)
        
        ingresos_sqlite = cursor.fetchall()
        
        for row in ingresos_sqlite:
            fecha = datetime.strptime(row['fecha'], '%Y-%m-%d').date()
            
            ingreso = Ingreso(
                fecha=fecha,
                monto=row['monto'],
                etiqueta=row['etiqueta'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now()
            )
            db.add(ingreso)
        
        db.commit()
        print(f"   ✓ Migrados {len(ingresos_sqlite)} ingresos")
    else:
        print("   ℹ️  Tabla ingresos no encontrada en SQLite")
        
        # Crear ingresos basados en ingreso_total de movimientos_diarios
        print("   🔄 Convirtiendo ingresos totales a ingresos individuales...")
        cursor.execute("""
            SELECT fecha, ingreso_total 
            FROM movimientos_diarios 
            WHERE ingreso_total > 0
        """)
        
        movimientos_con_ingresos = cursor.fetchall()
        
        for row in movimientos_con_ingresos:
            fecha = datetime.strptime(row['fecha'], '%Y-%m-%d').date()
            
            if row['ingreso_total'] > 0:
                ingreso = Ingreso(
                    fecha=fecha,
                    monto=row['ingreso_total'],
                    etiqueta="Ingreso General",  # Etiqueta por defecto para migración
                    created_at=datetime.now()
                )
                db.add(ingreso)
        
        db.commit()
        print(f"   ✓ Convertidos {len(movimientos_con_ingresos)} ingresos totales")

def create_default_etiquetas(db):
    """Crear etiquetas por defecto"""
    etiquetas_gastos = ['Luz', 'Agua', 'Comida', 'Transporte', 'Internet', 'Teléfono', 'Alquiler', 'Otros']
    etiquetas_ingresos = ['Sueldo', 'Freelance', 'Ventas', 'Inversiones', 'Regalo', 'Otros']
    
    todas_etiquetas = etiquetas_gastos + etiquetas_ingresos
    
    for nombre in todas_etiquetas:
        etiqueta = Etiqueta(nombre=nombre, es_predefinida=True)
        db.add(etiqueta)
    
    db.commit()

def show_migration_stats(db):
    """Mostrar estadísticas de la migración"""
    print("\n📊 Estadísticas de migración:")
    print("=" * 40)
    
    movimientos_count = db.query(MovimientoDiario).count()
    print(f"📅 Movimientos diarios: {movimientos_count}")
    
    ingresos_count = db.query(Ingreso).count()
    print(f"💰 Ingresos: {ingresos_count}")
    
    gastos_count = db.query(Gasto).count()
    print(f"💸 Gastos: {gastos_count}")
    
    etiquetas_count = db.query(Etiqueta).count()
    print(f"📋 Etiquetas: {etiquetas_count}")
    
    print("=" * 40)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python migrate_data.py <path_to_sqlite_db>")
        print("Ejemplo: python migrate_data.py ../data/contabilidad.db")
        sys.exit(1)
    
    sqlite_path = sys.argv[1]
    
    if not Path(sqlite_path).exists():
        print(f"❌ Archivo SQLite no encontrado: {sqlite_path}")
        sys.exit(1)
    
    print(f"🗃️  SQLite origen: {sqlite_path}")
    print(f"🐘 PostgreSQL destino: {DATABASE_URL}")
    
    migrate_from_sqlite(sqlite_path)