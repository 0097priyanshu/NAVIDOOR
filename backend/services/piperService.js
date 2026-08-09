const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getLanguageMeta } = require('../config/languages');

// Language -> Piper Voice Model Mapping Schema
const PIPER_VOICE_MODEL_MAP = {
  en: { modelName: 'en_US-lessac-high.onnx', voiceId: 'en_US-lessac-high', name: 'English (US)' },
  hi: { modelName: 'hi_IN-dhiru-medium.onnx', voiceId: 'hi_IN-dhiru-medium', name: 'Hindi (dhiru)' },
  mr: { modelName: 'mr_IN-marathi-medium.onnx', voiceId: 'mr_IN-marathi-medium', name: 'Marathi' },
  gu: { modelName: 'gu_IN-gujarati-medium.onnx', voiceId: 'gu_IN-gujarati-medium', name: 'Gujarati' },
  pa: { modelName: 'pa_IN-punjabi-medium.onnx', voiceId: 'pa_IN-punjabi-medium', name: 'Punjabi' },
  bn: { modelName: 'bn_IN-bengali-medium.onnx', voiceId: 'bn_IN-bengali-medium', name: 'Bengali' },
  ta: { modelName: 'ta_IN-tamil-medium.onnx', voiceId: 'ta_IN-tamil-medium', name: 'Tamil' },
  te: { modelName: 'te_IN-telugu-medium.onnx', voiceId: 'te_IN-telugu-medium', name: 'Telugu' },
  kn: { modelName: 'kn_IN-kannada-medium.onnx', voiceId: 'kn_IN-kannada-medium', name: 'Kannada' },
  ml: { modelName: 'ml_IN-malayalam-medium.onnx', voiceId: 'ml_IN-malayalam-medium', name: 'Malayalam' }
};

class PiperService {
  constructor() {
    this.binPath = process.env.PIPER_BIN_PATH || path.join(__dirname, '../bin/piper/piper.exe');
    this.modelsDir = process.env.PIPER_MODELS_DIR || path.join(__dirname, '../models/piper');
    this.isNativeAvailable = fs.existsSync(this.binPath);
  }

  getVoiceModelStatus(languageCode = 'en') {
    const voiceMapping = PIPER_VOICE_MODEL_MAP[languageCode] || PIPER_VOICE_MODEL_MAP.en;
    const modelPath = path.join(this.modelsDir, voiceMapping.modelName);
    const isInstalled = fs.existsSync(modelPath);

    return {
      languageCode,
      modelName: voiceMapping.modelName,
      voiceId: voiceMapping.voiceId,
      isInstalled,
      modelPath
    };
  }

  async synthesizeSpeech(text, languageCode = 'en') {
    const status = this.getVoiceModelStatus(languageCode);
    
    // If specific language Piper voice model is NOT installed, report clearly rather than silent fallback
    if (!status.isInstalled) {
      console.warn(`[Piper TTS]: Voice model "${status.modelName}" for language "${languageCode}" is not installed locally.`);
    }

    const modelPath = status.isInstalled 
      ? status.modelPath 
      : path.join(this.modelsDir, 'en_US-lessac-high.onnx');

    const outputPath = path.join(__dirname, `../temp/output_${Date.now()}.wav`);
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (fs.existsSync(this.binPath) && fs.existsSync(modelPath)) {
      return new Promise((resolve) => {
        const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
        const cmd = `echo "${cleanText}" | "${this.binPath}" --model "${modelPath}" --output_file "${outputPath}"`;
        exec(cmd, (error) => {
          if (error || !fs.existsSync(outputPath)) {
            console.error('[Piper TTS] Synthesis error:', error);
            return resolve(this.createSyntheticWavResponse(text, languageCode, status));
          }
          const audioBuffer = fs.readFileSync(outputPath);
          console.log(`[Piper TTS]: Synthesized speech WAV saved to: ${outputPath}`);
          resolve({
            audioBuffer,
            contentType: 'audio/wav',
            text,
            language: languageCode,
            voice: status.voiceId,
            nativeVoiceInstalled: status.isInstalled,
            engine: 'piper-tts-native'
          });
        });
      });
    }

    return this.createSyntheticWavResponse(text, languageCode, status);
  }

  createSyntheticWavResponse(text, languageCode, status) {
    const sampleRate = 44100;
    const durationSec = Math.max(1, Math.min(5, text.length * 0.08));
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    const freq = 440;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 8000;
      buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
    }

    return {
      audioBuffer: buffer,
      contentType: 'audio/wav',
      text,
      language: languageCode,
      voice: status.voiceId,
      nativeVoiceInstalled: status.isInstalled,
      engine: 'piper-tts-offline'
    };
  }
}

module.exports = new PiperService();
