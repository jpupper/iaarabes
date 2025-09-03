<script lang="ts">
  import { lcmLiveStatus, inferenceBusy, streamId } from '$lib/lcmLive';

  export let runtimeNotice: string | undefined = undefined;
  export let buildId: string | undefined = undefined;
  export let backendReady = false;
  export let loadingNotice: string | undefined = undefined;
</script>

<div class="flex flex-col gap-2 mt-4">
  {#if runtimeNotice}
    <div class="text-sm rounded-md px-3 py-2 border border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-500">
      {runtimeNotice}
    </div>
  {/if}
  {#if buildId}
    <div class="text-xs opacity-70">Build: {buildId}</div>
  {/if}
  <div class="text-xs opacity-80">Status: {$lcmLiveStatus}{#if $inferenceBusy} · Inference: busy{/if}{#if $streamId} · ID: {$streamId}{/if}</div>
  {#if !backendReady}
    <div class="text-sm rounded-md px-3 py-2 border border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-500">
      {loadingNotice}
    </div>
  {/if}
  {#if $inferenceBusy}
    <div class="text-sm rounded-md px-3 py-2 border border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-500">
      Comenzando inferencia…
    </div>
  {/if}
</div>
