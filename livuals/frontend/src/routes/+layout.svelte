<script>
  import '../app.css';
  import { onMount } from 'svelte';
  
  // Asegurarse de que el tema se aplique correctamente
  onMount(() => {
    // Aplicar el tema oscuro
    document.body.style.backgroundColor = '#374151';
    document.body.style.color = '#f8fafc';
  });
</script>

<div class="app-container">
  <slot />
</div>
