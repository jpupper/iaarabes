# Livuals Desktop (Tauri Wrapper)

Este wrapper crea una aplicación de escritorio nativa (macOS/Windows) que:
- Inicia el backend Python existente (los scripts en `iaarabes/`)
- Espera a que el servidor esté listo
- Abre la UI en una ventana nativa apuntando a `http://127.0.0.1:7860`

No reempaqueta PyTorch ni dependencias del backend. Requiere que primero instales y ejecutes el backend como siempre (con los scripts provistos).

## Requisitos
- Rust y Cargo (estable)
- Tauri CLI (`cargo install tauri-cli`)
- macOS: nada extra (WebKit viene por defecto)
- Windows: WebView2 Runtime (si no está, el instalador de MS lo añade automáticamente)

### macOS: instalar Rust y Cargo (si `cargo` no existe)
- Instalar herramientas de línea de comandos de Xcode (compilador C):
```
xcode-select --install
```
- Instalar Rust via rustup (recomendado):
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```
  - Alternativa con Homebrew:
```
brew install rustup-init
rustup-init -y
source "$HOME/.cargo/env"
```
- Verificar:
```
cargo --version
rustc --version
```

## Preparación del backend (una sola vez)
Sigue las guías en `iaarabes/README.md` para instalar dependencias:
- Windows: `iaarabes/install.bat`
- macOS: `iaarabes/install_macos.sh`

Esto crea el venv y deja todo listo para que los scripts `runlivuals.*` funcionen.

## Ejecutar en desarrollo
1) Posiciónate en este directorio `iaarabes/desktop/`:

```
cd iaarabes/desktop
```

2) Lanza la app nativa con Tauri (esto abrirá la ventana y arrancará el backend):

```
cargo tauri dev
```

Detalles:
- El wrapper setea `HOST=127.0.0.1` y `PORT=7860` para el backend.
- Al estar dentro de `iaarabes/`, usa directamente los scripts `runlivuals.*` de esta carpeta.

## Build (generar instaladores)
Construye binarios nativos e instaladores:

```
cd iaarabes/desktop
cargo tauri build
```

- macOS: genera `.app` y `.dmg`
- Windows: genera `.msi`

Nota: este wrapper asume que el entorno del backend ya está instalado en el equipo destino. Si necesitas un instalador “todo en uno” que incluya Python/PyTorch, considera un empaquetado dedicado del backend (PyInstaller, sidecar binarios, etc.), lo cual es un proyecto aparte.

## Primer uso en una máquina nueva
La app ahora automatiza el primer uso: si detecta que falta el entorno (venv) de StreamDiffusion, corre el instalador correspondiente antes de iniciar el backend.

Requisitos previos:
- Conexión a internet
- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Windows: Python 3.10.9 instalado y en PATH (requerido por `install.bat`)

Qué hace la automatización:
- macOS: ejecuta `install_macos.sh` (puede tardar varios minutos). Crea venv dentro de `iaarabes/StreamDiffusion/venv`, instala PyTorch, dependencias y el paquete StreamDiffusion.
- Windows: ejecuta `install.bat`. Crea venv y realiza la instalación equivalente.

Rutas empaquetadas (bundle):
- Los scripts `install_macos.sh`, `install.bat`, `runlivuals_macos.sh`, `runlivuals.bat`, la carpeta `iaarabes/livuals/**` y `iaarabes/dependencies/**` se incluyen dentro de los Resources del ejecutable.
- macOS: dentro de `Livuals.app`, en `Livuals.app/Contents/Resources/`

Notas:
- Si el instalador falla (faltan prerequisitos), abre una terminal y ejecuta el script manual en la carpeta indicada para ver el error detallado.
- Una vez instalado el backend, los siguientes arranques serán directos (solo inicia el servidor y abre la ventana).

## Configuración avanzada
- Puerto/host: el wrapper exporta `HOST=127.0.0.1` y `PORT=7860`. Cambia `PORT` con una variable de entorno del sistema antes de abrir la app si lo necesitas.
- Reconstrucción del frontend: los scripts actuales compilan el frontend si hace falta. Si prefieres forzar rebuild en macOS: `REBUILD_FRONTEND=1 cargo tauri dev`.

## Cierre limpio
Al cerrar la ventana, el wrapper termina el proceso del backend.

## Solución de problemas
- `zsh: command not found: cargo`:
  - Instala Rust con los pasos de arriba y ejecuta `source "$HOME/.cargo/env"` (o abre una nueva terminal).
- `linker 'cc' failed` o errores de compilación en macOS:
  - Asegúrate de tener instaladas las herramientas de Xcode: `xcode-select --install`. Si persiste, corre `sudo xcodebuild -license` y acepta la licencia, o `sudo xcodebuild -runFirstLaunch`.
- Permisos en script de backend:
  - `chmod +x iaarabes/runlivuals_macos.sh`.
