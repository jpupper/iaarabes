import { writable, type Writable, get } from 'svelte/store';

export enum GenerativePatternStatusEnum {
    INIT = "init",
    ACTIVE = "active",
    INACTIVE = "inactive",
}

// List of available shaders
export const AVAILABLE_SHADERS = writable<Array<{id: string, name: string, file: string}>>([]);

// Store for shader source code
export const shaderSources = writable<{fragmentShaderSource: string, vertexShaderSource: string}>({fragmentShaderSource: '', vertexShaderSource: ''});

// Store for generative pattern state
export const generativePatternStatus = writable(GenerativePatternStatusEnum.INIT);

// Define a default shader to avoid undefined
const defaultShader = { id: 'default', name: 'Default Pattern', file: 'default' };

// Store for the currently selected shader
export const selectedShader = writable<{id: string, name: string, file: string}>(defaultShader);

// Store for the last generated frame
export const generativeFrameStore: Writable<{ blob: Blob }> = writable({ blob: new Blob() });

// Actions to control the generative pattern
export const generativePatternActions = {
    start() {
        generativePatternStatus.set(GenerativePatternStatusEnum.ACTIVE);
    },
    
    stop() {
        generativePatternStatus.set(GenerativePatternStatusEnum.INACTIVE);
    },

    // Method to load the list of shaders from the backend
    async loadShaders() {
        try {
            console.log('Attempting to load shaders from server...');
            
            // Initialize with default shaders in case of error
            const defaultShaders = [
                { id: 'radial', name: 'Radial Pattern', file: 'radial' },
                { id: 'lines', name: 'Lines Pattern', file: 'lines' }
            ];
            
            // Try directly with the URL we know works
            try {
                console.log('Attempting to load from http://localhost:7860/api/shaders/list');
                const response = await fetch('http://localhost:7860/api/shaders/list');
                
                if (response.ok) {
                    const shaders = await response.json();
                    console.log('Shaders obtained:', shaders);
                    
                    if (shaders && Array.isArray(shaders) && shaders.length > 0) {
                        console.log('Shaders loaded successfully:', shaders);
                        AVAILABLE_SHADERS.set(shaders);
                        
                        // Select the first shader by default
                        selectedShader.set(shaders[0]);
                        await this.loadShaderSource(shaders[0].id);
                        return;
                    } else {
                        console.warn('Response does not contain valid shaders');
                    }
                } else {
                    console.warn(`Error in response: ${response.status} ${response.statusText}`);
                }
            } catch (fetchError) {
                console.error('Error loading shaders:', fetchError);
            }
            
            // If we get here, use default shaders
            console.warn('Using default shaders');
            AVAILABLE_SHADERS.set(defaultShaders);
            selectedShader.set(defaultShaders[0]);
            
            // Load default shader code
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
            console.error('Critical error loading shaders:', error);
            // Ensure there's always a shader selected
            const currentShader = get(selectedShader);
            if (!currentShader || !currentShader.id) {
                selectedShader.set(defaultShader);
            }
        }
    },

    // Method to select a shader by its ID
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
            console.log(`Selecting shader: ${shaderId}`);
            // Load the shader and its parameters
            await this.loadShaderSource(shaderId);
        }
        
        return found;
    },
    
    // Method to load the source code of a specific shader
    async loadShaderSource(shaderId: string) {
        try {
            console.log(`Attempting to load shader ${shaderId}...`);
            
            // Import the shader parameters module at the start to avoid issues
            const shaderParamsModule = await import('./shaderParams');
            const shaderParamsActions = shaderParamsModule.shaderParamsActions;
            
            // Try to load from the backend
            try {
                // Use the URL we know works directly
                const url = `http://localhost:7860/api/shaders/${shaderId}`;
                console.log(`Attempting fetch to ${url}...`);
                
                const response = await fetch(url);
                console.log(`Response from ${url}:`, response.status, response.statusText);
                
                if (response.ok) {
                    const sources = await response.json();
                    console.log(`Shader ${shaderId} loaded:`, sources);
                    
                    if (sources && sources.fragmentShaderSource && sources.vertexShaderSource) {
                        // Update shader sources
                        shaderSources.set({
                            fragmentShaderSource: sources.fragmentShaderSource,
                            vertexShaderSource: sources.vertexShaderSource
                        });
                        
                        // Load shader parameters immediately
                        console.log('Analyzing shader parameters...');
                        shaderParamsActions.loadParamsFromShader(sources.fragmentShaderSource);
                        return;
                    }
                }
                throw new Error(`Error loading shader ${shaderId}`);
            } catch (fetchError) {
                console.warn(`Error loading shader ${shaderId}, using default shader:`, fetchError);
                
                // Use a default shader based on the ID
                let fragmentSource = '';
                
                if (shaderId === 'radial') {
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        // Customizable parameters
                        uniform float u_speed;         // Animation speed
                        uniform float u_frequency;     // Pattern frequency
                        uniform vec3 u_color;          // Main color
                        uniform float u_intensity;     // Effect intensity
                        
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
                        
                        // Customizable parameters
                        uniform float u_frequency;     // Line frequency
                        uniform float u_speed;         // Animation speed
                        uniform vec3 u_color1;         // Main color
                        uniform vec3 u_color2;         // Secondary color
                        uniform bool u_vertical;       // Vertical orientation
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            float coord = u_vertical ? uv.x : uv.y;
                            float c = sin(coord * 50.0 * u_frequency + u_time * u_speed) * 0.5 + 0.5;
                            vec3 color = mix(u_color1, u_color2, c);
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `;
                } else {
                    // Generic shader
                    fragmentSource = `
                        precision mediump float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        
                        // Customizable parameters
                        uniform float u_speed;         // Animation speed
                        uniform float u_saturation;    // Color saturation
                        uniform float u_brightness;    // Brightness
                        
                        void main() {
                            vec2 uv = gl_FragCoord.xy / u_resolution;
                            float r = uv.x;
                            float g = uv.y;
                            float b = sin(u_time * u_speed) * 0.5 + 0.5;
                            
                            // Apply saturation and brightness
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
                
                // Update shader sources
                shaderSources.set({
                    fragmentShaderSource: fragmentSource,
                    vertexShaderSource: vertexSource
                });
                
                // Load shader parameters immediately
                console.log('Analyzing default shader parameters...');
                shaderParamsActions.loadParamsFromShader(fragmentSource);
            }
        } catch (error) {
            console.error(`Critical error loading shader ${shaderId}:`, error);
        }
    },
    
    // Method to update the current frame from the canvas
    updateFrame(imageData: string) {
        // Convert base64 string to Blob
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
