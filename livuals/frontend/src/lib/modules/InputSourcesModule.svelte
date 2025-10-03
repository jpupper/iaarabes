<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import CamInput from './InputSources/CamInput.svelte';
  import ShareInput from './InputSources/ShareInput.svelte';
  import GenerativeInput from './InputSources/GenerativeInput.svelte';
  import FileVideoInput from './InputSources/FileVideoInput.svelte';
  import { mediaDevices, mediaStreamActions } from '$lib/mediaStream';
  import { generativePatternActions, AVAILABLE_SHADERS, selectedShader } from '$lib/generativePattern';

  type InputSource = {
    id: string;
    name: string;
    resolution: string;
    fps: string;
    type: 'camera' | 'screen' | 'generative' | 'video';
    description: string;
  };

  let selectedSourceId: string | null = null;
  let isScreenActive = false;
  let isGenerativeActive = false;
  let isVideoActive = false;
  
  // Auto-select Generative Pattern on mount with pattern_mixer shader
  onMount(async () => {
    // Use setTimeout to ensure this runs after all child components have mounted
    setTimeout(async () => {
      // First load shaders if not loaded
      const availableShaders = get(AVAILABLE_SHADERS);
      if (availableShaders.length === 0) {
        await generativePatternActions.loadShaders();
      }
      
      // Try to select pattern_mixer shader specifically
      const shaders = get(AVAILABLE_SHADERS);
      const patternMixer = shaders.find(s => s.id === 'pattern_mixer' || s.id === 'pattern_mixer_v2');
      
      if (patternMixer) {
        console.log('Selecting pattern_mixer shader by default:', patternMixer);
        await generativePatternActions.selectShader(patternMixer.id);
      }
      
      // Then activate generative pattern
      handleGenerativeSelected();
    }, 100);
  });
  
  function handleCameraSelected(event: CustomEvent<{deviceId: string}>) {
    selectedSourceId = event.detail.deviceId;
    
    // Deactivate screen if active
    if (isScreenActive) {
      isScreenActive = false;
    }
    
    // Stop generative pattern if active
    if (isGenerativeActive) {
      isGenerativeActive = false;
      generativePatternActions.stop();
      console.log('Generative pattern deactivated from camera selection');
    }
    
    // Stop video if active
    if (isVideoActive) {
      isVideoActive = false;
    }
    
    // Ensure camera is active
    mediaStreamActions.start(event.detail.deviceId);
  }
  
  function handleCameraDeselected() {
    if (selectedSourceId !== 'screen') {
      selectedSourceId = null;
    }
  }
  
  function handleScreenSelected() {
    // Only proceed if not already active to avoid multiple dialog prompts
    if (!isScreenActive) {
      selectedSourceId = 'screen';
      isScreenActive = true;
      
      // Stop generative pattern if active
      if (isGenerativeActive) {
        isGenerativeActive = false;
        generativePatternActions.stop();
        console.log('Generative pattern deactivated from screen selection');
      }
      
      // Stop video if active
      if (isVideoActive) {
        isVideoActive = false;
      }
      
      // Start screen capture automatically
      mediaStreamActions.startScreenCapture();
    }
  }
  
  function handleScreenDeselected() {
    if (selectedSourceId === 'screen') {
      selectedSourceId = null;
      isScreenActive = false;
    }
  }

  function handleGenerativeSelected() {
    selectedSourceId = 'generative';
    isGenerativeActive = true;
    isScreenActive = false;
    isVideoActive = false;
    // Ensure we're properly activating the generative pattern
    console.log('Generative pattern selected');
    
    // Start the generative pattern
    generativePatternActions.start();
    
    // Check if a shader is already selected, if not select the first available one
    const currentShader = get(selectedShader);
    const availableShaders = get(AVAILABLE_SHADERS);
    
    if ((!currentShader || !currentShader.id) && availableShaders.length > 0) {
      console.log('No shader selected, selecting the first available one:', availableShaders[0]);
      generativePatternActions.selectShader(availableShaders[0].id);
    } else if (currentShader && currentShader.id) {
      // If a shader is already selected, reload it to ensure parameters are loaded
      console.log('Reloading current shader:', currentShader);
      generativePatternActions.loadShaderSource(currentShader.id);
    } else if (availableShaders.length === 0) {
      // If no shaders are available, load them first
      console.log('No shaders available, loading shaders...');
      generativePatternActions.loadShaders().then(() => {
        const newAvailableShaders = get(AVAILABLE_SHADERS);
        if (newAvailableShaders.length > 0) {
          console.log('Shaders loaded, selecting the first one:', newAvailableShaders[0]);
          generativePatternActions.selectShader(newAvailableShaders[0].id);
        }
      });
    }
  }

  function handleGenerativeDeselected() {
    if (selectedSourceId === 'generative') {
      selectedSourceId = null;
      isGenerativeActive = false;
    }
  }

  function handleVideoSelected() {
    selectedSourceId = 'video';
    isVideoActive = true;
    isScreenActive = false;
    isGenerativeActive = false;
    
    // Stop other media streams
    mediaStreamActions.stop();
    generativePatternActions.stop();
    
    console.log('Video file selected');
  }
  
  function handleVideoDeselected() {
    if (selectedSourceId === 'video') {
      selectedSourceId = null;
      isVideoActive = false;
    }
  }
  
  function handleFrameCapture(event: CustomEvent<{imageData: string}>) {
    // Process captured image from generative shader
    // and send it to the processing system
    if (isGenerativeActive && event.detail && event.detail.imageData) {
      const imageData = event.detail.imageData;
      // Here we could send the image to the processing system
      // or emit an event for the parent component to handle
    }
  }


  export function getSelectedSource() {
    if (selectedSourceId === 'screen') {
      return {
        id: 'screen',
        name: 'Screen Share',
        resolution: 'Desktop',
        fps: '60fps',
        type: 'screen' as const,
        description: 'Share your screen'
      };
    } else if (selectedSourceId === 'generative') {
      return {
        id: 'generative',
        name: 'Generative Pattern',
        resolution: '1280x720',
        fps: '60fps',
        type: 'generative' as const,
        description: 'Shader-based generative pattern'
      };
    } else if (selectedSourceId === 'video') {
      return {
        id: 'video',
        name: 'Video File',
        resolution: '1280x720',
        fps: '30fps',
        type: 'video' as const,
        description: 'Video file playback'
      };
    } else if (selectedSourceId) {
      return {
        id: selectedSourceId,
        name: 'Camera',
        resolution: '1920x1080',
        fps: '30fps',
        type: 'camera' as const,
        description: 'Camera'
      };
    }
    return null;
  }
</script>

<div class="module-container">
  <div class="flex justify-between items-center mb-4">
    <h2 class="title mb-0">Input Sources</h2>
    <div class="text-secondary text-sm flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Click on a card to select that source
    </div>
  </div>

  <div class="space-y-4">
    <!-- Generative Pattern - First position -->
    <div 
      class="input-source-card card {selectedSourceId === 'generative' ? 'active' : ''}"
      on:click={() => {
        // Always try to select the generative pattern, even if already selected
        handleGenerativeSelected();
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Always try to select the generative pattern, even if already selected
          handleGenerativeSelected();
        }
      }}
    >
      <GenerativeInput 
        isActive={isGenerativeActive}
        on:generativeSelected={handleGenerativeSelected}
        on:generativeDeselected={handleGenerativeDeselected}
        on:frameCapture={handleFrameCapture}
      />
    </div>

    <!-- Camera component with dropdown -->
    <div 
      class="input-source-card card {selectedSourceId && selectedSourceId !== 'screen' && selectedSourceId !== 'generative' && selectedSourceId !== 'video' ? 'active' : ''}"
      on:click={() => {
        // Always try to select the camera, even if another input is selected
        const cameras = $mediaDevices || [];
        if (cameras.length > 0) {
          handleCameraSelected(new CustomEvent('cameraSelected', { detail: { deviceId: cameras[0].deviceId } }));
        } else {
          console.log('No cameras available');
        }
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Always try to select the camera, even if another input is selected
          const cameras = $mediaDevices || [];
          if (cameras.length > 0) {
            handleCameraSelected(new CustomEvent('cameraSelected', { detail: { deviceId: cameras[0].deviceId } }));
          } else {
            console.log('No cameras available');
          }
        }
      }}
    >
      <CamInput 
        selectedDeviceId={selectedSourceId !== 'screen' && selectedSourceId !== 'generative' && selectedSourceId !== 'video' ? selectedSourceId : null}
        on:cameraSelected={handleCameraSelected}
        on:cameraDeselected={handleCameraDeselected}
      />
    </div>

    <div 
      class="input-source-card card {selectedSourceId === 'screen' ? 'active' : ''}"
      on:click={() => {
        // Always try to select the screen, even if already selected
        handleScreenSelected();
      }}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Always try to select the screen, even if already selected
          handleScreenSelected();
        }
      }}
    >
      <ShareInput 
        isActive={isScreenActive}
        on:screenDeselected={handleScreenDeselected}
      />
    </div>

    <div 
      class="input-source-card card {selectedSourceId === 'video' ? 'active' : ''}"
    >
      <FileVideoInput 
        isActive={isVideoActive}
        on:videoSelected={handleVideoSelected}
        on:videoDeselected={handleVideoDeselected}
      />
    </div>
  </div>
</div>
