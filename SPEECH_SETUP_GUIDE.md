# NAVIDOOR Local Multilingual Speech Pipeline Setup Guide

This guide provides step-by-step instructions for team members to set up and run the 100% offline **Whisper.cpp STT** and **Piper TTS** voice navigation pipeline locally without API keys, cloud services, or external databases.

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
  ▼
Local Piper TTS Engine (piper.exe + en_US-lessac-high.onnx voice model)
  │
  └── Device Speaker Audio Playback
```

---

## 2. Directory Structure

Ensure the following directory structure exists in your project workspace:

```text
NAVIDOOR/
├── backend/
│   ├── bin/
│   │   ├── main.exe                   # Whisper.cpp binary
│   │   └── piper/                     # Piper TTS directory
│   │       ├── piper.exe              # Piper executable
│   │       └── espeak-ng-data/        # Phonetic voice data
│   ├── models/
│   │   ├── whisper/
│   │   │   └── ggml-base.bin          # Multilingual Whisper model (~148 MB)
│   │   └── piper/
│   │       ├── en_US-lessac-high.onnx # Piper ONNX voice model (~114 MB)
│   │       └── en_US-lessac-high.onnx.json
│   ├── services/
│   │   ├── whisperService.js
│   │   └── piperService.js
│   └── temp/                          # Temporary WAV processing folder
```

---

## 3. Automated One-Command Setup Script

To automatically download all required models and binaries, run:

```bash
node backend/scripts/setup_speech_pipeline.js
```

> **Note**: If `setup_speech_pipeline.js` is not present, use the manual download links in Section 4 below.

---

## 4. Manual Model & Binary Download Links

If setting up manually, download the exact files below into their designated folders:

### A. Multilingual Whisper.cpp Model
- **Save Location**: `backend/models/whisper/ggml-base.bin`
- **Download Link**: [HuggingFace ggml-base.bin](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin) (~148 MB)
- **Supported Languages**: 99 languages (English, Hindi, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.).

### B. Piper TTS Voice Model (English Default)
- **Save Location**: `backend/models/piper/en_US-lessac-high.onnx`
- **Download Link (.onnx)**: [HuggingFace ONNX Model](https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx) (~114 MB)
- **Download Link (.json)**: [HuggingFace JSON Config](https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json)

### C. Executable Binaries (Windows AMD64)
- **Whisper CLI Release**: [whisper-bin-x64.zip (v1.5.4)](https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip)
  - Extract `main.exe` and `whisper.dll` to `backend/bin/`.
- **Piper CLI Release**: [piper_windows_amd64.zip (v1.2.0)](https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip)
  - Extract contents into `backend/bin/piper/`.

---

## 5. Verification Commands

Run these commands in PowerShell or Terminal to verify local model execution before launching the app:

### Test 1: Piper TTS Synthesis Test
```powershell
echo "Hello, where is the nearest exit?" | & "backend/bin/piper/piper.exe" --model "backend/models/piper/en_US-lessac-high.onnx" --output_file "backend/temp/test_output.wav"
```
- **Expected Result**: Generates `backend/temp/test_output.wav` (~112 KB audio file in ~0.7 seconds).

### Test 2: Whisper.cpp Transcription Test
```powershell
& "backend/bin/main.exe" -m "backend/models/whisper/ggml-base.bin" -f "backend/temp/test_output.wav" -l en
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
