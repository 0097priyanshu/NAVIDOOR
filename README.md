# NAVIDOOR – AI Accessibility & Vision Assist Ecosystem

**NAVIDOOR** is an offline-first, voice-first, camera-first AI accessibility platform built specifically for blind, visually impaired, and elderly users, alongside a dedicated **Family Companion Portal** for caregivers.

The system features a cross-platform mobile client (React Native / Expo & Flutter) operating alongside a local Node.js Express server, real-time **YOLOv11** computer vision inference, offline **Whisper.cpp** Speech-to-Text with natural code-switching, local **Ollama** LLM reasoning, and **AI4Bharat IndicF5** neural Text-to-Speech microservices.

---

## 🌟 Core Design & Technical Philosophy

1. **Camera as the Continuous Canvas**:
   - The camera remains active throughout the application. Changing navigation modes does **NOT** unmount or replace the camera stream.
   - Feature-specific floating overlays (Assist, Navigate, Read, Medicines, Location, Emergency, Medical ID, Settings) render directly over the live stream.
2. **YOLOv11 Dual-Model Vision & Directional Staircase Hazard Avoidance**:
   - Powered by official Ultralytics **YOLOv11** (`yolo11n.pt`) and a specialized fine-tuned **Directional Staircase Model** (`models/yolo11n_staircase.pt`, 5.4MB, 70.5% mAP@50).
   - Accurately identifies `upstair` (ascending) and `downstair` (descending — critical fall risk) with localized voice announcements.
   - **Invisible Background Processing**: Hazard detection, 3D distance estimation, and obstacle proximity beeps operate completely in the background without visual bounding box clutter on screen.
   - **Unified Left `SCAN` Button**: A single tactile button triggers high-resolution scene capture, YOLOv11 inference, distance estimation, and spoken hazard guidance (eliminating redundant buttons).
   - Real-time 3D pinhole distance estimation with categorized risk levels (`CRITICAL` < 1.2m, `WARNING` 1.2m–2.5m, `INFO` 2.5m–5.0m) and dynamic audio beeps.
   - 3-corridor path clearance analysis (LEFT, CENTER, RIGHT) with directional spoken guidance.
   - Powered by official Ultralytics **YOLOv11** (`yolo11n.pt`) running on local Python microservice (`http://0.0.0.0:5003`).
   - **Invisible Background Processing**: Hazard detection, 3D distance estimation, and obstacle proximity beeps operate completely in the background without visual bounding box clutter on screen.
   - **Unified Left `SCAN` Button**: A single tactile button triggers high-resolution scene capture, YOLOv11 inference, distance estimation, and spoken hazard guidance (eliminating redundant buttons).
   - Real-time 3D pinhole distance estimation with categorized risk levels (`CRITICAL` < 1.2m, `WARNING` 1.2m–2.5m, `INFO` 2.5m–5.0m) and dynamic audio beeps.
   - 3-corridor path clearance analysis (LEFT, CENTER, RIGHT) with directional spoken guidance.
3. **Family Companion Portal & Secure QR Pairing**:
   - Single-use 5-minute encrypted QR code pairing (`react-native-qrcode-svg` + `firebase` Firestore / Socket.IO dual-sync).
   - Allows remote caregivers to monitor real-time location, receive emergency SOS notifications, and check active journeys.
4. **Universal Screen Triple-Tap Emergency SOS Trigger**:
   - Designed specifically for blind and visually impaired users who cannot pinpoint a small on-screen button during an emergency.
   - **Triple-tap anywhere on the screen** within an **850ms** window to immediately activate the Emergency SOS modal, play warning alert beeps, trigger tactile haptic feedback, and broadcast live GPS coordinates to family caregivers.
4. **100% Privacy-First & Local AI (Zero Cloud API Keys Required)**:
   - **Speech-to-Text (STT)**: Offline `Whisper.cpp` native binary (`ggml-base.bin` & `ggml-small.bin`) with clean 16kHz PCM resampling, natural bilingual code-switching, and suspicious script/gibberish rejection.
   - **General & Vision AI Engine**: Local **Ollama** open-source LLM (`llama3.2` / `qwen2.5-coder:7b`) for real-time scene perception reasoning and concise spoken Q&A on `http://127.0.0.1:11434`.
   - **Text-to-Speech (TTS)**: **AI4Bharat IndicF5** neural speech synthesis microservice supporting 10 regional Indian languages on port `5002`.
5. **Mobile-Native Voice Activity Detection (VAD) & Hands-Free Audio**:
   - Mobile-native audio metering (`isMeteringEnabled: true`) with calibrated 2.2s silence threshold, -42 dB sensitivity, and 2.0s minimum recording window.
   - Prevents cutting off mid-sentence speech or natural pauses.
   - Accessible floating mic button with animated expanding aura, tactile haptic feedback, and spatial chimes.
6. **Dynamic LAN Auto-Discovery (Zero Hardcoded IPs)**:
   - Automatically resolves PC server IP across physical Android/iOS devices, emulators, and browsers via Expo `hostUri`.

---

## 🌐 Supported Regional Indian Languages (10 Languages)

NAVIDOOR supports full Speech-to-Text (STT), bilingual code-switching, LLM reasoning, translation, and neural Text-to-Speech (TTS) across 10 languages:
- **English** (`en`)
- **Hindi** (`hi` - हिंदी)
- **Marathi** (`mr` - मराठी)
- **Gujarati** (`gu` - ગુજરાતી)
- **Punjabi** (`pa` - ਪੰਜਾਬੀ)
- **Bengali** (`bn` - বাংলা)
- **Tamil** (`ta` - தமிழ்)
- **Telugu** (`te` - తెలుగు)
- **Kannada** (`kn` - ಕನ್ನಡ)
- **Malayalam** (`ml` - മലയാളം)

---

## 🛠 Tech Stack & Port Map

### 📁 Architecture & Components

```text
NAVIDOOR/
├── frontend/    # React Native 0.86 / Expo SDK 57 mobile client (Android, iOS, Web)
├── backend/     # Node.js Express, Socket.IO, STT, and TTS orchestrator
└── yolo/        # Python YOLOv11 AI Vision, Distance Estimation & Hazard Engine
```

| Component | Technology | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **Mobile Frontend** | React Native 0.86.3 / Expo SDK 57 (TypeScript, React 19) | `8081` (Metro) | Continuous camera canvas & Caregiver Portal |
| **Backend Server** | Node.js v22+ Express + Socket.IO | `5001` | REST APIs, Socket.IO gateway, Whisper STT wrapper |
| **YOLOv11 Vision Server** | Python 3.10+ Flask + Ultralytics YOLOv11 | `5003` | Real-time object detection & 3D distance estimation |
| **Neural TTS Server** | AI4Bharat IndicF5 PyTorch microservice | `5002` | Neural speech synthesis across 10 Indian languages |
| **Local LLM Engine** | Ollama (`llama3.2` / `qwen2.5-coder:7b`) | `11434` | Local conversational Q&A & scene interpretation |

---

## 📦 Dependency Installation Guide

Run these steps to set up the complete environment:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install Python microservice packages (YOLOv11, PyTorch, Transformers, F5-TTS)
python -m pip install -r yolo/requirements.txt
python -m pip install -r backend/indicf5/requirements.txt

# 3. Download Whisper.cpp Windows CLI binaries and multilingual speech models
node backend/scripts/setup_speech_pipeline.js
```

---

## 🚀 How to Run the Ecosystem

### Step 1: Start the Local LLM (Ollama)
Ensure [Ollama](https://ollama.com) is running locally:
```bash
ollama run llama3.2
```

### Step 2: Start the YOLO AI Vision Server (Port 5003)
```bash
npm run yolo
# Or directly:
py -3.10 yolo/yolo_server.py
```
*(Verify test suite anytime with `npm run test:yolo`).*

### Step 3: Start the Backend Server (Port 5001)
```bash
npm run server
# Or directly:
node backend/index.js
```
*(Runs on `http://0.0.0.0:5001` - LAN accessible).*

### Step 4: Start the Mobile Application (Frontend)
```bash
npm run tunnel
# Or for local web preview:
npm run web
```
1. Scan the displayed QR code with your phone (**Expo Go** on Android or default **Camera** app on iPhone).
2. The app will bundle and run live with real-time YOLO vision overlays and voice assistance.

---

## 📱 Primary Navigation Modes (12 Modes)

| Mode | Functionality & Overlays |
| :--- | :--- |
| **🏠 ASSIST** | Invisible background YOLOv11 hazard detection, obstacle distance estimation with proximity beeps, safe walking vectors. |
| **🧭 NAVIGATE** | Turn-by-turn AR walking step overlay, destination cards, street name announcements. |
| **📖 READ** | Live OCR text highlighting, IndicF5 TTS read-aloud controls with speech rate adjustment. |
| **💊 MEDICINE** | Prescription label scanner, pill bottle tracker, dosage countdown, voice log confirmation. |
| **🚌 TRANSIT** | Nearby public transit and bus arrival countdowns, bus door detection. |
| **📍 LIVE LOC** | High-precision GPS coordinates, speed, heading, and address sharing. |
| **📞 CALL SOS** | Fast-access emergency contact dialer and emergency dispatch. |
| **🩺 MEDICAL** | Medical ID card (blood group, allergies, chronic conditions, primary physician). |
| **👥 FAMILY** | One-tap connection to Caregiver stream and remote companion portal. |
| **🕒 HISTORY** | Activity log and saved text reading history. |
| **🌐 LANG** | Interactive switcher for all 10 regional Indian languages. |
| **⚙ SETTINGS** | Contrast themes (Standard Slate, High-Contrast Dark, High-Contrast Amber) and speech rate. |

---

## 🎙️ Speech Pipeline & Code-Switching Architecture

### A. Audio Capture & Mobile VAD
- **Expo Audio Metering**: Monitors audio levels in real time (`isMeteringEnabled: true`).
- **2.2s Silence Window**: Tolerates natural pauses without cutting off speech mid-sentence.
- **2.0s Minimum Window**: Prevents premature cutoff before the user completes their thought.
- **-42 dB Sensitivity**: Reliably detects softer speech while filtering background room rumble.

### B. Clean 16kHz Resampling
- Highpass/lowpass filters that previously clipped audio or stripped high-frequency consonants have been replaced with **clean 16kHz 16-bit Mono PCM WAV resampling** (`ffmpeg -ar 16000 -ac 1 -c:a pcm_s16le`).
- Full speech bandwidth (0–8000 Hz) is preserved for crisp Devanagari fricatives and sibilants.

### C. Bilingual Code-Switching & Gibberish Rejection
- Primed with context prompts (`--prompt "Marathi and English code-switching. माझा phone कुठे आहे? Camera चालू करून सांगा."`), preserving English technical words (`phone`, `meeting`, `camera`, `app`, `login`) alongside native Devanagari text.
- Real-time `isSuspiciousScript` validator catches and retries accidental Cyrillic (Russian) or Arabic script hallucinations.

### D. Direct Native LLM Prompting & Clarification Layer
- User queries are fed directly to Llama 3.2 in their native script without lossy round-trip English translation.
- Pre-LLM validation filters garbled input and immediately responds with concise clarification:
  - **Marathi**: `"मला नीट समजलं नाही. कृपया पुन्हा सांगा."`
  - **Hindi**: `"मुझे ठीक से समझ नहीं आया। कृपया फिर से कहें।"`
  - **English**: `"I didn't quite catch that. Please repeat."`

---

## 🚨 Emergency SOS & Family Companion Portal

- **Universal Screen Triple-Tap Gesture**:
  - Tapping **3 times anywhere on the screen** within an 850ms window immediately activates the Emergency SOS modal.
  - Automatically sounds alert beeps, triggers tactile warning haptics, and streams live GPS coordinates and device battery to caregivers via Socket.IO.
- **Floating Emergency SOS Button**:
  - Top-right safety-coral alert button with a 5-second hold countdown and loud audible chime.
- **Platform-Aware Header Spacing**:
  - CameraHeader and CameraControlsOverlay feature responsive, platform-aware top offsets to ensure zero overlap between header buttons and camera control pills on iOS, Android, and Web.
- **Remote Family Companion Portal**:
  - Caregiver dashboard (`userRole = 'family_member'`) featuring 5 tabs:
    1. **HOME**: Live GPS map card, monitored user telemetry (battery, steps, medication schedule).
    2. **LOCATION**: Breadcrumb journey route map, speed, accuracy, and safe zones.
    3. **ACTIVITY**: User timeline of actions and obstacle encounters.
    4. **ALERTS**: SOS alert log and critical notifications.
    5. **PROFILE**: Caregiver profile and user pairing manager.

---

## 🧪 Verification & Diagnostic Scripts

Execute the automated test suites inside `backend/`:

```bash
# 1. Verify 10 code-switching and multilingual speech test cases
node backend/test_codeswitching_10cases.js

# 2. Verify 5-pass Marathi speech capture & turnaround latency
node backend/test_5pass_marathi_verification.js

# 3. Verify LLM response generation & clarification safety check
node backend/test_response_generation_verification.js

# 4. Verify YOLOv11 detection, distance estimation, and corridor clearance
npm run test:yolo
# Or directly:
py -3.10 yolo/test_yolo.py
```

