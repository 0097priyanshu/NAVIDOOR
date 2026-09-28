/**
 * NAVIDOOR Backend -> YOLO AI Vision Service Client
 * Connects Express/Socket.IO backend to Python YOLO Vision Service on port 5003.
 */

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://127.0.0.1:5003';

class YoloClientService {
  constructor() {
    this.baseUrl = YOLO_SERVICE_URL;
    this.isOnline = false;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        this.isOnline = true;
        return { online: true, ...data };
      }
    } catch (e) {
      this.isOnline = false;
    }
    return { online: false, error: 'YOLO service offline' };
  }

  async detectFrame(imageBase64, language = 'en') {
    try {
      const response = await fetch(`${this.baseUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`YOLO service responded with HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[YOLOClientService] Detection failed:', error.message);
      return {
        success: false,
        error: error.message,
        detections: [],
        safe_path: { recommended_direction: 'FORWARD' },
        voice_guidance: '',
      };
    }
  }

  async detectBus(imageBase64, language = 'en') {
    try {
      const response = await fetch(`${this.baseUrl}/detect/bus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, language }),
        signal: AbortSignal.timeout(20000),
      });
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
