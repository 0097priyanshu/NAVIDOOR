// Navidoor Accessibility Assistant Core Types

export type NavMode = 
  | 'assist'
  | 'navigate'
  | 'read'
  | 'medicine'
  | 'transport'
  | 'location'
  | 'emergency'
  | 'family'
  | 'history'
  | 'settings'
  | 'languages'
  | 'medical';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type ThemeMode = 'standard' | 'highContrastDark' | 'highContrastAmber';

export type FontScale = 'normal' | 'large' | 'extraLarge';

export interface DetectedObject {
  id: string;
  classId?: number;
  label: string;
  emojiIcon: string;
  category: 'obstacle' | 'person' | 'door' | 'text' | 'sign' | 'furniture' | 'hazard';
  confidence: number;
  distanceMeters: number;
  direction: 'left' | 'center' | 'right';
  xRatio: number;
  yRatio: number;
  x2Ratio?: number;
  y2Ratio?: number;
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
  whisperLang: string;
}

export interface VoiceBackendStatus {
  online: boolean;
  whisperEngine: 'whisper.cpp' | 'simulated';
  activeLanguage: SupportedLanguageCode;
  supportedLanguages: SupportedLanguageCode[];
}

export interface ContextInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'hazard' | 'success';
}

export type OCRCategory =
  | 'signboard'
  | 'door_label'
  | 'hospital_department'
  | 'bus_board'
  | 'medicine_label'
  | 'document'
  | 'notice'
  | 'menu'
  | 'product_label'
  | 'unknown';

export interface OCRLine {
  text: string;
  confidence: number;
  normalized_bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  line_text?: string;
}

export interface OCRResult {
  success: boolean;
  text: string;
  lines: OCRLine[];
  category: OCRCategory;
  structuredData?: any;
  spokenSummary: string;
  quality?: {
    is_blurry: boolean;
    score?: number;
    user_guidance?: string;
  };
  inferenceTimeMs?: number;
  audioBase64?: string | null;
  audioUrl?: string | null;
  error?: string;
}
