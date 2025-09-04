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


## Lyrics module (nuevo)

- Colocá tus archivos de audio en `public/audio` (extensiones soportadas: `.mp3`, `.m4a`, `.wav`, `.flac`, `.ogg`). Esta carpeta no se toca en el rebuild del frontend.
- El nombre del archivo se usa para mostrar Artista y Título con el formato `Artista - Título.ext` (si no tiene guión, se usa el nombre completo como título).
- En la UI, aparece un panel "Lyrics" con el listado de audios y un reproductor. Al hacer Play, se consulta la API de LRCLIB para obtener letras sincronizadas (LRC) y se va escribiendo la línea actual en el campo de `Prompt` en tiempo real.

SSL multiplataforma: se añadió `certifi` a `requirements.txt` para validar certificados en macOS/Windows/Linux. Si igual falla, el backend intentará un contexto sin verificación únicamente como fallback de desarrollo (mostrará un warning en el log).

Nota: la resolución de letras depende de que LRCLIB encuentre la canción; mejora el matching incluyendo `Artista` y `Título` correctos y, si es posible, manteniendo la duración similar a la del archivo.