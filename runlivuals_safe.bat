@echo off
setlocal enabledelayedexpansion

REM Verificar si el puerto 7860 está en uso y terminarlo si es necesario
echo Verificando si el puerto 7860 está en uso...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7860 ^| findstr LISTENING') do (
    set pid=%%a
    if not "!pid!"=="" (
        echo Puerto 7860 está siendo usado por el proceso !pid!
        echo Intentando terminar el proceso...
        taskkill /F /PID !pid!
        if errorlevel 1 (
            echo Error: No se pudo terminar el proceso !pid!
            echo Intenta cerrar manualmente las aplicaciones que puedan estar usando el puerto 7860
            pause
            exit /b 1
        ) else (
            echo Proceso terminado exitosamente
        )
    )
)

REM Activar el entorno virtual de StreamDiffusion
cd StreamDiffusion
call .\venv\Scripts\activate.bat
cd ..

REM Ir a la carpeta livuals y ejecutar
cd livuals

REM Verificar y compilar frontend
cd frontend
if not exist "dist" (
    echo Compilando frontend...
    call npm install
    call npm run build
    if errorlevel 1 (
        echo Error: Falló la compilación del frontend
        exit /b 1
    )
    echo Frontend compilado exitosamente
)
cd ..

REM Intentar iniciar con el puerto 7860
echo Iniciando aplicación en el puerto 7860...
python main.py --port 7860 --host 0.0.0.0

REM Si falla, intentar con un puerto alternativo
if errorlevel 1 (
    echo Error al iniciar en el puerto 7860, intentando con el puerto 7861...
    python main.py --port 7861 --host 0.0.0.0
)

cmd /k
