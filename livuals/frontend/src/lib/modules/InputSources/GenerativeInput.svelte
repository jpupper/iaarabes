<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { generativePatternActions } from '$lib/generativePattern';

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
</script>

<div class="space-y-2">
  <h3 class="text-lg font-medium">Patrón Generativo</h3>
  <p class="text-sm text-gray-600">Genera patrones visuales usando shaders</p>
  
  <div class="flex justify-between items-center mt-2">
    <Button 
      on:click={toggleGenerative}
      classList={isActive ? 'p-2 bg-blue-600 hover:bg-blue-700' : 'p-2 bg-gray-500 hover:bg-gray-600'}
    >
      {isActive ? 'Seleccionado' : 'Seleccionar'}
    </Button>
  </div>
</div>
