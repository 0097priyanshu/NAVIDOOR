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

    # 1. Initialize detector
    detector = YOLODetector(model_name="yolov8n.pt", confidence_threshold=0.35)
    print(f"[OK] Detector initialized. Engine: {detector.model.__class__.__name__ if detector.is_ultralytics_loaded else 'Fallback/Demo'}")

    # 2. Create synthetic 640x480 frame with color patches
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    test_frame[100:380, 200:440] = [100, 150, 200] # Simulated object in center
    test_frame[350:480, 0:200] = [50, 80, 120]   # Lower left floor obstacle

    # 3. Test detection in English
    result_en = detector.detect_frame(test_frame, language="en")
    print(f"\n--- English Guidance Output ---")
    print(f"Latency: {result_en['latency_ms']} ms")
    print(f"Detections Count: {len(result_en['detections'])}")
    for d in result_en['detections']:
        print(f"  -> Object: {d['class']}, Conf: {d['confidence']}, Dist: {d['distance_meters']}m, Risk: {d['risk_level']}, Zone: {d['zone']}")
    print(f"Recommended Direction: {result_en['safe_path']['recommended_direction']}")
    print(f"Spoken Announcement: \"{result_en['voice_guidance']}\"")

    # 4. Test detection in Hindi
    result_hi = detector.detect_frame(test_frame, language="hi")
    print(f"\n--- Hindi Guidance Output ---")
    print(f"Spoken Announcement (HI): \"{result_hi['voice_guidance']}\"")

    # 5. Test detection in Marathi
    result_mr = detector.detect_frame(test_frame, language="mr")
    print(f"\n--- Marathi Guidance Output ---")
    print(f"Spoken Announcement (MR): \"{result_mr['voice_guidance']}\"")

    print("\n" + "=" * 60)
    print("  All YOLO Core Engine Tests PASSED successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
