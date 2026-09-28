/**
 * NAVIDOOR Frontend YOLO Vision Client Service
 * Sends captured camera frames to the YOLO AI Vision service and extracts real-time
 * obstacle bounding boxes, distances, safe path clearance, and voice announcements.
 */

import { getBackendUrl } from './voiceAssistantBackend';
import { SupportedLanguageCode } from '../types';

export interface YoloDetection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  normalized_bbox: [number, number, number, number];
  distance_meters: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'INFO' | 'FAR';
  zone: 'LEFT' | 'CENTER' | 'RIGHT';
}

export interface YoloAnalysisResult {
  success: boolean;
  detections: YoloDetection[];
  safe_path: {
    recommended_direction: 'FORWARD' | 'LEFT' | 'RIGHT' | 'STOP';
    guidance_hint: string;
    corridors: {
      left: { clear: boolean; count: number };
      center: { clear: boolean; count: number };
      right: { clear: boolean; count: number };
    };
  };
  voice_guidance: string;
  latency_ms: number;
  error?: string;
}

class YoloVisionService {
  private isProcessing: boolean = false;

  async analyzeFrame(
    imageBase64: string,
    language: SupportedLanguageCode = 'en'
  ): Promise<YoloAnalysisResult> {
    if (this.isProcessing) {
      return {
        success: false,
        detections: [],
        safe_path: {
          recommended_direction: 'FORWARD',
          guidance_hint: '',
          corridors: {
            left: { clear: true, count: 0 },
            center: { clear: true, count: 0 },
            right: { clear: true, count: 0 },
          },
        },
        voice_guidance: '',
        latency_ms: 0,
      };
    }

    this.isProcessing = true;
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/vision/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
      });

      if (!response.ok) {
        throw new Error(`Vision backend error: ${response.status}`);
      }

      const result: YoloAnalysisResult = await response.json();
      return result;
    } catch (err: any) {
      console.warn('[YoloVisionService] Frame analysis error:', err.message);
      return {
        success: false,
        error: err.message,
        detections: [],
        safe_path: {
          recommended_direction: 'FORWARD',
          guidance_hint: '',
          corridors: {
            left: { clear: true, count: 0 },
            center: { clear: true, count: 0 },
            right: { clear: true, count: 0 },
          },
        },
        voice_guidance: '',
        latency_ms: 0,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async detectBus(imageBase64: string, language: SupportedLanguageCode = 'en') {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/vision/detect-bus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message, bus_arrived: false };
    }
  }

  async detectMedicine(imageBase64: string, language: SupportedLanguageCode = 'en') {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/vision/detect-medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message, medicine_detected: false };
    }
  }
}

export const yoloVisionService = new YoloVisionService();
