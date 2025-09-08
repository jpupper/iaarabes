<script lang="ts">
  import { mediaDevices, mediaStreamActions, mediaStreamStatus, MediaStreamStatusEnum } from '$lib/mediaStream';
  import Screen from '$lib/icons/screen.svelte';
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

  let deviceId: string = '';
  let selectedSourceId: string | null = null;
  
  onMount(async () => {
    await mediaStreamActions.enumerateDevices();
    if ($mediaDevices && $mediaDevices.length > 0) {
      deviceId = $mediaDevices[0].deviceId;
      selectedSourceId = deviceId;
    }
  });

  function handleSourceSelect(sourceId: string) {
    selectedSourceId = sourceId;
    if (sourceId === 'screen') {
      mediaStreamActions.startScreenCapture();
    } else {
      deviceId = sourceId;
      mediaStreamActions.switchCamera(deviceId);
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
    } else if (selectedSourceId && $mediaDevices) {
      const device = $mediaDevices.find(d => d.deviceId === selectedSourceId);
      if (device) {
        return {
          id: device.deviceId,
          name: device.label || 'Camera',
          resolution: '1920x1080',
          fps: '30fps',
          type: 'camera' as const,
          description: device.label || 'USB Camera'
        };
      }
    }
    return null;
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">

  <div class="space-y-4">
    <!-- Componente de cámara con dropdown -->
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId && selectedSourceId !== 'screen' ? 'border-green-500 bg-green-50' : ''}">
      <CamInput on:cameraSelected={(e) => handleSourceSelect(e.detail.deviceId)} />
    </div>

    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'screen' ? 'border-green-500 bg-green-50' : ''}">
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="text-xl">
            🖥️
          </div>
          <div class="text-left">
            <div class="font-medium text-black">Screen Share</div>
            <div class="text-sm text-gray-600">
              Desktop • 60fps
            </div>
          </div>
        </div>
        <button 
          class="flex items-center gap-1 px-3 py-1 text-sm bg-white text-black rounded-md hover:bg-gray-100 border border-gray-300"
          on:click={() => {
            if (selectedSourceId === 'screen') {
              mediaStreamActions.stop();
              selectedSourceId = null;
            } else {
              handleSourceSelect('screen');
            }
          }}
        >
          {selectedSourceId === 'screen' ? 'Detener' : 'Iniciar'}
        </button>
      </div>
    </div>
  </div>
</div>
