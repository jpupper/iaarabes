<script lang="ts">
  import { mediaStreamStatus, MediaStreamStatusEnum, mediaDevices, mediaStreamActions } from '$lib/mediaStream';
  import Button from '$lib/components/Button.svelte';

  type InputSource = {
    id: string;
    name: string;
    resolution: string;
    fps: string;
    type: 'camera' | 'screen';
    description: string;
    active: boolean;
  };

  let sources: InputSource[] = [];
  let selectedSourceId: string | null = null;

  async function initializeSources() {
    try {
      await mediaStreamActions.enumerateDevices();
      const videoDevices = $mediaDevices.filter(device => device.kind === 'videoinput');
      
      sources = videoDevices.map((device, index) => ({
        id: device.deviceId,
        name: `Camera ${index + 1}`,
        resolution: '1920x1080',
        fps: '30fps',
        type: 'camera' as const,
        description: device.label || 'USB Camera',
        active: false
      }));

      sources.push({
        id: 'screen',
        name: 'Screen Share',
        resolution: 'Desktop',
        fps: '60fps',
        type: 'screen',
        description: 'Share your screen',
        active: false
      });
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  }

  async function handleSourceSelect(source: InputSource) {
    if (source.active) {
      await mediaStreamActions.stop();
      source.active = false;
      selectedSourceId = null;
    } else {
      // Deactivate current source if any
      if (selectedSourceId) {
        const currentSource = sources.find(s => s.id === selectedSourceId);
        if (currentSource) currentSource.active = false;
      }

      try {
        if (source.type === 'screen') {
          await mediaStreamActions.startScreenCapture();
        } else {
          await mediaStreamActions.start(source.id);
        }
        source.active = true;
        selectedSourceId = source.id;
      } catch (error) {
        console.error('Error selecting source:', error);
      }
    }
  }

  $: {
    if ($mediaStreamStatus === MediaStreamStatusEnum.DISCONNECTED) {
      sources = sources.map(source => ({ ...source, active: false }));
      selectedSourceId = null;
    }
  }

  initializeSources();
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
        class="w-full flex items-center justify-between p-4 rounded-lg border {source.active ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50'}"
        on:click={() => handleSourceSelect(source)}
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
        <div class="flex items-center gap-2">
          <button class="px-3 py-1 text-sm rounded-md {source.active ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}">
            {source.active ? 'Stop' : 'Start'}
          </button>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
</style>
