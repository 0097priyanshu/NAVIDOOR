# NAVIDOOR — Full Tech Stack & Architecture Breakdown

## What Is This App?

**NAVIDOOR** is an Indian, offline-first AI accessibility assistant and dual-portal ecosystem designed for visually impaired users and their family caregivers.
It runs as a React Native (Expo) mobile application with two distinct role experiences:
1. **NAVIDOOR User Mode**: AI vision assist, camera OCR/object detection (YOLOv11), general-purpose local LLM voice assistant, and 9 navigation modes.
2. **Family Companion Portal**: Dedicated visual dashboard for caregivers with real-time location monitoring, active journey tracking, emergency SOS alerts, and pairing management.

It communicates with a local Node.js backend server running on your PC over your LAN (Wi-Fi), integrated with a local Ollama LLM runtime and AI4Bharat IndicF5 neural TTS microservice.

---

## Repository Structure

```
NAVIDOOR/
├── App.tsx                  ← Root entry point (Dual-role routing: RoleSelectionScreen | FamilyModeContainer | Main User App)
├── index.js                 ← Registers App with Expo
├── index.html               ← Web entry HTML (for npx expo start --web)
├── app.json                 ← Expo config (permissions, splash, icon)
├── babel.config.js          ← Babel transpiler config
├── tsconfig.json            ← TypeScript config
├── package.json             ← All dependencies
│
├── src/                     ← All React Native frontend code
│   ├── components/          ← All UI components
│   │   ├── camera/          ← Camera view, photo capture, AI overlay (YOLOv11)
│   │   ├── header/          ← Top status bar (SOS button, profile)
│   │   ├── navigation/      ← Rotating AI Mode Wheel (bottom nav)
│   │   ├── overlays/        ← Modular section panels & toast notifications
│   │   │   └── panels/      ← Standalone overlay panels (Emergency, Location, Medical, Settings, etc.)
│   │   ├── onboarding/      ← Role selection screen & voice setup flow
│   │   ├── sos/             ← Emergency SOS modal & location broadcast
│   │   ├── family/          ← Family Companion Portal (Container, Home, Location, Activity, Alerts, Profile tabs)
│   │   ├── designSystem/    ← Dev-only design system preview modal
│   │   ├── profile/         ← User profile / medical ID modal
│   │   └── common/          ← Shared components (mic button)
│   ├── store/               ← Global state management (Zustand store for user & family states)
│   ├── services/            ← Backend API clients + voice processing + socket client
│   ├── theme/               ← Design system tokens, colors, typography
│   ├── types/               ← TypeScript type definitions
│   └── utils/               ← Speech utils, translations, helpers
│
└── backend/                 ← Node.js Express server (runs on PC / LAN)
    ├── index.js             ← Main Express server + STT/TTS/Chat REST APIs + Socket.IO server
    ├── bin/
    │   └── main.exe         ← Whisper.cpp compiled binary (STT)
    ├── models/
    │   └── whisper/
    │       └── ggml-base.bin           ← Whisper multilingual model (147MB)
    ├── config/
    │   └── languages.js     ← 10 Indian language configs (en, hi, mr, gu, pa, bn, ta, te, kn, ml)
    ├── indicf5/
    │   └── indicf5_server.py           ← AI4Bharat IndicF5 Python Neural TTS microservice (port 5002)
    └── services/
        ├── whisperService.js     ← Whisper.cpp STT engine wrapper (-t 8 -bs 5 -bo 5 -l auto)
        ├── indicf5Service.js     ← AI4Bharat IndicF5 TTS engine client wrapper
        ├── aiAssistantService.js ← Local Ollama LLM Reasoning Engine (qwen2.5-coder:7b / llama3)
        ├── socketService.js      ← Socket.IO real-time event hub
        └── translationService.js ← Regional Indian language translation engine
```

---

## Tech Stack

### Frontend (React Native / Expo)

| Technology | Version | Purpose |
|---|---|---|
| **React Native** | 0.74.5 | Cross-platform mobile framework |
| **Expo** | latest | Dev tooling, camera, speech, haptics APIs |
| **TypeScript** | ~5.3.3 | Type safety across all frontend code |
| **Zustand** | ^4.5.2 | Global state management (replaces Redux) |
| **expo-camera** | ~15.0.16 | Real-time camera access & photo capture |
| **expo-speech** | ~12.0.2 | Device TTS fallback for Web & Native |
| **expo-haptics** | ~13.0.1 | Vibration feedback on mode swipes & button interactions |
| **expo-location** | ~17.0.1 | GPS for navigation mode & emergency SOS broadcast |
| **expo-av** | ~14.0.7 | Audio recording for Whisper STT |
| **expo-linear-gradient** | ~13.0.2 | UI gradient effects |
| **lucide-react-native** | ^0.395.0 | Complete icon system (Shield, MapPin, Activity, etc.) |
| **socket.io-client** | ^4.8.3 | Real-time family stream & SOS event listener |

### Backend & AI Engine (Node.js Express + Python Microservices — runs on PC / LAN)

| Technology | Version / Model | Purpose |
|---|---|---|
| **Node.js + Express** | ^4.22.2 | Main HTTP API server & Family REST Endpoints |
| **Whisper.cpp** | Native binary (`ggml-base.bin`) | Offline multilingual Speech-to-Text (STT) |
| **Local Ollama LLM** | `qwen2.5-coder:7b` / `llama3` | General-purpose AI reasoning & vision context Q&A engine |
| **AI4Bharat IndicF5** | PyTorch / Python microservice | Neural Text-to-Speech (TTS) for 10 regional Indian languages |
| **ffmpeg-static** | ^5.3.0 | Resamples microphone recordings → 16kHz Mono PCM WAV for Whisper |
| **Socket.IO** | ^4.8.3 | Real-time family remote assist & pairing socket gateway |
| **multer** | ^1.4.5 | Handles audio file uploads from the app |
| **cors** | ^2.8.6 | Allows mobile app to call backend over LAN |

---

## Architecture & Data Flow

### 1. Dual-Role Routing (App Startup)
```
App launch (App.tsx)
├── Checks userRole in Zustand store
├── Case 'undecided': Renders <RoleSelectionScreen />
│     ├── NAVIDOOR User Card -> Sets userRole = 'navidoor_user', opens setup onboarding
│     └── Family Member Card -> Sets userRole = 'family_member', opens caregiver portal
├── Case 'family_member':
│     ├── If not logged in -> Renders <FamilyAuthScreen />
│     └── If logged in -> Renders <FamilyModeContainer /> (Caregiver Portal)
└── Case 'navidoor_user': Renders main AI Accessibility workspace (<CameraViewCanvas />, <RotatingAIModeWheel />, <SectionViewPanel />)
```

### 2. General-Purpose Voice AI & Reasoning Pipeline
```
                  ┌───────────────┐
                  │  Microphone   │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │  Whisper.cpp  │ (Offline STT: -t 8 -bs 5 -bo 5 -l auto)
                  └───────┬───────┘
                          ↓
                      Transcript
                          ↓
                  ┌───────────────┐
                  │ Node /api/chat│
                  │ Local Ollama  │ (qwen2.5-coder:7b / llama3)
                  └───────┬───────┘
                          ↓
                     Real Answer
                          ↓
                  ┌───────────────┐
                  │  IndicF5 TTS  │ (Neural Speech Synthesis for 10 Indian Languages)
                  └───────┬───────┘
                          ↓
                       Speaker
```

### 3. Camera Perception & Vision Question Pipeline
```
Camera Feed
   ↓
YOLOv11 Object Detection
   ↓
real detectedObjects (class, confidence, distance, position)
   ↓
context payload
   ↓
Node /api/chat
   ↓
Local Ollama LLM (System Prompt integrates visual context without hallucinating)
   ↓
Context-Aware Spoken Answer
   ↓
AI4Bharat IndicF5 TTS
```

### 4. Modular Panel Overlays Architecture (`src/components/overlays/panels/`)
```
<SectionViewPanel />
├── Renders modular panel overlay based on activeMode:
│     ├── 'emergency' -> <EmergencyPanel />
│     ├── 'medicine' -> <MedicalInfoPanel />
│     ├── 'navigate' / 'assist' -> <LocationPanel />
│     ├── 'settings' -> <SettingsPanel />
│     ├── 'languages' -> <LanguagesPanel />
│     ├── 'history' -> <HistoryPanel />
│     └── 'family' -> <FamilyPanel />
```

### 5. Emergency SOS & Family Remote Assist
```
User triggers Emergency SOS (Voice or Header SOS button)
→ SOSModal opens with countdown & alert sound
→ Obtains GPS coordinates via expo-location
→ Transmits SOS alert payload via Socket.IO gateway (`family:sosAlert`)
→ Family Companion Portal receives instant alert and location details
```

---

## Backend API Endpoints

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | Backend & IndicF5 health check |
| GET | `/api/languages` | Returns list of 10 supported Indian languages |
| POST | `/api/stt` | Whisper.cpp: audio file → 16kHz WAV → transcribed text |
| POST | `/api/chat` | Local Ollama LLM: user query + context → real AI answer |
| POST | `/api/tts` | AI4Bharat IndicF5: text + language → synthesized WAV buffer |
| POST | `/api/translate` | Regional language translation service |
| POST | `/api/family/login` | Family companion caregiver authentication |
| POST | `/api/family/register` | Family companion caregiver account signup |
| POST | `/api/family/connect` | Connection request submit & pairing handling |
| POST | `/api/family/connection-status` | Connection state & paired users overview |
| GET | `/api/family/dashboard-data` | Caregiver dashboard data payload |
| GET | `/api/user/pending-requests` | User pending caregiver connection requests |
| POST | `/api/user/approve-connection` | User consent approval / rejection |
| WS | Socket.IO Gateway | Real-time location streams, SOS alerts, and pairing events |

---

## Key Files Reference

| File | What it does |
|---|---|
| `App.tsx` | Root layout + dual-role routing (`userRole`) + full-screen swipe handler |
| `src/store/useNavidoorStore.ts` | Global Zustand state: mode, voice, camera, user role, family caregiver state |
| `src/components/onboarding/RoleSelectionScreen.tsx` | App launch role selection screen (Navidoor User vs Family Companion) |
| `src/components/family/FamilyModeContainer.tsx` | Caregiver Portal shell with semi-circle rotating wheel navbar & swipe gestures |
| `src/components/family/FamilyHomeTab.tsx` | Caregiver main overview dashboard (Monitored user card, location, journey, battery) |
| `src/components/family/FamilyLocationTab.tsx` | Real-time location map canvas with Indian street mapping |
| `src/components/family/FamilyAuthScreen.tsx` | Caregiver login & account registration screen |
| `src/components/overlays/SectionViewPanel.tsx` | Root section view panel container |
| `src/components/overlays/panels/` | Modular overlay panels (Emergency, Location, Medical, Settings, Languages, etc.) |
| `src/services/voiceAssistantBackend.ts` | Backend HTTP API client + LAN auto-discovery |
| `src/services/voiceRecordingService.ts` | Mic permission, Web PCM sample recorder & native audio capture |
| `src/services/socketClient.ts` | Socket.IO real-time client wrapper |
| `backend/index.js` | Express server with STT/TTS/Chat routes, family REST APIs, and Socket.IO gateway |
| `backend/services/whisperService.js` | Whisper.cpp native STT execution engine |
| `backend/services/aiAssistantService.js` | Local Ollama LLM Reasoning Engine (`qwen2.5-coder:7b` / `llama3`) |
| `backend/services/indicf5Service.js` | AI4Bharat IndicF5 Neural TTS microservice client |
| `backend/indicf5/indicf5_server.py` | Python Flask microservice serving AI4Bharat IndicF5 PyTorch TTS |
