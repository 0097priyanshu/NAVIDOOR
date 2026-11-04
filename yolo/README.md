# NAVIDOOR — YOLOv11 Multi-Model AI Vision Assist Module

The **YOLOv11 AI Vision Assist Module** provides real-time computer vision inference, obstacle and hazard detection, 3D pinhole distance estimation, safe walking corridor clearance analysis, and multilingual spoken guidance for blind, visually impaired, and elderly users.

It is powered by a high-performance **5-Model YOLOv11 Ensemble Architecture** running as an independent Python microservice on port **5003**.

---

## 🚀 Capabilities & Features

1. **5-Model Vision Engine (COCO + Directional Staircases + Potholes + Crosswalks + Elevators)**:
   - **Primary Model (`yolo11n.pt`)**: 80 standard COCO classes (pedestrians, vehicles, obstacles, furniture, doors, etc.).
   - **Specialized Directional Staircase Model (`models/yolo11n_staircase.pt`)**: Custom fine-tuned YOLO11 nano model specifically trained on 502 annotated staircase samples to detect:
     - `upstair` (stairs ascending ahead)
     - `downstair` (stairs descending ahead — critical fall risk)
   - **Specialized Pothole Road Hazard Model (`models/yolo11n_pothole.pt`)**: Custom fine-tuned YOLO11 nano model trained on 665 Roboflow annotated road hazards to detect:
     - `pothole` (ground road cavity / hole — immediate trip and fall hazard)
   - **Specialized Crosswalk Navigation Model (`models/yolo11n_crosswalk.pt`)**: Custom fine-tuned YOLO11 nano model trained on Roboflow pedestrian crossings (`crossing-264hc`) to detect:
     - `crosswalk` (pedestrian zebra crossing — essential street crossing aid)
   - **Specialized Elevator Navigation Model (`models/yolo11n_elevator.pt`)**: Custom fine-tuned YOLO11 nano model trained on Roboflow elevator samples (`elevator-awvus`) to detect:
     - `elevator` (indoor lift / elevator doors — indoor accessibility landmark)
   - Runs models concurrently on CPU, seamlessly merging detections into unified obstacle and corridor alerts.
2. **Invisible Background Vision Processing**:
   - Detection, 3D distance calculations, and corridor analysis run completely in the background without cluttering the mobile camera canvas with bounding box overlays.
   - Eliminates visual distractions while providing rich audio and tactile haptic feedback to visually impaired users.
3. **Unified Left `SCAN` Button Integration**:
   - Integrated with the mobile client's single left `SCAN` button (`CameraControlsOverlay`), triggering high-resolution capture, instant inference, and immediate spoken guidance.
4. **Pinhole Geometry 3D Distance Estimation & Dynamic Audio Beeps**:
   - Calculates real-world distance using physical object dimensions and camera focal geometry:
     $$\text{Distance} = \frac{H_{\text{real}} \cdot f_{\text{camera}}}{h_{\text{bbox}}}$$
   - Calibrated heights: `elevator` = 2.20m, `crosswalk` = 0.40m, `pothole` = 0.15m ground hazard ratio, `upstair` = 1.20m, `downstair` = 1.00m, `person` = 1.70m, `door` = 2.00m.
   - Classifies risk levels for immediate tactile/audio feedback:
     - `CRITICAL` (< 1.2 meters): Rapid audio beeping + urgent collision/fall alert.
     - `WARNING` (1.2m – 2.5m): Medium-paced audio beeping + approaching obstacle hint.
     - `INFO` (2.5m – 5.0m): Facility or landmark announcement.
5. **Safe Walking Path Corridor Analysis**:
   - Divides the live camera frame into 3 vertical zones: `LEFT`, `CENTER`, and `RIGHT`.
   - Computes corridor clearance and recommends path deviations (e.g. *"Elevator 2.1m directly ahead."*).
6. **Multilingual Spoken Announcements (10 Indian Languages)**:
   - Formats voice guidance cues across **English**, **Hindi** (हिन्दी), **Marathi** (मराठी), **Gujarati** (ગુજરાતી), **Punjabi** (ਪੰਜਾਬੀ), **Bengali** (বাংলা), **Tamil** (தமிழ்), **Telugu** (తెలుగు), **Kannada** (ಕನ್ನಡ), and **Malayalam** (മലയാളം).

---

## 📊 Research Paper Statistics & Benchmarks

The following table provides empirical performance metrics across all fine-tuned specialized vision models in the NAVIDOOR framework for academic benchmarking and research publications:

| Vision Model | Target Class(es) | Dataset Source | Total Dataset Images | Epochs | Precision (P) | Recall (R) | Test mAP@50 | Test mAP@50-95 | Weights Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`yolo11n_crosswalk.pt`** | `crosswalk` | Roboflow (`crossing-264hc`) | 173 (121 tr / 34 val / 18 te) | 20 | **94.1%** | **88.6%** | **91.6%** (0.9156) | **69.0%** (0.6896) | 5.50 MB |
| **`yolo11n_elevator.pt`** | `elevator` | Roboflow (`elevator-awvus`) | 1,783 (1,468 tr / 157 val / 158 te) | 12 | **85.2%** | **80.6%** | **88.1%** (0.8809) | **53.5%** (0.5353) | 5.50 MB |
| **`yolo11n_pothole.pt`** | `pothole` | Roboflow (`pothole-detection-using-yolov11-ipvd9`) | 665 (465 tr / 133 val / 67 te) | 20 | **82.9%** | **68.0%** | **78.0%** (0.7796) | **46.8%** (0.4681) | 5.50 MB |
| **`yolo11n_staircase.pt`** | `upstair`, `downstair` | Custom Pascal VOC Staircase Dataset | 502 (402 tr / 100 val) | 25 | **75.2%** | **68.4%** | **70.5%** (0.7050) | **41.2%** (0.4120) | 5.46 MB |
| **`yolo11n.pt`** (Base) | 80 COCO Classes | MS COCO 2017 Dataset | 118,287 images | Pretrained | **64.5%** | **53.8%** | **53.1%** (0.5310) | **39.5%** (0.3950) | 5.61 MB |

### Model Architecture Highlights:
- **Base Architecture**: Ultralytics YOLO11 Nano (`yolo11n.pt`, 2.6M parameters, 6.4 GFLOPs).
- **Optimization**: All production weights stripped of optimizer states to maintain minimal file footprints (~5.5MB each).
- **Inference Runtime**: All 5 models evaluate concurrently on standard multi-core mobile/desktop CPU in **~35ms total latency**, eliminating cloud dependency.

---

## 🛠️ How to Run the YOLOv11 Server

### 1. Install Dependencies
```bash
py -3.10 -m pip install -r yolo/requirements.txt
```

### 2. Start the YOLOv11 Server (Port 5003)
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
      "class": "elevator",
      "class_id": 0,
      "confidence": 0.82,
      "bbox": [138, 143, 329, 473],
      "distance_meters": 2.1,
      "risk_level": "WARNING",
      "zone": "CENTER",
      "source": "elevator"
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
  "voice_guidance": "बिल्कुल सामने 2.1 मीटर पर लिफ्ट है।",
  "latency_ms": 32.4
}
```

---

## 📁 Module Structure

```text
yolo/
├── yolo_server.py             # Flask inference server (Port 5003)
├── requirements.txt           # ultralytics, torch, opencv-python, flask
├── models/
│   ├── yolo11n.pt             # Primary YOLOv11 Nano general weights (80 COCO classes)
│   ├── yolo11n_staircase.pt   # Fine-tuned directional staircase model (upstair / downstair)
│   ├── yolo11n_pothole.pt     # Fine-tuned pothole road hazard model (pothole)
│   ├── yolo11n_crosswalk.pt   # Fine-tuned crosswalk pedestrian model (crosswalk)
│   └── yolo11n_elevator.pt    # Fine-tuned elevator indoor landmark model (elevator)
└── core/
    ├── detector.py            # 5-Model inference orchestrator
    ├── distance_estimator.py  # Pinhole distance & 3-corridor analysis
    ├── scene_analyzer.py      # Spatial clearance & path validation
    ├── guidance_generator.py  # 10-language voice alert synthesis
    └── indian_labels.py       # Indian contextual classes & translations
```
