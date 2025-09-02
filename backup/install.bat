@echo off
REM ================================
REM Script de instalación StreamDiffusion con venv
REM ================================


REM 0. Limpiando instalaciones previas...
deactivate 2>nul
rd /s /q .venv 2>nul



REM 1. Verificar Python y crear entorno virtual
python --version > nul 2>&1
if errorlevel 1 (
    echo Python no encontrado. Por favor instale Python 3.10 desde https://www.python.org/downloads/
    exit /b 1
)

REM 2. Clonar el repositorio
echo Clonando repositorio...
git clone https://github.com/cumulo-autumn/StreamDiffusion.git
cd StreamDiffusion

set VENV=venv

REM 3. Crear y activar entorno virtual
echo Creando entorno virtual...
python -m venv venv

REM Activa el entorno virtual
call .\%VENV%\Scripts\activate.bat

REM 4. Actualizar pip
python -m pip install --upgrade pip

REM 5. Instalar PyTorch con CUDA 12.1
pip install torch==2.1.2 torchvision==0.16.2 xformers --index-url https://download.pytorch.org/whl/cu121

REM 6. Crear requirements.txt
echo diffusers==0.24.0> requirements.txt
echo transformers==4.37.0>> requirements.txt
echo huggingface-hub==0.21.4>> requirements.txt
echo accelerate==0.27.2>> requirements.txt
echo safetensors==0.4.2>> requirements.txt
echo numpy==1.26.4>> requirements.txt
echo Pillow==10.2.0>> requirements.txt
echo scipy==1.12.0>> requirements.txt
echo tqdm==4.66.2>> requirements.txt

REM 7. Instalar dependencias
pip install -r requirements.txt

REM 8. Instalar paquete en modo editable
pip install -e .

REM 9. Instalar dependencias extra (FastAPI y relacionados)
pip install fastapi uvicorn[standard] websockets markdown2 python-multipart pydantic==1.10.14

REM 11. Instalar polygraphy para optimización
pip install polygraphy

pause
