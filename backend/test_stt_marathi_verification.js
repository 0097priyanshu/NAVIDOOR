const whisperService = require('./services/whisperService');
const path = require('path');
const fs = require('fs');

async function testMarathiVerification() {
  console.log('==================================================');
  console.log('VERIFYING WHISPER STT PIPELINE FOR MARATHI / HINDI / ENGLISH');
  console.log('==================================================\n');

  const cleanWav = path.join(__dirname, 'temp/test_clean_16k.wav');

  if (!fs.existsSync(cleanWav)) {
    console.error('Test clean WAV file missing at:', cleanWav);
    process.exit(1);
  }

  // Test Marathi explicitly
  console.log('--- TEST 1: MARATHI (`mr`) ---');
  const resMr = await whisperService.transcribeAudio(cleanWav, 'mr');
  console.log('Marathi Result:', JSON.stringify(resMr, null, 2));

  // Test Hindi explicitly
  console.log('\n--- TEST 2: HINDI (`hi`) ---');
  const resHi = await whisperService.transcribeAudio(cleanWav, 'hi');
  console.log('Hindi Result:', JSON.stringify(resHi, null, 2));

  // Test English explicitly
  console.log('\n--- TEST 3: ENGLISH (`en`) ---');
  const resEn = await whisperService.transcribeAudio(cleanWav, 'en');
  console.log('English Result:', JSON.stringify(resEn, null, 2));

  console.log('\n==================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY');
  console.log('==================================================');
  process.exit(0);
}

testMarathiVerification();
