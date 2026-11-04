/**
 * NAVIDOOR Frontend OCR Vision Service
 * Communicates with backend /api/ocr endpoints for real-time text reading,
 * category detection, and speech synthesis.
 */

import { getBackendUrl } from './voiceAssistantBackend';
import { SupportedLanguageCode, OCRResult } from '../types';

class OCRVisionService {
  private isProcessing: boolean = false;

  async analyzeFrame(
    imageBase64: string,
    language: SupportedLanguageCode = 'en',
    mode: 'glance' | 'deep' = 'glance',
    categoryHint?: string,
    generateAudio: boolean = false
  ): Promise<OCRResult> {
    if (this.isProcessing) {
      return {
        success: false,
        text: '',
        lines: [],
        category: 'unknown',
        spokenSummary: '',
        error: 'Scan already in progress'
      };
    }

    this.isProcessing = true;
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/ocr/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          language,
          mode,
          categoryHint: categoryHint || null,
          generateAudio
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`OCR backend error: ${response.status}`);
      }

      const result: OCRResult = await response.json();
      return result;
    } catch (err: any) {
      console.warn('[OCRVisionService] Frame analysis failed:', err.message);
      return {
        success: false,
        text: '',
        lines: [],
        category: 'unknown',
        spokenSummary: 'Unable to read text from frame. Please hold steady and try again.',
        error: err.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async glanceScan(
    imageBase64: string,
    language: SupportedLanguageCode = 'en'
  ): Promise<OCRResult> {
    return this.analyzeFrame(imageBase64, language, 'glance');
  }

  async deepScan(
    imageBase64: string,
    language: SupportedLanguageCode = 'en',
    categoryHint?: string
  ): Promise<OCRResult> {
    return this.analyzeFrame(imageBase64, language, 'deep', categoryHint, false);
  }

  async readAloud(
    text: string,
    language: SupportedLanguageCode = 'en'
  ): Promise<{ success: boolean; audioBase64?: string; audioUrl?: string }> {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/ocr/read-aloud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: AbortSignal.timeout(20000)
      });

      if (!response.ok) throw new Error(`Read aloud error: ${response.status}`);
      return await response.json();
    } catch (err: any) {
      console.warn('[OCRVisionService] readAloud error:', err.message);
      return { success: false };
    }
  }
}

export const ocrVisionService = new OCRVisionService();

