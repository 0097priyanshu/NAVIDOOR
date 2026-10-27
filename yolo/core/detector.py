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
        confidence_threshold: float = 0.28,
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
        image_input: Union[np.ndarray, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Runs object detection on a PIL Image or BGR/RGB numpy frame.
        Returns:
            - detections: list of objects with bbox [x1, y1, x2, y2], confidence, distance_meters, risk_level, zone
            - safe_path: recommended walking direction and corridor status
            - voice_guidance: localized spoken guidance string
            - latency_ms: inference time
        """
        start_time = time.time()
        if hasattr(image_input, "size"):
            width, height = image_input.size
        else:
            height, width = image_input.shape[:2]

        detections: List[Dict[str, Any]] = []

        if self.is_ultralytics_loaded and self.model is not None:
            try:
                # Run single inference pass at optimal 640px native resolution for maximum accuracy
                results = self.model(
                    image_input,
                    imgsz=640,
                    conf=self.confidence_threshold,
                    iou=0.45,
                    verbose=False
                )

                for r in results:
                    boxes = r.boxes
                    if boxes is None or len(boxes) == 0:
                        continue

                    for i, box in enumerate(boxes):
                        cls_id = int(box.cls[0].item())
                        cls_name = self.model.names.get(cls_id, f"obj_{cls_id}").lower()
                        conf = float(box.conf[0].item())
                        coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                        x1, y1, x2, y2 = [int(v) for v in coords]

                        norm_bbox = [
                            round(x1 / width, 3),
                            round(y1 / height, 3),
                            round(x2 / width, 3),
                            round(y2 / height, 3)
                        ]

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
                print(f"[YOLO Inference Error]: {e}")

        # Analyze scene corridors with perception quality and flat surface checks
        safe_path = self.scene_analyzer.analyze_clearance(
            detections, width, height, image_input=image_input
        )

        # Generate spoken guidance adhering to 5-state navigation model
        voice_guidance = self.guidance_generator.generate_spoken_guidance(
            detections, safe_path, language=language
        )

        latency_ms = round((time.time() - start_time) * 1000, 1)

        # Diagnostics for development debugging
        if len(detections) > 0 or safe_path.get("path_state") != "UNKNOWN":
            det_summary = [(d["class"], d["confidence"], f"{d['distance_meters']}m") for d in detections]
            print(f"[YOLO DIAG] Dets: {det_summary} | State: {safe_path.get('path_state')} | Guidance: '{voice_guidance}'")


        return {
            "success": True,
            "detections": detections,
            "safe_path": safe_path,
            "voice_guidance": voice_guidance,
            "latency_ms": latency_ms,
            "frame_dimensions": {"width": width, "height": height},
            "engine": "ultralytics" if self.is_ultralytics_loaded else "live-yolo"
        }
