<script lang="ts">
  import { onMount } from 'svelte';
  import { shaderParams, shaderParamsActions } from '$lib/shaderParams';
  import { shaderSources, selectedShader } from '$lib/generativePattern';
  import { get } from 'svelte/store';
  
  let loading = true;
  let lastShaderSource = '';
  
  // Actualizar los parámetros solo cuando cambia realmente el código del shader
  $: if ($shaderSources && $shaderSources.fragmentShaderSource && $shaderSources.fragmentShaderSource !== lastShaderSource) {
    loadShaderParams($shaderSources.fragmentShaderSource);
    lastShaderSource = $shaderSources.fragmentShaderSource;
  }
  
  // Cargar los parámetros del shader
  function loadShaderParams(source: string) {
    loading = true;
    try {
      const params = shaderParamsActions.loadParamsFromShader(source);
      console.log(`Parámetros encontrados en el shader: ${params.length}`);
      loading = false;
    } catch (error) {
      console.error('Error al cargar parámetros del shader:', error);
      loading = false;
    }
  }
  
  // Manejar cambios en los sliders
  function handleSliderChange(paramName: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    shaderParamsActions.updateParamValue(paramName, value);
  }
  
  // Manejar cambios en los sliders de vectores
  function handleVectorChange(paramName: string, index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    
    // Obtener el valor actual del vector
    const param = $shaderParams.find(p => p.name === paramName);
    if (param && Array.isArray(param.value)) {
      const newValue = [...param.value];
      newValue[index] = value;
      shaderParamsActions.updateParamValue(paramName, newValue);
    }
  }
  
  // Manejar cambios en los checkboxes (para booleans)
  function handleCheckboxChange(paramName: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.checked;
    shaderParamsActions.updateParamValue(paramName, value);
  }
  
  // Restablecer todos los parámetros
  function resetAllParams() {
    shaderParamsActions.resetParams();
  }
  
  onMount(() => {
    // Cargar parámetros iniciales si ya hay un shader seleccionado
    const sources = get(shaderSources);
    if (sources && sources.fragmentShaderSource) {
      loadShaderParams(sources.fragmentShaderSource);
    }
  });
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-medium">Parámetros del Shader</h3>
    <button 
      class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
      on:click={resetAllParams}
    >
      Restablecer
    </button>
  </div>
  
  {#if loading}
    <div class="py-4 text-center text-gray-500">
      Cargando parámetros...
    </div>
  {:else if $shaderParams.length === 0}
    <div class="py-4 text-center text-gray-500">
      No se encontraron parámetros ajustables en este shader.
    </div>
  {:else}
    <div class="space-y-4">
      {#each $shaderParams as param}
        <div class="shader-param">
          <label class="block text-sm font-medium mb-1">{param.label}</label>
          
          {#if param.type === 'float' || param.type === 'int'}
            <div class="flex items-center space-x-2">
              <input 
                type="range" 
                id={param.name} 
                min={param.min} 
                max={param.max} 
                step={param.step} 
                value={param.value as number}
                on:input={(e) => handleSliderChange(param.name, e)}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span class="text-sm w-10 text-right">{(param.value as number).toFixed(2)}</span>
            </div>
          
          {:else if param.type === 'vec2' && Array.isArray(param.value)}
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">X:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[0]}
                  on:input={(e) => handleVectorChange(param.name, 0, e)}
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span class="text-sm w-10 text-right">{param.value[0].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">Y:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[1]}
                  on:input={(e) => handleVectorChange(param.name, 1, e)}
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span class="text-sm w-10 text-right">{param.value[1].toFixed(2)}</span>
              </div>
            </div>
          
          {:else if param.type === 'vec3' && Array.isArray(param.value)}
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">R:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[0]}
                  on:input={(e) => handleVectorChange(param.name, 0, e)}
                  class="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer dark:bg-red-900"
                />
                <span class="text-sm w-10 text-right">{param.value[0].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">G:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[1]}
                  on:input={(e) => handleVectorChange(param.name, 1, e)}
                  class="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-900"
                />
                <span class="text-sm w-10 text-right">{param.value[1].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">B:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[2]}
                  on:input={(e) => handleVectorChange(param.name, 2, e)}
                  class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-900"
                />
                <span class="text-sm w-10 text-right">{param.value[2].toFixed(2)}</span>
              </div>
              <!-- Muestra de color -->
              <div 
                class="w-full h-6 rounded-md border border-gray-300 dark:border-gray-600" 
                style="background-color: rgb({param.value[0] * 255}, {param.value[1] * 255}, {param.value[2] * 255});"
              ></div>
            </div>
          
          {:else if param.type === 'vec4' && Array.isArray(param.value)}
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">R:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[0]}
                  on:input={(e) => handleVectorChange(param.name, 0, e)}
                  class="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer dark:bg-red-900"
                />
                <span class="text-sm w-10 text-right">{param.value[0].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">G:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[1]}
                  on:input={(e) => handleVectorChange(param.name, 1, e)}
                  class="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-900"
                />
                <span class="text-sm w-10 text-right">{param.value[1].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">B:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[2]}
                  on:input={(e) => handleVectorChange(param.name, 2, e)}
                  class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-900"
                />
                <span class="text-sm w-10 text-right">{param.value[2].toFixed(2)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs w-4">A:</span>
                <input 
                  type="range" 
                  min={param.min} 
                  max={param.max} 
                  step={param.step} 
                  value={param.value[3]}
                  on:input={(e) => handleVectorChange(param.name, 3, e)}
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span class="text-sm w-10 text-right">{param.value[3].toFixed(2)}</span>
              </div>
              <!-- Muestra de color con transparencia -->
              <div 
                class="w-full h-6 rounded-md border border-gray-300 dark:border-gray-600 bg-checkered" 
                style="background-color: rgba({param.value[0] * 255}, {param.value[1] * 255}, {param.value[2] * 255}, {param.value[3]});"
              ></div>
            </div>
          
          {:else if param.type === 'bool'}
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id={param.name} 
                checked={param.value as boolean}
                on:change={(e) => handleCheckboxChange(param.name, e)}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label for={param.name} class="ml-2 text-sm font-medium">
                {param.value ? "Activado" : "Desactivado"}
              </label>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Estilo para el fondo a cuadros (para mostrar transparencia) */
  .bg-checkered {
    background-image: 
      linear-gradient(45deg, #ccc 25%, transparent 25%), 
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
  }
  
  /* Mejora de los sliders para diferentes navegadores */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #4B5563;
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #4B5563;
    cursor: pointer;
  }
  
  .dark input[type="range"]::-webkit-slider-thumb {
    background: #E5E7EB;
  }
  
  .dark input[type="range"]::-moz-range-thumb {
    background: #E5E7EB;
  }
</style>
