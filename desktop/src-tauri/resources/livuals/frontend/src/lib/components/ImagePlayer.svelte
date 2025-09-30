<script lang="ts">
  import { lcmLiveStatus, LCMLiveStatus, streamId } from '$lib/lcmLive';
  import { getPipelineValues } from '$lib/store';

  import Button from '$lib/components/Button.svelte';
  import Floppy from '$lib/icons/floppy.svelte';
  import { snapImage } from '$lib/utils';
  import { canvasDimensions } from '$lib/canvasDimensions';

  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  $: console.log('isLCMRunning', isLCMRunning);
  let imageEl: HTMLImageElement;
  async function takeSnapshot() {
    if (isLCMRunning) {
      await snapImage(imageEl, {
        prompt: getPipelineValues()?.prompt,
        negative_prompt: getPipelineValues()?.negative_prompt,
        seed: getPipelineValues()?.seed,
        guidance_scale: getPipelineValues()?.guidance_scale
      });
    }
  }
</script>

<div
  class="relative w-full aspect-square overflow-hidden rounded-lg shader-canvas"
  style="max-width: {$canvasDimensions.width}px; max-height: {$canvasDimensions.height}px;"
>
  <!-- svelte-ignore a11y-missing-attribute -->
  {#if isLCMRunning && $streamId}
    <img
      bind:this={imageEl}
      class="aspect-square w-full rounded-lg"
      src={'/api/stream/' + $streamId}
    />
    <div class="absolute bottom-1 right-1">
      <Button
        on:click={takeSnapshot}
        disabled={!isLCMRunning}
        title={'Take Snapshot'}
        variant="primary"
        size="sm"
        classList="ml-auto opacity-70 hover:opacity-100 transition-opacity"
      >
        <Floppy classList={''} />
      </Button>
    </div>
  {:else}
    <div class="aspect-square w-full rounded-lg bg-primary flex items-center justify-center relative">
      <div class="text-center p-4 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="relative">
            <div class="w-3 h-3 rounded-full {$lcmLiveStatus === LCMLiveStatus.DISCONNECTED ? 'bg-red-500' : $lcmLiveStatus === LCMLiveStatus.INITIALIZING ? 'bg-yellow-500' : $lcmLiveStatus === LCMLiveStatus.CONNECTED ? 'bg-green-500' : 'bg-red-500'}"></div>
            {#if $lcmLiveStatus === LCMLiveStatus.INITIALIZING}
              <div class="absolute inset-0 w-3 h-3 rounded-full bg-yellow-500 animate-ping opacity-75"></div>
            {/if}
          </div>
          <p class="text-secondary font-medium text-lg">StreamDiffusion</p>
        </div>
        <p class="text-secondary font-medium mb-1 uppercase text-sm tracking-wider">{$lcmLiveStatus}</p>
        <p class="text-secondary text-sm opacity-80">
          {#if $lcmLiveStatus === LCMLiveStatus.DISCONNECTED}
            Click 'Start' to begin processing
          {:else if $lcmLiveStatus === LCMLiveStatus.INITIALIZING}
            Initializing model...
          {:else if $lcmLiveStatus === LCMLiveStatus.TIMEOUT}
            Connection timed out
          {:else}
            Waiting for input source
          {/if}
        </p>
      </div>
      <img
        class="aspect-square w-full rounded-lg absolute top-0 left-0 opacity-10"
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      />
    </div>
  {/if}
</div>
