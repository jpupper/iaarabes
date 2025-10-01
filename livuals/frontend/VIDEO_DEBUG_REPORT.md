# Video File Input - Debug Report

## Problemas Identificados y Solucionados

### 🔴 Problema 1: Video no se reproduce
**Causa:** 
- La función `togglePlayPause()` no manejaba errores de la promesa `.play()`
- No había logs para diagnosticar problemas
- El estado `isPlaying` se actualizaba antes de confirmar que el video se reprodujo

**Solución:**
```typescript
async function togglePlayPause() {
  try {
    if (isPlaying) {
      videoElement.pause();
      isPlaying = false;
    } else {
      await videoElement.play(); // Esperar la promesa
      isPlaying = true;
      // Iniciar captura de frames
      if (videoIsReady && isActive && ctx) {
        videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
      }
    }
  } catch (error) {
    console.error('Error toggling video playback:', error);
    isPlaying = false;
  }
}
```

### 🔴 Problema 2: Captura de frames no se inicia
**Causa:**
- La declaración reactiva solo se ejecutaba una vez
- No se reiniciaba si las condiciones cambiaban
- Faltaba verificación de `ctx` (canvas context)

**Solución:**
```typescript
// Declaración reactiva mejorada
$: if (videoElement && isPlaying && videoIsReady && isActive && ctx && !videoFrameCallbackId) {
  console.log('Reactive: Starting frame capture');
  videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
}
```

### 🔴 Problema 3: Canvas no inicializado
**Causa:**
- `onMount` podía ejecutarse antes de que el canvas estuviera en el DOM
- No había inicialización reactiva

**Solución:**
```typescript
// Inicialización reactiva del canvas
$: if (canvasElement && !ctx) {
  console.log('Initializing canvas...');
  ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
  canvasElement.width = 512;
  canvasElement.height = 512;
}
```

### 🔴 Problema 4: Falta de validación en onFrameChange
**Causa:**
- No se verificaba que los elementos necesarios existieran
- No se validaban las dimensiones del video

**Solución:**
```typescript
async function onFrameChange(now, metadata) {
  // Validar elementos requeridos
  if (!ctx || !videoElement || !canvasElement) {
    console.error('Missing required elements');
    return;
  }
  
  // Validar dimensiones del video
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;
  
  if (videoWidth === 0 || videoHeight === 0) {
    console.warn('Video dimensions not ready');
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
    return;
  }
  
  // ... resto del código
}
```

### 🔴 Problema 5: Auto-start del video al seleccionar
**Causa:**
- El video no se iniciaba automáticamente al hacer clic en "Select"
- El usuario tenía que hacer clic en "Play" manualmente

**Solución:**
```typescript
async function toggleVideoInput() {
  if (isActive) {
    // Auto-start video si está listo
    if (selectedFile && videoElement && videoIsReady && !isPlaying) {
      console.log('Auto-starting video playback...');
      await videoElement.play();
      isPlaying = true;
      
      // Iniciar captura de frames
      if (ctx) {
        videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
      }
    }
  }
}
```

## Logs Agregados para Debugging

### Inicialización
- ✅ `FileVideoInput mounted`
- ✅ `Initializing canvas...`
- ✅ `Canvas initialized: 512 x 512`

### Selección de Archivo
- ✅ `File selected: [nombre] [tipo]`
- ✅ `Video URL created: [url]`
- ✅ `Video element loaded`
- ✅ `Video loaded - Duration: [X] Dimensions: [WxH]`

### Activación del Input
- ✅ `Toggle video input - isActive: true/false`
- ✅ `Media stream status set to CONNECTED/DISCONNECTED`
- ✅ `Auto-starting video playback...`
- ✅ `Video auto-started successfully`
- ✅ `Frame capture started`

### Reproducción
- ✅ `Video playing`
- ✅ `Video paused`
- ✅ `Starting frame capture...`
- ✅ `Reactive: Starting frame capture`

### Captura de Frames
- ⚠️ `Missing required elements for frame capture` (error)
- ⚠️ `Video dimensions not ready: [WxH]` (warning)
- ❌ `Error capturing frame: [error]` (error)

### Limpieza
- ✅ `Video stopped`
- ✅ `Frame capture cancelled`

## Cómo Usar los Logs para Debugging

1. **Abrir la consola del navegador** (F12)
2. **Seleccionar un archivo de video**
   - Deberías ver: "File selected", "Video URL created", "Video loaded"
3. **Hacer clic en "Select"**
   - Deberías ver: "Toggle video input - isActive: true", "Media stream status set to CONNECTED"
   - Si el video está listo: "Auto-starting video playback", "Video auto-started successfully"
4. **Verificar captura de frames**
   - Deberías ver: "Frame capture started" o "Reactive: Starting frame capture"
5. **Si algo falla:**
   - Busca mensajes de error en rojo
   - Verifica que todas las etapas anteriores se completaron
   - Revisa warnings sobre dimensiones o elementos faltantes

## Checklist de Verificación

Cuando el video funciona correctamente, deberías ver esta secuencia en la consola:

```
✅ FileVideoInput mounted
✅ Initializing canvas...
✅ Canvas initialized: 512 x 512
✅ File selected: video.mp4 video/mp4
✅ Video URL created: blob:http://...
✅ Video element loaded
✅ Video loaded - Duration: 10.5 Dimensions: 1920x1080
✅ Toggle video input - isActive: true
✅ Media stream status set to CONNECTED
✅ Auto-starting video playback...
✅ Video auto-started successfully
✅ Frame capture started
```

## Errores Comunes y Soluciones

### Error: "Missing required elements for frame capture"
**Causa:** Canvas no inicializado o video element no disponible
**Solución:** Verificar que el canvas esté en el DOM y que `ctx` esté inicializado

### Error: "Video dimensions not ready: 0 x 0"
**Causa:** Video aún no ha cargado sus metadatos
**Solución:** Esperar al evento `loadedmetadata` antes de iniciar captura

### Error: "Error toggling video playback: NotAllowedError"
**Causa:** El navegador bloquea autoplay sin interacción del usuario
**Solución:** El usuario debe hacer clic en "Play" manualmente

### Warning: "Video element not available yet"
**Causa:** Se seleccionó archivo antes de que el componente se montara completamente
**Solución:** El video se cargará cuando el elemento esté disponible

## Próximos Pasos

Si el video aún no funciona después de estos cambios:

1. **Verificar la consola** - Buscar mensajes de error específicos
2. **Probar con diferentes videos** - Algunos formatos pueden no ser compatibles
3. **Verificar permisos del navegador** - Algunos navegadores bloquean autoplay
4. **Revisar el error de SVG** - Puede ser un problema no relacionado con el video

## Nota sobre el Error de SVG

El error `<svg> attribute width: Expected length, "NaN"` probablemente NO está relacionado con el video file input. Este error viene de otro componente que tiene un SVG con un atributo `width` que recibe `NaN`.

Para encontrarlo:
1. Buscar en la consola la línea exacta del error
2. Revisar componentes que usan SVG con width dinámico
3. Verificar que las variables usadas para width no sean `undefined` o `NaN`
