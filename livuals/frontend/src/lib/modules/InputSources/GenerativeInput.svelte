<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { generativePatternActions, AVAILABLE_SHADERS, selectedShader, shaderSources } from '$lib/generativePattern';
  import { shaderParams, shaderParamsActions, parameterChanged } from '$lib/shaderParams';
  import { get } from 'svelte/store';

  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  // Estado local para mostrar/ocultar parámetros - por defecto mostrados
  let showParameters = true;
  
  // Cargar shaders al montar el componente
  onMount(async () => {
    console.log('GenerativeInput: Verificando shaders disponibles...');
    
    // Si no hay shaders cargados, cargarlos
    if (get(AVAILABLE_SHADERS).length === 0) {
      console.log('GenerativeInput: No hay shaders cargados, cargando...');
      await generativePatternActions.loadShaders();
    } else {
      console.log('GenerativeInput: Shaders ya cargados:', get(AVAILABLE_SHADERS));
    }
  });

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

  async function selectShader(event) {
    const select = event.target;
    await generativePatternActions.selectShader(select.value);
    
    // Extraer los parámetros del shader seleccionado
    const sources = get(shaderSources);
    if (sources && sources.fragmentShaderSource) {
      shaderParamsActions.loadParamsFromShader(sources.fragmentShaderSource);
    }
  }
  
  // Manejar cambios en los parámetros del shader
  function handleParamChange(data) {
    const { name, value } = data;
    shaderParamsActions.updateParamValue(name, value);
  }
  
  // Manejar cambios en componentes de vectores
  function handleVectorComponentChange(data) {
    const { name, index, value } = data;
    shaderParamsActions.updateVectorComponent(name, index, value);
  }
  
  // Restablecer todos los parámetros a sus valores predeterminados
  function resetAllParams() {
    shaderParamsActions.resetParams();
  }
  
  // Observar cambios en los shaders para cargar parámetros
  $: if ($shaderSources && $shaderSources.fragmentShaderSource) {
    shaderParamsActions.loadParamsFromShader($shaderSources.fragmentShaderSource);
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
        value={$selectedShader?.id || ''}
      >
        {#if $AVAILABLE_SHADERS && $AVAILABLE_SHADERS.length > 0}
          {#each $AVAILABLE_SHADERS as shader}
            <option value={shader.id}>{shader.name}</option>
          {/each}
        {:else}
          <option value="" disabled>Cargando shaders...</option>
        {/if}
      </select>
    </div>
    
    <Button 
      on:click={toggleGenerative}
      classList={isActive ? 'p-2 bg-blue-600 hover:bg-blue-700' : 'p-2 bg-gray-500 hover:bg-gray-600'}
    >
      {isActive ? 'Seleccionado' : 'Seleccionar'}
    </Button>
    
    <!-- Sección de parámetros del shader -->
    {#if $shaderParams && $shaderParams.length > 0}
      <div class="mt-4 border-t pt-4 bg-blue-50 p-2 rounded">
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-md font-medium text-blue-800">Parámetros del Shader</h4>
          <button 
            class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            on:click={() => showParameters = !showParameters}
          >
            {showParameters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        {#if showParameters}
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="mb-3 flex justify-between items-center">
              <span class="text-sm text-gray-600">{$shaderParams.length} parámetros disponibles</span>
              <button 
                class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                on:click={resetAllParams}
              >
                Restablecer valores
              </button>
            </div>
            
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
              {#each $shaderParams as param (param.name)}
                <!-- Parámetro de shader -->
                <div class="shader-param mb-4">
                  <div class="flex justify-between items-center mb-1">
                    <label class="text-sm font-medium" for="param-{param.name}">
                      {param.label}
                      {#if param.description}
                        <span class="text-xs text-gray-500 ml-1" title={param.description}>ℹ️</span>
                      {/if}
                    </label>
                    <span class="text-xs text-gray-600">
                      {#if ['vec2', 'vec3', 'vec4'].includes(param.type) && Array.isArray(param.value)}
                        [
                        {#each param.value as component, i}
                          {#if i > 0}, {/if}{component.toFixed(2)}
                        {/each}
                        ]
                      {:else if param.type === 'bool'}
                        {param.value ? 'On' : 'Off'}
                      {:else}
                        {typeof param.value === 'number' ? param.value.toFixed(2) : '0.00'}
                      {/if}
                    </span>
                  </div>
                  
                  {#if param.type === 'bool'}
                    <!-- Checkbox para booleanos -->
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        id="param-{param.name}"
                        checked={Boolean(param.value)}
                        on:change={(e) => {
                          const target = e.currentTarget;
                          handleParamChange({ name: param.name, value: target.checked });
                        }}
                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label for="param-{param.name}" class="ml-2 text-sm font-medium text-gray-900">
                        {param.value ? 'Activado' : 'Desactivado'}
                      </label>
                    </div>
                  {:else if ['vec2', 'vec3', 'vec4'].includes(param.type) && Array.isArray(param.value)}
                    <!-- Sliders para cada componente del vector -->
                    {#each param.value as component, i}
                      <div class="mb-2">
                        <div class="flex justify-between items-center mb-1">
                          <label class="text-xs text-gray-600" for="param-{param.name}-{i}">
                            {['X', 'Y', 'Z', 'W'][i]}
                          </label>
                          <span class="text-xs text-gray-600">{component.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          id="param-{param.name}-{i}"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={component}
                          on:input={(e) => {
                            const target = e.currentTarget;
                            handleVectorComponentChange({ name: param.name, index: i, value: parseFloat(target.value) });
                          }}
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    {/each}
                  {:else}
                    <!-- Slider para float o int -->
                    <input
                      type="range"
                      id="param-{param.name}"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={Number(param.value)}
                      on:input={(e) => {
                        const target = e.currentTarget;
                        handleParamChange({ name: param.name, value: param.type === 'int' ? parseInt(target.value) : parseFloat(target.value) });
                      }}
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
