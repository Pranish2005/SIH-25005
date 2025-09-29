from fastapi import FastAPI, UploadFile, File, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import numpy as np
import cv2
from io import BytesIO
from PIL import Image
from yolov8_model.detector import process_frame_pipeline


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Detection(BaseModel):
    bbox: list
    score: float
    class_: str
    pixel_width: float
    pixel_height: float
    cm_width: float = None   # Added for cm measurement
    cm_height: float = None


class ClassificationResult(BaseModel):
    detections: list
    summary: str = None


def read_imagefile(file) -> np.ndarray:
    image = Image.open(BytesIO(file))
    image = image.convert('RGB')
    return np.array(image)


@app.post("/classify-photo/", response_model=ClassificationResult)
async def classify_photo(file: UploadFile = File(...), pixels_per_cm: float = Body(default=37.79)):
    start_time = time.time()
    print("Starting /classify-photo endpoint")

    temp_path = "temp_upload.jpg"

    print("Reading uploaded file...")
    contents = await file.read()
    print(f"Read {len(contents)} bytes")

    print("Writing to temp file...")
    with open(temp_path, "wb") as f:
        f.write(contents)
    print(f"Temp file written at {temp_path}")

    print(f"Starting inference with pixels_per_cm = {pixels_per_cm} ...")
    inference_start = time.time()
    frame = cv2.imread(temp_path)
    scores, annotated = process_frame_pipeline(frame)
    inference_end = time.time()
    print(f"Inference completed in {inference_end - inference_start:.2f} seconds")

    detections = []
    for s in scores:
        # Example bounding box metadata dummy, replace with your detection bbox info
        detections.append({
            "bbox": [0, 0, 0, 0],
            "score": s["score"],
            "class_": "cattle",
            "pixel_width": s["measurements"][0],
            "pixel_height": s["measurements"][1],
            "cm_width": round(s["measurements"][0] / pixels_per_cm, 2),
            "cm_height": round(s["measurements"][1] / pixels_per_cm, 2)
        })

    # Add +100 to cm_width and cm_height in every detection (as per your note)
    for det in detections:
        if det.get("cm_width") is not None:
            det["cm_width"] = round(det["cm_width"] + 100, 2)
        if det.get("cm_height") is not None:
            det["cm_height"] = round(det["cm_height"] + 100, 2)
        print(f"Detected {det['class_']} - pixel size ({det['pixel_width']}x{det['pixel_height']}) cm size ({det['cm_width']}x{det['cm_height']})")

    H, W = frame.shape[:2]
    inference_time = (inference_end - inference_start) * 1000  # milliseconds
    summary = f"Image {W}x{H}, {len(detections)} detections, {inference_time:.1f} ms"
    print(f"Summary: {summary}")

    print("Removing temp file...")
    os.remove(temp_path)
    print("Temp file removed")

    total_time = time.time() - start_time
    print(f"Total processing time: {total_time:.2f} seconds")

    return ClassificationResult(
        detections=detections,
        summary=summary
    )


@app.post("/calibrate/")
async def calibrate(file: UploadFile = File(...), real_length_cm: float = Body(...)):
    temp_path = "temp_ref.jpg"
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    frame = cv2.imread(temp_path)
    # For simplicity, run detection only without full pipeline
    # You can also call detector.py if preferred

    # Dummy detection box pixel width: replace with actual detection logic
    pixel_width = 100  
    pixels_per_cm = pixel_width / real_length_cm
    
    os.remove(temp_path)
    return {"pixels_per_cm": pixels_per_cm}
