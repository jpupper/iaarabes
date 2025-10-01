// Shader BPM corregido con size y fase del beat
// Adaptado para usar uniforms globales del proyecto
precision mediump float;

// Uniforms globales (reservados)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables
uniform float u_size;         // Tamaño/escala del patrón
uniform float u_bpm;          // Beats por minuto
uniform float u_phase;        // Fase del beat (0-1) para ajustar timing
uniform float u_intensity;    // Intensidad del pulso
uniform vec3 u_color1;        // Color base
uniform vec3 u_color2;        // Color del beat
uniform float u_speed;        // Velocidad adicional

// Constantes
#define PI 3.14159265359
#define TWO_PI 6.28318530718

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Centrar y aplicar aspect ratio
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Aplicar tamaño
    uv *= u_size;
    
    // Calcular beat basado en BPM
    float beatsPerSecond = u_bpm / 60.0;
    float beatTime = u_time * beatsPerSecond * u_speed;
    
    // Aplicar fase para ajustar el timing del beat
    beatTime += u_phase * TWO_PI;
    
    // Crear pulso del beat
    float beat = sin(beatTime * TWO_PI) * 0.5 + 0.5;
    beat = pow(beat, 3.0); // Hacer el pulso más pronunciado
    
    // Calcular distancia al centro
    float dist = length(uv);
    
    // Crear patrón radial que pulsa con el beat
    float pattern = sin(dist * 10.0 - beatTime * TWO_PI) * 0.5 + 0.5;
    pattern = mix(pattern, beat, u_intensity);
    
    // Mezclar colores
    vec3 color = mix(u_color1, u_color2, pattern);
    
    // Añadir brillo en el beat
    color += vec3(beat * u_intensity * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
}
