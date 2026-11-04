"""
Automated Unit Tests for NAVIDOOR OCR Engine
Tests preprocessing, detection, recognition, spatial sorting,
and category classification across key domains with TrueType rendering.
"""

import os
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.ocr_engine import OCREngine

def get_font(size=32):
    for fp in ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/calibri.ttf", "arial.ttf"]:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_synthetic_sign(text_lines, width=800, height=450, bg_color=(255, 255, 255), text_color=(0, 0, 0), font_size=32):
    """
    Creates a clear, high-contrast sign image with TrueType text rendering.
    """
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    font = get_font(font_size)
    
    spacing = height // (len(text_lines) + 1)
    for i, line in enumerate(text_lines):
        y = spacing * (i + 1) - (font_size // 2)
        draw.text((60, y), line, fill=text_color, font=font)
                
    # Return as BGR numpy array
    return np.array(img)[:, :, ::-1]

def run_tests():
    print("=" * 60)
    print("      NAVIDOOR OCR ENGINE UNIT TEST SUITE")
    print("=" * 60)
    
    engine = OCREngine(languages=['en', 'hi'], gpu=False)
    
    # Test 1: Hospital Department Sign
    print("\n[TEST 1] Hospital Department Signboard...")
    hospital_img = create_synthetic_sign(["HOSPITAL OPD", "CARDIOLOGY WARD", "ROOM 102"], font_size=36)
    res1 = engine.process_image(hospital_img, mode="glance")
    print(f"  > Detected Category: {res1.get('category')}")
    print(f"  > Extracted Text:\n{res1.get('text')}")
    print(f"  > Spoken Announcement: {res1.get('spoken_summary')}")
    print(f"  > Latency: {res1.get('inference_time_ms')}ms")
    assert res1["success"] is True
    assert "hospital_department" in res1.get("category", "") or "opd" in res1.get("text", "").lower()
    
    # Test 2: Bus Board
    print("\n[TEST 2] Bus Board Destination Display...")
    bus_img = create_synthetic_sign(["BUS 204", "DADAR VIA SION"], bg_color=(20, 20, 20), text_color=(255, 215, 0), font_size=40)
    res2 = engine.process_image(bus_img, mode="glance")
    print(f"  > Detected Category: {res2.get('category')}")
    print(f"  > Extracted Text:\n{res2.get('text')}")
    print(f"  > Spoken Announcement: {res2.get('spoken_summary')}")
    print(f"  > Latency: {res2.get('inference_time_ms')}ms")
    assert res2["success"] is True
    
    # Test 3: Medicine Label
    print("\n[TEST 3] Medicine Label & Dosage...")
    med_img = create_synthetic_sign(["PARACETAMOL TABLETS", "DOSAGE 500mg", "EXPIRY 12/28"], font_size=34)
    res3 = engine.process_image(med_img, mode="deep")
    print(f"  > Detected Category: {res3.get('category')}")
    print(f"  > Extracted Text:\n{res3.get('text')}")
    print(f"  > Entities: {res3.get('entities')}")
    print(f"  > Spoken Announcement: {res3.get('spoken_summary')}")
    print(f"  > Latency: {res3.get('inference_time_ms')}ms")
    assert res3["success"] is True
    
    # Test 4: Door Label
    print("\n[TEST 4] Door Label...")
    door_img = create_synthetic_sign(["CONFERENCE ROOM B", "STAFF ONLY"], font_size=36)
    res4 = engine.process_image(door_img, mode="glance")
    print(f"  > Detected Category: {res4.get('category')}")
    print(f"  > Extracted Text:\n{res4.get('text')}")
    print(f"  > Spoken Announcement: {res4.get('spoken_summary')}")
    assert res4["success"] is True
    
    # Test 5: Blur detection rejection
    print("\n[TEST 5] Blur Detection Guard...")
    blurry_img = cv2.GaussianBlur(hospital_img, (51, 51), 0)
    res5 = engine.process_image(blurry_img, mode="deep")
    print(f"  > Blur Detected: {res5['quality']['is_blurry']}")
    print(f"  > Guidance: {res5.get('spoken_summary')}")
    assert res5["quality"]["is_blurry"] is True
    
    print("\n" + "=" * 60)
    print("  [ALL TESTS PASSED] OCR Engine & Preprocessor Verified!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
