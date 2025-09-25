<script lang="ts">
  import type { FieldProps } from '$lib/types';
  import { onMount } from 'svelte';
  export let value: string;
  export let params: FieldProps;
  export let disabled: boolean = false;
  onMount(() => {
    value = String(params?.default ?? '');
  });
</script>

<div class="">
  <label class="text-secondary font-medium mb-1 block" for={params?.id}>
    {params?.title}
  </label>
  <div class="">
    <textarea
      id={params?.id}
      class="textarea w-full"
      {disabled}
      title={params?.title}
      placeholder="Add your prompt here..."
      bind:value
    ></textarea>
  </div>
</div>
