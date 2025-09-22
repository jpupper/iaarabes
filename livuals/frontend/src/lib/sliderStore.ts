import { writable } from 'svelte/store';

// Store para controlar si los sliders de width y height deben estar bloqueados
export const widthHeightSlidersLocked = writable<boolean>(false);
