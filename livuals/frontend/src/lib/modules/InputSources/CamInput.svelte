<script lang="ts">
  import { mediaDevices, mediaStreamActions } from '$lib/mediaStream';
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let deviceId: string = '';
  let isDropdownOpen = false;

  onMount(async () => {
    await mediaStreamActions.enumerateDevices();
    if ($mediaDevices && $mediaDevices.length > 0) {
      deviceId = $mediaDevices[0].deviceId;
    }
  });

  function switchCamera(newDeviceId: string) {
    deviceId = newDeviceId;
    mediaStreamActions.switchCamera(deviceId);
    dispatch('cameraSelected', { deviceId: newDeviceId });
  }

  export function startCamera() {
    mediaStreamActions.start(deviceId);
  }

  export function stopCamera() {
    mediaStreamActions.stop();
  }
</script>


<div class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 mt-2">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      📷
    </div>
    <div class="text-left">
      {#if $mediaDevices && $mediaDevices.length > 0}
        {#if deviceId}
          {@const currentDevice = $mediaDevices.find(d => d.deviceId === deviceId)}
          <div class="font-medium">{currentDevice?.label || 'Camera'}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            1920x1080 • 30fps
          </div>
        {/if}
      {/if}
    </div>
  </div>
  
  <div class="relative">
    <button 
      class="flex items-center gap-1 px-3 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
      on:click={() => isDropdownOpen = !isDropdownOpen}
    >
      <span>Cambiar</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    {#if isDropdownOpen && $mediaDevices && $mediaDevices.length > 0}
      <div class="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
        {#each $mediaDevices as device, i}
          <button 
            class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 {deviceId === device.deviceId ? 'bg-gray-100 dark:bg-gray-700' : ''}"
            on:click={() => {
              deviceId = device.deviceId;
              switchCamera(deviceId);
              isDropdownOpen = false;
              dispatch('cameraSelected', { deviceId: device.deviceId });
            }}
          >
            <div class="font-medium">{device.label || `Camera ${i + 1}`}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">1920x1080 • 30fps</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
