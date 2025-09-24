<script>
  import '../app.css';
  import { onMount } from 'svelte';
  
  // Asegurarse de que el tema se aplique correctamente
  onMount(() => {
    document.documentElement.classList.add('dark');
  });
</script>

<div class="app-container">
  <slot />
</div>

<style>
  .app-container {
    min-height: 100vh;
    background-color: var(--color-background);
    color: var(--color-text-primary);
  }
</style>
