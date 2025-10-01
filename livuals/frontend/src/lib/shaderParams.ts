import { writable, get, derived } from 'svelte/store';

// Shader parameter types
export interface ShaderParam {
  name: string;       // Parameter name (same as the uniform)
  label: string;      // Label to display in the UI
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool';  // Parameter type
  value: number | number[] | boolean;  // Current value
  min: number;        // Minimum value (for sliders)
  max: number;        // Maximum value (for sliders)
  step: number;       // Slider increment
  defaultValue: number | number[] | boolean;  // Default value
  description?: string; // Optional parameter description
}

// Type for uniform values that will be passed to the shader
export interface UniformValues {
  [key: string]: number | number[] | boolean;
}

// List of reserved uniforms that should not be exposed as parameters
export const RESERVED_UNIFORMS = [
  'u_time',           // Elapsed time
  'u_resolution',     // Canvas resolution
  'u_mouse',          // Mouse position
  'iTime',            // Time alias (Shadertoy format)
  'iResolution',      // Resolution alias (Shadertoy format)
  'iMouse',           // Mouse alias (Shadertoy format)
  'time',             // Simple time alias
  'resolution',       // Simple resolution alias
  'mouse',            // Simple mouse alias
  'a_position',       // Vertex position attribute
  'gl_FragCoord',     // Fragment coordinate (built-in)
  'gl_Position'       // Vertex position (built-in)
];

// Store for the current shader parameters
export const shaderParams = writable<ShaderParam[]>([]);

// Store for the shader source code with applied parameters
export const processedShaderSource = writable<string>('');

// Derived store that contains only the parameter values to pass to the shader
export const uniformValues = derived(shaderParams, ($params) => {
  const values: UniformValues = {};
  $params.forEach(param => {
    values[param.name] = param.value;
  });
  return values;
});

// Store to indicate when parameters have changed and the shader should be updated
export const parameterChanged = writable<boolean>(false);

// Actions to handle shader parameters
export const shaderParamsActions = {
  // Extract parameters from a shader
  extractParamsFromShader(source: string): ShaderParam[] {
    const params: ShaderParam[] = [];
    
    // Regular expression to find uniform declarations
    // Looks for patterns like: uniform float u_paramName; or uniform vec3 u_color;
    const uniformRegex = /uniform\s+(float|int|vec[234]|bool)\s+(\w+)\s*;/g;
    let match;
    
    while ((match = uniformRegex.exec(source)) !== null) {
      const type = match[1] as 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'bool';
      const name = match[2];
      
      // Check if it's a reserved uniform
      if (!RESERVED_UNIFORMS.includes(name)) {
        // Create a parameter with default values based on the type
        let defaultValue: number | number[] | boolean;
        let value: number | number[] | boolean;
        let min = 0;
        let max = 1;
        let step = 0.01;
        
        switch (type) {
          case 'float':
            defaultValue = 0.5;
            value = Math.random(); // Random initial value
            break;
          case 'int':
            defaultValue = 5;
            value = Math.floor(Math.random() * 10); // Random between 0-10
            min = 0;
            max = 10;
            step = 1;
            break;
          case 'vec2':
            defaultValue = [0.5, 0.5];
            value = [Math.random(), Math.random()];
            break;
          case 'vec3':
            defaultValue = [0.5, 0.5, 0.5];
            value = [Math.random(), Math.random(), Math.random()];
            break;
          case 'vec4':
            defaultValue = [0.5, 0.5, 0.5, 1.0];
            value = [Math.random(), Math.random(), Math.random(), 1.0];
            break;
          case 'bool':
            defaultValue = false;
            value = Math.random() > 0.5; // Random true/false
            break;
          default:
            defaultValue = 0.5;
            value = Math.random();
        }
        
        // Look for documentation comments for this uniform
        const commentRegex = new RegExp(`//\\s*${name}\\s*:(.*)`, 'i');
        const commentMatch = source.match(commentRegex);
        const description = commentMatch ? commentMatch[1].trim() : undefined;
        
        // Create the parameter object
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
  
  // Load parameters from a shader preserving current values
  loadParamsFromShader(source: string) {
    const newParams = this.extractParamsFromShader(source);
    const currentParams = get(shaderParams);
    
    // Preserve current values of parameters that already exist
    const mergedParams = newParams.map(newParam => {
      const existingParam = currentParams.find(p => p.name === newParam.name && p.type === newParam.type);
      if (existingParam) {
        // Preserve the current value of the existing parameter
        return {
          ...newParam,
          value: existingParam.value
        };
      }
      return newParam;
    });
    
    // Log detected uniforms
    console.log('===== DETECTED UNIFORMS =====');
    if (mergedParams.length === 0) {
      console.log('No customizable uniforms detected in the shader');
    } else {
      console.log(`Detected ${mergedParams.length} customizable uniforms:`);
      mergedParams.forEach(param => {
        const preserved = currentParams.find(p => p.name === param.name);
        const status = preserved ? '(value preserved)' : '(default value)';
        console.log(`- ${param.name} (${param.type}): ${param.label} ${status}${param.description ? ' - ' + param.description : ''}`);
      });
    }
    console.log('===============================');
    
    shaderParams.set(mergedParams);
    return mergedParams;
  },
  
  // Update the value of a parameter
  updateParamValue(name: string, value: number | number[] | boolean) {
    shaderParams.update(params => {
      const param = params.find(p => p.name === name);
      if (param) {
        param.value = value;
      }
      return params;
    });
    
    // Indicate that parameters have changed
    parameterChanged.set(true);
  },
  
  // Update a specific component of a vector parameter
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
    
    // Indicate that parameters have changed
    parameterChanged.set(true);
  },
  
  // Reset all parameters to their default values
  resetParams() {
    shaderParams.update(params => {
      return params.map(p => ({
        ...p,
        value: p.defaultValue
      }));
    });
    
    // Indicate that parameters have changed
    parameterChanged.set(true);
  },
  
  // Randomize all parameters
  randomizeParams() {
    shaderParams.update(params => {
      return params.map(p => {
        let randomValue: number | number[] | boolean;
        
        switch (p.type) {
          case 'float':
            randomValue = Math.random();
            break;
          case 'int':
            randomValue = Math.floor(Math.random() * (p.max - p.min + 1)) + p.min;
            break;
          case 'vec2':
            randomValue = [Math.random(), Math.random()];
            break;
          case 'vec3':
            randomValue = [Math.random(), Math.random(), Math.random()];
            break;
          case 'vec4':
            randomValue = [Math.random(), Math.random(), Math.random(), 1.0];
            break;
          case 'bool':
            randomValue = Math.random() > 0.5;
            break;
          default:
            randomValue = Math.random();
        }
        
        return {
          ...p,
          value: randomValue
        };
      });
    });
    
    // Indicate that parameters have changed
    parameterChanged.set(true);
  },
  
  // Get the current parameter values as an object
  getCurrentValues(): UniformValues {
    const params = get(shaderParams);
    const values: UniformValues = {};
    
    params.forEach(param => {
      values[param.name] = param.value;
    });
    
    return values;
  },
  
  // Apply parameter values to the shader
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
    
    // Reset the change indicator
    parameterChanged.set(false);
  }
};
