<script lang="ts">
  import { pipelineValues } from '$lib/store';
  import { widthHeightSlidersLocked } from '$lib/sliderStore';
  import PipelineOptions from '$lib/components/PipelineOptions.svelte';
  import type { Fields } from '$lib/types';
  
  export let pipelineParams: Fields;
  export let disabled: boolean = false;
  
  let internalDisabled = false;
</script>

<div class="flex flex-col gap-6 w-full">

  <div class="flex flex-col gap-4">
    <PipelineOptions
      {pipelineParams}
      disabled={disabled || internalDisabled}
      shouldBlockSliders={$widthHeightSlidersLocked}
    />
  </div>
</div>
