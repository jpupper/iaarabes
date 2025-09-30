import { writable } from 'svelte/store';

// Dimensiones predeterminadas para los canvas
export const defaultDimensions = {
  width: 512,
  height: 512,
  aspectRatio: 1, // 1:1 (cuadrado)
};

// Store para las dimensiones del canvas
export const canvasDimensions = writable(defaultDimensions);

// Acciones para modificar las dimensiones
export const canvasDimensionsActions = {
  // Establecer dimensiones específicas
  setDimensions(width: number, height: number) {
    canvasDimensions.set({
      width,
      height,
      aspectRatio: width / height,
    });
  },
  
  // Establecer solo el ancho (mantiene la relación de aspecto)
  setWidth(width: number) {
    canvasDimensions.update(dims => ({
      width,
      height: width / dims.aspectRatio,
      aspectRatio: dims.aspectRatio,
    }));
  },
  
  // Establecer solo el alto (mantiene la relación de aspecto)
  setHeight(height: number) {
    canvasDimensions.update(dims => ({
      width: height * dims.aspectRatio,
      height,
      aspectRatio: dims.aspectRatio,
    }));
  },
  
  // Establecer la relación de aspecto
  setAspectRatio(aspectRatio: number) {
    canvasDimensions.update(dims => ({
      width: dims.height * aspectRatio,
      height: dims.height,
      aspectRatio,
    }));
  },
  
  // Restablecer a las dimensiones predeterminadas
  reset() {
    canvasDimensions.set(defaultDimensions);
  }
};
