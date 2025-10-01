
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float r;
uniform float g;
uniform float b;

// Función para calcular el pulso BPM
float getBPM(float _t, float _bpm) {
  return fract(_t/60.0*_bpm)/(_bpm/60.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  gl_FragColor = vec4(r,g,b, 1.0);
}
