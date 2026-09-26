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
        // High-Pass Filter (120Hz) cuts low traffic rumble/wind. Low-Pass Filter (3800Hz) cuts crowd noise. Boost voice 2.5x.
        const audioFilter = "highpass=f=120,lowpass=f=3800,volume=2.5";
        const cmd = `"${ffmpegPath}" -y -i "${inputPath}" -af "${audioFilter}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
        execSync(cmd, { stdio: 'ignore' });
        const outSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        console.log(`[WhisperService]: FFmpeg Noise-Filtered Resample "${path.basename(inputPath)}" -> "${path.basename(outputPath)}" (${outSize} bytes)`);
        return outputPath;
      }
    } catch (e) {
      console.warn('[WhisperService]: FFmpeg audio conversion fallback:', e.message);
    }
    return inputPath;
  }

  async transcribeAudio(audioFilePath, languageCode = 'en') {
    const langMeta = getLanguageMeta(languageCode);
    const whisperLang = (langMeta && langMeta.whisperLang) ? langMeta.whisperLang : (languageCode || 'en');

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp' };
    }

    // Convert M4A/AAC/WAV/WEBM to 16kHz 16-bit Mono PCM WAV (real_microphone_16k.wav)
    const real16kWavPath = path.join(__dirname, '../temp/real_microphone_16k.wav');
    const wav16kPath = this.convertTo16kMonoWav(audioFilePath, real16kWavPath);
    const activeModel = this.getModelPath();

    if (fs.existsSync(this.binPath) && fs.existsSync(activeModel)) {
      return new Promise((resolve) => {
        // Fast greedy STT execution with 'auto' detection for non-English speech to capture code-switched English words cleanly
        const targetLangArg = (languageCode && languageCode !== 'en') ? 'auto' : (whisperLang || 'auto');
        const cmd = `"${this.binPath}" -m "${activeModel}" -l ${targetLangArg} -t 8 -nt -f "${wav16kPath}"`;
        
        const startTime = Date.now();
        exec(cmd, (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;

          const rawOutput = stdout || '';
          let cleanedText = rawOutput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('whisper_') && !line.startsWith('system_info') && !line.startsWith('main:'))
            .join(' ')
            .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
            .replace(/\[(BLANK_AUDIO|SILENCE|MUSIC|NOISE|TRAFFIC|HORN|CROWD|CHATTER|LAUGHTER|COUGH)\]/gi, '')
            .replace(/\((blank audio|silence|music|noise|traffic|horn|crowd|chatter|laughter|cough)\)/gi, '')
            .trim();

          // Quick fallback pass with explicit language code if auto detection produced no text
          if (!cleanedText || cleanedText.length < 2) {
            const fallbackCmd = `"${this.binPath}" -m "${activeModel}" -l ${whisperLang || 'auto'} -t 8 -nt -f "${wav16kPath}"`;
            try {
              const fallbackOutput = execSync(fallbackCmd, { encoding: 'utf-8' }) || '';
              cleanedText = fallbackOutput
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('whisper_') && !line.startsWith('system_info') && !line.startsWith('main:'))
                .join(' ')
                .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
                .replace(/\[(BLANK_AUDIO|SILENCE|MUSIC|NOISE|LAUGHTER|COUGH)\]/gi, '')
                .replace(/\((blank audio|silence|music|noise|laughter|cough)\)/gi, '')
                .trim();
            } catch (fbErr) {}
          }

          const modelName = path.basename(activeModel);
          console.log(`[Whisper.cpp STT (${modelName})]: Transcribed Text: "${cleanedText}" (${durationMs}ms)`);

          resolve({
            text: cleanedText,
            language: languageCode || 'en',
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
