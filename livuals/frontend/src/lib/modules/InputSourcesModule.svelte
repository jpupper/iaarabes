<script lang="ts">
  import { mediaDevices, mediaStreamActions } from '$lib/mediaStream';
  import Screen from '$lib/icons/screen.svelte';
  import { onMount } from 'svelte';

  let deviceId: string = '';
  
  onMount(() => {
    if ($mediaDevices && $mediaDevices.length > 0) {
      deviceId = $mediaDevices[0].deviceId;
    }
  });
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-bold">Input Sources</h2>
  </div>

  <div class="space-y-2">
    {#if $mediaDevices && $mediaDevices.length > 0}
      <button
        class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
      >
        <div class="flex items-center gap-3">
          <div class="text-xl">
            📷
          </div>
          <div class="text-left">
            <div class="font-medium">Camera 1</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              USB Camera
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select
            bind:value={deviceId}
            on:change={() => mediaStreamActions.switchCamera(deviceId)}
            id="devices-list"
            class="block cursor-pointer rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-1 text-sm"
          >
            {#each $mediaDevices as device, i}
              <option value={device.deviceId}>{device.label || `Camera ${i+1}`}</option>
            {/each}
          </select>
        </div>
      </button>
    {/if}

    <button
      class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
      on:click={() => mediaStreamActions.startScreenCapture()}
    >
      <div class="flex items-center gap-3">
        <div class="text-xl">
          🖥️
        </div>
        <div class="text-left">
          <div class="font-medium">Screen Share</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Share your screen
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
          Share
        </button>
      </div>
    </button>
  </div>
</div>
