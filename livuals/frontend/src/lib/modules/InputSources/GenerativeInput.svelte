<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { generativePatternActions, AVAILABLE_SHADERS, selectedShader, shaderSources } from '$lib/generativePattern';
  import { shaderParams, shaderParamsActions, parameterChanged } from '$lib/shaderParams';
  import { mediaStreamActions } from '$lib/mediaStream';
  import { get } from 'svelte/store';

  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  // Local state to show/hide parameters - shown by default
  let showParameters = true;
  
  // Load shaders when mounting the component
  onMount(async () => {
    console.log('GenerativeInput: Checking available shaders...');
    
    // If no shaders are loaded, load them
    if (get(AVAILABLE_SHADERS).length === 0) {
      console.log('GenerativeInput: No shaders loaded, loading...');
      await generativePatternActions.loadShaders();
    } else {
      console.log('GenerativeInput: Shaders already loaded:', get(AVAILABLE_SHADERS));
    }
  });

  async function toggleGenerative() {
    isActive = !isActive;
    
    if (isActive) {
      // Stop any active camera or screen stream
      mediaStreamActions.stop();
      
      // Start the generative pattern
      generativePatternActions.start();
      dispatch('generativeSelected');
      
      // Ensure a shader is selected and loaded
      await ensureShaderSelected();
      
      console.log('Generative pattern activated, media streams stopped');
    } else {
      generativePatternActions.stop();
      dispatch('generativeDeselected');
      console.log('Generative pattern deactivated');
    }
  }
  
  // Helper function to ensure a shader is selected and loaded
  async function ensureShaderSelected() {
    console.log('Ensuring shader is selected...');
    const currentShader = get(selectedShader);
    const availableShaders = get(AVAILABLE_SHADERS);
    
    if ((!currentShader || !currentShader.id) && availableShaders.length > 0) {
      console.log('No shader selected, selecting the first available one:', availableShaders[0]);
      await generativePatternActions.selectShader(availableShaders[0].id);
    } else if (currentShader && currentShader.id) {
      // If a shader is already selected, reload it to ensure parameters are loaded
      console.log('Reloading current shader:', currentShader);
      await generativePatternActions.loadShaderSource(currentShader.id);
    } else if (availableShaders.length === 0) {
      // If no shaders are available, load them first
      console.log('No shaders available, loading shaders...');
      await generativePatternActions.loadShaders();
      const newAvailableShaders = get(AVAILABLE_SHADERS);
      if (newAvailableShaders.length > 0) {
        console.log('Shaders loaded, selecting the first one:', newAvailableShaders[0]);
        await generativePatternActions.selectShader(newAvailableShaders[0].id);
      }
    }
  }

  // Ensure the component is activated when mounted if isActive is true
  onMount(async () => {
    if (isActive) {
      generativePatternActions.start();
      dispatch('generativeSelected');
      
      // Ensure a shader is selected and loaded
      await ensureShaderSelected();
    }
  });

  async function selectShader(event: Event) {
    try {
      const select = event.target as HTMLSelectElement;
      const shaderId = select.value;
      console.log('Selecting shader:', shaderId);
      
      // Verify that the shader exists in the list of available shaders
      const availableShaders = get(AVAILABLE_SHADERS);
      const shaderExists = availableShaders.some(s => s.id === shaderId);
      
      if (!shaderExists) {
        console.warn(`Shader ${shaderId} does not exist in the list of available shaders`);
        console.log('Available shaders:', availableShaders);
      }
      
      // Select the shader
      const success = await generativePatternActions.selectShader(shaderId);
      console.log(`Shader ${shaderId} selected successfully:`, success);
      
      // Extract parameters from the selected shader
      const sources = get(shaderSources);
      console.log('Shader sources after selecting:', sources);
      
      if (sources && sources.fragmentShaderSource) {
        console.log('Loading shader parameters from source');
        const params = shaderParamsActions.loadParamsFromShader(sources.fragmentShaderSource);
        console.log('Parameters loaded:', params);
      } else {
        console.warn('No shader source available to load parameters from');
      }
      
      // Verify that the shader was selected correctly
      const currentShader = get(selectedShader);
      console.log('Current shader after selecting:', currentShader);
    } catch (error) {
      console.error('Error selecting shader:', error);
    }
  }
  
  // Handle changes in shader parameters
  function handleParamChange(data: { name: string; value: any }) {
    const { name, value } = data;
    shaderParamsActions.updateParamValue(name, value);
  }
  
  // Handle changes in vector components
  function handleVectorComponentChange(data: { name: string; index: number; value: number }) {
    const { name, index, value } = data;
    shaderParamsActions.updateVectorComponent(name, index, value);
  }
  
  // Reset all parameters to their default values
  function resetAllParams() {
    shaderParamsActions.resetParams();
  }
  
  // Watch for shader changes to load parameters
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
      <div class="font-medium text-secondary">Generative Pattern</div>
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
      {isActive ? 'Selected' : 'Select'}
    </button>
  </div>
</div>

{#if isActive}
<div class="mt-2 border-t pt-2">
  <div class="flex justify-between items-center mb-1">
    <h4 class="card-title">Configuration</h4>
  </div>
  
  <div>
    <div class="flex justify-between items-center mb-1">
      <label for="shader-select" class="block text-secondary">Select Shader:</label>
      <button 
        class="btn btn-primary btn-sm flex items-center gap-1"
        on:click={async (e) => {
          e.stopPropagation();
          const currentShader = get(selectedShader);
          try {
            await generativePatternActions.loadShaders();
            const shaders = get(AVAILABLE_SHADERS);
            
            // Intentar mantener el shader actual seleccionado si aún existe
            if (currentShader && shaders.find(s => s.id === currentShader.id)) {
              await generativePatternActions.selectShader(currentShader.id);
            }
            console.log(`✓ ${shaders.length} shaders reloaded`);
          } catch (error) {
            console.error('Error reloading shaders:', error);
          }
        }}
        title="Reload shader list from server"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reload
      </button>
    </div>
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
        <option value="" disabled>Loading shaders...</option>
      {/if}
    </select>
  </div>
    
    <!-- Shader parameters section -->
    {#if $shaderParams && $shaderParams.length > 0}
      <div class="mt-2 border-t pt-2">
        <div class="flex justify-between items-center mb-1">
          <h4 class="card-title">Shader Parameters</h4>
          <button 
            class="flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all"
            on:click={(e) => {
              e.stopPropagation(); // Evitar que el clic se propague a la tarjeta
              showParameters = !showParameters;
            }}
            title="{showParameters ? 'Hide parameters' : 'Show parameters'}"
          >
            <!-- Flecha simple y clara -->
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              class="transition-transform duration-300 {showParameters ? 'rotate-180' : ''}"
            >
              <path 
                fill="white" 
                d="M8 12L2 6h12z"
              />
            </svg>
          </button>
        </div>
        
        {#if showParameters}
          <div class="p-2 rounded-md bg-primary">
            <div class="mb-1 flex justify-between items-center">
              <span class="text-secondary">{$shaderParams.length} available parameters</span>
              <div class="flex gap-2">
                <button 
                  class="btn btn-primary btn-sm"
                  on:click={(e) => {
                    e.stopPropagation();
                    shaderParamsActions.randomizeParams();
                  }}
                  title="Randomize all parameters"
                >
                  RDM
                </button>
                <button 
                  class="btn btn-secondary btn-sm"
                  on:click={(e) => {
                    e.stopPropagation();
                    resetAllParams();
                  }}
                >
                  Reset values
                </button>
              </div>
            </div>
            
            <div class="space-y-0.5 max-h-60 overflow-y-auto pr-2">
              {#each $shaderParams as param (param.name)}
                <!-- Shader parameter -->
                <div class="shader-param mb-1">
                  <div class="flex justify-center items-center mb-0.5 gap-2">
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
                    <!-- Checkbox for booleans -->
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
                        {param.value ? 'Enabled' : 'Disabled'}
                      </label>
                    </div>
                  {:else if ['vec2', 'vec3', 'vec4'].includes(param.type) && Array.isArray(param.value)}
                    <!-- Sliders for each vector component -->
                    {#each param.value as component, i}
                      <div class="mb-1">
                        <div class="flex justify-center items-center mb-0.5 gap-2">
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
                    <!-- Slider for float or int -->
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
