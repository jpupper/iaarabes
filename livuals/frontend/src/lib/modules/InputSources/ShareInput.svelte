<script lang="ts">
  import { mediaStreamActions, mediaStreamStatus, MediaStreamStatusEnum, mediaStream, onFrameChangeStore } from '$lib/mediaStream';
  import { onMount, onDestroy } from 'svelte';
  import 'rvfc-polyfill';
  import Screen from '$lib/icons/screen.svelte';

  export let width = 512;
  export let height = 512;
  const size = { width, height };

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let videoFrameCallbackId: number;
  let videoIsReady = false;

  // ajust the throttle time to your needs
  const THROTTLE = 1000 / 120;
  let lastMillis = 0;

  onMount(() => {
    ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    canvasEl.width = size.width;
    canvasEl.height = size.height;
  });

  onDestroy(() => {
    if (videoFrameCallbackId) videoEl.cancelVideoFrameCallback(videoFrameCallbackId);
  });

  $: if (videoEl) {
    videoEl.srcObject = $mediaStream;
  }

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

  export function startScreenShare() {
    mediaStreamActions.startScreenCapture();
  }

  export function stopScreenShare() {
    mediaStreamActions.stop();
  }

  $: if ($mediaStreamStatus == MediaStreamStatusEnum.CONNECTED && videoIsReady) {
    videoFrameCallbackId = videoEl.requestVideoFrameCallback(onFrameChange);
  }
</script>

<div class="relative overflow-hidden rounded-lg border border-slate-300" style="max-width: {width}px;">
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
  </div>
  <div class="absolute left-0 top-0 flex aspect-square w-full items-center justify-center">
    <div class="w-40 p-5 opacity-20">
      🖥️
    </div>
  </div>
</div>

<div class="flex justify-center mt-2">
  <button 
    class="px-3 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
    on:click={startScreenShare}
  >
    Compartir pantalla
  </button>
</div>
