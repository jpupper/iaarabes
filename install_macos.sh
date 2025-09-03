#!/usr/bin/env bash

set -euo pipefail

# ================================
# Instalador StreamDiffusion para macOS (con venv)
# ================================

# Ruta del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Verificando Python 3.10.x"
PY_VER=$(python3 -V 2>&1 | awk '{print $2}') || true
PY_MAJMIN=${PY_VER%.*}
if [[ "${ALLOW_ANY_PYTHON:-0}" != "1" && "$PY_MAJMIN" != "3.10" ]]; then
  echo "Se requiere Python 3.10.x. Versión actual: $PY_VER"
  echo "Sugerencias: pyenv (recomendado) o 'brew install python@3.10'."
  echo "(Puedes forzar continuar exportando ALLOW_ANY_PYTHON=1 antes de ejecutar este script.)"
  exit 1
else
  echo "Usando Python $PY_VER"
fi

echo "==> Clonando repositorio StreamDiffusion"
if [[ -d StreamDiffusion ]]; then
  echo "Directorio 'StreamDiffusion' ya existe. Saltando 'git clone'."
else
  git clone https://github.com/cumulo-autumn/StreamDiffusion.git
fi

cd StreamDiffusion

VENV_DIR="venv"
echo "==> Creando entorno virtual en $VENV_DIR"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo "==> Actualizando pip"
python -m pip install --upgrade pip

echo "==> Instalando PyTorch (CPU/MPS)"
# En macOS no hay CUDA/TensorRT. Torch con soporte MPS viene desde el índice por defecto.
pip install "torch==2.1.2" "torchvision==0.16.2"

echo "==> Instalando xformers (opcional)"
if ! pip install "xformers==0.0.23.post1"; then
  echo "[Aviso] xformers no disponible para macOS en esta versión; continuando sin aceleración xformers."
fi

echo "==> Creando requirements.txt"
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

echo "==> Instalando dependencias"
pip install -r requirements.txt

echo "==> Instalando paquete StreamDiffusion en modo editable"
pip install -e .

echo "==> Instalando dependencias extra (FastAPI, Uvicorn, etc.)"
pip install "fastapi==0.116.1" "uvicorn[standard]==0.35.0" "websockets==15.0.1" "markdown2==2.5.4" "python-multipart==0.0.20" "pydantic==1.10.14" "polygraphy==0.49.26"

echo "==> Omitiendo instalación de TensorRT (no disponible en macOS)"

echo "==> Instalación finalizada. Activa el entorno con:"
echo "     source \"$SCRIPT_DIR/StreamDiffusion/$VENV_DIR/bin/activate\""
echo "Luego ejecuta el servidor con el script: runlivuals_macos.sh"
