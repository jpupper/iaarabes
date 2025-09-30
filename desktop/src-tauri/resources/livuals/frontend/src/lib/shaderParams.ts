import { writable, get, derived } from 'svelte/store';

// Tipos de parámetros de shader
export interface ShaderParam {
  name: string;       // Nombre del parámetro (mismo que el uniform)
  label: string;      // Etiqueta para mostrar en la UI
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool';  // Tipo de parámetro
  value: number | number[] | boolean;  // Valor actual
  min: number;        // Valor mínimo (para sliders)
  max: number;        // Valor máximo (para sliders)
  step: number;       // Incremento del slider
  defaultValue: number | number[] | boolean;  // Valor por defecto
  description?: string; // Descripción opcional del parámetro
}

// Tipo para los valores de uniforms que se pasarán al shader
export interface UniformValues {
  [key: string]: number | number[] | boolean;
}

// Lista de uniforms reservados que no se deben exponer como parámetros
export const RESERVED_UNIFORMS = [
  'u_time',           // Tiempo transcurrido
  'u_resolution',     // Resolución del canvas
  'u_mouse',          // Posición del mouse
  'iTime',            // Alias de tiempo (formato Shadertoy)
  'iResolution',      // Alias de resolución (formato Shadertoy)
  'iMouse',           // Alias de mouse (formato Shadertoy)
  'time',             // Alias simple de tiempo
  'resolution',       // Alias simple de resolución
  'mouse',            // Alias simple de mouse
  'a_position',       // Atributo de posición del vértice
  'gl_FragCoord',     // Coordenada del fragmento (built-in)
  'gl_Position'       // Posición del vértice (built-in)
];

// Store para los parámetros del shader actual
export const shaderParams = writable<ShaderParam[]>([]);

// Store para el código fuente del shader con los parámetros aplicados
export const processedShaderSource = writable<string>('');

// Store derivado que contiene solo los valores de los parámetros para pasar al shader
export const uniformValues = derived(shaderParams, ($params) => {
  const values: UniformValues = {};
  $params.forEach(param => {
    values[param.name] = param.value;
  });
  return values;
});

// Store para indicar cuando los parámetros han cambiado y el shader debe actualizarse
export const parameterChanged = writable<boolean>(false);

// Acciones para manejar los parámetros del shader
export const shaderParamsActions = {
  // Extraer parámetros de un shader
  extractParamsFromShader(source: string): ShaderParam[] {
    const params: ShaderParam[] = [];
    
    // Expresión regular para encontrar declaraciones de uniforms
    // Busca patrones como: uniform float u_paramName; o uniform vec3 u_color;
    const uniformRegex = /uniform\s+(float|int|vec[234]|bool)\s+(\w+)\s*;/g;
    let match;
    
    while ((match = uniformRegex.exec(source)) !== null) {
      const type = match[1] as 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool';
      const name = match[2];
      
      // Verificar si es un uniform reservado
      if (!RESERVED_UNIFORMS.includes(name)) {
        // Crear un parámetro con valores predeterminados según el tipo
        let defaultValue: number | number[] | boolean;
        let value: number | number[] | boolean;
        let min = 0;
        let max = 1;
        let step = 0.01;
        
        switch (type) {
          case 'float':
            defaultValue = 0.5;
            value = 0.5;
            break;
          case 'int':
            defaultValue = 5;
            value = 5;
            min = 0;
            max = 10;
            step = 1;
            break;
          case 'vec2':
            defaultValue = [0.5, 0.5];
            value = [0.5, 0.5];
            break;
          case 'vec3':
            defaultValue = [0.5, 0.5, 0.5];
            value = [0.5, 0.5, 0.5];
            break;
          case 'vec4':
            defaultValue = [0.5, 0.5, 0.5, 1.0];
            value = [0.5, 0.5, 0.5, 1.0];
            break;
          case 'bool':
            defaultValue = false;
            value = false;
            break;
          default:
            defaultValue = 0.5;
            value = 0.5;
        }
        
        // Buscar comentarios de documentación para este uniform
        const commentRegex = new RegExp(`//\\s*${name}\\s*:(.*)`, 'i');
        const commentMatch = source.match(commentRegex);
        const description = commentMatch ? commentMatch[1].trim() : undefined;
        
        // Crear el objeto de parámetro
        params.push({
          name,
          label: name.replace(/^u_/, '').replace(/_/g, ' '),
          type,
          value,
          min,
          max,
          step,
          defaultValue,
          description
        });
      }
    }
    
    return params;
  },
  
  // Cargar parámetros de un shader
  loadParamsFromShader(source: string) {
    const params = this.extractParamsFromShader(source);
    
    // Log de uniforms detectados
    console.log('===== UNIFORMS DETECTADOS =====');
    if (params.length === 0) {
      console.log('No se detectaron uniforms personalizables en el shader');
    } else {
      console.log(`Se detectaron ${params.length} uniforms personalizables:`);
      params.forEach(param => {
        console.log(`- ${param.name} (${param.type}): ${param.label}${param.description ? ' - ' + param.description : ''}`);
      });
    }
    console.log('===============================');
    
    shaderParams.set(params);
    return params;
  },
  
  // Actualizar el valor de un parámetro
  updateParamValue(name: string, value: number | number[] | boolean) {
    shaderParams.update(params => {
      const param = params.find(p => p.name === name);
      if (param) {
        param.value = value;
      }
      return params;
    });
    
    // Indicar que los parámetros han cambiado
    parameterChanged.set(true);
  },
  
  // Actualizar un componente específico de un parámetro vectorial
  updateVectorComponent(name: string, index: number, value: number) {
    shaderParams.update(params => {
      const param = params.find(p => p.name === name);
      if (param && Array.isArray(param.value)) {
        const newValue = [...param.value];
        newValue[index] = value;
        param.value = newValue;
      }
      return params;
    });
    
    // Indicar que los parámetros han cambiado
    parameterChanged.set(true);
  },
  
  // Restablecer todos los parámetros a sus valores predeterminados
  resetParams() {
    shaderParams.update(params => {
      return params.map(p => ({
        ...p,
        value: p.defaultValue
      }));
    });
    
    // Indicar que los parámetros han cambiado
    parameterChanged.set(true);
  },
  
  // Obtener los valores actuales de los parámetros como un objeto
  getCurrentValues(): UniformValues {
    const params = get(shaderParams);
    const values: UniformValues = {};
    
    params.forEach(param => {
      values[param.name] = param.value;
    });
    
    return values;
  },
  
  // Aplicar los valores de los parámetros al shader
  applyParamsToShader(gl: WebGLRenderingContext, program: WebGLProgram) {
    const params = get(shaderParams);
    
    params.forEach(param => {
      const location = gl.getUniformLocation(program, param.name);
      if (location !== null) {
        switch (param.type) {
          case 'float':
            gl.uniform1f(location, param.value as number);
            break;
          case 'int':
            gl.uniform1i(location, param.value as number);
            break;
          case 'bool':
            gl.uniform1i(location, (param.value as boolean) ? 1 : 0);
            break;
          case 'vec2':
            gl.uniform2fv(location, param.value as number[]);
            break;
          case 'vec3':
            gl.uniform3fv(location, param.value as number[]);
            break;
          case 'vec4':
            gl.uniform4fv(location, param.value as number[]);
            break;
        }
      }
    });
    
    // Resetear el indicador de cambio
    parameterChanged.set(false);
  }
};
