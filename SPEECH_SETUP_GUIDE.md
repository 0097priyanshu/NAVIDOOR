# NAVIDOOR Local Multilingual Speech Pipeline Setup & Architecture Guide

This guide provides step-by-step instructions for team members to set up, run, and verify the 100% offline **Whisper.cpp STT** and voice assistant pipeline locally without cloud dependencies, API keys, or external databases.

---

## 1. System Architecture

```text
React Native App (expo-av / expo-audio)
  │
  ├── Real-Time Native VAD Metering (isMeteringEnabled: true)
  │   - Threshold: > -42 dB
  │   - Min Listening Window: 2.0s
  │   - Post-Speech Silence Window: 2.2s (tolerates natural pauses)
  │   - Safety Max Timeout: 10.0s
  │
  ▼ Local .m4a / audio buffer
Node.js / Express Backend (/api/stt)
  │
  ├── Clean 16kHz 16-bit Mono PCM WAV Resampling (FFmpeg)
  │   - No destructive lowpass/highpass filtering
  │   - Full 0–8000Hz speech bandwidth preserved
  │   - Pre-inference audio validation (sampleRate, RMS, peak amplitude)
  │
  ▼ 16kHz Mono WAV (real_microphone_16k.wav)
Local Whisper.cpp (main.exe + ggml-base.bin)
  │
  ├── Code-Switching Prompt Priming (--prompt "Marathi and English code-switching...")
  │   - Preserves bilingual phrases (e.g. "माझा phone कुठे आहे?")
  │   - Suspicious script detector (catches unexpected Russian/Arabic output)
  │   - Automatic 1-pass retry if suspicious script is detected
  │
  ▼ Clean Native Transcription
Pre-LLM Validation & Clarification Layer
  │
  ├── isUnusableGarbage rejects empty/repeating noise tokens
  ├── Direct match for audibility checks ("माझा आवाज ऐकू येत आहे का?")
  └── Direct native prompt to local Ollama LLM (Llama 3.2 on port 11434)
```

---

## 2. Directory Structure

Ensure the following files and directories exist in your workspace:

```text
NAVIDOOR/
├── backend/
│   ├── bin/
│   │   ├── main.exe                   # Whisper.cpp binary
│   │   └── whisper.dll                # Whisper C++ shared runtime library
│   ├── models/whisper/
│   │   ├── ggml-base.bin              # Multilingual Whisper model (~141 MB, fast)
│   │   └── ggml-small.bin             # Multilingual Whisper model (~487 MB, precise)
│   ├── services/
│   │   ├── whisperService.js          # Clean resampling, code-switching, script validation
│   │   └── aiAssistantService.js      # Direct native prompting, decision logging, safety check
│   ├── temp/                          # Temporary WAV processing folder
│   ├── test_5pass_marathi_verification.js
│   ├── test_codeswitching_10cases.js
│   └── test_response_generation_verification.js
```

---

## 3. Automated One-Command Setup Script

To automatically download all required models and binaries, run:

```bash
node backend/scripts/setup_speech_pipeline.js
```

---

## 4. Manual Model & Binary Download Links

If setting up manually, place the following files in their designated directories:

### A. Multilingual Whisper.cpp Models
- **Model Base (Recommended for speed ~400ms)**:
  - **Path**: `backend/models/whisper/ggml-base.bin`
  - **Download**: [HuggingFace ggml-base.bin](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin) (~141 MB)
- **Model Small (High precision)**:
  - **Path**: `backend/models/whisper/ggml-small.bin`
  - **Download**: [HuggingFace ggml-small.bin](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin) (~487 MB)

### B. Windows AMD64 Executable Binaries
- **Whisper CLI Release**: [whisper-bin-x64.zip (v1.5.4)](https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip)
  - Extract `main.exe` and `whisper.dll` to `backend/bin/`.

---

## 5. Verification & Diagnostic Commands

Run these test suites from the root directory to verify pipeline correctness:

### A. Verify 5 Consecutive Marathi Speech Capture Passes
```bash
node backend/test_5pass_marathi_verification.js
```
- **Expected Output**: 5/5 passes successful with latency under ~4.5s and correct Marathi response:
  ```text
  Overall Pass Rate: 5 / 5 (100%)
  Final Response: "हो, तुमचा आवाज ऐकू येत आहे."
  ```

### B. Verify Bilingual Code-Switching (Marathi + English)
```bash
node backend/test_codeswitching_10cases.js
```
- **Expected Output**: 10/10 test cases passed without converting English words to Devanagari or hallucinating Russian/Arabic scripts.

### C. Verify LLM Response Generation & Clarification Safety
```bash
node backend/test_response_generation_verification.js
```
- **Expected Output**: Rejects nonsense input and returns localized clarification:
  ```text
  Input: "कुवैती केक झझझ"
  Final response: "मला नीट समजलं नाही. कृपया पुन्हा सांगा."
  ```

## 6. Running the Application

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Backend Server**:
   ```bash
   npm run server
   ```
   *(Backend runs on `http://localhost:5001` — LAN accessible)*

3. **Start Ollama LLM** (Ensure running on `127.0.0.1:11434`):
   ```bash
   ollama run llama3.2
   ```

4. **Start Mobile / Web Frontend**:
   ```bash
   npm start
   # Or for remote testing via Expo tunnel:
   npm run tunnel
   ```

---

## 7. Troubleshooting & Important Notes

- **On-Demand VAD vs Background Wake-Word Loops**: The voice assistant is triggered on demand via the Accessible Unified Mic Button (featuring expanding visual/tactile aura and audio chime) and utilizes mobile-native VAD metering (`isMeteringEnabled: true`). This ensures instant speech turnaround (~400ms) without heavy background audio capture loops that drain mobile batteries or freeze the camera thread.
- **Destructive Filters Warning**: Do not re-introduce aggressive lowpass (`lowpass=f=3800`) or high-volume boost filters. Speech recognition in Indic languages relies on high-frequency formants (fricatives and sibilants) between 4000 Hz and 7000 Hz.
- **Code-Switching Context**: Whisper.cpp supports natural mixing of English technical terms (e.g., *phone, meeting, camera, app, login*) when primed with `--prompt`.
- **Zero Cloud Leakage**: All speech recognition, LLM reasoning, and audio synthesis operate 100% locally on your machine.

