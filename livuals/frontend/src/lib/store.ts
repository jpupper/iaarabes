
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