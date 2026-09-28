"""
NAVIDOOR Multilingual Voice Guidance Generator
Translates detections and safe corridor analysis into natural, concise spoken cues.
"""

from typing import List, Dict, Any
from .indian_labels import TRANSLATIONS, CLASS_PRIORITY

class GuidanceGenerator:
    def __init__(self):
        self.translations = TRANSLATIONS

    def generate_spoken_guidance(
        self,
        detections: List[Dict[str, Any]],
        safe_path: Dict[str, Any],
        language: str = "en"
    ) -> str:
        """
        Creates a high-priority voice prompt for the blind user.
        Prioritizes the closest, highest-priority hazard.
        """
        lang = language.lower()
        if lang not in self.translations:
            lang = "en"
        tr = self.translations[lang]

        if not detections:
            return tr.get("safe_path", "Clear walking path directly ahead.")

        # Sort detections by:
        # 1. Critical risk level first
        # 2. Priority of object class (pedestrians, cars, stairs > chairs)
        # 3. Proximity (closest distance)
        sorted_dets = sorted(
            detections,
            key=lambda d: (
                0 if d.get("risk_level") == "CRITICAL" else (1 if d.get("risk_level") == "WARNING" else 2),
                -CLASS_PRIORITY.get(d.get("class", ""), 1),
                d.get("distance_meters", 10.0)
            )
        )

        primary = sorted_dets[0]
        obj_name = primary.get("class", "obstacle")
        localized_name = tr.get(obj_name, obj_name.capitalize())
        dist = primary.get("distance_meters", 2.0)
        zone = primary.get("zone", "CENTER")

        # Direction string
        if zone == "LEFT":
            dir_str = tr.get("on_your_left", "on your left")
        elif zone == "RIGHT":
            dir_str = tr.get("on_your_right", "on your right")
        else:
            dir_str = tr.get("directly_ahead", "directly ahead")

        # Actionable avoidance guidance
        rec_dir = safe_path.get("recommended_direction", "FORWARD")

        if lang == "hi":
            msg = f"{dir_str} {dist} मीटर पर {localized_name} है।"
            if rec_dir == "RIGHT":
                msg += " दाईं ओर मुड़ें।"
            elif rec_dir == "LEFT":
                msg += " बाईं ओर मुड़ें।"
            elif rec_dir == "STOP":
                msg += " कृपया रुकें।"
        elif lang == "mr":
            msg = f"{dir_str} {dist} मीटरवर {localized_name} आहे."
            if rec_dir == "RIGHT":
                msg += " उजवीकडे वळा."
            elif rec_dir == "LEFT":
                msg += " डावीकडे वळा."
            elif rec_dir == "STOP":
                msg += " कृपया थांबा."
        else: # en
            msg = f"{localized_name} {dist}m {dir_str}."
            if rec_dir == "RIGHT":
                msg += " Step right."
            elif rec_dir == "LEFT":
                msg += " Step left."
            elif rec_dir == "STOP":
                msg += " Please stop."

        return msg
