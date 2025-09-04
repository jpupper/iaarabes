<script lang="ts">
  import { onMount } from 'svelte';
  import type { Fields, PipelineInfo } from '$lib/types';
  import { PipelineMode } from '$lib/types';
      import Button from '$lib/components/Button.svelte';
    import Spinner from '$lib/icons/spinner.svelte';
import StatusMessages from '$lib/modules/StatusMessages.svelte';
  import Warning from '$lib/components/Warning.svelte';
  import { lcmLiveStatus, LCMLiveStatus } from '$lib/lcmLive';
import AIControls from '$lib/modules/AIControls.svelte';
      import Lyrics from '$lib/modules/Lyrics.svelte';

  let pipelineParams: Fields;
  let pipelineInfo: PipelineInfo;
  let pageContent: string;
  let isImageMode: boolean = false;
  let runtime: { device: string; dtype: string; acceleration: string; cuda: boolean; mps: boolean; build_id?: string; ready?: boolean } | null = null;
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

  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
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
      <div class="sm:col-span-2">
        <!-- AI Controls Module: maneja la parte de IA, video input y opciones -->
        <AIControls 
          {isImageMode} 
          {pipelineParams} 
          bind:warningMessage={warningMessage} 
          disabled={!backendReady} 
        />
        
        <!-- Lyrics Module: lista audios y sincroniza al prompt -->
        <Lyrics />
      </div>
    </article>
  {:else}
    <!-- loading -->
    <div class="flex items-center justify-center gap-3 py-48 text-2xl">
      <Spinner classList={'animate-spin opacity-50'}></Spinner>
      <p>Loading...</p>
    </div>
  {/if}

  <StatusMessages
    {runtimeNotice}
    {buildId}
    {backendReady}
    {loadingNotice}
  />
</main>

<style>
  :global(html) {
    color: black;
    background-color: white;
  }
  :global(html.dark) {
    color: white;
    background-color: black;
  }
  :global(.slider) {
    width: 100%;
    height: 0.5rem;
    background-color: #e5e7eb;
    border-radius: 0.5rem;
    appearance: none;
    cursor: pointer;
  }
  :global(.dark .slider) {
    background-color: #374151;
  }
  :global(.slider::-webkit-slider-thumb) {
    width: 1rem;
    height: 1rem;
    background-color: black;
    border-radius: 9999px;
    appearance: none;
  }
  :global(.dark .slider::-webkit-slider-thumb) {
    background-color: white;
  }
</style>
