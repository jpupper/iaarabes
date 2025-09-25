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
  import StreamOutput from '$lib/modules/StreamOutput.svelte';
  import Lyrics from '$lib/modules/Lyrics.svelte';
  import InputSourcesModule from '$lib/modules/InputSourcesModule.svelte';
  import TabsSystem from '$lib/components/TabsSystem.svelte';

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
  // Variable para controlar si la página está visible o no
  let pageVisible = true;
  
  // Sistema de tabs
  let activeTab = 'ai-panel';
  const tabs = [
    { id: 'ai-panel', label: 'AI Panel', icon: 'settings' },
    { id: 'stream', label: 'Stream', icon: 'video' },
    { id: 'inputs', label: 'Inputs', icon: 'camera' },
    { id: 'lyrics', label: 'Lyrics', icon: 'music_note' },
    { id: 'status', label: 'Status', icon: 'analytics' }
  ];
  
  onMount(() => {
    getSettings();
    
    // Agregar event listener para detectar cuando la página está visible/oculta
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar event listener cuando se desmonta el componente
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });
  
  // Función para manejar cambios de visibilidad
  function handleVisibilityChange() {
    pageVisible = document.visibilityState === 'visible';
    console.log(`Página ${pageVisible ? 'visible' : 'oculta'}, manteniendo la conexión activa`);
    
    // Mantener la conexión activa incluso cuando la página está en segundo plano
    if (!pageVisible) {
      // Crear un worker en segundo plano para mantener la conexión activa
      keepConnectionAlive();
    }
  }
  
  // Función para mantener la conexión activa
  function keepConnectionAlive() {
    // Enviar ping cada 5 segundos para mantener la conexión activa
    const pingInterval = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        fetch('/api/ping')
          .then(response => response.json())
          .catch(error => console.error('Error al hacer ping:', error));
      } else {
        // Si la página vuelve a ser visible, limpiar el intervalo
        clearInterval(pingInterval);
      }
    }, 5000);
  }

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

<main class="main-layout">
  <Warning bind:message={warningMessage}></Warning>
  <div class="flex justify-center">
    <img src="logo.png" alt="Logo" class="h-12" />
  </div>
  
  <article class="module-container text-center">
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
    <article class="module-container">
      <TabsSystem {tabs} bind:activeTab on:tabChange={(e) => console.log('Tab changed:', e.detail.tabId)}>
        <!-- Contenido de las pestañas -->
      </TabsSystem>
      
      <!-- Tab Content -->
      <div class="tab-content {activeTab === 'ai-panel' ? 'active' : ''}">
        <!-- AI Controls Module -->
        <AIControls
          {pipelineParams}
          disabled={!backendReady}
        />
      </div>
      
      <div class="tab-content {activeTab === 'stream' ? 'active' : ''}">
        <!-- Stream Output Module -->
        <StreamOutput
          {isImageMode}
          {pipelineParams}
          bind:warningMessage={warningMessage}
          disabled={!backendReady}
        />
      </div>
      
      <div class="tab-content {activeTab === 'inputs' ? 'active' : ''}">
        <!-- Input Sources Module -->
        <InputSourcesModule />
      </div>
      
      <div class="tab-content {activeTab === 'lyrics' ? 'active' : ''}">
        <!-- Lyrics Module -->
        <Lyrics />
      </div>
      
      <div class="tab-content {activeTab === 'status' ? 'active' : ''}">
        <!-- Status Messages Module -->
        <StatusMessages
          {runtimeNotice}
          {buildId}
          {backendReady}
          {loadingNotice}
        />
      </div>
    </article>
  {:else}
    <!-- loading -->
    <div class="flex items-center justify-center gap-3 py-48 text-2xl">
      <Spinner classList={'animate-spin opacity-50'}></Spinner>
      <p>Loading...</p>
    </div>
  {/if}
</main>

<!-- Los estilos globales ahora se manejan en global.css -->
