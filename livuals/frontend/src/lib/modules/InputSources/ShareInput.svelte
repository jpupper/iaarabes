<script lang="ts">
  import { mediaStreamActions, mediaStreamStatus, MediaStreamStatusEnum } from '$lib/mediaStream';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  function startScreenShare() {
    mediaStreamActions.startScreenCapture();
    isActive = true;
    dispatch('screenSelected');
  }
  
  function stopScreenShare() {
    mediaStreamActions.stop();
    isActive = false;
    dispatch('screenDeselected');
  }
  
  function toggleScreenShare() {
    if (isActive) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }
</script>

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
    on:click={toggleScreenShare}
  >
    {isActive ? 'Detener' : 'Iniciar'}
  </button>
</div>
