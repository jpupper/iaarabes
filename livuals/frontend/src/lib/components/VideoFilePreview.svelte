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
    console.log('✅ VideoFilePreview mounted - This component should render the video in Input source');
    if (canvasEl) {
      ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
      canvasEl.width = size.width;
      canvasEl.height = size.height;
      console.log('✅ VideoFilePreview: Canvas initialized:', size.width, 'x', size.height);
      startRendering();
    } else {
      console.error('❌ VideoFilePreview: canvasEl is null!');
    }
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  let frameCount = 0;
  
  function startRendering() {
    function render() {
      if ($onFrameChangeStore && $onFrameChangeStore.blob && ctx && canvasEl) {
        frameCount++;
        if (frameCount === 1) {
          console.log('✅ VideoFilePreview: First frame received, rendering to canvas');
        }
        if (frameCount % 30 === 0) {
          console.log(`✅ VideoFilePreview: Rendered ${frameCount} frames`);
        }
        
        const img = new Image();
        const url = URL.createObjectURL($onFrameChangeStore.blob);
        
        img.onload = () => {
          if (ctx && canvasEl) {
            ctx.drawImage(img, 0, 0, size.width, size.height);
          }
          URL.revokeObjectURL(url);
        };
        
        img.onerror = (error) => {
          console.error('❌ VideoFilePreview: Error loading frame image:', error);
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      } else if (frameCount === 0) {
        console.warn('⚠️ VideoFilePreview: Waiting for frames from onFrameChangeStore...');
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
