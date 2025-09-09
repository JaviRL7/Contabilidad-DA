# 🔐 Medidas de Seguridad Implementadas - Contabilidad Doña Araña

## 🚀 Para Deploy en Railway

### Credenciales de Acceso
- **Usuario**: `doñaaraña76sanjuan`
- **Contraseña**: `ja6ju4ma28montruito`

### Variables de Entorno para Railway
```bash
# En Railway Dashboard > Settings > Variables
VITE_API_URL=https://tu-backend-railway-url.railway.app
NODE_ENV=production
```

## 🛡️ Medidas de Seguridad Implementadas

### 1. Autenticación Local Segura
- ✅ Credenciales hardcodeadas (solo para este caso específico)
- ✅ Sanitización de inputs de usuario
- ✅ Sesiones con expiración automática (24 horas)
- ✅ Auto-logout por inactividad (30 minutos)

### 2. Protección contra Ataques de Fuerza Bruta
- ✅ Máximo 5 intentos fallidos de login
- ✅ Bloqueo temporal de 15 minutos tras exceder límite
- ✅ Registro y monitoreo de intentos de acceso

### 3. Gestión de Sesiones
- ✅ Tokens de sesión con timestamp
- ✅ Verificación automática de validez de sesión
- ✅ Limpieza automática de datos al logout

### 4. Headers de Seguridad
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` 
- ✅ `X-XSS-Protection: 1; mode=block`

### 5. Validación y Sanitización
- ✅ Sanitización de todos los inputs
- ✅ Limitación de longitud de campos (100 caracteres max)
- ✅ Filtrado de caracteres potencialmente peligrosos

## 📋 Instrucciones de Deploy

### Paso 1: Preparar el Backend
1. Subir carpeta `backend/` a Railway como servicio Python
2. Configurar variables de entorno del backend
3. Obtener la URL del backend deployado

### Paso 2: Configurar Frontend
1. Actualizar `VITE_API_URL` con la URL del backend
2. Subir carpeta `frontend/` como servicio Node.js
3. Railway detectará automáticamente el build de Vite

### Paso 3: Configurar Base de Datos
1. Railway provee PostgreSQL gratuito
2. Configurar las credenciales en el backend
3. Ejecutar migraciones si es necesario

## 🔒 Medidas Adicionales Recomendadas

### Para Mayor Seguridad (Opcional)
1. **Backup Automático**: Railway hace backups de DB automáticamente
2. **Monitoreo**: Railway provee logs automáticos
3. **SSL/HTTPS**: Railway provee certificados SSL automáticamente
4. **Rate Limiting**: Implementado a nivel de aplicación

### Variables de Entorno de Seguridad
```bash
# Backend
DATABASE_URL=postgresql://... # Railway lo provee automáticamente
JWT_SECRET=tu-secreto-random-largo-aqui
CORS_ORIGINS=https://tu-frontend-railway-url.railway.app

# Frontend  
VITE_API_URL=https://tu-backend-railway-url.railway.app
```

## 🚨 Importante para Doña Araña

### Acceso Simple
1. Ir a la URL de Railway: `https://tu-app.railway.app`
2. Introducir usuario: `doñaaraña76sanjuan`
3. Introducir contraseña: `ja6ju4ma28montruito`
4. ¡Listo para usar!

### Si Olvida la Contraseña
- No hay recuperación de contraseña por simplicidad
- Contactar al desarrollador para reset manual
- Las credenciales están guardadas en este archivo

### Funcionalidades de Seguridad Transparentes
- **Auto-logout**: Si no usa la app por 30 minutos, se desconectará automáticamente
- **Sesión diaria**: Cada 24 horas debe volver a hacer login
- **Protección contra robots**: Tras 5 intentos fallidos, se bloquea 15 minutos

## 📱 Compatibilidad
- ✅ Funciona en todos los navegadores modernos
- ✅ Responsive para móvil y tablet  
- ✅ Modo oscuro/claro integrado
- ✅ Funciona offline después de la primera carga

---

**Nota**: Este sistema está diseñado para ser simple y seguro para uso personal/familiar. Para uso empresarial se recomendarían medidas adicionales como 2FA, base de usuarios múltiple, etc.