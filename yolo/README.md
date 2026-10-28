# NAVIDOOR — YOLOv11 AI Vision Assist Module

The **YOLOv11 AI Vision Assist Module** provides real-time computer vision inference, obstacle and hazard detection, 3D pinhole distance estimation, safe walking corridor clearance analysis, and multilingual spoken guidance for blind, visually impaired, and elderly users.

It is powered by a high-performance **Triple-Model YOLOv11 Architecture** running as an independent Python microservice on port **5003**.

---

## 🚀 Capabilities & Features

1. **Triple-Model Vision Engine (COCO + Custom Directional Staircase + Pothole Hazard)**:
   - **Primary Model (`yolo11n.pt`)**: 80 standard COCO classes (pedestrians, vehicles, obstacles, furniture, doors, etc.).
   - **Specialized Directional Staircase Model (`models/yolo11n_staircase.pt`)**: Custom fine-tuned YOLO11 nano model specifically trained on 502 annotated staircase samples to detect:
     - `upstair` (stairs ascending ahead)
     - `downstair` (stairs descending ahead — critical fall risk)
   - **Specialized Pothole Road Hazard Model (`models/yolo11n_pothole.pt`)**: Custom fine-tuned YOLO11 nano model trained on Roboflow annotated road hazards to detect:
     - `pothole` (ground road cavity / hole — immediate trip and fall hazard)
   - Runs models concurrently on CPU, seamlessly merging detections into unified obstacle and corridor alerts.
2. **Invisible Background Vision Processing**:
   - Detection, 3D distance calculations, and corridor analysis run completely in the background without cluttering the mobile camera canvas with bounding box overlays.
   - Eliminates visual distractions while providing rich audio and tactile haptic feedback to visually impaired users.
3. **Unified Left `SCAN` Button Integration**:
   - Integrated with the mobile client's single left `SCAN` button (`CameraControlsOverlay`), triggering high-resolution capture, instant inference, and immediate spoken guidance.
4. **Pinhole Geometry 3D Distance Estimation & Dynamic Audio Beeps**:
   - Calculates real-world distance using physical object dimensions and camera focal geometry:
     $$\text{Distance} = \frac{H_{\text{real}} \cdot f_{\text{camera}}}{h_{\text{bbox}}}$$
   - Calibrated heights: `pothole` = 0.15m ground hazard ratio, `upstair` = 1.2m, `downstair` = 1.0m, `person` = 1.7m, `door` = 2.0m.
   - Classifies risk levels for immediate tactile/audio feedback:
     - `CRITICAL` (< 1.2 meters): Rapid audio beeping + urgent collision/fall alert.
     - `WARNING` (1.2m – 2.5m): Medium-paced audio beeping + approaching obstacle hint.
     - `INFO` (2.5m – 5.0m): Facility or landmark announcement.
5. **Safe Walking Path Corridor Analysis**:
   - Divides the live camera frame into 3 vertical zones: `LEFT`, `CENTER`, and `RIGHT`.
   - Computes corridor clearance and recommends path deviations (e.g. *"Pothole 0.4m directly ahead. Please stop."*).
6. **Multilingual Spoken Announcements (10 Indian Languages)**:
   - Formats voice guidance cues across **English**, **Hindi** (हिन्दी), **Marathi** (मराठी), **Gujarati** (ગુજરાતી), **Punjabi** (ਪੰਜਾਬੀ), **Bengali** (বাংলা), **Tamil** (தமிழ்), **Telugu** (తెలుగు), **Kannada** (ಕನ್ನಡ), and **Malayalam** (മലയാളം).

---

## 📊 Fine-Tuned Model Benchmarks & Metrics

### 1. Pothole Road Hazard Model (`models/yolo11n_pothole.pt`)
| Metric | Value |
| :--- | :--- |
| **Model Base** | Ultralytics YOLO11 Nano (`yolo11n.pt`) |
| **Dataset** | 665 Roboflow annotated images (465 train / 133 val / 67 test) |
| **Classes** | `0: pothole` |
| **Test Set mAP@50** | **78.0% (0.7796)** |
| **Validation mAP@50** | **77.3% (0.7730)** |
| **Precision** | **82.9% (0.8290)** |
| **Recall** | **68.0% (0.6800)** |
| **Test mAP@50-95** | **46.8% (0.4681)** |
| **Model File Size** | **5.50 MB** |

### 2. Directional Staircase Model (`models/yolo11n_staircase.pt`)
| Metric | Value |
| :--- | :--- |
| **Model Base** | Ultralytics YOLO11 Nano (`yolo11n.pt`) |
| **Dataset** | 502 Pascal VOC XML + JPG image pairs (402 train / 100 val) |
| **Classes** | `0: upstair`, `1: downstair` |
| **Overall mAP@50** | **70.5% (0.705)** |
| `upstair` mAP@50 | **69.0% (0.690)** |
| `downstair` mAP@50 | **71.9% (0.719)** |
| **Model File Size** | **5.46 MB** |

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
  "language": "hi"
}
```
- **Response**:
```json
{
  "success": true,
  "detections": [
    {
      "class": "pothole",
      "class_id": 0,
      "confidence": 0.82,
      "bbox": [141, 144, 594, 487],
      "distance_meters": 0.4,
      "risk_level": "CRITICAL",
      "zone": "CENTER",
      "source": "pothole"
    }
  ],
  "safe_path": {
    "recommended_direction": "STOP",
    "path_state": "PATH_OBSTRUCTED",
    "corridors": {
      "left": { "clear": true, "count": 0 },
      "center": { "clear": false, "count": 1 },
      "right": { "clear": true, "count": 0 }
    }
  },
  "voice_guidance": "बिल्कुल सामने 0.4 मीटर पर गड्ढा है। कृपया रुकें।",
  "latency_ms": 28.4
}
```

---

## 📁 Module Structure

```text
yolo/
├── yolo_server.py             # Flask inference server (Port 5003)
├── test_yolo.py               # Automated unit test suite (8 test categories)
├── train_pothole.py           # Training script for pothole detector
├── requirements.txt           # ultralytics, torch, opencv-python, flask
├── models/
│   ├── yolo11n.pt             # Primary YOLOv11 Nano general weights (80 COCO classes)
│   ├── yolo11n_staircase.pt   # Fine-tuned directional staircase model (upstair / downstair)
│   └── yolo11n_pothole.pt     # Fine-tuned pothole road hazard model (pothole)
└── core/
    ├── detector.py            # Triple-model inference orchestrator
    ├── distance_estimator.py  # Pinhole distance & 3-corridor analysis
    ├── scene_analyzer.py      # Spatial clearance & path validation
    ├── guidance_generator.py  # 10-language voice alert synthesis
    └── indian_labels.py       # Indian contextual classes & translations
```
