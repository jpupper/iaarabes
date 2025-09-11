#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

if [[ ! -d "StreamDiffusion/venv" ]]; then
  echo "No se encontró 'StreamDiffusion/venv'. Ejecutando instalador..."
  if [[ -x "./install_macos.sh" ]]; then
    bash ./install_macos.sh
  elif [[ -x "./resources/install_macos.sh" ]]; then
    bash ./resources/install_macos.sh
  elif [[ -x "./scripts/install_macos.sh" ]]; then
    bash ./scripts/install_macos.sh
  else
    echo "No se encontró install_macos.sh" >&2
    exit 1
  fi
fi

source "StreamDiffusion/venv/bin/activate"

find_livuals_dir() {
  local bases=(
    "$ROOT_DIR"
    "$ROOT_DIR/resources"
    "$ROOT_DIR/scripts"
    "$ROOT_DIR/.."
    "$ROOT_DIR/../.."
    "$ROOT_DIR/../../.."
    "$ROOT_DIR/../../../.."
    "$ROOT_DIR/../../../../.."
    "$ROOT_DIR/../../../../../.."
    "$ROOT_DIR/../../../../../../.."
    "$ROOT_DIR/../../../../../../../.."
  )
  for b in "${bases[@]}"; do
    for c in "$b/livuals" "$b/iaarabes/livuals"; do
      if [[ -d "$c" ]]; then
        echo "$c"
        return 0
      fi
    done
  done
  return 1
}

LIVUALS_DIR=$(find_livuals_dir || true)
if [[ -z "$LIVUALS_DIR" ]]; then
  echo "No se encontró carpeta 'livuals'" >&2
  exit 1
fi
cd "$LIVUALS_DIR"

if [[ "${REBUILD_FRONTEND:-0}" == "1" ]] || [[ ! -d "frontend/public/_app" ]]; then
  echo "Compilando frontend..."
  pushd frontend >/dev/null
  npm install
  npm run build
  popd >/dev/null
fi

export LIVUALS_BUILD_ID="$(date -u +%Y%m%d-%H%M%S)"
echo "$LIVUALS_BUILD_ID" > frontend/public/build_id.txt || true

export ACCELERATION=${ACCELERATION:-none}

echo "Iniciando servidor en :7860 (ACCELERATION=$ACCELERATION)"
exec python3 main.py --port 7860 --host 0.0.0.0
