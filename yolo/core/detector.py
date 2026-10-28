"""
NAVIDOOR YOLOv11 / YOLOv8 AI Vision Detection Engine
Loads pre-trained YOLO weights, fine-tuned staircase models, fine-tuned pothole models,
and fine-tuned crosswalk models, processes camera frames, estimates distances,
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
        staircase_model_name: str = "yolo11n_staircase.pt",
        pothole_model_name: str = "yolo11n_pothole.pt",
        crosswalk_model_name: str = "yolo11n_crosswalk.pt",
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
        self.staircase_model_path = os.path.join(self.models_dir, staircase_model_name)
        self.pothole_model_path = os.path.join(self.models_dir, pothole_model_name)
        self.crosswalk_model_path = os.path.join(self.models_dir, crosswalk_model_name)
        
        self.model = None
        self.staircase_model = None
        self.pothole_model = None
        self.crosswalk_model = None
        self.is_ultralytics_loaded = False
        self._initialize_models(model_name, staircase_model_name, pothole_model_name, crosswalk_model_name)

    def _initialize_models(self, model_name: str, staircase_model_name: str, pothole_model_name: str, crosswalk_model_name: str):
        """Loads primary general model, fine-tuned staircase model, fine-tuned pothole model, and fine-tuned crosswalk model."""
        try:
            from ultralytics import YOLO
            target = self.model_path if os.path.exists(self.model_path) else model_name
            self.model = YOLO(target)
            self.is_ultralytics_loaded = True
            print(f"[YOLO DIAG] Primary model loaded successfully: {model_name}")
            print(f"[YOLO DIAG] Total primary classes: {len(self.model.names)}")

            # Load specialized fine-tuned staircase model
            if os.path.exists(self.staircase_model_path):
                self.staircase_model = YOLO(self.staircase_model_path)
                print(f"[YOLO DIAG] Fine-tuned Staircase model loaded: {staircase_model_name} (classes: {self.staircase_model.names})")
            else:
                self.staircase_model = None
                print(f"[YOLO DIAG] Notice: Staircase model not found at {self.staircase_model_path}")

            # Load specialized fine-tuned pothole model
            if os.path.exists(self.pothole_model_path):
                self.pothole_model = YOLO(self.pothole_model_path)
                print(f"[YOLO DIAG] Fine-tuned Pothole model loaded: {pothole_model_name} (classes: {self.pothole_model.names})")
            else:
                self.pothole_model = None
                print(f"[YOLO DIAG] Notice: Pothole model not found at {self.pothole_model_path}")

            # Load specialized fine-tuned crosswalk model
            if os.path.exists(self.crosswalk_model_path):
                self.crosswalk_model = YOLO(self.crosswalk_model_path)
                print(f"[YOLO DIAG] Fine-tuned Crosswalk model loaded: {crosswalk_model_name} (classes: {self.crosswalk_model.names})")
            else:
                self.crosswalk_model = None
                print(f"[YOLO DIAG] Notice: Crosswalk model not found at {self.crosswalk_model_path}")

        except Exception as e:
            print(f"[YOLO DIAG] Note: Ultralytics runtime error ({e}).")
            self.is_ultralytics_loaded = False

    def _extract_boxes(self, results, detections: List[Dict[str, Any]], width: int, height: int, source_tag: str = "primary"):
        for r in results:
            boxes = r.boxes
            if boxes is None or len(boxes) == 0:
                continue

            for box in boxes:
                cls_id = int(box.cls[0].item())
                cls_name = r.names.get(cls_id, f"obj_{cls_id}").lower()
                conf = float(box.conf[0].item())
                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = [int(v) for v in coords]

                norm_bbox = [
                    round(x1 / width, 3),
                    round(y1 / height, 3),
                    round(x2 / width, 3),
                    round(y2 / height, 3)
                ]

                dist_info = self.distance_estimator.estimate_distance(
                    cls_name, (x1, y1, x2, y2), width, height
                )
                zone = self.scene_analyzer.get_zone((x1, y1, x2, y2), width)

                detections.append({
                    "class": cls_name,
                    "class_id": cls_id,
                    "confidence": round(conf, 2),
                    "bbox": [x1, y1, x2, y2],
                    "normalized_bbox": norm_bbox,
                    "distance_meters": dist_info["distance_meters"],
                    "risk_level": dist_info["risk_level"],
                    "zone": zone,
                    "source": source_tag
                })

    def detect_frame(
        self,
        image_input: Union[np.ndarray, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        start_time = time.time()
        if hasattr(image_input, "size"):
            width, height = image_input.size
        else:
            height, width = image_input.shape[:2]

        detections: List[Dict[str, Any]] = []

        if self.is_ultralytics_loaded and self.model is not None:
            try:
                # 1. Primary COCO detector (persons, vehicles, furniture, etc.)
                primary_results = self.model(
                    image_input,
                    imgsz=640,
                    conf=self.confidence_threshold,
                    iou=0.45,
                    verbose=False
                )
                self._extract_boxes(primary_results, detections, width, height, source_tag="primary")

                # 2. Fine-tuned Staircase detector (upstair / downstair)
                if self.staircase_model is not None:
                    stair_results = self.staircase_model(
                        image_input,
                        imgsz=320,
                        conf=0.25,
                        iou=0.45,
                        verbose=False
                    )
                    stair_dets = []
                    self._extract_boxes(stair_results, stair_dets, width, height, source_tag="staircase")
                    
                    if stair_dets:
                        # If directional stairs detected, suppress any generic lower-confidence stairs
                        detections = [d for d in detections if d["class"] != "stairs"]
                        detections.extend(stair_dets)

                # 3. Fine-tuned Pothole detector
                if self.pothole_model is not None:
                    pothole_results = self.pothole_model(
                        image_input,
                        imgsz=320,
                        conf=0.25,
                        iou=0.45,
                        verbose=False
                    )
                    pothole_dets = []
                    self._extract_boxes(pothole_results, pothole_dets, width, height, source_tag="pothole")
                    if pothole_dets:
                        detections.extend(pothole_dets)

                # 4. Fine-tuned Crosswalk detector
                if self.crosswalk_model is not None:
                    crosswalk_results = self.crosswalk_model(
                        image_input,
                        imgsz=320,
                        conf=0.25,
                        iou=0.45,
                        verbose=False
                    )
                    crosswalk_dets = []
                    self._extract_boxes(crosswalk_results, crosswalk_dets, width, height, source_tag="crosswalk")
                    if crosswalk_dets:
                        detections.extend(crosswalk_dets)

            except Exception as e:
                print(f"[YOLO Inference Error]: {e}")

        # Analyze scene corridors
        safe_path = self.scene_analyzer.analyze_clearance(
            detections, width, height, image_input=image_input
        )

        # Generate spoken guidance
        voice_guidance = self.guidance_generator.generate_spoken_guidance(
            detections, safe_path, language=language
        )

        latency_ms = round((time.time() - start_time) * 1000, 1)

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
