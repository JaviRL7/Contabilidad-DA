#!/usr/bin/env python3
"""
Script de inicio robusto para Railway
"""
import os
import sys
import subprocess

# Cambiar al directorio backend
os.chdir('/app/backend')

# Configurar PYTHONPATH
sys.path.insert(0, '/app/backend')
os.environ['PYTHONPATH'] = '/app/backend'

# Verificar que podemos importar la app
try:
    from app.main import app
    print("✅ FastAPI app importada correctamente")
except ImportError as e:
    print(f"❌ Error importando app: {e}")
    sys.exit(1)

# Ejecutar uvicorn
port = os.environ.get('PORT', '8000')
cmd = [
    'python3', '-m', 'uvicorn', 
    'app.main:app', 
    '--host', '0.0.0.0', 
    '--port', port
]

print(f"🚀 Iniciando servidor en puerto {port}")
subprocess.run(cmd)