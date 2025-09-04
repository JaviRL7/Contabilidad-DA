@echo off
echo ========================================
echo   Instalador Contabilidad Doña Araña
echo ========================================
echo.

REM Verificar si Node.js está instalado
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si Python está instalado
echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no está instalado.
    echo Por favor instala Python desde: https://www.python.org/
    pause
    exit /b 1
)

echo Node.js y Python encontrados correctamente.
echo.

REM Obtener la ruta actual
set INSTALL_DIR=%cd%

REM Instalar dependencias del frontend
echo Instalando dependencias del frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Error al instalar dependencias del frontend
    pause
    exit /b 1
)

REM Construir el frontend para producción
echo Construyendo aplicación frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Error al construir el frontend
    pause
    exit /b 1
)

cd ..

REM Instalar dependencias del backend
echo Instalando dependencias del backend...
cd backend

REM Crear entorno virtual de Python si no existe
if not exist "venv" (
    echo Creando entorno virtual de Python...
    python -m venv venv
)

REM Activar entorno virtual e instalar dependencias
echo Activando entorno virtual e instalando dependencias...
call venv\Scripts\activate
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Error al instalar dependencias del backend
    pause
    exit /b 1
)

cd ..

REM Crear script de inicio
echo Creando script de inicio...
echo @echo off > start_contabilidad.bat
echo echo Iniciando Contabilidad Doña Araña... >> start_contabilidad.bat
echo echo. >> start_contabilidad.bat
echo cd "%INSTALL_DIR%" >> start_contabilidad.bat
echo. >> start_contabilidad.bat
echo REM Iniciar backend >> start_contabilidad.bat
echo echo Iniciando servidor backend... >> start_contabilidad.bat
echo start "Backend - Contabilidad" cmd /k "cd backend && venv\Scripts\activate && python main.py" >> start_contabilidad.bat
echo. >> start_contabilidad.bat
echo REM Esperar un poco para que el backend se inicie >> start_contabilidad.bat
echo timeout /t 5 /nobreak ^> nul >> start_contabilidad.bat
echo. >> start_contabilidad.bat
echo REM Iniciar frontend >> start_contabilidad.bat
echo echo Iniciando aplicación web... >> start_contabilidad.bat
echo start "Frontend - Contabilidad" cmd /k "cd frontend && npm run preview" >> start_contabilidad.bat
echo. >> start_contabilidad.bat
echo REM Esperar un poco y abrir navegador >> start_contabilidad.bat
echo timeout /t 3 /nobreak ^> nul >> start_contabilidad.bat
echo start http://localhost:4173 >> start_contabilidad.bat
echo. >> start_contabilidad.bat
echo echo Contabilidad Doña Araña iniciada correctamente! >> start_contabilidad.bat
echo echo. >> start_contabilidad.bat
echo echo Backend: http://localhost:8000 >> start_contabilidad.bat
echo echo Frontend: http://localhost:4173 >> start_contabilidad.bat
echo pause >> start_contabilidad.bat

REM Crear acceso directo en el escritorio (opcional)
echo.
set /p create_shortcut="¿Crear acceso directo en el escritorio? (S/N): "
if /i "%create_shortcut%"=="S" (
    echo Creando acceso directo en el escritorio...
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Contabilidad Doña Araña.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start_contabilidad.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\frontend\public\Logo1.png'; $Shortcut.Save()"
    echo Acceso directo creado en el escritorio.
)

echo.
echo ========================================
echo        INSTALACIÓN COMPLETADA
echo ========================================
echo.
echo Para iniciar la aplicación:
echo 1. Ejecuta: start_contabilidad.bat
echo 2. O usa el acceso directo del escritorio (si lo creaste)
echo.
echo La aplicación se abrirá automáticamente en tu navegador
echo en: http://localhost:4173
echo.
echo IMPORTANTE:
echo - Mantén las ventanas de comandos abiertas mientras uses la app
echo - Para cerrar completamente, cierra ambas ventanas de comandos
echo.
pause