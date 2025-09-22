<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { generativePatternActions, generativePatternStatus, GenerativePatternStatusEnum } from '$lib/generativePattern';

  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let animationFrameId: number;
  let startTime = Date.now();
  
  // Shader básico (fragment shader)
  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      
      // Coordenadas normalizadas al centro
      vec2 center = uv - 0.5;
      
      // Patrón circular que cambia con el tiempo
      float dist = length(center);
      float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
      
      // Colores que cambian con el tiempo
      vec3 color1 = vec3(0.5 + 0.5 * sin(u_time * 0.3), 
                         0.5 + 0.5 * sin(u_time * 0.4), 
                         0.5 + 0.5 * sin(u_time * 0.5));
      
      vec3 color2 = vec3(0.5 + 0.5 * cos(u_time * 0.4),
                         0.5 + 0.5 * cos(u_time * 0.5),
                         0.5 + 0.5 * cos(u_time * 0.3));
      
      // Mezcla de colores basada en la distancia y el tiempo
      float pattern = sin(dist * 20.0 - u_time * 2.0) * 0.5 + 0.5;
      vec3 color = mix(color1, color2, pattern);
      
      // Añadir un círculo pulsante
      float circle = smoothstep(pulse * 0.2, pulse * 0.21, dist);
      color = mix(color2, color, circle);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Vertex shader básico
  const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('No se pudo crear el shader');
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Error al compilar shader: ' + info);
    }
    
    return shader;
  }

  function setupWebGL() {
    if (!canvas) return;
    
    gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL no está disponible');
      return;
    }
    
    // Compilar shaders
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    // Crear programa
    program = gl.createProgram();
    if (!program) {
      throw new Error('No se pudo crear el programa WebGL');
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error('Error al enlazar programa: ' + info);
    }
    
    // Crear un cuadrado que cubre toda la pantalla
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Obtener ubicaciones de atributos y uniformes
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  }

  function render() {
    if (!gl || !program) return;
    
    // Ajustar el tamaño del canvas al tamaño actual
    resizeCanvasToDisplaySize();
    
    // Usar el programa
    gl.useProgram(program);
    
    // Establecer viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // Limpiar el canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Pasar uniformes al shader
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    
    const elapsedTime = (Date.now() - startTime) / 1000; // tiempo en segundos
    gl.uniform1f(timeUniformLocation, elapsedTime);
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    // Dibujar
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Capturar el frame como imagen si está activo
    if (isActive) {
      captureFrame();
    }
    
    // Continuar la animación
    animationFrameId = requestAnimationFrame(render);
  }

  function resizeCanvasToDisplaySize() {
    if (!gl) return;
    
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  function captureFrame() {
    if (!canvas || !isActive) return;
    
    // Convertir el canvas a una imagen y enviarla al componente padre
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      // Actualizar el store con el nuevo frame
      generativePatternActions.updateFrame(imageData);
      // Enviar evento al componente padre
      dispatch('frameCapture', { imageData });
    } catch (error) {
      console.error('Error al capturar frame:', error);
    }
  }

  function toggleGenerative() {
    isActive = !isActive;
    
    if (isActive) {
      generativePatternActions.start();
      dispatch('generativeSelected');
    } else {
      generativePatternActions.stop();
      dispatch('generativeDeselected');
    }
  }

  onMount(() => {
    try {
      setupWebGL();
      animationFrameId = requestAnimationFrame(render);
    } catch (error) {
      console.error('Error al inicializar WebGL:', error);
    }
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
</script>

<div class="space-y-2">
  <h3 class="text-lg font-medium">Patrón Generativo</h3>
  <p class="text-sm text-gray-600">Genera patrones visuales usando shaders</p>
  
  <div class="w-full aspect-video bg-black rounded-lg overflow-hidden">
    <canvas 
      bind:this={canvas} 
      class="w-full h-full"
    ></canvas>
  </div>
  
  <div class="flex justify-between items-center mt-2">
    <Button 
      on:click={toggleGenerative}
      classList={isActive ? 'p-2 bg-blue-600 hover:bg-blue-700' : 'p-2 bg-gray-500 hover:bg-gray-600'}
    >
      {isActive ? 'Desactivar' : 'Activar'} Patrón Generativo
    </Button>
  </div>
</div>
