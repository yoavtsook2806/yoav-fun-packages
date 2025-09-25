// Sound utility functions for the training app

// Volume settings
const VOLUME_STORAGE_KEY = 'matan-trainings-volume';
const DEFAULT_VOLUME = 300; // Internal volume (0-600)
const MAX_INTERNAL_VOLUME = 600;
const MAX_DISPLAY_VOLUME = 100;

// Audio context for generating beep sounds
let audioContext: AudioContext | null = null;

// Initialize audio context (requires user interaction)
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Convert display volume (0-100) to internal volume (0-600)
export const displayToInternalVolume = (displayVolume: number): number => {
  return Math.round((displayVolume / MAX_DISPLAY_VOLUME) * MAX_INTERNAL_VOLUME);
};

// Convert internal volume (0-600) to display volume (0-100)
export const internalToDisplayVolume = (internalVolume: number): number => {
  return Math.round((internalVolume / MAX_INTERNAL_VOLUME) * MAX_DISPLAY_VOLUME);
};

// Get volume from localStorage
export const getVolume = (): number => {
  const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
  return stored ? parseInt(stored, 10) : DEFAULT_VOLUME;
};

// Save volume to localStorage
export const saveVolume = (volume: number): void => {
  localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
};

// Generate a beep sound
export const playBeep = (frequency: number = 800, duration: number = 200): void => {
  try {
    const context = initAudioContext();
    if (!context) return;

    const volume = getVolume();
    if (volume === 0) return;

    // Calculate actual volume (0-1 scale)
    const actualVolume = volume / MAX_INTERNAL_VOLUME;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(actualVolume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration / 1000);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Could not play beep sound:', error);
  }
};

// Play end set beep (single beep) - at 1/10 volume
export const playEndSetBeep = (): void => {
  try {
    const context = initAudioContext();
    if (!context) return;

    const volume = getVolume();
    if (volume === 0) return;

    // Calculate actual volume at 1/10 of configured volume (0-1 scale)
    const actualVolume = (volume / MAX_INTERNAL_VOLUME) * 0.1; // 1/10 of normal volume

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800; // 800Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(actualVolume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3); // 300ms duration

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play end set beep sound:', error);
  }
};

// Play countdown beep (higher pitch for urgency)
export const playCountdownBeep = (secondsLeft: number): void => {
  if (secondsLeft === 0) {
    // Final beep - longer and different tone
    playBeep(1000, 500);
  } else {
    // Countdown beeps - short and urgent
    playBeep(1200, 150);
  }
};

// Test sound function (for settings)
export const testSound = (): void => {
  playBeep(800, 200);
};
