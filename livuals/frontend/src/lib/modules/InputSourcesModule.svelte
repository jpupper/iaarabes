<script lang="ts">
  import { onMount } from 'svelte';
  import CamInput from './InputSources/CamInput.svelte';
  import ShareInput from './InputSources/ShareInput.svelte';
  import IframeInput from './InputSources/IframeInput.svelte';
  import YoutubeInput from './InputSources/YoutubeInput.svelte';
  import { selectedInputSource, updateSelectedInputSource, type InputSource, type InputSourceType } from '$lib/store';

  let selectedSourceId: string | null = null;
  let isScreenActive = false;
  let isIframeActive = false;
  let isYoutubeActive = false;
  let iframeUrl = '';
  let youtubeUrl = '';
  let youtubeEmbedUrl = '';
  
  function handleCameraSelected(event: CustomEvent<{deviceId: string}>) {
    deactivateAllExcept('camera');
    selectedSourceId = event.detail.deviceId;
  }
  
  function handleCameraDeselected() {
    if (selectedSourceId !== 'screen') {
      selectedSourceId = null;
    }
  }
  
  function handleScreenSelected() {
    deactivateAllExcept('screen');
    selectedSourceId = 'screen';
    isScreenActive = true;
  }
  
  function handleScreenDeselected() {
    if (selectedSourceId === 'screen') {
      selectedSourceId = null;
      isScreenActive = false;
    }
  }
  
  function handleIframeSelected(event: CustomEvent<{url: string}>) {
    deactivateAllExcept('iframe');
    selectedSourceId = 'iframe';
    isIframeActive = true;
    iframeUrl = event.detail.url;
  }
  
  function handleIframeDeselected() {
    if (selectedSourceId === 'iframe') {
      selectedSourceId = null;
      isIframeActive = false;
    }
  }
  
  function handleYoutubeSelected(event: CustomEvent<{url: string, embedUrl: string}>) {
    deactivateAllExcept('youtube');
    selectedSourceId = 'youtube';
    isYoutubeActive = true;
    youtubeUrl = event.detail.url;
    youtubeEmbedUrl = event.detail.embedUrl;
  }
  
  function handleYoutubeDeselected() {
    if (selectedSourceId === 'youtube') {
      selectedSourceId = null;
      isYoutubeActive = false;
    }
  }
  
  function deactivateAllExcept(sourceType: string) {
    if (sourceType !== 'camera' && selectedSourceId && selectedSourceId !== 'screen' && selectedSourceId !== 'iframe' && selectedSourceId !== 'youtube') {
      handleCameraDeselected();
    }
    if (sourceType !== 'screen' && isScreenActive) {
      handleScreenDeselected();
    }
    if (sourceType !== 'iframe' && isIframeActive) {
      handleIframeDeselected();
    }
    if (sourceType !== 'youtube' && isYoutubeActive) {
      handleYoutubeDeselected();
    }
  }

  $: {
    if (selectedSourceId) {
      const source = getSelectedSource();
      if (source) {
        updateSelectedInputSource(source);
      }
    } else {
      updateSelectedInputSource(null);
    }
  }
  
  function getSelectedSource() {
    if (selectedSourceId === 'screen') {
      return {
        id: 'screen',
        name: 'Screen Share',
        resolution: 'Desktop',
        fps: '60fps',
        type: 'screen' as const,
        description: 'Share your screen'
      };
    } else if (selectedSourceId === 'iframe') {
      return {
        id: 'iframe',
        name: 'Iframe',
        resolution: 'Variable',
        fps: '30fps',
        type: 'iframe' as const,
        description: 'Web content',
        url: iframeUrl
      };
    } else if (selectedSourceId === 'youtube') {
      return {
        id: 'youtube',
        name: 'YouTube',
        resolution: 'Variable',
        fps: '30fps',
        type: 'youtube' as const,
        description: 'YouTube video',
        url: youtubeEmbedUrl
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

<div class="bg-white border border-gray-200 rounded-lg p-4">

  <div class="space-y-4">
    <!-- Componente de cámara con dropdown -->
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId && selectedSourceId !== 'screen' && selectedSourceId !== 'iframe' && selectedSourceId !== 'youtube' ? 'border-green-500 bg-green-50' : ''}">
      <CamInput 
        selectedDeviceId={selectedSourceId !== 'screen' && selectedSourceId !== 'iframe' && selectedSourceId !== 'youtube' ? selectedSourceId : null}
        on:cameraSelected={handleCameraSelected}
        on:cameraDeselected={handleCameraDeselected}
      />
    </div>

    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'screen' ? 'border-green-500 bg-green-50' : ''}">
      <ShareInput 
        isActive={isScreenActive}
        on:screenSelected={handleScreenSelected}
        on:screenDeselected={handleScreenDeselected}
      />
    </div>
    
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'iframe' ? 'border-green-500 bg-green-50' : ''}">
      <IframeInput 
        isActive={isIframeActive}
        iframeUrl={iframeUrl}
        on:iframeSelected={handleIframeSelected}
        on:iframeDeselected={handleIframeDeselected}
      />
    </div>
    
    <div class="border border-gray-200 rounded-lg p-4 {selectedSourceId === 'youtube' ? 'border-green-500 bg-green-50' : ''}">
      <YoutubeInput 
        isActive={isYoutubeActive}
        youtubeUrl={youtubeUrl}
        on:youtubeSelected={handleYoutubeSelected}
        on:youtubeDeselected={handleYoutubeDeselected}
      />
    </div>
  </div>
</div>
