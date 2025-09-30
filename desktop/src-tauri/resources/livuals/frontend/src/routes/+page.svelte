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
  import Logo from '$lib/components/Logo.svelte';

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
  
  // Asegurarse de que la pestaña activa no sea 'stream' al inicio
  $: if (activeTab === 'stream') {
    activeTab = 'ai-panel';
  }
  const tabs = [
    { id: 'ai-panel', label: 'AI Panel', icon: 'settings' },
    { id: 'stream', label: 'Performance', icon: 'video' },
    { id: 'inputs', label: 'Inputs', icon: 'camera' },
    { id: 'lyrics', label: 'Lyrics', icon: 'music_note' },
    { id: 'status', label: 'Status', icon: 'analytics' }
  ];
  
  // Función para manejar cambios de pestaña
  function handleTabChange(event: CustomEvent) {
    // Si se selecciona 'stream', cambiar a 'ai-panel' ya que Performance siempre está visible
    if (event.detail.tabId === 'stream') {
      activeTab = 'ai-panel';
      console.log('Tab stream seleccionada, cambiando a ai-panel');
    } else {
      activeTab = event.detail.tabId;
      console.log('Tab seleccionada:', activeTab);
    }
  }
  
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
  
  <!-- Header con logo integrado -->
  <header class="flex items-center justify-between bg-primary rounded-lg mb-4 p-3 shadow-md">
    <div class="flex items-center">
      <div class="flex items-center p-1">
        <Logo height="48px" />
      </div>
      <h1 class="text-2xl font-bold ml-2 text-white">Livuals</h1>
    </div>
    {#if maxQueueSize > 0}
      <div class="text-sm text-secondary bg-[#1a1f2b] p-2 rounded-md">
        <span id="queue_size" class="font-bold">{currentQueueSize}</span> users sharing GPU
      </div>
    {/if}
  </header>

  {#if pipelineParams}
    <!-- Sistema de pestañas -->
    <div class="mb-4">
      <TabsSystem {tabs} bind:activeTab on:tabChange={handleTabChange} />
    </div>
    
    <!-- Contenedor principal con dos columnas -->
    <div class="flex flex-wrap gap-4" style="height: calc(100vh - 150px); min-height: 500px;">
      <!-- Columna izquierda: Módulo activo (excepto Performance) -->
      <div class="w-[60%] min-w-[300px] flex flex-col">
        {#if activeTab === 'ai-panel'}
          <!-- AI Controls Module -->
          <div class="module-container flex-grow flex flex-col">
            <h2 class="title mb-4">AI Controls</h2>
            <div class="flex-grow overflow-auto">
              <AIControls
                {pipelineParams}
                disabled={!backendReady}
              />
            </div>
          </div>
        {:else if activeTab === 'inputs'}
          <!-- Input Sources Module -->
          <div class="module-container flex-grow flex flex-col">
            <h2 class="title mb-4">Input Sources</h2>
            <div class="flex-grow overflow-auto">
              <InputSourcesModule />
            </div>
          </div>
        {:else if activeTab === 'lyrics'}
          <!-- Lyrics Module -->
          <div class="module-container flex-grow flex flex-col">
            <h2 class="title mb-4">Lyrics</h2>
            <div class="flex-grow overflow-auto">
              <Lyrics />
            </div>
          </div>
        {:else if activeTab === 'status'}
          <!-- Status Messages Module -->
          <div class="module-container flex-grow flex flex-col">
            <h2 class="title mb-4">Status</h2>
            <div class="flex-grow overflow-auto">
              <StatusMessages
                {runtimeNotice}
                {buildId}
                {backendReady}
                {loadingNotice}
              />
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Columna derecha: Siempre muestra el módulo de Performance -->
      <div class="w-[40%] min-w-[300px] flex flex-col">
        <div class="module-container flex-grow flex flex-col">
          <h2 class="title mb-4">Performance</h2>
          <div class="flex-grow overflow-auto">
            <StreamOutput
              {isImageMode}
              {pipelineParams}
              bind:warningMessage={warningMessage}
              disabled={!backendReady}
            />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- loading -->
    <div class="flex items-center justify-center gap-3 py-48 text-2xl">
      <Spinner classList={'animate-spin opacity-50'}></Spinner>
      <p>Loading...</p>
    </div>
  {/if}
</main>

<!-- Los estilos globales ahora se manejan en global.css -->
