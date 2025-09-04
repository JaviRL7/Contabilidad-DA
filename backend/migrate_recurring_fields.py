#!/usr/bin/env python3
"""
Script para agregar campos de gastos recurrentes a la base de datos existente
"""

import sqlite3
from pathlib import Path

def add_recurring_fields():
    # Ruta al archivo de base de datos
    db_path = Path(__file__).parent / "contabilidad.db"
    
    if not db_path.exists():
        print(f"❌ No se encontró la base de datos en {db_path}")
        return
    
    print("🔧 Agregando campos para gastos recurrentes...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(gastos)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'es_recurrente' not in columns:
            cursor.execute("ALTER TABLE gastos ADD COLUMN es_recurrente BOOLEAN DEFAULT 0")
            print("✅ Campo 'es_recurrente' agregado")
        else:
            print("ℹ️ Campo 'es_recurrente' ya existe")
            
        if 'recurrente_id' not in columns:
            cursor.execute("ALTER TABLE gastos ADD COLUMN recurrente_id INTEGER")
            print("✅ Campo 'recurrente_id' agregado")
        else:
            print("ℹ️ Campo 'recurrente_id' ya existe")
        
        conn.commit()
        print("✅ Migración completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_recurring_fields()