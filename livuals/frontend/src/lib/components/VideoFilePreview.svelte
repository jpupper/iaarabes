<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { onFrameChangeStore } from '$lib/mediaStream';
  
  export let width = 512;
  export let height = 512;
  
  const size = { width, height };

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrameId: number;

  onMount(() => {
    console.log('VideoFilePreview mounted');
    if (canvasEl) {
      ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
      canvasEl.width = size.width;
      canvasEl.height = size.height;
      console.log('Canvas initialized for preview:', size.width, 'x', size.height);
      startRendering();
    }
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  function startRendering() {
    function render() {
      if ($onFrameChangeStore && $onFrameChangeStore.blob && ctx && canvasEl) {
        const img = new Image();
        const url = URL.createObjectURL($onFrameChangeStore.blob);
        
        img.onload = () => {
          if (ctx && canvasEl) {
            ctx.drawImage(img, 0, 0, size.width, size.height);
          }
          URL.revokeObjectURL(url);
        };
        
        img.onerror = (error) => {
          console.error('Error loading frame image:', error);
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      }
      
      animationFrameId = requestAnimationFrame(render);
    }
    
    render();
  }
</script>

<div class="relative overflow-hidden rounded-lg border border-slate-300" style="max-width: {width}px;">
  <canvas 
    bind:this={canvasEl} 
    class="w-full aspect-square object-cover"
    style="width: {width}px; height: {height}px;"
  ></canvas>
</div>
