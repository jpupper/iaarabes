<script lang="ts">
  import { lcmLiveStatus, inferenceBusy, streamId, inferenceTime } from '$lib/lcmLive';

  export let runtimeNotice: string | undefined = undefined;
  export let buildId: string | undefined = undefined;
  export let backendReady = false;
  export let loadingNotice: string | undefined = undefined;
</script>

<div class="flex flex-col gap-4 w-full">
  <h2 class="text-xl font-bold">System Status</h2>

  <div class="flex flex-col gap-4">
    {#if runtimeNotice}
      <div class="text-sm rounded-md px-4 py-3 border border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-500">
        {runtimeNotice}
      </div>
    {/if}

    <div class="flex flex-col gap-2">
      {#if buildId}
        <div class="text-sm opacity-70">Build: {buildId}</div>
      {/if}
      
      <div class="flex items-center gap-3 flex-wrap">
        <div class="text-sm">
          Status: {$lcmLiveStatus}
          {#if $inferenceBusy} · Inference: busy{/if}
          {#if $streamId} · ID: {$streamId}{/if}
          {#if $inferenceTime !== null} · Last inference: {$inferenceTime.toFixed(3)}s{/if}
        </div>
        
        {#if $inferenceTime !== null}
          <div class="text-2xl font-bold text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
            {(1 / $inferenceTime).toFixed(1)} FPS
          </div>
        {/if}
      </div>
    </div>

    {#if !backendReady}
      <div class="text-sm rounded-md px-4 py-3 border border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-500">
        {loadingNotice}
      </div>
    {/if}

    {#if $inferenceBusy}
      <div class="text-sm rounded-md px-4 py-3 border border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-500">
        Comenzando inferencia…
      </div>
    {:else}
      <div class="text-sm rounded-md px-4 py-3 border border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700">
        Stand by
      </div>
    {/if}
  </div>
</div>
