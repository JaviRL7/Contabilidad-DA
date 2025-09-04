@echo off
title Instalador Completo - Contabilidad Doña Araña
color 0F
mode con: cols=80 lines=30

:inicio
cls
echo.
echo                ╔════════════════════════════════════════╗
echo                ║      CONTABILIDAD DOÑA ARAÑA          ║
echo                ║         Instalador Completo           ║
echo                ║                                        ║
echo                ║    🏪 Configuración para Tienda 🏪     ║
echo                ╚════════════════════════════════════════╝
echo.
echo                    ¡Bienvenida a tu nuevo sistema!
echo.
echo ┌────────────────────────────────────────────────────────────────────────┐
echo │                                                                        │
echo │  Este instalador configurará automáticamente todo lo necesario        │
echo │  para que puedas usar la aplicación de contabilidad en la tienda.     │
echo │                                                                        │
echo │  ¿Qué hará?                                                           │
echo │  ✓ Verificar que tengas Node.js y Python instalados                  │
echo │  ✓ Instalar todas las dependencias necesarias                        │
echo │  ✓ Crear accesos directos en el escritorio y menú inicio             │
echo │  ✓ Configurar inicio automático (opcional)                           │
echo │  ✓ Configurar backups automáticos (opcional)                         │
echo │  ✓ Crear guías de uso fáciles de seguir                             │
echo │                                                                        │
echo └────────────────────────────────────────────────────────────────────────┘
echo.
echo                    Presiona cualquier tecla para empezar
echo                         (o cierra la ventana para salir)
pause >nul

cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════╗
echo ║                            VERIFICANDO SISTEMA                          ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
echo [1/2] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js NO está instalado
    echo.
    echo ┌────────────────────────────────────────────────────────────────┐
    echo │  INSTRUCCIONES PARA INSTALAR NODE.JS:                         │
    echo │                                                                │
    echo │  1. Ve a: https://nodejs.org/                                 │
    echo │  2. Descarga la versión LTS (recomendada)                     │
    echo │  3. Instala con las opciones por defecto                      │
    echo │  4. Reinicia el PC                                            │
    echo │  5. Ejecuta este instalador de nuevo                          │
    echo └────────────────────────────────────────────────────────────────┘
    echo.
    echo Presiona cualquier tecla para abrir la página de descarga...
    pause >nul
    start https://nodejs.org/
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo       ✅ Node.js encontrado: %%i
)

REM Verificar Python
echo [2/2] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Python NO está instalado
    echo.
    echo ┌────────────────────────────────────────────────────────────────┐
    echo │  INSTRUCCIONES PARA INSTALAR PYTHON:                          │
    echo │                                                                │
    echo │  1. Ve a: https://www.python.org/downloads/                   │
    echo │  2. Descarga Python 3.11 o superior                          │
    echo │  3. ✅ IMPORTANTE: Marcar "Add Python to PATH"               │
    echo │  4. Instala con las opciones por defecto                      │
    echo │  5. Reinicia el PC                                            │
    echo │  6. Ejecuta este instalador de nuevo                          │
    echo └────────────────────────────────────────────────────────────────┘
    echo.
    echo Presiona cualquier tecla para abrir la página de descarga...
    pause >nul
    start https://www.python.org/downloads/
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo       ✅ Python encontrado: %%i
)

echo.
echo ✅ Sistema listo para la instalación
timeout /t 2 /nobreak >nul

REM Ejecutar instalación principal
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════╗
echo ║                            INSTALANDO APLICACIÓN                        ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.
call install.bat
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error durante la instalación
    pause
    exit /b 1
)

REM Ejecutar configuración avanzada
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════╗
echo ║                          CONFIGURACIÓN AVANZADA                         ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.
call configurar_tienda.bat

REM Pantalla final
cls
echo.
echo                ╔════════════════════════════════════════╗
echo                ║         ¡INSTALACIÓN COMPLETA!        ║
echo                ║              🎉 ¡ÉXITO! 🎉             ║
echo                ╚════════════════════════════════════════╝
echo.
echo ┌────────────────────────────────────────────────────────────────────────┐
echo │                                                                        │
echo │  🎯 TU SISTEMA ESTÁ LISTO PARA USAR                                   │
echo │                                                                        │
echo │  PARA EMPEZAR:                                                        │
echo │  • Haz doble clic en "Contabilidad Doña Araña" en el escritorio      │
echo │  • O búscalo en el menú inicio de Windows                            │
echo │                                                                        │
echo │  ARCHIVOS IMPORTANTES CREADOS:                                        │
echo │  📖 INSTRUCCIONES_TIENDA.md - Manual completo                        │
echo │  📋 GUIA_RAPIDA.txt - Referencia rápida                             │
echo │  💾 backup_datos.bat - Para crear copias de seguridad               │
echo │                                                                        │
echo │  RECUERDA:                                                            │
echo │  • La aplicación se abre automáticamente en el navegador             │
echo │  • NO cerrar la ventana negra mientras la uses                       │
echo │  • Hacer backup de datos semanalmente                                │
echo │                                                                        │
echo └────────────────────────────────────────────────────────────────────────┘
echo.
echo                     ¿Quieres probar la aplicación ahora?
set /p test_app="                              (S/N): "
if /i "%test_app%"=="S" (
    echo.
    echo                      Iniciando aplicación...
    start iniciar_tienda.bat
)

echo.
echo                    ¡Disfruta tu nueva aplicación! 💖
echo                   Presiona cualquier tecla para salir
pause >nul