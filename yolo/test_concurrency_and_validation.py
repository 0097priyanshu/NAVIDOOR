"""
NAVIDOOR YOLO Concurrency & Validation Test Suite
Tests input bounds, 429 busy lock rejection, and memory safety.
"""

import sys
import os
import io
import base64
import unittest
from PIL import Image
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from yolo_server import app, inference_lock

class TestYoloServerEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "online")
        self.assertIn("inference_busy", data)

    def test_missing_image_payload(self):
        response = self.client.post("/detect", json={"language": "en"})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])

    def test_oversized_payload(self):
        large_fake_b64 = "A" * (31 * 1024 * 1024)
        response = self.client.post("/detect", json={"image": large_fake_b64})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("Payload exceeds maximum", data["error"])

    def test_invalid_image_dimensions(self):
        # Create a tiny 10x10 image
        tiny_img = Image.new("RGB", (10, 10), color="blue")
        buf = io.BytesIO()
        tiny_img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        response = self.client.post("/detect", json={"image": b64})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("Invalid frame dimensions", data["error"])

    def test_valid_image_detection(self):
        # Create a standard 320x240 image
        img = Image.new("RGB", (320, 240), color="green")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        response = self.client.post("/detect", json={"image": b64, "language": "en"})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("detections", data)
        self.assertIn("latency_ms", data)
        self.assertIn("safe_path", data)

    def test_busy_lock_rejection_429(self):
        # Manually hold the inference lock to simulate in-flight inference
        locked = inference_lock.acquire(blocking=False)
        self.assertTrue(locked, "Failed to acquire lock for test")

        try:
            img = Image.new("RGB", (320, 240), color="red")
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

            # Next request should be rejected immediately with 429
            response = self.client.post("/detect", json={"image": b64, "language": "en"})
            self.assertEqual(response.status_code, 429)
            data = response.get_json()
            self.assertFalse(data["success"])
            self.assertTrue(data.get("busy"))
        finally:
            inference_lock.release()

if __name__ == "__main__":
    unittest.main()
