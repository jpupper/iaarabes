# Styleguide de Livuals

Este documento describe el nuevo sistema de diseño implementado en Livuals, basado en el styleguide proporcionado.

## Paleta de Colores

- **Background**: #374151
- **Primary**: #1f2937
- **Secondary**: #f8fafc
- **Accent**: #4076f6
- **Error**: #ef4444
- **Success**: #4ade80

## Tipografía

- **Principal**: Geist Sans
- **Monoespaciada**: Geist Mono

### Tamaños de Fuente
- **Main Titles**: 24px, Bold
- **Section Titles**: 20px, Bold
- **Subtitles**: 18px, Semibold
- **Card Titles**: 14px, Semibold
- **Body Text**: 14px, Medium
- **Secondary Text**: 12px, Regular
- **Labels**: 12px, Medium

## Estructura de Archivos

El sistema de diseño está organizado en los siguientes archivos:

- `variables.css`: Define las variables CSS para colores, tipografía, espaciado, etc.
- `fonts.css`: Importa las fuentes y define estilos tipográficos básicos.
- `components.css`: Define estilos para componentes comunes como botones, inputs, etc.
- `theme.ts`: Gestiona el cambio entre temas claro y oscuro.

## Componentes Actualizados

Los siguientes componentes han sido actualizados para usar el nuevo styleguide:

1. **Button.svelte**: Botones con variantes (primary, secondary, success, error) y tamaños (sm, md, lg).
2. **GenerativeInput.svelte**: Interfaz para seleccionar y configurar shaders generativos.
3. **GenerativeShader.svelte**: Visualizador de shaders con nuevo estilo.
4. **ShaderSelector.svelte**: Selector de shaders con nuevo estilo.
5. **InputSourcesModule.svelte**: Módulo de fuentes de entrada con nuevo estilo.
6. **ThemeToggle.svelte**: Nuevo componente para cambiar entre temas claro y oscuro.

## Clases CSS Principales

### Contenedores
- `.card`: Tarjeta con fondo, borde y sombra.
- `.module-container`: Contenedor principal para módulos.

### Tipografía
- `.main-title`: Título principal.
- `.section-title`: Título de sección.
- `.subtitle`: Subtítulo.
- `.card-title`: Título de tarjeta.
- `.body-text`: Texto principal.
- `.secondary-text`: Texto secundario.
- `.label`: Etiquetas.

### Formularios
- `.input`: Estilo para inputs de texto.
- `.select`: Estilo para selectores.
- `.checkbox`, `.radio`: Estilo para checkboxes y radios.
- `.slider`: Estilo para sliders.

### Botones
- `.btn`: Clase base para botones.
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-error`: Variantes de botones.
- `.btn-sm`, `.btn-md`, `.btn-lg`: Tamaños de botones.

## Sistema de Temas

El sistema de temas permite cambiar entre modo claro y oscuro. Se implementa mediante:

1. Variables CSS que cambian según el tema.
2. Un store Svelte (`currentTheme`) que mantiene el tema actual.
3. Un componente ThemeToggle para cambiar entre temas.
4. Persistencia del tema elegido en localStorage.

## Uso

Para usar el nuevo sistema de diseño:

1. Importa los estilos necesarios:
   ```svelte
   <script>
     import '../app.css';
   </script>
   ```

2. Usa las clases CSS definidas:
   ```svelte
   <div class="card">
     <h2 class="section-title">Título de Sección</h2>
     <p class="body-text">Contenido...</p>
   </div>
   ```

3. Para botones, usa el componente Button:
   ```svelte
   <Button variant="primary" size="md">Botón</Button>
   ```

4. Para cambiar entre temas, usa el componente ThemeToggle:
   ```svelte
   <ThemeToggle />
   ```
