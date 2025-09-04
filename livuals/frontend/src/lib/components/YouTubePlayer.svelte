<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { youtubeUrl, onFrameChangeStore } from '$lib/mediaStream';
  import '../types/youtube';

  export let width = 512;
  export let height = 512;

  let player: any;
  let playerElement: HTMLDivElement;
  let videoId: string = '';
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let captureInterval: number;

  // Función para extraer el ID del video de YouTube de una URL
  function extractYouTubeID(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : '';
  }

  // Inicializar el reproductor de YouTube cuando cambia la URL
  $: if ($youtubeUrl) {
    videoId = extractYouTubeID($youtubeUrl);
    if (videoId && typeof window.YT !== 'undefined' && window.YT.Player) {
      initPlayer();
    }
  }

  onMount(() => {
    // Inicializar el canvas para capturar frames
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = width;
    canvasEl.height = height;

    // Cargar la API de YouTube
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        if ($youtubeUrl) {
          videoId = extractYouTubeID($youtubeUrl);
          if (videoId) {
            initPlayer();
          }
        }
      };
    } else if (typeof YT !== 'undefined' && YT.Player && $youtubeUrl) {
      videoId = extractYouTubeID($youtubeUrl);
      if (videoId) {
        initPlayer();
      }
    }
  });

  function initPlayer() {
    if (player) {
      player.destroy();
    }

    player = new window.YT.Player(playerElement.id, {
      height: height,
      width: width,
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'controls': 0,
        'showinfo': 0,
        'rel': 0,
        'loop': 1,
        'playlist': videoId,
        'mute': 1
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  function onPlayerReady(event: any) {
    event.target.playVideo();
    // Iniciar la captura de frames
    startFrameCapture();
  }

  function onPlayerStateChange(event: any) {
    // Si el video termina, reiniciarlo
    if (event.data === window.YT.PlayerState.ENDED) {
      event.target.playVideo();
    }
  }

  function startFrameCapture() {
    // Capturar frames cada 100ms (10fps)
    if (captureInterval) {
      clearInterval(captureInterval);
    }
    
    captureInterval = setInterval(async () => {
      if (player && player.getPlayerState && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
        try {
          // No podemos dibujar directamente el iframe en el canvas debido a restricciones de seguridad
          // En su lugar, usamos un enfoque alternativo para capturar frames
          
          // Crear una imagen temporal para capturar el thumbnail del video
          const img = new Image();
          // Usar el ID del video para obtener una miniatura de YouTube
          img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          img.crossOrigin = 'anonymous';
          
          img.onload = async () => {
            // Dibujar la imagen en el canvas
            ctx.drawImage(img, 0, 0, width, height);
            
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
          };
        } catch (error) {
          console.error('Error capturing YouTube frame:', error);
        }
      }
    }, 100);
  }

  onDestroy(() => {
    if (captureInterval) {
      clearInterval(captureInterval);
    }
    if (player) {
      player.destroy();
    }
  });
</script>

<div class="relative mx-auto overflow-hidden rounded-lg border border-slate-300" style="max-width: {width}px;">
  <div class="relative z-10 aspect-square w-full">
    <div bind:this={playerElement} id="youtube-player-container" class="absolute top-0 left-0 w-full h-full"></div>
    <canvas bind:this={canvasEl} class="hidden"></canvas>
  </div>
</div>
