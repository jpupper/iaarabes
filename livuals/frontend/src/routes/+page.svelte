<script lang="ts">
  import { onMount } from 'svelte';
  import type { Fields, PipelineInfo } from '$lib/types';
  import { PipelineMode } from '$lib/types';
  import ImagePlayer from '$lib/components/ImagePlayer.svelte';
  import VideoInput from '$lib/components/VideoInput.svelte';
  import Button from '$lib/components/Button.svelte';
  import PipelineOptions from '$lib/components/PipelineOptions.svelte';
  import Spinner from '$lib/icons/spinner.svelte';
  import Warning from '$lib/components/Warning.svelte';
  import { lcmLiveStatus, lcmLiveActions, LCMLiveStatus, inferenceBusy, streamId } from '$lib/lcmLive';
  import { mediaStreamActions, onFrameChangeStore } from '$lib/mediaStream';
  import { getPipelineValues, deboucedPipelineValues } from '$lib/store';

  let pipelineParams: Fields;
  let pipelineInfo: PipelineInfo;
  let pageContent: string;
  let isImageMode: boolean = false;
  let runtime: { device: string; dtype: string; acceleration: string; cuda: boolean; mps: boolean; build_id?: string } | null = null;
  let runtimeNotice: string = '';
  let backendReady: boolean = false;
  let loadingNotice: string = '';
  let buildId: string = '';
  let maxQueueSize: number = 0;
  let currentQueueSize: number = 0;
  let queueCheckerRunning: boolean = false;
  let warningMessage: string = '';
  onMount(() => {
    getSettings();
  });

  async function getSettings() {
    const settings = await fetch('/api/settings').then((r) => r.json());
    pipelineParams = settings.input_params.properties;
    pipelineInfo = settings.info.properties;
    isImageMode = pipelineInfo.input_mode.default === PipelineMode.IMAGE;
    maxQueueSize = settings.max_queue_size;
    pageContent = settings.page_content;
    runtime = settings.runtime;
    runtimeNotice = getRuntimeNotice(runtime);
    backendReady = !!runtime?.ready;
    buildId = runtime?.build_id ?? '';
    if (!backendReady) {
      loadingNotice = 'Descargando/Preparando modelos…';
      pollStatus();
    } else {
      loadingNotice = '';
    }
    console.log(pipelineParams);
    toggleQueueChecker(true);
  }

  async function pollStatus() {
    try {
      const data = await fetch('/api/status').then((r) => r.json());
      backendReady = !!data.ready;
      loadingNotice = backendReady ? '' : 'Descargando/Preparando modelos…';
      if (!backendReady) setTimeout(pollStatus, 1000);
    } catch (e) {
      setTimeout(pollStatus, 2000);
    }
  }

  function getRuntimeNotice(rt: typeof runtime): string {
    if (!rt) return '';
    const dev = (rt.device || '').toLowerCase();
    const acc = (rt.acceleration || '').toLowerCase();
    if (dev.includes('cuda')) {
      return 'Running on CUDA GPU';
    }
    if (dev.includes('mps')) {
      return 'Running on Apple MPS (no TensorRT/CUDA)';
    }
    // CPU
    if (acc === 'none' || !acc) {
      return 'Running on CPU (no GPU acceleration)';
    }
    return `Running on CPU with acceleration: ${rt.acceleration}`;
  }
  function toggleQueueChecker(start: boolean) {
    queueCheckerRunning = start && maxQueueSize > 0;
    if (start) {
      getQueueSize();
    }
  }
  async function getQueueSize() {
    if (!queueCheckerRunning) {
      return;
    }
    const data = await fetch('/api/queue').then((r) => r.json());
    currentQueueSize = data.queue_size;
    setTimeout(getQueueSize, 10000);
  }

  function getSreamdata() {
    if (isImageMode) {
      return [getPipelineValues(), $onFrameChangeStore?.blob];
    } else {
      return [$deboucedPipelineValues];
    }
  }

  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  $: if ($lcmLiveStatus === LCMLiveStatus.TIMEOUT) {
    warningMessage = 'Session timed out. Please try again.';
  }
  let disabled = false;
  async function toggleLcmLive() {
    try {
      if (!isLCMRunning) {
        if (isImageMode) {
          await mediaStreamActions.enumerateDevices();
          await mediaStreamActions.start();
        }
        disabled = true;
        await lcmLiveActions.start(getSreamdata);
        disabled = false;
        toggleQueueChecker(false);
      } else {
        if (isImageMode) {
          mediaStreamActions.stop();
        }
        lcmLiveActions.stop();
        toggleQueueChecker(true);
      }
    } catch (e) {
      warningMessage = e instanceof Error ? e.message : '';
      disabled = false;
      toggleQueueChecker(true);
    }
  }

  async function snapshotOnce() {
    try {
      const params = getPipelineValues();
      const fd = new FormData();
      fd.append('params', JSON.stringify(params));
      if (isImageMode) {
        const blob = $onFrameChangeStore?.blob;
        if (!blob || blob.size === 0) {
          warningMessage = 'No hay frame de cámara disponible todavía.';
          return;
        }
        fd.append('image', blob, 'input.jpg');
      }
      const res = await fetch('/api/snapshot', { method: 'POST', body: fd });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Snapshot failed: ${msg}`);
      }
      const out = await res.blob();
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livuals_snapshot_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      warningMessage = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<svelte:head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.contentWindow.min.js"
  ></script>
</svelte:head>

<main class="container mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 bg-white dark:bg-black rounded-lg shadow-lg my-4">
  <Warning bind:message={warningMessage}></Warning>
  <div class="flex justify-center mb-6">
    <img src="logo.png" alt="Logo" class="h-12" />
  </div>
  <article class="text-center bg-white dark:bg-black border border-black dark:border-white p-4 rounded-lg">
    {#if pageContent}
      {@html pageContent}
    {/if}
    {#if maxQueueSize > 0}
      <p class="text-sm">
        There are <span id="queue_size" class="font-bold">{currentQueueSize}</span>
        user(s) sharing the same GPU, affecting real-time performance. Maximum queue size is {maxQueueSize}.
        <a
          href="https://huggingface.co/spaces/radames/Real-Time-Latent-Consistency-Model?duplicate=true"
          target="_blank"
          class="text-blue-500 underline hover:no-underline">Duplicate</a
        > and run it on your own GPU.
      </p>
    {/if}
  </article>
  {#if pipelineParams}
  <article class="my-3 grid grid-cols-1 gap-3 sm:grid-cols-2 bg-white dark:bg-black border border-black dark:border-white p-4 rounded-lg">
      {#if isImageMode}
        <div class="sm:col-start-1">
          <VideoInput
            width={Number(pipelineParams.width.default)}
            height={Number(pipelineParams.height.default)}
          ></VideoInput>
        </div>
      {/if}
      <div class={isImageMode ? 'sm:col-start-2' : 'col-span-2'}>
        <ImagePlayer />
      </div>
      <div class="sm:col-span-2">
        <div class="flex flex-col gap-4 w-full">
          <h3 class="text-base font-semibold">Options</h3>
          <div class="flex gap-3">
          <Button on:click={toggleLcmLive} disabled={disabled || !backendReady} classList={'text-lg my-1 p-2 w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}>
          {#if isLCMRunning}
            Stop
          {:else}
            Start
          {/if}
        </Button>
        <Button on:click={snapshotOnce} disabled={!backendReady} classList={'text-lg my-1 p-2 w-full bg-gray-700 dark:bg-gray-300 text-white dark:text-black hover:bg-gray-600 dark:hover:bg-gray-200'}>
          Snapshot
        </Button>
        </div>
        <PipelineOptions {pipelineParams}></PipelineOptions>
      </div>
    </article>
  {:else}
    <!-- loading -->
    <div class="flex items-center justify-center gap-3 py-48 text-2xl">
      <Spinner classList={'animate-spin opacity-50'}></Spinner>
      <p>Loading...</p>
    </div>
  {/if}

  <!-- Status Messages -->
  <div class="flex flex-col gap-2 mt-4">
    {#if runtimeNotice}
      <div class="text-sm rounded-md px-3 py-2 border border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-500">
        {runtimeNotice}
      </div>
    {/if}
    {#if buildId}
      <div class="text-xs opacity-70">Build: {buildId}</div>
    {/if}
    <div class="text-xs opacity-80">Status: {$lcmLiveStatus}{#if $inferenceBusy} · Inference: busy{/if}{#if $streamId} · ID: {$streamId}{/if}</div>
    {#if !backendReady}
      <div class="text-sm rounded-md px-3 py-2 border border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-500">
        {loadingNotice}
      </div>
    {/if}
    {#if $inferenceBusy}
      <div class="text-sm rounded-md px-3 py-2 border border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-500">
        Comenzando inferencia…
      </div>
    {/if}
  </div>
</main>

<style lang="postcss">
  :global(html) {
    @apply text-black bg-white dark:bg-black dark:text-white;
  }
  :global(.slider) {
    @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer;
  }
  :global(.slider::-webkit-slider-thumb) {
    @apply w-4 h-4 bg-black dark:bg-white rounded-full appearance-none;
  }
</style>
