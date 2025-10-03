<script lang="ts">
  import { mediaDevices, mediaStreamActions, mediaStreamStatus, MediaStreamStatusEnum } from '$lib/mediaStream';
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  export let selectedDeviceId: string | null = null;
  let deviceId: string = '';
  let isDropdownOpen = false;
  let isActive = false;

  onMount(async () => {
    await mediaStreamActions.enumerateDevices();
    if ($mediaDevices && $mediaDevices.length > 0) {
      deviceId = $mediaDevices[0].deviceId;
      // Don't auto-select camera - let InputSourcesModule handle default selection
    }
  });

  function switchCamera(newDeviceId: string) {
    deviceId = newDeviceId;
    selectedDeviceId = newDeviceId;
    mediaStreamActions.switchCamera(deviceId);
    isActive = true;
    dispatch('cameraSelected', { deviceId: newDeviceId });
  }

  export function startCamera() {
    mediaStreamActions.start(deviceId);
    isActive = true;
    selectedDeviceId = deviceId;
    dispatch('cameraSelected', { deviceId });
  }

  export function stopCamera() {
    mediaStreamActions.stop();
    isActive = false;
    selectedDeviceId = null;
    dispatch('cameraDeselected');
  }
  
  $: isActive = selectedDeviceId === deviceId;
</script>


<div class="w-full flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      📷
    </div>
    <div class="text-left">
      {#if $mediaDevices && $mediaDevices.length > 0}
        {#if deviceId}
          {@const currentDevice = $mediaDevices.find(d => d.deviceId === deviceId)}
          <div class="font-medium text-secondary">{currentDevice?.label || 'Camera'}</div>
          <div class="text-sm text-secondary opacity-80">
            1920x1080 • 30fps
          </div>
        {/if}
      {/if}
    </div>
  </div>
  
  <div class="relative">
    <button 
      class="btn btn-secondary btn-sm"
      on:click={(e) => {
        e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
        isDropdownOpen = !isDropdownOpen;
      }}
    >
      <span>Cambiar</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    {#if isDropdownOpen && $mediaDevices && $mediaDevices.length > 0}
      <div class="absolute right-0 mt-1 w-64 bg-primary border border-gray-700 rounded-md shadow-lg z-10">
        {#each $mediaDevices as device, i}
          <button 
            class="w-full text-left px-4 py-2 hover:bg-gray-700 {deviceId === device.deviceId ? 'bg-gray-700' : ''}"
            on:click={(e) => {
              e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
              deviceId = device.deviceId;
              switchCamera(deviceId);
              isDropdownOpen = false;
              dispatch('cameraSelected', { deviceId: device.deviceId });
            }}
          >
            <div class="font-medium text-secondary">{device.label || `Camera ${i + 1}`}</div>
            <div class="text-xs text-secondary opacity-80">1920x1080 • 30fps</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
