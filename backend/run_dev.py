#!/usr/bin/env python3
"""
Script para ejecutar el servidor de desarrollo
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🚀 Iniciando servidor de desarrollo FastAPI...")
    print("📖 Documentación: http://localhost:8000/docs")
    print("🔄 Auto-reload: Activado")
    print("🛑 Para detener: Ctrl+C")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )