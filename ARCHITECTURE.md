# NAVIDOOR — Full Tech Stack & Architecture Breakdown

## What Is This App?

**NAVIDOOR** is an Indian, offline-first AI accessibility assistant and dual-portal ecosystem designed for blind, visually impaired, and elderly users and their family caregivers.
It runs as a cross-platform mobile application (React Native / Expo with a parallel Flutter client) offering two distinct role experiences:
1. **NAVIDOOR User Mode**: Continuous AI vision assist, live camera hazard detection (**YOLOv11**), local LLM voice assistant with bilingual code-switching, 12 navigation modes, and universal screen gesture triggers.
2. **Family Companion Portal**: Dedicated visual dashboard for caregivers with real-time location monitoring, active journey tracking, emergency SOS alerts, and pairing management.

It communicates with local microservices running on your PC over LAN (Wi-Fi):
- Node.js Express server on port `5001`
- AI4Bharat IndicF5 neural TTS microservice on port `5002`
- YOLOv11 Triple-Model Computer Vision server on port `5003` (80 COCO classes + custom directional staircase + fine-tuned pothole hazard model)
- Local Ollama LLM runtime on port `11434`

---

## Repository Structure

```text
NAVIDOOR/
├── package.json             ← Root scripts (npm run start, server, yolo, tunnel, web)
├── yolo11n.pt               ← Official Ultralytics YOLOv11 nano model weights
├── ARCHITECTURE.md          ← System architecture, data flow & component design
├── README.md                ← Project overview, setup instructions & feature guide
├── SPEECH_SETUP_GUIDE.md    ← Multilingual Whisper.cpp & local speech setup guide
│
├── frontend/                ← React Native / Expo Mobile Application
│   ├── App.tsx              ← Root entry point (Triple-tap gesture interceptor, dual-role routing)
│   ├── index.js             ← Registers App with Expo
│   ├── index.html           ← Web entry HTML
│   ├── app.json             ← Expo config (permissions, splash, icons, plugins)
│   ├── babel.config.js      ← Babel transpiler config
│   ├── tsconfig.json        ← TypeScript config
│   ├── package.json         ← Frontend dependencies (Expo SDK 57, RN 0.86, React 19)
│   └── src/                 ← Frontend source hierarchy
│       ├── components/      ← UI component hierarchy
│       │   ├── camera/      ← Camera view canvas, unified controls (left SCAN), invisible YOLO overlay
│       │   ├── header/      ← Top status bar (Emergency SOS button, profile avatar, spacing-aware)
│       │   ├── navigation/  ← Rotating AI Mode Wheel (bottom 12-mode nav)
│       │   ├── overlays/    ← Modular section panels & toast notifications
│       │   │   └── panels/  ← Standalone overlay panels (Emergency, Location, Medical, Settings, etc.)
│       │   ├── onboarding/  ← Role selection screen & voice setup flow
│       │   ├── sos/         ← Emergency SOS modal, warning chime, and GPS broadcast
│       │   ├── family/      ← Family Companion Portal (Home, Location, Activity, Alerts, Profile)
│       │   ├── designSystem/← Design system preview modal
│       │   ├── profile/     ← User profile / medical ID modal
│       │   └── common/      ← Shared components (UnifiedMicButton with animated aura)
│       ├── store/           ← Global state management (Zustand store: useNavidoorStore)
│       ├── services/        ← Backend API clients, VAD audio recording, and Socket.IO client
│       ├── theme/           ← Design system tokens, colors, high-contrast themes
│       ├── types/           ← TypeScript type definitions
│       └── utils/           ← Speech utilities, translations, sound effects
│
├── backend/                 ← Node.js Express server (runs on PC / LAN)
│   ├── index.js             ← Main Express server + STT/TTS/Chat REST APIs + Socket.IO server
│   ├── bin/                 ← Whisper.cpp compiled binaries (main.exe, server.exe, whisper.dll)
│   ├── models/whisper/      ← ggml-base.bin (141MB) & ggml-small.bin (487MB)
│   ├── config/languages.js  ← 10 Indian language configs (en, hi, mr, gu, pa, bn, ta, te, kn, ml)
│   ├── indicf5/             ← AI4Bharat IndicF5 Python Neural TTS microservice (port 5002)
│   ├── scripts/             ← Automated setup scripts (setup_speech_pipeline.js)
│   └── services/
│       ├── whisperService.js     ← Whisper.cpp STT wrapper (clean 16kHz resampling, code-switching)
│       ├── aiAssistantService.js ← Local Ollama LLM Reasoning Engine (direct native prompting)
│       ├── indicf5Service.js     ← AI4Bharat IndicF5 TTS engine client wrapper
│       ├── socketService.js      ← Socket.IO real-time event hub (GPS & SOS broadcast)
│       └── translationService.js ← Regional Indian language translation engine
│
└── yolo/                    ← Python YOLOv11 Computer Vision Service (Port 5003)
    ├── yolo_server.py       ← Flask REST server with /detect, /detect/bus, /detect/medicine
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
| **React Native** | 0.86.3 | Cross-platform mobile framework (Architecture v0.86) |
| **Expo** | SDK 57 | Modern runtime, camera, audio, haptics, location APIs |
| **React** | 19.2.3 | Modern React core runtime |
| **TypeScript** | ^5.4.0 | End-to-end type safety across mobile application |
| **Zustand** | ^4.5.2 | Lightweight reactive state management (`useNavidoorStore`) |
| **expo-camera** | ~57.0.5 | Continuous camera feed & high-res photo capture |
| **expo-audio** | ^57.0.5 | Native audio recording with real-time metering (`isMeteringEnabled: true`) |
| **expo-speech** | ~57.0.3 | Instant offline device TTS fallback |
| **expo-haptics** | ~57.0.3 | Tactile vibration feedback on gestures, scans & warnings |
| **expo-location** | ~57.0.20 | High-precision GPS coordinates for live navigation & SOS broadcast |
| **socket.io-client** | ^4.8.3 | Real-time caregiver live stream & emergency event dispatch |

### Backend & AI Microservices (PC / LAN)

| Service | Port | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Gateway** | `5001` | Node.js v22+ Express + Socket.IO | Main API gateway, family pairing, socket hub |
| **Speech-to-Text** | `5001` (internal) | `Whisper.cpp` (`main.exe`) | Offline multilingual STT with natural code-switching |
| **AI Vision Engine** | `5003` | Python 3.10+ + Ultralytics YOLOv11 | Real-time hazard detection & 3D distance estimation |
| **Neural TTS** | `5002` | Python + AI4Bharat IndicF5 PyTorch | Neural voice synthesis for 10 Indian languages |
| **Local LLM Engine** | `11434` | Ollama (`llama3.2` / `qwen2.5-coder`) | Conversational reasoning & vision context Q&A |

---

## Architecture & Data Flow

### 1. Dual-Role Routing & Screen Accessibility Triggers

```text
App Launch (frontend/App.tsx)
├── Checks userRole in Zustand store
├── Case 'undecided': Renders <RoleSelectionScreen />
│     ├── NAVIDOOR User Card -> Sets userRole = 'navidoor_user', opens voice onboarding
│     └── Family Member Card -> Sets userRole = 'family_member', opens caregiver portal
├── Case 'family_member':
│     ├── If not logged in -> Renders <FamilyAuthScreen />
│     └── If logged in -> Renders <FamilyModeContainer /> (Caregiver Portal)
└── Case 'navidoor_user': Renders main AI Accessibility workspace
      ├── <CameraViewCanvas /> (Continuous camera canvas)
      ├── <CameraHeader /> (Platform-aware spacing, SOS & Profile buttons)
      ├── <SectionViewPanel /> (12 feature panels)
      ├── <RotatingAIModeWheel /> (Haptic 12-mode wheel + Unified Mic button)
      └── <SectionToastNotification />
```

#### Universal Screen Triple-Tap Gesture (Emergency SOS Trigger)
For blind and visually impaired users, finding a specific on-screen button during an emergency or disorientation is extremely difficult. NAVIDOOR incorporates a universal screen-wide gesture:
- **Detection**: Handled at the root in [`frontend/App.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/App.tsx) via `PanResponder` (`onStartShouldSetPanResponderCapture`) on mobile and a capturing `pointerdown` listener on web.
- **Gesture Rule**: Tapping 3 times anywhere on the screen within an **850ms** rolling window (with 70ms tap deduplication).
- **Behavior**:
  1. Captures the 3rd tap to avoid firing buttons underneath.
  2. Triggers `triggerSosAlert()` in [`frontend/src/store/useNavidoorStore.ts`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/store/useNavidoorStore.ts).
  3. Promotes `userRole` to `'navidoor_user'` automatically if currently undecided.
  4. Triggers warning haptics (`Haptics.NotificationFeedbackType.Warning`).
  5. Plays alert warning beeps and opens `<SOSModal />`.
  6. Emits `emergency:sos` over Socket.IO with user GPS coordinates and battery telemetry to linked caregivers.

---

### 2. End-to-End Voice Assistant Pipeline

```text
               ┌────────────────────────────────────────────────────────┐
               │           User Taps Floating Mic Button                │
               │           (Animated expanding aura feedback)           │
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

---

### 3. YOLOv11 Computer Vision & Invisible Hazard Avoidance Pipeline

```text
Unified Left SCAN Button Pressed (CameraControlsOverlay)
   │
   ▼ High-Resolution Frame Captured
Python YOLOv11 Vision Server (Port 5003: POST /detect)
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
Invisible Background Processing:
   ├── Tactile Haptic Pulses (Heavy on CRITICAL, Medium on WARNING)
   ├── Proximity Beep Audio Feedback (Frequency increases as distance decreases)
   ├── Natural Voice Guidance Announcement via TTS
   └── Clean UI Canvas: Bounding boxes work invisibly in the background
```

#### Non-Overlapping Platform Spacing
The camera interface utilizes platform-specific safe-area insets (`Platform.OS === 'web'`, `android`, `ios`) across:
- `<CameraHeader />`: Anchored to the top with responsive status bar padding.
- `<CameraControlsOverlay />`: Top margin positioned safely below the header buttons (Emergency SOS and Profile) so controls never overlap.
- `<AIVisionOverlay />`: Respects the same top offset guidelines for clean visual hierarchy.

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
| POST | `/api/family/register-token` | Backend (5001) | Register secure 5-minute single-use pairing QR token |
| POST | `/api/family/claim-token` | Backend (5001) | Validate & claim pairing token when companion scans QR code |
| POST | `/api/family/update-connection` | Backend (5001) | Approve, reject, or disconnect active family pairings |
| POST | `/api/family/connect` | Backend (5001) | Submit pairing request to user by phone number |
| GET | `/api/family/dashboard-data` | Backend (5001) | Caregiver dashboard metrics (battery, journey, location) |
| WS | Socket.IO Gateway | Backend (5001) | Real-time GPS location streaming, SOS alerts, pairing events |

---

## Key Files Reference

| File | Purpose |
| :--- | :--- |
| [`frontend/App.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/App.tsx) | Root entry point, Universal Triple-Tap SOS gesture interceptor, horizontal swipe mode cycler, and dual-role routing |
| [`frontend/src/store/useNavidoorStore.ts`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/store/useNavidoorStore.ts) | Central Zustand store managing navigation modes, voice state, detections, and `triggerSosAlert()` logic |
| [`frontend/src/components/camera/CameraControlsOverlay.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/components/camera/CameraControlsOverlay.tsx) | Unified camera controls with left `SCAN` button (YOLOv11 integration, distance beeps, non-overlapping spacing) |
| [`frontend/src/components/camera/CameraHeader.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/components/camera/CameraHeader.tsx) | Top status header with 5-second hold Emergency SOS button and user profile avatar |
| [`frontend/src/components/camera/AIVisionOverlay.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/components/camera/AIVisionOverlay.tsx) | Invisible background hazard inference, distance badges, and proximity audio cues |
| [`frontend/src/components/navigation/RotatingAIModeWheel.tsx`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/components/navigation/RotatingAIModeWheel.tsx) | Curved 12-mode navigation wheel dock with haptic rotation and centered Unified Mic button |
| [`frontend/src/services/voiceRecordingService.ts`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/services/voiceRecordingService.ts) | Mobile VAD audio metering (-42 dB, 2.2s silence threshold, 2.0s min window, 10s max window) |
| [`frontend/src/services/voiceAssistantBackend.ts`](file:///c:/Users/Aadya/NAVIDOOR/frontend/src/services/voiceAssistantBackend.ts) | HTTP API client with dynamic LAN auto-discovery via Expo `hostUri` |
| [`backend/index.js`](file:///c:/Users/Aadya/NAVIDOOR/backend/index.js) | Express server + Socket.IO hub connecting STT, Chat, TTS, and Family services |
| [`backend/services/whisperService.js`](file:///c:/Users/Aadya/NAVIDOOR/backend/services/whisperService.js) | Whisper.cpp wrapper with clean 16kHz resampling, `--prompt` code-switching, and script validation |
| [`backend/services/aiAssistantService.js`](file:///c:/Users/Aadya/NAVIDOOR/backend/services/aiAssistantService.js) | Direct native LLM reasoning engine with programmatic validation & clarification safety check |
| [`yolo/yolo_server.py`](file:///c:/Users/Aadya/NAVIDOOR/yolo/yolo_server.py) | Python YOLOv11 server with pinhole distance estimation and corridor guidance |
| [`yolo/core/distance_estimator.py`](file:///c:/Users/Aadya/NAVIDOOR/yolo/core/distance_estimator.py) | 3D pinhole distance calculator and left/center/right safe corridor analyzer |


---

## 7. YOLOv11 Triple-Model Architecture & Specialized Hazard Detection

NAVIDOOR features a specialized **Triple-Model Vision Pipeline** running inside yolo/core/detector.py:
1. **Primary General Model (yolo11n.pt)**:
   - Detects all 80 standard COCO classes (pedestrians, cars, buses, bicycles, furniture, doors, etc.) at native 640px resolution.
2. **Specialized Directional Staircase Model (models/yolo11n_staircase.pt)**:
   - Fine-tuned on 502 annotated staircase samples to detect:
     - upstair: Stairs ascending ahead (1.2m calibrated height)
     - downstair: Stairs descending ahead (1.0m calibrated height � elevated hazard priority to prevent falls)
   - Evaluated at **70.5% mAP@50** and ~14.9ms inference latency on CPU.
3. **Specialized Pothole Road Hazard Model (models/yolo11n_pothole.pt)**:
   - Fine-tuned on 665 Roboflow annotated samples to detect:
     - pothole: Road cavity, drain hole, or surface crater (0.15m ground plane calibrated height � critical trip & stumble hazard)
   - Evaluated at **78.0% mAP@50** on the test split (82.9% precision) and runs concurrently on CPU.
4. **Detection Fusion & Priority Sorting**:
   - Models execute in parallel on the live camera frame.
   - Potholes and directional stairs are treated as high-priority ground hazards in yolo/core/distance_estimator.py, triggering tactile vibration and localized voice guidance across 10 Indian languages (e.g. *"Pothole 0.4m directly ahead. Please stop."*).

---

## 8. Family Companion QR Pairing & Dual-Sync Architecture

The Family Companion Mode connects visually impaired users with their family caregivers through a secure, zero-friction pairing flow:
1. **Single-Use 5-Minute QR Tokens**:
   - When the user taps *Pair Family Companion*, a cryptographically randomized token (`pair_{timestamp}_{randomHex}`) is generated.
   - Strictly expires after 300 seconds (5 minutes) and is single-use.
2. **Real-Time Dual Synchronization**:
   - **Local LAN / Socket.IO**: Immediate peer-to-peer connection request and approval chimes on the local network.
   - **Cloud Firestore**: Real-time cloud sync (`onSnapshot` on `pairing_tokens/{token}`) allowing caregivers to monitor their family member even when on separate networks (e.g. mobile 5G/LTE).
3. **Caregiver Safety Controls**:
   - Live GPS location tracking, active journey route monitoring, battery telemetry, and instant audible Emergency SOS alerts.

