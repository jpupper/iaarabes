export const name = 'Lines Pattern';
export const description = 'Patrón de líneas ondulantes que cambian de color';

export const fragmentShaderSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    // Patrón de líneas ondulantes
    float lineWidth = 10.0;
    float lineSpeed = 2.0;
    
    // Líneas horizontales
    float horizontalLines = sin(uv.y * lineWidth + u_time * lineSpeed) * 0.5 + 0.5;
    
    // Líneas verticales con desfase
    float verticalLines = sin(uv.x * lineWidth + u_time * lineSpeed * 0.7) * 0.5 + 0.5;
    
    // Colores que cambian con el tiempo
    vec3 color1 = vec3(0.2 + 0.5 * sin(u_time * 0.3), 
                       0.4 + 0.4 * sin(u_time * 0.5), 
                       0.6 + 0.3 * sin(u_time * 0.7));
    
    vec3 color2 = vec3(0.8 + 0.2 * cos(u_time * 0.4),
                       0.6 + 0.3 * cos(u_time * 0.6),
                       0.4 + 0.4 * cos(u_time * 0.8));
    
    // Mezcla de colores basada en las líneas
    float pattern = mix(horizontalLines, verticalLines, sin(u_time * 0.2) * 0.5 + 0.5);
    vec3 color = mix(color1, color2, pattern);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;
