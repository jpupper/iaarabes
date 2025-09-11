@echo off
setlocal

if not exist StreamDiffusion\venv (
  echo No se encontro venv, ejecutando instalador...
  call install.bat
)

call StreamDiffusion\venv\Scripts\activate.bat

cd livuals
if not exist frontend\dist (
  pushd frontend
  npm install
  npm run build
  popd
)

set LIVUALS_BUILD_ID=%DATE%_%TIME%
python main.py --port 7860 --host 0.0.0.0

endlocal

