# NAVIDOOR Flutter Client

This directory contains the Flutter multi-platform application for **NAVIDOOR**, supporting **Web, Windows Desktop, Android Phone, iOS, and macOS**.

---

## ⚡ Quick Reference: Run Commands

> [!NOTE]
> Make sure the backend server is running in the project root (`npm run server`) so the Flutter app can connect to local Whisper STT, IndicF5 TTS, and Socket.IO services on port `5001`.

### 1. 🌐 Web (Google Chrome / Microsoft Edge)

Run in Chrome:
```bash
flutter run -d chrome
npm run flutter:web
```

Run in Microsoft Edge:
```bash
flutter run -d edge
```

Specify a custom web port:
```bash
flutter run -d chrome --web-port 3000
```

---

### 2. 💻 Windows Desktop

Run as a native Windows desktop app:
```bash
flutter run -d windows
npm run flutter:desktop
```

---

### 3. 📱 Android Phone / Emulator

1. Connect your Android phone with **USB Debugging** enabled, or start an emulator in Android Studio.
2. Check that your device is detected:
   ```bash
   flutter devices
   ```
3. Run the app:
   ```bash
   flutter run -d android
   npm run flutter:mobile
   ```
   *(Or if multiple devices are attached, use the device ID: `flutter run -d <DEVICE_ID>`)*

---

### 4. 🍏 iOS Phone / Simulator (macOS Required)

1. Open the iOS Simulator:
   ```bash
   open -a Simulator
   ```
2. Run on the simulator or plugged-in iPhone:
   ```bash
   flutter run -d ios
   ```

---

### 5. 🍏 macOS Desktop (macOS Required)

```bash
flutter run -d macos
```

---

## 📦 Production Build Commands

Generate release-ready binaries for distribution:

| Target Platform | Command | Output Artifact Location |
|---|---|---|
| **Web** | `flutter build web` | `build/web/` |
| **Windows Desktop** | `flutter build windows` | `build/windows/x64/runner/Release/` |
| **Android APK** | `flutter build apk --release` | `build/app/outputs/flutter-apk/app-release.apk` |
| **Android App Bundle (Play Store)** | `flutter build appbundle` | `build/app/outputs/bundle/release/` |
| **iOS (App Store / TestFlight)** | `flutter build ios --release` | `build/ios/iphoneos/` |
| **macOS Desktop** | `flutter build macos` | `build/macos/Build/Products/Release/` |

---

## 🧪 Testing & Code Quality

Run tests and static analysis inside this directory:

```bash
# 1. Analyze code (linting & type safety)
flutter analyze

# 2. Run automated tests
flutter test

# 3. Clean project build cache (if needed)
flutter clean && flutter pub get
```

---

## 🛠 Project Structure

- `lib/main.dart` — App root, Google Fonts Inter theme, role-based navigation.
- `lib/theme/design_system.dart` — Color tokens (Slate Gray `#64748B`, Electric Cyan `#0284C7`), high-contrast modes, responsive layout helpers.
- `lib/models/nav_models.dart` — Data models (`NavMode`, `VoiceState`, `UserRole`, `DetectedObject`, `MedicineInfo`).
- `lib/providers/navidoor_provider.dart` — Central reactive state management (`ChangeNotifier`).
- `lib/services/api_service.dart` — REST communication with backend (`/api/stt`, `/api/chat`, `/api/tts`, `/api/family/*`).
- `lib/services/socket_service.dart` — Real-time Socket.IO event handler for emergency SOS & caregiver telemetry.
- `lib/services/audio_service.dart` — Audio playback (`audioplayers`) & 16kHz mono WAV mic recording for Whisper STT.
- `lib/screens/main_user_screen.dart` — User assist view (mobile stack / desktop split view).
- `lib/screens/family_portal_screen.dart` — Caregiver companion dashboard (5 tabs & desktop navigation rail).
- `lib/screens/role_selection_screen.dart` — Initial onboarding ("I Need Assistance" vs "I am a Family Caregiver").
- `lib/screens/modals/` — Emergency SOS countdown dialog and user medical profile modal.
