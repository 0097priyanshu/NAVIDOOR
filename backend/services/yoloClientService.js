/**
 * NAVIDOOR Backend -> YOLO AI Vision Service Client
 * Connects Express/Socket.IO backend to Python YOLO Vision Service on port 5003.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://127.0.0.1:5003';

function resolvePythonBin() {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return { cmd: process.env.PYTHON_BIN, args: [] };
  }
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const candidates = [
      path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
      'C:\\Users\\HP\\venv\\Scripts\\python.exe',
    ];
    for (const c of candidates) {
      if (c && fs.existsSync(c)) return { cmd: c, args: [] };
    }
    return { cmd: 'py', args: ['-3.10'] };
  }
  return { cmd: 'python3', args: [] };
}

class YoloClientService {
  constructor() {
    this.baseUrl = YOLO_SERVICE_URL;
    this.isOnline = false;
    this.lastFailure = null;
    this.spawnedProcess = null;
    this.startingPromise = null;
  }

  async ensureServerRunning(waitReadyMs = 20000) {
    const status = await this.checkHealth();
    if (status.online) return true;
    if (this.startingPromise) return this.startingPromise;

    this.startingPromise = (async () => {
      if (!this.spawnedProcess || this.spawnedProcess.killed) {
        const pyScript = path.join(__dirname, '../../yolo/yolo_server.py');
        if (!fs.existsSync(pyScript)) return false;

        const { cmd, args } = resolvePythonBin();
        console.log('[YOLOClientService]: Starting Python YOLO microservice on port 5003...');
        this.spawnedProcess = spawn(cmd, [...args, pyScript], {
          cwd: path.join(__dirname, '../..'),
          stdio: 'inherit',
          detached: false,
          env: {
            ...process.env,
            OMP_NUM_THREADS: process.env.OMP_NUM_THREADS || '2',
            MKL_NUM_THREADS: process.env.MKL_NUM_THREADS || '2',
          },
        });
        this.spawnedProcess.on('exit', () => {
          this.spawnedProcess = null;
          this.isOnline = false;
        });
        this.spawnedProcess.on('error', (err) => {
          console.warn('[YOLOClientService] Python spawn notice:', err.message);
          this.spawnedProcess = null;
        });
      }

      const deadline = Date.now() + waitReadyMs;
      while (Date.now() < deadline) {
        const s = await this.checkHealth();
        if (s.online) return true;
        await new Promise((r) => setTimeout(r, 400));
      }
      return false;
    })();

    try {
      return await this.startingPromise;
    } finally {
      this.startingPromise = null;
    }
  }

  stopServer() {
    const child = this.spawnedProcess;
    if (!child) return;
    this.spawnedProcess = null;
    this.isOnline = false;
    console.log(`[YOLOClientService] Stopping idle YOLO service (pid=${child.pid}) to free RAM/CPU.`);
    try {
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      console.warn('[YOLOClientService] Stop notice:', e.message);
    }
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
