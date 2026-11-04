/**
 * NAVIDOOR Backend -> OCR Reading Assistant Service Client
 * Connects Express/Socket.IO backend to Python OCR microservice on port 5004.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:5004';

class OCRClientService {
  constructor() {
    this.baseUrl = OCR_SERVICE_URL;
    this.isOnline = false;
    this.spawnedProcess = null;
    this.ensureServerRunning();
  }

  ensureServerRunning() {
    this.checkHealth().then((status) => {
      if (!status.online) {
        console.log('[OCRClientService]: Spawning Python OCR microservice on port 5004...');
        const isWin = process.platform === 'win32';
        const venvPyWin = 'C:\\Users\\HP\\venv\\Scripts\\python.exe';
        const pythonBin = fs.existsSync(venvPyWin) ? venvPyWin : (isWin ? 'python' : 'python3');
        const pyScript = path.join(__dirname, '../../ocr/ocr_server.py');

        if (fs.existsSync(pyScript)) {
          try {
            this.spawnedProcess = spawn(pythonBin, [pyScript], {
              stdio: 'ignore',
              detached: false,
            });
            this.spawnedProcess.on('error', (err) => {
              console.warn('[OCRClientService] Python spawn notice:', err.message);
            });
          } catch (e) {
            console.warn('[OCRClientService] Auto-spawn error:', e.message);
          }
        }
      }
    });
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        this.isOnline = true;
        return { online: true, ...data };
      }
    } catch (e) {
      this.isOnline = false;
    }
    return { online: false, error: 'OCR service offline' };
  }

  async readFrame(imageBase64, mode = 'glance', categoryHint = null) {
    try {
      const response = await fetch(`${this.baseUrl}/ocr/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mode,
          category_hint: categoryHint,
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!response.ok) {
        throw new Error(`OCR service HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[OCRClientService] readFrame failed:', error.message);
      return {
        success: false,
        error: error.message,
        text: '',
        lines: [],
        category: categoryHint || 'unknown',
        spoken_summary: 'Unable to scan text right now. Please try again.',
      };
    }
  }

  async glanceScan(imageBase64) {
    try {
      const response = await fetch(`${this.baseUrl}/ocr/glance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`OCR glance HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        text: '',
        lines: [],
        spoken_summary: 'No text detected.',
      };
    }
  }

  async deepScan(imageBase64, categoryHint = null) {
    return this.readFrame(imageBase64, 'deep', categoryHint);
  }
}

module.exports = new OCRClientService();

