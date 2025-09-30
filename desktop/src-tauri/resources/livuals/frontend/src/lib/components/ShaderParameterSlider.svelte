<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ShaderParam } from '$lib/shaderParams';
  
  export let param: ShaderParam;
  
  const dispatch = createEventDispatcher();
  
  // Función para manejar cambios en parámetros escalares (float, int, bool)
  function handleScalarChange(event) {
    const target = event.target;
    let value;
    
    if (param.type === 'bool') {
      value = target.checked;
    } else if (param.type === 'int') {
      value = parseInt(target.value);
    } else {
      value = parseFloat(target.value);
    }
    
    dispatch('change', { name: param.name, value });
  }
  
  // Función para manejar cambios en componentes de vectores
  function handleVectorComponentChange(index, event) {
    const target = event.target;
    const value = parseFloat(target.value);
    
    dispatch('changeComponent', { name: param.name, index, value });
  }
  
  // Función para formatear el valor para mostrar
  function formatValue(value) {
    return value.toFixed(2);
  }
  
  // Determinar si el parámetro es un vector
  $: isVector = ['vec2', 'vec3', 'vec4'].includes(param.type);
  
  // Obtener componentes del vector si es un vector
  $: vectorComponents = isVector && Array.isArray(param.value) ? param.value : [];
  
  // Nombres para los componentes de vectores
  const componentNames = ['X', 'Y', 'Z', 'W'];
</script>

<div class="shader-param mb-4">
  <div class="flex justify-between items-center mb-1">
    <label class="text-sm font-medium" for="param-{param.name}">
      {param.label}
      {#if param.description}
        <span class="text-xs text-gray-500 ml-1" title={param.description}>ℹ️</span>
      {/if}
    </label>
    <span class="text-xs text-gray-600">
      {#if isVector}
        [
        {#each vectorComponents as component, i}
          {#if i > 0}, {/if}{formatValue(component)}
        {/each}
        ]
      {:else if param.type === 'bool'}
        {param.value ? 'On' : 'Off'}
      {:else}
        {formatValue(param.value)}
      {/if}
    </span>
  </div>
  
  {#if param.type === 'bool'}
    <!-- Checkbox para booleanos -->
    <div class="flex items-center">
      <input
        type="checkbox"
        id="param-{param.name}"
        checked={param.value}
        on:change={handleScalarChange}
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
      <label for="param-{param.name}" class="ml-2 text-sm font-medium text-gray-900">
        {param.value ? 'Activado' : 'Desactivado'}
      </label>
    </div>
  {:else if isVector}
    <!-- Sliders para cada componente del vector -->
    {#each vectorComponents as component, i}
      <div class="mb-2">
        <div class="flex justify-between items-center mb-1">
          <label class="text-xs text-gray-600" for="param-{param.name}-{i}">
            {componentNames[i]}
          </label>
          <span class="text-xs text-gray-600">{formatValue(component)}</span>
        </div>
        <input
          type="range"
          id="param-{param.name}-{i}"
          min={param.min}
          max={param.max}
          step={param.step}
          value={component}
          on:input={(e) => handleVectorComponentChange(i, e)}
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
      value={param.value}
      on:input={handleScalarChange}
      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  {/if}
</div>
