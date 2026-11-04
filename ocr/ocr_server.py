"""
NAVIDOOR OCR Reading Assistant Server
Runs on port 5004, accepting camera frames via REST payloads,
performing preprocessing, text detection, multilingual recognition,
spatial sorting, and domain entity classification.
"""

import os
import sys
import io
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

# Ensure Windows terminal prints UTF-8 Devanagari characters cleanly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add ocr directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.ocr_engine import OCREngine

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("OCR_PORT", 5004))

# Initialize OCR Engine with English and Hindi/Marathi (Devanagari)
ocr_engine = OCREngine(languages=['en', 'hi'], gpu=False)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "NAVIDOOR OCR Reading Assistant",
        "port": PORT,
        "engine": "EasyOCR (CRAFT + Multilingual Recognition)",
        "models_loaded": ocr_engine.reader is not None,
        "supported_languages": ["en", "hi", "mr"],
        "supported_categories": [
            "signboards",
            "door_labels",
            "hospital_departments",
            "bus_boards",
            "medicine_labels",
            "documents",
            "notices",
            "menus",
            "product_labels"
        ]
    })

@app.route("/ocr/read", methods=["POST"])
def read_text():
    """
    Main endpoint for OCR reading.
    Accepts:
      - JSON: { "image": "base64_string", "mode": "glance" | "deep", "category_hint": "..." }
      - Multipart Form: image file under key 'image' or 'file'
    """
    try:
        mode = "glance"
        category_hint = None
        image_payload = None

        if request.is_json:
            data = request.get_json()
            if not data or "image" not in data:
                return jsonify({"success": False, "error": "Missing 'image' field in JSON"}), 400
            image_payload = data["image"]
            mode = data.get("mode", "glance")
            category_hint = data.get("category_hint", None)

        elif request.files:
            file_key = "image" if "image" in request.files else ("file" if "file" in request.files else None)
            if not file_key:
                return jsonify({"success": False, "error": "No image file uploaded"}), 400
            
            uploaded_file = request.files[file_key]
            mode = request.form.get("mode", "glance")
            category_hint = request.form.get("category_hint", None)
            
            pil_img = Image.open(uploaded_file.stream).convert("RGB")
            # PIL RGB -> OpenCV BGR
            image_payload = np.array(pil_img)[:, :, ::-1]

        else:
            return jsonify({"success": False, "error": "Unsupported media type. Send JSON with base64 image or multipart/form-data."}), 415

        result = ocr_engine.process_image(image_payload, mode=mode, category_hint=category_hint)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/ocr/glance", methods=["POST"])
def glance_read():
    """Fast low-latency endpoint for live viewfinder scanning."""
    try:
        data = request.get_json() or {}
        image_payload = data.get("image")
        if not image_payload:
            return jsonify({"success": False, "error": "Missing image"}), 400
        result = ocr_engine.process_image(image_payload, mode="glance")
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/ocr/deep", methods=["POST"])
def deep_read():
    """High-definition endpoint for dense documents, medicine prescriptions, and menus."""
    try:
        data = request.get_json() or {}
        image_payload = data.get("image")
        category_hint = data.get("category_hint")
        if not image_payload:
            return jsonify({"success": False, "error": "Missing image"}), 400
        result = ocr_engine.process_image(image_payload, mode="deep", category_hint=category_hint)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print(f"[*] Starting NAVIDOOR OCR Reading Server on http://0.0.0.0:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)

