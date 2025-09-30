<script lang="ts">
  import type { FieldProps } from '$lib/types';
  import { onMount } from 'svelte';
  export let value = 8.0;
  export let params: FieldProps;
  export let disabled: boolean = false;
  onMount(() => {
    value = Number(params?.default) ?? 8.0;
  });
</script>

<div class="grid max-w-md grid-cols-4 items-center gap-3">
  <label class="text-secondary font-medium" for={params.id}>{params?.title}</label>
  <input
    class="slider col-span-2"
    {disabled}
    bind:value
    type="range"
    id={params.id}
    name={params.id}
    min={params?.min}
    max={params?.max}
    step={params?.step ?? 1}
  />
  <input
    type="number"
    step={params?.step ?? 1}
    bind:value
    class="input text-center text-xs font-medium"
    style="padding: 0.25rem;"
    {disabled}
  />
</div>
<!-- 
<style lang="postcss" scoped>
  input[type='range']::-webkit-slider-runnable-track {
    @apply h-2 cursor-pointer rounded-lg dark:bg-gray-50;
  }
  input[type='range']::-webkit-slider-thumb {
    @apply cursor-pointer rounded-lg dark:bg-gray-50;
  }
  input[type='range']::-moz-range-track {
    @apply cursor-pointer rounded-lg dark:bg-gray-50;
  }
  input[type='range']::-moz-range-thumb {
    @apply cursor-pointer rounded-lg dark:bg-gray-50;
  }
  input[type='range']::-ms-track {
    @apply cursor-pointer rounded-lg dark:bg-gray-50;
  }
  input[type='range']::-ms-thumb {
    @apply cursor-pointer rounded-lg dark:bg-gray-50;
  }
</style> -->
