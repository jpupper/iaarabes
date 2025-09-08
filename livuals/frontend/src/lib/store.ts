import { derived, writable, get, type Writable, type Readable } from 'svelte/store';

export const pipelineValues: Writable<Record<string, any>> = writable({});
export const deboucedPipelineValues: Readable<Record<string, any>>
    = derived(pipelineValues, ($pipelineValues, set) => {
        const debounced = setTimeout(() => {
            set($pipelineValues);
        }, 100);
        return () => clearTimeout(debounced);
    });

export const getPipelineValues = () => get(pipelineValues);

export const lcmLiveStatus = writable('');
export const inferenceBusy = writable(false);
export const streamId = writable<string | null>(null);

// Tipos y stores para las fuentes de entrada
export type InputSourceType = 'camera' | 'screen' | 'iframe' | 'youtube' | null;

export interface InputSource {
  id: string;
  name: string;
  resolution: string;
  fps: string;
  type: InputSourceType;
  description: string;
  url?: string;
}

// Store para la fuente de entrada seleccionada
export const selectedInputSource = writable<InputSource | null>(null);

// Función para actualizar la fuente seleccionada
export function updateSelectedInputSource(source: InputSource | null) {
  selectedInputSource.set(source);
}