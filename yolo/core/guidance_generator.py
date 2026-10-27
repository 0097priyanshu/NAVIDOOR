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
        Respects the 5-state navigation model and never asserts false clear paths.
        """
        lang = language.split("-")[0].lower() if language else "en"
        if lang not in self.translations:
            lang = "en"
        tr = self.translations[lang]

        path_state = safe_path.get("path_state", "UNKNOWN")
        guidance_hint = safe_path.get("guidance_hint", "")

        # When no recognized obstacles are present:
        if not detections:
            if path_state == "VISIBILITY_REDUCED":
                if lang == "hi":
                    return "कम रोशनी। रास्ता स्पष्ट नहीं दिख रहा है।"
                elif lang == "mr":
                    return "कमी प्रकाश. वाट स्पष्ट दिसत नाही."
                else:
                    return "Visibility reduced. Lighting is too low to verify path."
            elif path_state == "PATH_OBSTRUCTED":
                if lang == "hi":
                    return "सामने दीवार या रुकावट है। कृपया रुकें।"
                elif lang == "mr":
                    return "समोर भिंत किंवा अडथळा आहे. कृपया थांबा."
                else:
                    return "Surface directly ahead. Possible wall or closed door. Please stop."
            else:
                # UNKNOWN state: Never declare the path clear!
                # For continuous background detection, stay silent to avoid repetitive noise.
                return ""

        # Sort detections by:
        # 1. Hazard status in center corridor (distance <= 2.5m)
        # 2. High-priority object class
        # 3. Risk level (CRITICAL > WARNING > INFO)
        # 4. Proximity (closest distance)
        sorted_dets = sorted(
            detections,
            key=lambda d: (
                0 if d.get("zone") == "CENTER" and d.get("distance_meters", 10.0) <= 2.8 else 1,
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

        # Avoidance guidance: only advise stopping if directly obstructed; never issue blind step right/left
        rec_dir = safe_path.get("recommended_direction", "CAUTION")
        unit = tr.get("meters", "m")
        
        action_str = ""
        if rec_dir == "STOP" or path_state == "PATH_OBSTRUCTED":
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

