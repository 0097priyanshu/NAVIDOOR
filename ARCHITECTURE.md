# NAVIDOOR — Full Tech Stack & Architecture Breakdown

## What Is This App?

**NAVIDOOR** is an Indian, offline-first AI accessibility assistant and dual-portal ecosystem designed for visually impaired users and their family caregivers.
It runs as a cross-platform mobile application (React Native / Expo with a parallel Flutter client) offering two distinct role experiences:
1. **NAVIDOOR User Mode**: AI vision assist, live camera hazard detection (**YOLOv11**), local LLM voice assistant with bilingual code-switching, and 12 navigation modes.
2. **Family Companion Portal**: Dedicated visual dashboard for caregivers with real-time location monitoring, active journey tracking, emergency SOS alerts, and pairing management.

It communicates with local microservices running on your PC over LAN (Wi-Fi):
- Node.js Express server on port `5001`
- AI4Bharat IndicF5 neural TTS microservice on port `5002`
- YOLOv11 Computer Vision server on port `5003`
- Local Ollama LLM runtime on port `11434`

---

## Repository Structure

```text
NAVIDOOR/
├── App.tsx                  ← Root entry point (Dual-role routing: RoleSelectionScreen | FamilyModeContainer | Main User App)
├── index.js                 ← Registers App with Expo
├── index.html               ← Web entry HTML
├── app.json                 ← Expo config (camera/audio permissions, splash, icon)
├── babel.config.js          ← Babel transpiler config
├── tsconfig.json            ← TypeScript config
├── package.json             ← Node dependencies
├── yolo11n.pt               ← Official Ultralytics YOLOv11 nano model weights
│
├── src/                     ← All React Native frontend code
│   ├── components/          ← UI component hierarchy
│   │   ├── camera/          ← Camera view canvas, photo capture, YOLOv11 bounding boxes overlay
│   │   ├── header/          ← Top status bar (SOS button, profile avatar)
│   │   ├── navigation/      ← Rotating AI Mode Wheel (bottom 12-mode nav)
│   │   ├── overlays/        ← Modular section panels & toast notifications
│   │   │   └── panels/      ← Standalone overlay panels (Emergency, Location, Medical, Settings, etc.)
│   │   ├── onboarding/      ← Role selection screen & voice setup flow
│   │   ├── sos/             ← Emergency SOS modal & location broadcast
│   │   ├── family/          ← Family Companion Portal (Container, Home, Location, Activity, Alerts, Profile tabs)
│   │   ├── designSystem/    ← Design system preview modal
│   │   ├── profile/         ← User profile / medical ID modal
│   │   └── common/          ← Shared components (UnifiedMicButton with animated aura)
│   ├── store/               ← Global state management (Zustand store: useNavidoorStore)
│   ├── services/            ← Backend API clients + voice recording service + socket client
│   ├── theme/               ← Design system tokens, colors, high-contrast themes
│   ├── types/               ← TypeScript type definitions
│   └── utils/               ← Speech utilities, translations, sound effects
│
├── backend/                 ← Node.js Express server (runs on PC / LAN)
│   ├── index.js             ← Main Express server + STT/TTS/Chat REST APIs + Socket.IO server
│   ├── bin/                 ← Whisper.cpp compiled binaries (main.exe, server.exe, whisper.dll)
│   ├── models/whisper/      ← ggml-base.bin (141MB) & ggml-small.bin (487MB)
│   ├── config/languages.js  ← 10 Indian language configs (en, hi, mr, gu, pa, bn, ta, te, kn, ml)
│   ├── indicf5/             ← AI4Bharat IndicF5 Python Neural TTS microservice (port 5002)
│   └── services/
│       ├── whisperService.js     ← Whisper.cpp STT wrapper (clean 16kHz resampling, code-switching, script validation)
│       ├── aiAssistantService.js ← Local Ollama LLM Reasoning Engine (direct native prompting & clarification safety)
│       ├── indicf5Service.js     ← AI4Bharat IndicF5 TTS engine client wrapper
│       ├── socketService.js      ← Socket.IO real-time event hub
│       └── translationService.js ← Regional Indian language translation engine
│
└── yolo/                    ← Python YOLOv11 Computer Vision Service (Port 5003)
    ├── yolo_server.py       ← FastAPI / Flask server with /detect, /detect/bus, /detect/medicine
    ├── test_yolo.py         ← Automated detection & distance estimation test suite
    ├── requirements.txt     ← Python dependencies (ultralytics, torch, opencv-python, flask)
    └── core/
        ├── distance_estimator.py ← Pinhole 3D distance & corridor clearance analyzer
        └── indian_labels.py      ← Indian contextual class mappings & multilingual prompts
```

---

## Tech Stack Overview

### Frontend (React Native / Expo)

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React Native** | 0.74.5 | Cross-platform mobile framework |
| **Expo** | SDK 51 | Dev tooling, camera, audio, haptics, location APIs |
| **TypeScript** | ~5.3.3 | Type safety across entire codebase |
| **Zustand** | ^4.5.2 | Lightweight reactive state management (`useNavidoorStore`) |
| **expo-camera** | ~15.0.16 | Real-time continuous camera feed & high-res photo capture |
| **expo-speech** | ~12.0.2 | Instant offline device TTS fallback |
| **expo-haptics** | ~13.0.1 | Tactile vibration feedback on mode swipes & mic tap |
| **expo-location** | ~17.0.1 | High-precision GPS for live navigation & SOS broadcast |
| **expo-av** / **expo-audio** | SDK 51 | Audio recording with native metering (`isMeteringEnabled: true`) |
| **socket.io-client** | ^4.8.3 | Real-time caregiver live stream & SOS event listener |

### Backend & AI Microservices (PC / LAN)

| Service | Port | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Gateway** | `5001` | Node.js v22+ Express + Socket.IO | Main API gateway, family pairing, socket hub |
| **Speech-to-Text** | `5001` (internal) | `Whisper.cpp` (`main.exe`) | Offline multilingual STT with code-switching |
| **AI Vision Engine** | `5003` | Python 3.10+ + Ultralytics YOLOv11 | Real-time hazard detection & 3D distance estimation |
| **Neural TTS** | `5002` | Python + AI4Bharat IndicF5 PyTorch | Neural voice synthesis for 10 Indian languages |
| **Local LLM Engine** | `11434` | Ollama (`llama3.2` / `qwen2.5-coder`) | Conversational reasoning & vision context Q&A |

---

## Architecture & Data Flow

### 1. Dual-Role Routing (App Startup)

```text
App Launch (App.tsx)
├── Checks userRole in Zustand store
├── Case 'undecided': Renders <RoleSelectionScreen />
│     ├── NAVIDOOR User Card -> Sets userRole = 'navidoor_user', opens voice onboarding
│     └── Family Member Card -> Sets userRole = 'family_member', opens caregiver portal
├── Case 'family_member':
│     ├── If not logged in -> Renders <FamilyAuthScreen />
│     └── If logged in -> Renders <FamilyModeContainer /> (Caregiver Portal)
└── Case 'navidoor_user': Renders main AI Accessibility workspace (<CameraViewCanvas />, <RotatingAIModeWheel />, <SectionViewPanel />)
```

### 2. End-to-End Voice Assistant Pipeline

```text
               ┌────────────────────────────────────────────────────────┐
               │           User Speaks into Microphone                  │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Mobile Native VAD & Audio Capture                    │
               │   - Audio metering active (isMeteringEnabled: true)    │
               │   - Sensitivity: > -42 dB                              │
               │   - Min window: 2.0s | Post-speech silence: 2.2s       │
               │   - Safety timeout: 10.0s                              │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Local .m4a file
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Clean 16kHz PCM WAV Resampling (FFmpeg)              │
               │   - No destructive highpass/lowpass filters            │
               │   - Full 0-8000Hz frequency bandwidth preserved        │
               │   - Pre-inference validation (sampleRate, RMS, peak)   │
               └──────────────────────────┬─────────────────────────────┘
                                          │ 16kHz Mono WAV
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Whisper.cpp Multilingual STT Engine                  │
               │   - ggml-base.bin single-pass greedy decoding (~400ms) │
               │   - Code-switching context primed via --prompt         │
               │   - isSuspiciousScript catches Russian/Arabic gibberish│
               │   - Automatic 1-pass retry if suspicious               │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Clean Transcription (e.g. "माझा phone कुठे आहे?")
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Pre-LLM Validation & Intent Normalization            │
               │   - isUnusableGarbage checks for noise/nonsense        │
               │   - Direct voice audibility match ("आवाज ऐकू येत आहे?") │
               │   - Direct UI control commands (switch mode, settings) │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Valid User Query
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Direct Native Local LLM (Ollama Llama 3.2)          │
               │   - Sent DIRECTLY in native script (no English mangle) │
               │   - Dedicated Accessibility System Prompt              │
               │   - Max 1 short sentence (15 words max, zero fluff)    │
               │   - Clarification safety check fallback                │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Direct Native Response
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │   Speech Playback (AI4Bharat IndicF5 / Device TTS)     │
               └────────────────────────────────────────────────────────┘
```

### 3. YOLOv11 Computer Vision & Hazard Avoidance Pipeline

```text
Continuous Camera Frame (CameraViewCanvas)
   │
   ▼ POST /detect (Base64 JPEG)
Python YOLOv11 Vision Server (Port 5003)
   │
   ├── Ultralytics YOLOv11 Inference (yolo11n.pt ~28ms)
   │
   ├── Pinhole Geometry 3D Distance Calculation:
   │   Distance = (H_real * focal_length) / h_bbox
   │   - CRITICAL: < 1.2m
   │   - WARNING: 1.2m - 2.5m
   │   - INFO: 2.5m - 5.0m
   │
   ├── 3-Corridor Clearance Analysis:
   │   - LEFT, CENTER, RIGHT corridor evaluation
   │   - Recommends path deviations ("Obstacle ahead. Step right.")
   │
   ▼ Return JSON Detections + Safe Path + Spoken Hints
Render Dynamic Bounding Boxes + Tactile Haptic Alert + Spoken Guidance
```

---

## Backend REST & WebSocket Endpoints

| Method | Route | Service | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Backend (5001) | Health check for Backend, IndicF5, and Ollama |
| GET | `/api/languages` | Backend (5001) | Returns metadata for 10 regional Indian languages |
| POST | `/api/stt` | Whisper.cpp | Audio file upload → clean 16kHz WAV → code-switched text |
| POST | `/api/chat` | Ollama LLM | User query + live camera context → concise spoken response |
| POST | `/api/tts` | IndicF5 (5002) | Text + language code → synthesized neural WAV audio |
| POST | `/api/translate` | Backend (5001) | Regional language translation service |
| POST | `/detect` | YOLOv11 (5003) | Frame → YOLOv11 detections + 3D distance + safe corridor |
| POST | `/detect/bus` | YOLOv11 (5003) | Detects arriving buses and boarding door coordinates |
| POST | `/detect/medicine` | YOLOv11 (5003) | Detects medicine bottles, pill strips, and labels |
| POST | `/api/family/login` | Backend (5001) | Caregiver companion portal authentication |
| POST | `/api/family/register` | Backend (5001) | Caregiver companion registration |
| POST | `/api/family/connect` | Backend (5001) | Submit pairing request to user by phone number |
| GET | `/api/family/dashboard-data` | Backend (5001) | Caregiver dashboard metrics (battery, journey, location) |
| WS | Socket.IO Gateway | Backend (5001) | Real-time GPS location streaming, SOS alerts, pairing events |

---

## Key Files Reference

| File | Purpose |
| :--- | :--- |
| `App.tsx` | Root entry point, role-based routing, screen-level gesture handler |
| `src/store/useNavidoorStore.ts` | Central Zustand store managing navigation modes, voice state, detections, and user profile |
| `src/services/voiceRecordingService.ts` | Mobile VAD audio metering (-42 dB, 2.2s silence threshold, 2.0s min window, 10s max window) |
| `src/services/voiceAssistantBackend.ts` | HTTP API client with dynamic LAN auto-discovery via Expo `hostUri` |
| `src/components/camera/CameraViewCanvas.tsx` | Continuous camera stream with live YOLOv11 bounding boxes and distance tags |
| `src/components/navigation/RotatingAIModeWheel.tsx` | Curved 12-mode navigation wheel dock with haptic rotation |
| `backend/index.js` | Express server + Socket.IO hub connecting STT, Chat, TTS, and Family services |
| `backend/services/whisperService.js` | Whisper.cpp wrapper with clean 16kHz resampling, `--prompt` code-switching, and script validation |
| `backend/services/aiAssistantService.js` | Direct native LLM reasoning engine with programmatic validation & clarification safety check |
| `yolo/yolo_server.py` | Python YOLOv11 server with pinhole distance estimation and corridor guidance |
| `yolo/core/distance_estimator.py` | 3D pinhole distance calculator and left/center/right safe corridor analyzer |
