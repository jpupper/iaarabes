# Reglas del Proyecto Livuals

Este documento sirve como guía para entender la arquitectura del proyecto Livuals y las relaciones entre sus diferentes componentes. Esto facilitará el desarrollo y mantenimiento del código, asegurando que las modificaciones se realicen de manera coherente en todas las partes del sistema.

## Estructura General del Proyecto

El proyecto Livuals está dividido en tres partes principales:

1. **Backend (Python)**: Maneja el procesamiento de imágenes y la implementación de StreamDiffusion.
2. **Frontend (Svelte)**: Interfaz de usuario que permite interactuar con el sistema.
3. **Comunicación (TypeScript)**: Capa de comunicación entre el frontend y el backend.

## Componentes Principales y sus Relaciones

### Backend (Python)

- **Ubicación**: `/livuals/backend/`
- **Responsabilidades**:
  - Implementación de StreamDiffusion
  - Procesamiento de imágenes
  - API REST para comunicación con el frontend
  - Gestión de modelos de IA

#### Archivos Clave:
- `app.py`: Punto de entrada principal, configura la API REST
- `stream_diffusion_manager.py`: Gestiona la instancia de StreamDiffusion
- `image_processor.py`: Funciones para procesamiento de imágenes

### Frontend (Svelte)

- **Ubicación**: `/livuals/frontend/`
- **Responsabilidades**:
  - Interfaz de usuario
  - Captura de entrada (cámara, pantalla, generativa)
  - Visualización de resultados
  - Configuración de parámetros

#### Archivos Clave:
- `src/App.svelte`: Componente principal de la aplicación
- `src/lib/modules/`: Módulos funcionales de la aplicación
  - `InputSourcesModule.svelte`: Gestión de fuentes de entrada (cámara, pantalla, patrón generativo)
    - `InputSources/CamInput.svelte`: Componente para seleccionar la cámara
    - `InputSources/ShareInput.svelte`: Componente para seleccionar compartir pantalla
    - `InputSources/GenerativeInput.svelte`: Componente para seleccionar el patrón generativo (solo UI)
  - `StreamOutput.svelte`: Visualización de la entrada y salida procesada
    - Contiene dos visualizadores: 
      - Input source: Muestra la entrada seleccionada (cámara, pantalla o patrón generativo)
      - Final Output: Muestra el resultado procesado por StreamDiffusion
  - `ControlsModule.svelte`: Controles para ajustar parámetros
- `src/lib/components/`:
  - `GenerativeShader.svelte`: Implementación del shader generativo que se muestra en StreamOutput

### Comunicación (TypeScript)

- **Ubicación**: `/livuals/frontend/src/lib/`
- **Responsabilidades**:
  - Comunicación con el backend
  - Gestión de estado
  - Procesamiento de datos

#### Archivos Clave:
- `mediaStream.ts`: Gestión de streams de medios (cámara, pantalla)
- `lcmLive.ts`: Comunicación con el backend de StreamDiffusion
- `generativePattern.ts`: Gestión del patrón generativo
- `store.ts`: Almacenamiento de estado global

## Flujo de Datos

1. **Selección de Entrada**:
   - El usuario selecciona una fuente de entrada en `InputSourcesModule.svelte` (cámara, pantalla o patrón generativo)
   - Solo una fuente puede estar activa a la vez (se muestra con borde verde)
   - La selección actualiza los stores correspondientes (`mediaStream.ts` o `generativePattern.ts`)

2. **Visualización de Entrada**:
   - El componente `StreamOutput.svelte` detecta la fuente seleccionada a través de los stores
   - En el visualizador "Input source" muestra:
     - El feed de la cámara si se seleccionó cámara
     - El compartido de pantalla si se seleccionó compartir pantalla
     - El shader generativo si se seleccionó patrón generativo

3. **Procesamiento**:
   - Los frames capturados se envían al backend a través de la API
   - StreamDiffusion procesa los frames
   - El resultado se devuelve al frontend

4. **Visualización de Salida**:
   - El componente `StreamOutput.svelte` muestra en el visualizador "Final Output" el resultado procesado
   - Se pueden ajustar parámetros en tiempo real

## Reglas de Implementación

### Al Modificar Componentes de Entrada

Si modificas un componente de entrada (CamInput, ShareInput, GenerativeInput):

1. Asegúrate de actualizar los stores correspondientes (`mediaStream.ts` o `generativePattern.ts`)
2. Verifica que el componente padre (`InputSourcesModule.svelte`) maneje correctamente los eventos
3. Comprueba que la lógica de selección/deselección funcione correctamente
4. Recuerda que:
   - `GenerativeInput.svelte` solo contiene la UI para seleccionar el patrón generativo
   - La implementación del shader está en `GenerativeShader.svelte` y se muestra en `StreamOutput.svelte`

### Al Modificar la Visualización de Salida

Si modificas `StreamOutput.svelte`:

1. Asegúrate de que los stores de entrada estén correctamente suscritos
2. Verifica que la comunicación con el backend funcione adecuadamente
3. Comprueba que los controles de inicio/parada funcionen correctamente
4. Recuerda que hay dos visualizadores:
   - Input source: Muestra la fuente de entrada seleccionada (cámara, pantalla o patrón generativo)
   - Final Output: Muestra el resultado procesado por StreamDiffusion
5. El visualizador "Input source" debe mostrar:
   - El shader generativo cuando `generativePatternStatus === GenerativePatternStatusEnum.ACTIVE`
   - La cámara o pantalla compartida en otros casos

### Al Modificar la Comunicación con el Backend

Si modificas `lcmLive.ts` u otros archivos de comunicación:

1. Asegúrate de que los endpoints coincidan con los definidos en el backend
2. Verifica que el formato de los datos sea compatible
3. Actualiza cualquier componente que dependa de estos servicios

### Al Modificar el Backend

Si modificas el backend de Python:

1. Asegúrate de que los endpoints de la API mantengan la compatibilidad
2. Actualiza la documentación de la API si es necesario
3. Verifica que los formatos de datos sean compatibles con el frontend

## Patrones de Diseño

### Patrón de Comunicación

- Utiliza stores de Svelte para la comunicación entre componentes
- Utiliza eventos personalizados para comunicación padre-hijo
- Utiliza la API REST para comunicación con el backend

### Patrón de Estado

- Utiliza stores para mantener el estado global
- Utiliza estados locales para componentes específicos
- Sincroniza el estado entre componentes relacionados

## Consideraciones Importantes

1. **Rendimiento**: Optimiza el procesamiento de imágenes y la comunicación para mantener un rendimiento fluido
2. **Compatibilidad**: Asegúrate de que las modificaciones sean compatibles con todas las plataformas soportadas
3. **Escalabilidad**: Diseña los componentes de manera que puedan adaptarse a nuevas funcionalidades

## Ejemplo de Flujo de Trabajo

### Implementación de una Nueva Fuente de Entrada

1. Crear un nuevo componente en `/livuals/frontend/src/lib/modules/InputSources/`
2. Actualizar `InputSourcesModule.svelte` para incluir el nuevo componente
3. Crear o actualizar un store para gestionar el estado de la nueva fuente
4. Actualizar `lcmLive.ts` para manejar el nuevo tipo de entrada
5. Actualizar el backend para procesar el nuevo tipo de entrada

### Implementación de un Nuevo Efecto de Salida

1. Modificar `StreamOutput.svelte` para incluir el nuevo efecto
2. Actualizar los stores relevantes para gestionar el estado del efecto
3. Actualizar el backend para implementar el procesamiento del efecto
4. Actualizar la comunicación entre frontend y backend

## Conclusión

Seguir estas reglas y entender las relaciones entre los componentes facilitará el desarrollo y mantenimiento del proyecto Livuals. Asegúrate de mantener la coherencia en todas las partes del sistema y de documentar adecuadamente cualquier cambio significativo.
