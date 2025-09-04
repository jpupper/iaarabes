<script lang="ts">
  import { onMount } from 'svelte';
  import { lcmLiveStatus, lcmLiveActions, LCMLiveStatus, inferenceBusy, streamId } from '$lib/lcmLive';
  import { mediaStreamActions, onFrameChangeStore } from '$lib/mediaStream';
  import { getPipelineValues, deboucedPipelineValues } from '$lib/store';
  import Button from '$lib/components/Button.svelte';
  import ImagePlayer from '$lib/components/ImagePlayer.svelte';
  import VideoInput from '$lib/components/VideoInput.svelte';
  import PipelineOptions from '$lib/components/PipelineOptions.svelte';
  
  export let isImageMode: boolean = false;
  export let pipelineParams: any;
  export let warningMessage: string = '';
  export let disabled: boolean = false;
  
  let internalDisabled = false;
  
  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  $: if ($lcmLiveStatus === LCMLiveStatus.TIMEOUT) {
    warningMessage = 'Session timed out. Please try again.';
  }
  
  function getSreamdata() {
    if (isImageMode) {
      return [getPipelineValues(), $onFrameChangeStore?.blob];
    } else {
      return [$deboucedPipelineValues];
    }
  }
  
  async function toggleLcmLive() {
    try {
      if (!isLCMRunning) {
        if (isImageMode) {
          await mediaStreamActions.enumerateDevices();
          await mediaStreamActions.start();
        }
        internalDisabled = true;
        await lcmLiveActions.start(getSreamdata);
        internalDisabled = false;
      } else {
        if (isImageMode) {
          mediaStreamActions.stop();
        }
        lcmLiveActions.stop();
      }
    } catch (e) {
      warningMessage = e instanceof Error ? e.message : '';
      internalDisabled = false;
    }
  }
  
  async function snapshotOnce() {
    try {
      const params = getPipelineValues();
      const fd = new FormData();
      fd.append('params', JSON.stringify(params));
      if (isImageMode) {
        const blob = $onFrameChangeStore?.blob;
        if (!blob || blob.size === 0) {
          warningMessage = 'No hay frame de cámara disponible todavía.';
          return;
        }
        fd.append('image', blob, 'input.jpg');
      }
      const res = await fetch('/api/snapshot', { method: 'POST', body: fd });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Snapshot failed: ${msg}`);
      }
      const out = await res.blob();
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livuals_snapshot_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      warningMessage = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<div class="flex flex-col gap-6 w-full">
  <h2 class="text-xl font-bold">AI Controls</h2>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#if isImageMode}
      <div class="sm:col-start-1">
        <VideoInput
          width={Number(pipelineParams.width.default)}
          height={Number(pipelineParams.height.default)}
        />
      </div>
    {/if}
    <div class={isImageMode ? 'sm:col-start-2' : 'col-span-2'}>
      <ImagePlayer />
    </div>
  </div>
  
  <div class="flex flex-col gap-4">
    <div class="flex gap-3">
      <Button on:click={toggleLcmLive} disabled={disabled || internalDisabled} classList={'text-lg p-3 w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}>
        {#if isLCMRunning}
          Stop
        {:else}
          Start
        {/if}
      </Button>
      <Button on:click={snapshotOnce} classList={'text-lg p-3 bg-blue-600 text-white hover:bg-blue-700'}>
        Snapshot
      </Button>
    </div>
    
    <div class="mt-4">
      <h3 class="text-lg font-semibold mb-4">Pipeline Options</h3>
      <PipelineOptions {pipelineParams} />
    </div>
  </div>
</div>
