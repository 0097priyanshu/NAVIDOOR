// Navidoor Accessibility Assistant Core Types

export type NavMode = 
  | 'assist'
  | 'navigate'
  | 'read'
  | 'medicine'
  | 'transport'
  | 'emergency'
  | 'family'
  | 'history'
  | 'settings'
  | 'languages';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type ThemeMode = 'standard' | 'highContrastDark' | 'highContrastAmber';

export type FontScale = 'normal' | 'large' | 'extraLarge';

export interface DetectedObject {
  id: string;
  label: string;
  emojiIcon: string;
  category: 'obstacle' | 'person' | 'door' | 'text' | 'sign' | 'furniture' | 'hazard';
  confidence: number;
  distanceMeters: number;
  direction: 'left' | 'center' | 'right';
  xRatio: number;
  yRatio: number;
  isHazard?: boolean;
}

export interface MedicineInfo {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  remainingPills: number;
  nextScheduledTime: string;
  prescribedFor: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary?: boolean;
}

export type SupportedLanguageCode = 
  | 'en' 
  | 'hi' 
  | 'mr' 
  | 'gu' 
  | 'pa' 
  | 'bn' 
  | 'ta' 
  | 'te' 
  | 'kn' 
  | 'ml';

export interface LanguageMeta {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  piperVoice: string;
  whisperLang: string;
}

export interface VoiceBackendStatus {
  online: boolean;
  whisperEngine: 'whisper.cpp' | 'simulated';
  piperEngine: 'piper-tts' | 'simulated';
  activeLanguage: SupportedLanguageCode;
  supportedLanguages: SupportedLanguageCode[];
}

export interface ContextInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'hazard' | 'success';
}
