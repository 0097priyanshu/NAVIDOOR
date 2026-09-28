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

### 📁 Three-Tier Modular Architecture

```
NAVIDOOR/
├── frontend/    # React Native / Expo mobile client (Android, iOS, Web)
├── backend/     # Node.js Express, Socket.IO, STT, and TTS orchestrator
└── yolo/        # Python YOLOv11/v8 AI Vision, Distance Estimation & Hazard Engine
```

### 1. Frontend Application (`frontend/` — React Native / Expo)
- **Framework**: React Native 0.86 / Expo SDK 57 (Android, iOS, Web)
- **Language**: TypeScript 5.4+
- **State Management**: Zustand (`useNavidoorStore`)
- **Icons & Visuals**: `lucide-react-native`, `expo-linear-gradient`
- **Camera & Audio**: `expo-camera`, `expo-audio`, `expo-speech`
- **Vision Integration**: `yoloVisionService.ts` for real-time bounding box rendering and spatial alerts

### 2. Backend & Speech Orchestrator (`backend/` — Port 5001)
- **Server**: Node.js v22+ + Express 4.x + Socket.IO 4.x
- **Speech-to-Text (STT)**: `Whisper.cpp` native binary (`main.exe`) + `ffmpeg-static` 16kHz resampler
- **AI Reasoning Engine**: Local Ollama Open-Source LLM (`qwen2.5-coder:7b` / `llama3`)
- **Neural Speech Synthesis**: `AI4Bharat IndicF5` PyTorch / Python microservice (`indicf5_server.py` on port `5002`)
- **Vision Bridge**: `yoloClientService.js` connecting Express to the Python YOLO microservice

### 3. YOLO AI Vision Service (`yolo/` — Port 5003)
- **Engine**: Ultralytics YOLOv11 / YOLOv8 + OpenCV
- **Distance Estimation**: Pinhole camera focal geometry ($D = \frac{H_{\text{real}} \cdot f}{h_{\text{bbox}}}$) with vertical ground-plane adjustment
- **Collision Risk**: Categorizes obstacles into `CRITICAL` (<1.2m), `WARNING` (1.2m–2.5m), and `INFO`
- **Corridor Analysis**: Divides field of view into `LEFT`, `CENTER`, and `RIGHT` corridors to suggest safe walking trajectories
- **Multilingual Spoken Guidance**: English, Hindi (हिंदी), and Marathi (मराठी)

---

## 📦 Complete Dependency Installation Guide

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install YOLO AI Vision packages
python -m pip install -r yolo/requirements.txt

# 3. Install Python Speech microservice packages (IndicF5)
python -m pip install -r backend/indicf5/requirements.txt

# 4. Download Whisper.cpp Windows CLI binaries and multilingual speech model
node backend/scripts/setup_speech_pipeline.js
```

---

## 🚀 How to Run the Three Services

You can run each service individually or using root npm shortcuts:

### Step 1: Start the YOLO AI Vision Server (Port 5003)
```bash
npm run yolo
# Or directly:
python yolo/yolo_server.py
```
*(Verify test suite anytime with `npm run test:yolo`).*

---

### Step 2: Start the Backend Server (Port 5001)
```bash
npm run backend
# Or directly:
node backend/index.js
```
*(Backend runs on `http://0.0.0.0:5001` - LAN accessible).*

---

### Step 3: Run the Frontend Mobile App (Expo Go)
```bash
npm run tunnel
# Or directly from frontend folder:
cd frontend && npm run tunnel
```
1. Scan the displayed QR code with your phone (**Expo Go** on Android or default **Camera** app on iPhone).
2. The app will bundle and run live with real-time YOLO vision overlays and voice assistance.

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
