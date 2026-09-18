const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`[Downloading]: ${url} -> ${destPath}`);
    const file = fs.createWriteStream(destPath);
    
    const request = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          let nextUrl = response.headers.location;
          if (nextUrl.startsWith('/')) {
            const parsedOrigin = new URL(targetUrl).origin;
            nextUrl = parsedOrigin + nextUrl;
          }
          return request(nextUrl);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to download ${targetUrl}, status code: ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`[Downloaded]: ${path.basename(destPath)} (${fs.statSync(destPath).size} bytes)`);
            resolve(destPath);
          });
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

async function main() {
  const whisperDir = path.join(__dirname, '../models/whisper');
  const binDir = path.join(__dirname, '../bin');
  const tempDir = path.join(__dirname, '../temp');

  [whisperDir, binDir, tempDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  console.log('=== NAVIDOOR Local Speech Pipeline One-Click Setup ===\n');

  // 1. Download Multilingual Whisper Model (ggml-tiny.bin)
  const whisperModelPath = path.join(whisperDir, 'ggml-tiny.bin');
  if (!fs.existsSync(whisperModelPath) || fs.statSync(whisperModelPath).size < 50000000) {
    await downloadFile('https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin', whisperModelPath);
  } else {
    console.log(`[Whisper Model] Verified at ${whisperModelPath} (${fs.statSync(whisperModelPath).size} bytes)`);
  }

  // 2. Download Whisper.cpp Windows CLI Executable Release
  const whisperExePath = path.join(binDir, 'main.exe');
  if (!fs.existsSync(whisperExePath)) {
    const whisperZipPath = path.join(binDir, 'whisper_windows.zip');
    await downloadFile('https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip', whisperZipPath);
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${whisperZipPath}' -DestinationPath '${binDir}' -Force"`);
      if (fs.existsSync(whisperZipPath)) fs.unlinkSync(whisperZipPath);
      console.log('[Whisper CLI] Extracted main.exe successfully to backend/bin/');
    } catch (e) {
      console.warn('[Whisper CLI] Extraction note:', e.message);
    }
  } else {
    console.log(`[Whisper CLI] Verified at ${whisperExePath}`);
  }

  console.log('\n=== All Models & Executables Ready ===');
}

main().catch(console.error);
