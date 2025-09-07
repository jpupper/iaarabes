@echo off
REM ================================
REM Script de instalación StreamDiffusion con venv
REM ================================

set CLEANINSTALL=false
if "%1"=="clean" set CLEANINSTALL=true

echo Modo de instalacion: %CLEANINSTALL%
echo.

REM Manejar venv
if "%CLEANINSTALL%"=="true" (
    echo Realizando instalación limpia...
    deactivate 2>nul
    rd /s /q venv 2>nul
)

REM 1. Verificar Python 3.10.9
for /f "tokens=2" %%I in ('python -V 2^>^&1') do set PYTHON_VERSION=%%I
if not "%PYTHON_VERSION%"=="3.10.9" (
    echo Se requiere Python 3.10.9 exactamente. Version actual: %PYTHON_VERSION%
    echo Por favor instale Python 3.10.9 desde https://www.python.org/downloads/release/python-3109/
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
pip install torch==2.1.2 torchvision==0.16.2 xformers==0.0.23.post1 --index-url https://download.pytorch.org/whl/cu121

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
pip install fastapi==0.116.1 uvicorn[standard]==0.35.0 websockets==15.0.1 markdown2==2.5.4 python-multipart==0.0.20 pydantic==1.10.14 polygraphy==0.49.26

REM 12. Instalar PySpout y OpenGL
cd ..
pip install PyOpenGL==3.1.7

REM Asegurar que el directorio site-packages existe
if not exist StreamDiffusion\venv\Lib\site-packages mkdir StreamDiffusion\venv\Lib\site-packages

REM Copiar archivos de Spout desde dependencies al venv
copy dependencies\Spout.dll StreamDiffusion\venv\Lib\site-packages\
copy dependencies\PySpout.pyd StreamDiffusion\venv\Lib\site-packages\

REM Verificar que los archivos se copiaron correctamente
if not exist StreamDiffusion\venv\Lib\site-packages\Spout.dll (
    echo Error: No se pudo copiar Spout.dll
    exit /b 1
)
if not exist StreamDiffusion\venv\Lib\site-packages\PySpout.pyd (
    echo Error: No se pudo copiar PySpout.pyd
    exit /b 1
)

cd StreamDiffusion


REM 10. Instalar TensorRT
python -m streamdiffusion.tools.install-tensorrt

REM 11. Instalar pywin32
pip install --force-reinstall pywin32

pause
