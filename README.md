# NAVIDOOR – AI Accessibility & Vision Assist Ecosystem

**NAVIDOOR** is an offline-first, voice-first, camera-first AI accessibility platform built specifically for blind, visually impaired, and elderly users, alongside a dedicated **Family Companion Portal** for caregivers.

---

## 🌟 Core Design & Technical Philosophy

1. **Camera as the Continuous Canvas**: The camera remains active throughout almost the entire application. Changing navigation tabs does **NOT** unmount or replace the camera; feature-specific floating overlays (Assist, Navigate, Read, Medicines, Settings) render over the live stream.
2. **100% Privacy-First & Local AI**:
   - **Speech-to-Text (STT)**: Offline `Whisper.cpp` native binary (`ggml-base.bin` model) with 8-thread beam search decoding.
   - **General & Vision AI Engine**: Local **Ollama** open-source LLM (`qwen2.5-coder:7b` / `llama3`) for real-time general Q&A and YOLOv11 camera perception reasoning. Zero cloud API keys required.
   - **Text-to-Speech (TTS)**: **AI4Bharat IndicF5** neural speech synthesis microservice supporting 10 regional Indian languages.
3. **Voice-First & Tactile Interaction**: Accessible floating mic button with haptic feedback, spatial chimes, and minimum **52px to 76px** touch targets.

---

## 🌐 Supported Regional Indian Languages (10 Languages)

NAVIDOOR supports full STT, LLM reasoning, translation, and TTS in 10 languages:
- **English** (en)
- **Hindi** (hi - हिंदी)
- **Marathi** (mr - मराठी)
- **Gujarati** (gu - ગુજરાતી)
- **Punjabi** (pa - ਪੰਜਾਬੀ)
- **Bengali** (bn - বাংলা)
- **Tamil** (ta - தமிழ்)
- **Telugu** (te - తెలుగు)
- **Kannada** (kn - ಕನ್ನಡ)
- **Malayalam** (ml - മലയാളം)

---

## 🛠 Tech Stack

### Frontend Mobile App (React Native / Expo)
- **Framework**: React Native 0.74.5 / Expo (iOS, Android, Web)
- **Language**: TypeScript
- **State Management**: Zustand (`useNavidoorStore`)
- **Navigation**: Persistent Bottom Sheet Overlays & React Navigation
- **Icons & Visuals**: Lucide React Native / Expo Linear Gradient
- **Camera & Sensors**: Expo Camera, Expo Location, Expo Haptics, Expo AV

### Backend & AI Engine (Node.js Express + Python Microservices)
- **Server**: Node.js + Express + Socket.IO (runs on PC / LAN)
- **Speech-to-Text**: `Whisper.cpp` native binary with FFmpeg static audio converter
- **AI Reasoning Engine**: Local Ollama Open-Source LLM (`qwen2.5-coder:7b` / `llama3`)
- **Speech Synthesis**: `AI4Bharat IndicF5` PyTorch / Python microservice (`indicf5_server.py`)

---

## 📱 Primary Navigation Modes

| Tab Mode | Functionality & Overlays |
| :--- | :--- |
| **🏠 Assist** | Real-time object detection bounding boxes, obstacle hazard warnings, safe walking vectors, scene description. |
| **🧭 Navigate** | Turn-by-turn AR walking guidance overlay, destination cards, street name announcements. |
| **📖 Read** | Live OCR text highlighting, TTS read aloud controls with speed selectors (1.0x to 2.0x). |
| **💊 Medicines** | Prescription label scanner, pill bottle identification, dosage countdown, voice log confirmation. |
| **⚙ More** | Visual contrast themes (Standard, Max Dark, High-Contrast Amber), font scaling, Remote Family Companion view, SOS emergency manager. |

---

## 🚨 Emergency SOS & Family Companion Portal

- **Floating Emergency SOS Button**: Top-right safety-coral alert button with a 5-second hold countdown, loud audible chime, and live GPS location broadcasting to primary contacts.
- **Remote Family Companion Portal**: Dual-role caregiver dashboard (`userRole = 'family_member'`) featuring 5 arc-wheel tabs (Home, Location, Activity, Alerts, Profile) with real-time location monitoring and active journey tracking.

---

## 🚀 How to Run

### 1. Start the Backend Server (Express + IndicF5 + Whisper.cpp + Ollama)
```bash
npm run server
```
*Note: Ensure [Ollama](https://ollama.com) is running locally on `http://127.0.0.1:11434` with an installed model such as `qwen2.5-coder:7b` or `llama3`.*

### 2. Start the Mobile Expo App
```bash
npx expo start --tunnel
```
Press `a` to launch on Android, `i` for iOS, or scan the QR code using Expo Go.

### 3. Start Web Version (Optional)
```bash
npm run web
```
