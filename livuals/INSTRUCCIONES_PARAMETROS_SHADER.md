# Instrucciones para usar el Sistema de Parámetros de Shader

Hemos implementado un sistema que detecta automáticamente los parámetros (uniforms) en los shaders GLSL y genera controles deslizantes en la interfaz para ajustarlos en tiempo real.

## Cómo usar el sistema

1. Selecciona un shader en el desplegable de la sección "Patrón Generativo".
2. Haz clic en "Seleccionar" para activar el shader.
3. Los parámetros del shader se mostrarán automáticamente debajo del selector.
4. Ajusta los parámetros usando los controles deslizantes.
5. Los cambios se aplicarán en tiempo real al shader.

## Solución de problemas

Si no ves los parámetros del shader:

1. **Verifica la consola del navegador**: Deberías ver mensajes que indican los uniforms detectados en cada shader.
2. **Asegúrate de que el shader tenga parámetros**: Los shaders deben tener uniforms personalizados (no reservados) para que se generen controles.
3. **Recarga la página**: Si has modificado un shader, puede ser necesario recargar la página para que se detecten los nuevos parámetros.

## Cómo añadir parámetros a un shader existente

1. Abre el archivo del shader (`.frag`) en la carpeta `/livuals/public/shaders/`.
2. Añade uniforms personalizados al principio del archivo, por ejemplo:
   ```glsl
   uniform float u_speed;         // Velocidad de animación
   uniform vec3 u_color;          // Color principal
   ```
3. Usa estos uniforms en el código del shader.
4. Guarda el archivo y recarga la aplicación.

## Shader de ejemplo con parámetros

Hemos creado un shader de ejemplo con parámetros en el archivo `lines_with_params.frag`. Para usarlo:

1. Copia este archivo a la carpeta `/livuals/public/shaders/`.
2. Reinicia la aplicación.
3. Selecciona el shader en el desplegable.

## Uniforms reservados

Los siguientes uniforms están reservados y no generarán controles en la interfaz:

- `u_time`: Tiempo transcurrido en segundos.
- `u_resolution`: Resolución del canvas (vec2).
- `u_mouse`: Posición del mouse.
- `iTime`, `iResolution`, `iMouse`: Alias de Shadertoy.
- `time`, `resolution`, `mouse`: Alias simples.
- `a_position`: Atributo de posición del vértice.
- `gl_FragCoord`, `gl_Position`: Variables built-in de GLSL.

## Tipos de parámetros soportados

- `float`: Genera un slider con valores entre 0 y 1.
- `int`: Genera un slider con valores enteros entre 0 y 10.
- `vec2`, `vec3`, `vec4`: Genera múltiples sliders, uno para cada componente.
- `bool`: Genera un checkbox.

## Documentación de parámetros

Puedes documentar tus parámetros añadiendo un comentario en la misma línea:

```glsl
uniform float u_speed;         // Velocidad de animación
uniform vec3 u_color;          // Color principal
```

Estos comentarios se mostrarán como tooltips en la interfaz.
