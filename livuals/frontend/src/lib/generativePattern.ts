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
    selectShader(shaderId: string) {
        let found = false;
        AVAILABLE_SHADERS.update(shaders => {
            const shader = shaders.find(s => s.id === shaderId);
            if (shader) {
                selectedShader.set(shader);
                this.loadShaderSource(shader.id);
                found = true;
            }
            return shaders;
        });
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
                        
                        void main() {
                            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
                            float d = length(uv);
                            float c = sin(d * 10.0 - u_time * 2.0) * 0.5 + 0.5;
                            gl_FragColor = vec4(c, c * 0.5, c * 0.8, 1.0);
                        }
                    `;
                } else if (shaderId === 'lines') {
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            float c = sin(uv.y * 50.0 + u_time * 2.0) * 0.5 + 0.5;
                            gl_FragColor = vec4(c, c * 0.3, c * 0.7, 1.0);
                        }
                    `;
                } else {
                    // Shader genérico
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
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
