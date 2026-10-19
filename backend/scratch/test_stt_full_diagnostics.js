const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

const binPath = path.join(__dirname, '../bin/main.exe');
const baseModelPath = path.join(__dirname, '../models/whisper/ggml-base.bin');
const smallModelPath = path.join(__dirname, '../models/whisper/ggml-small.bin');

const wavCleanPath = path.join(__dirname, '../temp/test_clean_16k.wav');

function runWhisperModel(wavPath, modelPath, langCode = 'mr') {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const cmd = `"${binPath}" -m "${modelPath}" -l ${langCode} -t 8 -nt -f "${wavPath}"`;
    exec(cmd, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      const durationMs = Date.now() - t0;
      const raw = stdout || '';
      const cleaned = raw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('whisper_') && !l.startsWith('system_info') && !l.startsWith('main:'))
        .join(' ')
        .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
        .replace(/\[(BLANK_AUDIO|SILENCE|MUSIC|NOISE)\]/gi, '')
        .trim();

      resolve({
        text: cleaned,
        latencyMs: durationMs,
        modelName: path.basename(modelPath)
      });
    });
  });
}

async function testModels() {
  console.log('\n==================================================');
  console.log('MODEL COMPARISON FOR MARATHI (-l mr)');
  console.log('==================================================');

  if (fs.existsSync(baseModelPath)) {
    const resBase = await runWhisperModel(wavCleanPath, baseModelPath, 'mr');
    console.log(`\nBase Model (${path.basename(baseModelPath)}):`);
    console.log(`Latency: ${resBase.latencyMs} ms`);
    console.log(`Transcription: "${resBase.text}"`);
  }

  if (fs.existsSync(smallModelPath)) {
    const resSmall = await runWhisperModel(wavCleanPath, smallModelPath, 'mr');
    console.log(`\nSmall Model (${path.basename(smallModelPath)}):`);
    console.log(`Latency: ${resSmall.latencyMs} ms`);
    console.log(`Transcription: "${resSmall.text}"`);
  }
}

testModels();
