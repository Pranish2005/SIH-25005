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
    # add more fields as needed, e.g., measurements, scores, etc.

@app.post("/classify-photo/", response_model=ClassificationResult)
async def classify_photo(file: UploadFile = File(...)):
    # Save the incoming file to disk
    temp_path = "temp_upload.jpg"
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    # Run YOLO inference
    detections = run_inference(temp_path)
    # Clean up temp file
    os.remove(temp_path)
    # Return results
    return ClassificationResult(
        detections=detections
    )
