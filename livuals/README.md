# Img2Img Example

[English](./README.md) | [日本語](./README-ja.md)

<p align="center">
  <img src="../../assets/img2img1.gif" width=80%>
</p>

<p align="center">
  <img src="../../assets/img2img2.gif" width=80%>
</p>


This example, based on this [MPJEG server](https://github.com/radames/Real-Time-Latent-Consistency-Model/), runs image-to-image with a live webcam feed or screen capture on a web browser.

## Usage
You need Node.js 18+ and Python 3.10 to run this example.
Please make sure you've installed all dependencies according to the [installation instructions](../../README.md#installation).

```bash
cd frontend
npm i
npm run build
cd ..
pip install -r requirements.txt
python main.py  --acceleration tensorrt   
```

or 

```
chmod +x start.sh
./start.sh
```

then open `http://0.0.0.0:7860` in your browser.
(*If `http://0.0.0:7860` does not work well, try `http://localhost:7860`)

### Running with Docker

```bash
docker build -t img2img .
docker run -ti -e ENGINE_DIR=/data -e HF_HOME=/data -v ~/.cache/huggingface:/data  -p 7860:7860 --gpus all img2img
```

Where `ENGINE_DIR` and `HF_HOME` set a local cache directory, making it faster to restart the docker container.

## Lyrics module (nuevo)

- Colocá tus archivos de audio en `public/audio` (extensiones soportadas: `.mp3`, `.m4a`, `.wav`, `.flac`, `.ogg`). Esta carpeta no se toca en el rebuild del frontend.
- El nombre del archivo se usa para mostrar Artista y Título con el formato `Artista - Título.ext` (si no tiene guión, se usa el nombre completo como título).
- En la UI, aparece un panel "Lyrics" con el listado de audios y un reproductor. Al hacer Play, se consulta la API de LRCLIB para obtener letras sincronizadas (LRC) y se va escribiendo la línea actual en el campo de `Prompt` en tiempo real.

SSL multiplataforma: se añadió `certifi` a `requirements.txt` para validar certificados en macOS/Windows/Linux. Si igual falla, el backend intentará un contexto sin verificación únicamente como fallback de desarrollo (mostrará un warning en el log).

Nota: la resolución de letras depende de que LRCLIB encuentre la canción; mejora el matching incluyendo `Artista` y `Título` correctos y, si es posible, manteniendo la duración similar a la del archivo.
