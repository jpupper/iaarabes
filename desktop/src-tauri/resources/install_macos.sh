#!/usr/bin/env bash

# Copia del script de instalación para macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$SCRIPT_DIR"

echo "==> Buscando Python 3.10"
PYBIN=""
if command -v python3.10 >/dev/null 2>&1; then
  PYBIN="$(command -v python3.10)"
elif [[ -x "/opt/homebrew/bin/python3.10" ]]; then
  PYBIN="/opt/homebrew/bin/python3.10"
elif [[ -x "/usr/local/bin/python3.10" ]]; then
  PYBIN="/usr/local/bin/python3.10"
elif command -v pyenv >/dev/null 2>&1; then
  echo "Usando pyenv para instalar Python 3.10.12 (esto puede tardar)"
  pyenv install -s 3.10.12
  PYBIN="$(pyenv root)/versions/3.10.12/bin/python3.10"
fi

if [[ -z "$PYBIN" ]]; then
  echo "Error: No se encontró Python 3.10. Instalalo y reintenta. Opciones:"
  echo "  - Homebrew: brew install python@3.10"
  echo "  - pyenv: brew install pyenv && pyenv install 3.10.12"
  exit 1
fi
echo "Usando Python: $PYBIN"

echo "==> Clonando repositorio StreamDiffusion"
if [[ -d StreamDiffusion ]]; then
  echo "Directorio 'StreamDiffusion' ya existe. Saltando 'git clone'."
else
  git clone https://github.com/cumulo-autumn/StreamDiffusion.git
fi

cd StreamDiffusion

VENV_DIR="venv"
echo "==> Creando entorno virtual en $VENV_DIR"
"$PYBIN" -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo "==> Actualizando pip"
"$PYBIN" -m pip install --upgrade pip

echo "==> Instalando PyTorch (CPU/MPS)"
"$PYBIN" -m pip install "torch==2.1.2" "torchvision==0.16.2"

echo "==> Instalando xformers (opcional)"
if ! "$PYBIN" -m pip install "xformers==0.0.23.post1"; then
  echo "[Aviso] xformers no disponible; continuando sin aceleración xformers."
fi

echo "==> Instalando dependencias principales"
cat > requirements.txt << 'REQS'
diffusers==0.24.0
transformers==4.37.0
huggingface-hub==0.21.4
accelerate==0.27.2
safetensors==0.4.2
numpy==1.26.4
Pillow==10.2.0
scipy==1.12.0
tqdm==4.66.2
REQS
"$PYBIN" -m pip install -r requirements.txt

echo "==> Instalando paquete StreamDiffusion en modo editable"
"$PYBIN" -m pip install -e .

echo "==> Instalando dependencias extra (FastAPI, Uvicorn, etc.)"
"$PYBIN" -m pip install "fastapi==0.116.1" "uvicorn[standard]==0.35.0" "websockets==15.0.1" "markdown2==2.5.4" "python-multipart==0.0.20" "pydantic==1.10.14" "polygraphy==0.49.26"

echo "==> Instalación finalizada."
