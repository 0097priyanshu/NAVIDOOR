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
from PIL import Image, ImageOps
import numpy as np

# Ensure Windows terminal prints UTF-8 Devanagari characters cleanly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure yolo package is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.detector import YOLODetector

import threading
import gc

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("YOLO_PORT", 5003))

# Initialize YOLO Detector once at startup (confidence 0.28 for balanced precision & recall)
detector = YOLODetector(model_name="yolo11n.pt", confidence_threshold=0.28)

# Single-flight concurrency lock to prevent overlapping inference on the same model
inference_lock = threading.Lock()

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "NAVIDOOR YOLO AI Vision Service",
        "port": PORT,
        "engine": "ultralytics" if detector.is_ultralytics_loaded else "fallback-demo",
        "model_loaded": detector.model is not None,
        "confidence_threshold": detector.confidence_threshold,
        "inference_busy": inference_lock.locked(),
    })

def _process_frame_request(filter_type=None):
    """
    Thread-safe frame processor:
    - Enforces single-flight inference (drops overlapping frames with HTTP 429)
    - Validates payload size and image dimensions
    - Explicitly cleans up image buffers to prevent Python memory bloat
    """
    acquired = inference_lock.acquire(blocking=False)
    if not acquired:
        return jsonify({
            "success": False,
            "busy": True,
            "error": "Inference engine busy, frame dropped",
            "detections": [],
            "safe_path": {"recommended_direction": "FORWARD"},
            "voice_guidance": "",
            "latency_ms": 0
        }), 429

    raw_b64 = None
    image_bytes = None
    pil_img = None
    image_np = None

    try:
        language = "en"

        if request.is_json:
            data = request.get_json(silent=True)
            if not data or "image" not in data:
                print(f"[YOLO 400] Missing 'image' in JSON. Keys: {list(data.keys()) if data else 'None'}")
                return jsonify({"success": False, "error": "Missing 'image' field in JSON"}), 400

            language = data.get("language", "en")
            raw_b64 = data["image"]
            if not isinstance(raw_b64, str) or len(raw_b64) < 10:
                print(f"[YOLO 400] Invalid image payload: type={type(raw_b64)}, len={len(raw_b64) if isinstance(raw_b64, str) else 0}")
                return jsonify({"success": False, "error": "Invalid image payload"}), 400

            # Guard against abnormally large payloads (> 30MB base64)
            if len(raw_b64) > 30 * 1024 * 1024:
                print(f"[YOLO 400] Payload exceeds 30MB: len={len(raw_b64)}")
                return jsonify({"success": False, "error": "Payload exceeds maximum allowed size (30MB)"}), 400

            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]

            image_bytes = base64.b64decode(raw_b64)
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif request.files:
            file_key = "image" if "image" in request.files else ("file" if "file" in request.files else None)
            if not file_key:
                print(f"[YOLO 400] No image file uploaded in multipart: {list(request.files.keys())}")
                return jsonify({"success": False, "error": "No image file uploaded"}), 400

            file = request.files[file_key]
            language = request.form.get("language", "en")
            pil_img = Image.open(file.stream).convert("RGB")
        else:
            print(f"[YOLO 400] Unsupported format: is_json={request.is_json}, Content-Type={request.headers.get('Content-Type')}")
            return jsonify({"success": False, "error": "Unsupported request format. Send JSON or multipart."}), 400

        # Correct camera sensor orientation via EXIF metadata (crucial for portrait mobile captures)
        try:
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass

        # Handle explicit client orientation or portrait sensor inversion
        req_orientation = None
        if request.is_json and data:
            req_orientation = data.get("orientation")
        if req_orientation == "portrait" and pil_img.width > pil_img.height:
            # Rotated landscape sensor buffer from mobile camera
            pil_img = pil_img.rotate(270, expand=True)

        # Validate decoded image dimensions (support any smartphone resolution up to 8K)
        width, height = pil_img.size
        if width < 16 or height < 16 or width > 8192 or height > 8192:
            print(f"[YOLO 400] Invalid frame dimensions: {width}x{height}")
            return jsonify({"success": False, "error": f"Invalid frame dimensions: {width}x{height}"}), 400

        # Downscale large mobile images to max 1280px in memory to save RAM and accelerate inference
        if width > 1280 or height > 1280:
            pil_img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)

        # Execute single inference pass on model with native PIL RGB Image
        result = detector.detect_frame(pil_img, language=language)

        if filter_type == "bus":
            bus_detections = [d for d in result.get("detections", []) if d.get("class") in ["bus", "truck", "car"]]
            result["bus_detections"] = bus_detections
            result["bus_arrived"] = len(bus_detections) > 0
            if result["bus_arrived"]:
                closest = min(bus_detections, key=lambda x: x.get("distance_meters", 10.0))
                result["voice_guidance"] = f"Bus detected {closest['distance_meters']} meters {closest['zone'].lower()}."

        elif filter_type == "medicine":
            # Only match actual medicine and pharmacy items; never misclassify a general cup or book
            med_detections = [d for d in result.get("detections", []) if d.get("class") in ["bottle", "medicine_box", "medicine_strip"]]
            result["medicine_detections"] = med_detections
            result["medicine_detected"] = len(med_detections) > 0
            if result["medicine_detected"]:
                closest = min(med_detections, key=lambda x: x.get("distance_meters", 10.0))
                result["voice_guidance"] = f"Medicine bottle detected {closest['distance_meters']}m ahead. Hold steady to read prescription."

        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        # Promptly release temporary image buffers and heap resources
        try:
            if pil_img is not None:
                pil_img.close()
                del pil_img
            if image_bytes is not None:
                del image_bytes
            if raw_b64 is not None:
                del raw_b64
            if image_np is not None:
                del image_np
        except Exception:
            pass
        inference_lock.release()

@app.route("/detect", methods=["POST"])
def detect_objects():
    return _process_frame_request()

@app.route("/detect/bus", methods=["POST"])
def detect_bus():
    return _process_frame_request(filter_type="bus")

@app.route("/detect/medicine", methods=["POST"])
def detect_medicine():
    return _process_frame_request(filter_type="medicine")

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  NAVIDOOR YOLO AI Vision Server (Optimized Continuous)")
    print(f"  Running on: http://0.0.0.0:{PORT} (LAN accessible)")
    print(f"  Health Check: http://localhost:{PORT}/health")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=PORT, debug=False)
