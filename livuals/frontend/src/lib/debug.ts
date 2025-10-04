// Debug utilities for Livuals
// This file provides debugging tools for the application

/**
 * Debug levels
 */
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5
}

// Current debug level - change this to control logging
let currentLevel = DebugLevel.DEBUG;

/**
 * Set the debug level
 * @param level The debug level to set
 */
export function setDebugLevel(level: DebugLevel) {
  currentLevel = level;
}

/**
 * Log a message at the specified level
 * @param level The debug level
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function log(level: DebugLevel, module: string, message: string, data?: any) {
  if (level <= currentLevel) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}][${module}]`;
    
    switch (level) {
      case DebugLevel.ERROR:
        console.error(`${prefix} 🔴 ${message}`, data || '');
        break;
      case DebugLevel.WARN:
        console.warn(`${prefix} 🟠 ${message}`, data || '');
        break;
      case DebugLevel.INFO:
        console.info(`${prefix} 🔵 ${message}`, data || '');
        break;
      case DebugLevel.DEBUG:
        console.debug(`${prefix} 🟢 ${message}`, data || '');
        break;
      case DebugLevel.VERBOSE:
        console.debug(`${prefix} 🟣 ${message}`, data || '');
        break;
    }
  }
}

/**
 * Log an error message
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function error(module: string, message: string, data?: any) {
  log(DebugLevel.ERROR, module, message, data);
}

/**
 * Log a warning message
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function warn(module: string, message: string, data?: any) {
  log(DebugLevel.WARN, module, message, data);
}

/**
 * Log an info message
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function info(module: string, message: string, data?: any) {
  log(DebugLevel.INFO, module, message, data);
}

/**
 * Log a debug message
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function debug(module: string, message: string, data?: any) {
  log(DebugLevel.DEBUG, module, message, data);
}

/**
 * Log a verbose message
 * @param module The module name
 * @param message The message to log
 * @param data Additional data to log
 */
export function verbose(module: string, message: string, data?: any) {
  log(DebugLevel.VERBOSE, module, message, data);
}

/**
 * Measure the time taken to execute a function
 * @param module The module name
 * @param name The name of the operation
 * @param fn The function to execute
 * @returns The result of the function
 */
export async function measure<T>(module: string, name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    debug(module, `${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    warn(module, `${name} failed after ${(end - start).toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Create a debug logger for a specific module
 * @param module The module name
 * @returns An object with logging functions
 */
export function createLogger(module: string) {
  return {
    error: (message: string, data?: any) => error(module, message, data),
    warn: (message: string, data?: any) => warn(module, message, data),
    info: (message: string, data?: any) => info(module, message, data),
    debug: (message: string, data?: any) => debug(module, message, data),
    verbose: (message: string, data?: any) => verbose(module, message, data),
    measure: <T>(name: string, fn: () => Promise<T>) => measure<T>(module, name, fn)
  };
}

// Export a default logger
export const logger = createLogger('App');

// Debug helper for video issues
export function debugVideoElement(video: HTMLVideoElement | null, name: string = 'Video') {
  if (!video) {
    error('VideoDebug', `${name} element is null`);
    return;
  }
  
  info('VideoDebug', `${name} element:`, {
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    ended: video.ended,
    muted: video.muted,
    currentTime: video.currentTime,
    duration: video.duration,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    error: video.error ? {
      code: video.error.code,
      message: video.error.message
    } : null
  });
}

// Debug helper for canvas issues
export function debugCanvasElement(canvas: HTMLCanvasElement | null, name: string = 'Canvas') {
  if (!canvas) {
    error('CanvasDebug', `${name} element is null`);
    return;
  }
  
  info('CanvasDebug', `${name} element:`, {
    width: canvas.width,
    height: canvas.height,
    clientWidth: canvas.clientWidth,
    clientHeight: canvas.clientHeight,
    style: {
      width: canvas.style.width,
      height: canvas.style.height,
      display: canvas.style.display,
      visibility: canvas.style.visibility
    }
  });
}
