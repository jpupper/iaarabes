@echo off
REM Activar el entorno virtual de StreamDiffusion
cd StreamDiffusion
call .\venv\Scripts\activate.bat
cd ..

REM Ir a la carpeta livuals
cd livuals

REM Iniciar el frontend en modo desarrollo en una nueva ventana
start cmd /k "cd frontend && npm install && npm run dev"

REM Esperar unos segundos para que el frontend comience
timeout /t 5

REM Iniciar el backend
python main.py --port 7860 --host 0.0.0.0
cmd /k
