<script lang="ts">
  import 'rvfc-polyfill';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { 
    mediaStreamStatus, 
    MediaStreamStatusEnum,
    onFrameChangeStore 
  } from '$lib/mediaStream';
  
  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  // Referencias a elementos DOM
  let videoElement: HTMLVideoElement;
  let previewVideoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let fileInput: HTMLInputElement;
  
  // Estado del video
  let selectedFile: File | null = null;
  let videoUrl: string = '';
  let isPlaying: boolean = false;
  let videoIsReady: boolean = false;
  let videoFrameCallbackId: number | null = null;
  let currentTime: number = 0;
  let duration: number = 0;
  let volume: number = 1.0;
  
  // Configuración
  const CANVAS_SIZE = 512; // Tamaño cuadrado para StreamDiffusion
  const TARGET_FPS = 30;   // 30 FPS para StreamDiffusion
  const FRAME_INTERVAL = 1000 / TARGET_FPS;
  
  // Inicialización al montar el componente
  onMount(() => {
    console.log('VideoFileInput: Componente montado');
    
    // Inicializar canvas cuando esté disponible
    if (canvasElement && !ctx) {
      initializeCanvas();
    }
  });
  
  // Función para mostrar un fotograma estático del video
  function showStaticFrame() {
    if (videoElement && videoIsReady && previewVideoElement) {
      // Asegurarse de que el video tenga un tiempo válido
      if (videoElement.currentTime === 0) {
        videoElement.currentTime = 0.5; // Mostrar un frame que no sea el primero
      }
      
      // Copiar el tiempo actual al video de vista previa
      previewVideoElement.currentTime = videoElement.currentTime;
      
      // Forzar la actualización visual del video de vista previa
      setTimeout(() => {
        if (previewVideoElement && !isPlaying) {
          // Avanzar un poco y retroceder para forzar la actualización del frame
          const currentTime = previewVideoElement.currentTime;
          previewVideoElement.currentTime = currentTime + 0.01;
          setTimeout(() => {
            if (previewVideoElement) previewVideoElement.currentTime = currentTime;
          }, 50);
        }
      }, 100);
    }
  }
  
  // Limpieza al destruir el componente
  onDestroy(() => {
    stopFrameCapture();
    releaseVideoResources();
  });
  
  // Inicializar el canvas con el tamaño correcto
  function initializeCanvas() {
    if (!canvasElement) return;
    
    ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return;
    }
    
    canvasElement.width = CANVAS_SIZE;
    canvasElement.height = CANVAS_SIZE;
    console.log(`Canvas inicializado: ${CANVAS_SIZE}x${CANVAS_SIZE}`);
  }
  
  // Liberar recursos del video
  function releaseVideoResources() {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      videoUrl = '';
    }
    
    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
    }
  }
  
  // Manejar la selección de archivo
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      console.log('No se seleccionó ningún archivo');
      return;
    }
    
    console.log(`Archivo seleccionado: ${file.name} (${file.type})`);
    
    if (!file.type.startsWith('video/')) {
      console.error('El archivo seleccionado no es un video');
      return;
    }
    
    // Limpiar recursos previos
    releaseVideoResources();
    
    // Crear URL para el nuevo archivo
    selectedFile = file;
    videoUrl = URL.createObjectURL(file);
    
    // Reiniciar estados
    videoIsReady = false;
    isPlaying = false;
    currentTime = 0;
    
    // Cargar el video en el elemento
    if (videoElement) {
      videoElement.src = videoUrl;
      videoElement.load();
      console.log('Video cargado en el elemento');
    }
  }
  
  // Manejar cuando el video está listo
  function handleVideoLoaded() {
    if (!videoElement) return;
    
    duration = videoElement.duration;
    videoElement.volume = volume;
    videoIsReady = true;
    
    console.log(`Video listo - Duración: ${duration}s, Dimensiones: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
    
    // Mostrar un fotograma estático
    if (previewVideoElement) {
      // Avanzar un poco para mostrar un frame que no sea negro
      videoElement.currentTime = 0.5;
      setTimeout(showStaticFrame, 100);
    }
    
    // Si el video ya está activo, iniciar reproducción automáticamente
    if (isActive && !isPlaying) {
      playVideo();
    }
  }
  
  // Actualizar tiempo actual durante la reproducción
  function handleTimeUpdate() {
    if (videoElement) {
      currentTime = videoElement.currentTime;
      
      // Sincronizar el video de vista previa si está pausado
      if (previewVideoElement && !isPlaying && Math.abs(previewVideoElement.currentTime - videoElement.currentTime) > 0.5) {
        previewVideoElement.currentTime = videoElement.currentTime;
      }
    }
  }
  
  // Manejar cambio en la posición del video
  function handleSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const newTime = parseFloat(input.value);
    
    if (videoElement) {
      videoElement.currentTime = newTime;
      currentTime = newTime;
    }
  }
  
  // Manejar cambio de volumen
  function handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value);
    
    if (videoElement) {
      videoElement.volume = volume;
    }
  }
  
  // Reproducir video
  async function playVideo() {
    if (!videoElement || !videoIsReady) {
      console.error('El video no está listo para reproducirse');
      return;
    }
    
    try {
      await videoElement.play();
      isPlaying = true;
      console.log('Reproducción iniciada');
      
      // Iniciar captura de frames si está activo
      if (isActive) {
        startFrameCapture();
      }
    } catch (error) {
      console.error('Error al reproducir el video:', error);
    }
  }
  
  // Pausar video
  function pauseVideo() {
    if (!videoElement) return;
    
    videoElement.pause();
    isPlaying = false;
    console.log('Video pausado');
  }
  
  // Alternar entre reproducir y pausar
  function togglePlayPause() {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }
  
  // Iniciar captura de frames
  function startFrameCapture() {
    if (!videoElement || !ctx || !videoIsReady || !isPlaying) {
      console.log('No se puede iniciar la captura de frames - condiciones no cumplidas');
      return;
    }
    
    if (videoFrameCallbackId !== null) {
      console.log('La captura de frames ya está activa');
      return;
    }
    
    console.log('Iniciando captura de frames');
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(captureVideoFrame);
  }
  
  // Detener captura de frames
  function stopFrameCapture() {
    if (videoFrameCallbackId !== null && videoElement) {
      videoElement.cancelVideoFrameCallback(videoFrameCallbackId);
      videoFrameCallbackId = null;
      console.log('Captura de frames detenida');
    }
  }
  
  // Capturar un frame del video
  let lastFrameTime = 0;
  
  async function captureVideoFrame(now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
    // Limitar la frecuencia de captura
    if (now - lastFrameTime < FRAME_INTERVAL) {
      videoFrameCallbackId = videoElement.requestVideoFrameCallback(captureVideoFrame);
      return;
    }
    
    if (!ctx || !videoElement || !canvasElement) {
      console.error('Faltan elementos necesarios para la captura de frames');
      return;
    }
    
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn('Dimensiones de video no disponibles');
      videoFrameCallbackId = videoElement.requestVideoFrameCallback(captureVideoFrame);
      return;
    }
    
    // Calcular recorte central para mantener relación de aspecto cuadrada
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    
    if (videoWidth > videoHeight) {
      // Video más ancho que alto - recortar los lados
      sourceWidth = videoHeight;
      sourceX = (videoWidth - videoHeight) / 2;
    } else {
      // Video más alto que ancho - recortar arriba y abajo
      sourceHeight = videoWidth;
      sourceY = (videoHeight - videoWidth) / 2;
    }
    
    try {
      // Dibujar frame en el canvas con recorte central
      ctx.drawImage(
        videoElement,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, CANVAS_SIZE, CANVAS_SIZE
      );
      
      // Convertir a JPEG blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasElement.toBlob(
          (blob) => {
            resolve(blob as Blob);
          },
          'image/jpeg',
          0.95 // Calidad
        );
      });
      
      // Enviar el frame al store para que StreamDiffusion lo procese
      onFrameChangeStore.set({ blob });
      
      // Actualizar tiempo del último frame
      lastFrameTime = now;
    } catch (error) {
      console.error('Error al capturar frame:', error);
    }
    
    // Programar la siguiente captura
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(captureVideoFrame);
  }
  
  // Activar/desactivar la entrada de video
  async function toggleVideoInput() {
    const wasActive = isActive;
    isActive = !isActive;
    console.log(`VideoFileInput: ${isActive ? 'Activado' : 'Desactivado'}`);
    
    if (isActive) {
      // Establecer estado de conexión
      mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
      console.log('Estado de mediaStream: CONNECTED');
      
      // Notificar al componente padre
      dispatch('videoSelected');
      
      // Forzar la actualización de la vista previa
      setTimeout(showStaticFrame, 100);
      
      // Si el video está listo pero no reproduciendo, iniciar reproducción
      if (videoIsReady && !isPlaying && videoElement) {
        playVideo();
      }
    } else {
      // Detener captura de frames
      stopFrameCapture();
      
      // Pausar video si está reproduciendo
      if (isPlaying) {
        pauseVideo();
      }
      
      // Establecer estado de desconexión
      mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
      console.log('Estado de mediaStream: DISCONNECTED');
      
      // Notificar al componente padre
      dispatch('videoDeselected');
    }
    
    // Forzar la actualización de la UI
    if (wasActive !== isActive) {
      // Pequeño retraso para asegurar que la UI se actualice
      setTimeout(() => {
        if (previewVideoElement) {
          // Forzar la actualización del video
          const currentSrc = previewVideoElement.src;
          if (currentSrc) {
            previewVideoElement.src = '';
            setTimeout(() => {
              if (previewVideoElement) previewVideoElement.src = currentSrc;
            }, 10);
          }
        }
      }, 50);
    }
  }
  
  // Formatear tiempo en minutos:segundos
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Reaccionar a cambios en el estado de reproducción y activación
  $: if (isActive && videoIsReady && isPlaying && !videoFrameCallbackId) {
    console.log('Condiciones cumplidas para iniciar captura de frames');
    startFrameCapture();
  }
  
  $: if (!isActive || !isPlaying) {
    stopFrameCapture();
  }
</script>

<div class="w-full flex flex-col gap-3">
  <!-- Cabecera con título e icono -->
  <div class="w-full flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="text-xl bg-blue-900 p-2 rounded-full text-white">
        🎬
      </div>
      <div class="text-left">
        <div class="font-medium text-secondary text-lg">Video File</div>
        <div class="text-sm text-secondary">
          {#if selectedFile}
            <span class="font-bold">{selectedFile.name}</span>
          {:else}
            <span class="opacity-80">No file selected</span>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Botón de selección -->
    <div class="relative">
      <button 
        class="btn {isActive ? 'btn-primary' : 'btn-secondary'} btn-sm"
        on:click={(e) => {
          e.stopPropagation();
          toggleVideoInput();
        }}
        disabled={!selectedFile || !videoIsReady}
        title={!selectedFile ? 'Select a video file first' : !videoIsReady ? 'Video is loading...' : isActive ? 'Deactivate video input' : 'Activate video input'}
      >
        {isActive ? 'Selected' : 'Select'}
      </button>
    </div>
  </div>
  
  <!-- Contenido principal -->
  <div class="mt-2 border-t pt-2">
    <div class="flex flex-col gap-2">
      <!-- Selector de archivo -->
      <div>
        <label for="video-file-input" class="block text-secondary text-sm mb-1">Select Video File:</label>
        <input
          id="video-file-input"
          type="file"
          accept="video/*"
          bind:this={fileInput}
          on:change={handleFileSelect}
          class="file-input w-full"
        />
      </div>
      
      <!-- Vista previa del video (siempre visible cuando hay un video cargado) -->
      {#if selectedFile && videoIsReady}
        <div class="mt-2 border border-slate-600 rounded overflow-hidden">
          <div class="flex justify-between items-center p-1 bg-slate-700">
            <div class="text-xs text-white font-bold">Vista previa</div>
            {#if isActive && isPlaying}
              <div class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Streaming</div>
            {:else if isActive}
              <div class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Listo</div>
            {:else}
              <div class="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">Inactivo</div>
            {/if}
          </div>
          <div class="relative aspect-video w-full bg-black" style="min-height: 150px;">
            <video
              bind:this={previewVideoElement}
              src={videoUrl}
              class="w-full h-full object-contain"
              autoplay={isActive && isPlaying}
              loop
              muted
              playsinline
              style="background-color: black; min-height: 150px;"
              on:loadeddata={() => {
                if (!isPlaying) {
                  showStaticFrame();
                }
              }}
              on:click={() => {
                if (isActive && !isPlaying) {
                  togglePlayPause();
                }
              }}
            ></video>
          </div>
        </div>
      {/if}
      
      <!-- Video y canvas (ocultos pero funcionales) -->
      <video
        bind:this={videoElement}
        on:loadedmetadata={handleVideoLoaded}
        on:timeupdate={handleTimeUpdate}
        on:ended={() => {
          isPlaying = false;
        }}
        style="display: none;"
        loop
        playsinline
        preload="auto"
      >
        <track kind="captions" />
      </video>
      
      <canvas bind:this={canvasElement} style="display: none;"></canvas>
      
      <!-- Indicador de estado - Ahora más visible -->
      <div class="text-sm p-2 rounded {!selectedFile ? 'bg-gray-700' : !videoIsReady ? 'bg-yellow-700' : isActive && isPlaying ? 'bg-green-700' : isActive ? 'bg-blue-700' : 'bg-indigo-700'} text-white">
        {#if !selectedFile}
          📁 Selecciona un archivo de video
        {:else if !videoIsReady}
          ⏳ Cargando video...
        {:else if isActive && isPlaying}
          ▶️ Reproduciendo - Enviando frames a StreamDiffusion
        {:else if isActive}
          ⏸️ Listo - Presiona Play para iniciar
        {:else}
          ✅ Video cargado - Presiona "Select" para activar
        {/if}
      </div>
      
      <!-- Controles de reproducción (visibles cuando hay un video cargado) -->
      {#if selectedFile && videoIsReady}
        <div class="flex flex-col gap-2 mt-1">
          <!-- Botón Play/Pause -->
          <button
            class="btn {isPlaying ? 'btn-secondary' : 'btn-primary'} btn-sm"
            on:click={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            disabled={!isActive}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <!-- Línea de tiempo -->
          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-xs text-secondary">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              on:input={handleSeek}
              class="slider"
              disabled={!isActive}
            />
          </div>
          
          <!-- Control de volumen -->
          <div class="flex items-center gap-2">
            <span class="text-secondary text-xs">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              on:input={handleVolumeChange}
              class="slider flex-grow"
            />
            <span class="text-secondary text-xs">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      {/if}
      
      <!-- La vista previa ahora está arriba, después del selector de archivo -->
    </div>
  </div>
</div>

<style>
  .file-input {
    font-size: 0.875rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.375rem;
    background-color: var(--bg-primary, #ffffff);
    color: var(--text-secondary, #374151);
  }
  
  .file-input:hover {
    border-color: var(--border-hover, #d1d5db);
  }
  
  .file-input:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  /* Estilos para sliders */
  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--bg-secondary, #e5e7eb);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    cursor: pointer;
    border: none;
  }
  
  .slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    cursor: pointer;
    border: none;
  }
  
  .slider:disabled {
    opacity: 0.5;
  }
</style>
