<script lang="ts">
  import 'rvfc-polyfill';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { 
    mediaStreamActions, 
    mediaStreamStatus, 
    MediaStreamStatusEnum,
    onFrameChangeStore 
  } from '$lib/mediaStream';
  import { shaderParams, shaderParamsActions, parameterChanged } from '$lib/shaderParams';
  
  const dispatch = createEventDispatcher();
  
  export let isActive = false;
  
  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let fileInput: HTMLInputElement;
  let videoFrameCallbackId: number;
  
  let selectedFile: File | null = null;
  let videoUrl: string = '';
  let volume: number = 1.0;
  let currentTime: number = 0;
  let duration: number = 0;
  let isPlaying: boolean = false;
  let isSeeking: boolean = false;
  let videoIsReady: boolean = false;
  let showShaderParams: boolean = false; // Estado para mostrar/ocultar el desplegable de parámetros
  
  const CANVAS_WIDTH = 512;
  const CANVAS_HEIGHT = 512;
  const THROTTLE = 1000 / 30; // 30 FPS
  
  onMount(() => {
    console.log('FileVideoInput mounted');
  });
  
  // Initialize canvas when it's available
  $: if (canvasElement && !ctx) {
    console.log('Initializing canvas...');
    ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;
    console.log('Canvas initialized:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
  }
  
  onDestroy(() => {
    if (videoFrameCallbackId && videoElement) {
      videoElement.cancelVideoFrameCallback(videoFrameCallbackId);
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  });
  
  let lastMillis = 0;
  
  async function onFrameChange(now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
    if (now - lastMillis < THROTTLE) {
      videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
      return;
    }
    
    if (!ctx || !videoElement || !canvasElement) {
      console.error('Missing required elements for frame capture');
      return;
    }
    
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn('Video dimensions not ready:', videoWidth, 'x', videoHeight);
      videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
      return;
    }
    
    let height0 = videoHeight;
    let width0 = videoWidth;
    let x0 = 0;
    let y0 = 0;
    
    // Center crop to square
    if (videoWidth > videoHeight) {
      width0 = videoHeight;
      x0 = (videoWidth - videoHeight) / 2;
    } else {
      height0 = videoWidth;
      y0 = (videoHeight - videoWidth) / 2;
    }
    
    try {
      ctx.drawImage(videoElement, x0, y0, width0, height0, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvasElement.toBlob(
          (blob) => {
            resolve(blob as Blob);
          },
          'image/jpeg',
          1
        );
      });
      
      onFrameChangeStore.set({ blob });
      lastMillis = now;
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
    
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    console.log('File selected:', file?.name, file?.type);
    
    if (file && file.type.startsWith('video/')) {
      selectedFile = file;
      
      // Revoke previous URL if exists
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      
      videoUrl = URL.createObjectURL(file);
      console.log('Video URL created:', videoUrl);
      
      if (videoElement) {
        videoElement.src = videoUrl;
        videoElement.load();
        console.log('Video element loaded');
      } else {
        console.warn('Video element not available yet');
      }
    } else {
      console.error('Invalid file type:', file?.type);
    }
  }
  
  function handleVideoLoaded() {
    if (videoElement) {
      duration = videoElement.duration;
      videoElement.volume = volume;
      videoIsReady = true;
      console.log('Video loaded - Duration:', duration, 'Dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    }
  }
  
  function handleTimeUpdate() {
    if (videoElement && !isSeeking) {
      currentTime = videoElement.currentTime;
    }
  }
  
  function handleSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const newTime = parseFloat(input.value);
    
    if (videoElement) {
      videoElement.currentTime = newTime;
      currentTime = newTime;
    }
  }
  
  function handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value);
    
    if (videoElement) {
      videoElement.volume = volume;
    }
  }
  
  async function togglePlayPause() {
    if (!videoElement || !selectedFile) {
      console.error('Video element or file not available');
      return;
    }
    
    try {
      if (isPlaying) {
        videoElement.pause();
        isPlaying = false;
        console.log('Video paused');
      } else {
        await videoElement.play();
        isPlaying = true;
        console.log('Video playing');
        
        // Start frame capture
        if (videoIsReady && isActive && ctx) {
          console.log('Starting frame capture...');
          videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
        }
      }
    } catch (error) {
      console.error('Error toggling video playback:', error);
      isPlaying = false;
    }
  }
  
  // Watch for video playing state changes
  $: if (videoElement && isPlaying && videoIsReady && isActive && ctx && !videoFrameCallbackId) {
    console.log('Reactive: Starting frame capture');
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
  }
  
  async function toggleVideoInput() {
    isActive = !isActive;
    console.log('🎬 Toggle video input - isActive:', isActive);
    
    if (isActive) {
      // Stop other media streams first
      await mediaStreamActions.stop();
      
      // IMPORTANT: Set status to CONNECTED after stop() completes
      // This prevents stop() from overwriting our CONNECTED status
      mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
      console.log('✅ Media stream status set to CONNECTED');
      console.log('Current mediaStreamStatus:', MediaStreamStatusEnum.CONNECTED);
      
      dispatch('videoSelected');
      
      // If video is loaded and not playing, start it automatically
      if (selectedFile && videoElement && videoIsReady && !isPlaying) {
        console.log('Auto-starting video playback...');
        try {
          await videoElement.play();
          isPlaying = true;
          console.log('Video auto-started successfully');
          
          // Start frame capture
          if (ctx) {
            videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
            console.log('Frame capture started');
          }
        } catch (error) {
          console.error('Error auto-starting video:', error);
        }
      }
    } else {
      // Stop video playback
      if (videoElement && isPlaying) {
        videoElement.pause();
        isPlaying = false;
        console.log('Video stopped');
      }
      
      // Cancel frame capture
      if (videoFrameCallbackId && videoElement) {
        videoElement.cancelVideoFrameCallback(videoFrameCallbackId);
        videoFrameCallbackId = 0;
        console.log('Frame capture cancelled');
      }
      
      // Set media stream status to disconnected
      mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
      console.log('Media stream status set to DISCONNECTED');
      
      dispatch('videoDeselected');
    }
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Funciones para manejar los parámetros del shader
  function handleParamChange(paramName: string, value: number | boolean) {
    shaderParamsActions.updateParamValue(paramName, value);
    parameterChanged.set(true);
  }
  
  function handleVectorComponentChange(paramName: string, index: number, value: number) {
    shaderParamsActions.updateVectorComponent(paramName, index, value);
    parameterChanged.set(true);
  }
  
  function resetAllParams() {
    shaderParamsActions.resetParams();
    parameterChanged.set(true);
  }
  
  function randomizeParams() {
    shaderParamsActions.randomizeParams();
    parameterChanged.set(true);
  }
</script>

<div class="w-full flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="text-xl">
        🎬
      </div>
      <div class="text-left">
        <div class="font-medium text-secondary">Video File</div>
        <div class="text-sm text-secondary opacity-80">
          {selectedFile ? selectedFile.name : 'No file selected'}
        </div>
      </div>
    </div>
    
    <div class="relative">
      <button 
        class="btn {isActive ? 'btn-primary' : 'btn-secondary'} btn-sm"
        on:click={(e) => {
          e.stopPropagation();
          toggleVideoInput();
        }}
        disabled={!selectedFile}
      >
        {isActive ? 'Selected' : 'Select'}
      </button>
    </div>
  </div>
  
  <div class="mt-2 border-t pt-3">
    <div class="flex flex-col gap-3">
      <!-- File input -->
      <div>
        <label for="video-file-input" class="block text-secondary text-sm mb-1">Select Video File:</label>
        <input
          id="video-file-input"
          type="file"
          accept="video/*"
          bind:this={fileInput}
          on:change={handleFileSelect}
          class="file-input w-full"
        />
      </div>
      
      {#if selectedFile}
          <!-- Video element (hidden, only for playback) -->
          <video
            bind:this={videoElement}
            on:loadedmetadata={handleVideoLoaded}
            on:timeupdate={handleTimeUpdate}
            on:ended={() => {
              isPlaying = false;
            }}
            style="display: none;"
            loop
            playsinline
            muted
            title="Video playback"
          >
            <track kind="captions" />
          </video>
          
          <!-- Canvas for rendering (hidden, used for frame capture) -->
          <canvas bind:this={canvasElement} style="display: none;"></canvas>
          
          <!-- Status indicator -->
          <div class="text-xs text-secondary">
            {#if !videoIsReady}
              ⏳ Loading video...
            {:else if isActive && isPlaying}
              ▶️ Playing - Sending frames to StreamDiffusion
            {:else if isActive}
              ⏸️ Ready - Click Play to start
            {:else}
              ✅ Video loaded - Click Select to activate
            {/if}
          </div>
      {/if}
      
      {#if isActive && selectedFile && videoIsReady}
          
          <!-- Playback controls -->
          <div class="flex flex-col gap-2">
            <!-- Play/Pause button -->
            <button
              class="btn btn-primary btn-sm"
              on:click={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            
            <!-- Timeline -->
            <div class="flex flex-col gap-1">
              <label for="video-timeline" class="text-secondary text-xs">Timeline:</label>
              <input
                id="video-timeline"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                on:input={handleSeek}
                on:mousedown={() => isSeeking = true}
                on:mouseup={() => isSeeking = false}
                class="slider"
              />
              <div class="flex justify-between text-xs text-secondary">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <!-- Volume control -->
            <div class="flex flex-col gap-1">
              <label for="video-volume" class="text-secondary text-xs">Volume: {Math.round(volume * 100)}%</label>
              <input
                id="video-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                on:input={handleVolumeChange}
                class="slider"
              />
            </div>
            
            <!-- Shader Parameters Dropdown with arrow only -->
            {#if $shaderParams && $shaderParams.length > 0}
              <div class="mt-4 border-t pt-4">
                <button 
                  class="w-full flex justify-between items-center py-2 px-3 bg-primary rounded-md hover:bg-opacity-90 transition-colors"
                  on:click={(e) => {
                    e.stopPropagation();
                    showShaderParams = !showShaderParams;
                  }}
                >
                  <span class="font-medium text-secondary">Shader Parameters</span>
                  <span class="text-secondary arrow-icon {showShaderParams ? 'arrow-up' : 'arrow-down'}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </button>
                
                {#if showShaderParams}
                  <div class="mt-2 p-2 rounded-md bg-primary">
                    <div class="mb-2 flex justify-between items-center">
                      <span class="text-secondary text-xs">{$shaderParams.length} params</span>
                      <div class="flex gap-1">
                        <button 
                          class="btn btn-xs btn-primary"
                          on:click={(e) => {
                            e.stopPropagation();
                            randomizeParams();
                          }}
                          title="Randomize all parameters"
                        >
                          RDM
                        </button>
                        <button 
                          class="btn btn-xs btn-secondary"
                          on:click={(e) => {
                            e.stopPropagation();
                            resetAllParams();
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {#each $shaderParams as param (param.name)}
                        <!-- Shader parameter (compact version) -->
                        <div class="shader-param mb-2">
                          <div class="flex justify-between items-center mb-0.5">
                            <label class="text-secondary text-xs" for="param-{param.name}">
                              {param.label}
                            </label>
                            <span class="text-secondary text-xs">
                              {#if param.type === 'bool'}
                                {param.value ? 'On' : 'Off'}
                              {:else if typeof param.value === 'number'}
                                {param.value.toFixed(2)}
                              {/if}
                            </span>
                          </div>
                          
                          {#if param.type === 'bool'}
                            <!-- Checkbox for booleans -->
                            <div class="flex items-center">
                              <input
                                type="checkbox"
                                id="param-{param.name}"
                                checked={Boolean(param.value)}
                                on:change={(e) => {
                                  e.stopPropagation();
                                  const target = e.currentTarget;
                                  handleParamChange(param.name, target.checked);
                                }}
                                class="checkbox checkbox-xs"
                              />
                            </div>
                          {:else if ['vec2', 'vec3', 'vec4'].includes(param.type) && Array.isArray(param.value)}
                            <!-- Compact vector components -->
                            <div class="flex gap-1 mb-1">
                              {#each param.value as component, i}
                                <div class="flex-1">
                                  <input
                                    type="range"
                                    id="param-{param.name}-{i}"
                                    min={param.min}
                                    max={param.max}
                                    step={param.step}
                                    value={component}
                                    on:input={(e) => {
                                      e.stopPropagation();
                                      const target = e.currentTarget;
                                      handleVectorComponentChange(param.name, i, parseFloat(target.value));
                                    }}
                                    class="slider slider-xs"
                                  />
                                </div>
                              {/each}
                            </div>
                          {:else}
                            <!-- Slider for float or int -->
                            <input
                              type="range"
                              id="param-{param.name}"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={Number(param.value)}
                              on:input={(e) => {
                                e.stopPropagation();
                                const target = e.currentTarget;
                                handleParamChange(param.name, param.type === 'int' ? parseInt(target.value) : parseFloat(target.value));
                              }}
                              class="slider slider-xs"
                            />
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
    </div>
  </div>
</div>

<style>
  .file-input {
    font-size: 0.875rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.375rem;
    background-color: var(--bg-primary, #ffffff);
    color: var(--text-secondary, #374151);
  }
  
  .file-input:hover {
    border-color: var(--border-hover, #d1d5db);
  }
  
  .file-input:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  /* Estilos para el desplegable de parámetros */
  .shader-param {
    margin-bottom: 0.5rem;
  }
  
  /* Animación para la flecha del desplegable */
  .arrow-icon svg {
    transition: transform 0.2s ease-in-out;
  }
  
  .arrow-up svg {
    transform: rotate(180deg);
  }
  
  /* Mejora de los sliders */
  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--bg-secondary, #e5e7eb);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .slider-xs {
    height: 4px;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    cursor: pointer;
    border: none;
  }
  
  .slider-xs::-webkit-slider-thumb {
    width: 10px;
    height: 10px;
  }
  
  .slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    cursor: pointer;
    border: none;
  }
  
  .slider-xs::-moz-range-thumb {
    width: 10px;
    height: 10px;
  }
  
  /* Checkbox más pequeño */
  .checkbox-xs {
    width: 14px;
    height: 14px;
  }
</style>
