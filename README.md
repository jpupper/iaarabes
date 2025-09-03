# Instalación y Ejecución

## Requisitos Generales

- Python 3.10.9 exacto
- Node.js 18+ y npm para compilar el frontend
- Git

## Windows

### Instalación

1) Instalar dependencias de Python y StreamDiffusion:

```
install.bat
```

### Ejecución

1) Ejecutar la app (backend + frontend compilado):

```
runlivuals.bat
```

## macOS

### Instalación

1) Instalar dependencias de Python y StreamDiffusion:

```
chmod +x install_macos.sh
./install_macos.sh
```

### Ejecución

1) Ejecutar la app (backend + frontend compilado):

```
chmod +x runlivuals_macos.sh
./runlivuals_macos.sh
```

## Notas

### macOS
- No hay CUDA/TensorRT. El script fuerza `ACCELERATION=none` por defecto. Si tienes `xformers` instalado correctamente, puedes exportar `ACCELERATION=xformers` antes de ejecutar
- Para mejor rendimiento en Macs con Apple Silicon, Torch usa automáticamente MPS cuando es posible
- Si no tienes Python 3.10.9, usa `pyenv` o `brew` para instalarlo

### Windows
- Asegúrate de tener Python 3.10.9 instalado y configurado en el PATH
- Se recomienda tener CUDA instalado para mejor rendimiento
