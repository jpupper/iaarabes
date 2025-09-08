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
  let videoFrameCallbackId: number;
  let iframeEl: HTMLIFrameElement;

  // ajust the throttle time to your needs
  const THROTTLE = 1000 / 120;
  let selectedDevice: string = '';
  let videoIsReady = false;

  // Variables para controlar el tipo de fuente
  let currentSource: InputSource | null = null;
  $: sourceType = $selectedInputSource?.type || null;
  $: sourceUrl = $selectedInputSource?.url || '';

  onMount(() => {
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = size.width;
    canvasEl.height = size.height;
  });
  $: {
    console.log(selectedDevice);
  }
  // onDestroy se ha movido abajo

  $: if (videoEl) {
    videoEl.srcObject = $mediaStream;
  }
  let lastMillis = 0;
  async function onFrameChange(now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
    if (now - lastMillis < THROTTLE) {
      videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
      return;
    }
    const videoWidth = videoEl.videoWidth;
    const videoHeight = videoEl.videoHeight;
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
    const blob = await new Promise<Blob>((resolve) => {
      canvasEl.toBlob(
        (blob) => {
          resolve(blob as Blob);
        },
        'image/jpeg',
        1
      );
    });
    onFrameChangeStore.set({ blob });
    videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
  }

  $: if ($mediaStreamStatus == MediaStreamStatusEnum.CONNECTED && videoIsReady && videoEl) {
    videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
  }
  
  // Capturar frames de iframe y YouTube
  let iframeCapturerId: number;
  let placeholderImage: HTMLImageElement;
  
  // Crear una imagen placeholder para iframe y YouTube
  onMount(() => {
    placeholderImage = new Image();
    placeholderImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiBmaWxsPSIjZmZmIj5JZnJhbWUgQ29udGVudDwvdGV4dD48L3N2Zz4=';
    placeholderImage.onload = () => {
      if (sourceType === 'iframe' || sourceType === 'youtube') {
        generatePlaceholderFrame();
      }
    };
  });
  
  function generatePlaceholderFrame() {
    if (!ctx || !placeholderImage || (sourceType !== 'iframe' && sourceType !== 'youtube')) return;
    
    try {
      // Limpiar el canvas
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, size.width, size.height);
      
      // Dibujar la imagen placeholder
      ctx.drawImage(placeholderImage, 0, 0, size.width, size.height);
      
      // Agregar texto con el tipo de contenido y URL
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      
      const contentType = sourceType === 'iframe' ? 'Iframe Content' : 'YouTube Video';
      ctx.fillText(contentType, size.width / 2, size.height / 2 - 20);
      
      const displayUrl = sourceUrl.length > 30 ? sourceUrl.substring(0, 30) + '...' : sourceUrl;
      ctx.fillText(displayUrl, size.width / 2, size.height / 2 + 20);
      
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
    } catch (error) {
      console.error('Error al generar frame placeholder:', error);
    }
    
    // Programar la próxima generación
    iframeCapturerId = window.setTimeout(generatePlaceholderFrame, 1000 / 5); // 5fps es suficiente para un placeholder
  }
  
  // Iniciar o detener la captura según el tipo de fuente
  $: {
    if (sourceType === 'iframe' || sourceType === 'youtube') {
      // Limpiar cualquier captura anterior
      if (iframeCapturerId) {
        clearTimeout(iframeCapturerId);
      }
      
      // Iniciar nueva captura después de un breve retraso para que el iframe se cargue
      setTimeout(() => {
        generatePlaceholderFrame();
      }, 500);
    } else if (iframeCapturerId) {
      // Detener la captura si no es iframe o YouTube
      clearTimeout(iframeCapturerId);
    }
  }
  
  // Limpiar al destruir el componente
  onDestroy(() => {
    if (videoFrameCallbackId && videoEl) videoEl.cancelVideoFrameCallback(videoFrameCallbackId);
    if (iframeCapturerId) clearTimeout(iframeCapturerId);
  });
</script>

<div class="relative mx-auto max-w-lg overflow-hidden rounded-lg border border-slate-300">
  <div class="relative z-10 aspect-square w-full object-cover">
    {#if sourceType === 'iframe' || sourceType === 'youtube'}
      <iframe
        bind:this={iframeEl}
        src={sourceUrl}
        class="aspect-square w-full object-cover"
        title="Embedded content"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <!-- Canvas oculto para capturar frames del iframe -->
      <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover hidden"></canvas>
    {:else}
      <video
        class="pointer-events-none aspect-square w-full object-cover"
        bind:this={videoEl}
        on:loadeddata={() => {
          videoIsReady = true;
        }}
        playsinline
        autoplay
        muted
        loop
      ></video>
      <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover"></canvas>
    {/if}
  </div>
  <div class="absolute left-0 top-0 flex aspect-square w-full items-center justify-center {sourceType ? 'hidden' : ''}">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 448" class="w-40 p-5 opacity-20">
      <path
        fill="currentColor"
        d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256zm-45.7 48A178.3 178.3 0 0 0 0 482.3 29.7 29.7 0 0 0 29.7 512h388.6a29.7 29.7 0 0 0 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3h-91.4z"
      />
    </svg>
  </div>
</div>
