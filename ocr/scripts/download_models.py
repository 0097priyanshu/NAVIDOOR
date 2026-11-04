import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Target model directory in NAVIDOOR workspace
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print(f"[*] Target model directory: {MODELS_DIR}")

import easyocr

def download_models():
    print("[*] Downloading & initializing English and Hindi/Marathi (Devanagari) models...")
    print(f"[*] Storage: {MODELS_DIR}")
    
    # Initialize reader with verbose=False to prevent Windows cp1252 console encoding error on progress bar
    reader = easyocr.Reader(
        ['en', 'hi'],
        gpu=False,
        model_storage_directory=str(MODELS_DIR),
        user_network_directory=str(MODELS_DIR),
        download_enabled=True,
        verbose=False
    )
    print("\n[SUCCESS] EasyOCR lightweight models downloaded and verified!")
    return reader

if __name__ == "__main__":
    download_models()
