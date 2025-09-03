<script lang="ts">
  import { onMount } from 'svelte';
  import { pipelineValues } from '$lib/store';

  type Track = { id: string; file: string; artist: string; title: string; url: string };
  type Cue = { t: number; text: string };

  let tracks: Track[] = [];
  let current: Track | null = null;
  let cues: Cue[] = [];
  let currentLine = '';
  let audioEl: HTMLAudioElement;
  let loading = false;
  let errorMsg = '';

  onMount(async () => {
    try {
      const res = await fetch('/api/audio/list');
      tracks = res.ok ? await res.json() : [];
    } catch (e) {
      errorMsg = 'No se pudo listar audios';
    }
  });

  $: if (currentLine) {
    pipelineValues.update((v) => ({ ...v, prompt: currentLine }));
  }

  function parseLRC(lrc: string): Cue[] {
    const out: Cue[] = [];
    const lines = (lrc || '').split(/\r?\n/);
    for (const raw of lines) {
      if (!raw) continue;
      const timeTags = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
      if (timeTags.length === 0) continue;
      const text = raw.replace(/\[[^\]]+\]/g, '').trim();
      for (const m of timeTags) {
        const mm = Number(m[1]);
        const ss = Number(m[2]);
        const frac = m[3] ? Number(m[3]) : 0;
        const denom = m[3] ? (m[3].length === 1 ? 10 : m[3].length === 2 ? 100 : 1000) : 1;
        const t = mm * 60 + ss + (frac / denom);
        out.push({ t, text });
      }
    }
    out.sort((a, b) => a.t - b.t);
    return out;
  }

  async function selectTrack(t: Track) {
    errorMsg = '';
    current = t;
    currentLine = '';
    cues = [];
    try {
      loading = true;
      // cargar audio y esperar metadata para calcular duración exacta
      if (audioEl) {
        audioEl.src = t.url;
        await audioEl.play();
      }
    } catch (e) {
      // ignore
    } finally {
      loading = false;
    }
  }

  async function onLoadedMetadata() {
    if (!current) return;
    try {
      const params = new URLSearchParams();
      if (current.artist) params.set('artist', current.artist);
      if (current.title) params.set('track', current.title);
      if (audioEl && isFinite(audioEl.duration)) params.set('duration', String(Math.round(audioEl.duration)));
      const res = await fetch(`/api/lyrics?${params.toString()}`);
      const data = res.ok ? await res.json() : { lrc: '' };
      cues = data?.lrc ? parseLRC(data.lrc) : [];
    } catch (e) {
      errorMsg = 'No se pudieron obtener las letras';
    }
  }

  function onTimeUpdate() {
    if (!audioEl || cues.length === 0) return;
    const t = audioEl.currentTime;
    // búsqueda binaria del último cue <= t
    let lo = 0, hi = cues.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].t <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    if (idx >= 0 && cues[idx].text !== currentLine) {
      currentLine = cues[idx].text;
    }
  }
</script>

<div class="flex flex-col gap-2 border border-gray-300 dark:border-gray-700 rounded-md p-3">
  <h3 class="text-base font-semibold">Lyrics</h3>
  {#if errorMsg}
    <div class="text-sm text-red-600">{errorMsg}</div>
  {/if}
  <ul class="space-y-1 max-h-48 overflow-auto">
    {#each tracks as t}
      <li class="flex items-center gap-2">
        <button class="px-2 py-1 text-xs border rounded" on:click={() => selectTrack(t)}>Play</button>
        <span class="text-sm">{t.artist ? `${t.artist} — ${t.title}` : t.title}</span>
      </li>
    {/each}
    {#if tracks.length === 0}
      <li class="text-sm opacity-70">No hay audios en /audio</li>
    {/if}
  </ul>
  <audio bind:this={audioEl} on:timeupdate={onTimeUpdate} on:loadedmetadata={onLoadedMetadata} controls style="width: 100%" />
  <div class="text-sm opacity-80">Línea actual: {currentLine || '—'}</div>
</div>

<style>
</style>

