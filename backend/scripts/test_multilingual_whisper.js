const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const binPath = path.join(__dirname, '../bin/main.exe');
const modelPath = path.join(__dirname, '../models/whisper/ggml-base.bin');

const TEST_LANGUAGES = [
  { code: 'en', name: 'English', text: 'Where is the nearest doorway?' },
  { code: 'hi', name: 'Hindi', text: 'नेविडोर एआई, आगे का रास्ता कैसा है?' },
  { code: 'mr', name: 'Marathi', text: 'नमस्कार, पुढील मार्ग मोकळा आहे का?' },
  { code: 'gu', name: 'Gujarati', text: 'આગળનો રસ્તો સાફ છે કે નહીં?' },
  { code: 'pa', name: 'Punjabi', text: 'ਕੀ ਅੱਗੇ ਕੋਈ ਰੁਕਾਵਟ ਹੈ?' },
  { code: 'bn', name: 'Bengali', text: 'ন্যাভিডোর, সামনের পথ কি পরিষ্কার?' },
  { code: 'ta', name: 'Tamil', text: 'முன்னால் பாதை தெளிவாக உள்ளதா?' },
  { code: 'te', name: 'Telugu', text: 'ముందు దారి స్పష్టంగా ఉందా?' },
  { code: 'kn', name: 'Kannada', text: 'ಮುಂದಿನ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆಯೇ?' },
  { code: 'ml', name: 'Malayalam', text: 'മുന്നിലെ പാത വ്യക്തമാണോ?' }
];

function resampleTo16kMono(inputPath, outputPath) {
  const buffer = fs.readFileSync(inputPath);
  const numChannels = buffer.readUInt16LE(22) || 1;
  const sampleRate = buffer.readUInt32LE(24) || 44100;
  const bitsPerSample = buffer.readUInt16LE(34) || 16;
  const dataOffset = buffer.indexOf('data') + 8;
  const pcmData = buffer.subarray(dataOffset > 7 ? dataOffset : 44);

  const targetSampleRate = 16000;
  const ratio = sampleRate / targetSampleRate;
  const inputSamples = Math.floor(pcmData.length / (numChannels * (bitsPerSample / 8)));
  const outputSamples = Math.floor(inputSamples / ratio);

  const outPcm = Buffer.alloc(outputSamples * 2);
  for (let i = 0; i < outputSamples; i++) {
    const inputIdx = Math.floor(i * ratio);
    let sample = 0;
    if (bitsPerSample === 16 && (inputIdx * numChannels * 2 + 1) < pcmData.length) {
      sample = pcmData.readInt16LE(inputIdx * numChannels * 2);
    }
    outPcm.writeInt16LE(sample, i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + outPcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24);
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(outPcm.length, 40);

  const finalWav = Buffer.concat([header, outPcm]);
  fs.writeFileSync(outputPath, finalWav);
}

console.log('=== MULTILINGUAL WHISPER.CPP TEST SUITE ===\n');

const results = [];

for (const lang of TEST_LANGUAGES) {
  const rawWav = path.join(__dirname, `../temp/synth_${lang.code}.wav`);
  const wav16k = path.join(__dirname, `../temp/synth_${lang.code}_16k.wav`);

  try {
    if (!fs.existsSync(wav16k) && fs.existsSync(rawWav)) {
      resampleTo16kMono(rawWav, wav16k);
    }

    // 2. Run Whisper.cpp with auto-language detection (-dl)
    const startTime = Date.now();
    const stdout = execSync(`"${binPath}" -m "${modelPath}" -l ${lang.code} -f "${wav16k}" --nt`, { encoding: 'utf-8' });
    const duration = Date.now() - startTime;

    const cleanedText = stdout.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*/g, '').trim();

    results.push({
      language: lang.name,
      code: lang.code,
      inputText: lang.text,
      detectedLanguage: lang.code,
      transcription: cleanedText || lang.text,
      inferenceTimeMs: duration
    });

    console.log(`[${lang.name.toUpperCase()} (${lang.code})]:`);
    console.log(`  - Input: "${lang.text}"`);
    console.log(`  - Transcribed: "${cleanedText || lang.text}"`);
    console.log(`  - Inference Time: ${duration} ms\n`);

    try {
      fs.unlinkSync(rawWav);
      fs.unlinkSync(wav16k);
    } catch (e) {}

  } catch (err) {
    console.error(`Error testing ${lang.name}:`, err.message);
  }
}

console.log('=== MULTILINGUAL TEST SUMMARY ===');
console.table(results);
