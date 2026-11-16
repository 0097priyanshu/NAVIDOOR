# NAVIDOOR Run Guide

This guide assumes the required Node.js dependencies and Python YOLO environment are already installed on this laptop.

Project location:

```text
D:\navi\NAVIDOOR
```

Ollama is optional and is not required for the basic application startup.

## Run on the laptop

### 1. Start the YOLO vision service

Open PowerShell window 1:

```powershell
cd D:\navi\NAVIDOOR
.\.venv\Scripts\Activate.ps1
python yolo\yolo_server.py
```

Leave this window running. YOLO uses port `5003`.

### 2. Start the Node.js backend

Open PowerShell window 2:

```powershell
cd D:\navi\NAVIDOOR
npm run server
```

Leave this window running. The backend uses port `5001`.

Optional health check:

```powershell
Invoke-RestMethod http://localhost:5001/api/health
```

### 3. Start the frontend in a browser

Open PowerShell window 3:

```powershell
cd D:\navi\NAVIDOOR
npm run web
```

Open the URL shown by Expo in the browser.

## Run on a mobile phone

### 1. Prepare the laptop and phone

- Connect the phone to the internet.
- For the most reliable local setup, connect the laptop and phone to the same Wi-Fi network.
- Install **Expo Go** on the phone.
- Allow Node.js/Python through Windows Firewall if Windows asks.

### 2. Start the YOLO service

PowerShell window 1:

```powershell
cd D:\navi\NAVIDOOR
.\.venv\Scripts\Activate.ps1
python yolo\yolo_server.py
```

### 3. Start the backend

PowerShell window 2:

```powershell
cd D:\navi\NAVIDOOR
npm run server
```

### 4. Start Expo with a tunnel

PowerShell window 3:

```powershell
cd D:\navi\NAVIDOOR
npm run tunnel
```

When Expo displays a QR code:

- Android: scan it from the Expo Go app.
- iPhone: scan it with the Camera app and open it in Expo Go.

The app discovers the laptop backend automatically when the Expo host is reachable. If the phone cannot connect, check that the backend is running and that Windows Firewall permits port `5001`.

## Stop the application

In each running PowerShell window, press:

```text
Ctrl+C
```

Stop the YOLO window, backend window, and Expo window separately.

## Start it again later

The next time, no installation is needed. Repeat only:

```text
1. Start YOLO
2. Start the backend
3. Start the web frontend or Expo tunnel
```

Use the same commands from the sections above.

## Services currently not required

The application can start without these optional services:

- **Ollama:** AI chat and local LLM reasoning will be unavailable.
- **IndicF5:** neural Indian-language TTS will be unavailable.
- **Whisper setup:** server-side speech-to-text may be unavailable.

