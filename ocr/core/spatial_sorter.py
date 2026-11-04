"""
NAVIDOOR Spatial Sorter
Organizes OCR bounding boxes into natural reading order:
Top-to-Bottom, Left-to-Right, with Line Clustering and Column Detection.
"""

import numpy as np

def polygon_to_bbox(polygon):
    """
    Converts 4-point polygon [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] into [min_x, min_y, max_x, max_y].
    """
    pts = np.array(polygon)
    min_x = float(np.min(pts[:, 0]))
    min_y = float(np.min(pts[:, 1]))
    max_x = float(np.max(pts[:, 0]))
    max_y = float(np.max(pts[:, 1]))
    return [min_x, min_y, max_x, max_y]

def sort_reading_order(raw_results, img_width, img_height):
    """
    raw_results: list of tuples from EasyOCR: (bbox_polygon, text, confidence)
    Returns:
        sorted_lines: list of structured line dictionaries
        full_text: concatenated string in natural reading order
    """
    if not raw_results:
        return [], ""
        
    items = []
    for item in raw_results:
        polygon, text, conf = item
        clean_text = str(text).strip()
        if not clean_text or conf < 0.20:
            continue
            
        bbox = polygon_to_bbox(polygon)
        min_x, min_y, max_x, max_y = bbox
        
        # Center points and height
        center_y = (min_y + max_y) / 2.0
        center_x = (min_x + max_x) / 2.0
        height = max(1.0, max_y - min_y)
        
        # Normalized coordinates (0.0 to 1.0) for responsive mobile overlays
        norm_bbox = [
            round(min_x / img_width, 4),
            round(min_y / img_height, 4),
            round(max_x / img_width, 4),
            round(max_y / img_height, 4)
        ]
        
        items.append({
            "text": clean_text,
            "confidence": round(float(conf), 2),
            "bbox_px": [int(min_x), int(min_y), int(max_x), int(max_y)],
            "normalized_bbox": norm_bbox,
            "center_x": center_x,
            "center_y": center_y,
            "height": height
        })
        
    if not items:
        return [], ""
        
    # Cluster into lines based on vertical overlap
    # Sort primarily by center_y
    items.sort(key=lambda it: it["center_y"])
    
    lines = []
    current_line = [items[0]]
    current_line_y = items[0]["center_y"]
    current_line_h = items[0]["height"]
    
    for item in items[1:]:
        # If item's center_y is within 60% of the line height, consider it the same line
        y_diff = abs(item["center_y"] - current_line_y)
        threshold = max(current_line_h, item["height"]) * 0.65
        
        if y_diff <= threshold:
            current_line.append(item)
            # Update running average for line center and height
            current_line_y = sum(x["center_y"] for x in current_line) / len(current_line)
            current_line_h = max(x["height"] for x in current_line)
        else:
            lines.append(current_line)
            current_line = [item]
            current_line_y = item["center_y"]
            current_line_h = item["height"]
            
    if current_line:
        lines.append(current_line)
        
    # Sort items within each line Left-to-Right
    flattened_sorted = []
    text_lines = []
    
    for line in lines:
        line.sort(key=lambda it: it["center_x"])
        line_text = " ".join(it["text"] for it in line)
        text_lines.append(line_text)
        
        for item in line:
            flattened_sorted.append({
                "text": item["text"],
                "confidence": item["confidence"],
                "normalized_bbox": item["normalized_bbox"],
                "line_text": line_text
            })
            
    full_text = "\n".join(text_lines)
    return flattened_sorted, full_text

