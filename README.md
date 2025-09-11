# Instalación y Ejecución

## Requisitos Generales

- Python 3.10.9 exacto
- Node.js 18+ y npm para compilar el frontend
- Git

## Wrapper de Escritorio (Tauri)

Opcionalmente podés usar la app nativa (macOS/Windows) sin abrir el navegador. Este wrapper inicia tu backend y abre la UI en una ventana nativa.

Requisitos adicionales:
- Rust + Cargo
- Tauri CLI: `cargo install tauri-cli`
- Windows: WebView2 Runtime (generalmente ya instalado)

Cómo usarlo:
1) Asegúrate de haber instalado el backend primero (ver secciones Windows/macOS más abajo).
2) Desde la carpeta `iaarabes/`, ejecutá:

```
cd desktop
cargo tauri dev
```

Esto:
- Lanza el backend usando los scripts de `iaarabes/`
- Espera a que el server esté listo en `http://127.0.0.1:7860`
- Abre una ventana nativa cargando esa URL

Build (instaladores):

```
cd desktop
cargo tauri build
```

Notas:
- El wrapper exporta `HOST=127.0.0.1` y `PORT=7860` para que el server no se exponga a la red.
- Si necesitás otro puerto, definí `PORT` en el entorno antes de ejecutar `cargo tauri dev`.
- El wrapper no incluye PyTorch ni dependencias del backend; se espera que `install.bat`/`install_macos.sh` ya hayan sido ejecutados en ese equipo.

### Primer uso en una máquina nueva
- El ejecutable creado (.app/.msi) incluye los scripts de instalación.
- Si al iniciar la app no existe el venv (`StreamDiffusion/venv`), el wrapper ejecuta automáticamente el instalador:
  - macOS: `install_macos.sh` (requiere CLT de Xcode; puede tardar varios minutos)
  - Windows: `install.bat` (requiere Python 3.10.9 en PATH)
- Tras la instalación, el backend se iniciará y la UI se abrirá en la ventana nativa.

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

2) O bien usar la app de escritorio (requiere pasos del wrapper):

```
cd desktop
cargo tauri dev
```

3) Generar instalador:

```
cd desktop
cargo tauri build
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

2) O bien usar la app de escritorio (requiere pasos del wrapper):

```
cd desktop
cargo tauri dev
```

3) Generar .app/.dmg:

```
cd desktop
cargo tauri build
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
