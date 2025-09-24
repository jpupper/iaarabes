<script lang="ts">
  export let classList: string = '';
  export let disabled: boolean = false;
  export let title: string = '';
  export let variant: 'primary' | 'secondary' | 'success' | 'error' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<button 
  class="btn btn-{variant} {size === 'sm' ? 'text-xs p-2' : size === 'lg' ? 'text-lg p-4' : 'p-3'} {classList}" 
  on:click 
  {disabled} 
  {title}
>
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-md);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .btn-primary {
    background-color: var(--color-accent);
    color: var(--color-secondary);
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-hover-accent);
  }
  
  .btn-secondary {
    background-color: var(--color-primary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-hover-primary);
  }
  
  .btn-success {
    background-color: var(--color-success);
    color: var(--color-primary);
  }
  
  .btn-success:hover:not(:disabled) {
    background-color: var(--color-hover-success);
  }
  
  .btn-error {
    background-color: var(--color-error);
    color: var(--color-secondary);
  }
  
  .btn-error:hover:not(:disabled) {
    background-color: var(--color-hover-error);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
