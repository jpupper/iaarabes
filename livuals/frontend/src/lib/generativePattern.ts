import { writable, type Writable } from 'svelte/store';

export enum GenerativePatternStatusEnum {
    INIT = "init",
    ACTIVE = "active",
    INACTIVE = "inactive",
}

// Lista de shaders disponibles
export const AVAILABLE_SHADERS = [
    { id: 'radial', name: 'Patrón Radial', file: 'radialShader' },
    { id: 'lines', name: 'Patrón de Líneas', file: 'linesShader' }
];

// Store para el estado del patrón generativo
export const generativePatternStatus = writable(GenerativePatternStatusEnum.INIT);

// Store para el shader seleccionado actualmente
export const selectedShader = writable(AVAILABLE_SHADERS[0]);

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

    selectShader(shaderId: string) {
        const shader = AVAILABLE_SHADERS.find(s => s.id === shaderId);
        if (shader) {
            selectedShader.set(shader);
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
