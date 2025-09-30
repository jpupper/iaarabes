// Shader con parámetros personalizables
precision mediump float;

// Uniforms reservados (no se mostrarán como parámetros)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables (se mostrarán como sliders)
uniform float u_speed;         // Velocidad de animación
uniform float u_intensity;     // Intensidad del efecto
uniform vec3 u_color1;         // Color primario
uniform vec3 u_color2;         // Color secundario
uniform vec2 u_center;         // Centro del patrón
uniform bool u_invert;         // Invertir colores

void main() {
    // Normalizar coordenadas
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Ajustar centro según parámetro
    uv = uv - u_center;
    
    // Calcular distancia al centro
    float dist = length(uv);
    
    // Crear patrón circular con velocidad ajustable
    float pattern = sin(dist * 10.0 * u_intensity - u_time * u_speed) * 0.5 + 0.5;
    
    // Mezclar colores según el patrón
    vec3 color = mix(u_color1, u_color2, pattern);
    
    // Aplicar inversión si está activada
    if (u_invert) {
        color = 1.0 - color;
    }
    
    // Salida final
    gl_FragColor = vec4(color, 1.0);
}
