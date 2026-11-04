"""
NAVIDOOR OCR Preprocessor
Handles image quality checks, blur detection, CLAHE contrast enhancement,
glare suppression, and perspective deskewing for mobile camera frames.
"""

import cv2
import numpy as np
from PIL import Image
import io
import base64

def decode_image_payload(image_payload):
    """
    Decodes base64 string or numpy array into BGR OpenCV image.
    """
    if isinstance(image_payload, np.ndarray):
        return image_payload
    
    if isinstance(image_payload, str):
        raw_b64 = image_payload
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
        image_bytes = base64.b64decode(raw_b64)
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # PIL RGB -> OpenCV BGR
        return np.array(pil_img)[:, :, ::-1]
        
    raise ValueError("Unsupported image payload format. Expected base64 string or numpy ndarray.")

def check_blur(image_bgr, threshold=50.0):
    """
    Calculates Laplacian variance to detect motion or focus blur.
    Returns:
        dict: { is_blurry: bool, score: float, user_guidance: str }
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    is_blurry = variance < threshold
    guidance = ""
    if is_blurry:
        guidance = "Image is blurry. Please hold your phone steady and try again."
    else:
        guidance = "Image sharpness is clear."
        
    return {
        "is_blurry": is_blurry,
        "score": round(variance, 2),
        "user_guidance": guidance
    }

def resize_for_inference(image_bgr, max_dim=1280):
    """
    Resizes image maintaining aspect ratio so mobile CPU inference remains under budget.
    """
    h, w = image_bgr.shape[:2]
    if max(h, w) <= max_dim:
        return image_bgr, 1.0
        
    scale = max_dim / float(max(h, w))
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized, scale

def enhance_contrast(image_bgr):
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) on L channel in LAB color space.
    Helps read text in dim hospital corridors, shadowed door signs, and underexposed medicine bottles.
    """
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    
    lab_merged = cv2.merge((l_enhanced, a, b))
    return cv2.cvtColor(lab_merged, cv2.COLOR_LAB2BGR)

def suppress_glare(image_bgr):
    """
    Detects specular reflections (common on metallic foil medicine blister packs and glossy posters).
    Softens harsh glare spots to avoid character clipping.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    # Mask extremely bright pixels
    _, glare_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    
    # Only inpaint if glare is a small percentage (< 15% of frame)
    glare_pct = (cv2.countNonZero(glare_mask) / float(gray.size)) * 100.0
    if 0.1 < glare_pct < 15.0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dilated_mask = cv2.dilate(glare_mask, kernel, iterations=1)
        inpainted = cv2.inpaint(image_bgr, dilated_mask, 3, cv2.INPAINT_TELEA)
        return inpainted
        
    return image_bgr

def preprocess_frame(image_payload, mode="glance"):
    """
    Full preprocessing pipeline.
    mode: 'glance' (fast for live scan) or 'deep' (full enhancement for documents/medicine)
    """
    img_bgr = decode_image_payload(image_payload)
    
    # 1. Quality & blur check
    quality = check_blur(img_bgr, threshold=40.0 if mode == "glance" else 55.0)
    
    # 2. Resize to mobile-friendly dimensions
    max_dim = 960 if mode == "glance" else 1440
    processed, scale = resize_for_inference(img_bgr, max_dim=max_dim)
    
    # 3. Deep enhancements if required
    if mode == "deep":
        processed = suppress_glare(processed)
        processed = enhance_contrast(processed)
        
    return processed, quality, scale

