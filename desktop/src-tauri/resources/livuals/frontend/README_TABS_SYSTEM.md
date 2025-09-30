# Sistema de Pestañas (Tabs) para Livuals

Este documento describe el sistema de pestañas implementado en Livuals para organizar la interfaz de usuario.

## Características Principales

1. **Sistema de Pestañas**: Organiza la interfaz en pestañas para una mejor experiencia de usuario.
2. **Tipografía Geist**: Implementación de las fuentes Geist Sans y Geist Mono para una apariencia moderna.
3. **Disposición Mejorada**: Corrección de la disposición de los componentes para que aparezcan uno al lado del otro.

## Tipografía

Se han implementado las siguientes tipografías:

- **Principal**: Geist Sans - Una tipografía moderna y legible para la interfaz general.
- **Monoespaciada**: Geist Mono - Una tipografía monoespaciada para código y datos técnicos.

Las fuentes se importan desde un CDN y se definen como variables CSS en el archivo `fonts.css`:

```css
:root {
  --font-main: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
```

## Sistema de Pestañas

El sistema de pestañas se compone de:

1. **TabsSystem.svelte**: Componente principal que gestiona las pestañas.
2. **Estilos CSS**: Definidos en `global.css` para dar formato a las pestañas.

Características mejoradas del sistema de pestañas:

- **Desplazamiento horizontal**: Las pestañas pueden desplazarse horizontalmente cuando hay muchas.
- **Indicador activo**: La pestaña activa se muestra con un color de acento y una línea inferior.
- **Iconos SVG**: Se utilizan iconos SVG para mejorar la apariencia visual.
- **Animación de transición**: El contenido de las pestañas tiene una animación de entrada suave.
- **Accesibilidad**: Se han añadido atributos ARIA para mejorar la accesibilidad.

### Estructura de las Pestañas

Las pestañas se definen como un array de objetos con la siguiente estructura:

```javascript
const tabs = [
  { id: 'ai-panel', label: 'AI Panel', icon: '⚙️' },
  { id: 'stream', label: 'Stream', icon: '📺' },
  { id: 'inputs', label: 'Inputs', icon: '📷' },
  { id: 'lyrics', label: 'Lyrics', icon: '🎵' },
  { id: 'status', label: 'Status', icon: '📊' }
];
```

### Uso del Componente TabsSystem

```svelte
<TabsSystem {tabs} bind:activeTab on:tabChange={handleTabChange}>
  <!-- Contenido opcional -->
</TabsSystem>

<!-- Contenido de las pestañas -->
<div class="tab-content {activeTab === 'tab-id' ? 'active' : ''}">
  <!-- Contenido de la pestaña -->
</div>
```

### Eventos

El componente TabsSystem emite un evento `tabChange` cuando se cambia de pestaña, con el ID de la pestaña seleccionada:

```javascript
function handleTabChange(event) {
  console.log('Tab changed:', event.detail.tabId);
}
```

## Disposición de Componentes

Se ha mejorado la disposición de los componentes en StreamOutput.svelte para que aparezcan uno al lado del otro, utilizando un sistema de flexbox adaptativo:

```svelte
<div class="flex flex-wrap gap-4">
  <div class="flex-1 min-w-[300px]"><!-- Input source --></div>
  <div class="flex-1 min-w-[300px]"><!-- Final Output --></div>
</div>
```

Este enfoque permite que los componentes:

1. Se coloquen uno al lado del otro en pantallas grandes
2. Se apilen verticalmente en pantallas pequeñas cuando el espacio es insuficiente
3. Mantengan un tamaño mínimo de 300px para asegurar la legibilidad
4. Se distribuyan equitativamente el espacio disponible

## Estilos Adicionales

Se han implementado varios estilos adicionales:

1. **canvas-size-button.css**: Define los estilos de los botones de tamaño del canvas.
2. **Clases de utilidad flexbox**: Se han añadido numerosas clases de utilidad para flexbox:
   - `.flex`, `.flex-col`, `.flex-row`, `.flex-wrap`, etc.
   - `.flex-1`, `.flex-auto`, `.flex-initial`, `.flex-none`
   - `.items-center`, `.items-start`, `.items-end`, `.items-stretch`
   - `.justify-center`, `.justify-between`, `.justify-start`, etc.
3. **Espaciado y gaps**: Clases para espaciado y gaps como `.gap-1`, `.gap-2`, etc.
4. **Animaciones**: Se ha añadido una animación `fadeIn` para transiciones suaves.

## Implementación

Para implementar estos cambios, se han actualizado los siguientes archivos:

1. **fonts.css**: Define las variables de tipografía.
2. **global.css**: Actualizado para incluir los estilos de las pestañas y los botones.
3. **TabsSystem.svelte**: Componente para gestionar las pestañas.
4. **+page.svelte**: Actualizado para usar el sistema de pestañas.
5. **StreamOutput.svelte**: Corregida la disposición de los componentes.
6. **canvas-size-button.css**: Estilos para los botones de tamaño del canvas.
