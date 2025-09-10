<script lang="ts">
  import { onMount } from 'svelte';
  import CamInput from './InputSources/CamInput.svelte';
  import ShareInput from './InputSources/ShareInput.svelte';

  type InputSource = {
    id: string;
    name: string;
    resolution: string;
    fps: string;
    type: 'camera' | 'screen';
    description: string;
  };

  let selectedSourceId: string | null = null;
  let isScreenActive = false;
  
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
  }
  
  function handleScreenDeselected() {
    if (selectedSourceId === 'screen') {
      selectedSourceId = null;
      isScreenActive = false;
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
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId && selectedSourceId !== 'screen' ? 'border-green-500 bg-green-50' : ''}">
      <CamInput 
        selectedDeviceId={selectedSourceId !== 'screen' ? selectedSourceId : null}
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
  </div>
</div>
