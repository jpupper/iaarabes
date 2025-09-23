# Sistema de Shaders Dinámicos

Este sistema permite cargar shaders GLSL desde archivos en el servidor y utilizarlos en la aplicación web sin necesidad de recompilar el código.

## Implementación

Se ha integrado el sistema de shaders con la infraestructura existente de la aplicación, aprovechando el servidor FastAPI que ya está en funcionamiento. No se requiere un servidor adicional.

### Soluciones a errores comunes

#### Error: Cannot read properties of undefined (reading 'id')

Este error ocurre cuando se intenta acceder a la propiedad 'id' de un objeto que es undefined. Se ha solucionado:

1. Mejorando la inicialización de los stores en generativePattern.ts
2. Agregando valores por defecto para los shaders en caso de que no se puedan cargar desde el backend
3. Implementando verificaciones adicionales en los componentes para manejar casos donde los datos aún no están disponibles

#### Error: InvalidStateError: Failed to execute 'send' on 'WebSocket': Still in CONNECTING state

Este error ocurre cuando se intenta enviar datos a través de un WebSocket que aún no ha completado su conexión. Se ha solucionado:

1. Utilizando la infraestructura existente para manejar las solicitudes HTTP
2. Asegurando que las operaciones asíncronas se completen antes de intentar usar los datos

## Estructura

- **Backend (Python/Flask)**: Lee los archivos de shader de la carpeta `public/shaders` y los expone a través de una API REST.
- **Frontend (Svelte)**: Consulta la API para obtener la lista de shaders disponibles y su código fuente.

## Archivos de Shader

Los shaders deben estar ubicados en la carpeta `public/shaders` con la siguiente estructura:

- Archivos de fragment shader: `nombre.frag` (uno por cada patrón generativo)
- Archivo de vertex shader: `vertex.vert` (compartido por todos los fragment shaders)

## Cómo funciona

1. El backend Python escanea la carpeta `public/shaders` y crea un endpoint que devuelve la lista de todos los shaders disponibles.
2. Cuando se inicia la aplicación, el frontend solicita esta lista y la muestra en un dropdown.
3. Al seleccionar un shader del dropdown, el frontend solicita el código fuente del shader seleccionado.
4. El componente GenerativeShader compila y ejecuta el shader en WebGL.

## Cómo agregar nuevos shaders

Para agregar un nuevo shader:

1. Crea un archivo `.frag` en la carpeta `public/shaders` con el código GLSL del fragment shader.
2. Reinicia el servidor backend (o espera a que detecte los cambios si está configurado para hacerlo).
3. El nuevo shader aparecerá automáticamente en el dropdown de la aplicación.

## Formato de los shaders

Los shaders deben seguir el formato estándar de GLSL y pueden utilizar las siguientes variables uniformes:

- `u_time`: Tiempo transcurrido en segundos desde que se inició el shader.
- `u_resolution`: Resolución del canvas en píxeles (vec2).

Ejemplo de un fragment shader básico:

```glsl
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
}
```

## Iniciar el sistema

1. No se requiere iniciar un servidor adicional. El sistema utiliza el servidor FastAPI existente.

2. Simplemente inicia la aplicación como lo haces normalmente.

## Archivos nuevos

1. `main_shaders.py`: Contiene las funciones para manejar los shaders en el servidor FastAPI existente.

## Cambios realizados

1. Se ha modificado `main.py` para integrar las funciones de shaders.
2. Se ha actualizado `generativePattern.ts` para utilizar los endpoints del servidor existente.
3. Se ha mejorado el manejo de errores y la inicialización en los componentes Svelte.

## Modo a prueba de fallos

El sistema incluye un modo a prueba de fallos que se activa automáticamente si no se puede conectar al backend:

1. Se cargarán shaders por defecto (radial y lines)
2. Se usarán códigos de shader predefinidos

Esto permite que la aplicación funcione incluso si hay problemas al cargar los shaders desde el servidor.
