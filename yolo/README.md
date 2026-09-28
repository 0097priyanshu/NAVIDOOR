# NAVIDOOR – YOLO AI Vision Assist Module

The **YOLO AI Vision Assist Module** provides real-time computer vision inference, obstacle detection, 3D distance estimation, safe walking corridor clearance, and multilingual spoken guidance for blind, visually impaired, and elderly users.

---

## 🌟 Capabilities

1. **Obstacle & Hazard Detection**:
   - Pedestrians, vehicles (cars, buses, auto-rickshaws, bikes, cycles).
   - Infrastructure: doors, stairs, ramps, elevators, poles, street signs.
   - Ground hazards: puddles, potholes, manholes, road dividers.
2. **Indian Public Transport Assistant**:
   - Detects incoming city buses and regional state transport buses.
   - Localizes bus front door and boarding zones.
3. **AI Medicine Assistant**:
   - Detects medicine bottles, pill containers, and medicine strips.
4. **Pinhole Distance Estimation**:
   - Uses real-world physical object dimensions and camera focal geometry:
     $$\text{Distance} = \frac{H_{\text{real}} \cdot f_{\text{camera}}}{h_{\text{bbox}}}$$
   - Classifies risk levels:
     - `CRITICAL` (< 1.2 meters): Urgent collision alert.
     - `WARNING` (1.2m – 2.5m): Approaching obstacle.
     - `INFO` (2.5m – 5.0m): Facility or landmark detection.
5. **Safe Walking Path Corridor Analysis**:
   - Divides scene into `LEFT`, `CENTER`, and `RIGHT` corridors.
   - Recommends path deviations (e.g., *"Obstacle ahead. Step right."*).
6. **Multilingual Spoken Announcements**:
   - Generates natural spoken cues in **English**, **Hindi** (हिंदी), and **Marathi** (मराठी).

---

## 🚀 How to Run the YOLO Server

### 1. Install Dependencies
```bash
python -m pip install -r yolo/requirements.txt
```

### 2. Run the Test Suite
```bash
python yolo/test_yolo.py
```

### 3. Start the YOLO Server (Port 5003)
```bash
python yolo/yolo_server.py
```
*(Server runs on `http://0.0.0.0:5003` - LAN accessible for mobile devices and Node.js backend).*

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
  "model_loaded": true
}
```

### 2. Real-Time Detection
`POST /detect`
- **Request Body (JSON)**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "language": "en"
}
```
- **Response**:
```json
{
  "success": true,
  "detections": [
    {
      "class": "person",
      "confidence": 0.89,
      "bbox": [150, 100, 320, 420],
      "distance_meters": 2.1,
      "risk_level": "WARNING",
      "zone": "CENTER"
    }
  ],
  "safe_path": {
    "recommended_direction": "RIGHT",
    "guidance_hint": "Obstacle ahead. Step right.",
    "corridors": {
      "left": { "clear": false, "count": 1 },
      "center": { "clear": false, "count": 1 },
      "right": { "clear": true, "count": 0 }
    }
  },
  "voice_guidance": "Person 2.1m directly ahead. Step right.",
  "latency_ms": 28.4
}
```

### 3. Bus Assistant
`POST /detect/bus`

### 4. Medicine Assistant
`POST /detect/medicine`
