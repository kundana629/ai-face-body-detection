import cv2
import numpy as np
from ultralytics import YOLO
import os

class ObjectDetector:
    def __init__(self):
        # Lazy load YOLOv8 to make server startup instant
        self.model = None
        # Load Haar Cascade for face detection (fast, offline, robust)
        # Included standard in OpenCV and works offline instantly
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def load_model(self):
        """
        Lazy-loads YOLOv8n (lightweight model, ~6MB weights)
        """
        if self.model is None:
            # Load yolov8n (lightweight)
            # This downloads yolov8n.pt if not present on disk
            self.model = YOLO("yolov8n.pt")
            
    def detect(self, img_path, detect_faces=True, detect_bodies=True):
        """
        Detects faces (Haar Cascade) and bodies (YOLOv8 Person class) in an image.
        Returns:
            faces (list of dicts with 'box' [x, y, w, h] as relative floats 0-1, 'absolute_box', 'score')
            bodies (list of dicts with 'box' [x, y, w, h] as relative floats 0-1, 'absolute_box', 'score')
        """
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError(f"Failed to read image at {img_path}")
            
        h, w = img.shape[:2]
        faces = []
        bodies = []
        
        # 1. Run Haar Cascade for Face Detection
        if detect_faces:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            detected_faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            for (fx, fy, fw, fh) in detected_faces:
                faces.append({
                    "box": [float(fx)/w, float(fy)/h, float(fw)/w, float(fh)/h],
                    "absolute_box": [int(fx), int(fy), int(fw), int(fh)],
                    "score": 0.95  # Standard default score for cascade detections
                })
                
        # 2. Run YOLOv8 for Person (Full Body) Detection
        if detect_bodies:
            try:
                self.load_model()
                results = self.model(img_path, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        # Class 0 is person in COCO dataset
                        cls = int(box.cls[0])
                        if cls == 0:
                            conf = float(box.conf[0])
                            xywh = box.xywh[0].tolist()  # [center_x, center_y, width, height]
                            
                            # Convert center-based coordinates to top-left-based boxes
                            cx, cy, bw, bh = xywh
                            bx = cx - bw / 2
                            by = cy - bh / 2
                            
                            # Clamp bounding boxes inside the image bounds
                            bx_clamped = max(0, min(w, bx))
                            by_clamped = max(0, min(h, by))
                            bw_clamped = max(1, min(w - bx_clamped, bw))
                            bh_clamped = max(1, min(h - by_clamped, bh))
                            
                            bodies.append({
                                "box": [float(bx_clamped)/w, float(by_clamped)/h, float(bw_clamped)/w, float(bh_clamped)/h],
                                "absolute_box": [int(bx_clamped), int(by_clamped), int(bw_clamped), int(bh_clamped)],
                                "score": conf
                            })
            except Exception as e:
                print(f"YOLOv8 Detection Error: {e}")
                # Log error but don't crash, allowing the app to still serve other results
                
        return faces, bodies

# Singleton instance
detector = ObjectDetector()
