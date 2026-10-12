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
        lang = language.split("-")[0].lower() if language else "en"
        if lang not in self.translations:
            lang = "en"
        tr = self.translations[lang]

        if not detections:
            return tr.get("safe_path", "Clear walking path directly ahead.")

        # Sort detections by:
        # 1. High-priority object class (laptops, phones, bottles, people > background tables)
        # 2. Risk level (CRITICAL > WARNING > INFO)
        # 3. Proximity (closest distance)
        sorted_dets = sorted(
            detections,
            key=lambda d: (
                -CLASS_PRIORITY.get(d.get("class", ""), 1),
                0 if d.get("risk_level") == "CRITICAL" else (1 if d.get("risk_level") == "WARNING" else 2),
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
        unit = tr.get("meters", "m")
        
        action_str = ""
        if rec_dir == "RIGHT":
            action_str = " " + tr.get("turn_right", "Step right.")
        elif rec_dir == "LEFT":
            action_str = " " + tr.get("turn_left", "Step left.")
        elif rec_dir == "STOP":
            action_str = " " + tr.get("please_stop", "Please stop.")

        if lang == "hi":
            msg = f"{dir_str} {dist} {unit} पर {localized_name} है।{action_str}"
        elif lang == "mr":
            msg = f"{dir_str} {dist} {unit}वर {localized_name} आहे.{action_str}"
        elif lang == "gu":
            msg = f"{dir_str} {dist} {unit} પર {localized_name} છે.{action_str}"
        elif lang == "pa":
            msg = f"{dir_str} {dist} {unit} 'ਤੇ {localized_name} ਹੈ।{action_str}"
        elif lang == "bn":
            msg = f"{dir_str} {dist} {unit}ে {localized_name} আছে।{action_str}"
        elif lang == "ta":
            msg = f"{dir_str} {dist} {unit}ில் {localized_name} உள்ளது.{action_str}"
        elif lang == "te":
            msg = f"{dir_str} {dist} {unit} దూరంలో {localized_name} ఉంది.{action_str}"
        elif lang == "kn":
            msg = f"{dir_str} {dist} {unit} ದೂರದಲ್ಲಿ {localized_name} ಇದೆ.{action_str}"
        elif lang == "ml":
            msg = f"{dir_str} {dist} {unit}ൽ {localized_name} ഉണ്ട്.{action_str}"
        else: # en and fallbacks
            msg = f"{localized_name} {dist}{unit} {dir_str}.{action_str}"

        return msg
