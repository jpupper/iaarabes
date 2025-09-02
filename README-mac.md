# Instalación y ejecución en macOS

Requisitos:

- Python 3.10.9 exacto (`python3 -V` debe mostrar `3.10.9`)
- Node.js 18+ y npm para compilar el frontend
- Git

Pasos:

1) Instalar dependencias de Python y StreamDiffusion

```
cd iaarabes
chmod +x install_macos.sh
./install_macos.sh
```

2) Ejecutar la app (backend + frontend compilado)

```
cd iaarabes
chmod +x runlivuals_macos.sh
./runlivuals_macos.sh
```

Notas:

- En macOS no hay CUDA/TensorRT. El script fuerza `ACCELERATION=none` por defecto. Si tienes `xformers` instalado correctamente, puedes exportar `ACCELERATION=xformers` antes de ejecutar.
- Para mejor rendimiento en Macs con Apple Silicon, Torch usa automáticamente MPS cuando es posible, aunque el código de ejemplo actualmente usa CPU si no detecta CUDA.
- Si no tienes Python 3.10.9, usa `pyenv` o `brew` para instalarlo y asegúrate de que `python3` apunte a esa versión.

