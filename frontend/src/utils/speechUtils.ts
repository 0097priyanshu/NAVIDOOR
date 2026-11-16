import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { SupportedLanguageCode } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
export type SpeechCompletionEvent = 'done' | 'error' | 'stopped';
type SpeechCompletionHandler = (event: SpeechCompletionEvent, speechId: number) => void;
const speechCompletionHandlers = new Set<SpeechCompletionHandler>();
let activeSpeechId = 0;
export const getActiveSpeechId = () => activeSpeechId;

export const setSpeechCompletionHandler = (handler: SpeechCompletionHandler | null) => {
	speechCompletionHandlers.clear();
	if (handler) speechCompletionHandlers.add(handler);
};

export const addSpeechCompletionListener = (handler: SpeechCompletionHandler) => {
	speechCompletionHandlers.add(handler);
	return () => speechCompletionHandlers.delete(handler);
};

const notifySpeechCompletion = (speechId: number, event: SpeechCompletionEvent) => {
	if (speechId !== activeSpeechId) return;
	activeSpeechId = 0;
	console.log(`[VOICE] TTS ${event === 'done' ? 'onDone' : event === 'stopped' ? 'onStopped' : 'onError'}`);
	for (const handler of speechCompletionHandlers) {
		try { handler(event, speechId); } catch (error) { console.error('[VOICE] TTS completion listener failed:', error); }
	}
};

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
	const speechId = ++activeSpeechId;
  const { rate = 1.0, pitch = 1.0, interrupt = true, languageCode = 'en' } = options;
  const targetLang = LANG_CODE_MAP[languageCode] || 'en-US';

  // Normalize speech rate for iOS AVSpeechSynthesizer (0.5 is normal speed on iOS)
  const effectiveRate = Platform.OS === 'ios' ? rate * 0.5 : rate;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (interrupt && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.rate = rate;
      currentUtterance.pitch = pitch;
      currentUtterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const prefix = targetLang.split('-')[0].toLowerCase();
        const match = voices.find(v => v.lang.toLowerCase().startsWith(prefix) || v.lang.toLowerCase().includes(prefix));
        if (match) {
          currentUtterance.voice = match;
        }

      }
      currentUtterance.onend = () => notifySpeechCompletion(speechId, 'done');
      currentUtterance.onerror = () => notifySpeechCompletion(speechId, 'error');

      try {
        window.speechSynthesis.speak(currentUtterance);
      } catch (error) {
        notifySpeechCompletion(speechId, 'error');
      }
      return speechId;
    } else {
      notifySpeechCompletion(speechId, 'error');
      return speechId;
    }
  } else {
    // Mobile Native (iOS & Android)
    if (interrupt) {
      Speech.stop();
    }
    
    // Ensure iOS plays in silent mode without being muted by iOS physical silent switch
    try {
      const { setAudioModeAsync } = require('expo-audio');
      if (setAudioModeAsync) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
      }
    } catch (err) {}

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const prefix = targetLang.split('-')[0].toLowerCase();
      const match = voices.find(v => v.language.toLowerCase().startsWith(prefix) || v.language.toLowerCase().includes(prefix));

      if (speechId !== activeSpeechId) return;
      Speech.speak(text, {
        rate: effectiveRate,
        pitch,
        language: targetLang,
        voice: match ? match.identifier : undefined,
        onDone: () => notifySpeechCompletion(speechId, 'done'),
        onError: () => notifySpeechCompletion(speechId, 'error'),
        onStopped: () => notifySpeechCompletion(speechId, 'stopped'),
      });
      return speechId;
    } catch (e) {
      if (speechId !== activeSpeechId) return;
      try {
        Speech.speak(text, {
          rate: effectiveRate,
          pitch,
          language: targetLang,
          onDone: () => notifySpeechCompletion(speechId, 'done'),
          onError: () => notifySpeechCompletion(speechId, 'error'),
          onStopped: () => notifySpeechCompletion(speechId, 'stopped'),
        });
        return speechId;
      } catch (error) {
        notifySpeechCompletion(speechId, 'error');
        return speechId;
      }
    }
  }
};

export const stopSpeech = () => {
	activeSpeechId = 0;
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
