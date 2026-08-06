import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakAnnouncement = (
  text: string, 
  options: { rate?: number; pitch?: number; interrupt?: boolean } = {}
) => {
  const { rate = 1.0, pitch = 1.0, interrupt = true } = options;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (interrupt && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.rate = rate;
      currentUtterance.pitch = pitch;
      currentUtterance.lang = 'en-US';

      window.speechSynthesis.speak(currentUtterance);
    }
  } else {
    // Mobile Native (iOS / Android / Expo Go)
    if (interrupt) {
      Speech.stop();
    }
    Speech.speak(text, {
      rate: rate,
      pitch: pitch,
      language: 'en-US',
    });
  }
};

export const stopSpeech = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } else {
    Speech.stop();
  }
};

// Plays synthetic web audio spatial chimes for distance & hazard alerts
export const playObstacleBeep = (frequency: number = 880, durationMs: number = 180) => {
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio context fallback silent
    }
  }
};
