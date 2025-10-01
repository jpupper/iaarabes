// Shader mezclador de patrones de ruido con control de semilla y desfase RGB
// Adaptado para usar uniforms globales del proyecto
precision mediump float;

// Uniforms globales (reservados)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables
uniform float u_scalex;       // Escala X del patrón
uniform float u_scaley;       // Escala Y del patrón
uniform float u_speedx;       // Velocidad X
uniform float u_speedy;       // Velocidad Y
uniform float u_pattern;      // Selector de patrón (0-1 mezcla entre patrones)
uniform float u_seed_speed;   // Velocidad de animación de la semilla
uniform float u_phase_r;      // Fase del canal rojo (0-1)
uniform float u_phase_g;      // Fase del canal verde (0-1)
uniform float u_phase_b;      // Fase del canal azul (0-1)
uniform float u_phase_amount; // Cantidad de desfase entre canales
uniform float u_brightness;   // Brillo (0-1)
uniform float u_contrast;     // Contraste (0-1)

// Constantes
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define OCTAVES 8

// Velocidades de animación de cada patrón (ajustables manualmente)
const float SPEED_RXR = 0.1;        // Velocidad patrón rxr (e2)
const float SPEED_RIDGEDMF = 0.1;   // Velocidad patrón ridgedMF (e3)
const float SPEED_SNOISE = 0.1;    // Velocidad patrón snoise (e4)
const float SPEED_NOISE = 0.1;      // Velocidad patrón noise (e5)
const float SPEED_RANDOM = 10.0;    // Velocidad patrón random (e6)
const float SPEED_VORONOI = 0.1;    // Velocidad patrón voronoi (e7)
const float SPEED_FBM = 5.0;        // Velocidad patrón fbm (e8) - shift
const float SPEED_FBM_NOISE = 1.0;  // Velocidad patrón fbm (e8) - noise interno

// Función de mapeo
float mapr(float value, float low2, float high2) {
    return low2 + (high2 - low2) * value;
}

// Funciones auxiliares para noise
vec3 mod289(vec3 x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec2 mod289(vec2 x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec3 permute(vec3 x) { 
    return mod289(((x * 34.0) + 1.0) * x); 
}

// Random function con semilla
float random2(vec2 st, float seed) {
    return fract(sin(dot(floor(st.xy), vec2(12.9898, 78.233))) * 43000.3 + seed * SPEED_RANDOM);
}

// Noise function con semilla (ralentizada)
float noise(vec2 st, float seed) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Aplicar velocidad de animación
    float slowSeed = seed * SPEED_NOISE;
    
    float a = random2(i, slowSeed);
    float b = random2(i + vec2(1.0, 0.0), slowSeed);
    float c = random2(i + vec2(0.0, 1.0), slowSeed);
    float d = random2(i + vec2(1.0, 1.0), slowSeed);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Simplex noise con semilla
float snoise(vec2 v, float seed) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    
    // Aplicar semilla a las permutaciones
    i = mod289(i + seed * SPEED_SNOISE);
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
float ridge(float h, float offset) {
    h = abs(h);
    h = offset - h;
    h = h * h;
    return h;
}

// Ridged multifractal con semilla (ralentizado)
float ridgedMF(vec2 p, float seed) {
    float lacunarity = 2.0;
    float gain = 0.5;
    float offset = 0.9;
    float sum = 0.0;
    float freq = 1.0, amp = 0.5;
    float prev = 1.0;
    
    // Aplicar velocidad de animación
    float slowSeed = seed * SPEED_RIDGEDMF;
    
    for(int i = 0; i < OCTAVES; i++) {
        float n = ridge(snoise(p * freq, slowSeed), offset);
        sum += n * amp;
        sum += n * amp * prev;
        prev = n;
        freq *= lacunarity;
        amp *= gain;
    }
    return sum * 0.2;
}

// rxr function (ridged recursivo) con semilla
float rxr(vec2 uv, float seed) {
    // Aplicar velocidad de animación específica para rxr
    float rxrSeed = seed * SPEED_RXR;
    return ridgedMF(vec2(ridgedMF(vec2(uv.x, uv.y), rxrSeed)), rxrSeed);
}

// Voronoi function mejorado con semilla
float voronoi(vec2 uv, float seed) {
    vec2 i_st = floor(uv);
    vec2 f_st = fract(uv);
    
    float m_dist = 1.0;
    
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = fract(sin(vec2(
                dot(i_st + neighbor, vec2(127.1, 311.7)),
                dot(i_st + neighbor, vec2(269.5, 183.3))
            ) + seed * SPEED_VORONOI) * 43758.5453);
            
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            m_dist = min(m_dist, dist);
        }
    }
    
    // Invertir para que las células sean brillantes
    return 1.0 - m_dist;
}

// FBM (Fractal Brownian Motion) con semilla (ralentizado)
float fbm(vec2 uv, float seed) {
    float value = 0.0;
    float amplitude = 0.5;
    // Aplicar velocidad de animación al shift
    vec2 shift = vec2(100.0 + seed * SPEED_FBM);
    mat2 rot2 = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    
    // Aplicar velocidad de animación al noise interno
    float fbmSeed = seed * SPEED_FBM_NOISE;
    for (int i = 0; i < 16; i++) {
        value += amplitude * noise(uv, fbmSeed);
        uv = rot2 * uv * 2.0 + shift;
        amplitude *= 0.5;
    }
    // Normalizar para evitar brillo excesivo
    return value * 0.5;
}

// Función para calcular un patrón con semilla
float calculatePattern(vec2 animUV, float patron, float seed) {
    // Calcular todos los patrones con la semilla
    float e2 = rxr(animUV, seed) * 0.5;
    e2 = smoothstep(0.0, 0.8, e2) * 4.0;
    
    float e3 = ridgedMF(animUV, seed);
    e3 = smoothstep(0.0, 0.8, e3) * 3.0;
    
    float e4 = snoise(animUV, seed) * 0.5 + 0.5;
    e4 = e4 * 1.5;
    
    float e5 = noise(animUV, seed) * 1.2;
    
    float e6 = random2(animUV, seed) * 1.0;
    
    float e7 = voronoi(animUV, seed) * 1.0;
    
    float e8 = fbm(animUV, seed) * 2.0;
    
    // Mezclar patrones según el valor de patron
    float result = 0.0;
    
    if(patron <= 1.0) {
        result = mix(e2, e3, patron);
    }
    else if(patron > 1.0 && patron <= 2.0) {
        result = mix(e3, e4, patron - 1.0);
    }
    else if(patron > 2.0 && patron <= 3.0) {
        result = mix(e4, e5, patron - 2.0);
    }
    else if(patron > 3.0 && patron <= 4.0) {
        result = mix(e5, e6, patron - 3.0);
    }
    else if(patron > 4.0 && patron <= 5.0) {
        result = mix(e6, e7, patron - 4.0);
    }
    else if(patron > 5.0 && patron <= 6.0) {
        result = mix(e7, e8, patron - 5.0);
    }
    
    // Clamp para evitar valores fuera de rango
    return clamp(result, 0.0, 1.0);
}

// Función para aplicar brillo y contraste
vec3 applyBrightnessContrast(vec3 color, float brightness, float contrast) {
    // Mapear brightness de 0-1 a 0.5-1.5
    float bright = brightness * 1.0 + 0.5;
    
    // Mapear contrast de 0-1 a 0.5-2.0
    float contr = contrast * 1.5 + 0.5;
    
    // Aplicar brillo
    color = color * bright;
    
    // Aplicar contraste
    color = (color - 0.5) * contr + 0.5;
    
    return clamp(color, 0.0, 1.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    float mapspeedx = mapr(u_speedx, -1.0, 1.0);
    float mapspeedy = mapr(u_speedy, -1.0, 1.0);
    float mapscalex = mapr(u_scalex, 0.0, 10.0);
    float mapscaley = mapr(u_scaley, 0.0, 10.0);
    
    float patron = mapr(u_pattern, 0.0, 6.0);
    
    // Semilla animada
    float animatedSeed = u_time * u_seed_speed*.01;
    
    // Calcular UV base animado
    vec2 baseAnimUV = vec2(uv.x * mapscalex + u_time * mapspeedx,
                           uv.y * mapscaley + u_time * mapspeedy);
    
    // Desfase de UV por canal con las fases
    float phaseR = u_phase_r * TWO_PI;
    float phaseG = u_phase_g * TWO_PI;
    float phaseB = u_phase_b * TWO_PI;
    
    // Calcular offset para cada canal basado en la fase
    vec2 offsetR = vec2(cos(phaseR), sin(phaseR)) * u_phase_amount * 10.0;
    vec2 offsetG = vec2(cos(phaseG), sin(phaseG)) * u_phase_amount * 10.0;
    vec2 offsetB = vec2(cos(phaseB), sin(phaseB)) * u_phase_amount * 10.0;
    
    // Calcular patrón para cada canal con su desfase
    float r = calculatePattern(baseAnimUV + offsetR, patron, animatedSeed);
    float g = calculatePattern(baseAnimUV + offsetG, patron, animatedSeed);
    float b = calculatePattern(baseAnimUV + offsetB, patron, animatedSeed);
    
    vec3 fin = vec3(r, g, b);
    
    // Aplicar brillo y contraste
    fin = applyBrightnessContrast(fin, u_brightness, u_contrast);
    
    gl_FragColor = vec4(fin, 1.0);
}
