#!/usr/bin/env bash

set -euo pipefail

# ================================
# Ejecutor StreamDiffusion + livuals para macOS
# ================================

# Siempre arrancamos desde la carpeta del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Activar venv de StreamDiffusion
if [[ ! -d "StreamDiffusion/venv" ]]; then
  echo "No se encontró 'StreamDiffusion/venv'. Ejecuta primero: ./install_macos.sh"
  exit 1
fi

source "StreamDiffusion/venv/bin/activate"

# Ir a la app livuals
cd "livuals"

# Compilar frontend si hace falta o si se fuerza rebuild
if [[ "${REBUILD_FRONTEND:-0}" == "1" ]] || [[ ! -d "frontend/public/_app" ]]; then
  echo "Compilando frontend..."
  # Intenta cargar nvm si está instalado para exponer npm/node en la sesión actual
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
    # Activa una versión instalada (prioriza 18, luego LTS, luego default)
    if command -v nvm >/dev/null 2>&1; then
      nvm use 18 >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
    fi
  fi
  if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm no está instalado o no está en el PATH." >&2
    echo "Instala Node.js (incluye npm) y vuelve a intentar. Opciones:" >&2
    echo "  - Homebrew: brew install node@18   (o 'brew install node' para LTS)" >&2
    echo "  - NVM: brew install nvm && configura ~/.nvm, luego nvm install 18 && nvm use 18" >&2
    echo "  - Instalador oficial: https://nodejs.org" >&2
    exit 1
  fi
  pushd frontend >/dev/null
  npm install
  npm run build
  popd >/dev/null
  echo "Frontend compilado."
fi

# Marcar build ID para depuración/cache busting
export LIVUALS_BUILD_ID="$(date -u +%Y%m%d-%H%M%S)"
echo "$LIVUALS_BUILD_ID" > frontend/public/build_id.txt || true

# En macOS no hay TensorRT; forzamos sin aceleración por defecto
export ACCELERATION=${ACCELERATION:-none}

echo "Iniciando servidor en :7860 (ACCELERATION=$ACCELERATION)"
exec python3 main.py --port 7860 --host 0.0.0.0
