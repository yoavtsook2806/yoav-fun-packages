import { isSoundEnabled, getSoundVolume, saveSoundSettings } from './exerciseHistory';

// Sound utility for timer countdown
class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private volume = 2.5; // 0-5 range (default 250/100 = 2.5)

  constructor() {
    // Load sound preferences from storage
    this.isEnabled = isSoundEnabled();
    this.volume = getSoundVolume() / 100; // Convert from 0-500 to 0-5 range
    // Initialize AudioContext on first user interaction
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      // Create AudioContext on first user interaction
      const initAudio = () => {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        // Remove listeners after first initialization
        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('click', initAudio);
      };

      // Add listeners for user interaction
      document.addEventListener('touchstart', initAudio, { once: true });
      document.addEventListener('click', initAudio, { once: true });
    } catch (error) {
      console.warn('AudioContext not supported:', error);
      this.isEnabled = false;
    }
  }

  private createBeep(frequency: number, duration: number, baseVolume: number = 0.1): void {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine'; // Gentle sine wave

      // Apply user volume setting to base volume
      const finalVolume = baseVolume * this.volume;

      // Smooth volume envelope to avoid clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing beep:', error);
    }
  }

  // Gentle countdown beep (higher pitch for last second)
  playCountdownBeep(secondsLeft: number): void {
    if (secondsLeft === 1) {
      // Final beep - slightly higher and longer
      this.createBeep(800, 0.2, 0.15);
    } else {
      // Regular countdown beep
      this.createBeep(600, 0.15, 0.1);
    }
  }

  // Timer finished sound
  playTimerComplete(): void {
    if (!this.audioContext || !this.isEnabled) return;

    // Play a pleasant two-tone completion sound
    setTimeout(() => this.createBeep(600, 0.2, 0.12), 0);
    setTimeout(() => this.createBeep(800, 0.3, 0.12), 150);
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    saveSoundSettings(enabled, this.volume * 100);
  }

  // Set volume (0-5 range)
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(5, volume)); // Clamp between 0 and 5
  }

  // Play a test beep for volume adjustment
  playVolumeTestBeep(): void {
    this.createBeep(600, 0.2, 0.15);
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }

  getVolume(): number {
    return this.volume;
  }
}

// Create singleton instance
export const soundManager = new SoundManager();
