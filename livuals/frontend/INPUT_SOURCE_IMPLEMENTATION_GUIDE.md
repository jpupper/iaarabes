# Input Source Implementation Guide

This guide explains how to properly implement a new input source in the Livuals system and connect it to the StreamDiffusion pipeline.

## System Architecture

The Livuals system uses a centralized frame delivery system where all input sources send their frames through the `onFrameChangeStore`. This store is monitored by StreamDiffusion to process frames in real-time.

```
Input Source → onFrameChangeStore → StreamDiffusion → Output
```

## Key Files and Their Roles

### 1. **`mediaStream.ts`** - Central State Management
Location: `frontend/src/lib/mediaStream.ts`

**Purpose:** Manages the global state for media streams and frame delivery.

**Key exports:**
- `onFrameChangeStore`: Store that holds the current frame as a Blob
- `mediaStreamStatus`: Store indicating connection status (INIT, CONNECTED, DISCONNECTED)
- `mediaStream`: Store holding the MediaStream object (for camera/screen)
- `mediaStreamActions`: Actions to control media streams

**Critical for:** All input sources must update `onFrameChangeStore` with frames and `mediaStreamStatus` with their connection state.

### 2. **`InputSourcesModule.svelte`** - Input Source Manager
Location: `frontend/src/lib/modules/InputSourcesModule.svelte`

**Purpose:** Manages the selection and coordination of different input sources.

**Responsibilities:**
- Displays all available input sources as cards
- Handles exclusive selection (only one source active at a time)
- Coordinates state between different input components
- Stops other sources when a new one is selected

**Key state variables:**
- `selectedSourceId`: ID of the currently selected source
- `isScreenActive`: Boolean for screen share state
- `isGenerativeActive`: Boolean for generative pattern state
- `isVideoActive`: Boolean for video file state (add for new sources)

### 3. **`StreamOutput.svelte`** - Preview Display
Location: `frontend/src/lib/modules/StreamOutput.svelte`

**Purpose:** Displays the input preview based on the active source.

**Logic:**
```svelte
{#if $generativePatternStatus === GenerativePatternStatusEnum.ACTIVE}
  <GenerativeShader />
{:else if $mediaStreamStatus === MediaStreamStatusEnum.CONNECTED}
  <VideoInput />
{:else}
  <NoInputMessage />
{/if}
```

**Note:** The preview automatically shows when `mediaStreamStatus` is CONNECTED.

## Implementation Steps

### Step 1: Create Your Input Component

Create a new file in `frontend/src/lib/modules/InputSources/YourInput.svelte`

**Required imports:**
```typescript
import 'rvfc-polyfill'; // Required for requestVideoFrameCallback
import { createEventDispatcher, onMount, onDestroy } from 'svelte';
import { 
  mediaStreamActions, 
  mediaStreamStatus, 
  MediaStreamStatusEnum,
  onFrameChangeStore 
} from '$lib/mediaStream';
```

**Required exports:**
```typescript
export let isActive = false; // Controlled by parent
```

**Required events:**
```typescript
const dispatch = createEventDispatcher();
// Dispatch when source is selected
dispatch('yourSourceSelected');
// Dispatch when source is deselected
dispatch('yourSourceDeselected');
```

### Step 2: Implement Frame Capture

**For video-based sources (camera, video file, screen):**

Use `requestVideoFrameCallback` for efficient frame capture:

```typescript
let videoElement: HTMLVideoElement;
let canvasElement: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let videoFrameCallbackId: number;

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
const THROTTLE = 1000 / 30; // 30 FPS
let lastMillis = 0;

async function onFrameChange(now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
  if (now - lastMillis < THROTTLE) {
    videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
    return;
  }
  
  // Draw video frame to canvas (with center crop to square)
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;
  let width0 = videoWidth;
  let height0 = videoHeight;
  let x0 = 0;
  let y0 = 0;
  
  if (videoWidth > videoHeight) {
    width0 = videoHeight;
    x0 = (videoWidth - videoHeight) / 2;
  } else {
    height0 = videoWidth;
    y0 = (videoHeight - videoWidth) / 2;
  }
  
  ctx.drawImage(videoElement, x0, y0, width0, height0, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvasElement.toBlob(
      (blob) => resolve(blob as Blob),
      'image/jpeg',
      1
    );
  });
  
  // Send frame to StreamDiffusion
  onFrameChangeStore.set({ blob });
  
  // Request next frame
  videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
  lastMillis = now;
}

// Start capture when ready
$: if (videoIsReady && isPlaying && videoElement && isActive) {
  videoFrameCallbackId = videoElement.requestVideoFrameCallback(onFrameChange);
}

// Cleanup
onDestroy(() => {
  if (videoFrameCallbackId && videoElement) {
    videoElement.cancelVideoFrameCallback(videoFrameCallbackId);
  }
});
```

**For canvas-based sources (generative patterns):**

Use `requestAnimationFrame` for rendering:

```typescript
let canvasElement: HTMLCanvasElement;
let animationFrameId: number;

function render() {
  // Draw your pattern to canvas
  // ...
  
  // Convert to blob and send
  canvasElement.toBlob((blob) => {
    if (blob) {
      generativeFrameStore.set({ blob });
    }
  }, 'image/jpeg', 1);
  
  animationFrameId = requestAnimationFrame(render);
}

// Start/stop based on active state
$: if (isActive) {
  render();
} else {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}
```

### Step 3: Update MediaStream Status

**When source becomes active:**
```typescript
mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
```

**When source becomes inactive:**
```typescript
mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
```

**Important:** This status controls the preview display in `StreamOutput.svelte`.

### Step 4: Integrate into InputSourcesModule

**4.1. Import your component:**
```typescript
import YourInput from './InputSources/YourInput.svelte';
```

**4.2. Add state variable:**
```typescript
let isYourSourceActive = false;
```

**4.3. Update type definition:**
```typescript
type InputSource = {
  id: string;
  name: string;
  resolution: string;
  fps: string;
  type: 'camera' | 'screen' | 'generative' | 'video' | 'yourSource'; // Add your type
  description: string;
};
```

**4.4. Create handler functions:**
```typescript
function handleYourSourceSelected() {
  selectedSourceId = 'yourSource';
  isYourSourceActive = true;
  
  // Deactivate other sources
  isScreenActive = false;
  isGenerativeActive = false;
  isVideoActive = false;
  
  // Stop other media streams
  mediaStreamActions.stop();
  generativePatternActions.stop();
  
  console.log('Your source selected');
}

function handleYourSourceDeselected() {
  if (selectedSourceId === 'yourSource') {
    selectedSourceId = null;
    isYourSourceActive = false;
  }
}
```

**4.5. Deactivate your source when others are selected:**

Add to each other handler:
```typescript
if (isYourSourceActive) {
  isYourSourceActive = false;
}
```

**4.6. Add to getSelectedSource():**
```typescript
export function getSelectedSource() {
  // ... other cases ...
  } else if (selectedSourceId === 'yourSource') {
    return {
      id: 'yourSource',
      name: 'Your Source Name',
      resolution: '1280x720',
      fps: '30fps',
      type: 'yourSource' as const,
      description: 'Your source description'
    };
  }
  // ...
}
```

**4.7. Add card in template:**
```svelte
<div 
  class="input-source-card card {selectedSourceId === 'yourSource' ? 'active' : ''}"
  on:click={() => handleYourSourceSelected()}
  role="button"
  tabindex="0"
>
  <YourInput 
    isActive={isYourSourceActive}
    on:yourSourceSelected={handleYourSourceSelected}
    on:yourSourceDeselected={handleYourSourceDeselected}
  />
</div>
```

### Step 5: Update Camera Selection Logic

In the camera card's `class` attribute, add your source to the exclusion list:

```svelte
class="input-source-card card {selectedSourceId && 
  selectedSourceId !== 'screen' && 
  selectedSourceId !== 'generative' && 
  selectedSourceId !== 'video' && 
  selectedSourceId !== 'yourSource' ? 'active' : ''}"
```

And in `selectedDeviceId`:
```svelte
selectedDeviceId={selectedSourceId !== 'screen' && 
  selectedSourceId !== 'generative' && 
  selectedSourceId !== 'video' && 
  selectedSourceId !== 'yourSource' ? selectedSourceId : null}
```

## Testing Checklist

- [ ] Only one input source can be active at a time
- [ ] Selecting a new source deactivates the previous one
- [ ] Preview appears in "Input source" section when active
- [ ] Green dot shows "Connected" status
- [ ] Frames are being sent to `onFrameChangeStore`
- [ ] StreamDiffusion receives and processes frames
- [ ] Cleanup happens properly when switching sources
- [ ] No console errors

## Common Pitfalls

### 1. **Forgetting rvfc-polyfill**
```typescript
import 'rvfc-polyfill'; // Must be first import!
```

### 2. **Not updating mediaStreamStatus**
The preview won't show if status isn't CONNECTED.

### 3. **Not stopping other sources**
Multiple sources running simultaneously will cause conflicts.

### 4. **Wrong canvas size**
Use 512x512 for consistency with camera input.

### 5. **Not cleaning up**
Always cancel callbacks in `onDestroy()`.

### 6. **Forgetting to exclude in camera logic**
Camera will stay selected if not excluded.

## Frame Format Requirements

- **Format:** JPEG Blob
- **Size:** 512x512 pixels (square)
- **Quality:** 1.0 (maximum)
- **Aspect ratio:** Maintain by center cropping
- **Frame rate:** 30 FPS recommended

## Example: Complete Video File Input

See `FileVideoInput.svelte` for a complete working example that implements all these patterns correctly.

## Questions?

If you encounter issues:
1. Check console for errors
2. Verify `mediaStreamStatus` is CONNECTED
3. Check if frames are in `onFrameChangeStore`
4. Ensure only one source is active
5. Verify canvas size is 512x512
