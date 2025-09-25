<script lang="ts">
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

  // Ensure the component is activated when mounted if isActive is true
  onMount(() => {
    if (isActive) {
      generativePatternActions.start();
      dispatch('generativeSelected');
    }
  });

  async function selectShader(event: Event) {
    const select = event.target as HTMLSelectElement;
    await generativePatternActions.selectShader(select.value);
    
    // Extraer los parámetros del shader seleccionado
    const sources = get(shaderSources);
    if (sources && sources.fragmentShaderSource) {
      shaderParamsActions.loadParamsFromShader(sources.fragmentShaderSource);
    }
  }
  
  // Manejar cambios en los parámetros del shader
  function handleParamChange(data: { name: string; value: any }) {
    const { name, value } = data;
    shaderParamsActions.updateParamValue(name, value);
  }
  
  // Manejar cambios en componentes de vectores
  function handleVectorComponentChange(data: { name: string; index: number; value: number }) {
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

<div class="w-full flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="text-xl">
      🎨
    </div>
    <div class="text-left">
      <div class="font-medium text-secondary">Patrón Generativo</div>
      <div class="text-sm text-secondary opacity-80">
        1280x720 • 60fps
      </div>
    </div>
  </div>
  
  <div class="relative">
    <button 
      class="btn {isActive ? 'btn-primary' : 'btn-secondary'} btn-sm"
      on:click={(e) => {
        e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
        toggleGenerative();
      }}
    >
      {isActive ? 'Seleccionado' : 'Seleccionar'}
    </button>
  </div>
</div>

{#if isActive}
<div class="mt-4 border-t pt-4">
  <div class="flex justify-between items-center mb-3">
    <h4 class="card-title">Configuración</h4>
  </div>
  
  <div>
    <label for="shader-select" class="block text-secondary mb-1">Seleccionar Shader:</label>
    <select 
      id="shader-select" 
      class="select w-full"
      on:change={(e) => {
        e.stopPropagation(); // Evitar que el cambio se propague a la tarjeta
        selectShader(e);
      }}
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
    
    <!-- Sección de parámetros del shader -->
    {#if $shaderParams && $shaderParams.length > 0}
      <div class="mt-4 border-t pt-4">
        <div class="flex justify-between items-center mb-3">
          <h4 class="card-title">Parámetros del Shader</h4>
          <button 
            class="btn btn-primary btn-sm"
            on:click={(e) => {
              e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
              showParameters = !showParameters;
            }}
          >
            {showParameters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        {#if showParameters}
          <div class="p-3 rounded-md bg-primary">
            <div class="mb-3 flex justify-between items-center">
              <span class="text-secondary">{$shaderParams.length} parámetros disponibles</span>
              <button 
                class="btn btn-secondary btn-sm"
                on:click={(e) => {
                  e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
                  resetAllParams();
                }}
              >
                Restablecer valores
              </button>
            </div>
            
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
              {#each $shaderParams as param (param.name)}
                <!-- Parámetro de shader -->
                <div class="shader-param mb-4">
                  <div class="flex justify-between items-center mb-1">
                    <label class="text-secondary font-medium" for="param-{param.name}">
                      {param.label}
                      {#if param.description}
                        <span class="text-secondary ml-1" title={param.description}>ℹ️</span>
                      {/if}
                    </label>
                    <span class="text-secondary">
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
                          e.stopPropagation(); // Evitar que el cambio se propague a la tarjeta
                          const target = e.currentTarget;
                          handleParamChange({ name: param.name, value: target.checked });
                        }}
                        class="checkbox"
                      />
                      <label for="param-{param.name}" class="ml-2 text-secondary font-medium">
                        {param.value ? 'Activado' : 'Desactivado'}
                      </label>
                    </div>
                  {:else if ['vec2', 'vec3', 'vec4'].includes(param.type) && Array.isArray(param.value)}
                    <!-- Sliders para cada componente del vector -->
                    {#each param.value as component, i}
                      <div class="mb-2">
                        <div class="flex justify-between items-center mb-1">
                          <label class="text-secondary" for="param-{param.name}-{i}">
                            {['X', 'Y', 'Z', 'W'][i]}
                          </label>
                          <span class="text-secondary">{component.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          id="param-{param.name}-{i}"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={component}
                          on:input={(e) => {
                            e.stopPropagation(); // Evitar que el cambio se propague a la tarjeta
                            const target = e.currentTarget;
                            handleVectorComponentChange({ name: param.name, index: i, value: parseFloat(target.value) });
                          }}
                          class="slider"
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
                        e.stopPropagation(); // Evitar que el cambio se propague a la tarjeta
                        const target = e.currentTarget;
                        handleParamChange({ name: param.name, value: param.type === 'int' ? parseInt(target.value) : parseFloat(target.value) });
                      }}
                      class="slider"
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
{/if}
