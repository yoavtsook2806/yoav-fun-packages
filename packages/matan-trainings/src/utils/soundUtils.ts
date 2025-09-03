import { isSoundEnabled, saveSoundSettings } from './exerciseHistory';

// Sound utility for timer countdown
class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  constructor() {
    // Load sound preference from storage
    this.isEnabled = isSoundEnabled();
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

  private createBeep(frequency: number, duration: number, volume: number = 0.1): void {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine'; // Gentle sine wave

      // Smooth volume envelope to avoid clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
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
    saveSoundSettings(enabled);
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }
}

// Create singleton instance
export const soundManager = new SoundManager();
