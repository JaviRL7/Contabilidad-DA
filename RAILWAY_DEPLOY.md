# Deploy en Railway

## Instrucciones para desplegar la aplicación de contabilidad en Railway

### 1. Preparación del proyecto
✅ Autenticación implementada con credenciales:
- Usuario: `DoñaAraña76sanjuan`
- Contraseña: `ja6ju4ma28monstruito`

✅ Frontend construido con optimizaciones de producción
✅ Backend con FastAPI configurado para servir archivos estáticos
✅ Health check endpoint disponible en `/health`

### 2. Archivos de configuración incluidos:
- `Procfile`: Comando para ejecutar la aplicación
- `railway.toml`: Configuración específica de Railway
- `.env.production`: Variables de entorno de producción
- `requirements.txt`: Dependencias de Python generadas

### 3. Estructura del proyecto:
```
contabilidad-web/
├── backend/
│   ├── app/
│   │   ├── main.py (servidor principal con static files)
│   │   ├── routers/
│   │   │   └── auth.py (autenticación JWT)
│   │   └── models/
│   └── requirements.txt
├── frontend/
│   ├── dist/ (archivos construidos)
│   └── package.json
├── Procfile
├── railway.toml
└── .env.production
```

### 4. Comandos de Railway:
1. Instalar Railway CLI: `npm install -g @railway/cli`
2. Iniciar sesión: `railway login`
3. Inicializar proyecto: `railway init`
4. Desplegar: `railway up`

### 5. Variables de entorno a configurar en Railway:
- `PORT`: 8000 (Railway lo configura automáticamente)
- `ENVIRONMENT`: production
- `CORS_ORIGINS`: https://tu-dominio.railway.app
- `DATABASE_URL`: sqlite:///./contabilidad_production.db

### 6. Características implementadas:
- ✅ Sistema de autenticación JWT
- ✅ Base de datos SQLite integrada
- ✅ Servicio de archivos estáticos para el frontend
- ✅ Health check para Railway
- ✅ Middleware de autenticación para todas las rutas
- ✅ CORS configurado para producción
- ✅ Compresión GZIP habilitada

### 7. URL de acceso:
Una vez desplegado, la aplicación estará disponible en:
`https://[tu-proyecto].railway.app`

El login requerirá las credenciales mencionadas arriba para acceder a la aplicación.