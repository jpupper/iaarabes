<script lang="ts">
  import { lcmLiveStatus, lcmLiveActions, LCMLiveStatus } from '$lib/lcmLive';
  import { mediaStreamActions, onFrameChangeStore } from '$lib/mediaStream';
  import { generativePatternStatus, generativeFrameStore, GenerativePatternStatusEnum } from '$lib/generativePattern';
  import { getPipelineValues } from '$lib/store';
  import { widthHeightSlidersLocked } from '$lib/sliderStore';
  import Button from '$lib/components/Button.svelte';
  import ImagePlayer from '$lib/components/ImagePlayer.svelte';
  import VideoInput from '$lib/components/VideoInput.svelte';
  import GenerativeShader from '$lib/components/GenerativeShader.svelte';
  import ShaderSelector from '$lib/components/ShaderSelector.svelte';
  import Checkbox from '$lib/components/Checkbox.svelte';
  import { FieldType } from '$lib/types';
  
  export let isImageMode: boolean = false;
  export let pipelineParams: any;
  export let warningMessage: string = '';
  export let disabled: boolean = false;
  
  let internalDisabled = false;
  let enableSpout = true;
  
  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  // Actualizar el store widthHeightSlidersLocked cuando cambia el estado
  $: {
    if (isLCMRunning || $lcmLiveStatus === LCMLiveStatus.INITIALIZING) {
      widthHeightSlidersLocked.set(true);
    } else {
      widthHeightSlidersLocked.set(false);
    }
  }
  $: if ($lcmLiveStatus === LCMLiveStatus.TIMEOUT) {
    warningMessage = 'Session timed out. Please try again.';
  }
  
  function getSreamdata() {
    const pipelineValues = getPipelineValues();
    // Add enableSpout to the pipeline values
    pipelineValues.enableSpout = enableSpout;
    
    if (isImageMode) {
      // Si el patrón generativo está activo, usar ese frame en lugar del de la cámara
      if ($generativePatternStatus === GenerativePatternStatusEnum.ACTIVE) {
        return [pipelineValues, $generativeFrameStore?.blob];
      } else {
        return [pipelineValues, $onFrameChangeStore?.blob];
      }
    } else {
      return [pipelineValues];
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
        // Si el patrón generativo está activo, usar ese frame para el snapshot
        let blob;
        if ($generativePatternStatus === GenerativePatternStatusEnum.ACTIVE) {
          blob = $generativeFrameStore?.blob;
          if (!blob || blob.size === 0) {
            warningMessage = 'No hay frame generativo disponible todavía.';
            return;
          }
        } else {
          blob = $onFrameChangeStore?.blob;
          if (!blob || blob.size === 0) {
            warningMessage = 'No hay frame de cámara disponible todavía.';
            return;
          }
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
  <h2 class="text-xl font-bold">Stream Output</h2>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#if isImageMode}
      <div class="sm:col-start-1">
        <h3 class="text-lg font-medium mb-2">Input source</h3>
        {#if $generativePatternStatus === GenerativePatternStatusEnum.ACTIVE}
          <div class="w-full flex flex-col gap-4">
            <div class="flex justify-center items-center">
              <div class="w-4/5 max-w-md">
                <GenerativeShader />
              </div>
            </div>
            <div class="w-full">
              <ShaderSelector />
            </div>
          </div>
        {:else}
          <VideoInput
            width={Number(pipelineParams.width.default)}
            height={Number(pipelineParams.height.default)}
          />
        {/if}
      </div>
    {/if}
    <div class={isImageMode ? 'sm:col-start-2' : 'col-span-2'}>
      <h3 class="text-lg font-medium mb-2">Final Output</h3>
      <ImagePlayer />
    </div>
  </div>
  
  <div class="flex flex-col gap-3">
    <div class="flex gap-3">
      <Button on:click={toggleLcmLive} disabled={disabled || internalDisabled} classList={'text-lg p-3 w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}>
        {#if $lcmLiveStatus === LCMLiveStatus.INITIALIZING}
          <span class="flex items-center justify-center gap-2">
            <span class="animate-spin h-4 w-4 border-2 border-white dark:border-black rounded-full border-t-transparent"></span>
            Iniciando...
          </span>
        {:else if isLCMRunning}
          Stop
        {:else}
          Start
        {/if}
      </Button>
      <Button on:click={snapshotOnce} classList={'text-lg p-3 bg-blue-600 text-white hover:bg-blue-700'}>
        Snapshot
      </Button>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox bind:value={enableSpout} params={{ id: 'enableSpout', title: 'Enable Spout Output', default: '1', field: FieldType.CHECKBOX }} />
    </div>
  </div>
</div>
