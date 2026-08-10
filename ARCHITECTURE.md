# NAVIDOOR — Full Tech Stack & Architecture Breakdown

## What Is This App?

**NAVIDOOR** is an Indian, offline-first AI accessibility assistant and dual-portal ecosystem designed for visually impaired users and their family caregivers.
It runs as a React Native (Expo) mobile application with two distinct role experiences:
1. **NAVIDOOR User Mode**: AI vision assist, camera OCR/object detection, voice assistant, and 9 navigation modes.
2. **Family Companion Portal**: Dedicated visual dashboard for caregivers with real-time location monitoring, active journey tracking, emergency SOS alerts, and pairing management.

It communicates with a local Node.js backend server running on your PC over your LAN (Wi-Fi).

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
│   │   ├── camera/          ← Camera view, photo capture, AI overlay
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
    ├── index.js             ← Main Express server + Family & User REST APIs + Socket.IO server
    ├── bin/
    │   ├── main.exe         ← Whisper.cpp compiled binary (STT)
    │   └── piper/           ← Piper TTS binary + espeak-ng-data
    ├── models/
    │   ├── whisper/
    │   │   └── ggml-base.bin           ← Whisper multilingual model (147MB)
    │   └── piper/
    │       └── en_US-lessac-high.onnx  ← Piper English voice (113MB)
    ├── config/
    │   └── languages.js     ← 10 Indian language configs
    └── services/
        ├── whisperService.js     ← Whisper.cpp STT logic
        ├── piperService.js       ← Piper TTS logic
        ├── socketService.js      ← Socket.IO real-time event hub
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
| **expo-haptics** | ~13.0.1 | Vibration feedback on mode swipes & button interactions |
| **expo-location** | ~17.0.1 | GPS for navigation mode & emergency SOS broadcast |
| **expo-av** | ~14.0.7 | Audio recording for Whisper STT |
| **expo-linear-gradient** | ~13.0.2 | UI gradient effects |
| **lucide-react-native** | ^0.395.0 | Complete icon system (Shield, MapPin, Activity, etc.) |
| **socket.io-client** | ^4.8.3 | Real-time family stream & SOS event listener |

### Backend (Node.js Express — runs on PC / LAN)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | ^4.22.2 | HTTP API server & Family REST Endpoints |
| **Whisper.cpp** | Native binary | Offline multilingual Speech-to-Text |
| **Piper TTS** | Native binary | Offline Text-to-Speech (English only currently) |
| **ffmpeg-static** | ^5.3.0 | Converts M4A/AAC mic recordings → 16kHz WAV for Whisper |
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

### 2. Family Companion Caregiver Portal (`src/components/family/`)
```
<FamilyModeContainer />
├── Semi-Circle Arc Wheel Navbar: 5 tabs sit on a curved arc dock (HOME, LOCATION, ACTIVITY, ALERTS, PROFILE)
├── Full-Screen & Wheel Gestures: Horizontal swipe gestures cycle smoothly between tabs with haptic feedback
├── FamilyHomeTab: Displays caregiver greeting (Priya Sharma), connected NAVIDOOR user profile card (Aarav Sharma), live location summary, active journey, battery/GPS status
├── FamilyLocationTab: Interactive map canvas with Indian street mapping (Connaught Place, Janpath Road)
├── FamilyActivityTab: Detailed journey progress and activity timelines
├── FamilyAlertsTab: Emergency SOS log and 1-tap contact dialer
└── FamilyProfileTab: Active sharing permissions manager and portal logout
```

### 3. Modular Panel Overlays Architecture (`src/components/overlays/panels/`)
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

### 4. Voice Input (Speaking to the app)
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

### 5. Voice Output (App speaking back to you)
```
App calls speakAnnouncement(text, { languageCode })
→ On WEB: tries Piper TTS backend (POST /api/tts) first
   → Backend runs piper.exe with onnx model → WAV audio
   → App plays WAV via HTML Audio element
   → If backend offline: falls back to Web Speech API
→ On ANDROID: goes directly to expo-speech
   → Device's built-in TTS engine (supports all 10 Indian languages natively)
```

### 6. Emergency SOS & Family Remote Assist
```
User triggers Emergency SOS (Voice or Header SOS button)
→ SOSModal opens with countdown & alert sound
→ Obtains GPS coordinates via expo-location
→ Transmits SOS alert payload via Socket.IO gateway (`family:sosAlert`)
→ Family Companion Portal receives instant alert and location details
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

---

## Backend API Endpoints

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/languages` | Returns list of 10 supported Indian languages |
| POST | `/api/stt` | Whisper.cpp: audio file → transcribed text |
| POST | `/api/tts` | Piper TTS: text → WAV audio buffer |
| POST | `/api/translate` | Translation service |
| POST | `/api/chat` | AI assistant response |
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
| `src/services/socketClient.ts` | Socket.IO real-time client wrapper |
| `backend/index.js` | Express server with STT/TTS routes, family REST APIs, and Socket.IO gateway |
