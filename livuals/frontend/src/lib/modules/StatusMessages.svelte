<script lang="ts">
  import { lcmLiveStatus, inferenceBusy, streamId, inferenceTime } from '$lib/lcmLive';

  export let runtimeNotice: string | undefined = undefined;
  export let buildId: string | undefined = undefined;
  export let backendReady = false;
  export let loadingNotice: string | undefined = undefined;
</script>

<div class="flex flex-col gap-4 w-full">
  <h2 class="title">System Status</h2>

  <div class="flex flex-col gap-4">
    {#if runtimeNotice}
      <div class="p-3 rounded-md" style="border: 1px solid #f59e0b; background-color: rgba(245, 158, 11, 0.1); color: #f59e0b;">
        {runtimeNotice}
      </div>
    {/if}

    <div class="flex flex-col gap-2">
      {#if buildId}
        <div class="text-secondary">Build: {buildId}</div>
      {/if}
      
      <div class="flex items-center gap-3 flex-wrap">
        <div class="text-secondary font-medium">
          Status: {$lcmLiveStatus}
          {#if $inferenceBusy} · Inference: busy{/if}
          {#if $streamId} · ID: {$streamId}{/if}
          {#if $inferenceTime !== null} · Last inference: {$inferenceTime.toFixed(3)}s{/if}
        </div>
        
        {#if $inferenceTime !== null}
          <div class="text-2xl font-bold rounded-lg p-2" style="color: #4ade80; background-color: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80;">
            {(1 / $inferenceTime).toFixed(1)} FPS
          </div>
        {/if}
      </div>
    </div>

    {#if !backendReady}
      <div class="p-3 rounded-md" style="border: 1px solid #4076f6; background-color: rgba(64, 118, 246, 0.1); color: #4076f6;">
        {loadingNotice}
      </div>
    {/if}

    {#if $inferenceBusy}
      <div class="p-3 rounded-md" style="border: 1px solid #4ade80; background-color: rgba(74, 222, 128, 0.1); color: #4ade80;">
        Comenzando inferencia…
      </div>
    {:else}
      <div class="p-3 rounded-md" style="border: 1px solid #4b5563; background-color: rgba(75, 85, 99, 0.1); color: #d1d5db;">
        Stand by
      </div>
    {/if}
  </div>
</div>
