#!/usr/bin/env python3
"""
Migración para agregar campo 'tipo' a la tabla etiquetas.
IMPORTANTE: Ejecutar ANTES de modificar el modelo en models.py

Este script:
1. Agrega el campo 'tipo' VARCHAR a la tabla etiquetas
2. Establece valores por defecto para etiquetas existentes (si las hay)
3. Crea índice en el campo tipo para optimizar consultas

Como no hay etiquetas existentes (count=0), esta migración es segura.
"""

import sqlite3
import os
from datetime import datetime

def migrate_add_tipo_etiqueta():
    """Migrar tabla etiquetas para agregar campo tipo"""
    db_path = 'contabilidad.db'
    
    if not os.path.exists(db_path):
        print("❌ No se encontró la base de datos contabilidad.db")
        return False
    
    print("🔄 Iniciando migración: agregar campo 'tipo' a tabla etiquetas...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(etiquetas)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'tipo' in columns:
            print("✅ El campo 'tipo' ya existe en la tabla etiquetas")
            conn.close()
            return True
        
        # Contar etiquetas existentes
        cursor.execute("SELECT COUNT(*) FROM etiquetas")
        count = cursor.fetchone()[0]
        print(f"📊 Etiquetas existentes en DB: {count}")
        
        # Agregar columna tipo
        cursor.execute("""
            ALTER TABLE etiquetas 
            ADD COLUMN tipo VARCHAR NOT NULL DEFAULT 'gasto'
        """)
        
        print("✅ Campo 'tipo' agregado exitosamente")
        
        # Si hubiera etiquetas existentes, actualizaríamos con lógica de negocio
        if count > 0:
            print("⚠️ Actualizando etiquetas existentes con tipo por defecto 'gasto'")
            # En futuro: implementar lógica para inferir tipo por nombre
            cursor.execute("UPDATE etiquetas SET tipo = 'gasto' WHERE tipo IS NULL")
            print(f"✅ {count} etiquetas actualizadas")
        
        # Crear índice para optimizar consultas por tipo
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_etiquetas_tipo 
            ON etiquetas(tipo)
        """)
        
        print("✅ Índice creado en campo 'tipo'")
        
        conn.commit()
        conn.close()
        
        print("🎉 Migración completada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error durante migración: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def rollback_migration():
    """Función para revertir la migración (eliminar campo tipo)"""
    print("🔄 ROLLBACK: Revirtiendo migración campo 'tipo'...")
    
    try:
        conn = sqlite3.connect('contabilidad.db')
        cursor = conn.cursor()
        
        # SQLite no soporta DROP COLUMN directamente, necesitamos recrear tabla
        print("⚠️ SQLite requiere recrear tabla para eliminar columna")
        
        # Respaldar datos
        cursor.execute("SELECT id, nombre, es_predefinida, es_esencial FROM etiquetas")
        backup_data = cursor.fetchall()
        
        # Eliminar tabla actual
        cursor.execute("DROP TABLE etiquetas")
        
        # Recrear tabla sin campo tipo
        cursor.execute("""
            CREATE TABLE etiquetas (
                id INTEGER NOT NULL, 
                nombre VARCHAR NOT NULL, 
                es_predefinida BOOLEAN, 
                es_esencial BOOLEAN, 
                PRIMARY KEY (id), 
                UNIQUE (nombre)
            )
        """)
        
        # Restaurar datos
        cursor.executemany("""
            INSERT INTO etiquetas (id, nombre, es_predefinida, es_esencial) 
            VALUES (?, ?, ?, ?)
        """, backup_data)
        
        conn.commit()
        conn.close()
        
        print(f"✅ Rollback completado: {len(backup_data)} etiquetas restauradas")
        return True
        
    except Exception as e:
        print(f"❌ Error durante rollback: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        migrate_add_tipo_etiqueta()