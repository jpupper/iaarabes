<script lang="ts">
  import { canvasDimensions, canvasDimensionsActions } from '$lib/canvasDimensions';
  
  // Opciones predefinidas de tamaño
  const sizeOptions = [
    { label: '256x256', width: 256, height: 256 },
    { label: '384x384', width: 384, height: 384 },
    { label: '512x512', width: 512, height: 512 },
    { label: '640x640', width: 640, height: 640 },
    { label: '768x768', width: 768, height: 768 },
  ];
  
  // Tamaño personalizado
  let customWidth = $canvasDimensions.width;
  let customHeight = $canvasDimensions.height;
  
  // Actualizar el tamaño personalizado cuando cambie el store
  $: {
    customWidth = $canvasDimensions.width;
    customHeight = $canvasDimensions.height;
  }
  
  // Aplicar tamaño personalizado
  function applyCustomSize() {
    canvasDimensionsActions.setDimensions(customWidth, customHeight);
  }
  
  // Aplicar tamaño predefinido
  function applyPresetSize(width: number, height: number) {
    canvasDimensionsActions.setDimensions(width, height);
  }
</script>

<div class="card">
  <h3 class="subtitle mb-3">Tamaño del Canvas</h3>
  
  <div class="grid grid-cols-2 gap-3 mb-4">
    {#each sizeOptions as option}
      <button 
        class="canvas-size-button {$canvasDimensions.width === option.width && $canvasDimensions.height === option.height ? 'active' : ''}"
        on:click={() => applyPresetSize(option.width, option.height)}
      >
        {option.label}
      </button>
    {/each}
  </div>
  
  <div class="flex flex-col space-y-2">
    <div class="flex items-center space-x-2">
      <label for="canvas-width" class="text-secondary w-16">Ancho:</label>
      <input 
        id="canvas-width"
        type="number" 
        bind:value={customWidth} 
        min="128" 
        max="1024" 
        step="32"
        class="input"
      />
    </div>
    
    <div class="flex items-center space-x-2">
      <label for="canvas-height" class="text-secondary w-16">Alto:</label>
      <input 
        id="canvas-height"
        type="number" 
        bind:value={customHeight} 
        min="128" 
        max="1024" 
        step="32"
        class="input"
      />
    </div>
    
    <button 
      class="btn btn-primary mt-2"
      on:click={applyCustomSize}
    >
      Aplicar
    </button>
  </div>
  
  <div class="mt-3 text-secondary">
    Tamaño actual: {$canvasDimensions.width}x{$canvasDimensions.height}
  </div>
</div>
