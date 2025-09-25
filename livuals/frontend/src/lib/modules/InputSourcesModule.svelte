<script lang="ts">
  import { onMount } from 'svelte';
  import CamInput from './InputSources/CamInput.svelte';
  import ShareInput from './InputSources/ShareInput.svelte';
  import GenerativeInput from './InputSources/GenerativeInput.svelte';
  import { mediaDevices, mediaStreamActions } from '$lib/mediaStream';

  type InputSource = {
    id: string;
    name: string;
    resolution: string;
    fps: string;
    type: 'camera' | 'screen' | 'generative';
    description: string;
  };

  let selectedSourceId: string | null = null;
  let isScreenActive = false;
  let isGenerativeActive = false;
  
  function handleCameraSelected(event: CustomEvent<{deviceId: string}>) {
    selectedSourceId = event.detail.deviceId;
    if (isScreenActive) {
      isScreenActive = false;
    }
    if (isGenerativeActive) {
      isGenerativeActive = false;
    }
  }
  
  function handleCameraDeselected() {
    if (selectedSourceId !== 'screen') {
      selectedSourceId = null;
    }
  }
  
  function handleScreenSelected() {
    // Only proceed if not already active to avoid multiple dialog prompts
    if (!isScreenActive) {
      selectedSourceId = 'screen';
      isScreenActive = true;
      isGenerativeActive = false;
      
      // Iniciar automáticamente la captura de pantalla
      mediaStreamActions.startScreenCapture();
    }
  }
  
  function handleScreenDeselected() {
    if (selectedSourceId === 'screen') {
      selectedSourceId = null;
      isScreenActive = false;
    }
  }

  function handleGenerativeSelected() {
    selectedSourceId = 'generative';
    isGenerativeActive = true;
    isScreenActive = false;
    // Ensure we're properly activating the generative pattern
    console.log('Generative pattern selected');
  }

  function handleGenerativeDeselected() {
    if (selectedSourceId === 'generative') {
      selectedSourceId = null;
      isGenerativeActive = false;
    }
  }

  function handleFrameCapture(event: CustomEvent<{imageData: string}>) {
    // Procesar la imagen capturada del shader generativo
    // y enviarla al sistema de procesamiento
    if (isGenerativeActive && event.detail && event.detail.imageData) {
      const imageData = event.detail.imageData;
      // Aquí se podría enviar la imagen al sistema de procesamiento
      // o emitir un evento para que lo maneje el componente padre
    }
  }


  export function getSelectedSource() {
    if (selectedSourceId === 'screen') {
      return {
        id: 'screen',
        name: 'Screen Share',
        resolution: 'Desktop',
        fps: '60fps',
        type: 'screen' as const,
        description: 'Share your screen'
      };
    } else if (selectedSourceId === 'generative') {
      return {
        id: 'generative',
        name: 'Generative Pattern',
        resolution: '1280x720',
        fps: '60fps',
        type: 'generative' as const,
        description: 'Shader-based generative pattern'
      };
    } else if (selectedSourceId) {
      return {
        id: selectedSourceId,
        name: 'Camera',
        resolution: '1920x1080',
        fps: '30fps',
        type: 'camera' as const,
        description: 'Camera'
      };
    }
    return null;
  }
</script>

<div class="module-container">
  <div class="flex justify-between items-center mb-4">
    <h2 class="title mb-0">Input Sources</h2>
    <div class="text-secondary text-sm flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Haz clic en una tarjeta para seleccionar esa fuente
    </div>
  </div>

  <div class="space-y-4">
    <!-- Componente de cámara con dropdown -->
    <div 
      class="input-source-card card {selectedSourceId && selectedSourceId !== 'screen' && selectedSourceId !== 'generative' ? 'active' : ''}"
      on:click={() => {
        // Siempre intentar seleccionar la cámara, incluso si ya hay otro input seleccionado
        const cameras = $mediaDevices || [];
        if (cameras.length > 0) {
          handleCameraSelected(new CustomEvent('cameraSelected', { detail: { deviceId: cameras[0].deviceId } }));
        } else {
          console.log('No hay cámaras disponibles');
        }
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Siempre intentar seleccionar la cámara, incluso si ya hay otro input seleccionado
          const cameras = $mediaDevices || [];
          if (cameras.length > 0) {
            handleCameraSelected(new CustomEvent('cameraSelected', { detail: { deviceId: cameras[0].deviceId } }));
          } else {
            console.log('No hay cámaras disponibles');
          }
        }
      }}
    >
      <CamInput 
        selectedDeviceId={selectedSourceId !== 'screen' && selectedSourceId !== 'generative' ? selectedSourceId : null}
        on:cameraSelected={handleCameraSelected}
        on:cameraDeselected={handleCameraDeselected}
      />
    </div>

    <div 
      class="input-source-card card {selectedSourceId === 'screen' ? 'active' : ''}"
      on:click={() => {
        // Siempre intentar seleccionar la pantalla, incluso si ya está seleccionada
        handleScreenSelected();
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Siempre intentar seleccionar la pantalla, incluso si ya está seleccionada
          handleScreenSelected();
        }
      }}
    >
      <ShareInput 
        isActive={isScreenActive}
        on:screenDeselected={handleScreenDeselected}
      />
    </div>

    <div 
      class="input-source-card card {selectedSourceId === 'generative' ? 'active' : ''}"
      on:click={() => {
        // Siempre intentar seleccionar el patrón generativo, incluso si ya está seleccionado
        handleGenerativeSelected();
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Siempre intentar seleccionar el patrón generativo, incluso si ya está seleccionado
          handleGenerativeSelected();
        }
      }}
    >
      <GenerativeInput 
        isActive={isGenerativeActive}
        on:generativeSelected={handleGenerativeSelected}
        on:generativeDeselected={handleGenerativeDeselected}
        on:frameCapture={handleFrameCapture}
      />
    </div>
  </div>
</div>
