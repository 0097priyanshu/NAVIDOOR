const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

class IndicF5Service {
  constructor() {
    this.serverUrl = process.env.INDICF5_SERVER_URL || 'http://127.0.0.1:5002';
    this.refAudioPath = process.env.INDICF5_REF_AUDIO || path.join(__dirname, '../assets/indicf5_ref/ref_en.wav');
    this.refTextPath = process.env.INDICF5_REF_TEXT || path.join(__dirname, '../assets/indicf5_ref/ref_en.txt');
    this.ensureServerRunning();
  }

  ensureServerRunning() {
    this.checkStatus().then(status => {
      if (!status.online) {
        console.log('[IndicF5Service]: Spawning Python IndicF5 TTS microservice on port 5002...');
        const venvPy = path.join(__dirname, '../indicf5_env/Scripts/python.exe');
        const pythonBin = fs.existsSync(venvPy) ? venvPy : 'python';
        const pyScript = path.join(__dirname, '../indicf5/indicf5_server.py');
        try {
          const pyProc = spawn(pythonBin, [pyScript], { stdio: 'ignore', detached: false });
          pyProc.on('error', (err) => console.warn('[IndicF5Service] Python spawn note:', err.message));
        } catch (e) {}
      }
    });
  }

  async checkStatus() {
    try {
      const res = await this.fetchWithTimeout(`${this.serverUrl}/health`, { method: 'GET' }, 3000);
      if (!res.ok) return { online: false, engine: 'offline' };
      const data = await res.json();
      return {
        online: true,
        engine: data.engine || 'indicf5-cpu',
        device: data.device || 'CPU',
        model: data.model || 'ai4bharat/IndicF5',
        supportedLanguages: data.supportedLanguages || []
      };
    } catch (e) {
      return { online: false, engine: 'offline' };
    }
  }

  async synthesizeSpeech(text, language = 'en') {
    if (!text) return null;
    try {
      console.log(`[IndicF5Service]: Requesting IndicF5 TTS for text: "${text.substring(0, 35)}..." (${language})`);
      const payload = JSON.stringify({
        text,
        language: typeof language === 'string' ? language.toLowerCase() : 'en',
        refAudio: this.refAudioPath,
        refTextFile: this.refTextPath
      });

      const response = await this.postJSON(`${this.serverUrl}/synthesize`, payload, 15000);
      if (response && response.audioBuffer) {
        console.log(`[IndicF5Service]: Received synthesized audio buffer (${response.audioBuffer.length} bytes)`);
        return {
          audioBuffer: response.audioBuffer,
          contentType: 'audio/wav',
          engine: 'indicf5-ai4bharat'
        };
      }
    } catch (err) {
      console.warn('[IndicF5Service]: Synthesis request failed:', err.message);
    }
    return null;
  }

  postJSON(urlStr, jsonBody, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonBody)
        },
        timeout: timeoutMs
      }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Server returned HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          resolve({ audioBuffer });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('IndicF5 request timeout'));
      });
      req.write(jsonBody);
      req.end();
    });
  }

  fetchWithTimeout(urlStr, options = {}, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: options.method || 'GET',
        timeout: timeoutMs
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: async () => JSON.parse(data || '{}')
          });
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.end();
    });
  }
}
module.exports = new IndicF5Service();
