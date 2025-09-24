import { writable, type Writable, get } from 'svelte/store';

export enum GenerativePatternStatusEnum {
    INIT = "init",
    ACTIVE = "active",
    INACTIVE = "inactive",
}

// Lista de shaders disponibles
export const AVAILABLE_SHADERS = writable<Array<{id: string, name: string, file: string}>>([]);

// Store para el código fuente de los shaders
export const shaderSources = writable<{fragmentShaderSource: string, vertexShaderSource: string}>({fragmentShaderSource: '', vertexShaderSource: ''});

// Store para el estado del patrón generativo
export const generativePatternStatus = writable(GenerativePatternStatusEnum.INIT);

// Definir un shader por defecto para evitar undefined
const defaultShader = { id: 'default', name: 'Patrón por defecto', file: 'default' };

// Store para el shader seleccionado actualmente
export const selectedShader = writable<{id: string, name: string, file: string}>(defaultShader);

// Store para el último frame generado
export const generativeFrameStore: Writable<{ blob: Blob }> = writable({ blob: new Blob() });

// Acciones para controlar el patrón generativo
export const generativePatternActions = {
    start() {
        generativePatternStatus.set(GenerativePatternStatusEnum.ACTIVE);
    },
    
    stop() {
        generativePatternStatus.set(GenerativePatternStatusEnum.INACTIVE);
    },

    // Método para cargar la lista de shaders desde el backend
    async loadShaders() {
        try {
            console.log('Intentando cargar shaders desde el servidor...');
            
            // Inicializar con shaders por defecto en caso de error
            const defaultShaders = [
                { id: 'radial', name: 'Patrón Radial', file: 'radial' },
                { id: 'lines', name: 'Patrón de Líneas', file: 'lines' }
            ];
            
            // Intentar directamente con la URL que sabemos que funciona
            try {
                console.log('Intentando cargar desde http://localhost:7860/api/shaders/list');
                const response = await fetch('http://localhost:7860/api/shaders/list');
                
                if (response.ok) {
                    const shaders = await response.json();
                    console.log('Shaders obtenidos:', shaders);
                    
                    if (shaders && Array.isArray(shaders) && shaders.length > 0) {
                        console.log('Shaders cargados correctamente:', shaders);
                        AVAILABLE_SHADERS.set(shaders);
                        
                        // Seleccionar el primer shader por defecto
                        selectedShader.set(shaders[0]);
                        await this.loadShaderSource(shaders[0].id);
                        return;
                    } else {
                        console.warn('La respuesta no contiene shaders válidos');
                    }
                } else {
                    console.warn(`Error en la respuesta: ${response.status} ${response.statusText}`);
                }
            } catch (fetchError) {
                console.error('Error al cargar shaders:', fetchError);
            }
            
            // Si llegamos aquí, usar los shaders por defecto
            console.warn('Usando shaders por defecto');
            AVAILABLE_SHADERS.set(defaultShaders);
            selectedShader.set(defaultShaders[0]);
            
            // Cargar código de shader por defecto
            shaderSources.set({
                fragmentShaderSource: `
                    precision mediump float;
                    uniform float u_time;
                    uniform vec2 u_resolution;
                    
                    void main() {
                        vec2 uv = gl_FragCoord.xy / u_resolution;
                        gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
                    }
                `,
                vertexShaderSource: `
                    attribute vec2 a_position;
                    void main() {
                        gl_Position = vec4(a_position, 0.0, 1.0);
                    }
                `
            });
        } catch (error) {
            console.error('Error crítico al cargar shaders:', error);
            // Asegurarse de que siempre haya un shader seleccionado
            const currentShader = get(selectedShader);
            if (!currentShader || !currentShader.id) {
                selectedShader.set(defaultShader);
            }
        }
    },

    // Método para seleccionar un shader por su ID
    async selectShader(shaderId: string) {
        let found = false;
        AVAILABLE_SHADERS.update(shaders => {
            const shader = shaders.find(s => s.id === shaderId);
            if (shader) {
                selectedShader.set(shader);
                found = true;
            }
            return shaders;
        });
        
        if (found) {
            console.log(`Seleccionando shader: ${shaderId}`);
            // Cargar el shader y sus parámetros
            await this.loadShaderSource(shaderId);
        }
        
        return found;
    },
    
    // Método para cargar el código fuente de un shader específico
    async loadShaderSource(shaderId: string) {
        try {
            console.log(`Intentando cargar shader ${shaderId}...`);
            
            // Intentar cargar desde el backend
            try {
                // Usar directamente la URL que sabemos que funciona
                const url = `http://localhost:7860/api/shaders/${shaderId}`;
                console.log(`Intentando fetch a ${url}...`);
                
                const response = await fetch(url);
                console.log(`Respuesta de ${url}:`, response.status, response.statusText);
                
                if (response.ok) {
                    const sources = await response.json();
                    console.log(`Shader ${shaderId} cargado:`, sources);
                    
                    if (sources && sources.fragmentShaderSource && sources.vertexShaderSource) {
                        shaderSources.set({
                            fragmentShaderSource: sources.fragmentShaderSource,
                            vertexShaderSource: sources.vertexShaderSource
                        });
                        
                        // Importar el módulo de parámetros de shader y cargar los parámetros
                        import('./shaderParams').then(module => {
                            const shaderParamsActions = module.shaderParamsActions;
                            console.log('Analizando parámetros del shader...');
                            shaderParamsActions.loadParamsFromShader(sources.fragmentShaderSource);
                        });
                        
                        return;
                    }
                }
                throw new Error(`Error al cargar el shader ${shaderId}`);
            } catch (fetchError) {
                console.warn(`Error al cargar el shader ${shaderId}, usando shader por defecto:`, fetchError);
                
                // Usar un shader por defecto según el ID
                let fragmentSource = '';
                
                if (shaderId === 'radial') {
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        // Parámetros personalizables
                        uniform float u_speed;         // Velocidad de animación
                        uniform float u_frequency;     // Frecuencia del patrón
                        uniform vec3 u_color;          // Color principal
                        uniform float u_intensity;     // Intensidad del efecto
                        
                        void main() {
                            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
                            float d = length(uv);
                            float c = sin(d * 10.0 * u_frequency - u_time * u_speed) * 0.5 + 0.5;
                            c = pow(c, u_intensity);
                            gl_FragColor = vec4(c * u_color.r, c * u_color.g, c * u_color.b, 1.0);
                        }
                    `;
                } else if (shaderId === 'lines') {
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        // Parámetros personalizables
                        uniform float u_frequency;     // Frecuencia de las líneas
                        uniform float u_speed;         // Velocidad de animación
                        uniform vec3 u_color1;         // Color principal
                        uniform vec3 u_color2;         // Color secundario
                        uniform bool u_vertical;       // Orientación vertical
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            float coord = u_vertical ? uv.x : uv.y;
                            float c = sin(coord * 50.0 * u_frequency + u_time * u_speed) * 0.5 + 0.5;
                            vec3 color = mix(u_color1, u_color2, c);
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `;
                } else {
                    // Shader genérico
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        // Parámetros personalizables
                        uniform float u_speed;         // Velocidad de animación
                        uniform float u_saturation;    // Saturación del color
                        uniform float u_brightness;    // Brillo
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            float r = uv.x;
                            float g = uv.y;
                            float b = sin(u_time * u_speed) * 0.5 + 0.5;
                            
                            // Aplicar saturación y brillo
                            vec3 color = vec3(r, g, b);
                            vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
                            color = mix(gray, color, u_saturation);
                            color = color * u_brightness;
                            
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `;
                }
                
                const vertexSource = `
                    attribute vec2 a_position;
                    void main() {
                        gl_Position = vec4(a_position, 0.0, 1.0);
                    }
                `;
                
                shaderSources.set({
                    fragmentShaderSource: fragmentSource,
                    vertexShaderSource: vertexSource
                });
                
                // Importar el módulo de parámetros de shader y cargar los parámetros
                import('./shaderParams').then(module => {
                    const shaderParamsActions = module.shaderParamsActions;
                    console.log('Analizando parámetros del shader por defecto...');
                    shaderParamsActions.loadParamsFromShader(fragmentSource);
                });
            }
        } catch (error) {
            console.error(`Error crítico al cargar el shader ${shaderId}:`, error);
        }
    },
    
    // Método para actualizar el frame actual desde el canvas
    updateFrame(imageData: string) {
        // Convertir el string base64 a Blob
        const byteString = atob(imageData.split(',')[1]);
        const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        generativeFrameStore.set({ blob });
    }
};
