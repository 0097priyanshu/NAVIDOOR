import { SupportedLanguageCode, VoiceBackendStatus, LanguageMeta } from '../types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_COMPUTER_IP = '192.168.0.105';

const getCandidateBackendUrls = (): string[] => {
  const list: string[] = [];

  if (Platform.OS === 'web') {
    list.push('http://localhost:5001');
    list.push(`http://${LOCAL_COMPUTER_IP}:5001`);
    return list;
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(rawHost);
    if (isIp) {
      list.push(`http://${rawHost}:5001`);
    }
  }

  list.push(`http://${LOCAL_COMPUTER_IP}:5001`);
  list.push('http://localhost:5001');
  list.push('http://10.0.2.2:5001');

  return Array.from(new Set(list));
};

let activeBackendUrl = getCandidateBackendUrls()[0];

export async function discoverBackendUrl(): Promise<string> {
  const candidates = getCandidateBackendUrls();
  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(`${url}/api/health`, {}, 2500);
      if (res.ok) {
        activeBackendUrl = url;
        console.log('[VoiceAssistantBackend] Reachable Backend URL verified:', activeBackendUrl);
        return activeBackendUrl;
      }
    } catch (e) {}
  }
  console.warn('[VoiceAssistantBackend] Healthcheck offline for candidates, fallback to:', candidates[0]);
  return candidates[0];
}

discoverBackendUrl();

export const BACKEND_URL = activeBackendUrl;
export const getBackendUrl = () => activeBackendUrl;

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
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇬🇧', whisperLang: 'en' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', whisperLang: 'hi' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', whisperLang: 'mr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', whisperLang: 'gu' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', whisperLang: 'pa' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', whisperLang: 'bn' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', whisperLang: 'ta' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', whisperLang: 'te' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', whisperLang: 'kn' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', whisperLang: 'ml' }
];

export async function checkVoiceBackendStatus(): Promise<VoiceBackendStatus> {
  try {
    const baseUrl = await discoverBackendUrl();
    const res = await fetchWithTimeout(`${baseUrl}/api/health`, {}, 3000);
    if (!res.ok) throw new Error('Backend healthcheck failed');
    const data = await res.json();
    return {
      online: true,
      whisperEngine: data.whisperEngine && data.whisperEngine.includes('native') ? 'whisper.cpp' : 'simulated',
      activeLanguage: 'en',
      supportedLanguages: SUPPORTED_LANGUAGES_META.map((l) => l.code)
    };
  } catch (err) {
    return {
      online: false,
      whisperEngine: 'simulated',
      activeLanguage: 'en',
      supportedLanguages: SUPPORTED_LANGUAGES_META.map((l) => l.code)
    };
  }
}

export async function requestTranslation(text: string, targetLanguage: SupportedLanguageCode): Promise<string> {
  try {
    const baseUrl = await discoverBackendUrl();
    const res = await fetchWithTimeout(`${baseUrl}/api/translate`, {
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
    const baseUrl = await discoverBackendUrl();
    console.log(`[AI] Sending query to ${baseUrl}/api/chat: "${query}"`);
    
    const res = await fetchWithTimeout(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language, context })
    }, 25000);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[AI] /api/chat failed:', res.status, errorText);
      throw new Error(`AI backend returned HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    if (!data.answer || !data.answer.trim()) {
      throw new Error('AI backend returned an empty answer');
    }

    console.log('[AI] Received real LLM answer:', data.answer);
    return {
      answer: data.answer.trim(),
      intent: data.intent || null
    };
  } catch (err: any) {
    console.error('[AI Assistant Query Error]:', err.message || err);
    throw err;
  }
}

export const requestAIChat = queryAIAssistant;

export async function requestWhisperSTT(audioBlob: Blob | null, languageCode: SupportedLanguageCode = 'en', sourceUri: string = 'device_mic'): Promise<string | null> {
  try {
    const baseUrl = await discoverBackendUrl();
    const formData = new FormData();
    formData.append('language', languageCode);
    formData.append('sourceUri', sourceUri);

    if (Platform.OS !== 'web' && sourceUri && (sourceUri.startsWith('file://') || sourceUri.startsWith('/'))) {
      const filename = sourceUri.split('/').pop() || 'real_microphone_recording.m4a';
      const ext = filename.includes('.') ? filename.split('.').pop() : 'm4a';
      const mimeType = ext === 'wav' ? 'audio/wav' : (ext === 'mp4' || ext === 'm4a') ? 'audio/m4a' : 'audio/3gpp';

      console.log(`[VoiceAssistantBackend] Native Mobile Upload (${ext}): ${sourceUri}`);
      formData.append('audio', {
        uri: sourceUri,
        name: `real_microphone_recording.${ext}`,
        type: mimeType
      } as any);
    } else if (audioBlob) {
      console.log(`[VoiceAssistantBackend] Web Audio Blob Upload (${audioBlob.size} bytes)`);
      formData.append('audio', audioBlob, 'real_microphone_recording.wav');
    } else {
      console.warn('[VoiceAssistantBackend] No audio blob or URI available to upload.');
      return null;
    }

    console.log(`[VoiceAssistantBackend] Transmitting audio to ${baseUrl}/api/stt...`);

    const res = await fetchWithTimeout(`${baseUrl}/api/stt`, {
      method: 'POST',
      body: formData
    }, 20000);
    
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

// AI4Bharat IndicF5 Neural TTS: calls backend /api/tts and returns raw audio ArrayBuffer
export async function requestIndicF5TTS(text: string, languageCode: SupportedLanguageCode = 'en'): Promise<ArrayBuffer | null> {
  try {
    const baseUrl = await discoverBackendUrl();
    const res = await fetchWithTimeout(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: languageCode })
    }, 15000);
    
    if (!res.ok) {
      console.warn('[VoiceAssistantBackend] /api/tts response status:', res.status);
      return null;
    }
    const audioBuffer = await res.arrayBuffer();
    console.log(`[VoiceAssistantBackend] IndicF5 TTS audio received: ${audioBuffer.byteLength} bytes`);
    return audioBuffer;
  } catch (err) {
    console.warn('[VoiceAssistantBackend] requestIndicF5TTS error:', err);
    return null;
  }
}

