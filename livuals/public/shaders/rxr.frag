// Shader de ruido ridged con colores personalizables
// Adaptado para usar uniforms globales del proyecto
precision mediump float;

// Uniforms globales (reservados)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables
uniform float u_sc;           // Escala principal
uniform float u_sc2;          // Escala secundaria
uniform float u_seed;         // Semilla para variación
uniform float u_r1;           // Fase color rojo
uniform float u_g1;           // Fase color verde
uniform float u_b1;           // Fase color azul
uniform float u_flush;        // Intensidad de flush
uniform float u_speed;        // Velocidad de animación

// Constantes
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define OCTAVES 8

// Función de mapeo
float mapr(float value, float low2, float high2) {
    return low2 + (high2 - low2) * value;
}

// Funciones auxiliares para simplex noise
vec3 mod289(vec3 x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec2 mod289(vec2 x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec3 permute(vec3 x) { 
    return mod289(((x * 34.0) + 1.0) * x); 
}

// Simplex noise 2D
float snoise2(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                        -0.577350269189626,
                        0.024390243902439);
    
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
    
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
    m = m * m;
    m = m * m;
    
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x, x2.x) + h.yz * vec2(x1.y, x2.y);
    return 130.0 * dot(m, g);
}

// Ridge function
float ridge2(float h, float offset) {
    h = abs(h);
    h = offset - h;
    h = h * h;
    return h;
}

// Ridged multifractal
float ridgedMF3(vec2 p) {
    float lacunarity = 2.0;
    float gain = 0.5;
    float offset = 0.9;
    
    float sum = 0.0;
    float freq = 1.0, amp = 0.5;
    float prev = 1.0;
    
    for(int i = 0; i < OCTAVES; i++) {
        float n = ridge2(snoise2(p * freq + u_seed), offset);
        sum += n * amp;
        sum += n * amp * prev;
        prev = n;
        freq *= lacunarity;
        amp *= gain;
    }
    return sum;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    float fx = u_resolution.x / u_resolution.y;
    uv.x *= fx;
    
    float msc = mapr(u_sc, 150.0, 300.0);
    float msc2 = mapr(u_sc2, 0.1, 0.8);
    float gsc = mapr(u_sc, 0.0, 1.2);
    
    float rsc1 = 1.2;
    float rsc2 = 0.8;
    
    float e = ridgedMF3(vec2(uv.x * rsc1 * gsc, uv.y * rsc1 * gsc)
              * ridgedMF3(vec2(uv.x * rsc2 * msc2 * gsc, uv.y * rsc2 * msc2 * gsc)) - uv);
    
    float mflush = mapr(u_flush, 0.3, 1.0);
    e = sin(e * 2.0 * mflush + u_time * u_speed * 2.0 * 0.05) * 5.0;
    
    vec2 p = vec2(0.5 * fx, 0.5) - uv;
    float r = length(p);
    
    vec3 col1 = vec3(sin(e * 2.0 + u_r1 * TWO_PI) * 0.5 + 0.5,
                     sin(e * 2.0 + u_g1 * TWO_PI) * 0.5 + 0.5,
                     sin(e * 2.0 + u_b1 * TWO_PI) * 0.5 + 0.5);
    
    col1 = mix(col1, vec3(0.0), cos(e * 8.0));
    vec3 col2 = mix(col1, vec3(0.0), cos(e * 8.0));
    
    e = sin(e * 5.0 + u_time * u_speed * 2.0 * 0.1);
    
    vec3 fin = mix(col1, col2, e);
    
    gl_FragColor = vec4(fin, 1.0);
}
