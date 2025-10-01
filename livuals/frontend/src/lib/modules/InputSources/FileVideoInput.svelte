<script lang="ts">
  import 'rvfc-polyfill';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { 
    mediaStreamActions, 
    mediaStreamStatus, 
    MediaStreamStatusEnum,
    onFrameChangeStore 
  } from '$lib/mediaStream';
  
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
    console.log('Toggle video input - isActive:', isActive);
    
    if (isActive) {
      // Stop other media streams
      mediaStreamActions.stop();
      
      // Set media stream status to connected for video file
      mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
      console.log('Media stream status set to CONNECTED');
      
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
  
  {#if isActive}
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
            class="hidden"
            loop
            playsinline
            muted
            title="Video playback"
          >
            <track kind="captions" />
          </video>
          
          <!-- Canvas for rendering (hidden, used for frame capture) -->
          <canvas bind:this={canvasElement} class="hidden"></canvas>
          
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
          </div>
        {/if}
      </div>
    </div>
  {/if}
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
</style>
