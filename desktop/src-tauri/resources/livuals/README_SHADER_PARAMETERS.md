# Sistema de Parámetros para Shaders

Este sistema permite extraer automáticamente los parámetros (uniforms) de los shaders GLSL y generar controles en la interfaz para ajustarlos en tiempo real.

## Cómo funciona

1. El sistema analiza el código fuente del shader seleccionado.
2. Extrae todos los uniforms que no están en la lista de reservados.
3. Crea controles deslizantes (sliders) para cada parámetro en la interfaz.
4. Aplica los valores de los parámetros al shader en tiempo real.

## Uniforms Reservados

Los siguientes uniforms están reservados y no generarán controles en la interfaz:

- `u_time`: Tiempo transcurrido en segundos.
- `u_resolution`: Resolución del canvas (vec2).
- `u_mouse`: Posición del mouse.
- `iTime`, `iResolution`, `iMouse`: Alias de Shadertoy.
- `time`, `resolution`, `mouse`: Alias simples.
- `a_position`: Atributo de posición del vértice.
- `gl_FragCoord`, `gl_Position`: Variables built-in de GLSL.

## Tipos de Parámetros Soportados

- `float`: Genera un slider con valores entre 0 y 1.
- `int`: Genera un slider con valores enteros entre 0 y 10.
- `vec2`, `vec3`, `vec4`: Genera múltiples sliders, uno para cada componente.
- `bool`: Genera un checkbox.

## Documentación de Parámetros

Puedes documentar tus parámetros añadiendo un comentario en la misma línea:

```glsl
uniform float u_speed;         // Velocidad de animación
uniform vec3 u_color;          // Color principal
```

## Ejemplo de Shader con Parámetros

```glsl
// Shader con parámetros personalizables
precision mediump float;

// Uniforms reservados
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables
uniform float u_speed;         // Velocidad de animación
uniform float u_intensity;     // Intensidad del efecto
uniform vec3 u_color1;         // Color primario
uniform vec3 u_color2;         // Color secundario
uniform vec2 u_center;         // Centro del patrón
uniform bool u_invert;         // Invertir colores

void main() {
    // Normalizar coordenadas
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Ajustar centro según parámetro
    uv = uv - u_center;
    
    // Calcular distancia al centro
    float dist = length(uv);
    
    // Crear patrón circular con velocidad ajustable
    float pattern = sin(dist * 10.0 * u_intensity - u_time * u_speed) * 0.5 + 0.5;
    
    // Mezclar colores según el patrón
    vec3 color = mix(u_color1, u_color2, pattern);
    
    // Aplicar inversión si está activada
    if (u_invert) {
        color = 1.0 - color;
    }
    
    // Salida final
    gl_FragColor = vec4(color, 1.0);
}
```

## Cómo Usar

1. Selecciona un shader en el desplegable de la sección "Patrón Generativo".
2. Haz clic en "Mostrar" para ver los parámetros disponibles.
3. Ajusta los parámetros usando los controles deslizantes.
4. Los cambios se aplicarán en tiempo real al shader.

## Cómo Añadir Nuevos Shaders con Parámetros

1. Crea un archivo `.frag` en la carpeta `public/shaders`.
2. Define tus uniforms personalizados con comentarios descriptivos.
3. El shader aparecerá automáticamente en el desplegable de la aplicación.
4. Los parámetros se extraerán y mostrarán automáticamente en la interfaz.

## Notas Técnicas

- Los valores de los parámetros se normalizan entre 0 y 1 para facilitar su uso.
- Para parámetros de tipo `vec2`, `vec3` y `vec4`, cada componente tiene su propio slider.
- Los parámetros de tipo `bool` se representan como checkboxes.
- Los valores de los parámetros se guardan y restauran al cambiar entre shaders.

## Archivos Relacionados

- `shaderParams.ts`: Contiene la lógica para extraer y manejar los parámetros.
- `GenerativeInput.svelte`: Muestra los controles de los parámetros en la interfaz.
- `GenerativeShader.svelte`: Aplica los valores de los parámetros al shader.
