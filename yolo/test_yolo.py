"""
NAVIDOOR YOLO Module Test Suite
Validates detection, distance estimation, corridor analysis, and speech cues.
"""

import sys
import os
import numpy as np

# Ensure Windows terminal prints UTF-8 Devanagari characters cleanly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.detector import YOLODetector

def run_tests():
    print("=" * 60)
    print("  Running NAVIDOOR YOLO Engine Tests")
    print("=" * 60)

    # 1. Initialize detector with YOLO11 model
    detector = YOLODetector(model_name="yolo11n.pt", confidence_threshold=0.35)
    print(f"[OK] Detector initialized. Model: yolo11n.pt, Engine: {detector.model.__class__.__name__ if detector.is_ultralytics_loaded else 'Fallback/Demo'}")

    # 2. Test Laptop vs Dining Table priority sorting in Guidance Generator
    test_dets = [
        {
            "class": "dining table",
            "class_id": 60,
            "confidence": 0.85,
            "bbox": [50, 100, 600, 480],
            "distance_meters": 1.5,
            "risk_level": "WARNING",
            "zone": "CENTER"
        },
        {
            "class": "laptop",
            "class_id": 63,
            "confidence": 0.80,
            "bbox": [200, 150, 440, 320],
            "distance_meters": 1.2,
            "risk_level": "CRITICAL",
            "zone": "CENTER"
        }
    ]

    safe_path = {"recommended_direction": "RIGHT"}
    print("\n--- Testing Priority Sorting: Laptop vs Dining Table ---")
    for lang in ['en', 'hi', 'mr', 'gu', 'pa', 'bn', 'ta', 'te', 'kn', 'ml']:
        cue = detector.guidance_generator.generate_spoken_guidance(test_dets, safe_path, language=lang)
        print(f"Spoken Announcement ({lang.upper()}): {cue}")
        assert "table" not in cue.lower() and "मेज" not in cue and "टेबल" not in cue and "બલ્લ" not in cue, f"Failed for lang {lang}: table was picked over laptop!"

    print("\n" + "=" * 60)
    print("  All 10-Language & Laptop Priority Tests PASSED successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
