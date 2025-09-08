<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  export let youtubeUrl = '';
  let inputUrl = '';
  let isEditing = false;
  let youtubeEmbedUrl = '';
  
  function parseYoutubeUrl(url: string): string {
    // Extraer el ID del video de YouTube de diferentes formatos de URL
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1].split('?')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1`;
    }
    
    return '';
  }
  
  function activateYoutube() {
    if (inputUrl) {
      try {
        const embedUrl = parseYoutubeUrl(inputUrl);
        if (embedUrl) {
          youtubeUrl = inputUrl;
          youtubeEmbedUrl = embedUrl;
          isActive = true;
          dispatch('youtubeSelected', { url: youtubeUrl, embedUrl: youtubeEmbedUrl });
        } else {
          alert('URL de YouTube no válida');
        }
      } catch (error) {
        alert('Error al procesar la URL de YouTube');
      }
    }
  }
  
  function deactivateYoutube() {
    isActive = false;
    dispatch('youtubeDeselected');
  }
  
  function toggleYoutube() {
    if (isActive) {
      deactivateYoutube();
    } else {
      activateYoutube();
    }
  }
</script>

<div class="w-full flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      📺
    </div>
    <div class="text-left">
      <div class="font-medium text-black">YouTube</div>
      <div class="text-sm text-gray-600">
        {#if youtubeUrl}
          {youtubeUrl.length > 30 ? youtubeUrl.substring(0, 30) + '...' : youtubeUrl}
        {:else}
          Ingrese una URL de YouTube
        {/if}
      </div>
    </div>
  </div>
  
  <div class="flex items-center gap-2">
    {#if isEditing || !youtubeUrl}
      <div class="relative">
        <input 
          type="text" 
          bind:value={inputUrl} 
          placeholder="https://youtube.com/watch?v=..." 
          class="px-3 py-1 text-sm border border-gray-300 rounded-md w-64"
        />
        <button 
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          on:click={() => {
            isEditing = false;
            if (inputUrl) {
              activateYoutube();
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
      on:click={toggleYoutube}
      disabled={!inputUrl && !isActive}
    >
      {isActive ? 'Detener' : 'Iniciar'}
    </button>
  </div>
</div>

{#if isActive && youtubeEmbedUrl && !isEditing}
  <div class="hidden">
    <!-- El iframe de YouTube no se muestra aquí, solo se guarda la URL para usarla en VideoInput -->
    <iframe 
      src={youtubeEmbedUrl} 
      title="YouTube video player" 
      width="0" 
      height="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
    ></iframe>
  </div>
{/if}
