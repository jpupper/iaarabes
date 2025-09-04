// Definición de tipos para la API de YouTube
interface YTPlayer {
  destroy: () => void;
  getPlayerState: () => number;
  playVideo: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayerOptions {
  height: number;
  width: number;
  videoId: string;
  playerVars?: {
    autoplay?: number;
    controls?: number;
    showinfo?: number;
    rel?: number;
    loop?: number;
    playlist?: string;
    mute?: number;
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
  };
}

interface YTStatic {
  Player: {
    new (elementId: string | HTMLElement, options: YTPlayerOptions): YTPlayer;
  };
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: YTStatic;
  }
}

export {};
