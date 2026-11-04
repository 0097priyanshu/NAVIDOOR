"""
NAVIDOOR Scene Analyzer & Navigation Corridor Planner
Implements an explicit 5-state navigation-state model:
- UNKNOWN: Insufficient perception data, empty detections, or unverified surface.
- VISIBILITY_REDUCED: Scene is too dark, overexposed, or obscured.
- OBSTACLE_DETECTED: Peripheral obstacle present; walking corridor is unblocked.
- PATH_OBSTRUCTED: Obstacle reliably detected in the central walking corridor.
- PATH_CLEAR: Only when valid perceptual evidence confirms clear corridor.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np

# Navigation Perception States
STATE_UNKNOWN = "UNKNOWN"
STATE_VISIBILITY_REDUCED = "VISIBILITY_REDUCED"
STATE_OBSTACLE_DETECTED = "OBSTACLE_DETECTED"
STATE_PATH_OBSTRUCTED = "PATH_OBSTRUCTED"
STATE_PATH_CLEAR = "PATH_CLEAR"

class SceneAnalyzer:
    def __init__(
        self,
        left_boundary: float = 0.32,
        right_boundary: float = 0.68,
        min_brightness: float = 28.0,
        max_brightness: float = 238.0,
        min_contrast_std: float = 12.0
    ):
        self.left_boundary = left_boundary
        self.right_boundary = right_boundary
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.min_contrast_std = min_contrast_std

    def get_zone(self, bbox: Tuple[float, float, float, float], frame_width: int) -> str:
        """
        Determines whether the object center is in LEFT, CENTER, or RIGHT zone.
        """
        x1, _, x2, _ = bbox
        center_x = (x1 + x2) / 2.0
        normalized_x = center_x / float(frame_width) if frame_width > 0 else 0.5

        if normalized_x < self.left_boundary:
            return "LEFT"
        elif normalized_x > self.right_boundary:
            return "RIGHT"
        else:
            return "CENTER"

    def analyze_clearance(
        self,
        detections: List[Dict[str, Any]],
        frame_width: int,
        frame_height: int,
        image_input: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Evaluates obstacle distribution, surface characteristics, and lighting.
        Returns explicit navigation state and cautious guidance.
        """
        # 1. Perceptual Quality & Surface Texture Analysis
        mean_brightness = 128.0
        contrast_std = 40.0
        central_contrast_std = 35.0
        is_flat_surface = False
        visibility_issue: Optional[str] = None

        if image_input is not None:
            try:
                # Handle PIL Image or numpy array
                if hasattr(image_input, "convert"):
                    gray = np.array(image_input.convert("L"))
                elif isinstance(image_input, np.ndarray):
                    if len(image_input.shape) == 3:
                        gray = np.mean(image_input[:, :, :3], axis=2).astype(np.uint8)
                    else:
                        gray = image_input
                else:
                    gray = None

                if gray is not None and gray.size > 0:
                    mean_brightness = float(np.mean(gray))
                    contrast_std = float(np.std(gray))

                    # Analyze central walking corridor texture (middle 50% vertical, middle 40% horizontal)
                    h, w = gray.shape[:2]
                    h1, h2 = int(h * 0.25), int(h * 0.75)
                    w1, w2 = int(w * self.left_boundary), int(w * self.right_boundary)
                    if h2 > h1 and w2 > w1:
                        central_slice = gray[h1:h2, w1:w2]
                        central_contrast_std = float(np.std(central_slice))

                    # Check for darkness or extreme glare
                    if mean_brightness < self.min_brightness:
                        visibility_issue = "DARK"
                    elif mean_brightness > self.max_brightness:
                        visibility_issue = "OVEREXPOSED"
                    elif central_contrast_std < self.min_contrast_std:
                        # A close-up wall, door, or large flat surface in normal lighting
                        is_flat_surface = True
                    elif contrast_std < 5.0:
                        visibility_issue = "FOG_BLUR"
            except Exception as e:
                print(f"[SceneAnalyzer DIAG] Image quality check warning: {e}")

        # 2. Evaluate obstacle presence across walking corridors
        left_blocked = False
        center_blocked = False
        right_blocked = False

        left_hazards: List[Dict[str, Any]] = []
        center_hazards: List[Dict[str, Any]] = []
        right_hazards: List[Dict[str, Any]] = []

        for det in detections:
            distance = det.get("distance_meters", 10.0)
            risk = det.get("risk_level", "INFO")
            zone = det.get("zone", "CENTER")
            norm_bbox = det.get("normalized_bbox", [0.3, 0.3, 0.7, 0.7])
            nx1, ny1, nx2, ny2 = norm_bbox

            # Center walking corridor span overlap
            overlaps_center = not (nx2 < self.left_boundary or nx1 > self.right_boundary)
            is_hazard = distance <= 2.8 and (risk in ["CRITICAL", "WARNING"] or distance <= 1.5)

            if overlaps_center:
                center_hazards.append(det)
                if is_hazard:
                    center_blocked = True
            elif zone == "LEFT" or nx2 <= self.left_boundary:
                left_hazards.append(det)
                if is_hazard and distance <= 2.2:
                    left_blocked = True
            elif zone == "RIGHT" or nx1 >= self.right_boundary:
                right_hazards.append(det)
                if is_hazard and distance <= 2.2:
                    right_blocked = True

        # 3. Determine Explicit Navigation State
        if visibility_issue is not None:
            path_state = STATE_VISIBILITY_REDUCED
            recommended_direction = "CAUTION"
            if visibility_issue == "DARK":
                guidance_hint = "Low visibility. Camera scene is too dark to verify path."
            elif visibility_issue == "OVEREXPOSED":
                guidance_hint = "Low visibility. Camera scene is overexposed."
            else:
                guidance_hint = "Low visibility. Camera view is blurred or obscured."

        elif is_flat_surface:
            # Wall, door, or large plain obstruction directly in front of camera
            path_state = STATE_PATH_OBSTRUCTED
            recommended_direction = "STOP"
            guidance_hint = "Surface directly ahead. Possible wall or closed door. Please stop."

        elif center_blocked:
            path_state = STATE_PATH_OBSTRUCTED
            recommended_direction = "STOP"
            # Never issue blind "step right" or "step left" without proven side clearance
            guidance_hint = "Obstacle directly ahead in walking path. Please stop."

        elif left_blocked or right_blocked or len(detections) > 0:
            path_state = STATE_OBSTACLE_DETECTED
            recommended_direction = "CAUTION"
            if left_blocked and not right_blocked:
                guidance_hint = "Obstacle on your left. Walking path ahead is narrow."
            elif right_blocked and not left_blocked:
                guidance_hint = "Obstacle on your right. Walking path ahead is narrow."
            else:
                guidance_hint = "Obstacles detected in peripheral view. Proceed with caution."

        else:
            # Empty YOLO detections with normal lighting
            # CRITICAL RULE: A lack of detections must NEVER be treated as proof that path is clear!
            # 80-class COCO cannot detect untextured walls, glass doors, curbs, or drop-offs.
            path_state = STATE_UNKNOWN
            recommended_direction = "CAUTION"
            guidance_hint = "No recognized obstacles in view. Path clearance unverified."

        return {
            "path_state": path_state,
            "recommended_direction": recommended_direction,
            "guidance_hint": guidance_hint,
            "scene_metrics": {
                "mean_brightness": round(mean_brightness, 1),
                "contrast_std": round(contrast_std, 1),
                "central_contrast_std": round(central_contrast_std, 1),
                "is_flat_surface": is_flat_surface,
                "visibility_issue": visibility_issue,
            },
            "corridors": {
                "left": {"clear": not left_blocked, "count": len(left_hazards)},
                "center": {"clear": not center_blocked, "count": len(center_hazards)},
                "right": {"clear": not right_blocked, "count": len(right_hazards)},
            }
        }

