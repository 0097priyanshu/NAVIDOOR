import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { SupportedLanguageCode } from '../types';
import { requestPiperTTS } from '../services/voiceAssistantBackend';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudioElement: HTMLAudioElement | null = null;

const LANG_CODE_MAP: Record<SupportedLanguageCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

export const speakAnnouncement = async (
  text: string, 
  options: { rate?: number; pitch?: number; interrupt?: boolean; languageCode?: SupportedLanguageCode } = {}
) => {
  const { rate = 1.0, pitch = 1.0, interrupt = true, languageCode = 'en' } = options;

  // 1. Try Piper TTS Backend Audio Stream first
  try {
    const audioBuffer = await requestPiperTTS(text, languageCode);
    if (audioBuffer && Platform.OS === 'web' && typeof window !== 'undefined') {
      if (interrupt && currentAudioElement) {
        currentAudioElement.pause();
      }
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      currentAudioElement = new Audio(url);
      currentAudioElement.playbackRate = rate;
      currentAudioElement.play();
      return;
    }
  } catch (err) {
    // Fall back to native/web Speech synthesis
  }

  // 2. Standard Web & Native Speech Synthesis Fallback
  const targetLang = LANG_CODE_MAP[languageCode] || 'en-US';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (interrupt && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.rate = rate;
      currentUtterance.pitch = pitch;
      currentUtterance.lang = targetLang;

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
      language: targetLang,
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
