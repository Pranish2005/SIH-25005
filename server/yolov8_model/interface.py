from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassificationResult(BaseModel):
    measurements: dict
    scores: dict
    annotations: str = None

@app.post("/classify-photo/", response_model=ClassificationResult)
async def classify_photo(file: UploadFile = File(...)):
    # Read the image to simulate processing (optional)
    _ = await file.read()

    # Return fixed dummy measurements and scores
    return ClassificationResult(
        measurements={
            "body_length_cm": 170,
            "height_cm": 140,
            "rump_angle_deg": 15,
        },
        scores={
            "Body Length": "8/9",
            "Height": "7/9",
            "Dairy Character": "6/9",
            "Foot & Leg Angle": "8/9",
        },
        annotations=None,  # Or provide a sample annotation image/base64 if you want
    )
