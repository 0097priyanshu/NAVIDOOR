# NAVIDOOR — Full Tech Stack & Architecture Breakdown

## What Is This App?

**NAVIDOOR** is an offline-first AI accessibility assistant for visually impaired users.
It runs as an Android app built with React Native (Expo) and communicates
with a local Node.js backend server running on your PC over your LAN (Wi-Fi).

---

## Repository Structure

```
NAVIDOOR/
├── App.tsx                  ← Root entry point (renders the whole app)
├── index.js                 ← Registers App with Expo
├── index.html               ← Web entry HTML (for npx expo start --web)
├── app.json                 ← Expo config (permissions, splash, icon)
├── babel.config.js          ← Babel transpiler config
├── tsconfig.json            ← TypeScript config
├── package.json             ← All dependencies
│
├── src/                     ← All React Native frontend code
│   ├── components/          ← All UI components
│   │   ├── camera/          ← Camera view, photo capture, AI overlay
│   │   ├── header/          ← Top status bar (SOS button, profile)
│   │   ├── navigation/      ← Rotating AI Mode Wheel (bottom nav)
│   │   ├── overlays/        ← Section panels, toast notifications
│   │   ├── onboarding/      ← First-time voice setup flow
│   │   ├── sos/             ← Emergency SOS modal
│   │   ├── family/          ← Family Remote Assist modal
│   │   ├── designSystem/    ← Dev-only design system preview modal
│   │   ├── profile/         ← User profile / medical ID modal
│   │   └── common/          ← Shared components (mic button)
│   ├── store/               ← Global state (Zustand)
│   ├── services/            ← Backend API clients + voice processing
│   ├── theme/               ← Design tokens, colors, typography
│   ├── types/               ← TypeScript type definitions
│   └── utils/               ← Speech utils, translations, helpers
│
└── backend/                 ← Node.js Express server (runs on PC)
    ├── index.js             ← Main server entry
    ├── bin/
    │   ├── main.exe         ← Whisper.cpp compiled binary (STT)
    │   └── piper/           ← Piper TTS binary + espeak-ng-data
    ├── models/
    │   ├── whisper/
    │   │   └── ggml-base.bin           ← Whisper multilingual model (147MB)
    │   └── piper/
    │       └── en_US-lessac-high.onnx  ← Piper English voice (113MB)
    ├── config/
    │   └── languages.js     ← 10 language configs
    └── services/
        ├── whisperService.js     ← Whisper.cpp STT logic
        ├── piperService.js       ← Piper TTS logic
        ├── socketService.js      ← Socket.IO real-time events
        ├── translationService.js
        └── aiAssistantService.js
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
| **expo-speech** | ~12.0.2 | Device TTS fallback for ALL languages on Android |
| **expo-haptics** | ~13.0.1 | Vibration feedback on mode swipes |
| **expo-location** | ~17.0.1 | GPS for navigation mode |
| **expo-av** | ~14.0.7 | Audio/video playback (partially integrated) |
| **expo-linear-gradient** | ~13.0.2 | UI gradient effects |
| **lucide-react-native** | ^0.395.0 | All icons (ShieldAlert, Camera, etc.) |
| **socket.io-client** | ^4.8.3 | Real-time family streaming |

### Backend (Node.js Express — runs on your PC)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | ^4.22.2 | HTTP API server |
| **Whisper.cpp** | Native binary | Offline multilingual Speech-to-Text |
| **Piper TTS** | Native binary | Offline Text-to-Speech (English only currently) |
| **ffmpeg-static** | ^5.3.0 | Converts M4A/AAC mic recordings → 16kHz WAV for Whisper |
| **Socket.IO** | ^4.8.3 | Real-time family remote assist streaming |
| **multer** | ^1.4.5 | Handles audio file uploads from the app |
| **cors** | ^2.8.6 | Allows Android app to call backend over LAN |

---

## How It All Works — Data Flow

### 1. App Startup
```
Android opens app
→ App.tsx renders
→ Zustand store initializes
→ Backend health check (GET /api/health)
→ If backend is online: shows "NAVIDOOR Ready"
→ If offline: app still works (expo-speech fallback)
```

### 2. Voice Input (Speaking to the app)
```
User holds MIC button
→ expo-av records microphone audio (M4A file)
→ Audio file uploaded to backend POST /api/stt
→ Backend runs FFmpeg: M4A → 16kHz Mono WAV
→ Backend runs whisper.cpp: WAV → text transcription
→ Text returned to app
→ voiceCommandProcessor.parseCommand(text)
  → Switches nav mode / changes language / opens SOS etc.
→ OR: text sent to POST /api/chat for AI assistant response
```

### 3. Voice Output (App speaking back to you)
```
App calls speakAnnouncement(text, { languageCode })
→ On WEB: tries Piper TTS backend (POST /api/tts) first
   → Backend runs piper.exe with onnx model → WAV audio
   → App plays WAV via HTML Audio element
   → If backend offline: falls back to Web Speech API
→ On ANDROID: goes directly to expo-speech
   → Device's built-in TTS engine (supports all 10 Indian languages natively)
```

### 4. Camera & AI Vision
```
expo-camera streams live frames
→ CameraViewCanvas renders the live camera view
→ AIVisionOverlay simulates detected objects (obstacles, text, doors)
→ User presses capture button
→ Photo saved to device
→ CapturedPhotoPreviewModal shows photo + AI analysis text
→ Analysis spoken aloud via speakAnnouncement()
```

### 5. Navigation (9 Modes)
```
User swipes LEFT/RIGHT on screen (PanResponder)
  OR taps a mode on the bottom RotatingAIModeWheel
→ cycleNextMode() / cyclePrevMode() called in Zustand store
→ activeMode changes to one of:
  assist | navigate | read | medicine | transport |
  emergency | family | history | languages | settings
→ SectionViewPanel shows the relevant panel
→ SectionToastNotification flashes the mode name
→ Haptics.impactAsync() vibrates the phone
```

### 6. Emergency SOS
```
User taps SOS button in header
→ SOSModal opens
→ Uses expo-location to get GPS coordinates
→ Sends alert + GPS link to emergency contacts via Socket.IO
→ Family app receives real-time alert
```

### 7. Family Remote Assist
```
User opens FAMILY mode
→ Socket.IO connects to backend
→ Family member on another device gets a camera stream
→ Live guidance can be sent back as voice
```

---

## Current Reality of TTS Languages

| Language | Piper TTS (backend) | expo-speech (Android) |
|---|---|---|
| English | ✅ en_US-lessac-high (113MB, high quality) | ✅ |
| Hindi | ⚠️ Model file not downloaded | ✅ Device TTS works great |
| Marathi | ❌ No Piper model exists | ✅ Device TTS works great |
| Gujarati | ❌ No Piper model exists | ✅ Device TTS works great |
| Punjabi | ❌ No Piper model exists | ✅ Device TTS works great |
| Bengali | ❌ No Piper model exists | ✅ Device TTS works great |
| Tamil | ❌ No Piper model exists | ✅ Device TTS works great |
| Telugu | ❌ No Piper model exists | ✅ Device TTS works great |
| Kannada | ❌ No Piper model exists | ✅ Device TTS works great |
| Malayalam | ❌ No Piper model exists | ✅ Device TTS works great |

> **Bottom line**: For Android users, all 10 languages work via Android's built-in TTS.
> Piper TTS only adds value for English on the web version.

## Current Reality of STT Languages

| Engine | Languages | Status |
|---|---|---|
| **Whisper.cpp ggml-base.bin** | All 10 languages | ✅ Works — multilingual model handles all Indian languages |

> Whisper's `ggml-base.bin` is a **multilingual model** — it transcribes all 10 supported
> languages from a single 147MB file. No per-language model download needed.

---

## Backend API Endpoints

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/languages` | Returns list of 10 supported languages |
| POST | `/api/stt` | Whisper.cpp: audio file → transcribed text |
| POST | `/api/tts` | Piper TTS: text → WAV audio buffer |
| POST | `/api/translate` | Translation service |
| POST | `/api/chat` | AI assistant response |
| WS | Socket.IO | Real-time family streaming & SOS alerts |

---

## How the Backend Connects to the App

The backend runs at `http://0.0.0.0:5001` on your PC.

The Expo app auto-detects the backend IP using:
```typescript
const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
const ip = hostUri.split(':')[0];              // "192.168.1.5"
const BACKEND_URL = `http://${ip}:5001`;       // "http://192.168.1.5:5001"
```

> **Your PC and Android phone must be on the same Wi-Fi network.**

---

## Key Files Reference

| File | What it does |
|---|---|
| `App.tsx` | Root layout + full-screen swipe gesture handler |
| `src/store/useNavidoorStore.ts` | ALL global state: mode, voice, camera, user, settings |
| `src/components/camera/CameraViewCanvas.tsx` | Camera view + AI overlay rendering |
| `src/components/navigation/RotatingAIModeWheel.tsx` | Bottom nav wheel + mic button |
| `src/components/overlays/SectionViewPanel.tsx` | All 9 section panels (Settings, History, etc.) |
| `src/services/voiceCommandProcessor.ts` | Parses voice commands → actions |
| `src/utils/speechUtils.ts` | TTS: Piper (web) → expo-speech (Android) |
| `src/services/voiceAssistantBackend.ts` | All HTTP calls to the Node.js backend |
| `backend/index.js` | Express server with all API routes |
| `backend/services/whisperService.js` | Whisper.cpp runner (STT) |
| `backend/services/piperService.js` | Piper TTS runner |
