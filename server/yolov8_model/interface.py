# yolov8_model/interface.py
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os

# Import your detector utility
from yolov8_model.detector import run_inference

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassificationResult(BaseModel):
    detections: list
    summary: str = None  # Summary string for frontend display

@app.post("/classify-photo/", response_model=ClassificationResult)
async def classify_photo(file: UploadFile = File(...)):
    # Save image temporarily
    temp_path = "temp_upload.jpg"
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    # Run YOLO inference - expect just detections list
    detections = run_inference(temp_path)

    # Extract shape and inference time from run_inference if possible
    # Alternatively, extract here if detections contain that info

    # Example dummy extraction - you must adapt this based on your run_inference implementation
    # Assuming 'detections' is a dict with keys 'boxes', 'orig_shape', 'speed' or adapt accordingly

    width, height = 640, 640  # Default fallback
    inference_time = 0.0
    
    if hasattr(detections, "orig_shape"):
        shape = detections.orig_shape
        height, width = shape[:2]

    if hasattr(detections, "speed"):
        inference_time = detections.speed.get("inference", 0) * 1000  # convert to ms if given in seconds

    # Class count summary
    class_counts = {}
    for det in detections:
        cname = det.get("class", "object")
        class_counts[cname] = class_counts.get(cname, 0) + 1
    class_str = ", ".join(f"{count} {name}s" for name, count in class_counts.items())

    # Compose summary string
    summary = f"{width}x{height} {class_str}, {inference_time:.1f}ms"

    # Clean up temp file
    os.remove(temp_path)

    return ClassificationResult(
        detections=detections,
        summary=summary,
        
    )
