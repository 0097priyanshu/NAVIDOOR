# NAVIDOOR OCR Reading Assistant (Module 5)

Lightweight, mobile-friendly scene-text & printed document OCR engine designed for blind, visually impaired, and elderly users.

## 🌟 Key Capabilities
- **9 Specialized Categories**:
  1. Signboards & Street Names
  2. Door Labels & Room Indicators
  3. Hospital Departments & Directions
  4. Bus Route & Destination Boards
  5. Medicine Blister Packs & Bottle Labels
  6. Printed Documents & Letters
  7. Public Notices & Warning Boards
  8. Restaurant Menus & Price Lists
  9. Retail Product Labels
- **Multilingual Support**: English (`en`), Hindi (`hi`), Marathi (`mr`), and Devanagari script.
- **Intelligent Preprocessing**:
  - Blur detection via Laplacian variance (protects user from unreadable frames).
  - Contrast Limited Adaptive Histogram Equalization (CLAHE) for dim corridors.
  - Glare suppression for glossy pill packs and laminated notices.
- **Spatial Sorter**: Clusters text into natural reading order (Top-to-Bottom, Left-to-Right) and provides normalized bounding boxes `[0.0 - 1.0]` for mobile UI overlays.
- **Spoken Announcements**: Formulates immediate high-priority audio summaries before full reading.

---

## 🚀 Running the OCR Microservice
Default Port: `5004`

```bash
# Run server
npm run ocr
# Or directly:
python ocr/ocr_server.py
```

## 🧪 Running Unit Tests
```bash
npm run test:ocr
# Or directly:
python ocr/tests/test_ocr.py
```

---

## 📡 API Endpoints

### 1. `GET /health`
Returns service status, loaded models, supported categories, and languages.

### 2. `POST /ocr/read`
General OCR endpoint.
- **Body (JSON)**:
  ```json
  {
    "image": "<base64_string>",
    "mode": "glance | deep",
    "category_hint": "medicine | bus | hospital | auto"
  }
  ```
- **Or Multipart Form**: Upload file under key `image`.

### 3. `POST /ocr/glance`
Low-latency endpoint optimized for live camera viewfinder scanning (< 400ms).

### 4. `POST /ocr/deep`
High-definition snapshot endpoint with full CLAHE, glare removal, and de-skewing for dense medicine bottles and documents.

