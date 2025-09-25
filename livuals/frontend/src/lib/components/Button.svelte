<script lang="ts">
  export let classList: string = '';
  export let disabled: boolean = false;
  export let title: string = '';
  export let variant: 'primary' | 'secondary' | 'success' | 'error' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<button 
  class="btn btn-{variant} btn-{size} {classList}" 
  on:click 
  {disabled} 
  {title}
>
  <slot />
</button>
