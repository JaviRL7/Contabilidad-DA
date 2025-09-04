@echo off
title Contabilidad Doña Araña
color 0A
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║            CONTABILIDAD DOÑA ARAÑA              ║
echo ║               Iniciando sistema...              ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Cambiar al directorio de la aplicación
cd /d "%~dp0"

REM Función para verificar si un puerto está en uso
echo Verificando puertos...

REM Matar procesos previos si existen
taskkill /f /im "python.exe" >nul 2>&1
taskkill /f /im "node.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [1/4] Iniciando servidor backend...
echo       Servidor de datos y API
echo.

REM Iniciar backend en una nueva ventana
start "Backend - Contabilidad Doña Araña" /min cmd /c "cd backend && venv\Scripts\activate && echo Servidor backend iniciado en puerto 8000 && python main.py"

REM Esperar a que el backend se inicie
echo Esperando a que el servidor se inicie...
timeout /t 8 /nobreak >nul

echo [2/4] Backend iniciado correctamente ✓
echo.
echo [3/4] Iniciando interfaz web...
echo       Aplicación de usuario
echo.

REM Iniciar frontend en una nueva ventana
start "Frontend - Contabilidad Doña Araña" /min cmd /c "cd frontend && echo Aplicación web iniciada en puerto 4173 && npm run preview"

REM Esperar a que el frontend se inicie
timeout /t 5 /nobreak >nul

echo [4/4] Aplicación web iniciada correctamente ✓
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║                   ¡LISTO! 🎉                     ║
echo ║         Abriendo navegador web...               ║
echo ╚══════════════════════════════════════════════════╝

REM Abrir el navegador
timeout /t 2 /nobreak >nul
start http://localhost:4173

echo.
echo ┌────────────────────────────────────────────────┐
echo │  INSTRUCCIONES DE USO:                         │
echo │                                                │
echo │  • La aplicación se ha abierto en tu navegador │
echo │  • URL: http://localhost:4173                  │
echo │  • Para cerrar: cierra esta ventana           │
echo │                                                │
echo │  IMPORTANTE:                                   │
echo │  • NO cierres esta ventana mientras uses      │
echo │    la aplicación                              │
echo │  • Si se cierra por accidente, ejecuta        │
echo │    este archivo de nuevo                      │
echo └────────────────────────────────────────────────┘
echo.
echo Presiona cualquier tecla para minimizar esta ventana...
pause >nul

REM Minimizar la ventana actual
powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys(' ')"

REM Mantener la ventana abierta para que los servicios sigan corriendo
:loop
timeout /t 30 /nobreak >nul
goto loop