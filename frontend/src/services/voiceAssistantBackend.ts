import { SupportedLanguageCode, VoiceBackendStatus, LanguageMeta } from '../types';
import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

const LOCAL_COMPUTER_IPS = ['10.34.122.97', '192.168.0.105', '10.134.91.97'];

/**
 * Dynamically resolves the host PC IP address in real-time from the active Metro bundler session.
 * Works seamlessly across Home Wi-Fi, Mobile Hotspot, Office LAN, and USB tethering
 * with zero hardcoded IP addresses.
 */
const getDynamicHost = (): string | null => {
  // 1. Live React Native Script URL (exact IP the device used to fetch the bundle)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  }

  // 2. Expo Metro hostUri / debuggerHost
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    if (rawHost && rawHost !== 'localhost' && rawHost !== '127.0.0.1') {
      return rawHost;
    }
  }

  // 3. Expo Linking URI
  if (Constants.linkingUri) {
    const match = Constants.linkingUri.match(/^exp:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  }

  // 4. Web browser hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const webHost = window.location.hostname;
    if (webHost && webHost !== 'localhost' && webHost !== '127.0.0.1') {
      return webHost;
    }
  }

  return null;
};

const getCandidateBackendUrls = (): string[] => {
  const list: string[] = [];
  const dynamicHost = getDynamicHost();

  if (dynamicHost) {
    list.push(`http://${dynamicHost}:5001`);
  }

  // Known fallback LAN IPs
  LOCAL_COMPUTER_IPS.forEach(ip => list.push(`http://${ip}:5001`));

  // Android Emulator loopback
  if (Platform.OS === 'android') {
    list.push('http://10.0.2.2:5001');
  }

  // Localhost fallbacks for Web/Simulators
  list.push('http://localhost:5001');
  list.push('http://127.0.0.1:5001');

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
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translatedText || text;
  } catch (e) {
    return text;
  }
}
