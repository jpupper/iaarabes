// Shader de líneas con parámetros personalizables
precision mediump float;

// Uniforms reservados (no se mostrarán como parámetros)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables (se mostrarán como sliders)
uniform float u_frequency;     // Frecuencia de las líneas
uniform float u_speed;         // Velocidad de animación
uniform float u_thickness;     // Grosor de las líneas
uniform vec3 u_color1;         // Color de las líneas
uniform vec3 u_color2;         // Color de fondo
uniform bool u_vertical;       // Orientación de las líneas

void main() {
    // Normalizar coordenadas
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Determinar orientación basada en el parámetro
    float coord = u_vertical ? uv.x : uv.y;
    
    // Crear patrón de líneas con frecuencia y velocidad ajustables
    float pattern = sin(coord * 50.0 * u_frequency + u_time * u_speed);
    
    // Aplicar grosor ajustable
    float lines = smoothstep(1.0 - u_thickness, 1.0, abs(pattern));
    
    // Mezclar colores
    vec3 color = mix(u_color1, u_color2, lines);
    
    // Salida final
    gl_FragColor = vec4(color, 1.0);
}
