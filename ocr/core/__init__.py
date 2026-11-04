"""
NAVIDOOR OCR Core Package
"""
from .ocr_engine import OCREngine
from .preprocessor import preprocess_frame, check_blur, enhance_contrast, suppress_glare
from .spatial_sorter import sort_reading_order
from .category_classifier import classify_text_category

__all__ = [
    "OCREngine",
    "preprocess_frame",
    "check_blur",
    "enhance_contrast",
    "suppress_glare",
    "sort_reading_order",
    "classify_text_category"
]

