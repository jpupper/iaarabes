<script lang="ts">
  import type { FieldProps } from '$lib/types';
  import { onMount } from 'svelte';
  export let value = '';
  export let params: FieldProps;
  export let disabled: boolean = false;
  onMount(() => {
    value = String(params?.default);
  });
</script>

<div class="grid max-w-md grid-cols-4 items-center justify-items-start gap-3">
  <label for={params.id} class="text-secondary font-medium">{params?.title} </label>
  {#if params?.values}
    <select
      bind:value
      id={params.id}
      class="select"
      {disabled}
    >
      {#each params.values as model, i}
        <option value={model} selected={i === 0}>{model}</option>
      {/each}
    </select>
  {/if}
</div>
