"""
NAVIDOOR Category Classifier
Classifies extracted text into the 9 user-requested domains:
- Signboards
- Door labels
- Hospital departments
- Bus boards
- Medicine labels
- Documents
- Notices
- Menus
- Product labels
Generates category-specific entity extraction and spoken guidance.
"""

import re

# Domain keyword dictionaries (English & common Devanagari transliterations/terms)
CATEGORY_PATTERNS = {
    "hospital_department": [
        r"\b(opd|icu|ccu|nicú|emergency|casualty|ward|radiology|pathology|cardiology|neurology|orthopedic|pediatric|oncology|pharmacy|doctor|dr\.|hospital|clinic|रुग्णालय|दवाखाना|अतिदक्षता|तपासणी)\b",
        r"\b(consultation|mri|x-ray|blood test|operation theatre|ot)\b"
    ],
    "medicine_label": [
        r"\b(tablet|tablets|tab|capsule|capsules|cap|syrup|mg|mcg|ml|dosage|dose|paracetamol|amoxicillin|ibuprofen|cetirizine|metformin|pantoprazole|aspirin|exp|batch|mfg|m\.r\.p|rx|schedule h|keep out of reach of children|oral suspension)\b",
        r"\b(ओषध|गोळी|मात्रा)\b"
    ],
    "bus_board": [
        r"\b(bus|route|depot|express|fast|limited|ac bus|via|station|stand|बस|मार्ग|आगार|स्थानक|द्रुतगती)\b",
        r"^[a-z]?\d{1,4}[a-z]?\s+(to|via|express|fast)",
        r"\b(dadar|thane|kurla|andheri|borivali|csmt|shivaji nagar|pune|swargate)\b"
    ],
    "door_label": [
        r"\b(room|cabin|flat|office|suite|hall|restroom|washroom|toilet|ladies|gents|staff only|conference room|meeting room|entry|exit|lift|elevator|stairs|staircase)\b",
        r"\b(खोली|कक्ष|शौचालय|प्रवेश|बाहेर)\b",
        r"^[a-z]?\d{1,4}[a-z]?$"  # e.g., "102", "B-404"
    ],
    "menu": [
        r"\b(menu|starters|main course|dessert|beverage|drinks|coffee|tea|chai|sandwich|burger|pizza|dosa|thali|roti|paneer|biryani|soup|salad|breakfast|lunch|dinner)\b",
        r"(₹|rs\.?|inr|\$)\s*\d+",
        r"\b(चहा|कॉफी|नाश्ता|थाळी)\b"
    ],
    "notice": [
        r"\b(notice|attention|warning|caution|prohibited|no parking|no smoking|silence please|keep clean|authorized personnel only|do not touch|closed|open|work in progress)\b",
        r"\b(सूचना|सावधान|धोका|प्रवेश बंद|धूम्रपान)\b"
    ],
    "product_label": [
        r"\b(net wt|net weight|ingredients|nutrition facts|best before|use by|manufactured by|packaged by|fssai|bar code|mrp|energy|protein|carbohydrate|fat|sugar)\b",
        r"\b(सामग्री|वजन)\b"
    ],
    "signboard": [
        r"\b(road|rd|street|st|avenue|ave|lane|marg|chowk|nagar|colony|plaza|mall|market|bazaar|junction|highway|flyover|stop|cross)\b",
        r"\b(मार्ग|चौक|रस्ता|नगर|बाजार|उड्डाणपूल)\b"
    ]
}

def classify_text_category(full_text, lines=None):
    """
    Classifies text into one of the 9 target categories based on lexical patterns and structure.
    Returns:
        category: str
        confidence: float
        entities: dict
        spoken_summary: str
    """
    text_lower = full_text.lower()
    scores = {cat: 0.0 for cat in CATEGORY_PATTERNS}
    
    # 1. Pattern matching scores
    for cat, patterns in CATEGORY_PATTERNS.items():
        for pat in patterns:
            matches = re.findall(pat, text_lower, re.IGNORECASE)
            scores[cat] += len(matches) * 2.0
            
    # 2. Structural heuristics
    # Bus board: short text with prominent number + destination
    has_bus_number = re.search(r"\b\d{1,4}[a-z]?\b", full_text)
    if has_bus_number and (scores["bus_board"] > 0 or len(full_text.split()) <= 6):
        scores["bus_board"] += 2.5
        
    # Menu: lines containing prices
    price_matches = re.findall(r"(₹|rs\.?|inr|\$)\s*\d+", text_lower)
    if len(price_matches) >= 2:
        scores["menu"] += 5.0
        
    # Document: dense multi-line text (> 40 words, multiple complete sentences)
    word_count = len(full_text.split())
    line_count = len(full_text.split("\n"))
    if word_count > 35 and line_count >= 4:
        scores["document"] = (word_count / 10.0)
        
    # Door label: usually 1 to 3 words
    if word_count <= 4 and (scores["door_label"] > 0 or re.search(r"^[a-z]?\d{1,4}[a-z]?$", text_lower)):
        scores["door_label"] += 3.0
        
    # Find highest scoring category
    best_cat = max(scores, key=scores.get)
    max_score = scores[best_cat]
    
    if max_score == 0:
        # Default fallback
        if word_count > 25:
            best_cat = "document"
        elif word_count <= 5:
            best_cat = "signboard"
        else:
            best_cat = "notice"
        cat_conf = 0.50
    else:
        cat_conf = min(0.98, round(0.55 + (max_score * 0.08), 2))
        
    # Extract entities and formulate spoken guidance
    entities = extract_category_entities(best_cat, full_text)
    spoken_summary = generate_spoken_announcement(best_cat, full_text, entities)
    
    return {
        "category": best_cat,
        "category_confidence": cat_conf,
        "entities": entities,
        "spoken_summary": spoken_summary
    }

def extract_category_entities(category, full_text):
    """
    Extracts high-value domain entities according to category.
    """
    entities = {}
    lines = [l.strip() for l in full_text.split("\n") if l.strip()]
    text_lower = full_text.lower()
    
    if category == "medicine_label":
        # Extract dosage (e.g., 500mg, 10ml, 250 mcg)
        dosage = re.findall(r"\b\d+\s*(?:mg|mcg|ml|g|gm)\b", text_lower)
        if dosage:
            entities["dosage"] = dosage[0]
            
        # Extract expiry
        expiry = re.findall(r"\b(?:exp|expiry|exp\.?\s*date)\s*[:.-]?\s*([0-9]{1,2}[/-][0-9]{2,4})\b", text_lower)
        if expiry:
            entities["expiry"] = expiry[0]
            
        # Extract medicine name (usually the first prominent title line)
        if lines:
            entities["medicine_name"] = lines[0]
            
    elif category == "bus_board":
        # Extract bus route number
        bus_no = re.findall(r"\b\d{1,4}[a-z]?\b", full_text)
        if bus_no:
            entities["route_number"] = bus_no[0]
        # Extract destination
        words = full_text.replace("\n", " ").split()
        if len(words) > 1:
            entities["destination"] = " ".join([w for w in words if not w.isdigit()])
            
    elif category == "hospital_department":
        if lines:
            entities["department"] = lines[0]
        room_match = re.findall(r"\b(?:room|cabin|ward|no\.?)\s*[:.-]?\s*([a-z0-9-]+)\b", text_lower)
        if room_match:
            entities["room_number"] = room_match[0]
            
    elif category == "door_label":
        entities["label"] = full_text.replace("\n", " ")
        
    elif category == "menu":
        items = []
        for line in lines[:6]:
            if re.search(r"\d+", line):
                items.append(line)
        entities["menu_items"] = items
        
    return entities

def generate_spoken_announcement(category, full_text, entities):
    """
    Produces clear, concise spoken summary for blind users.
    """
    lines = [l.strip() for l in full_text.split("\n") if l.strip()]
    if not lines:
        return "No clear text detected."
        
    first_line = lines[0]
    
    if category == "medicine_label":
        name = entities.get("medicine_name", first_line)
        dosage = entities.get("dosage", "")
        exp = entities.get("expiry", "")
        announcement = f"Medicine detected: {name}."
        if dosage:
            announcement += f" Dosage: {dosage}."
        if exp:
            announcement += f" Expiry: {exp}."
        return announcement
        
    elif category == "bus_board":
        bus_no = entities.get("route_number", "")
        dest = entities.get("destination", first_line)
        if bus_no:
            return f"Bus route {bus_no}. Destination: {dest}."
        return f"Bus board says: {first_line}."
        
    elif category == "hospital_department":
        dept = entities.get("department", first_line)
        room = entities.get("room_number", "")
        if room:
            return f"Hospital department: {dept}, Room {room}."
        return f"Hospital department: {dept}."
        
    elif category == "door_label":
        return f"Door sign: {first_line}."
        
    elif category == "menu":
        item_count = len(entities.get("menu_items", []))
        return f"Menu detected with {max(1, item_count)} items. Starting with: {first_line}."
        
    elif category == "notice":
        return f"Notice reads: {first_line}."
        
    elif category == "product_label":
        return f"Product label: {first_line}."
        
    elif category == "signboard":
        return f"Signboard reads: {first_line}."
        
    elif category == "document":
        # Read the first sentence or two
        preview = " ".join(lines[:2])
        return f"Document detected. Reading: {preview[:120]}."
        
    return f"Text reads: {first_line}."

