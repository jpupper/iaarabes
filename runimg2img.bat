@echo off
cd StreamDiffusion
call .\venv\Scripts\activate.bat
cd demo\realtime-img2img

REM Verificar y compilar frontend si es necesario
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

python main.py --port 7860 --host 0.0.0.0
cmd /k
