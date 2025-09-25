<script lang="ts">
  export let message: string = '';

  let timeout = 0;
  $: if (message !== '') {
    console.log('message', message);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      message = '';
    }, 5000);
  }
</script>

{#if message}
  <div class="fixed right-0 top-0 m-4" role="alert">
    <button 
      class="rounded-md p-4 w-full text-left" 
      style="background-color: #ef4444; color: #f8fafc; border: none;" 
      on:click={() => (message = '')}
      on:keydown={(e) => e.key === 'Enter' && (message = '')}
    >
      {message}
    </button>
    <div class="bar transition-all duration-500" style="width: 0;"></div>
  </div>
{/if}
