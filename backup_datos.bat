@echo off
title Backup Contabilidad Doña Araña
color 0B
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║         BACKUP CONTABILIDAD DOÑA ARAÑA          ║
echo ║            Respaldando datos...                 ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Obtener fecha actual para el nombre del backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "fecha=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "hora=%%a-%%b"
set "timestamp=%fecha%_%hora%"
set "timestamp=%timestamp: =0%"

REM Crear carpeta de backups si no existe
if not exist "backups" mkdir backups

set backup_name=backup_contabilidad_%timestamp%

echo Creando backup: %backup_name%
echo.

REM Crear carpeta del backup
mkdir "backups\%backup_name%"

REM Copiar base de datos
echo [1/3] Copiando base de datos...
if exist "contabilidad.db" (
    copy "contabilidad.db" "backups\%backup_name%\contabilidad.db" >nul
    echo       ✓ Base de datos copiada
) else (
    echo       ! Base de datos no encontrada
)

REM Copiar archivos de configuración del backend
echo [2/3] Copiando configuración backend...
if exist "backend" (
    mkdir "backups\%backup_name%\backend_config"
    if exist "backend\.env" copy "backend\.env" "backups\%backup_name%\backend_config\" >nul
    if exist "backend\requirements.txt" copy "backend\requirements.txt" "backups\%backup_name%\backend_config\" >nul
    echo       ✓ Configuración backend copiada
)

REM Crear archivo de información del backup
echo [3/3] Creando información del backup...
echo Backup creado: %date% %time% > "backups\%backup_name%\info_backup.txt"
echo Versión: Contabilidad Doña Araña v1.0 >> "backups\%backup_name%\info_backup.txt"
echo. >> "backups\%backup_name%\info_backup.txt"
echo Contenido: >> "backups\%backup_name%\info_backup.txt"
echo - Base de datos principal (contabilidad.db) >> "backups\%backup_name%\info_backup.txt"
echo - Configuración del sistema >> "backups\%backup_name%\info_backup.txt"
echo. >> "backups\%backup_name%\info_backup.txt"
echo Para restaurar: >> "backups\%backup_name%\info_backup.txt"
echo 1. Copiar contabilidad.db a la carpeta principal >> "backups\%backup_name%\info_backup.txt"
echo 2. Reiniciar la aplicación >> "backups\%backup_name%\info_backup.txt"

REM Comprimir backup (opcional, requiere 7-Zip o WinRAR)
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo Comprimiendo backup...
    7z a -tzip "backups\%backup_name%.zip" "backups\%backup_name%\*" >nul
    if %errorlevel% equ 0 (
        rmdir /s /q "backups\%backup_name%"
        echo       ✓ Backup comprimido: %backup_name%.zip
        set backup_final=%backup_name%.zip
    ) else (
        set backup_final=%backup_name%
    )
) else (
    set backup_final=%backup_name%
)

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║              BACKUP COMPLETADO ✓                ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo Backup guardado como: %backup_final%
echo Ubicación: backups\%backup_final%
echo.
echo ┌────────────────────────────────────────────────┐
echo │  RECOMENDACIONES:                              │
echo │                                                │
echo │  • Ejecutar backup semanalmente               │
echo │  • Guardar copias en USB o nube               │
echo │  • Mantener al menos 3 backups recientes      │
echo │                                                │
echo │  Para programar backup automático:            │
echo │  - Usar Programador de tareas de Windows      │
echo │  - Ejecutar este archivo cada domingo          │
echo └────────────────────────────────────────────────┘
echo.

REM Mostrar lista de backups existentes
echo Backups existentes:
echo.
dir /b backups\ 2>nul | findstr /i "backup_" | for /f %%i in ('more') do echo   • %%i

echo.
pause