"""
NAVIDOOR YOLO AI Vision Server
Runs on port 5003, accepting camera frames via REST or base64 payloads,
performing YOLO detection, distance estimation, and generating voice guidance.
"""

import os
import sys
import base64
import io
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

# Ensure yolo package is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.detector import YOLODetector

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("YOLO_PORT", 5003))

# Initialize YOLO Detector
detector = YOLODetector(model_name="yolov8n.pt", confidence_threshold=0.35)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "NAVIDOOR YOLO AI Vision Service",
        "port": PORT,
        "engine": "ultralytics" if detector.is_ultralytics_loaded else "fallback-demo",
        "model_loaded": detector.model is not None,
        "confidence_threshold": detector.confidence_threshold,
    })

@app.route("/detect", methods=["POST"])
def detect_objects():
    """
    Accepts:
      - JSON: { "image": "base64_encoded_image_string", "language": "en" | "hi" | "mr" }
      - Or Multipart Form Data: image file under key 'image' or 'file'
    """
    try:
        language = "en"
        image_np = None

        if request.is_json:
            data = request.get_json()
            if not data or "image" not in data:
                return jsonify({"success": False, "error": "Missing 'image' field in JSON"}), 400

            language = data.get("language", "en")
            raw_b64 = data["image"]
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]

            image_bytes = base64.b64decode(raw_b64)
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_np = np.array(pil_img)
        elif request.files:
            file_key = "image" if "image" in request.files else ("file" if "file" in request.files else None)
            if not file_key:
                return jsonify({"success": False, "error": "No image file uploaded"}), 400

            file = request.files[file_key]
            language = request.form.get("language", "en")
            pil_img = Image.open(file.stream).convert("RGB")
            image_np = np.array(pil_img)
        else:
            return jsonify({"success": False, "error": "Unsupported request format. Send JSON or multipart."}), 400

        result = detector.detect_frame(image_np, language=language)
        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/detect/bus", methods=["POST"])
def detect_bus():
    """Smart Public Transport Bus Assistant endpoint."""
    try:
        # Run general detection
        res = detect_objects()
        if isinstance(res, tuple):
            return res
        data = res.get_json()
        if not data.get("success"):
            return jsonify(data)

        # Filter for bus, truck, car, person
        bus_detections = [d for d in data.get("detections", []) if d.get("class") in ["bus", "truck", "car"]]
        data["bus_detections"] = bus_detections
        data["bus_arrived"] = len(bus_detections) > 0
        if data["bus_arrived"]:
            closest = min(bus_detections, key=lambda x: x.get("distance_meters", 10.0))
            data["voice_guidance"] = f"Bus detected {closest['distance_meters']} meters {closest['zone'].lower()}."

        return jsonify(data)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/detect/medicine", methods=["POST"])
def detect_medicine():
    """Medicine Recognition endpoint."""
    try:
        res = detect_objects()
        if isinstance(res, tuple):
            return res
        data = res.get_json()
        if not data.get("success"):
            return jsonify(data)

        # Filter for bottle, medicine_box, medicine_strip
        med_detections = [d for d in data.get("detections", []) if d.get("class") in ["bottle", "medicine_box", "cup", "book"]]
        data["medicine_detections"] = med_detections
        data["medicine_detected"] = len(med_detections) > 0
        if data["medicine_detected"]:
            data["voice_guidance"] = "Medicine container detected. Hold steady to read prescription."

        return jsonify(data)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  NAVIDOOR YOLO AI Vision Server")
    print(f"  Running on: http://0.0.0.0:{PORT} (LAN accessible)")
    print(f"  Health Check: http://localhost:{PORT}/health")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=PORT, debug=False)
