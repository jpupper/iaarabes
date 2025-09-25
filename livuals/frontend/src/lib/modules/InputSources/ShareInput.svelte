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
  
  // Iniciar la captura de pantalla cuando se monta el componente si está activo
  $: if (isActive) {
    startScreenShare();
  }
</script>

<div class="w-full flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      🖥️
    </div>
    <div class="text-left">
      <div class="font-medium text-secondary">Screen Share</div>
      <div class="text-sm text-secondary opacity-80">
        Desktop • 60fps
      </div>
    </div>
  </div>
  
  <button 
    class="btn {isActive ? 'btn-primary' : 'btn-secondary'} btn-sm"
    on:click={(e) => {
      e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
      toggleScreenShare();
    }}
  >
    {isActive ? 'Detener' : 'Iniciar'}
  </button>
</div>
