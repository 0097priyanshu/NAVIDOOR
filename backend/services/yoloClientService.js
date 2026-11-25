/**
 * NAVIDOOR Backend -> YOLO AI Vision Service Client
 * Connects Express/Socket.IO backend to Python YOLO Vision Service on port 5003.
 */

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://127.0.0.1:5003';

class YoloClientService {
  constructor() {
    this.baseUrl = YOLO_SERVICE_URL;
    this.isOnline = false;
    this.lastFailure = null;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        if (!this.isOnline && this.lastFailure) console.log(`[YOLOClientService] Service recovered at ${this.baseUrl}`);
        this.isOnline = true;
        this.lastFailure = null;
        return { online: true, ...data };
      }
    } catch (e) {
      this.isOnline = false;
      this.lastFailure = e.message;
    }
    return { online: false, error: 'YOLO service offline' };
  }

  async detectFrame(imageBase64, language = 'en') {
    try {
      const response = await fetch(`${this.baseUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.status === 429) {
        return {
          success: false,
          busy: true,
          error: 'YOLO engine busy, frame dropped',
          detections: [],
          safe_path: {
            path_state: 'UNKNOWN',
            recommended_direction: 'STOP',
            guidance_hint: 'Processing busy. Path unverified.',
          },
          voice_guidance: '',
          latency_ms: 0,
        };
      }

      if (!response.ok) {
        throw new Error(`YOLO service responded with HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!this.isOnline && this.lastFailure) console.log(`[YOLOClientService] Service recovered at ${this.baseUrl}`);
      this.isOnline = true;
      this.lastFailure = null;
      return result;
    } catch (error) {
      this.isOnline = false;
      if (this.lastFailure !== error.message) console.error(`[YOLOClientService] Detection failed at ${this.baseUrl}:`, error);
      this.lastFailure = error.message;
      return {
        success: false,
        error: error.message,
        detections: [],
        safe_path: {
          path_state: 'UNKNOWN',
          recommended_direction: 'STOP',
          guidance_hint: 'Perception offline. Path unverified.',
        },
        voice_guidance: '',
        latency_ms: 0,
      };
    }
  }

  async detectBus(imageBase64, language = 'en') {
    try {
      const response = await fetch(`${this.baseUrl}/detect/bus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
        signal: AbortSignal.timeout(4000),
      });

      if (response.status === 429) {
        return { success: false, busy: true, bus_arrived: false };
      }

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message, bus_arrived: false };
    }
  }

  async detectMedicine(imageBase64, language = 'en') {
    try {
      const response = await fetch(`${this.baseUrl}/detect/medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
        signal: AbortSignal.timeout(5000),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message, medicine_detected: false };
    }
  }
}

module.exports = new YoloClientService();
