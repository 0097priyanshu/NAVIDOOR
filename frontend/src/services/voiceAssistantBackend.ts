import { SupportedLanguageCode, VoiceBackendStatus, LanguageMeta } from '../types';
import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

const LOCAL_COMPUTER_IPS = ['10.34.122.97', '192.168.0.105', '10.134.91.97'];

const getCandidateBackendUrls = (): string[] => {
  const list: string[] = [];

  // 1. Mobile Physical Device / React Native NativeModules: extract Metro bundle host IP
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        list.push(`http://${match[1]}:5001`);
      }
    }
  } catch (e) {}

  // 2. Mobile Physical Device / Expo Go: prioritize Metro host IP dynamically
  const hostUri = Constants.expoConfig?.hostUri || 
    (Constants.manifest as any)?.debuggerHost || 
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.experienceUrl;
  if (hostUri && typeof hostUri === 'string') {
    const rawHost = hostUri.replace(/^https?:\/\//, '').split(':')[0].split('/')[0];
    if (rawHost && rawHost !== '127.0.0.1' && rawHost !== 'localhost') {
      list.push(`http://${rawHost}:5001`);
    }
  }

  // 3. Known Local Computer Wi-Fi / LAN IPs
  LOCAL_COMPUTER_IPS.forEach(ip => list.push(`http://${ip}:5001`));

  // 4. Web Browser: dynamically read current active server hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.hostname) {
    const webHost = window.location.hostname;
    if (webHost && webHost !== 'localhost' && webHost !== '127.0.0.1') {
      list.push(`http://${webHost}:5001`);
    }
  }

  // 5. Platform & OS Loopback Fallbacks
  list.push('http://localhost:5001');
  list.push('http://127.0.0.1:5001');
  list.push('http://10.0.2.2:5001'); // Android Emulator loopback to host PC

  return Array.from(new Set(list));
};

let activeBackendUrl = getCandidateBackendUrls()[0];
let lastDiscoveryTime = 0;

export async function discoverBackendUrl(): Promise<string> {
  const now = Date.now();
  // If verified within the last 30 seconds, return cached URL
  if (activeBackendUrl && now - lastDiscoveryTime < 30000) {
    return activeBackendUrl;
  }

  const candidates = getCandidateBackendUrls();

  // Fast concurrent probe to all candidate URLs
  try {
    const reachable = await Promise.any(
      candidates.map(async (url) => {
        const res = await fetchWithTimeout(`${url}/api/health`, {}, 2000);
        if (res.ok) return url;
        throw new Error(`Unreachable: ${url}`);
      })
    );
    if (reachable) {
      activeBackendUrl = reachable;
      lastDiscoveryTime = now;
      console.log('[VoiceAssistantBackend] Verified reachable Backend URL:', activeBackendUrl);
      return activeBackendUrl;
    }
  } catch (e) {}

  // Sequential fallback if concurrent race fails
  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(`${url}/api/health`, {}, 1500);
      if (res.ok) {
        activeBackendUrl = url;
        lastDiscoveryTime = now;
        console.log('[VoiceAssistantBackend] Verified reachable Backend URL (fallback):', activeBackendUrl);
        return activeBackendUrl;
      }
    } catch (e) {}
  }

  const defaultFallback = Platform.OS === 'web' 
    ? candidates[0] 
    : (candidates.find(u => !u.includes('localhost') && !u.includes('127.0.0.1')) || candidates[0]);
  
  activeBackendUrl = defaultFallback;
  console.log('[VoiceAssistantBackend] Backend URL selected (default):', activeBackendUrl);
  return activeBackendUrl;
}

discoverBackendUrl();

export const BACKEND_URL = activeBackendUrl;
export const getBackendUrl = () => activeBackendUrl;

// Hermes-compatible fetch helper with 60s timeout for LLM inference
const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 60000): Promise<Response> => {
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
    }, 60000);
    
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

const uploadFormDataXHR = (url: string, formData: FormData, timeoutMs = 20000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = timeoutMs;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          resolve({ transcription: xhr.responseText });
        }
      } else {
        reject(new Error(`Server returned HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error(`Network error uploading audio file to ${url}`));
    xhr.ontimeout = () => reject(new Error(`Audio upload request to ${url} timed out`));
    xhr.send(formData as any);
  });
};

export async function requestWhisperSTT(audioBlob: Blob | null, languageCode: SupportedLanguageCode = 'en', sourceUri: string = 'device_mic'): Promise<string | null> {
  try {
    let baseUrl = await discoverBackendUrl();

    const buildFormData = () => {
      const formData = new FormData();
      formData.append('language', languageCode);
      formData.append('sourceUri', sourceUri);

      if (Platform.OS !== 'web' && sourceUri && sourceUri !== 'device_mic' && sourceUri !== 'mic_recording') {
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
      }
      return formData;
    };

    if (Platform.OS !== 'web' && (!sourceUri || sourceUri === 'device_mic' || sourceUri === 'mic_recording')) {
      console.warn('[VoiceAssistantBackend] No valid mobile audio file URI available.');
      return null;
    }
    if (Platform.OS === 'web' && !audioBlob) {
      console.warn('[VoiceAssistantBackend] No web audio blob available.');
      return null;
    }

    console.log(`[VoiceAssistantBackend] Transmitting audio to ${baseUrl}/api/stt...`);

    // Attempt 1: Fetch with FormData
    try {
      const fd = buildFormData();
      const res = await fetchWithTimeout(`${baseUrl}/api/stt`, {
        method: 'POST',
        body: fd
      }, 20000);
      if (res.ok) {
        const data = await res.json();
        console.log('[VoiceAssistantBackend] /api/stt transcription success (fetch):', data.transcription);
        return data.transcription || null;
      }
    } catch (fetchErr: any) {
      console.log(`[VoiceAssistantBackend] fetch upload to ${baseUrl}/api/stt failed (${fetchErr.message}), trying XHR...`);
    }

    // Attempt 2: XMLHttpRequest fallback
    try {
      const fd = buildFormData();
      const data = await uploadFormDataXHR(`${baseUrl}/api/stt`, fd, 20000);
      console.log('[VoiceAssistantBackend] /api/stt transcription success (XHR):', data.transcription);
      return data.transcription || null;
    } catch (xhrErr: any) {
      console.warn(`[VoiceAssistantBackend] Primary baseUrl (${baseUrl}) failed:`, xhrErr.message);
    }

    // Attempt 3: Invalidate cached baseUrl and retry with rediscovery
    activeBackendUrl = '';
    const fallbackUrl = await discoverBackendUrl();
    if (fallbackUrl && fallbackUrl !== baseUrl) {
      console.log(`[VoiceAssistantBackend] Retrying with newly discovered URL: ${fallbackUrl}`);
      try {
        const fd = buildFormData();
        const res = await fetchWithTimeout(`${fallbackUrl}/api/stt`, {
          method: 'POST',
          body: fd
        }, 20000);
        if (res.ok) {
          const data = await res.json();
          return data.transcription || null;
        }
      } catch (retryErr: any) {
        console.warn(`[VoiceAssistantBackend] Retry to ${fallbackUrl} failed:`, retryErr.message);
      }
    }

    return null;
  } catch (err: any) {
    console.warn('[VoiceAssistantBackend] requestWhisperSTT error:', err.message || err);
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

