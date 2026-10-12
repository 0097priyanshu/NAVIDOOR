const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const binPath = path.join(__dirname, '../bin/server.exe');
const modelPath = path.join(__dirname, '../models/whisper/ggml-base.bin');
const sampleWav = path.join(__dirname, '../temp/test_clean_16k.wav');

console.log('Testing whisper server.exe with preloaded ggml-base.bin...');

const proc = spawn(binPath, ['-m', modelPath, '-l', 'mr', '--port', '8089', '-t', '8']);

function sendMultipartQuery(filePath, language = 'mr') {
  return new Promise((resolve, reject) => {
    const boundary = '----WhisperServerBoundary' + Math.random().toString(16).substring(2);
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    let bodyParts = [];
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`));
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/wav\r\n\r\n`));
    bodyParts.push(fileBuffer);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const totalBody = Buffer.concat(bodyParts);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 8089,
      path: `/inference?language=${language}&response_format=json`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalBody.length
      }
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk.toString());
      res.on('end', () => resolve({ status: res.statusCode, data: respData }));
    });

    req.on('error', reject);
    req.write(totalBody);
    req.end();
  });
}

setTimeout(async () => {
  console.log('\nSending test request to preloaded server.exe (ggml-base.bin)...');
  try {
    if (fs.existsSync(sampleWav)) {
      const startTime = Date.now();
      const res = await sendMultipartQuery(sampleWav, 'mr');
      const latency = Date.now() - startTime;
      console.log(`\n========================================`);
      console.log(`[BASE IN-MEMORY SERVER RESULT] Status: ${res.status} | Latency: ${latency} ms`);
      console.log(`[BASE IN-MEMORY SERVER RESULT] Output: "${res.data.trim()}"`);
      console.log(`========================================\n`);
    }
  } catch (err) {
    console.error('[ERROR]:', err);
  } finally {
    proc.kill();
    process.exit(0);
  }
}, 2500);
