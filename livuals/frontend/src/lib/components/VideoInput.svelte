<script lang="ts">
  import 'rvfc-polyfill';

  import { onDestroy, onMount } from 'svelte';
  import {
    mediaStreamStatus,
    MediaStreamStatusEnum,
    onFrameChangeStore,
    mediaStream
  } from '$lib/mediaStream';
  import { canvasDimensions } from '$lib/canvasDimensions';
  
  export let width = $canvasDimensions.width;
  export let height = $canvasDimensions.height;
  
  // Usar el store para mantener el tamaño actualizado
  $: width = $canvasDimensions.width;
  $: height = $canvasDimensions.height;
  $: size = { width, height };

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let videoFrameCallbackId: number;

  // ajust the throttle time to your needs
  const THROTTLE = 1000 / 120;
  let selectedDevice: string = '';
  let videoIsReady = false;

  onMount(() => {
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = size.width;
    canvasEl.height = size.height;
  });
  $: {
    console.log(selectedDevice);
  }
  onDestroy(() => {
    if (videoFrameCallbackId) videoEl.cancelVideoFrameCallback(videoFrameCallbackId);
  });

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

  $: if ($mediaStreamStatus == MediaStreamStatusEnum.CONNECTED && videoIsReady) {
    videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
  }
</script>

<div class="relative mx-auto overflow-hidden rounded-lg border border-slate-300" style="max-width: {$canvasDimensions.width}px; max-height: {$canvasDimensions.height}px;">
  <div class="relative z-10 aspect-square w-full object-cover">
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
    <canvas bind:this={canvasEl} class="absolute left-0 top-0 aspect-square w-full object-cover"
    ></canvas>
    
    <!-- Mensaje de espera cuando no hay input activo -->
    {#if !$mediaStream || $mediaStreamStatus !== MediaStreamStatusEnum.CONNECTED}
      <div class="absolute inset-0 flex items-center justify-center bg-primary bg-opacity-80">
        <div class="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
          <p class="text-secondary font-medium">Waiting for input source...</p>
          <p class="text-secondary text-sm opacity-80 mt-1">Select a camera or screen to share</p>
        </div>
      </div>
    {/if}
  </div>
</div>
