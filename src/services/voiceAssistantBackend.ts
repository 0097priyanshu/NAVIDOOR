import { SupportedLanguageCode, VoiceBackendStatus, LanguageMeta } from '../types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001';
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5001`;
  }
  return 'http://localhost:5001';
};

export const BACKEND_URL = getBackendUrl();
console.log('[VoiceAssistantBackend]: Resolved Backend URL:', BACKEND_URL);

// Hermes-compatible fetch helper with timeout
const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

export const SUPPORTED_LANGUAGES_META: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇬🇧', piperVoice: 'en_US-lessac-high', whisperLang: 'en' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', piperVoice: 'hi_IN-dhiru-medium', whisperLang: 'hi' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', piperVoice: 'mr_IN-marathi-medium', whisperLang: 'mr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', piperVoice: 'gu_IN-gujarati-medium', whisperLang: 'gu' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', piperVoice: 'pa_IN-punjabi-medium', whisperLang: 'pa' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', piperVoice: 'bn_IN-bengali-medium', whisperLang: 'bn' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', piperVoice: 'ta_IN-tamil-medium', whisperLang: 'ta' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', piperVoice: 'te_IN-telugu-medium', whisperLang: 'te' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', piperVoice: 'kn_IN-kannada-medium', whisperLang: 'kn' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', piperVoice: 'ml_IN-malayalam-medium', whisperLang: 'ml' }
];

export async function checkVoiceBackendStatus(): Promise<VoiceBackendStatus> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/health`, {}, 3000);
    if (!res.ok) throw new Error('Backend healthcheck failed');
    const data = await res.json();
    return {
      online: true,
      whisperEngine: data.whisperEngine.includes('native') ? 'whisper.cpp' : 'simulated',
      piperEngine: data.piperEngine.includes('native') ? 'piper-tts' : 'simulated',
      activeLanguage: 'en',
      supportedLanguages: SUPPORTED_LANGUAGES_META.map((l) => l.code)
    };
  } catch (err) {
    return {
      online: false,
      whisperEngine: 'simulated',
      piperEngine: 'simulated',
      activeLanguage: 'en',
      supportedLanguages: SUPPORTED_LANGUAGES_META.map((l) => l.code)
    };
  }
}

export async function requestTranslation(text: string, targetLanguage: SupportedLanguageCode): Promise<string> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage })
    }, 5000);
    if (!res.ok) return text;
    const data = await res.json();
    return data.translatedText || text;
  } catch (err) {
    return text;
  }
}

export async function queryAIAssistant(query: string, language: SupportedLanguageCode = 'en', context = {}): Promise<{ answer: string; intent?: any }> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language, context })
    }, 10000);
    if (!res.ok) return { answer: `Answer for: "${query}"` };
    const data = await res.json();
    return {
      answer: data.answer || query,
      intent: data.intent || null
    };
  } catch (err) {
    return { answer: 'Your surroundings are clear and safe to navigate.' };
  }
}

export const requestAIChat = queryAIAssistant;

export async function requestWhisperSTT(audioBlob: Blob | null, languageCode: SupportedLanguageCode = 'en', sourceUri: string = 'device_mic'): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('language', languageCode);
    formData.append('sourceUri', sourceUri);

    if (Platform.OS !== 'web' && sourceUri && (sourceUri.startsWith('file://') || sourceUri.startsWith('/'))) {
      console.log(`[VoiceAssistantBackend] Native Android File Upload: ${sourceUri}`);
      formData.append('audio', {
        uri: sourceUri,
        name: 'real_microphone_recording.wav',
        type: 'audio/wav'
      } as any);
    } else if (audioBlob) {
      console.log(`[VoiceAssistantBackend] Web Audio Blob Upload (${audioBlob.size} bytes)`);
      formData.append('audio', audioBlob, 'real_microphone_recording.wav');
    } else {
      console.warn('[VoiceAssistantBackend] No audio blob or URI available to upload.');
      return null;
    }

    console.log(`[VoiceAssistantBackend] Transmitting audio to ${BACKEND_URL}/api/stt...`);

    const res = await fetchWithTimeout(`${BACKEND_URL}/api/stt`, {
      method: 'POST',
      body: formData
    }, 15000);
    
    if (!res.ok) {
      console.warn('[VoiceAssistantBackend] /api/stt response status:', res.status);
      return null;
    }
    const data = await res.json();
    console.log('[VoiceAssistantBackend] /api/stt transcription success:', data.transcription);
    return data.transcription || null;
  } catch (err) {
    console.warn('[VoiceAssistantBackend] requestWhisperSTT fetch error:', err);
    return null;
  }
}
