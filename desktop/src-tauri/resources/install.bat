@echo off
REM Instalador Windows (copia)
setlocal enabledelayedexpansion

if exist StreamDiffusion\venv ( echo venv existente & goto :eof )

echo Clonando StreamDiffusion...
git clone https://github.com/cumulo-autumn/StreamDiffusion.git
cd StreamDiffusion

echo Creando venv...
python -m venv venv
call .\venv\Scripts\activate.bat
python -m pip install --upgrade pip

echo Instalando PyTorch CUDA si corresponde o CPU...
pip install torch==2.1.2 torchvision==0.16.2

echo Dependencias base...
echo diffusers==0.24.0> requirements.txt
echo transformers==4.37.0>> requirements.txt
echo huggingface-hub==0.21.4>> requirements.txt
echo accelerate==0.27.2>> requirements.txt
echo safetensors==0.4.2>> requirements.txt
echo numpy==1.26.4>> requirements.txt
echo Pillow==10.2.0>> requirements.txt
echo scipy==1.12.0>> requirements.txt
echo tqdm==4.66.2>> requirements.txt
pip install -r requirements.txt

echo Instalando paquete StreamDiffusion (editable)...
pip install -e .

echo Extras FastAPI/Uvicorn...
pip install fastapi==0.116.1 uvicorn[standard]==0.35.0 websockets==15.0.1 markdown2==2.5.4 python-multipart==0.0.20 pydantic==1.10.14 polygraphy==0.49.26

echo Listo.
endlocal

