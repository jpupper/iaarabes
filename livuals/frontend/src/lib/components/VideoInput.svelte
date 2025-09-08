<script lang="ts">
  import 'rvfc-polyfill';

  import { onDestroy, onMount } from 'svelte';
  import {
    mediaStreamStatus,
    MediaStreamStatusEnum,
    onFrameChangeStore,
    mediaStream
  } from '$lib/mediaStream';
  import { selectedInputSource, type InputSource } from '$lib/store';
  export let width = 512;
  export let height = 512;
  const size = { width, height };

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let iframeEl: HTMLIFrameElement;
  let videoFrameCallbackId: number;
  
  // Ajustar la frecuencia de captura de frames
  const THROTTLE = 1000 / 120;
  
  let selectedDevice: string = '';
  let videoIsReady = false;
  let iframeIsReady = false;
  
  // Variables para controlar el tipo de fuente
  $: sourceType = $selectedInputSource?.type || null;
  $: sourceUrl = $selectedInputSource?.url || '';

  onMount(() => {
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = size.width;
    canvasEl.height = size.height;
  });
  // Conectar el video con mediaStream cuando esté disponible
  $: if (videoEl) {
    videoEl.srcObject = $mediaStream;
  }
  
  // Capturar frames de video (cámara o pantalla)
  let lastMillis = 0;
  async function onFrameChange(now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
    if (now - lastMillis < THROTTLE) {
      if (videoEl) videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
      return;
    }
    lastMillis = now;
    
    if (!videoEl || !ctx) return;
    
    try {
      const videoWidth = videoEl.videoWidth;
      const videoHeight = videoEl.videoHeight;
      
      if (videoWidth && videoHeight) {
        let height0 = videoHeight;
        let width0 = videoWidth;
        let x0 = 0;
        let y0 = 0;
        
        if (videoWidth > videoHeight) {
          width0 = videoHeight;
          x0 = (videoWidth - videoHeight) / 2;
        } else {
          height0 = videoWidth;
          y0 = (videoHeight - videoWidth) / 2;
        }
        
        ctx.drawImage(videoEl, x0, y0, width0, height0, 0, 0, size.width, size.height);
        
        // Convertir a blob y actualizar el store
        canvasEl.toBlob(
          (blob) => {
            if (blob) {
              onFrameChangeStore.set({ blob });
            }
          },
          'image/jpeg',
          0.95
        );
      }
    } catch (error) {
      console.error('Error al capturar frame de video:', error);
    }
    
    if (videoEl) videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
  }
  
  // Capturar contenido del iframe
  function captureIframe() {
    if (!iframeEl || !ctx) return;
    
    try {
      // Mostrar el iframe real
      iframeEl.style.display = 'block';
      iframeEl.style.width = `${size.width}px`;
      iframeEl.style.height = `${size.height}px`;
      
      // Actualizar el blob con una imagen vacía para que streamdiffusion sepa que hay una fuente activa
      canvasEl.toBlob(
        (blob) => {
          if (blob) {
            onFrameChangeStore.set({ blob });
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error al mostrar iframe:', error);
    }
  }
  
  // Manejar cambios en el tipo de fuente
  $: {
    if (sourceType === 'camera' || sourceType === 'screen') {
      // Para cámara o pantalla, usar video y canvas
      if (videoEl && videoIsReady) {
        videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
      }
    } else if (sourceType === 'iframe' || sourceType === 'youtube') {
      // Para iframe o YouTube, mostrar el iframe directamente
      captureIframe();
    }
  }
  
  // Limpiar al destruir el componente
  onDestroy(() => {
    if (videoFrameCallbackId && videoEl) videoEl.cancelVideoFrameCallback(videoFrameCallbackId);
  });
</script>

<div class="relative mx-auto max-w-lg overflow-hidden rounded-lg border border-slate-300">
  {#if sourceType === 'camera' || sourceType === 'screen'}
    <!-- Para cámara y pantalla compartida -->
    <div class="relative z-10 aspect-square w-full object-cover">
      <video
        class="pointer-events-none aspect-square w-full object-cover"
        bind:this={videoEl}
        on:loadeddata={() => { videoIsReady = true; }}
        playsinline
        autoplay
        muted
        loop
      ></video>
      <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover"></canvas>
    </div>
  {:else if sourceType === 'iframe' || sourceType === 'youtube'}
    <!-- Para iframe y YouTube -->
    <div class="relative z-10 aspect-square w-full object-cover">
      <iframe
        bind:this={iframeEl}
        src={sourceUrl}
        class="aspect-square w-full object-cover"
        title="Embedded content"
        on:load={() => { iframeIsReady = true; }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover hidden"></canvas>
    </div>
  {:else}
    <!-- Cuando no hay fuente seleccionada -->
    <div class="relative z-10 aspect-square w-full object-cover bg-gray-800 flex items-center justify-center">
      <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover hidden"></canvas>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 448" class="w-40 p-5 opacity-20">
        <path
          fill="currentColor"
          d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256zm-45.7 48A178.3 178.3 0 0 0 0 482.3 29.7 29.7 0 0 0 29.7 512h388.6a29.7 29.7 0 0 0 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3h-91.4z"
        />
      </svg>
    </div>
  {/if}
</div>
