# NAVIDOOR

NAVIDOOR is an accessibility focused mobile and web prototype with a camera based vision assistant and hands free voice interaction. The app is built with Expo and React Native, with a Node.js backend and a Python YOLO vision service.

This branch updates the continuous voice and vision experience: the app can keep listening for the NAVIDOOR user, automatically stop recordings after speech and silence (or a maximum recording duration), use recent camera detections as context for voice questions, and coordinate spoken vision guidance with assistant speech. These features are prototype functionality and have not been safety validated for mobility decisions.

## Branch updates

- **Continuous voice loop:** The NAVIDOOR user screen restarts microphone listening when the assistant is idle. It waits for assistant speech and queued vision announcements to finish before listening again. Listening is not started for family accounts or during first time onboarding.
- **Recording and voice activity detection:** Mobile and web recording use a short ambient-noise calibration followed by an adaptive speech threshold. Speech recordings finalize after about 1.7 seconds of silence or after a 9 second maximum; users can also stop a recording manually. The backend transcribes uploaded audio with the configured Whisper.cpp pipeline.
- **Vision guidance coordination:** Continuous vision announcements are queued around user listening, processing, and speech. Perception requests have bounded timeouts, session cancellation, and backend-proxy fallback; repeated failures are rate limited in logs.
- **Recent camera context for questions:** Successful detections can publish a compact snapshot for the active voice session. The backend keeps snapshots briefly (up to 3 seconds) and uses the freshest attached or cached snapshot when answering a surroundings question, avoiding stale scene context.
- **YOLO process recovery:** `npm run yolo` now starts a supervisor that restarts the Python vision service if it exits. Stop it with Ctrl+C.

## Project layout

```text
frontend/   Expo / React Native app and voice, camera, and vision client logic
backend/    Express API, Socket.IO, Whisper integration, and assistant orchestration
yolo/       Flask vision API and YOLO detection / scene analysis code
ocr/        OCR service
```

## Requirements

- Node.js and npm
- Python 3.10 for the YOLO service, with packages from `yolo/requirements.txt`
- The YOLO model weights expected by the detector
- Whisper.cpp executable and model for server side speech transcription
- Optional local services: Ollama for LLM answers, OCR service for text reading, and IndicF5 service for neural speech synthesis

Install JavaScript dependencies from the repository root:

```bash
npm install
```

Install YOLO dependencies in the Python environment you intend to use:

```bash
python -m pip install -r yolo/requirements.txt
```

The speech setup helper downloads the Whisper tiny model and, on Windows, a Whisper.cpp executable. Run it only when you want to set up that optional speech-to-text path; it requires network access:

```bash
node backend/scripts/setup_speech_pipeline.js
```

## Run locally

Start each service in a separate terminal from the repository root.

1. Start YOLO (the supervisor restarts the service after an unexpected exit):

   ```bash
   npm run yolo
   ```

2. Start the Node.js backend on port `5001`:

   ```bash
   npm run server
   ```

3. Start the app in a browser on port `8081`:

   ```bash
   npm run web
   ```

   Or start Expo with a tunnel for a phone running Expo Go:

   ```bash
   npm run tunnel
   ```

The backend exposes `GET http://localhost:5001/api/health`. Vision service health is available through the backend at `GET /api/yolo/health`. Ollama, OCR, and IndicF5 are separate services and are only needed for their respective features.

Press Ctrl+C in each terminal to stop its process.

## Voice and vision behavior

Voice capture is coordinated through the app's voice state (`idle`, `listening`, `thinking`, and `speaking`). The continuous loop is enabled by the NAVIDOOR user screen and yields to onboarding, family accounts, assistant responses, and queued vision guidance. The recording service applies adaptive metering-based speech detection on supported inputs and sends recorded audio to the backend `/api/stt` endpoint.

Vision analysis is requested from the YOLO service through the client and backend. Recent scene snapshots are associated with a voice session and expire after 3 seconds. The `/api/chat` endpoint uses a fresh supplied or cached snapshot as context; if neither is fresh, surroundings answers are instructed to say that no current detections are available rather than inventing objects.

Treat distance estimates, hazard labels, and path guidance as experimental. They may be wrong and are not a replacement for a cane, guide dog, or other established mobility aid.

## Main backend endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Backend and dependent service status |
| `GET /api/yolo/health` | YOLO service status |
| `POST /api/vision/detect` | Submit an image for vision analysis |
| `POST /api/vision/snapshot` | Cache recent vision context for a session |
| `POST /api/chat` | Ask the assistant, optionally with a vision snapshot |
| `POST /api/stt` | Transcribe uploaded microphone audio |
| `POST /api/tts` | Synthesize speech through the configured TTS service |
