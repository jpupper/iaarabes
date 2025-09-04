<script lang="ts">
  import { mediaDevices, mediaStreamActions } from '$lib/mediaStream';
  import { onMount } from 'svelte';

  let deviceId: string = '';
  $: {
    console.log($mediaDevices);
  }
  $: {
    console.log(deviceId);
  }
  onMount(() => {
    deviceId = $mediaDevices[0].deviceId;
  });
</script>

<div class="flex items-center gap-2">
  {#if $mediaDevices}
    <select
      bind:value={deviceId}
      on:change={() => mediaStreamActions.switchCamera(deviceId)}
      id="devices-list"
      class="block cursor-pointer rounded-md border-2 border-gray-200 dark:border-gray-700 p-2 text-sm font-medium dark:bg-gray-800 dark:text-white"
    >
      {#each $mediaDevices as device, i}
        <option value={device.deviceId}>{device.label || `Camera ${i + 1}`}</option>
      {/each}
    </select>
  {/if}
</div>
