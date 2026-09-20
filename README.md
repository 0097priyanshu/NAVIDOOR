# NAVIDOOR – AI Accessibility & Vision Assist Ecosystem

**NAVIDOOR** is an offline-first, voice-first, camera-first AI accessibility platform built specifically for blind, visually impaired, and elderly users, alongside a dedicated **Family Companion Portal** for caregivers.

The system features a high-performance **Flutter** multi-platform client supporting **Web, Windows Desktop, Android Phone, and iOS**, operating alongside a local Node.js Express server, offline **Whisper.cpp** Speech-to-Text, local **Ollama** LLM, and **AI4Bharat IndicF5** neural Text-to-Speech microservices.

---

## 🌟 Core Design & Technical Philosophy

1. **Camera as the Continuous Canvas**: The camera remains active throughout the application. Changing navigation modes does **NOT** unmount or replace the camera; feature-specific floating overlays (Assist, Navigate, Read, Medicines, Location, Emergency, Medical ID, Settings) render directly over the live stream.
2. **100% Privacy-First & Local AI (Zero Cloud API Keys Required)**:
   - **Speech-to-Text (STT)**: Offline `Whisper.cpp` native binary (`ggml-base.bin` & `ggml-tiny.bin` models) with multi-threaded beam search decoding.
   - **General & Vision AI Engine**: Local **Ollama** open-source LLM (`qwen2.5-coder:7b` / `llama3`) for real-time scene perception reasoning and conversational Q&A on `http://127.0.0.1:11434`.
   - **Text-to-Speech (TTS)**: **AI4Bharat IndicF5** neural speech synthesis microservice supporting 10 regional Indian languages on port `5002`.
3. **Voice-First & Tactile Interaction**: Accessible floating mic button with animated expanding cyan pulse aura, spinning loader indicator, spatial chimes, and minimum **52px to 76px** touch targets.
4. **Adaptive Multi-Platform Responsiveness**:
   - **Mobile Phone (Portrait)**: Full-screen camera canvas with YOLOv11 bounding boxes, floating camera tool strip, swipe left/right gestures, and bottom rotating mode wheel.
   - **Laptop / Desktop / Web**: Adaptive split-screen view for User Mode (60% camera canvas on left, 40% mode card on right) and wide dashboard with Navigation Rail for the Family Companion Portal.

---

## 🌐 Supported Regional Indian Languages (10 Languages)

NAVIDOOR supports full Speech-to-Text (STT), LLM reasoning, translation, and neural Text-to-Speech (TTS) across 10 languages:
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

## 🛠 Tech Stack

### Frontend Applications

#### 1. Flutter Multi-Platform App (`navidoor_flutter/`) — Recommended Primary Client
- **Framework**: Flutter 3.35+ / Dart 3.9+ (Web, Windows Desktop, Android, iOS, macOS)
- **State Management**: `provider` (reactive state architecture)
- **Icons & Visuals**: `flutter_lucide` (modern Lucide icons), `google_fonts` (Inter & Roboto)
- **Audio & Speech**: `record` (16kHz mono WAV recording), `audioplayers` (IndicF5 audio playback), `flutter_tts` (offline fallback)
- **Networking & Sockets**: `http` (REST), `socket_io_client` (real-time telemetry & emergency SOS)
- **Location & Sensors**: `geolocator` (GPS coordinates, speed, heading), `shared_preferences`

#### 2. React Native / Expo App (Legacy Client)
- **Framework**: React Native 0.74.5 / Expo SDK 51
- **Language**: TypeScript (~5.3.3)
- **State Management**: Zustand (`useNavidoorStore`)

### Backend & AI Engine (`backend/` — Runs on PC / Local LAN)
- **Server**: Node.js v22+ + Express 4.x + Socket.IO 4.x (Port `5001`)
- **Speech-to-Text (STT)**: `Whisper.cpp` native binary (`main.exe`) + `ffmpeg-static` 16kHz resampler
- **AI Reasoning Engine**: Local Ollama Open-Source LLM (`qwen2.5-coder:7b` / `llama3`)
- **Neural Speech Synthesis**: `AI4Bharat IndicF5` PyTorch / Python microservice (`indicf5_server.py` on port `5002`)
- **File Uploads & CORS**: `multer` (audio buffer uploads), `cors`

---

## 📦 Complete Dependency Installation Guide

Run these steps once to install all dependencies for the entire project:

```bash
# 1. Install Node.js backend & frontend packages
npm install

# 2. Install Python microservice packages (PyTorch, Transformers, F5-TTS, Flask)
python -m pip install -r backend/indicf5/requirements.txt

# 3. Download Whisper.cpp Windows CLI binaries and multilingual speech model
node backend/scripts/setup_speech_pipeline.js

# 4. Install Flutter packages
cd navidoor_flutter && flutter pub get && cd ..
```

---

## 🚀 How to Run the Project

### Step 1: Start the Backend Server (Express + Socket.IO + Whisper.cpp + IndicF5)

Open a terminal in the root directory:

```bash
npm run server
```
*(Backend runs on `http://localhost:5001`).*  
*Ensure [Ollama](https://ollama.com) is running locally on `http://127.0.0.1:11434` with an installed model such as `qwen2.5-coder:7b` or `llama3`.*

---

### Step 2: Run the Flutter Multi-Platform App

You can run the Flutter client on any target device:

#### 🌐 A. Run on Web (Chrome / Edge / Laptop Browser)
```bash
# Using npm shortcut from root:
npm run flutter:web

# Or using Flutter CLI:
cd navidoor_flutter
flutter run -d chrome
```

#### 💻 B. Run as Native Windows Desktop App
```bash
# Using npm shortcut from root:
npm run flutter:desktop

# Or using Flutter CLI:
cd navidoor_flutter
flutter run -d windows
```

#### 📱 C. Run on Android Phone (Physical Device or Emulator)
1. Connect your Android phone via USB with **USB Debugging enabled**, or start an Android Emulator.
2. Verify connection: `flutter devices`
3. Launch the app:
```bash
cd navidoor_flutter
flutter run -d android
```

#### 🍏 D. Run on iOS Phone (iPhone or Simulator — macOS Required)
1. Open simulator or connect iPhone: `open -a Simulator`
2. Launch the app:
```bash
cd navidoor_flutter
flutter run -d ios
```

#### 🍏 E. Run on macOS Desktop (macOS Required)
```bash
cd navidoor_flutter
flutter run -d macos
```

---

### Step 3: Production Build Commands (Flutter)

To generate production-ready binaries:

| Platform | Command (Run inside `navidoor_flutter/`) | Output Location |
|---|---|---|
| **Web** | `flutter build web` | `navidoor_flutter/build/web/` |
| **Windows Desktop** | `flutter build windows` | `navidoor_flutter/build/windows/x64/runner/Release/` |
| **Android APK** | `flutter build apk --release` | `navidoor_flutter/build/app/outputs/flutter-apk/app-release.apk` |
| **Android App Bundle** | `flutter build appbundle` | `navidoor_flutter/build/app/outputs/bundle/release/` |
| **iOS** | `flutter build ios --release` | `navidoor_flutter/build/ios/iphoneos/` |

---

### Step 4 (Optional): Run the Legacy React Native / Expo App

The existing Expo client is preserved in parallel:

```bash
# Start Expo development server (Android, iOS, Web)
npx expo start --tunnel

# Run React Native Web version directly
npm run web
```

---

## 📱 Primary Navigation Modes (12 Modes)

| Mode | Functionality & Overlays |
| :--- | :--- |
| **🏠 ASSIST** | Real-time YOLOv11 bounding boxes, obstacle hazard distance badges, safe walking vectors. |
| **🧭 NAVIGATE** | Turn-by-turn AR walking step overlay, destination cards, street name announcements. |
| **📖 READ** | Live OCR text highlighting, IndicF5 TTS read aloud controls with speech rate adjustment. |
| **💊 MEDICINE** | Prescription label scanner, pill bottle tracker, dosage countdown, voice log confirmation. |
| **🚌 TRANSIT** | Nearby public transit and bus arrival countdowns. |
| **📍 LIVE LOC** | High-precision GPS coordinates, speed, heading, and address sharing. |
| **📞 CALL SOS** | Fast-access emergency contact dialer and emergency dispatch. |
| **🩺 MEDICAL** | Medical ID card (blood group, allergies, chronic conditions, primary physician). |
| **👥 FAMILY** | One-tap connection to Caregiver stream and remote companion portal. |
| **🕒 HISTORY** | Activity log and saved text reading history. |
| **🌐 LANG** | Interactive switcher for all 10 regional Indian languages. |
| **⚙ SETTINGS** | Contrast themes (Standard Slate Gray, High-Contrast Dark, High-Contrast Amber) and speech rate. |

---

## 🚨 Emergency SOS & Family Companion Portal

- **Floating Emergency SOS Button**: Top-right safety-coral alert button with a 5-second hold countdown, loud audible chime, and live GPS location broadcasting.
- **Remote Family Companion Portal**: Dedicated caregiver dashboard (`userRole = 'family_member'`) featuring 5 tabs:
  1. **HOME**: Real-time camera video stream, live GPS map card, user telemetry (battery, steps, medication status).
  2. **LOCATION**: Breadcrumb journey route map, speed, accuracy, and safe zones.
  3. **ACTIVITY**: User timeline of actions and obstacle encounters.
  4. **ALERTS**: SOS alert log and critical notifications.
  5. **PROFILE**: Caregiver profile and user pairing manager.

---

## 🧪 Testing & Verification

Run tests and static analysis inside `navidoor_flutter/`:

```bash
cd navidoor_flutter

# 1. Static code analysis (0 errors, 0 warnings)
flutter analyze

# 2. Automated widget tests
flutter test

# 3. Web compilation verification
flutter build web
```
