# Sistema de CSS Centralizado para Livuals

Este documento describe el sistema de CSS centralizado implementado en Livuals, basado en la paleta de colores proporcionada.

## Paleta de Colores

| Nombre | Valor Hexadecimal | Descripción |
|--------|-------------------|-------------|
| Background | #374151 | Color de fondo principal |
| Primary | #1f2937 | Color primario para tarjetas y elementos de UI |
| Secondary | #f8fafc | Color secundario para textos claros |
| Accent | #4076f6 | Color de acento para botones y elementos destacados |
| Error | #ef4444 | Color para errores y alertas |
| Success | #4ade80 | Color para acciones exitosas |

## Implementación

La implementación del sistema de colores se ha realizado utilizando valores hexadecimales directamente en lugar de variables CSS para garantizar la consistencia visual en toda la aplicación. Esto asegura que los colores se apliquen exactamente como se especificaron en la paleta de colores.

## Estructura del Sistema CSS

El sistema de CSS está centralizado en un único archivo `global.css` que contiene todas las definiciones de estilos. Este enfoque proporciona varias ventajas:

1. **Consistencia**: Todos los componentes utilizan las mismas variables y clases CSS.
2. **Mantenibilidad**: Los cambios en el diseño se pueden hacer en un solo lugar.
3. **Reutilización**: Las clases se pueden reutilizar en múltiples componentes.

### Archivo global.css

El archivo `global.css` está organizado en las siguientes secciones:

1. **Variables CSS**: Definición de colores, espaciado, bordes y sombras.
2. **Estilos Base**: Reseteo de estilos y configuración básica.
3. **Layout**: Estilos para contenedores y estructura de la página.
4. **Componentes**: Estilos para tarjetas, botones, formularios, etc.
5. **Utilidades**: Clases de utilidad para flexbox, espaciado, etc.

## Uso en Componentes

Los componentes Svelte ahora utilizan las clases definidas en `global.css` en lugar de tener estilos propios. Esto se hace simplemente aplicando las clases CSS a los elementos HTML:

```svelte
<div class="card">
  <h2 class="subtitle">Título</h2>
  <p class="text-secondary">Texto secundario</p>
  <button class="btn btn-primary">Botón</button>
</div>
```

## Clases Principales

### Contenedores
- `.app-container`: Contenedor principal de la aplicación.
- `.main-layout`: Layout principal con márgenes y padding.
- `.module-container`: Contenedor para módulos con fondo y bordes.
- `.card`: Tarjeta con fondo, bordes y padding.

### Botones
- `.btn`: Clase base para botones.
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-error`: Variantes de botones.
- `.btn-sm`, `.btn-md`, `.btn-lg`: Tamaños de botones.

### Formularios
- `.input`, `.select`, `.textarea`: Estilos para elementos de formulario.
- `.checkbox`, `.radio`: Estilos para checkboxes y radios.
- `.slider`: Estilos para sliders (input range).

### Tipografía
- `.title`: Título principal.
- `.subtitle`: Subtítulo con color de acento.
- `.card-title`: Título para tarjetas.
- `.text-secondary`: Texto secundario con color más claro.

### Utilidades
- `.flex`, `.flex-col`, `.items-center`, etc.: Clases de utilidad para flexbox.
- `.space-y-2`, `.space-x-2`, etc.: Clases para espaciado entre elementos.
- `.mt-1`, `.mb-3`, etc.: Clases para márgenes.
- `.p-2`, `.pt-4`, etc.: Clases para padding.
- `.w-full`, `.h-full`: Clases para ancho y alto.
- `.rounded`, `.rounded-md`, etc.: Clases para bordes redondeados.

## Componentes Actualizados

Los siguientes componentes han sido actualizados para usar el sistema de CSS centralizado:

1. **Button.svelte**: Usa las clases `.btn`, `.btn-primary`, etc.
2. **GenerativeShader.svelte**: Usa la clase `.shader-canvas` y otras utilidades.
3. **InputSourcesModule.svelte**: Usa las clases `.input-source-card` y `.card`.
4. **GenerativeInput.svelte**: Usa clases para textos, botones y formularios.
5. **ShaderSelector.svelte**: Usa clases para tarjetas, botones y textos.
6. **StreamOutput.svelte**: Usa clases para títulos y botones.
7. **CanvasSizeControl.svelte**: Usa clases para inputs y botones.
8. **ImagePlayer.svelte**: Usa clases para contenedores y botones.
9. **AIControls.svelte**: Usa clases para títulos.
10. **StatusMessages.svelte**: Usa clases para textos y alertas.
11. **Lyrics.svelte**: Usa clases para formularios y textos.
12. **PipelineOptions.svelte**: Usa clases para textos.
13. **InputRange.svelte**: Usa clases para sliders e inputs.
14. **SeedInput.svelte**: Usa clases para inputs y botones.
15. **TextArea.svelte**: Usa clases para áreas de texto.
16. **Checkbox.svelte**: Usa clases para checkboxes.
17. **Selectlist.svelte**: Usa clases para selects.
18. **Warning.svelte**: Usa estilos para alertas.

## Aplicación del Tema

El tema oscuro se aplica automáticamente al cargar la aplicación mediante JavaScript en el archivo `+layout.svelte`:

```javascript
onMount(() => {
  document.body.style.backgroundColor = '#374151';
  document.body.style.color = '#f8fafc';
});
```

## Mejoras de Accesibilidad

Se han implementado mejoras de accesibilidad en varios componentes:

1. **Labels asociados con inputs**: Todos los inputs tienen un label asociado con el atributo `for`.
2. **Elementos interactivos accesibles**: Los elementos interactivos como botones tienen manejadores de eventos de teclado.
3. **Roles ARIA**: Se han añadido roles ARIA a elementos que lo requieren.
4. **Clase sr-only**: Se ha implementado una clase `.sr-only` para textos que solo deben ser leídos por lectores de pantalla.

## Ventajas del Sistema Centralizado

1. **Consistencia visual**: Todos los componentes siguen el mismo estilo.
2. **Facilidad de mantenimiento**: Los cambios de estilo se hacen en un solo lugar.
3. **Rendimiento mejorado**: Menos CSS duplicado y mejor cacheado.
4. **Desarrollo más rápido**: Reutilización de clases existentes.
5. **Mejor colaboración**: Todos los desarrolladores trabajan con el mismo sistema.
6. **Mejor accesibilidad**: Se han implementado prácticas de accesibilidad en todo el sistema.
7. **Aspecto visual coherente**: La aplicación tiene un aspecto visual coherente con la paleta de colores especificada.
