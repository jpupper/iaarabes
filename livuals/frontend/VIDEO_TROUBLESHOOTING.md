# Guía de Solución de Problemas para Video en Livuals

## Problemas Comunes y Soluciones

### 1. El video no se carga o se queda en "Loading..."

**Posibles causas:**
- El formato de video no es compatible con el navegador
- El archivo de video está corrupto
- El navegador tiene restricciones de autoplay

**Soluciones:**
- Intenta con un formato de video diferente (MP4 con codec H.264 es el más compatible)
- Verifica que el archivo de video se pueda reproducir en otro reproductor
- Haz clic en el botón de play manualmente después de cargar el video
- Actualiza la página y vuelve a intentarlo

### 2. El video se carga pero no se ve en la previsualización

**Posibles causas:**
- El elemento de video está oculto o mal configurado
- El canvas no está recibiendo los frames del video
- Problemas con el CSS que ocultan el video

**Soluciones:**
- Verifica en la consola del navegador si hay errores relacionados con el video
- Intenta con un video más pequeño o de menor resolución
- Asegúrate de hacer clic en "Select" después de cargar el video
- Prueba con otro navegador (Chrome suele tener mejor compatibilidad)

### 3. El video se reproduce pero no se envían frames a StreamDiffusion

**Posibles causas:**
- El estado `mediaStreamStatus` no está en `CONNECTED`
- El video está pausado o no está activo
- Problemas con la captura de frames

**Soluciones:**
- Asegúrate de que el video esté seleccionado (botón "Select" en azul)
- Haz clic en el botón "Play" para iniciar la reproducción
- Verifica en la consola si hay mensajes de "Frame captured and sent to store"
- Intenta desactivar y volver a activar el video

### 4. La barra de tiempo no funciona o no se muestra

**Posibles causas:**
- El video no ha cargado completamente sus metadatos
- El elemento de video no está correctamente inicializado
- Problemas con los eventos de video

**Soluciones:**
- Espera a que el video cargue completamente
- Verifica que la duración del video se muestre correctamente
- Intenta hacer clic en el botón "Play" antes de usar la barra de tiempo
- Actualiza la página y vuelve a intentarlo

### 5. El video se ve pero no se procesa en StreamDiffusion

**Posibles causas:**
- Los frames no se están enviando correctamente al store
- El formato de los frames no es compatible
- Problemas de comunicación entre el frontend y el backend

**Soluciones:**
- Verifica que el video esté seleccionado y reproduciendo
- Comprueba en la consola si hay errores de comunicación
- Intenta con un video de menor resolución
- Reinicia el servidor y el navegador

## Verificación de Compatibilidad

Para verificar si tu navegador es compatible con la reproducción de video:

1. Abre la consola del navegador (F12)
2. Ejecuta el siguiente código:

```javascript
const videoFormats = {
  mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
  webm: 'video/webm; codecs="vp8, vorbis"',
  ogg: 'video/ogg; codecs="theora, vorbis"'
};

Object.entries(videoFormats).forEach(([format, mimeType]) => {
  const canPlay = document.createElement('video').canPlayType(mimeType);
  console.log(`${format}: ${canPlay || 'not supported'}`);
});
```

## Recomendaciones de Formatos de Video

Los siguientes formatos suelen tener buena compatibilidad con la mayoría de navegadores:

- **MP4 (H.264)**: Alta compatibilidad en todos los navegadores
- **WebM (VP8/VP9)**: Buena compatibilidad en Chrome y Firefox
- **MOV (H.264)**: Compatible con la mayoría de navegadores modernos

## Pasos para Diagnosticar Problemas

1. **Verifica la consola del navegador** para errores relacionados con video
2. **Comprueba el estado de mediaStreamStatus** (debe ser "CONNECTED")
3. **Verifica que el video esté seleccionado** (botón "Select" en azul)
4. **Asegúrate de que el video esté reproduciendo** (botón "Play" presionado)
5. **Comprueba si hay mensajes de "Frame captured"** en la consola
6. **Intenta con un video diferente** para descartar problemas con el archivo

Si los problemas persisten, intenta reiniciar la aplicación o usar un navegador diferente.
