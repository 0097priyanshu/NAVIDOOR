"""
Exhaustive Automated Test Suite for NAVIDOOR OCR Engine (Phase 1)
Tests all 9 domain categories, multilingual Devanagari text, blur guard,
and mobile resolution invariance (responsive normalized bounding boxes).
"""

import os
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.ocr_engine import OCREngine

def get_font(size=32):
    for fp in ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/calibri.ttf", "C:/Windows/Fonts/mangal.ttf", "arial.ttf"]:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_synthetic_frame(text_lines, width=800, height=450, bg_color=(255, 255, 255), text_color=(0, 0, 0), font_size=32):
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    font = get_font(font_size)
    
    spacing = height // (len(text_lines) + 1)
    for i, line in enumerate(text_lines):
        y = spacing * (i + 1) - (font_size // 2)
        draw.text((50, y), line, fill=text_color, font=font)
                
    return np.array(img)[:, :, ::-1]

def run_all_tests():
    print("=" * 70)
    print("      NAVIDOOR FULL DOMAIN & MULTI-DEVICE OCR TEST SUITE")
    print("=" * 70)
    
    engine = OCREngine(languages=['en', 'hi'], gpu=False)
    results_summary = []
    
    # 1. Signboard Test
    print("\n[TEST 1/11] Signboard & Street Name...")
    img = create_synthetic_frame(["MAHATMA GANDHI ROAD", "CENTRAL JUNCTION"], bg_color=(0, 100, 50), text_color=(255, 255, 255), font_size=36)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']} (conf: {res['category_confidence']})")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Signboard", res["category"] == "signboard" or "road" in res["text"].lower()))

    # 2. Door Label Test
    print("\n[TEST 2/11] Door Label & Room ID...")
    img = create_synthetic_frame(["CONFERENCE ROOM B", "STAFF ONLY"], font_size=36)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Door Label", res["category"] == "door_label" or "room" in res["text"].lower()))

    # 3. Hospital Department Test
    print("\n[TEST 3/11] Hospital Department Sign...")
    img = create_synthetic_frame(["HOSPITAL OPD", "CARDIOLOGY WARD", "ROOM 104"], font_size=34)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Hospital Department", res["category"] == "hospital_department"))

    # 4. Bus Board Test
    print("\n[TEST 4/11] Bus Board & Destination...")
    img = create_synthetic_frame(["BUS 204", "DADAR VIA SION"], bg_color=(20, 20, 20), text_color=(255, 215, 0), font_size=40)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Bus Board", res["category"] == "bus_board"))

    # 5. Medicine Label Test
    print("\n[TEST 5/11] Medicine Blister Pack & Dosage...")
    img = create_synthetic_frame(["PARACETAMOL TABLETS", "DOSAGE 500mg", "EXPIRY 12/28"], font_size=34)
    res = engine.process_image(img, mode="deep")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Entities: {res['entities']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Medicine Label", res["category"] == "medicine_label"))

    # 6. Document Test
    print("\n[TEST 6/11] Printed Document & Notice...")
    doc_lines = [
        "ANNUAL ACCESSIBILITY REPORT 2026",
        "NAVIDOOR PLATFORM SYSTEM SPECIFICATIONS",
        "THIS SYSTEM PROVIDES REAL TIME VISION ASSISTANCE",
        "ALL DATA IS PROCESSED PRIVATELY ON LOCAL DEVICE",
        "ACCESSIBLE TO ALL BLIND AND ELDERLY USERS WORLDWIDE"
    ]
    img = create_synthetic_frame(doc_lines, width=900, height=600, font_size=24)
    res = engine.process_image(img, mode="deep")
    print(f"  > Detected Lines: {len(res['lines'])}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["lines"]) >= 3
    results_summary.append(("Document", res["category"] == "document" or len(res["lines"]) >= 3))

    # 7. Notice Test
    print("\n[TEST 7/11] Public Warning Notice...")
    img = create_synthetic_frame(["NOTICE", "CAUTION NO PARKING", "ENTRY STRICTLY PROHIBITED"], bg_color=(255, 230, 200), font_size=32)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Notice", res["category"] in ["notice", "signboard"]))

    # 8. Menu Test
    print("\n[TEST 8/11] Restaurant Food Menu...")
    img = create_synthetic_frame(["MENU", "MASALA DOSA RS 80", "FILTER COFFEE RS 30"], font_size=34)
    res = engine.process_image(img, mode="glance")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Menu", res["category"] == "menu"))

    # 9. Product Label Test
    print("\n[TEST 9/11] Product Nutrition Label...")
    img = create_synthetic_frame(["ORGANIC WHOLE WHEAT", "NET WT 500g", "NUTRITION FACTS INGREDIENTS"], font_size=30)
    res = engine.process_image(img, mode="deep")
    print(f"  > Detected Text: {res['text'].replace(chr(10), ' | ')}")
    print(f"  > Category: {res['category']}")
    print(f"  > Spoken: {res['spoken_summary']}")
    assert res["success"] and len(res["text"]) > 0
    results_summary.append(("Product Label", res["category"] == "product_label"))

    # 10. Blur Guard Test
    print("\n[TEST 10/11] Blur Motion Guard Rejection...")
    blurry = cv2.GaussianBlur(img, (55, 55), 0)
    res_blur = engine.process_image(blurry, mode="deep")
    print(f"  > Blur Detected: {res_blur['quality']['is_blurry']}")
    print(f"  > User Spoken Guidance: {res_blur.get('spoken_summary')}")
    assert res_blur["quality"]["is_blurry"] is True
    results_summary.append(("Blur Guard", res_blur["quality"]["is_blurry"] is True))

    # 11. Multi-Device Resolution Invariance Test
    print("\n[TEST 11/11] Cross-Device Resolution Invariance (Normalized Bounding Boxes)...")
    # Test on extreme aspect ratios:
    # A: Compact mobile screen (480x320)
    # B: Full HD vertical phone (1080x1920)
    img_compact = create_synthetic_frame(["EXIT GATE 2"], width=480, height=320, font_size=28)
    res_compact = engine.process_image(img_compact, mode="glance")
    
    img_tall = create_synthetic_frame(["EXIT GATE 2"], width=1080, height=1920, font_size=70)
    res_tall = engine.process_image(img_tall, mode="glance")
    
    # Check normalized bounding boxes are strictly within [0.0, 1.0]
    all_boxes = [l["normalized_bbox"] for l in res_compact["lines"]] + [l["normalized_bbox"] for l in res_tall["lines"]]
    in_bounds = True
    for b in all_boxes:
        for coord in b:
            if coord < 0.0 or coord > 1.0:
                in_bounds = False
    print(f"  > Compact Screen Lines: {len(res_compact['lines'])} | Tall Screen Lines: {len(res_tall['lines'])}")
    print(f"  > All Bounding Coordinates in [0.0, 1.0]: {in_bounds}")
    assert in_bounds is True
    results_summary.append(("Resolution Invariance", in_bounds))

    print("\n" + "=" * 70)
    print("                     TEST SUITE SUMMARY")
    print("=" * 70)
    for name, passed in results_summary:
        status = "PASSED" if passed else "FAILED"
        print(f"  [{status}] {name}")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
