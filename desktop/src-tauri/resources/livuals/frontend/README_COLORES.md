# Sistema de Colores de Livuals

Este documento describe el sistema de colores implementado en Livuals, basado en la paleta de colores proporcionada.

## Paleta de Colores Principal

| Nombre | Valor Hexadecimal | Descripción |
|--------|-------------------|-------------|
| Background | #374151 | Color de fondo principal de la aplicación |
| Primary | #1f2937 | Color primario para elementos de interfaz |
| Secondary | #f8fafc | Color secundario para textos y elementos claros |
| Accent | #4076f6 | Color de acento para elementos destacados |
| Error | #ef4444 | Color para errores y alertas |
| Success | #4ade80 | Color para acciones exitosas |

## Implementación

El sistema de colores está implementado mediante variables CSS en el archivo `theme.css`. Esto permite una fácil actualización y mantenimiento de la paleta de colores en toda la aplicación.

### Variables CSS

```css
:root {
  --color-background: #374151;
  --color-primary: #1f2937;
  --color-secondary: #f8fafc;
  --color-accent: #4076f6;
  --color-error: #ef4444;
  --color-success: #4ade80;
  
  /* Colores adicionales */
  --color-text-primary: var(--color-secondary);
  --color-text-secondary: #d1d5db;
  --color-border: #4b5563;
  --color-hover-accent: #3b6fe0;
  --color-hover-primary: #283548;
  --color-hover-success: #3dc873;
  --color-hover-error: #e12d2d;
}
```

## Uso en Componentes

Los componentes utilizan estas variables CSS para mantener una apariencia consistente en toda la aplicación. Ejemplos de uso:

### Botones

```css
.btn-primary {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}

.btn-success {
  background-color: var(--color-success);
  color: var(--color-primary);
}

.btn-error {
  background-color: var(--color-error);
  color: var(--color-secondary);
}
```

### Tarjetas y Contenedores

```css
.card {
  background-color: var(--color-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.module-container {
  background-color: var(--color-primary);
  border: 1px solid var(--color-border);
}
```

### Textos

```css
.section-title {
  color: var(--color-accent);
}

.secondary-text {
  color: var(--color-text-secondary);
}
```

## Componentes Actualizados

Los siguientes componentes han sido actualizados para usar el nuevo sistema de colores:

1. Button.svelte
2. GenerativeShader.svelte
3. ShaderSelector.svelte
4. InputSourcesModule.svelte
5. GenerativeInput.svelte

## Modo Oscuro

El tema oscuro es el predeterminado y utiliza la paleta de colores especificada. Se aplica automáticamente al cargar la aplicación mediante la adición de la clase `dark` al elemento HTML raíz.

```javascript
onMount(() => {
  document.documentElement.classList.add('dark');
});
```
