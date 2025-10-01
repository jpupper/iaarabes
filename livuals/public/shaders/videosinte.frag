// Shader de ondas deformadas con parámetros v1-v4
// Adaptado para usar uniforms globales del proyecto
precision mediump float;

// Uniforms globales (reservados)
uniform float u_time;
uniform vec2 u_resolution;

// Parámetros personalizables
uniform float u_v1;           // Frecuencia onda 1
uniform float u_v1_amp;       // Amplitud onda 1
uniform float u_v2;           // Frecuencia onda 2
uniform float u_v2_amp;       // Amplitud onda 2
uniform float u_v3;           // Frecuencia onda 3
uniform float u_v3_amp;       // Amplitud onda 3
uniform float u_v4;           // Frecuencia onda 4
uniform float u_v4_amp;       // Amplitud onda 4
uniform float u_faser;        // Fase canal rojo
uniform float u_faseg;        // Fase canal verde
uniform float u_faseb;        // Fase canal azul
uniform float u_speed;        // Velocidad de animación
uniform float u_e_force;      // Fuerza del efecto

// Constantes
#define PI 3.14159265359

// Función de mapeo (equivalente a mapr del common.frag)
float mapr(float value, float low2, float high2) {
    return low2 + (high2 - low2) * value;
}

// Función de deformación
float desf(vec2 uv, float fase) {
    float e = 0.0;
    float mt = u_time * u_speed * 10.0; // Tiempo mapeado
    
    float ampmax = 5.0;
    float mv1_amp = mapr(u_v1_amp, 0.0, ampmax);
    float mv2_amp = mapr(u_v2_amp, 0.0, ampmax);
    float mv3_amp = mapr(u_v3_amp, 0.0, ampmax);
    float mv4_amp = mapr(u_v4_amp, 0.0, ampmax);
    
    e = sin(uv.y * mapr(u_v1, 0.0, 100.0) + mt + fase
          + sin(uv.y * mapr(u_v2, 0.0, 100.0) + mt + fase
          + sin(uv.x * mapr(u_v3, 0.0, 100.0) + mt + fase
          + sin(uv.y * mapr(u_v4, 0.0, 100.0) + mt + fase
          ) * mv4_amp * 0.5 + mv4_amp * 0.5
          ) * mv3_amp * 0.5 + mv3_amp * 0.5
          ) * mv2_amp * 0.5 + mv2_amp * 0.5
          ) * mv1_amp * 0.5 + mv1_amp * 0.5;
    
    return e;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    float m_faser = u_faser * PI * 2.0;
    float m_faseg = u_faseg * PI * 2.0;
    float m_faseb = u_faseb * PI * 2.0;
    
    float e1 = desf(uv, m_faser);
    float e2 = desf(uv, m_faseg);
    float e3 = desf(uv, m_faseb);
    
    vec3 dib = vec3(e1, e2, e3);
    vec3 fin = dib * u_e_force;
    
    gl_FragColor = vec4(fin, 1.0);
}
