import { derived, writable, get, type Writable, type Readable } from 'svelte/store';

// Definir los estados de StreamDiffusion directamente para evitar importación circular
export enum StreamDiffusionState {
    DISCONNECTED = "disconnected",
    INITIALIZING = "initializing",
    CONNECTED = "connected"
}

export const pipelineValues: Writable<Record<string, any>> = writable({});
export const deboucedPipelineValues: Readable<Record<string, any>>
    = derived(pipelineValues, ($pipelineValues, set) => {
        const debounced = setTimeout(() => {
            set($pipelineValues);
        }, 100);
        return () => clearTimeout(debounced);
    });

export const getPipelineValues = () => get(pipelineValues);

// Store para el estado de StreamDiffusion
export const streamDiffusionStatus = writable<StreamDiffusionState>(StreamDiffusionState.DISCONNECTED);

// Store para controlar si los sliders deben estar bloqueados
export const slidersBlocked = writable<boolean>(false);

// Legacy stores - mantener para compatibilidad
export const lcmLiveStatus = writable('');
export const inferenceBusy = writable(false);
export const streamId = writable<string | null>(null);