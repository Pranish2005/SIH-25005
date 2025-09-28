from fastapi import FastAPI, UploadFile, File, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import time
from yolov8_model.detector import run_inference

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
    result = run_inference(temp_path, pixels_per_cm)
    inference_end = time.time()
    print(f"Inference completed in {inference_end - inference_start:.2f} seconds")

    detections = result.get("detections", [])
    print(f"Detections count: {len(detections)}")

# Add +100 to the cm_width and cm_height in every detection
    for det in detections:
        if det.get("cm_width") is not None:
            det["cm_width"] = round(det["cm_width"] + 100, 2)
        if det.get("cm_height") is not None:
            det["cm_height"] = round(det["cm_height"] + 100, 2)
        print(f"Detected {det['class']} - pixel size ({det['pixel_width']}x{det['pixel_height']}) cm size ({det.get('cm_width')}x{det.get('cm_height')})")

    class_counts = {}
    for det in detections:
        cname = det["class"]
        class_counts[cname] = class_counts.get(cname, 0) + 1
    class_str = ", ".join(f"{count} {name}(s)" for name, count in class_counts.items())

    H, W = result.get("orig_shape", (0,0))[:2]
    inference_time = result.get("speed", {}).get("inference", 0)
    summary = f"Image {W}x{H}, {class_str}, {inference_time:.1f} ms"
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
    
    result = run_inference(temp_path)
    detections = result.get("detections", [])

    if not detections:
        return {"error": "No reference object detected"}

    pixel_width = detections[0]["pixel_width"]
    pixels_per_cm = pixel_width / real_length_cm
    
    os.remove(temp_path)
    return {"pixels_per_cm": pixels_per_cm}
