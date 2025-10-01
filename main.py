from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from decouple import config

from core.database import engine, Base
from routers import movimientos, etiquetas, notificaciones, auth

# Crear tablas
Base.metadata.create_all(bind=engine)

# Configuración de la aplicación
app = FastAPI(
    title="Contabilidad Personal API",
    description="API REST para gestión de contabilidad personal",
    version="1.0.0"
)

# Middleware de compresión
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configuración CORS - Incluir HTTPS para producción
cors_origins = config("CORS_ORIGINS", default="http://localhost:5173,https://contabilidad-da-production.up.railway.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(movimientos.router)
app.include_router(etiquetas.router)
app.include_router(notificaciones.router)

@app.get("/")
async def root():
    return {
        "message": "Contabilidad Personal API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Para ejecutar con Railway
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)