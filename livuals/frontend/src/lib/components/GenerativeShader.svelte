<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { generativePatternActions, generativePatternStatus, GenerativePatternStatusEnum, selectedShader, shaderSources } from '$lib/generativePattern';
  import { get } from 'svelte/store';
  import { canvasDimensions } from '$lib/canvasDimensions';
  
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let animationFrameId: number;
  let startTime = Date.now();
  
  let fragmentShaderSource = '';
  let vertexShaderSource = '';
  
  // Función para cargar el shader seleccionado
  function loadShader() {
    try {
      const sources = get(shaderSources);
      
      if (!sources || !sources.fragmentShaderSource || !sources.vertexShaderSource) {
        console.warn('Fuentes de shader no disponibles o incompletas');
        return;
      }
      
      fragmentShaderSource = sources.fragmentShaderSource;
      vertexShaderSource = sources.vertexShaderSource;
      
      if (gl && program) {
        // Si ya tenemos un contexto GL, recreamos el programa con el nuevo shader
        gl.deleteProgram(program);
        setupShaderProgram();
      }
    } catch (error) {
      console.error('Error al cargar el shader:', error);
    }
  }

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
    
    setupShaderProgram();
  }
  
  function setupShaderProgram() {
    if (!gl || !fragmentShaderSource || !vertexShaderSource) return;
    
    try {
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
    } catch (error) {
      console.error('Error al configurar programa shader:', error);
    }
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
    if ($generativePatternStatus === GenerativePatternStatusEnum.ACTIVE) {
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
    if (!canvas) return;
    
    // Convertir el canvas a una imagen y enviarla al componente padre
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      // Actualizar el store con el nuevo frame
      generativePatternActions.updateFrame(imageData);
    } catch (error) {
      console.error('Error al capturar frame:', error);
    }
  }

  // Suscribirse a cambios en el código fuente del shader
  $: if ($shaderSources) {
    if ($shaderSources.fragmentShaderSource && $shaderSources.vertexShaderSource) {
      loadShader();
    }
  }

  onMount(async () => {
    try {
      console.log('Inicializando GenerativeShader...');
      
      // Inicializar WebGL primero
      setupWebGL();
      
      // Cargar la lista de shaders disponibles desde el backend
      // Esto también cargará el primer shader por defecto
      console.log('Cargando shaders...');
      await generativePatternActions.loadShaders();
      
      // Verificar si tenemos fuentes de shader
      const sources = get(shaderSources);
      if (!sources.fragmentShaderSource || !sources.vertexShaderSource) {
        console.warn('No se cargaron las fuentes de shader, cargando shader por defecto');
        shaderSources.set({
          fragmentShaderSource: `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_resolution;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution;
                gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
            }
          `,
          vertexShaderSource: `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
          `
        });
      }
      
      // Iniciar la animación
      console.log('Iniciando animación...');
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

<div class="w-full aspect-square bg-black rounded-lg overflow-hidden" style="max-width: {$canvasDimensions.width}px; max-height: {$canvasDimensions.height}px;">
  <canvas 
    bind:this={canvas} 
    class="w-full h-full"
    width={$canvasDimensions.width}
    height={$canvasDimensions.height}
  ></canvas>
</div>
