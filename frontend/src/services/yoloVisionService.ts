/**
 * NAVIDOOR Frontend YOLO Vision Client Service
 * Sends captured camera frames to the YOLO AI Vision service and extracts real-time
 * obstacle bounding boxes, distances, safe path clearance, and voice announcements.
 * Includes single-flight concurrency guard, timeout handling, and live performance diagnostics.
 */

import { getBackendUrl } from './voiceAssistantBackend';
import { SupportedLanguageCode } from '../types';

export interface YoloDetection {
  class: string;
  class_id?: number;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  normalized_bbox: [number, number, number, number];
  distance_meters: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'INFO' | 'FAR';
  zone: 'LEFT' | 'CENTER' | 'RIGHT';
}

export type NavigationPathState = 'UNKNOWN' | 'VISIBILITY_REDUCED' | 'OBSTACLE_DETECTED' | 'PATH_OBSTRUCTED' | 'PATH_CLEAR';

export interface YoloAnalysisResult {
  success: boolean;
  busy?: boolean;
  detections: YoloDetection[];
  safe_path: {
    path_state?: NavigationPathState;
    recommended_direction: 'FORWARD' | 'LEFT' | 'RIGHT' | 'STOP' | 'CAUTION';
    guidance_hint?: string;
    corridors?: {
      left: { clear: boolean; count: number };
      center: { clear: boolean; count: number };
      right: { clear: boolean; count: number };
    };
    scene_metrics?: {
      mean_brightness: number;
      contrast_std: number;
      central_contrast_std: number;
      is_flat_surface: boolean;
      visibility_issue?: string | null;
    };
  };
  voice_guidance: string;
  latency_ms: number;
  error?: string;
  bus_arrived?: boolean;
  bus_detections?: YoloDetection[];
  medicine_detected?: boolean;
  medicine_detections?: YoloDetection[];
}

export interface VisionDiagnostics {
  fps: number;
  lastLatencyMs: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  droppedFramesCount: number;
  failedRequestsCount: number;
  lastPayloadSizeKb: number;
  isContinuousActive: boolean;
}

class YoloVisionService {
  private isProcessing: boolean = false;
  private lastRequestTime: number = 0;
  
  // Rolling latency and FPS metrics
  private latencyHistory: number[] = [];
  private maxLatency: number = 0;
  private recentCompletionTimestamps: number[] = [];
  private droppedFrames: number = 0;
  private failedRequests: number = 0;
  private lastPayloadKb: number = 0;
  private continuousActive: boolean = false;

  get isBusy(): boolean {
    return this.isProcessing;
  }

  setContinuousActive(active: boolean) {
    this.continuousActive = active;
  }

  getDiagnostics(): VisionDiagnostics {
    const now = Date.now();
    // Keep timestamps from the last 3 seconds to calculate rolling FPS
    this.recentCompletionTimestamps = this.recentCompletionTimestamps.filter((t) => now - t <= 3000);
    const calculatedFps = this.recentCompletionTimestamps.length > 0 
      ? Math.round((this.recentCompletionTimestamps.length / 3.0) * 10) / 10 
      : 0;

    const avgLat = this.latencyHistory.length > 0 
      ? Math.round(this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length)
      : 0;

    return {
      fps: calculatedFps,
      lastLatencyMs: this.latencyHistory.length > 0 ? this.latencyHistory[this.latencyHistory.length - 1] : 0,
      avgLatencyMs: avgLat,
      maxLatencyMs: this.maxLatency,
      droppedFramesCount: this.droppedFrames,
      failedRequestsCount: this.failedRequests,
      lastPayloadSizeKb: this.lastPayloadKb,
      isContinuousActive: this.continuousActive,
    };
  }

  recordDroppedFrame() {
    this.droppedFrames++;
  }

  resetDiagnostics() {
    this.latencyHistory = [];
    this.maxLatency = 0;
    this.recentCompletionTimestamps = [];
    this.droppedFrames = 0;
    this.failedRequests = 0;
    this.lastPayloadKb = 0;
  }

  async analyzeFrame(
    imageBase64: string,
    language: SupportedLanguageCode = 'en',
    mode: string = 'assist',
    externalSignal?: AbortSignal
  ): Promise<YoloAnalysisResult> {
    if (this.isProcessing) {
      this.droppedFrames++;
      return {
        success: false,
        busy: true,
        detections: [],
        safe_path: {
          path_state: 'UNKNOWN',
          recommended_direction: 'STOP',
          guidance_hint: 'Processing busy. Path unverified.',
        },
        voice_guidance: '',
        latency_ms: 0,
        error: 'Single-flight guard: prior frame is currently processing',
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    this.lastPayloadKb = Math.round((imageBase64.length * 0.75) / 1024);

    // Timeout controller (3500ms max to prevent permanently locked scheduler)
    const timeoutController = new AbortController();
    const timerId = setTimeout(() => timeoutController.abort(), 3500);

    const onExternalAbort = () => timeoutController.abort();
    if (externalSignal) {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const host = getBackendUrl();
      const yoloDirectHost = host.includes(':5001') 
        ? host.replace(':5001', ':5003') 
        : `${host.split(':')[0]}:${host.split(':')[1]}:5003`;

      let directEndpoint = `${yoloDirectHost}/detect`;
      let fallbackEndpoint = `${host}/api/vision/detect`;

      if (mode === 'transport') {
        directEndpoint = `${yoloDirectHost}/detect/bus`;
        fallbackEndpoint = `${host}/api/vision/detect-bus`;
      } else if (mode === 'medicine') {
        directEndpoint = `${yoloDirectHost}/detect/medicine`;
        fallbackEndpoint = `${host}/api/vision/detect-medicine`;
      }

      // Explicitly communicate client orientation to assist sensor rotation
      const orientation = 'portrait';
      const payload = JSON.stringify({ image: imageBase64, language, orientation });

      let response: Response | null = null;
      try {
        response = await fetch(directEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: timeoutController.signal,
        });
      } catch (directErr: any) {
        // Direct Python connection failed or aborted; try Node.js backend proxy
        if (timeoutController.signal.aborted) {
          throw directErr;
        }
        try {
          response = await fetch(fallbackEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            signal: timeoutController.signal,
          });
        } catch (fbErr: any) {
          throw fbErr;
        }
      }

      if (!response) {
        throw new Error('No response received from YOLO endpoints');
      }

      if (response.status === 429) {
        this.droppedFrames++;
        return {
          success: false,
          busy: true,
          detections: [],
          safe_path: {
            path_state: 'UNKNOWN',
            recommended_direction: 'STOP',
            guidance_hint: 'YOLO backend busy. Path unverified.',
          },
          voice_guidance: '',
          latency_ms: 0,
          error: 'YOLO backend busy',
        };
      }

      if (!response.ok) {
        throw new Error(`YOLO service HTTP error ${response.status}`);
      }

      const result: YoloAnalysisResult = await response.json();
      const elapsed = Date.now() - startTime;

      // Update metrics
      this.recentCompletionTimestamps.push(Date.now());
      this.latencyHistory.push(result.latency_ms || elapsed);
      if (this.latencyHistory.length > 30) this.latencyHistory.shift();
      if ((result.latency_ms || elapsed) > this.maxLatency) {
        this.maxLatency = result.latency_ms || elapsed;
      }

      return result;
    } catch (err: any) {
      this.failedRequests++;
      return {
        success: false,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message,
        detections: [],
        safe_path: {
          path_state: 'UNKNOWN',
          recommended_direction: 'STOP',
          guidance_hint: 'Vision offline. Path unverified.',
        },
        voice_guidance: '',
        latency_ms: 0,
      };
    } finally {
      clearTimeout(timerId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
      this.isProcessing = false;
    }
  }

  async detectBus(imageBase64: string, language: SupportedLanguageCode = 'en') {
    return this.analyzeFrame(imageBase64, language, 'transport');
  }

  async detectMedicine(imageBase64: string, language: SupportedLanguageCode = 'en') {
    return this.analyzeFrame(imageBase64, language, 'medicine');
  }
}

export const yoloVisionService = new YoloVisionService();
