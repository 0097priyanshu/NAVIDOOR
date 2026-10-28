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

    # 3. Test 5-State Navigation Model: Empty detections must NEVER be PATH_CLEAR
    print("\n--- Testing Navigation State Model: Empty Detections ---")
    normal_empty_path = detector.scene_analyzer.analyze_clearance([], 640, 480)
    print(f"Empty Detections State: {normal_empty_path['path_state']} | Hint: {normal_empty_path['guidance_hint']}")
    assert normal_empty_path["path_state"] == "UNKNOWN", "Empty detections must be UNKNOWN, never PATH_CLEAR!"
    empty_cue = detector.guidance_generator.generate_spoken_guidance([], normal_empty_path, language="en")
    assert empty_cue == "", f"Empty detections must not produce clear path speech! Got: '{empty_cue}'"
    print("[PASS] Empty detections correctly yielded UNKNOWN state and zero speech spam.")

    # 4. Test Reduced Visibility: Dark scene
    print("\n--- Testing Reduced Visibility: Dark Scene ---")
    dark_frame = np.zeros((480, 640, 3), dtype=np.uint8) # Pitch black
    dark_path = detector.scene_analyzer.analyze_clearance([], 640, 480, image_input=dark_frame)
    print(f"Dark Frame State: {dark_path['path_state']} | Hint: {dark_path['guidance_hint']}")
    assert dark_path["path_state"] == "VISIBILITY_REDUCED", "Dark frame must be VISIBILITY_REDUCED!"
    dark_cue = detector.guidance_generator.generate_spoken_guidance([], dark_path, language="en")
    assert "visibility" in dark_cue.lower(), f"Dark scene should announce visibility warning. Got: '{dark_cue}'"
    print("[PASS] Dark frame correctly yielded VISIBILITY_REDUCED.")

    # 5. Test Flat Surface / Wall Across Corridor Detection
    print("\n--- Testing Flat Surface / Wall Across Walking Corridor ---")
    flat_wall_frame = np.full((480, 640, 3), 180, dtype=np.uint8) # Uniform painted wall
    wall_path = detector.scene_analyzer.analyze_clearance([], 640, 480, image_input=flat_wall_frame)
    print(f"Wall Frame State: {wall_path['path_state']} | Hint: {wall_path['guidance_hint']}")
    assert wall_path["path_state"] == "PATH_OBSTRUCTED", "Plain wall directly ahead must be PATH_OBSTRUCTED!"
    wall_cue = detector.guidance_generator.generate_spoken_guidance([], wall_path, language="en")
    assert "surface" in wall_cue.lower() or "wall" in wall_cue.lower(), f"Wall cue must warn of surface. Got: '{wall_cue}'"
    print("[PASS] Flat wall directly ahead correctly detected and path marked obstructed.")

    # 6. Test Peripheral Obstacle (Wall / Object beside user)
    print("\n--- Testing Lateral Peripheral Obstacle (Object beside user) ---")
    side_dets = [{
        "class": "chair",
        "class_id": 56,
        "confidence": 0.82,
        "bbox": [20, 100, 150, 400],
        "normalized_bbox": [0.03, 0.20, 0.23, 0.83],
        "distance_meters": 2.0,
        "risk_level": "WARNING",
        "zone": "LEFT"
    }]
    side_path = detector.scene_analyzer.analyze_clearance(side_dets, 640, 480)
    print(f"Peripheral Object State: {side_path['path_state']} | Corridors: {side_path['corridors']}")
    assert side_path["path_state"] == "OBSTACLE_DETECTED", "Lateral obstacle should yield OBSTACLE_DETECTED!"
    assert side_path["corridors"]["center"]["clear"] == True, "Center corridor should remain unblocked when obstacle is purely on the left."
    print("[PASS] Peripheral obstacle correctly categorized without blocking center corridor.")

    # 7. Test Class Integrity: Book vs Laptop, Cup vs Container, Person vs Teddy Bear
    print("\n--- Testing Class Integrity & Mapping ---")
    names = detector.model.names if detector.model else {}
    assert names.get(63) == "laptop", "COCO class 63 must be laptop"
    assert names.get(73) == "book", "COCO class 73 must be book"
    assert names.get(41) == "cup", "COCO class 41 must be cup"
    assert names.get(56) == "chair", "COCO class 56 must be chair"
    assert names.get(0) == "person", "COCO class 0 must be person"
    assert names.get(77) == "teddy bear", "COCO class 77 must be teddy bear"
    print(f"[PASS] YOLO model class names confirmed strictly distinct: 0={names.get(0)}, 41={names.get(41)}, 56={names.get(56)}, 63={names.get(63)}, 73={names.get(73)}, 77={names.get(77)}")

    # 8. Test Ground Hazard & Pothole Distance & Alert Integration
    print("\n--- Testing Pothole Ground Hazard Distance & Guidance ---")
    pothole_dets = [{
        "class": "pothole",
        "class_id": 0,
        "confidence": 0.88,
        "bbox": [200, 320, 440, 460],
        "normalized_bbox": [0.31, 0.67, 0.69, 0.96],
        "distance_meters": 1.2,
        "risk_level": "CRITICAL",
        "zone": "CENTER",
        "source": "pothole"
    }]
    pothole_path = detector.scene_analyzer.analyze_clearance(pothole_dets, 640, 480)
    assert pothole_path["path_state"] == "PATH_OBSTRUCTED", "Pothole ahead should yield OBSTACLE_DETECTED!"
    for lang in ['en', 'hi', 'ta', 'mr', 'kn']:
        cue = detector.guidance_generator.generate_spoken_guidance(pothole_dets, pothole_path, language=lang)
        print(f"Pothole Alert ({lang.upper()}): {cue}")
        assert len(cue) > 0, f"Pothole alert should generate guidance for {lang}"
    print("[PASS] Pothole ground hazard correctly triggers urgent accessibility alert.")

    print("\n" + "=" * 60)

    print("  ALL NAVIDOOR PIPELINE & SCENARIO TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()



