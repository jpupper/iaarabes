<script lang="ts">
  import { onMount } from 'svelte';
  import { AVAILABLE_SHADERS, selectedShader, generativePatternActions } from '$lib/generativePattern';
  import { get } from 'svelte/store';

  let currentShaderId = '';

  // Actualizar el ID del shader seleccionado cuando cambia el store
  $: {
    currentShaderId = $selectedShader?.id || '';
  }

  let isLoading = true;
  let loadError = '';
  let isReloading = false;
  let reloadMessage = '';

  // Cargar shaders al montar el componente
  onMount(async () => {
    try {
      console.log('ShaderSelector: Verificando shaders disponibles...');
      isLoading = true;
      
      // Siempre intentar cargar los shaders al inicio
      console.log('ShaderSelector: Cargando shaders...');
      await generativePatternActions.loadShaders();
      
      // Verificar si se cargaron correctamente
      const availableShaders = get(AVAILABLE_SHADERS);
      console.log('ShaderSelector: Shaders disponibles después de cargar:', availableShaders);
      
      if (availableShaders.length === 0) {
        console.warn('ShaderSelector: No se cargaron shaders, intentando directamente con la API');
        
        // Intentar cargar directamente desde la API
        try {
          const response = await fetch('http://localhost:7860/api/shaders/list');
          if (response.ok) {
            const shaders = await response.json();
            console.log('ShaderSelector: Shaders obtenidos directamente:', shaders);
            
            if (shaders && Array.isArray(shaders) && shaders.length > 0) {
              AVAILABLE_SHADERS.set(shaders);
              selectedShader.set(shaders[0]);
            }
          }
        } catch (directError) {
          console.error('ShaderSelector: Error al cargar directamente:', directError);
        }
      }
    } catch (error: any) {
      console.error('ShaderSelector: Error al cargar shaders:', error);
      loadError = error?.message || 'Error al cargar shaders';
    } finally {
      isLoading = false;
    }
  });

  // Función para manejar el cambio de shader
  function handleShaderChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const shaderId = select.value;
    if (shaderId) {
      generativePatternActions.selectShader(shaderId);
    }
  }
</script>

<div class="card">
  <div class="flex justify-between items-center mb-4">
    <h2 class="subtitle">Patrón Generativo</h2>
    <button 
      class="btn btn-primary btn-sm flex items-center gap-2"
      on:click={async () => {
        isReloading = true;
        reloadMessage = '';
        const currentShader = get(selectedShader);
        try {
          await generativePatternActions.loadShaders();
          const shaders = get(AVAILABLE_SHADERS);
          
          // Intentar mantener el shader actual seleccionado si aún existe
          if (currentShader && shaders.find(s => s.id === currentShader.id)) {
            await generativePatternActions.selectShader(currentShader.id);
            reloadMessage = `✓ ${shaders.length} shaders recargados`;
          } else {
            reloadMessage = `✓ ${shaders.length} shaders recargados (shader anterior no encontrado)`;
          }
        } catch (error) {
          console.error('Error al recargar shaders:', error);
          reloadMessage = '✗ Error al recargar';
        } finally {
          isReloading = false;
          // Limpiar mensaje después de 3 segundos
          setTimeout(() => { reloadMessage = ''; }, 3000);
        }
      }}
      disabled={isReloading}
    >
      {#if isReloading}
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Recargando...
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reload Shaders
      {/if}
    </button>
  </div>
  
  {#if reloadMessage}
    <div class="mb-3 px-3 py-2 rounded text-sm" class:bg-green-100={reloadMessage.startsWith('✓')} class:text-green-800={reloadMessage.startsWith('✓')} class:bg-red-100={reloadMessage.startsWith('✗')} class:text-red-800={reloadMessage.startsWith('✗')}>
      {reloadMessage}
    </div>
  {/if}

  <div class="space-y-4">
    <div class="flex flex-col">
      <label for="shader-select" class="text-secondary mb-1">Seleccionar Shader</label>
      <select
        id="shader-select"
        class="select"
        on:change={handleShaderChange}
        value={currentShaderId}
        disabled={isLoading}
      >
        {#if isLoading}
          <option value="" disabled>Cargando shaders...</option>
        {:else if loadError}
          <option value="" disabled>Error: {loadError}</option>
        {:else if !$AVAILABLE_SHADERS || $AVAILABLE_SHADERS.length === 0}
          <option value="" disabled>No hay shaders disponibles</option>
        {:else}
          {#each $AVAILABLE_SHADERS as shader}
            <option value={shader.id}>{shader.name}</option>
          {/each}
        {/if}
      </select>
      
      <div class="text-secondary mt-1">
        {#if isLoading}
          Cargando shaders...
        {:else if $AVAILABLE_SHADERS && $AVAILABLE_SHADERS.length > 0}
          {$AVAILABLE_SHADERS.length} shaders disponibles
        {:else}
          No se encontraron shaders
        {/if}
      </div>
    </div>

    <div class="flex space-x-2">
      <button
        class="btn btn-success flex-1"
        on:click={() => generativePatternActions.start()}
      >
        Iniciar
      </button>
      <button
        class="btn btn-error flex-1"
        on:click={() => generativePatternActions.stop()}
      >
        Detener
      </button>
    </div>
  </div>
</div>
