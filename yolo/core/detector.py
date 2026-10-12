"""
NAVIDOOR YOLOv11 / YOLOv8 AI Vision Detection Engine
Loads pre-trained YOLO weights, processes camera frames, estimates distances,
and delivers structured bounding boxes and voice accessibility alerts.
"""

import os
import time
from typing import List, Dict, Any, Union
import numpy as np

from .distance_estimator import DistanceEstimator
from .scene_analyzer import SceneAnalyzer
from .guidance_generator import GuidanceGenerator

class YOLODetector:
    def __init__(
        self,
        model_name: str = "yolo11n.pt",
        confidence_threshold: float = 0.45,
        models_dir: str = None
    ):
        self.confidence_threshold = confidence_threshold
        self.distance_estimator = DistanceEstimator()
        self.scene_analyzer = SceneAnalyzer()
        self.guidance_generator = GuidanceGenerator()

        if models_dir is None:
            models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)

        self.model_path = os.path.join(self.models_dir, model_name)
        self.model = None
        self.is_ultralytics_loaded = False
        self._initialize_model(model_name)

    def _initialize_model(self, model_name: str):
        """Attempts to load model via Ultralytics; enables fallback if missing."""
        try:
            from ultralytics import YOLO
            # Check local models dir or let Ultralytics cache
            target = self.model_path if os.path.exists(self.model_path) else model_name
            self.model = YOLO(target)
            self.is_ultralytics_loaded = True
            print(f"[YOLO DIAG] Model loaded successfully: {model_name}")
            print(f"[YOLO DIAG] Total model classes: {len(self.model.names)} (Sample IDs: 0={self.model.names.get(0)}, 56={self.model.names.get(56, 'N/A')}, 67={self.model.names.get(67, 'N/A')})")
        except Exception as e:
            print(f"[YOLO DIAG] Note: Ultralytics runtime error ({e}).")
            self.is_ultralytics_loaded = False

    def detect_frame(
        self,
        image_np: np.ndarray,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Runs object detection on a BGR or RGB numpy image frame.
        Returns:
            - detections: list of objects with bbox [x1, y1, x2, y2], confidence, distance_meters, risk_level, zone
            - safe_path: recommended walking direction and corridor status
            - voice_guidance: localized spoken guidance string
            - latency_ms: inference time
        """
        start_time = time.time()
        height, width = image_np.shape[:2]
        channels = image_np.shape[2] if image_np.ndim > 2 else 1

        print(f"\n--- [YOLO DIAG] DETECT FRAME INITIATED ---")
        print(f"[YOLO DIAG] Preprocessing input shape: height={height}, width={width}, channels={channels}")

        detections: List[Dict[str, Any]] = []

        if self.is_ultralytics_loaded and self.model is not None:
            try:
                # Run inference with conf=0.10 first to log raw count before NMS thresholding
                raw_results_unfiltered = self.model(image_np, conf=0.10, verbose=False)
                raw_box_count = sum(len(r.boxes) for r in raw_results_unfiltered)
                print(f"[YOLO DIAG] Raw detections before conf thresholding (conf >= 0.10): {raw_box_count}")

                # Run inference with active conf threshold
                results = self.model(image_np, conf=self.confidence_threshold, verbose=False)
                for r in results:
                    boxes = r.boxes
                    print(f"[YOLO DIAG] Raw tensor output shape: {boxes.data.shape if hasattr(boxes, 'data') else 'N/A'}")
                    print(f"[YOLO DIAG] Detections after conf threshold ({self.confidence_threshold}): {len(boxes)}")
                    
                    for i, box in enumerate(boxes):
                        cls_id = int(box.cls[0].item())
                        cls_name = self.model.names.get(cls_id, f"obj_{cls_id}").lower()
                        conf = float(box.conf[0].item())
                        coords = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                        x1, y1, x2, y2 = [int(v) for v in coords]

                        norm_bbox = [
                            round(x1 / width, 3),
                            round(y1 / height, 3),
                            round(x2 / width, 3),
                            round(y2 / height, 3)
                        ]

                        print(f"[YOLO DIAG] Box {i+1}: class_id={cls_id}, name='{cls_name}', conf={conf:.2f}, pixel_bbox=[{x1}, {y1}, {x2}, {y2}], norm_bbox={norm_bbox}")

                        # Calculate distance and risk
                        dist_info = self.distance_estimator.estimate_distance(
                            cls_name, (x1, y1, x2, y2), width, height
                        )

                        # Determine spatial zone
                        zone = self.scene_analyzer.get_zone((x1, y1, x2, y2), width)

                        detections.append({
                            "class": cls_name,
                            "class_id": cls_id,
                            "confidence": round(conf, 2),
                            "bbox": [x1, y1, x2, y2],
                            "normalized_bbox": norm_bbox,
                            "distance_meters": dist_info["distance_meters"],
                            "risk_level": dist_info["risk_level"],
                            "zone": zone
                        })
            except Exception as e:
                print(f"[YOLO DIAG] Inference exception: {e}")

        # Analyze scene corridors
        safe_path = self.scene_analyzer.analyze_clearance(detections, width, height)

        # Generate spoken guidance
        voice_guidance = self.guidance_generator.generate_spoken_guidance(
            detections, safe_path, language=language
        )

        latency_ms = round((time.time() - start_time) * 1000, 1)

        return {
            "success": True,
            "detections": detections,
            "safe_path": safe_path,
            "voice_guidance": voice_guidance,
            "latency_ms": latency_ms,
            "frame_dimensions": {"width": width, "height": height},
            "engine": "ultralytics" if self.is_ultralytics_loaded else "live-yolo"
        }
