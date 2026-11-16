/**
 * NAVIDOOR Frontend YOLO Vision Client Service
 * Sends captured camera frames to the YOLO AI Vision service and extracts real-time
 * obstacle bounding boxes, distances, safe path clearance, and voice announcements.
 * Includes single-flight concurrency guard, timeout handling, and live performance diagnostics.
 */

import { getBackendUrl, getVoiceSessionId } from './voiceAssistantBackend';
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
  private lastSnapshotPublishAt: number = 0;
  private lastFailureLogAt: number = 0;

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

  private async fetchVisionEndpoint(
    endpoint: string,
    payload: string,
    timeoutMs: number,
    externalSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromSession = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener('abort', abortFromSession, { once: true });
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromSession);
    }
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

    try {
      const host = getBackendUrl();
      // Try the Python YOLO host exposed alongside the backend first. If port
      // 5003 is unavailable on the device network, fall back to the Node proxy.
      let directEndpoint = host.replace(/:5001(?=\/|$)/, ':5003');
      if (directEndpoint === host) {
        const url = new URL(host);
        directEndpoint = `${url.protocol}//${url.hostname}:5003`;
      }
      let fallbackEndpoint = `${host}/api/vision/detect`;

      if (mode === 'transport') {
        directEndpoint += '/detect/bus';
        fallbackEndpoint = `${host}/api/vision/detect-bus`;
      } else if (mode === 'medicine') {
        directEndpoint += '/detect/medicine';
        fallbackEndpoint = `${host}/api/vision/detect-medicine`;
      } else {
        directEndpoint += '/detect';
      }

      // Explicitly communicate client orientation to assist sensor rotation
      const orientation = 'portrait';
      const sessionId = getVoiceSessionId();
      const payload = JSON.stringify({ image: imageBase64, language, orientation, sessionId });

      let response: Response;
      try {
        response = await this.fetchVisionEndpoint(directEndpoint, payload, 6000, externalSignal);
      } catch (directError) {
        if (externalSignal?.aborted) throw directError;
        console.warn(`[YOLO] Direct endpoint failed (${directEndpoint}); retrying through backend proxy:`, directError);
        try {
          response = await this.fetchVisionEndpoint(fallbackEndpoint, payload, 12000, externalSignal);
        } catch (proxyError) {
          if (externalSignal?.aborted) throw proxyError;
          throw new Error(`Direct endpoint failed: ${String(directError)}; backend proxy failed: ${String(proxyError)}`);
        }
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
      this.publishLatestSnapshot(result, sessionId);

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
      if (Date.now() - this.lastFailureLogAt >= 5000) {
        console.error('[YOLO] Vision request failed:', err);
        this.lastFailureLogAt = Date.now();
      }
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
      this.isProcessing = false;
    }
  }

  private publishLatestSnapshot(result: YoloAnalysisResult, sessionId: string) {
    const now = Date.now();
    if (!result.success || now - this.lastSnapshotPublishAt < 1200) return;
    this.lastSnapshotPublishAt = now;
    const snapshot = {
      capturedAt: now,
      objects: (result.detections || []).map((detection) => ({
        label: detection.class,
        confidence: detection.confidence,
        bbox: detection.normalized_bbox || detection.bbox,
        position: detection.zone?.toLowerCase() || 'center',
        distanceMeters: detection.distance_meters,
      })),
      guidance: result.voice_guidance || '',
      pathState: result.safe_path?.path_state || 'UNKNOWN',
      visibilityIssue: result.safe_path?.scene_metrics?.visibility_issue || null,
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    void fetch(`${getBackendUrl()}/api/vision/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, snapshot }),
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) console.warn(`[VISION] Snapshot cache rejected: HTTP ${response.status}`);
    }).catch((error) => console.warn('[VISION] Snapshot cache update failed:', error))
      .finally(() => clearTimeout(timeoutId));
  }

  async detectBus(imageBase64: string, language: SupportedLanguageCode = 'en') {
    return this.analyzeFrame(imageBase64, language, 'transport');
  }

  async detectMedicine(imageBase64: string, language: SupportedLanguageCode = 'en') {
    return this.analyzeFrame(imageBase64, language, 'medicine');
  }
}

export const yoloVisionService = new YoloVisionService();
