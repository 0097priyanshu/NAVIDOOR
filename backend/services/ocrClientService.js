/**
 * NAVIDOOR Backend -> OCR Reading Assistant Service Client
 * Connects Express/Socket.IO backend to Python OCR microservice on port 5004.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:5004';

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

class OCRClientService {
  constructor() {
    this.baseUrl = OCR_SERVICE_URL;
    this.isOnline = false;
    this.spawnedProcess = null;
    this.startingPromise = null;
  }

  async ensureServerRunning(waitReadyMs = 20000) {
    const status = await this.checkHealth();
    if (status.online) return true;
    if (this.startingPromise) return this.startingPromise;

    this.startingPromise = (async () => {
      if (!this.spawnedProcess || this.spawnedProcess.killed) {
        const pyScript = path.join(__dirname, '../../ocr/ocr_server.py');
        if (!fs.existsSync(pyScript)) return false;

        const { cmd, args } = resolvePythonBin();
        console.log('[OCRClientService]: Starting Python OCR microservice on port 5004...');
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
          console.warn('[OCRClientService] Python spawn notice:', err.message);
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
    console.log(`[OCRClientService] Stopping idle OCR service (pid=${child.pid}) to free RAM/CPU.`);
    try {
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      console.warn('[OCRClientService] Stop notice:', e.message);
    }
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

