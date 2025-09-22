import { writable, type Writable } from 'svelte/store';

export enum GenerativePatternStatusEnum {
    INIT = "init",
    ACTIVE = "active",
    INACTIVE = "inactive",
}

// Store para el estado del patrón generativo
export const generativePatternStatus = writable(GenerativePatternStatusEnum.INIT);

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
