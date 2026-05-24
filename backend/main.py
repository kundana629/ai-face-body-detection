import os
import uuid
import json
import base64
import shutil
import zipfile
from io import BytesIO
from typing import List, Optional
import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from detector import detector
from processor import draw_bounding_boxes, crop_subject, resize_image

app = FastAPI(title="SmartCrop AI Object Detection & Processing API")

# Configure CORS for local development with Vite React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits access from Vite's local dev ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.abspath("uploads")
OUTPUTS_DIR = os.path.abspath("outputs")

for d in [UPLOADS_DIR, OUTPUTS_DIR]:
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


def cv2_to_base64(img, ext=".png"):
    """
    Helper to encode an OpenCV image matrix to a Base64 data URL
    """
    success, encoded = cv2.imencode(ext, img)
    if not success:
        return None
    b64_str = base64.b64encode(encoded).decode("utf-8")
    mime_type = "image/png" if ext == ".png" else "image/jpeg"
    return f"data:{mime_type};base64,{b64_str}"


@app.get("/api/status")
def get_status():
    """
    Health check confirming API and YOLOv8 readiness
    """
    try:
        # Check model loading status
        detector.load_model()
        yolo_status = "active"
    except Exception as e:
        yolo_status = f"error loading weights ({e})"
        
    return {
        "status": "running",
        "service": "SmartCrop YOLOv8 AI Engine",
        "models": {
            "yolov8n": yolo_status,
            "face_cascade": "active"
        }
    }


@app.post("/api/process")
async def process_single_image(
    image: UploadFile = File(...),
    config: str = Form(...)
):
    """
    Processes a single image file for face/body detection, smart cropping, and resizing.
    Receives configuration options as a JSON string within a Form field.
    Returns:
        JSON with bounding boxes and processed outputs encoded in Base64 data URLs
    """
    # 1. Parse JSON configuration
    try:
        cfg = json.loads(config)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid configuration JSON: {e}")
        
    tasks = cfg.get("tasks", [])
    crop_opts = cfg.get("cropOptions", {})
    resize_opts = cfg.get("resizeOptions", {})
    
    # 2. Save temporary upload file
    file_id = f"{uuid.uuid4()}-{image.filename}"
    upload_path = os.path.join(UPLOADS_DIR, file_id)
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {e}")
        
    # 3. Read image and verify natural dimensions
    img = cv2.imread(upload_path)
    if img is None:
        os.remove(upload_path)
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
        
    h, w = img.shape[:2]
    response_payload = {
        "success": True,
        "original_dims": [w, h],
        "faces": [],
        "bodies": []
    }
    
    # 4. Perform AI Object Detection (lazy loads models)
    detect_faces = "face_detection" in tasks or "smart_crop" in tasks
    detect_bodies = "body_detection" in tasks or ("smart_crop" in tasks and not detect_faces)
    
    faces_detected, bodies_detected = detector.detect(
        upload_path, 
        detect_faces=detect_faces, 
        detect_bodies=detect_bodies
    )
    
    # 5. Populate and encode individual crop assets
    # Face Crops
    if "face_detection" in tasks:
        for idx, face in enumerate(faces_detected):
            face_crop = crop_subject(
                img, 
                face["box"], 
                padding=crop_opts.get("padding", 0.5),
                zoom=crop_opts.get("zoom", 1.0),
                shift_x=crop_opts.get("shiftX", 0.0),
                shift_y=crop_opts.get("shiftY", 0.0),
                blur_background=crop_opts.get("blurBackground", True),
                blur_strength=crop_opts.get("blurStrength", 20),
                target_ratio=1.0 # Standard square crops for faces
            )
            face["crop"] = cv2_to_base64(face_crop)
            response_payload["faces"].append(face)
            
    # Body Crops
    if "body_detection" in tasks:
        for idx, body in enumerate(bodies_detected):
            body_crop = crop_subject(
                img, 
                body["box"], 
                padding=crop_opts.get("padding", 0.5),
                zoom=crop_opts.get("zoom", 1.0),
                shift_x=crop_opts.get("shiftX", 0.0),
                shift_y=crop_opts.get("shiftY", 0.0),
                blur_background=crop_opts.get("blurBackground", True),
                blur_strength=crop_opts.get("blurStrength", 20),
                target_ratio=1.0 # Standard square crops for bodies
            )
            body["crop"] = cv2_to_base64(body_crop)
            response_payload["bodies"].append(body)

    # 6. Generate Main BBox Visualizer Overlay
    # Always draw overlays if face or body detection tasks are active
    if "face_detection" in tasks or "body_detection" in tasks:
        visualized = draw_bounding_boxes(
            img, 
            faces_detected if "face_detection" in tasks else [],
            bodies_detected if "body_detection" in tasks else []
        )
        response_payload["visualized_image"] = cv2_to_base64(visualized)
    
    # 7. Generate Smart Auto-Framing Crop
    if "smart_crop" in tasks:
        # Determine the primary subject bounding box for union auto-framing
        primary_box = None
        
        # If faces are detected, focus on faces. Otherwise, focus on full bodies.
        if faces_detected:
            # Union of all detected faces
            min_x = min(f["box"][0] for f in faces_detected)
            min_y = min(f["box"][1] for f in faces_detected)
            max_r = max(f["box"][0] + f["box"][2] for f in faces_detected)
            max_b = max(f["box"][1] + f["box"][3] for f in faces_detected)
            primary_box = [min_x, min_y, max_r - min_x, max_b - min_y]
        elif bodies_detected:
            # Union of all detected bodies
            min_x = min(b["box"][0] for b in bodies_detected)
            min_y = min(b["box"][1] for b in bodies_detected)
            max_r = max(b["box"][0] + b["box"][2] for b in bodies_detected)
            max_b = max(b["box"][1] + b["box"][3] for b in bodies_detected)
            primary_box = [min_x, min_y, max_r - min_x, max_b - min_y]
        else:
            # Fallback to center 50% box if no subjects found
            primary_box = [0.25, 0.25, 0.5, 0.5]
            
        smart_cropped = crop_subject(
            img,
            primary_box,
            padding=crop_opts.get("padding", 0.5),
            zoom=crop_opts.get("zoom", 1.0),
            shift_x=crop_opts.get("shiftX", 0.0),
            shift_y=crop_opts.get("shiftY", 0.0),
            blur_background=crop_opts.get("blurBackground", True),
            blur_strength=crop_opts.get("blurStrength", 20),
            target_ratio=crop_opts.get("targetRatio", 1.0)
        )
        response_payload["smart_cropped_image"] = cv2_to_base64(smart_cropped)
        
    # 8. Generate Resized Output
    if "resize" in tasks:
        r_mode = resize_opts.get("mode", "custom")
        r_w = resize_opts.get("width", 512)
        r_h = resize_opts.get("height", 512)
        r_preserve = resize_opts.get("preserveAspect", True)
        
        resized = resize_image(
            img, 
            mode=r_mode, 
            target_w=int(r_w), 
            target_h=int(r_h), 
            preserve_aspect=r_preserve
        )
        
        rh_new, rw_new = resized.shape[:2]
        response_payload["resized_image"] = cv2_to_base64(resized)
        response_payload["resized_dims"] = [rw_new, rh_new]

    # Clean up uploaded image
    try:
        os.remove(upload_path)
    except Exception as e:
        print(f"Cleanup warning (temp upload): {e}")
        
    return response_payload


@app.post("/api/batch-process")
async def process_batch_images(
    images: List[UploadFile] = File(...),
    config: str = Form(...)
):
    """
    Asynchronously processes a queue of batch images and streams a zipped file download.
    Contains folders/sub-assets for each processed image.
    """
    try:
        cfg = json.loads(config)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid configuration JSON: {e}")
        
    tasks = cfg.get("tasks", [])
    crop_opts = cfg.get("cropOptions", {})
    resize_opts = cfg.get("resizeOptions", {})

    # Create an in-memory ZIP writer
    zip_buffer = BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for idx, file in enumerate(images):
            # Save upload temporarily
            temp_name = f"temp-{uuid.uuid4()}-{file.filename}"
            temp_path = os.path.join(UPLOADS_DIR, temp_name)
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            img = cv2.imread(temp_path)
            if img is None:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                continue
                
            # Perform detections
            detect_faces = "face_detection" in tasks or "smart_crop" in tasks
            detect_bodies = "body_detection" in tasks or ("smart_crop" in tasks and not detect_faces)
            
            faces_detected, bodies_detected = detector.detect(
                temp_path, 
                detect_faces=detect_faces, 
                detect_bodies=detect_bodies
            )
            
            base_filename = os.path.splitext(file.filename)[0]
            
            # 1. BBox Visualization Layer
            if "face_detection" in tasks or "body_detection" in tasks:
                visualized = draw_bounding_boxes(
                    img,
                    faces_detected if "face_detection" in tasks else [],
                    bodies_detected if "body_detection" in tasks else []
                )
                _, enc = cv2.imencode(".png", visualized)
                zip_file.writestr(f"{base_filename}/visualized_{base_filename}.png", enc.tobytes())
                
            # 2. Individual Cropped Faces
            if "face_detection" in tasks:
                for f_idx, face in enumerate(faces_detected):
                    face_crop = crop_subject(
                        img, 
                        face["box"], 
                        padding=crop_opts.get("padding", 0.5),
                        zoom=crop_opts.get("zoom", 1.0),
                        shift_x=crop_opts.get("shiftX", 0.0),
                        shift_y=crop_opts.get("shiftY", 0.0),
                        blur_background=crop_opts.get("blurBackground", True),
                        blur_strength=crop_opts.get("blurStrength", 20),
                        target_ratio=1.0
                    )
                    _, enc = cv2.imencode(".png", face_crop)
                    zip_file.writestr(f"{base_filename}/crops/face_{f_idx + 1}.png", enc.tobytes())
                    
            # 3. Individual Cropped Bodies
            if "body_detection" in tasks:
                for b_idx, body in enumerate(bodies_detected):
                    body_crop = crop_subject(
                        img, 
                        body["box"], 
                        padding=crop_opts.get("padding", 0.5),
                        zoom=crop_opts.get("zoom", 1.0),
                        shift_x=crop_opts.get("shiftX", 0.0),
                        shift_y=crop_opts.get("shiftY", 0.0),
                        blur_background=crop_opts.get("blurBackground", True),
                        blur_strength=crop_opts.get("blurStrength", 20),
                        target_ratio=1.0
                    )
                    _, enc = cv2.imencode(".png", body_crop)
                    zip_file.writestr(f"{base_filename}/crops/body_{b_idx + 1}.png", enc.tobytes())

            # 4. Smart Crop
            if "smart_crop" in tasks:
                primary_box = None
                if faces_detected:
                    min_x = min(f["box"][0] for f in faces_detected)
                    min_y = min(f["box"][1] for f in faces_detected)
                    max_r = max(f["box"][0] + f["box"][2] for f in faces_detected)
                    max_b = max(f["box"][1] + f["box"][3] for f in faces_detected)
                    primary_box = [min_x, min_y, max_r - min_x, max_b - min_y]
                elif bodies_detected:
                    min_x = min(b["box"][0] for b in bodies_detected)
                    min_y = min(b["box"][1] for b in bodies_detected)
                    max_r = max(b["box"][0] + b["box"][2] for b in bodies_detected)
                    max_b = max(b["box"][1] + b["box"][3] for b in bodies_detected)
                    primary_box = [min_x, min_y, max_r - min_x, max_b - min_y]
                else:
                    primary_box = [0.25, 0.25, 0.5, 0.5]
                    
                smart_cropped = crop_subject(
                    img,
                    primary_box,
                    padding=crop_opts.get("padding", 0.5),
                    zoom=crop_opts.get("zoom", 1.0),
                    shift_x=crop_opts.get("shiftX", 0.0),
                    shift_y=crop_opts.get("shiftY", 0.0),
                    blur_background=crop_opts.get("blurBackground", True),
                    blur_strength=crop_opts.get("blurStrength", 20),
                    target_ratio=crop_opts.get("targetRatio", 1.0)
                )
                _, enc = cv2.imencode(".png", smart_cropped)
                zip_file.writestr(f"{base_filename}/smart_crop_{base_filename}.png", enc.tobytes())

            # 5. Image Resizing
            if "resize" in tasks:
                r_mode = resize_opts.get("mode", "custom")
                r_w = resize_opts.get("width", 512)
                r_h = resize_opts.get("height", 512)
                r_preserve = resize_opts.get("preserveAspect", True)
                
                resized = resize_image(
                    img, 
                    mode=r_mode, 
                    target_w=int(r_w), 
                    target_h=int(r_h), 
                    preserve_aspect=r_preserve
                )
                _, enc = cv2.imencode(".png", resized)
                zip_file.writestr(f"{base_filename}/resized_{base_filename}.png", enc.tobytes())

            # Remove temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    # Reset buffer position
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=smartcrop_batch_{uuid.uuid4().hex[:6]}.zip"}
    )
