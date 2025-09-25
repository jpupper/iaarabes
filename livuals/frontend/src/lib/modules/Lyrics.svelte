<script lang="ts">
  import { onMount } from 'svelte';
  import { pipelineValues } from '$lib/store';
  import { get } from 'svelte/store';

  type Track = { id: string; file: string; artist: string; title: string; url: string };
  type Cue = { t: number; text: string };

  let tracks: Track[] = [];
  let current: Track | null = null;
  let cues: Cue[] = [];
  let currentLine = '';
  let previewPrompt = '';
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

  // ------------------ Promptify (convert lyric -> visual prompt) ------------------
  let enablePromptify = true;
  let mode: 'replace' | 'append' = 'replace';
  let stylePreset: 'cinematic' | 'digital-art' | 'anime' | 'watercolor' | 'cyberpunk' | 'surreal' = 'cinematic';
  let extraSuffix = 'highly detailed, cinematic lighting, dramatic composition, ultra realistic, 8k';

  const styleMap: Record<string, string> = {
    cinematic: 'a cinematic photograph',
    'digital-art': 'a detailed digital illustration',
    anime: 'an anime style illustration',
    watercolor: 'a watercolor painting',
    cyberpunk: 'a neon-lit cyberpunk scene',
    surreal: 'a dreamlike surreal depiction'
  };

  function detectMood(line: string): string[] {
    const l = line.toLowerCase();
    const tokens: string[] = [];
    if (/(night|midnight|moon|stars)/.test(l)) tokens.push('night scene', 'soft rim light');
    if (/(rain|storm|tears|wet)/.test(l)) tokens.push('rain, wet surfaces, reflections');
    if (/(fire|burn|flame)/.test(l)) tokens.push('warm glow, embers, particle sparks');
    if (/(ocean|sea|wave)/.test(l)) tokens.push('ocean mist, wide angle');
    if (/(city|street|neon|traffic)/.test(l)) tokens.push('urban street, neon lights');
    if (/(love|heart|kiss|hold)/.test(l)) tokens.push('warm tones, soft focus');
    if (/(lonely|alone|lost|empty)/.test(l)) tokens.push('moody, low key lighting');
    return tokens;
  }

  function normalizeSubject(text: string): string {
    // Reemplazar pronombres por sujetos visuales neutros
    let t = ' ' + text + ' ';
    t = t.replace(/\b(I|me|my|mine)\b/gi, ' a person ');
    t = t.replace(/\b(you|your|yours)\b/gi, ' a person ');
    t = t.replace(/\b(we|us|our|ours)\b/gi, ' people ');
    t = t.replace(/\b(they|them|their|theirs)\b/gi, ' people ');
    t = t.replace(/\b(he|him|his)\b/gi, ' a man ');
    t = t.replace(/\b(she|her|hers)\b/gi, ' a woman ');
    return t.trim().replace(/\s+/g, ' ');
  }

  function promptify(line: string): string {
    const base = line.replace(/[\[\](){}<>"'`]+/g, '').trim();
    const subject = normalizeSubject(base);
    const mood = detectMood(base).join(', ');
    const style = styleMap[stylePreset] ?? 'a detailed illustration';
    const parts = [
      `${style} of ${subject}`,
      extraSuffix
    ];
    if (mood) parts.push(mood);
    return parts.filter(Boolean).join(', ');
  }

  function applyPrompt(line: string) {
    const built = enablePromptify ? promptify(line) : line;
    previewPrompt = built;
    if (mode === 'replace') {
      pipelineValues.update((v) => ({ ...v, prompt: built }));
    } else {
      const current = get(pipelineValues)?.prompt ?? '';
      const sep = current && !/[,.;]$/.test(current.trim()) ? ', ' : ' ';
      const next = current ? `${current}${sep}${built}` : built;
      pipelineValues.update((v) => ({ ...v, prompt: next }));
    }
  }

  $: if (currentLine) {
    applyPrompt(currentLine);
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

<div class="flex flex-col gap-4 w-full">
  <h2 class="title">Lyrics & Prompts</h2>

  <div class="flex flex-col gap-4">
    {#if errorMsg}
      <div class="p-3 rounded-md" style="color: #ef4444; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444;">{errorMsg}</div>
    {/if}

    <div class="flex flex-col gap-3">
      <h3 class="subtitle">Available Tracks</h3>
      <ul class="space-y-2 max-h-48 overflow-auto p-2 rounded-lg" style="background-color: rgba(31, 41, 55, 0.5);">
        {#each tracks as t}
          <li class="flex items-center gap-3">
            <button class="btn btn-primary btn-sm" 
              on:click={() => selectTrack(t)}>Play</button>
            <span class="text-secondary">{t.artist ? `${t.artist} — ${t.title}` : t.title}</span>
          </li>
        {/each}
        {#if tracks.length === 0}
          <li class="text-secondary p-2">No hay audios en /audio</li>
        {/if}
      </ul>

      <audio bind:this={audioEl} on:timeupdate={onTimeUpdate} on:loadedmetadata={onLoadedMetadata} 
        controls class="w-full" />
      
      <div class="p-3 rounded-lg" style="background-color: rgba(31, 41, 55, 0.5);">
        <span class="text-secondary">Línea actual:</span> <span class="text-secondary font-medium">{currentLine || '—'}</span>
      </div>
    </div>

    <div class="flex flex-col gap-3 pt-4 border-t" style="border-color: #4b5563;">
      <h3 class="subtitle">Prompt Settings</h3>
      
      <div class="flex items-center gap-4 flex-wrap">
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox" bind:checked={enablePromptify} />
          <span class="text-secondary font-medium">Convertir a prompt visual</span>
        </label>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2">
            <input type="radio" class="radio" name="mode" value="replace" bind:group={mode} />
            <span class="text-secondary">Reemplazar</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" class="radio" name="mode" value="append" bind:group={mode} />
            <span class="text-secondary">Agregar</span>
          </label>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label for="style-select" class="text-secondary font-medium">Estilo:</label>
        <select id="style-select" class="select" 
          bind:value={stylePreset} on:change={() => currentLine && applyPrompt(currentLine)}>
          <option value="cinematic">Cinematic photo</option>
          <option value="digital-art">Digital art</option>
          <option value="anime">Anime</option>
          <option value="watercolor">Watercolor</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="surreal">Surreal</option>
        </select>
        <label for="suffix-input" class="sr-only">Sufijo de calidad</label>
        <input id="suffix-input" class="input flex-1" 
          placeholder="Sufijo de calidad (extra)" bind:value={extraSuffix} 
          on:change={() => currentLine && applyPrompt(currentLine)} />
      </div>

      <div class="p-3 rounded-lg" style="background-color: rgba(31, 41, 55, 0.5);">
        <span class="text-secondary">Preview prompt:</span> <span class="text-secondary font-medium">{previewPrompt || (enablePromptify ? '—' : currentLine || '—')}</span>
      </div>
    </div>
  </div>
</div>

<style>
</style>
