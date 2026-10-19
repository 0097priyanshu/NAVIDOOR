# NAVIDOOR – YOLOv11 AI Vision Assist Module

The **YOLOv11 AI Vision Assist Module** provides real-time computer vision inference, obstacle and hazard detection, 3D pinhole distance estimation, safe walking corridor clearance analysis, and multilingual spoken guidance for blind, visually impaired, and elderly users.

It is powered by official state-of-the-art **Ultralytics YOLOv11** (`yolo11n.pt`) and runs as an independent high-performance Python microservice on port **5003**.

---

## 🌟 Capabilities & Features

1. **Obstacle & Hazard Detection (YOLOv11 Nano)**:
   - Pedestrians, vehicles (cars, buses, auto-rickshaws, motorcycles, bicycles).
   - Architectural elements: doors, open doorways, stairs, ramps, elevators, poles.
   - Ground hazards: puddles, potholes, open manholes, road dividers.
2. **Indian Public Transit Assistant**:
   - Detects incoming city buses and regional state transport buses.
   - Localizes bus front door and boarding zones.
3. **AI Medicine Assistant**:
   - Detects medicine bottles, pill containers, and blister packaging strips.
4. **Pinhole Geometry 3D Distance Estimation**:
   - Calculates real-world distance using physical object dimensions and camera focal geometry:
     $$\text{Distance} = \frac{H_{\text{real}} \cdot f_{\text{camera}}}{h_{\text{bbox}}}$$
   - Classifies risk levels for immediate tactile/audio feedback:
     - `CRITICAL` (< 1.2 meters): Urgent collision alert.
     - `WARNING` (1.2m – 2.5m): Approaching obstacle.
     - `INFO` (2.5m – 5.0m): Facility or landmark detection.
5. **Safe Walking Path Corridor Analysis**:
   - Divides the live camera frame into 3 vertical zones: `LEFT`, `CENTER`, and `RIGHT`.
   - Computes corridor clearance and recommends path deviations (e.g. *"Obstacle ahead. Step right."*).
6. **Multilingual Spoken Announcements**:
   - Formats voice guidance cues across **English**, **Hindi** (हिंदी), **Marathi** (मराठी), and all 10 supported regional languages.

---

## 🚀 How to Run the YOLOv11 Server

### 1. Install Dependencies
```bash
python -m pip install -r yolo/requirements.txt
```

### 2. Run the Verification Test Suite
```bash
python yolo/test_yolo.py
```

### 3. Start the YOLOv11 Server (Port 5003)
```bash
# Using npm shortcut from root:
npm run yolo

# Or running Python script directly:
python yolo/yolo_server.py
```
*(Server listens on `http://0.0.0.0:5003` — LAN accessible for mobile devices and Node.js backend).*

---

## 📡 API Reference

### 1. Health Check
`GET /health`
```json
{
  "status": "online",
  "service": "NAVIDOOR YOLOv11 AI Vision Service",
  "port": 5003,
  "engine": "ultralytics-yolo11",
  "model_loaded": true
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
      "class": "person",
      "confidence": 0.91,
      "bbox": [150, 100, 320, 420],
      "distance_meters": 2.1,
      "risk_level": "WARNING",
      "zone": "CENTER"
    }
  ],
  "safe_path": {
    "recommended_direction": "RIGHT",
    "guidance_hint": "समोर अडथळा आहे. उजवीकडे व्हा.",
    "corridors": {
      "left": { "clear": false, "count": 1 },
      "center": { "clear": false, "count": 1 },
      "right": { "clear": true, "count": 0 }
    }
  },
  "voice_guidance": "समोर व्यक्ती २.१ मीटर अंतरावर आहे. उजवीकडे व्हा.",
  "latency_ms": 28.4
}
```

### 3. Bus & Door Detection
`POST /detect/bus`
- Localizes bus front door entry vectors and boarding guidance.

### 4. Medicine Detection
`POST /detect/medicine`
- Identifies pill bottles, blister strips, and dosage labels.

---

## 🏗 Module Structure

```text
yolo/
├── yolo_server.py             # FastAPI / Flask inference server (Port 5003)
├── test_yolo.py               # Automated unit test suite
├── requirements.txt           # ultralytics, torch, opencv-python, flask
├── yolo11n.pt                 # YOLOv11 Nano model weights
└── core/
    ├── distance_estimator.py   # Pinhole distance & 3-corridor analysis
    └── indian_labels.py        # Indian contextual classes & translations
```
