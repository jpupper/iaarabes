<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  export let iframeUrl = '';
  let inputUrl = '';
  let isEditing = false;
  
  function activateIframe() {
    if (inputUrl) {
      iframeUrl = inputUrl;
      isActive = true;
      dispatch('iframeSelected', { url: iframeUrl });
    }
  }
  
  function deactivateIframe() {
    isActive = false;
    dispatch('iframeDeselected');
  }
  
  function toggleIframe() {
    if (isActive) {
      deactivateIframe();
    } else {
      activateIframe();
    }
  }
</script>

<div class="w-full flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      🖼️
    </div>
    <div class="text-left">
      <div class="font-medium text-black">Iframe</div>
      <div class="text-sm text-gray-600">
        {#if iframeUrl}
          {iframeUrl.length > 30 ? iframeUrl.substring(0, 30) + '...' : iframeUrl}
        {:else}
          Ingrese una URL
        {/if}
      </div>
    </div>
  </div>
  
  <div class="flex items-center gap-2">
    {#if isEditing || !iframeUrl}
      <div class="relative">
        <input 
          type="text" 
          bind:value={inputUrl} 
          placeholder="https://ejemplo.com" 
          class="px-3 py-1 text-sm border border-gray-300 rounded-md w-48"
        />
        <button 
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          on:click={() => {
            isEditing = false;
            if (inputUrl) {
              activateIframe();
            }
          }}
        >
          ✓
        </button>
      </div>
    {:else}
      <button 
        class="flex items-center gap-1 px-3 py-1 text-sm bg-white text-black rounded-md hover:bg-gray-100 border border-gray-300"
        on:click={() => isEditing = true}
      >
        Editar
      </button>
    {/if}
    
    <button 
      class="flex items-center gap-1 px-3 py-1 text-sm bg-white text-black rounded-md hover:bg-gray-100 border border-gray-300"
      on:click={toggleIframe}
      disabled={!inputUrl && !isActive}
    >
      {isActive ? 'Detener' : 'Iniciar'}
    </button>
  </div>
</div>

{#if isActive && iframeUrl && !isEditing}
  <div class="hidden">
    <!-- El iframe no se muestra aquí, solo se guarda la URL para usarla en VideoInput -->
    <iframe src={iframeUrl} title="Iframe content" width="0" height="0"></iframe>
  </div>
{/if}
