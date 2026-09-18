# NAVIDOOR Local Multilingual Speech Pipeline Setup Guide

This guide provides step-by-step instructions for team members to set up and run the 100% offline **Whisper.cpp STT** speech pipeline locally without API keys, cloud services, or external databases.

---

## 1. System Architecture

```text
React Native App (expo-av Audio.Recording)
  │
  ├── 16kHz 16-bit Mono PCM WAV Audio
  │
  ▼
Node.js / Express Backend (/api/stt)
  │
  ├── Local Whisper.cpp (main.exe + ggml-base.bin multilingual model)
  │
  ▼
Socket.IO Event Bus & AI Q&A Engine (/api/chat)
  │
  ├── Dynamic response generation from user speech + live camera context
  │
  └── Device Speaker Audio Playback (expo-speech / Web Speech API)
```

---

## 2. Directory Structure

Ensure the following directory structure exists in your project workspace:

```text
NAVIDOOR/
├── backend/
│   ├── bin/
│   │   └── main.exe                   # Whisper.cpp binary
│   ├── models/
│   │   └── whisper/
│   │       └── ggml-base.bin          # Multilingual Whisper model (~148 MB)
│   ├── services/
│   │   └── whisperService.js
│   └── temp/                          # Temporary WAV processing folder
```

---

## 3. Automated One-Command Setup Script

To automatically download all required models and binaries, run:

```bash
node backend/scripts/setup_speech_pipeline.js
```

---

## 4. Manual Model & Binary Download Links

If setting up manually, download the exact files below into their designated folders:

### A. Multilingual Whisper.cpp Model
- **Save Location**: `backend/models/whisper/ggml-base.bin`
- **Download Link**: [HuggingFace ggml-base.bin](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin) (~148 MB)
- **Supported Languages**: 99 languages (English, Hindi, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.).

### B. Executable Binaries (Windows AMD64)
- **Whisper CLI Release**: [whisper-bin-x64.zip (v1.5.4)](https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip)
  - Extract `main.exe` and `whisper.dll` to `backend/bin/`.

---

## 5. Verification Command

Run this command in PowerShell or Terminal to verify local model execution:

```powershell
& "backend/bin/main.exe" -m "backend/models/whisper/ggml-base.bin" -f "backend/temp/sample.wav" -l en
```
- **Expected Result Output**:
  ```text
  [00:00:00.000 --> 00:00:02.160]   Hello, where is the nearest exit?
  ```

---

## 6. Running the Application

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Start Backend Server**:
   ```bash
   npm run server
   ```
   *(Backend runs on `http://localhost:5001`)*

3. **Start Mobile / Web Frontend**:
   ```bash
   npx expo start
   ```

---

## 7. Troubleshooting & Notes

- **WAV Audio Format**: Whisper.cpp requires 16kHz 16-bit Mono PCM WAV files. `whisperService.js` automatically resamples input audio to 16kHz before processing.
- **Git Ignore**: The model files (`.bin`, `.onnx`), executables (`.exe`), and extracted data folders (`espeak-ng-data/`) are ignored in `.gitignore` to keep source control light.
- **Offline Guarantee**: No internet connection, API keys, or cloud endpoints are required during runtime.
