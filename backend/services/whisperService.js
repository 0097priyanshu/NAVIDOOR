const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { getLanguageMeta } = require('../config/languages');

class WhisperService {
    const macBin = path.join(__dirname, '../bin/main');
    const winBin = path.join(__dirname, '../bin/main.exe');
    this.binPath = process.env.WHISPER_BIN_PATH || (
      process.platform === 'win32'
        ? (fs.existsSync(winBin) ? winBin : macBin)
        : (fs.existsSync(macBin) ? macBin : winBin)
    );
    this.previousLanguageContext = 'mr';
  }

  getModelPath(preferSmall = false) {
    if (process.env.WHISPER_MODEL_PATH && fs.existsSync(process.env.WHISPER_MODEL_PATH)) {
      return process.env.WHISPER_MODEL_PATH;
    }

    const baseModel = path.join(__dirname, '../models/whisper/ggml-base.bin');
    const smallModel = path.join(__dirname, '../models/whisper/ggml-small.bin');
    const tinyModel = path.join(__dirname, '../models/whisper/ggml-tiny.bin');

    if (preferSmall && fs.existsSync(smallModel)) {
      return smallModel;
    }

    if (fs.existsSync(baseModel)) {
      return baseModel;
    }
    if (fs.existsSync(smallModel)) {
      return smallModel;
    }
    return tinyModel;
  }

  // Clean 16 kHz Mono PCM WAV resampling
  convertTo16kMonoWav(inputPath, outputPath) {
    const ffmpegStart = Date.now();
    try {
      if (ffmpegPath && fs.existsSync(ffmpegPath)) {
        const cmd = `"${ffmpegPath}" -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
        require('child_process').execSync(cmd, { stdio: 'ignore' });
        const ffmpegDuration = Date.now() - ffmpegStart;
        const outSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        return outputPath;
      }
    } catch (e) {
      console.warn('[STT PIPELINE] FFmpeg audio conversion error:', e.message);
    }
    return inputPath;
  }

  validateWav(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return null;
    try {
      const buffer = fs.readFileSync(filePath);
      const fileSize = buffer.length;
      if (fileSize < 44) return null;

      const sampleRate = buffer.readUInt32LE(24);
      const channels = buffer.readUInt16LE(22);
      const bitsPerSample = buffer.readUInt16LE(34);
      const pcmData = buffer.slice(44);
      const numSamples = pcmData.length / 2;
      const duration = (numSamples / (sampleRate * Math.max(1, channels))).toFixed(2);

      let sumSquares = 0;
      let maxAmp = 0;
      for (let i = 0; i < pcmData.length; i += 2) {
        const val = pcmData.readInt16LE(i);
        const absVal = Math.abs(val);
        if (absVal > maxAmp) maxAmp = absVal;
        sumSquares += (val / 32768) * (val / 32768);
      }

      const rms = Math.sqrt(sumSquares / Math.max(1, numSamples)).toFixed(4);
      const peakAmplitude = (maxAmp / 32768).toFixed(4);

      return {
        sampleRate,
        channels,
        duration: `${duration}s`,
        format: `PCM ${bitsPerSample}-bit`,
        fileSize: `${fileSize} bytes`,
        peakAmplitude,
        RMS: rms,
        hasSpeech: parseFloat(rms) > 0.001
      };
    } catch (e) {
      console.warn('[STT PIPELINE] WAV validation error:', e.message);
      return null;
    }
  }

  // Detect suspicious script / Russian / Arabic / Cyrillic gibberish hallucinations
  isSuspiciousScript(text, targetLang = 'mr') {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length === 0) return false;

    // Detect Cyrillic (Russian) script
    if (/[\u0400-\u04FF]/.test(clean)) return true;

    // Detect Arabic script
    if (/[\u0600-\u06FF]/.test(clean)) return true;

    // Detect CJK / Chinese / Japanese / Korean script
    if (/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(clean)) return true;

    // Detect repeating diacritic non-word artifacts (e.g. ṅṅṅṅṅṅ lō)
    if (/^[ṅñāīūēō\s]{3,}/i.test(clean)) return true;

    return false;
  }

  getCodeSwitchPrompt(langCode = 'mr') {
    switch (langCode) {
      case 'mr':
        return 'Marathi and English code-switching. माझा phone कुठे आहे? Camera चालू करून सांग. आज meeting किती वाजता आहे? मला app मध्ये login करता येत नाही.';
      case 'hi':
        return 'Hindi and English code-switching. मेरा phone कहाँ है? Camera चालू करो. आज meeting कितने बजे है? मुझे app में login करना है.';
      case 'en':
        return 'English speech. Where is my phone? Can you hear my voice? Turn on the camera.';
      case 'gu':
        return 'Gujarati and English code-switching. મારો phone ક્યાં છે? Camera ચાલુ કરો.';
      case 'pa':
        return 'Punjabi and English code-switching. ਮੇਰਾ phone ਕਿੱਥੇ ਹੈ? Camera ਚਾਲੂ ਕਰੋ.';
      default:
        return 'Multilingual speech and English code-switching.';
    }
  }

  executeWhisperPass(wavPath, modelPath, langArg, promptText) {
    return new Promise((resolve) => {
      const promptArg = promptText ? `--prompt "${promptText.replace(/"/g, '\\"')}"` : '';
      const cmd = `"${this.binPath}" -m "${modelPath}" -l ${langArg} -t 8 -nt ${promptArg} -f "${wavPath}"`;
      
      const startTime = Date.now();
      exec(cmd, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const rawOutput = stdout || '';
        const cleanedText = rawOutput
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('whisper_') && !line.startsWith('system_info') && !line.startsWith('main:'))
          .join(' ')
          .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
          .replace(/\[(BLANK_AUDIO|SILENCE|MUSIC|NOISE|TRAFFIC|HORN|CROWD|CHATTER|LAUGHTER|COUGH)\]/gi, '')
          .replace(/\((blank audio|silence|music|noise|traffic|horn|crowd|chatter|laughter|cough)\)/gi, '')
          .trim();

        resolve({
          text: cleanedText,
          durationMs
        });
      });
    });
  }

  async transcribeAudio(audioFilePath, languageCode = 'en') {
    const pipelineStartTime = Date.now();

    const langMeta = getLanguageMeta(languageCode);
    const whisperLang = (langMeta && langMeta.whisperLang) ? langMeta.whisperLang : (languageCode || 'en');

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      console.warn('[STT PIPELINE] Input audio file missing or invalid');
      return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp' };
    }

    const real16kWavPath = path.join(__dirname, '../temp/real_microphone_16k.wav');
    const wav16kPath = this.convertTo16kMonoWav(audioFilePath, real16kWavPath);
    const wavMetrics = this.validateWav(wav16kPath);

    const activeModel = this.getModelPath(false);
    const modelName = path.basename(activeModel);

    console.log(`[STT] Audio duration: ${wavMetrics?.duration || 'unknown'}`);
    console.log(`[STT] Detected language: ${whisperLang}`);
    console.log(`[STT] Previous language context: ${this.previousLanguageContext}`);

    if (fs.existsSync(this.binPath) && fs.existsSync(activeModel)) {
      const codeSwitchPrompt = this.getCodeSwitchPrompt(whisperLang);

      // Pass 1: Run Whisper with code-switching prompt
      let passResult = await this.executeWhisperPass(wav16kPath, activeModel, whisperLang, codeSwitchPrompt);
      let cleanedText = passResult.text;
      let retryTriggered = false;

      // Check if output contains suspicious script (Russian, Arabic, Cyrillic, CJK, etc.)
      const isSuspicious = this.isSuspiciousScript(cleanedText, whisperLang);
      console.log(`[STT] Suspicious language switch: ${isSuspicious}`);

      if (isSuspicious) {
        console.log(`[STT] Suspicious script detected ("${cleanedText}"). Retry triggered...`);
        retryTriggered = true;
        
        // Pass 2: Retry with fallback parameters
        const retryResult = await this.executeWhisperPass(wav16kPath, activeModel, whisperLang, 'Marathi and English code-switching.');
        const retryText = retryResult.text;

        if (!this.isSuspiciousScript(retryText, whisperLang) && retryText.length > 0) {
          cleanedText = retryText;
          console.log(`[STT] Retry successful: "${cleanedText}"`);
        } else {
          // If still suspicious script, reject gibberish
          console.log(`[STT] Retry still produced suspicious script. Clearing garbage output.`);
          cleanedText = '';
        }
      }

      this.previousLanguageContext = whisperLang;

      console.log(`[STT] Retry triggered: ${retryTriggered}`);
      console.log(`[STT] Final transcription: "${cleanedText}"`);

      const totalDuration = Date.now() - pipelineStartTime;
      return {
        text: cleanedText,
        language: languageCode || 'en',
        confidence: cleanedText ? 0.96 : 0,
        inferenceTimeMs: passResult.durationMs,
        totalPipelineDurationMs: totalDuration,
        real16kWavPath,
        engine: `whisper.cpp-${modelName}`,
        wavMetrics
      };
    }

    return { text: '', language: languageCode, confidence: 0, engine: 'whisper.cpp', real16kWavPath };
  }
}

module.exports = new WhisperService();
