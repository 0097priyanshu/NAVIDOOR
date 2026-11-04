"""
NAVIDOOR OCR Engine
Coordinates image preprocessing, multilingual text recognition,
spatial sorting, and semantic category classification.
"""

import os
import sys
import time
from pathlib import Path
import easyocr
import numpy as np

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from .preprocessor import preprocess_frame, decode_image_payload
from .spatial_sorter import sort_reading_order
from .category_classifier import classify_text_category

# Base directory for models
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

class OCREngine:
    def __init__(self, languages=None, gpu=False):
        """
        Initializes EasyOCR Reader with local model storage.
        Default languages: English ('en') and Hindi/Marathi ('hi')
        """
        self.languages = languages or ['en', 'hi']
        self.gpu = gpu
        self.models_dir = str(MODELS_DIR)
        self.reader = None
        self._init_reader()
        
    def _init_reader(self):
        try:
            print(f"[*] Initializing EasyOCR Engine with languages: {self.languages}")
            print(f"[*] Model storage directory: {self.models_dir}")
            self.reader = easyocr.Reader(
                self.languages,
                gpu=self.gpu,
                model_storage_directory=self.models_dir,
                user_network_directory=self.models_dir,
                download_enabled=False,
                verbose=False
            )
            print("[✓] OCREngine initialized successfully.")
        except Exception as e:
            print(f"[!] Warning: Error initializing EasyOCR Reader with local models: {e}")
            print("[!] Fallback to download-enabled reader...")
            self.reader = easyocr.Reader(
                self.languages,
                gpu=self.gpu,
                model_storage_directory=self.models_dir,
                user_network_directory=self.models_dir,
                download_enabled=True,
                verbose=False
            )
            
    def process_image(self, image_payload, mode="glance", category_hint=None):
        """
        Main OCR processing pipeline.
        Args:
            image_payload: Base64 string or numpy BGR array
            mode: 'glance' (fast mobile viewfinder) or 'deep' (full document/medicine)
            category_hint: Optional domain hint e.g. 'medicine', 'bus', 'hospital'
        Returns:
            dict containing text, lines, normalized bboxes, category, entities, spoken summary
        """
        start_time = time.time()
        
        # 1. Preprocess frame
        processed_bgr, quality, scale = preprocess_frame(image_payload, mode=mode)
        
        # If image is critically blurry in deep mode, return warning early to save CPU
        if quality["is_blurry"] and mode == "deep":
            return {
                "success": False,
                "error": "image_blurry",
                "quality": quality,
                "spoken_summary": quality["user_guidance"],
                "text": "",
                "lines": [],
                "inference_time_ms": round((time.time() - start_time) * 1000, 1)
            }
            
        h, w = processed_bgr.shape[:2]
        
        # 2. Run text detection and recognition
        # Convert BGR -> RGB for EasyOCR
        rgb_img = processed_bgr[:, :, ::-1]
        
        raw_results = self.reader.readtext(
            rgb_img,
            paragraph=False,
            detail=1,
            batch_size=4
        )
        
        # 3. Spatial Sorting into reading order
        sorted_lines, full_text = sort_reading_order(raw_results, img_width=w, img_height=h)
        
        inference_time_ms = round((time.time() - start_time) * 1000, 1)
        
        if not full_text:
            return {
                "success": True,
                "text": "",
                "lines": [],
                "category": category_hint or "none",
                "quality": quality,
                "spoken_summary": "No text detected in front of camera.",
                "inference_time_ms": inference_time_ms
            }
            
        # 4. Semantic Category Classification & Entity Extraction
        cat_info = classify_text_category(full_text, sorted_lines)
        if category_hint and category_hint != "auto":
            # If user explicitly selected medicine/bus mode, respect the hint
            cat_info["category"] = category_hint
            
        return {
            "success": True,
            "text": full_text,
            "lines": sorted_lines,
            "line_count": len(sorted_lines),
            "category": cat_info["category"],
            "category_confidence": cat_info["category_confidence"],
            "entities": cat_info["entities"],
            "spoken_summary": cat_info["spoken_summary"],
            "quality": quality,
            "inference_time_ms": inference_time_ms
        }

