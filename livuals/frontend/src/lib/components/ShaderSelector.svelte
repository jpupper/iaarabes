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
    <h2 class="section-title">Patrón Generativo</h2>
    <div class="flex space-x-2">
      <button 
        class="btn btn-primary text-xs p-2"
        on:click={() => {
          isLoading = true;
          generativePatternActions.loadShaders().finally(() => isLoading = false);
        }}
      >
        Recargar Shaders
      </button>
      <button 
        class="btn btn-secondary text-xs p-2"
        on:click={() => {
          const shaders = get(AVAILABLE_SHADERS);
          console.log('AVAILABLE_SHADERS:', shaders);
          console.log('selectedShader:', get(selectedShader));
          alert(`Shaders disponibles: ${shaders.length}\n${shaders.map(s => s.id).join(', ')}`);
        }}
      >
        Debug
      </button>
    </div>
  </div>

  <div class="space-y-4">
    <div class="flex flex-col">
      <label for="shader-select" class="secondary-text mb-1">Seleccionar Shader</label>
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
      
      <div class="secondary-text mt-1">
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
