#!/usr/bin/env python3
"""
Script para migrar de SQLite a PostgreSQL en Railway
Este script se ejecutará automáticamente en Railway si detecta que necesita inicializar la base de datos
"""

import os
import sys
from app.core.database import engine, Base
from app.models import models

def migrate_to_postgresql():
    """Inicializar base de datos PostgreSQL en Railway"""
    try:
        print("🔧 Inicializando base de datos PostgreSQL...")
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        
        print("✅ Base de datos PostgreSQL inicializada correctamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error al inicializar PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    success = migrate_to_postgresql()
    sys.exit(0 if success else 1)