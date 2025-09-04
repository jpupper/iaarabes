<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { iframeUrl, onFrameChangeStore } from '$lib/mediaStream';

  export let width = 512;
  export let height = 512;

  let iframeElement: HTMLIFrameElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let captureInterval: number;

  onMount(() => {
    // Inicializar el canvas para capturar frames
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = width;
    canvasEl.height = height;

    // Iniciar la captura de frames cuando el iframe esté cargado
    if (iframeElement) {
      iframeElement.onload = () => {
        startFrameCapture();
      };
    }
  });

  function startFrameCapture() {
    // Capturar frames cada 100ms (10fps)
    if (captureInterval) {
      clearInterval(captureInterval);
    }
    
    captureInterval = setInterval(async () => {
      try {
        // No podemos dibujar directamente el iframe en el canvas debido a restricciones de seguridad
        // En su lugar, usamos un enfoque alternativo para mostrar la URL
        
        // Crear un mensaje de placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Dibujar texto indicando la URL cargada
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Página web cargada:', width/2, height/2 - 20);
        ctx.fillText($iframeUrl, width/2, height/2 + 20);
        
        // Convertir el canvas a blob
        const blob = await new Promise<Blob>((resolve) => {
          canvasEl.toBlob(
            (blob) => {
              resolve(blob as Blob);
            },
            'image/jpeg',
            0.95
          );
        });
        
        // Actualizar el store con el nuevo frame
        onFrameChangeStore.set({ blob });
      } catch (error) {
        console.error('Error capturing iframe frame:', error);
      }
    }, 100);
  }

  onDestroy(() => {
    if (captureInterval) {
      clearInterval(captureInterval);
    }
  });
</script>

<div class="relative mx-auto overflow-hidden rounded-lg border border-slate-300" style="max-width: {width}px;">
  <div class="relative z-10 aspect-square w-full">
    <iframe 
      bind:this={iframeElement} 
      src={$iframeUrl} 
      title="Web Content" 
      class="absolute top-0 left-0 w-full h-full"
      sandbox="allow-scripts allow-same-origin"
      referrerpolicy="no-referrer"
    ></iframe>
    <canvas bind:this={canvasEl} class="hidden"></canvas>
  </div>
</div>
