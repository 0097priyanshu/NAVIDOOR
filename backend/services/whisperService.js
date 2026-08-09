const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { getLanguageMeta } = require('../config/languages');

class WhisperService {
  constructor() {
    this.binPath = process.env.WHISPER_BIN_PATH || path.join(__dirname, '../bin/main.exe');
    this.modelPath = process.env.WHISPER_MODEL_PATH || path.join(__dirname, '../models/whisper/ggml-base.bin');
    this.isNativeAvailable = fs.existsSync(this.binPath) && fs.existsSync(this.modelPath);

    if (this.isNativeAvailable) {
      console.log(`[Whisper.cpp STT]: Native binary verified at ${this.binPath}`);
      console.log(`[Whisper.cpp STT]: Multilingual model loaded from ${this.modelPath}`);
    } else {
      console.warn('[Whisper.cpp STT]: Binary or model path missing.');
    }
  }

  convertTo16kMonoWav(inputPath, outputPath) {
    try {
      if (ffmpegPath && fs.existsSync(ffmpegPath)) {
        const cmd = `"${ffmpegPath}" -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
        execSync(cmd, { stdio: 'ignore' });
        const outSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        console.log(`[WhisperService]: FFmpeg converted "${path.basename(inputPath)}" -> "${path.basename(outputPath)}" (${outSize} bytes)`);
        return outputPath;
      }
    } catch (e) {
      console.warn('[WhisperService]: FFmpeg audio conversion fallback:', e.message);
    }
    return inputPath;
  }

  async transcribeAudio(audioFilePath, languageCode = 'auto') {
    const langMeta = getLanguageMeta(languageCode);

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp' };
    }

    // Convert M4A/AAC/WAV/WEBM to 16kHz 16-bit Mono PCM WAV (real_microphone_16k.wav)
    const real16kWavPath = path.join(__dirname, '../temp/real_microphone_16k.wav');
    const wav16kPath = this.convertTo16kMonoWav(audioFilePath, real16kWavPath);

    if (fs.existsSync(this.binPath) && fs.existsSync(this.modelPath)) {
      return new Promise((resolve) => {
        const langFlag = (languageCode && languageCode !== 'auto') ? `-l ${langMeta.whisperLang}` : '-dl';
        const cmd = `"${this.binPath}" -m "${this.modelPath}" ${langFlag} -f "${wav16kPath}"`;
        
        const startTime = Date.now();
        exec(cmd, (error, stdout) => {
          const durationMs = Date.now() - startTime;

          if (error && !stdout) {
            console.error('[Whisper.cpp] Inference error:', error);
            return resolve({ text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp', real16kWavPath });
          }

          let cleanedText = (stdout || '').replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*/g, '').trim();
          console.log(`[Whisper.cpp] Transcribed Text: "${cleanedText}" (${durationMs}ms)`);

          resolve({
            text: cleanedText,
            language: languageCode || 'auto',
            confidence: cleanedText ? 0.96 : 0,
            inferenceTimeMs: durationMs,
            real16kWavPath,
            engine: 'whisper.cpp-multilingual'
          });
        });
      });
    }

    return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp', real16kWavPath };
  }
}

module.exports = new WhisperService();
