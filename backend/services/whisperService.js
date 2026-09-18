const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { getLanguageMeta } = require('../config/languages');

class WhisperService {
  constructor() {
    this.binPath = process.env.WHISPER_BIN_PATH || path.join(__dirname, '../bin/main.exe');
  }

  getModelPath() {
    if (process.env.WHISPER_MODEL_PATH && fs.existsSync(process.env.WHISPER_MODEL_PATH)) {
      return process.env.WHISPER_MODEL_PATH;
    }

    const smallModel = path.join(__dirname, '../models/whisper/ggml-small.bin');
    const baseModel = path.join(__dirname, '../models/whisper/ggml-base.bin');
    const tinyModel = path.join(__dirname, '../models/whisper/ggml-tiny.bin');

    if (fs.existsSync(smallModel) && fs.statSync(smallModel).size > 400000000) {
      return smallModel;
    }
    if (fs.existsSync(baseModel)) {
      return baseModel;
    }
    return tinyModel;
  }

  convertTo16kMonoWav(inputPath, outputPath) {
    try {
      if (ffmpegPath && fs.existsSync(ffmpegPath)) {
        // Apply HighPass (80Hz) + LowPass (7500Hz) noise filtering & Volume Boost (1.8x) for clean microphone audio
        const cmd = `"${ffmpegPath}" -y -i "${inputPath}" -af "highpass=f=80, lowpass=f=7500, volume=1.8" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
        execSync(cmd, { stdio: 'ignore' });
        const outSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        console.log(`[WhisperService]: FFmpeg resampled & filtered "${path.basename(inputPath)}" -> "${path.basename(outputPath)}" (${outSize} bytes)`);
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

    // Convert M4A/AAC/WAV/WEBM to 16kHz 16-bit Mono PCM WAV (real_microphone_16k.wav) with audio noise filtering
    const real16kWavPath = path.join(__dirname, '../temp/real_microphone_16k.wav');
    const wav16kPath = this.convertTo16kMonoWav(audioFilePath, real16kWavPath);
    const activeModel = this.getModelPath();

    if (fs.existsSync(this.binPath) && fs.existsSync(activeModel)) {
      return new Promise((resolve) => {
        const whisperLang = 'auto';
        // High accuracy beam search (-bs 5 -bo 5), 8 computation threads (-t 8), no timestamps (-nt), domain prompt
        const cmd = `"${this.binPath}" -m "${activeModel}" -l ${whisperLang} -t 8 -bs 5 -bo 5 -nt --prompt "NAVIDOOR voice navigation assistant." -f "${wav16kPath}"`;
        
        const startTime = Date.now();
        exec(cmd, (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;

          if (error && !stdout) {
            console.error('[Whisper.cpp] Inference error:', error, stderr);
            return resolve({ text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp', real16kWavPath });
          }

          const rawOutput = stdout || '';
          let cleanedText = rawOutput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('whisper_') && !line.startsWith('system_info') && !line.startsWith('main:'))
            .join(' ')
            .trim();

          const modelName = path.basename(activeModel);
          console.log(`[Whisper.cpp STT (${modelName})]: Transcribed Text: "${cleanedText}" (${durationMs}ms)`);

          resolve({
            text: cleanedText,
            language: languageCode || 'auto',
            confidence: cleanedText ? 0.96 : 0,
            inferenceTimeMs: durationMs,
            real16kWavPath,
            engine: `whisper.cpp-${modelName}`
          });
        });
      });
    }

    return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp', real16kWavPath };
  }
}

module.exports = new WhisperService();
