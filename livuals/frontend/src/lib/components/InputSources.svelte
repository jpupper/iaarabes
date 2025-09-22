<script lang="ts">
  import { onMount } from 'svelte';
  import { mediaDevices, mediaStreamActions, mediaStreamStatus, MediaStreamStatusEnum } from '$lib/mediaStream';

  type InputSource = {
    id: string;
    name: string;
    resolution: string;
    fps: string;
    type: 'camera' | 'screen';
    description: string;
  };

  let sources: InputSource[] = [];
  let selectedSourceId: string | null = null;

  onMount(async () => {
    // Enumerate available cameras
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      sources = await Promise.all(videoDevices.map(async (device, index) => {
        return {
          id: device.deviceId,
          name: `Camera ${index + 1}`,
          resolution: '1920x1080',
          fps: '30fps',
          type: 'camera' as const,
          description: device.label || 'USB Camera'
        };
      }));

      // Add screen capture option
      sources.push({
        id: 'screen',
        name: 'Screen Capture',
        resolution: 'Desktop',
        fps: '60fps',
        type: 'screen',
        description: 'Capture your screen'
      });
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  });

  async function handleSourceSelect(sourceId: string) {
    selectedSourceId = sourceId;
    const source = sources.find(s => s.id === sourceId);
    
    if (source) {
      if (source.type === 'screen') {
        await mediaStreamActions.startScreenCapture();
      } else {
        await mediaStreamActions.start(source.id);
      }
    }
  }

  export function getSelectedSource() {
    return sources.find(s => s.id === selectedSourceId);
  }
</script>

<div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-semibold">Input Sources</h2>
    <button class="px-3 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200">
      + Add
    </button>
  </div>

  <div class="space-y-2">
    {#each sources as source (source.id)}
      <button
        class="w-full flex items-center justify-between p-4 rounded-lg border {selectedSourceId === source.id ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50'}"
        on:click={() => handleSourceSelect(source.id)}
      >
        <div class="flex items-center gap-3">
          <div class="text-xl">
            {#if source.type === 'camera'}
              📷
            {:else}
              🖥️
            {/if}
          </div>
          <div class="text-left">
            <div class="font-medium">{source.name}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {source.resolution} • {source.fps}
              <br />
              {source.description}
            </div>
          </div>
        </div>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ⚙️
        </button>
      </button>
    {/each}
  </div>
</div>
