# Guía de Implementación de Input Sources

## Resumen Rápido

Para agregar un nuevo input source al sistema Livuals, necesitas modificar estos archivos:

### 📁 Archivos a Modificar

1. **Tu Componente Nuevo** (crear)
   - `frontend/src/lib/modules/InputSources/TuInput.svelte`
   - Captura frames y los envía a `onFrameChangeStore`

2. **InputSourcesModule.svelte** (modificar)
   - `frontend/src/lib/modules/InputSourcesModule.svelte`
   - Agrega tu input a la lista y maneja la selección exclusiva

3. **mediaStream.ts** (ya existe, solo usar)
   - `frontend/src/lib/mediaStream.ts`
   - Usa los stores: `onFrameChangeStore`, `mediaStreamStatus`

## 🔄 Flujo de Datos

```
Tu Input Source
    ↓
  Captura frame (video/canvas)
    ↓
  Convierte a Blob JPEG (512x512)
    ↓
  onFrameChangeStore.set({ blob })
    ↓
  StreamDiffusion recibe el frame
    ↓
  Procesa y genera output
```

## ✅ Checklist de Implementación

### Paso 1: Crear Tu Componente

```typescript
// TuInput.svelte
import 'rvfc-polyfill'; // ¡IMPORTANTE!
import { 
  mediaStreamStatus, 
  MediaStreamStatusEnum,
  onFrameChangeStore 
} from '$lib/mediaStream';

export let isActive = false;

// Cuando se activa tu input:
mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);

// Enviar cada frame:
onFrameChangeStore.set({ blob: tuBlobJPEG });

// Cuando se desactiva:
mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
```

### Paso 2: Agregar a InputSourcesModule

```typescript
// 1. Importar
import TuInput from './InputSources/TuInput.svelte';

// 2. Agregar estado
let isTuInputActive = false;

// 3. Crear handlers
function handleTuInputSelected() {
  selectedSourceId = 'tuInput';
  isTuInputActive = true;
  
  // Desactivar otros
  isScreenActive = false;
  isGenerativeActive = false;
  isVideoActive = false;
  
  // Detener otros streams
  mediaStreamActions.stop();
  generativePatternActions.stop();
}

function handleTuInputDeselected() {
  if (selectedSourceId === 'tuInput') {
    selectedSourceId = null;
    isTuInputActive = false;
  }
}

// 4. Agregar en template
<div class="input-source-card card {selectedSourceId === 'tuInput' ? 'active' : ''}">
  <TuInput 
    isActive={isTuInputActive}
    on:tuInputSelected={handleTuInputSelected}
    on:tuInputDeselected={handleTuInputDeselected}
  />
</div>
```

### Paso 3: Actualizar Lógica de Cámara

En la tarjeta de cámara, agregar tu input a las exclusiones:

```svelte
class="... {selectedSourceId && 
  selectedSourceId !== 'screen' && 
  selectedSourceId !== 'generative' && 
  selectedSourceId !== 'video' && 
  selectedSourceId !== 'tuInput' ? 'active' : ''}"
```

## 🎯 Requisitos de Frames

- **Formato:** JPEG Blob
- **Tamaño:** 512x512 píxeles (cuadrado)
- **Calidad:** 1.0 (máxima)
- **FPS:** 30 recomendado
- **Crop:** Centro si no es cuadrado

## 🔧 Captura de Frames

### Para Video (cámara, archivo, pantalla)

```typescript
let videoElement: HTMLVideoElement;
let canvasElement: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

async function onFrameChange(now, metadata) {
  // Dibujar video en canvas (512x512, center crop)
  ctx.drawImage(videoElement, x0, y0, w0, h0, 0, 0, 512, 512);
  
  // Convertir a blob
  const blob = await new Promise<Blob>((resolve) => {
    canvasElement.toBlob(
      (blob) => resolve(blob as Blob),
      'image/jpeg',
      1
    );
  });
  
  // Enviar a StreamDiffusion
  onFrameChangeStore.set({ blob });
  
  // Siguiente frame
  videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
}
```

### Para Canvas (patrones generativos)

```typescript
function render() {
  // Dibujar en canvas
  // ...
  
  // Convertir y enviar
  canvasElement.toBlob((blob) => {
    if (blob) {
      onFrameChangeStore.set({ blob });
    }
  }, 'image/jpeg', 1);
  
  requestAnimationFrame(render);
}
```

## ⚠️ Errores Comunes

1. **No importar `rvfc-polyfill`**
   - Error: `requestVideoFrameCallback is null`
   - Solución: `import 'rvfc-polyfill';` como primera línea

2. **No actualizar `mediaStreamStatus`**
   - Síntoma: No aparece preview en "Input source"
   - Solución: `mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED)`

3. **No detener otros sources**
   - Síntoma: Múltiples inputs activos simultáneamente
   - Solución: Llamar `mediaStreamActions.stop()` y desactivar flags

4. **Canvas de tamaño incorrecto**
   - Síntoma: Frames distorsionados
   - Solución: Usar 512x512 píxeles

5. **No limpiar en onDestroy**
   - Síntoma: Memory leaks, callbacks activos
   - Solución: Cancelar callbacks en `onDestroy()`

6. **Olvidar excluir en lógica de cámara**
   - Síntoma: Cámara queda seleccionada junto con tu input
   - Solución: Agregar tu input a las condiciones de exclusión

## 📊 Estados del Sistema

```
mediaStreamStatus:
- INIT: Sin input activo
- CONNECTED: Input activo enviando frames
- DISCONNECTED: Input detenido

selectedSourceId:
- null: Ninguno seleccionado
- 'camera': Cámara activa
- 'screen': Pantalla compartida activa
- 'generative': Patrón generativo activo
- 'video': Archivo de video activo
- 'tuInput': Tu input activo
```

## 🧪 Testing

Verifica que:
- [ ] Solo un input está activo a la vez
- [ ] El preview aparece en "Input source"
- [ ] El punto verde muestra "Connected"
- [ ] Los frames llegan a `onFrameChangeStore`
- [ ] StreamDiffusion procesa los frames
- [ ] No hay errores en consola
- [ ] El cleanup funciona al cambiar de source

## 📖 Ejemplo Completo

Ver `FileVideoInput.svelte` para un ejemplo completo y funcional.

## 🆘 Debugging

Si algo no funciona:

1. **Abre la consola del navegador**
2. **Verifica el estado:**
   ```javascript
   // En la consola:
   $mediaStreamStatus // Debe ser "connected"
   $onFrameChangeStore // Debe tener un blob
   ```
3. **Revisa que solo un input esté activo**
4. **Confirma que el canvas sea 512x512**
5. **Verifica que los frames se estén generando**

## 📞 Contacto

Para más detalles técnicos, ver `INPUT_SOURCE_IMPLEMENTATION_GUIDE.md` (versión en inglés con más detalles).
