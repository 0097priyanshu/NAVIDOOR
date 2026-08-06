# NAVIDOOR – AI Vision Assist Mobile Application

NAVIDOOR is a real-time, voice-first, camera-first AI-powered accessibility platform built specifically for blind, visually impaired, and elderly users.

---

## 🌟 Core Design Philosophy

1. **Camera as the Continuous Canvas**: The camera remains active throughout almost the entire application. Changing navigation tabs does **NOT** unmount or replace the camera; instead, feature-specific overlays (Assist, Navigate, Read, Medicines, Settings) float gracefully over the live stream.
2. **Voice-First & Tactile Interaction**: Accessible floating microphone FAB with audio pulse animations, Web Speech API / Expo Speech synthesis announcements, spatial obstacle proximity chimes, and 52px+ touch targets.
3. **No sci-fi AI clutter**: Friendly, minimal, premium, accessible, and trustworthy UI inspired by Apple, Uber, Google Maps, and Microsoft Seeing AI.

---

## 🛠 Tech Stack

- **Frontend Framework**: React Native
- **Mobile Platform**: Expo (iOS, Android, Web)
- **Language**: TypeScript
- **State Management**: Zustand (`useNavidoorStore`)
- **Navigation**: React Navigation & Persistent Bottom Sheet Overlays
- **Icons & Visuals**: Lucide React Native / Lucide React

---

## 📱 Primary Navigation Modes

| Tab Mode | Functionality & Overlays |
| :--- | :--- |
| **🏠 Assist** | Real-time object detection bounding boxes, obstacle hazard warnings, safe walking vectors, scene description audio readout. |
| **🧭 Navigate** | Turn-by-turn AR walking guidance overlay, destination cards, street name announcements, next step maneuvers. |
| **📖 Read** | Live OCR text highlighting, TTS read aloud controls with speed selectors (1.0x to 2.0x), text snippet saver. |
| **💊 Medicines** | Prescription label scanner, pill bottle identification, dosage countdown, voice log confirmation. |
| **⚙ More** | Visual contrast themes (Standard, Max Dark, High-Contrast Amber), font scaling, Remote Family Companion view, SOS emergency manager. |

---

## 🚨 Emergency SOS & Family Companion Systems

- **Floating Emergency SOS Button**: Top-right safety-coral alert button with a 5-second hold countdown, loud audible chime, and live GPS location broadcasting to primary contacts.
- **Remote Family Companion View**: Enables trusted family members (e.g. daughter, caretaker) to connect to the live camera stream remotely and leave spatial voice notes.

---

## 🎨 Design System & Accessibility

- **Touch Targets**: Minimum **52px** to **76px** touch targets (exceeding WCAG AAA criteria).
- **Typography**: Minimum body font 16px, bold hierarchy, dynamic font scaling (Normal, Large, Extra Large).
- **Themes**:
  - `Standard`: Deep Blue (`#0A59A7`), Soft Emerald (`#059669`), Safety Coral (`#E11D48`).
  - `Maximum Dark Contrast`: High contrast black (`#000000`) & vibrant yellow (`#FACC15`).
  - `Amber Contrast`: Warm high-contrast amber (`#FFD700`) for low-vision clarity.

---

## 🚀 How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Mobile Expo App (iOS / Android)**:
   ```bash
   npm start
   ```

3. **Start Web Version**:
   ```bash
   npm run web
   ```
