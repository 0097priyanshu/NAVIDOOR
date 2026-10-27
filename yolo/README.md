# NAVIDOOR — YOLOv11 AI Vision Assist Module

The **YOLOv11 AI Vision Assist Module** provides real-time computer vision inference, obstacle and hazard detection, 3D pinhole distance estimation, safe walking corridor clearance analysis, and multilingual spoken guidance for blind, visually impaired, and elderly users.

It is powered by a high-performance **Dual-Model YOLOv11 Architecture** running as an independent Python microservice on port **5003**.

---

## 🚀 Capabilities & Features

1. **Dual-Model Vision Engine (COCO + Custom Directional Staircase)**:
   - **Primary Model (`yolo11n.pt`)**: 80 standard COCO classes (pedestrians, vehicles, obstacles, furniture, doors, etc.).
   - **Specialized Model (`models/yolo11n_staircase.pt`)**: Custom fine-tuned YOLO11 nano model specifically trained on 502 annotated staircase samples to detect:
     - `upstair` (stairs ascending ahead)
     - `downstair` (stairs descending ahead — critical fall risk)
   - Runs both models concurrently in ~30ms total on CPU, seamlessly merging detections.
2. **Invisible Background Vision Processing**:
   - Detection, 3D distance calculations, and corridor analysis run completely in the background without cluttering the mobile camera canvas with bounding box overlays.
   - Eliminates visual distractions while providing rich audio and tactile haptic feedback to visually impaired users.
3. **Unified Left `SCAN` Button Integration**:
   - Integrated with the mobile client's single left `SCAN` button (`CameraControlsOverlay`), triggering high-resolution capture, instant inference, and immediate spoken guidance.
4. **Pinhole Geometry 3D Distance Estimation & Dynamic Audio Beeps**:
   - Calculates real-world distance using physical object dimensions and camera focal geometry:
     $$\text{Distance} = \frac{H_{\text{real}} \cdot f_{\text{camera}}}{h_{\text{bbox}}}$$
   - Calibrated heights: `upstair` = 1.2m, `downstair` = 1.0m, `person` = 1.7m, `door` = 2.0m.
   - Classifies risk levels for immediate tactile/audio feedback:
     - `CRITICAL` (< 1.2 meters): Rapid audio beeping + urgent collision alert.
     - `WARNING` (1.2m – 2.5m): Medium-paced audio beeping + approaching obstacle hint.
     - `INFO` (2.5m – 5.0m): Facility or landmark announcement.
5. **Safe Walking Path Corridor Analysis**:
   - Divides the live camera frame into 3 vertical zones: `LEFT`, `CENTER`, and `RIGHT`.
   - Computes corridor clearance and recommends path deviations (e.g. *"Obstacle ahead. Step right."*).
6. **Multilingual Spoken Announcements (10 Indian Languages)**:
   - Formats voice guidance cues across **English**, **Hindi** (हिंदी), **Marathi** (मराठी), **Gujarati** (ગુજરાતી), **Punjabi** (ਪੰਜਾਬੀ), **Bengali** (বাংলা), **Tamil** (தமிழ்), **Telugu** (తెలుగు), **Kannada** (ಕನ್ನಡ), and **Malayalam** (മലയാളം).

---

## 📊 Fine-Tuned Staircase Model Metrics

| Metric | Value |
| :--- | :--- |
| **Model Base** | Ultralytics YOLO11 Nano (`yolo11n.pt`) |
| **Dataset** | 502 Pascal VOC XML + JPG image pairs (402 train / 100 val) |
| **Classes** | `0: upstair`, `1: downstair` |
| **Overall mAP@50** | **70.5% (0.705)** |
| `upstair` mAP@50 | **69.0% (0.690)** |
| `downstair` mAP@50 | **71.9% (0.719)** |
| **Inference Latency** | **~14.9 ms** per frame on CPU |
| **Model File Size** | **5.46 MB** (`models/yolo11n_staircase.pt`) |

---

## 🛠️ How to Run the YOLOv11 Server

### 1. Install Dependencies
```bash
py -3.10 -m pip install -r yolo/requirements.txt
```

### 2. Run the Verification Test Suite
```bash
npm run test:yolo
# Or directly:
py -3.10 yolo/test_yolo.py
```

### 3. Start the YOLOv11 Server (Port 5003)
```bash
# Using npm shortcut from root:
npm run yolo

# Or running Python script directly:
py -3.10 yolo/yolo_server.py
```
*(Server listens on `http://0.0.0.0:5003` — LAN accessible for mobile devices and Node.js backend).*

---

## 📡 API Reference

### 1. Health Check
`GET /health`
```json
{
  "status": "online",
  "service": "NAVIDOOR YOLO AI Vision Service",
  "port": 5003,
  "engine": "ultralytics",
  "model_loaded": true,
  "confidence_threshold": 0.28
}
```

### 2. Real-Time Detection
`POST /detect`
- **Request Body (JSON)**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "language": "mr"
}
```
- **Response**:
```json
{
  "success": true,
  "detections": [
    {
      "class": "downstair",
      "class_id": 1,
      "confidence": 0.64,
      "bbox": [33, 123, 189, 187],
      "distance_meters": 4.8,
      "risk_level": "INFO",
      "zone": "CENTER",
      "source": "staircase"
    }
  ],
  "safe_path": {
    "recommended_direction": "CAUTION",
    "path_state": "OBSTACLE_DETECTED",
    "corridors": {
      "left": { "clear": true, "count": 0 },
      "center": { "clear": false, "count": 1 },
      "right": { "clear": true, "count": 0 }
    }
  },
  "voice_guidance": "अगदी समोर 4.8 मीटरवर खाली जाणाऱ्या पायऱ्या आहे.",
  "latency_ms": 28.4
}
```

---

## 📂 Module Structure

```text
yolo/
├── yolo_server.py             # Flask inference server (Port 5003)
├── test_yolo.py               # Automated unit test suite
├── requirements.txt           # ultralytics, torch, opencv-python, flask
├── models/
│   ├── yolo11n.pt             # Primary YOLOv11 Nano general weights (80 COCO classes)
│   └── yolo11n_staircase.pt   # Fine-tuned directional staircase model (upstair / downstair)
└── core/
    ├── detector.py            # Dual-model inference orchestrator
    ├── distance_estimator.py   # Pinhole distance & 3-corridor analysis
    ├── scene_analyzer.py      # Spatial clearance & path validation
    ├── guidance_generator.py  # 10-language voice alert synthesis
    └── indian_labels.py       # Indian contextual classes & translations
```
