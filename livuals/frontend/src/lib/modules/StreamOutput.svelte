<script lang="ts">
  import { lcmLiveStatus, lcmLiveActions, LCMLiveStatus } from '$lib/lcmLive';
  import { mediaStreamActions, onFrameChangeStore, mediaStreamStatus, MediaStreamStatusEnum } from '$lib/mediaStream';
  import { generativePatternStatus, generativeFrameStore, GenerativePatternStatusEnum } from '$lib/generativePattern';
  import { getPipelineValues } from '$lib/store';
  import { widthHeightSlidersLocked } from '$lib/sliderStore';
  import { canvasDimensions, canvasDimensionsActions } from '$lib/canvasDimensions';
  import Button from '$lib/components/Button.svelte';
  import ImagePlayer from '$lib/components/ImagePlayer.svelte';
  import VideoInput from '$lib/components/VideoInput.svelte';
  import GenerativeShader from '$lib/components/GenerativeShader.svelte';
  import Checkbox from '$lib/components/Checkbox.svelte';
  import CanvasSizeControl from '$lib/components/CanvasSizeControl.svelte';
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
  <h2 class="title">Stream Output</h2>

  <div class="flex flex-wrap gap-4">
    {#if isImageMode}
      <div class="flex-1 min-w-[300px]">
        <div class="flex justify-between items-center mb-2">
          <h3 class="subtitle mb-0">Input source</h3>
          <div class="text-secondary text-sm flex items-center">
            <div class="w-2 h-2 rounded-full {$generativePatternStatus === GenerativePatternStatusEnum.ACTIVE || $mediaStreamStatus === MediaStreamStatusEnum.CONNECTED ? 'bg-green-500' : 'bg-red-500'} mr-1"></div>
            {#if $generativePatternStatus === GenerativePatternStatusEnum.ACTIVE}
              Generative Pattern
            {:else if $mediaStreamStatus === MediaStreamStatusEnum.CONNECTED}
              Camera Connected
            {:else}
              No Input
            {/if}
          </div>
        </div>
        {#if $generativePatternStatus === GenerativePatternStatusEnum.ACTIVE}
          <div class="w-full flex flex-col gap-4">
            <div class="flex justify-center items-center">
              <GenerativeShader />
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
    <div class="flex-1 min-w-[300px]">
      <div class="flex justify-between items-center mb-2">
        <h3 class="subtitle mb-0">Final Output</h3>
        <div class="text-secondary text-sm flex items-center">
          <div class="w-2 h-2 rounded-full {$lcmLiveStatus === LCMLiveStatus.CONNECTED ? 'bg-green-500' : $lcmLiveStatus === LCMLiveStatus.INITIALIZING ? 'bg-yellow-500' : 'bg-red-500'} mr-1"></div>
          {$lcmLiveStatus}
        </div>
      </div>
      <ImagePlayer />
    </div>
  </div>
  
  <div class="flex flex-col gap-3">
    <div class="mb-4">
      <CanvasSizeControl />
    </div>
    <div class="flex gap-3">
      <Button 
        on:click={toggleLcmLive} 
        disabled={disabled || internalDisabled} 
        variant="primary"
        size="lg"
        classList="w-full"
      >
        {#if $lcmLiveStatus === LCMLiveStatus.INITIALIZING}
          <span class="flex items-center justify-center gap-2">
            <span class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            Iniciando...
          </span>
        {:else if isLCMRunning}
          Stop
        {:else}
          Start
        {/if}
      </Button>
      <Button 
        on:click={snapshotOnce} 
        variant="secondary"
        size="lg"
      >
        Snapshot
      </Button>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox bind:value={enableSpout} params={{ id: 'enableSpout', title: 'Enable Spout Output', default: '1', field: FieldType.CHECKBOX }} />
    </div>
  </div>
</div>
