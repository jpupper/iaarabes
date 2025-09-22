<script lang="ts">
  import { onMount } from 'svelte';
  import CamInput from './InputSources/CamInput.svelte';
  import ShareInput from './InputSources/ShareInput.svelte';
  import GenerativeInput from './InputSources/GenerativeInput.svelte';

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
  }
  
  function handleCameraDeselected() {
    if (selectedSourceId !== 'screen') {
      selectedSourceId = null;
    }
  }
  
  function handleScreenSelected() {
    selectedSourceId = 'screen';
    isScreenActive = true;
    isGenerativeActive = false;
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

<div class="bg-white border border-gray-200 rounded-lg p-4">

  <div class="space-y-4">
    <!-- Componente de cámara con dropdown -->
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId && selectedSourceId !== 'screen' && selectedSourceId !== 'generative' ? 'border-green-500 bg-green-50' : ''}">
      <CamInput 
        selectedDeviceId={selectedSourceId !== 'screen' && selectedSourceId !== 'generative' ? selectedSourceId : null}
        on:cameraSelected={handleCameraSelected}
        on:cameraDeselected={handleCameraDeselected}
      />
    </div>

    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'screen' ? 'border-green-500 bg-green-50' : ''}">
      <ShareInput 
        isActive={isScreenActive}
        on:screenSelected={handleScreenSelected}
        on:screenDeselected={handleScreenDeselected}
      />
    </div>

    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'generative' ? 'border-green-500 bg-green-50' : ''}">
      <GenerativeInput 
        isActive={isGenerativeActive}
        on:generativeSelected={handleGenerativeSelected}
        on:generativeDeselected={handleGenerativeDeselected}
        on:frameCapture={handleFrameCapture}
      />
    </div>
  </div>
</div>
