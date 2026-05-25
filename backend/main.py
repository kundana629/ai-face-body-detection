import os
import uuid
import base64
import shutil
import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from detector import detector
from processor import draw_bounding_boxes, crop_subject

app = FastAPI(title="SmartCrop AI API")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Folders ----------------
UPLOADS_DIR = "uploads"
OUTPUTS_DIR = "outputs"

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)


# ---------------- Helper ----------------
def cv2_to_base64(img):
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer).decode("utf-8")


# ---------------- STATUS ----------------
@app.get("/api/status")
def status():
    return {
        "status": "running",
        "model": "YOLOv8 active"
    }


# ---------------- MAIN API ----------------
@app.post("/api/process")
async def process_image(file: UploadFile = File(...)):
    try:
        file_id = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOADS_DIR, file_id)

        # Save file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Read image
        img = cv2.imread(file_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # Run detection
        faces, bodies = detector.detect(
            file_path,
            detect_faces=True,
            detect_bodies=True
        )

        # Draw boxes
        result_img = draw_bounding_boxes(img, faces, bodies)

        # Encode output
        result_base64 = cv2_to_base64(result_img)

        # Cleanup
        os.remove(file_path)

        return {
            "image": result_base64,
            "faces_count": len(faces),
            "bodies_count": len(bodies)
        }

    except Exception as e:
        return {"error": str(e)}