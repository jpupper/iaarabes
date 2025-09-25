@echo off
setlocal enabledelayedexpansion

echo Buscando procesos que usan el puerto 7860...

REM Buscar PIDs de procesos que usan el puerto 7860
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7860 ^| findstr LISTENING') do (
    set pid=%%a
    if not "!pid!"=="" (
        echo Encontrado proceso !pid! usando el puerto 7860
        
        REM Obtener el nombre del proceso
        for /f "tokens=1" %%p in ('tasklist /FI "PID eq !pid!" ^| findstr /i "!pid!"') do (
            set process_name=%%p
            echo Proceso: !process_name! (PID: !pid!)
        )
        
        echo Terminando proceso !pid!...
        taskkill /F /PID !pid!
        
        if errorlevel 1 (
            echo Error: No se pudo terminar el proceso !pid!
        ) else (
            echo Proceso !pid! terminado exitosamente
        )
    )
)

echo Verificando si el puerto 7860 está libre...
netstat -ano | findstr :7860 | findstr LISTENING > nul
if errorlevel 1 (
    echo El puerto 7860 está libre y listo para usar
) else (
    echo ADVERTENCIA: El puerto 7860 todavía está en uso
    echo Es posible que necesites cerrar manualmente las aplicaciones
)

pause
