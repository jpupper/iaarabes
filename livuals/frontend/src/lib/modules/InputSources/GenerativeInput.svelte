<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { generativePatternActions, AVAILABLE_SHADERS, selectedShader } from '$lib/generativePattern';

  const dispatch = createEventDispatcher();
  
  export let isActive = false;

  function toggleGenerative() {
    isActive = !isActive;
    
    if (isActive) {
      generativePatternActions.start();
      dispatch('generativeSelected');
    } else {
      generativePatternActions.stop();
      dispatch('generativeDeselected');
    }
  }

  function selectShader(event: Event) {
    const select = event.target as HTMLSelectElement;
    generativePatternActions.selectShader(select.value);
  }
</script>

<div class="space-y-2">
  <h3 class="text-lg font-medium">Patrón Generativo</h3>
  <p class="text-sm text-gray-600">Genera patrones visuales usando shaders</p>
  
  <div class="flex flex-col space-y-3 mt-2">
    <div>
      <label for="shader-select" class="block text-sm font-medium text-gray-700 mb-1">Seleccionar Shader:</label>
      <select 
        id="shader-select" 
        class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        on:change={selectShader}
        value={$selectedShader.id}
      >
        {#each AVAILABLE_SHADERS as shader}
          <option value={shader.id}>{shader.name}</option>
        {/each}
      </select>
    </div>
    
    <Button 
      on:click={toggleGenerative}
      classList={isActive ? 'p-2 bg-blue-600 hover:bg-blue-700' : 'p-2 bg-gray-500 hover:bg-gray-600'}
    >
      {isActive ? 'Seleccionado' : 'Seleccionar'}
    </Button>
  </div>
</div>
