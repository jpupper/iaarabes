export const name = 'Radial Pattern';
export const description = 'Patrón circular con anillos que cambian de color';

export const fragmentShaderSource = `
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

export const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;
