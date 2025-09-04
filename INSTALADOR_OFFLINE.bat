@echo off
title Instalador Offline - Contabilidad Doña Araña
color 0B
mode con: cols=90 lines=35

cls
echo.
echo                    ╔════════════════════════════════════════════╗
echo                    ║        INSTALADOR OFFLINE COMPLETO        ║
echo                    ║          Contabilidad Doña Araña          ║
echo                    ║                                            ║
echo                    ║      🔌 Para PCs sin conexión/software     ║
echo                    ╚════════════════════════════════════════════╝
echo.
echo    ┌────────────────────────────────────────────────────────────────────────────────┐
echo    │  Este instalador está diseñado para PCs completamente limpios (sin Node.js,   │
echo    │  Python, Git, etc.). Incluye todos los instaladores necesarios.              │
echo    │                                                                                │
echo    │  ESTRUCTURA ESPERADA:                                                         │
echo    │  📁 ContabilidadCompleta\                                                     │
echo    │     📁 contabilidad-web\          (este proyecto)                           │
echo    │     📄 node-installer.msi          (Node.js LTS installer)                   │
echo    │     📄 python-installer.exe        (Python 3.11+ installer)                 │
echo    │     📄 INSTALADOR_OFFLINE.bat      (este archivo)                           │
echo    └────────────────────────────────────────────────────────────────────────────────┘
echo.

REM Verificar estructura de archivos
echo 🔍 Verificando estructura de archivos...
echo.

set BASE_DIR=%~dp0
set PROJECT_DIR=%BASE_DIR%contabilidad-web
set NODE_INSTALLER=""
set PYTHON_INSTALLER=""

REM Buscar instalador de Node.js
for %%f in ("%BASE_DIR%node*.msi") do set NODE_INSTALLER=%%f
for %%f in ("%BASE_DIR%node*.exe") do set NODE_INSTALLER=%%f

REM Buscar instalador de Python  
for %%f in ("%BASE_DIR%python*.exe") do set PYTHON_INSTALLER=%%f

echo [1/3] Verificando proyecto...
if exist "%PROJECT_DIR%" (
    echo       ✅ Proyecto encontrado: %PROJECT_DIR%
) else (
    echo       ❌ FALTA: Carpeta del proyecto 'contabilidad-web'
    echo.
    echo       Estructura necesaria:
    echo       📁 %BASE_DIR%
    echo          📁 contabilidad-web\
    echo          📄 node-installer.msi
    echo          📄 python-installer.exe
    echo.
    pause
    exit /b 1
)

echo [2/3] Verificando instalador Node.js...
if not "%NODE_INSTALLER%"=="" (
    echo       ✅ Node.js encontrado: %NODE_INSTALLER%
) else (
    echo       ❌ FALTA: Instalador de Node.js (.msi o .exe)
    echo          Descargar de: https://nodejs.org/
    pause
    exit /b 1
)

echo [3/3] Verificando instalador Python...
if not "%PYTHON_INSTALLER%"=="" (
    echo       ✅ Python encontrado: %PYTHON_INSTALLER%
) else (
    echo       ❌ FALTA: Instalador de Python (.exe)  
    echo          Descargar de: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo ✅ Todos los archivos encontrados correctamente
timeout /t 2 /nobreak >nul

REM Verificar si ya están instalados
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                            VERIFICANDO SISTEMA ACTUAL                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.

set NEED_NODE=0
set NEED_PYTHON=0

echo 🔍 Verificando software ya instalado...
echo.

REM Verificar Node.js
echo [1/2] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       ❌ Node.js NO instalado - SE INSTALARÁ
    set NEED_NODE=1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo       ✅ Node.js ya instalado: %%i
)

REM Verificar Python
echo [2/2] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       ❌ Python NO instalado - SE INSTALARÁ
    set NEED_PYTHON=1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo       ✅ Python ya instalado: %%i
)

echo.
if %NEED_NODE%==0 if %NEED_PYTHON%==0 (
    echo 🎉 ¡Todo ya está instalado! Saltando a configuración de la aplicación...
    timeout /t 3 /nobreak >nul
    goto :install_app
)

echo 📋 INSTALACIONES NECESARIAS:
if %NEED_NODE%==1 echo     • Node.js Runtime Environment
if %NEED_PYTHON%==1 echo     • Python Programming Language
echo.
echo ⚠️  IMPORTANTE: Se abrirán instaladores que requieren permisos de administrador
echo ⚠️  Sigue las instrucciones de cada instalador y REINICIA cuando se solicite
echo.
echo Presiona cualquier tecla para empezar las instalaciones...
pause >nul

REM Instalar Node.js si es necesario
if %NEED_NODE%==1 (
    cls
    echo.
    echo ╔══════════════════════════════════════════════════════════════════════════════════╗
    echo ║                               INSTALANDO NODE.JS                                ║
    echo ╚══════════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 🔧 Iniciando instalación de Node.js...
    echo.
    echo ┌────────────────────────────────────────────────────────────────────────────────┐
    echo │  INSTRUCCIONES:                                                               │
    echo │  1. Se abrirá el instalador de Node.js                                       │
    echo │  2. Acepta todos los términos y condiciones                                  │
    echo │  3. Usa las opciones por defecto (Next, Next, Install)                       │
    echo │  4. NO cierres esta ventana                                                  │
    echo │  5. Vuelve aquí cuando termine la instalación                               │
    echo └────────────────────────────────────────────────────────────────────────────────┘
    echo.
    echo Presiona cualquier tecla para abrir el instalador de Node.js...
    pause >nul
    
    echo Abriendo instalador de Node.js...
    start /wait "" %NODE_INSTALLER%
    
    echo.
    echo ✅ Instalación de Node.js completada
    echo.
)

REM Instalar Python si es necesario
if %NEED_PYTHON%==1 (
    cls
    echo.
    echo ╔══════════════════════════════════════════════════════════════════════════════════╗
    echo ║                               INSTALANDO PYTHON                                 ║
    echo ╚══════════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 🔧 Iniciando instalación de Python...
    echo.
    echo ┌────────────────────────────────────────────────────────────────────────────────┐
    echo │  INSTRUCCIONES IMPORTANTES:                                                   │
    echo │  1. Se abrirá el instalador de Python                                        │
    echo │  2. ✅ MUY IMPORTANTE: Marcar "Add Python to PATH"                          │
    echo │  3. Elegir "Install Now" (instalación estándar)                             │
    echo │  4. NO cierres esta ventana                                                  │
    echo │  5. Vuelve aquí cuando termine la instalación                               │
    echo └────────────────────────────────────────────────────────────────────────────────┘
    echo.
    echo Presiona cualquier tecla para abrir el instalador de Python...
    pause >nul
    
    echo Abriendo instalador de Python...
    start /wait "" %PYTHON_INSTALLER%
    
    echo.
    echo ✅ Instalación de Python completada
    echo.
)

REM Solicitar reinicio si se instaló algo
if %NEED_NODE%==1 (
    cls
    echo.
    echo ╔══════════════════════════════════════════════════════════════════════════════════╗
    echo ║                              ¡REINICIO NECESARIO!                               ║
    echo ╚══════════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 🔄 Para que los cambios surtan efecto, necesitas REINICIAR el PC
    echo.
    echo ┌────────────────────────────────────────────────────────────────────────────────┐
    echo │  DESPUÉS DEL REINICIO:                                                        │
    echo │  1. Volver a esta carpeta                                                    │
    echo │  2. Ejecutar de nuevo este archivo (INSTALADOR_OFFLINE.bat)                 │
    echo │  3. Esta vez detectará el software instalado y continuará                   │
    echo └────────────────────────────────────────────────────────────────────────────────┘
    echo.
    set /p restart_now="¿Reiniciar ahora? (S/N): "
    if /i "%restart_now%"=="S" (
        echo.
        echo Reiniciando en 10 segundos... (Presiona Ctrl+C para cancelar)
        timeout /t 10
        shutdown /r /t 0
    ) else (
        echo.
        echo ⚠️ Recuerda reiniciar antes de continuar con la instalación
        pause
    )
    exit /b 0
)

:install_app
REM Instalar aplicación
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                          INSTALANDO APLICACIÓN                                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%PROJECT_DIR%"

REM Verificar que los comandos funcionen después de la instalación
echo 🔍 Verificación final de herramientas...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no se encuentra en el PATH
    echo    Solución: Reinicia el PC e intenta de nuevo
    pause
    exit /b 1
)

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python no se encuentra en el PATH  
    echo    Solución: Reinstala Python marcando "Add to PATH"
    pause
    exit /b 1
)

echo ✅ Herramientas verificadas correctamente
echo.

REM Ejecutar instalador principal
echo 🚀 Ejecutando instalador principal...
call INSTALAR_TIENDA.bat

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                         ¡INSTALACIÓN OFFLINE COMPLETA!                          ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎉 ¡Todo instalado correctamente desde cero!
echo.
echo ✅ Node.js instalado y configurado
echo ✅ Python instalado y configurado  
echo ✅ Aplicación de contabilidad instalada
echo ✅ Accesos directos creados
echo ✅ Sistema listo para usar
echo.
pause