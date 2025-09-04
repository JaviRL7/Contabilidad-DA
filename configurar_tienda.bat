@echo off
title Configuración Avanzada - Contabilidad Doña Araña
color 0E

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║       CONFIGURACIÓN AVANZADA PARA TIENDA        ║
echo ║            Contabilidad Doña Araña              ║
echo ╚══════════════════════════════════════════════════╝
echo.

set INSTALL_DIR=%cd%
set APP_NAME=Contabilidad Doña Araña

echo Configurando aplicación para uso en tienda...
echo Directorio: %INSTALL_DIR%
echo.

REM Crear acceso directo en el escritorio
echo [1/5] Creando acceso directo en escritorio...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\%APP_NAME%.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\iniciar_tienda.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Sistema de contabilidad para la tienda'; $Shortcut.Save()"
echo       ✓ Acceso directo creado

REM Crear acceso directo en menú inicio
echo [2/5] Añadiendo al menú inicio...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%\%APP_NAME%.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\iniciar_tienda.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Iniciar sistema de contabilidad'; $Shortcut.Save()"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\%APP_NAME%\Backup de Datos.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\backup_datos.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Crear backup de los datos'; $Shortcut.Save()"
echo       ✓ Añadido al menú inicio

REM Preguntar por auto-inicio
echo [3/5] Configuración de auto-inicio...
set /p auto_start="¿Iniciar automáticamente con Windows? (S/N): "
if /i "%auto_start%"=="S" (
    REM Crear acceso directo en carpeta de inicio
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\%APP_NAME%.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\iniciar_tienda.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Auto-inicio contabilidad tienda'; $Shortcut.Save()"
    echo       ✓ Auto-inicio configurado
    echo       ⚠️ La aplicación se iniciará automáticamente al encender el PC
) else (
    echo       ⊘ Auto-inicio omitido
)

REM Crear archivo de configuración
echo [4/5] Creando configuración personalizada...
echo # Configuración Contabilidad Doña Araña > config_tienda.txt
echo # Generado automáticamente el %date% %time% >> config_tienda.txt
echo. >> config_tienda.txt
echo [RUTAS] >> config_tienda.txt
echo DIRECTORIO_INSTALACION=%INSTALL_DIR% >> config_tienda.txt
echo DIRECTORIO_BACKUPS=%INSTALL_DIR%\backups >> config_tienda.txt
echo. >> config_tienda.txt
echo [CONFIGURACION] >> config_tienda.txt
echo AUTO_INICIO=%auto_start% >> config_tienda.txt
echo PUERTO_BACKEND=8000 >> config_tienda.txt
echo PUERTO_FRONTEND=4173 >> config_tienda.txt
echo. >> config_tienda.txt
echo [URLs] >> config_tienda.txt
echo URL_APLICACION=http://localhost:4173 >> config_tienda.txt
echo URL_API=http://localhost:8000 >> config_tienda.txt
echo       ✓ Configuración guardada

REM Configurar backup automático semanal
echo [5/5] Configuración de backup automático...
set /p auto_backup="¿Configurar backup automático semanal? (S/N): "
if /i "%auto_backup%"=="S" (
    REM Crear tarea programada usando schtasks
    schtasks /create /tn "Backup Contabilidad Doña Araña" /tr "%INSTALL_DIR%\backup_datos.bat" /sc weekly /d SUN /st 09:00 /f >nul 2>&1
    if %errorlevel% equ 0 (
        echo       ✓ Backup automático configurado (Domingos 9:00 AM)
    ) else (
        echo       ⚠️ Error al configurar backup automático (requiere permisos de administrador)
    )
) else (
    echo       ⊘ Backup automático omitido
)

REM Crear guía rápida
echo.
echo Creando guía rápida...
echo ╔══════════════════════════════════════════════════╗ > GUIA_RAPIDA.txt
echo ║              GUÍA RÁPIDA DE USO                  ║ >> GUIA_RAPIDA.txt
echo ║            Contabilidad Doña Araña              ║ >> GUIA_RAPIDA.txt
echo ╚══════════════════════════════════════════════════╝ >> GUIA_RAPIDA.txt
echo. >> GUIA_RAPIDA.txt
echo INICIAR LA APLICACIÓN: >> GUIA_RAPIDA.txt
echo • Doble clic en el icono del escritorio >> GUIA_RAPIDA.txt
echo • O buscar "%APP_NAME%" en el menú inicio >> GUIA_RAPIDA.txt
echo. >> GUIA_RAPIDA.txt
echo USO DIARIO: >> GUIA_RAPIDA.txt
echo 1. Se abre automáticamente en el navegador >> GUIA_RAPIDA.txt
echo 2. URL: http://localhost:4173 >> GUIA_RAPIDA.txt
echo 3. NO CERRAR la ventana negra durante el uso >> GUIA_RAPIDA.txt
echo. >> GUIA_RAPIDA.txt
echo FUNCIONES PRINCIPALES: >> GUIA_RAPIDA.txt
echo • Agregar ingresos y gastos diarios >> GUIA_RAPIDA.txt
echo • Ver resúmenes mensuales y anuales >> GUIA_RAPIDA.txt
echo • Crear y gestionar etiquetas >> GUIA_RAPIDA.txt
echo • Generar informes y comparativas >> GUIA_RAPIDA.txt
echo. >> GUIA_RAPIDA.txt
echo BACKUP DE DATOS: >> GUIA_RAPIDA.txt
echo • Menú Inicio ^> %APP_NAME% ^> Backup de Datos >> GUIA_RAPIDA.txt
echo • Ejecutar semanalmente para seguridad >> GUIA_RAPIDA.txt
echo. >> GUIA_RAPIDA.txt
echo SOPORTE: >> GUIA_RAPIDA.txt
echo • Leer INSTRUCCIONES_TIENDA.md para detalles >> GUIA_RAPIDA.txt
echo • En caso de problemas, reiniciar la aplicación >> GUIA_RAPIDA.txt

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║           CONFIGURACIÓN COMPLETADA ✓            ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo ¡La tienda ya está lista para usar la aplicación!
echo.
echo ACCESOS CREADOS:
echo • Escritorio: "%APP_NAME%.lnk"
echo • Menú Inicio: %APP_NAME%
if /i "%auto_start%"=="S" echo • Auto-inicio: Configurado ✓
if /i "%auto_backup%"=="S" echo • Backup automático: Domingos 9:00 AM ✓
echo.
echo ARCHIVOS IMPORTANTES:
echo • INSTRUCCIONES_TIENDA.md - Manual completo
echo • GUIA_RAPIDA.txt - Referencia rápida
echo • config_tienda.txt - Configuración del sistema
echo.
echo ┌────────────────────────────────────────────────┐
echo │  PRÓXIMOS PASOS:                              │
echo │                                                │
echo │  1. Leer la GUIA_RAPIDA.txt                   │
echo │  2. Probar la aplicación desde el escritorio  │
echo │  3. Crear el primer backup manualmente        │
echo │  4. ¡Empezar a usar el sistema! 🚀           │
echo └────────────────────────────────────────────────┘
echo.
pause