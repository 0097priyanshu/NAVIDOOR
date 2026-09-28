"""
NAVIDOOR Distance Estimator & Collision Risk Classifier
Calculates real-time distance in meters from bounding boxes using calibrated focal length ratio.
"""

from typing import Dict, Any, Tuple
from .indian_labels import OBJECT_REAL_HEIGHTS_METERS

class DistanceEstimator:
    def __init__(self, focal_length_px: float = 650.0):
        """
        :param focal_length_px: Estimated focal length in pixels for standard smartphone camera
                               at 640x480 resolution (approx. 500-750px).
        """
        self.focal_length_px = focal_length_px

    def estimate_distance(
        self,
        class_name: str,
        bbox: Tuple[float, float, float, float],
        frame_width: int,
        frame_height: int
    ) -> Dict[str, Any]:
        """
        Estimate distance to the detected object.
        bbox: (x1, y1, x2, y2) in pixels
        """
        x1, y1, x2, y2 = bbox
        box_width = max(1.0, x2 - x1)
        box_height = max(1.0, y2 - y1)

        real_height = OBJECT_REAL_HEIGHTS_METERS.get(class_name, 1.0)

        # Scale focal length dynamically if frame size differs from 640 standard
        effective_focal = self.focal_length_px * (frame_height / 480.0)

        # Pinhole distance formula: D = (real_height * focal_length) / box_height
        raw_distance = (real_height * effective_focal) / box_height

        # Ground plane perspective adjustment (objects near bottom of frame are physically closer)
        bottom_ratio = y2 / float(frame_height)
        if bottom_ratio > 0.85:
            # Near feet of the user
            raw_distance = min(raw_distance, (1.0 - bottom_ratio) * 6.0 + 0.6)

        # Clamp distance between 0.3m and 50.0m
        distance_meters = round(max(0.3, min(50.0, raw_distance)), 1)

        # Determine Risk Level for blind / visually impaired user
        if distance_meters <= 1.2:
            risk_level = "CRITICAL"
        elif distance_meters <= 2.5:
            risk_level = "WARNING"
        elif distance_meters <= 5.0:
            risk_level = "INFO"
        else:
            risk_level = "FAR"

        return {
            "distance_meters": distance_meters,
            "risk_level": risk_level,
            "real_height_used": real_height,
        }
