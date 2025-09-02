#!/usr/bin/env python3
"""
Script para inicializar la base de datos
"""

from app.core.database import engine, Base
from app.models import models

def init_database():
    print("🔧 Creando tablas de la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos inicializada correctamente!")

if __name__ == "__main__":
    init_database()