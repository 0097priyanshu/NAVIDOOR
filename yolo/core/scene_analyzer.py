"""
NAVIDOOR Scene Analyzer & Safe Walking Path Planner
Analyzes spatial distribution of obstacles and finds clear walking corridors.
"""

from typing import List, Dict, Any, Tuple

class SceneAnalyzer:
    def __init__(self, left_boundary: float = 0.35, right_boundary: float = 0.65):
        self.left_boundary = left_boundary
        self.right_boundary = right_boundary

    def get_zone(self, bbox: Tuple[float, float, float, float], frame_width: int) -> str:
        """
        Determines whether the object center is in LEFT, CENTER, or RIGHT zone.
        """
        x1, _, x2, _ = bbox
        center_x = (x1 + x2) / 2.0
        normalized_x = center_x / float(frame_width)

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
        frame_height: int
    ) -> Dict[str, Any]:
        """
        Evaluates obstacle density in Left, Center, and Right corridors.
        Determines recommended walking direction.
        """
        left_blocked = False
        center_blocked = False
        right_blocked = False

        left_hazards = []
        center_hazards = []
        right_hazards = []

        for det in detections:
            distance = det.get("distance_meters", 10.0)
            risk = det.get("risk_level", "INFO")
            zone = det.get("zone", "CENTER")

            # Hazards under 3 meters block the walking corridor
            is_hazard = distance <= 3.0 and risk in ["CRITICAL", "WARNING"]

            if zone == "LEFT":
                left_hazards.append(det)
                if is_hazard:
                    left_blocked = True
            elif zone == "RIGHT":
                right_hazards.append(det)
                if is_hazard:
                    right_blocked = True
            else: # CENTER
                center_hazards.append(det)
                if is_hazard:
                    center_blocked = True

        # Safe Path Recommendation
        if not center_blocked:
            safe_direction = "FORWARD"
            guidance_hint = "Clear path directly ahead."
        elif not right_blocked and not left_blocked:
            # Both open, choose side with fewer total obstacles
            if len(right_hazards) <= len(left_hazards):
                safe_direction = "RIGHT"
                guidance_hint = "Obstacle ahead. Step right."
            else:
                safe_direction = "LEFT"
                guidance_hint = "Obstacle ahead. Step left."
        elif not right_blocked:
            safe_direction = "RIGHT"
            guidance_hint = "Obstacle ahead. Step right."
        elif not left_blocked:
            safe_direction = "LEFT"
            guidance_hint = "Obstacle ahead. Step left."
        else:
            safe_direction = "STOP"
            guidance_hint = "Warning: Path blocked. Please stop and reorient."

        return {
            "recommended_direction": safe_direction,
            "guidance_hint": guidance_hint,
            "corridors": {
                "left": {"clear": not left_blocked, "count": len(left_hazards)},
                "center": {"clear": not center_blocked, "count": len(center_hazards)},
                "right": {"clear": not right_blocked, "count": len(right_hazards)},
            }
        }
