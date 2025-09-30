# Nuevos Shaders Creados

He creado 4 shaders adaptados a la estructura de uniforms globales de tu proyecto (`u_time`, `u_resolution`).

## Archivos creados en `livuals/`:

### 1. **bpm_corrected.frag** - Shader BPM Corregido
**Correcciones aplicadas:**
- ✅ Agregado uniform `u_size` para controlar el tamaño/escala del patrón
- ✅ Agregado uniform `u_phase` para ajustar la fase del beat (0-1)
- ✅ Agregado uniform `u_bpm` para controlar beats por minuto
- ✅ Agregado uniform `u_intensity` para controlar la intensidad del pulso

**Parámetros disponibles:**
- `u_size` - Tamaño/escala del patrón
- `u_bpm` - Beats por minuto (60-180 recomendado)
- `u_phase` - Fase del beat para ajustar timing (0.0-1.0)
- `u_intensity` - Intensidad del pulso (0.0-1.0)
- `u_color1` - Color base (vec3)
- `u_color2` - Color del beat (vec3)
- `u_speed` - Velocidad adicional

---

### 2. **desf_waves.frag** - Ondas Deformadas
Primer shader que proporcionaste, adaptado con la función `desf()`.

**Parámetros disponibles:**
- `u_v1`, `u_v1_amp` - Frecuencia y amplitud onda 1
- `u_v2`, `u_v2_amp` - Frecuencia y amplitud onda 2
- `u_v3`, `u_v3_amp` - Frecuencia y amplitud onda 3
- `u_v4`, `u_v4_amp` - Frecuencia y amplitud onda 4
- `u_faser` - Fase canal rojo (0.0-1.0)
- `u_faseg` - Fase canal verde (0.0-1.0)
- `u_faseb` - Fase canal azul (0.0-1.0)
- `u_speed` - Velocidad de animación
- `u_e_force` - Fuerza del efecto

---

### 3. **ridged_noise.frag** - Ruido Ridged con Colores
Segundo shader que proporcionaste, con ruido fractal ridged.

**Parámetros disponibles:**
- `u_sc` - Escala principal (0.0-1.0)
- `u_sc2` - Escala secundaria (0.0-1.0)
- `u_seed` - Semilla para variación (0.0-1.0)
- `u_r1` - Fase color rojo (0.0-1.0)
- `u_g1` - Fase color verde (0.0-1.0)
- `u_b1` - Fase color azul (0.0-1.0)
- `u_flush` - Intensidad de flush (0.0-1.0)
- `u_speed` - Velocidad de animación

**Funciones incluidas:**
- `snoise2()` - Simplex noise 2D
- `ridge2()` - Función ridge para crear crestas
- `ridgedMF3()` - Multifractal ridged con 8 octavas

---

### 4. **desf_rgb.frag** - Ondas RGB Deformadas
Tercer shader (duplicado del primero para RGB), usa la misma función `desf()`.

**Parámetros disponibles:**
- Mismos que `desf_waves.frag`

---

## Instalación

### Paso 1: Mover archivos
Mueve los archivos `.frag` desde `livuals/` a `livuals/public/shaders/`:

```bash
# Desde la carpeta livuals/
mv bpm_corrected.frag public/shaders/
mv desf_waves.frag public/shaders/
mv ridged_noise.frag public/shaders/
mv desf_rgb.frag public/shaders/
```

### Paso 2: Recargar shaders
1. Inicia tu aplicación
2. Ve a la sección "Patrón Generativo"
3. Click en el botón **"Reload"** junto al selector de shaders
4. Los nuevos shaders aparecerán en la lista

---

## Diferencias con common.frag

**No incluí `#pragma include "../common.frag"`** porque:
1. Tu proyecto usa WebGL en el frontend, no tiene acceso a includes de archivos
2. Todas las funciones necesarias están definidas dentro de cada shader
3. Los uniforms globales (`u_time`, `u_resolution`) son inyectados automáticamente

**Funciones adaptadas:**
- `mapr()` - Función de mapeo de rangos
- `snoise2()` - Simplex noise 2D (solo en ridged_noise.frag)
- `ridge2()` - Función ridge (solo en ridged_noise.frag)
- `ridgedMF3()` - Multifractal ridged (solo en ridged_noise.frag)
- `desf()` - Función de deformación (en desf_waves.frag y desf_rgb.frag)

**Constantes definidas:**
- `PI` = 3.14159265359
- `TWO_PI` = 6.28318530718
- `OCTAVES` = 8 (para ridged noise)

---

## Valores recomendados para parámetros

### bpm_corrected.frag
- `u_size`: 0.5 - 2.0
- `u_bpm`: 60 - 180
- `u_phase`: 0.0 - 1.0 (ajustar según necesites)
- `u_intensity`: 0.3 - 0.8
- `u_speed`: 0.5 - 2.0

### desf_waves.frag / desf_rgb.frag
- `u_v1` a `u_v4`: 0.0 - 1.0
- `u_v1_amp` a `u_v4_amp`: 0.0 - 1.0
- `u_faser`, `u_faseg`, `u_faseb`: 0.0 - 1.0
- `u_speed`: 0.1 - 1.0
- `u_e_force`: 0.5 - 2.0

### ridged_noise.frag
- `u_sc`: 0.3 - 0.8
- `u_sc2`: 0.2 - 0.6
- `u_seed`: 0.0 - 1.0 (cambiar para diferentes patrones)
- `u_r1`, `u_g1`, `u_b1`: 0.0 - 1.0
- `u_flush`: 0.3 - 0.8
- `u_speed`: 0.1 - 0.5

---

## Notas importantes

1. **Todos los uniforms usan prefijo `u_`** para ser detectados automáticamente por tu sistema
2. **Los parámetros se preservan** al cambiar valores gracias a la corrección anterior
3. **Usa el botón "Reload"** para actualizar la lista sin recompilar
4. **Los valores por defecto** serán 0.5 para todos los parámetros float

---

## Próximos pasos

Si necesitas:
- **Más shaders adaptados** del common.frag
- **Funciones adicionales** como `voronoi()`, `fbm()`, etc.
- **Modos de blending** (los 25 modos están en common.frag)

Avísame y los adapto siguiendo esta misma estructura.
