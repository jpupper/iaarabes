<script lang="ts">
  import { pipelineValues } from '$lib/store';
  import PipelineOptions from '$lib/components/PipelineOptions.svelte';
  import type { Fields } from '$lib/types';
  
  export let pipelineParams: Fields;
  export let disabled: boolean = false;
  
  let internalDisabled = false;
</script>

<div class="flex flex-col gap-6 w-full">
  <h2 class="text-xl font-bold">AI Controls</h2>

  <div class="flex flex-col gap-4">
    <PipelineOptions
      {pipelineParams}
      disabled={disabled || internalDisabled}
    />
  </div>
</div>
