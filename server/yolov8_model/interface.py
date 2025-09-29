from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
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

class ClassificationResult(BaseModel):
    detections: list
    summary: str | None = None
    annotated_image: str | None = None  # base64 data URL

def read_imagefile(file_bytes) -> np.ndarray:
    image = Image.open(BytesIO(file_bytes)).convert('RGB')
    # Convert to BGR for OpenCV pipeline entry
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

def to_base64_jpeg(bgr):
    import base64
    from PIL import Image
    from io import BytesIO
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb)
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=85)
    data = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/jpeg;base64,{data}"

@app.post("/classify-photo/", response_model=ClassificationResult)
async def classify_photo(
    file: UploadFile = File(...),
    pixels_per_cm: float = Body(default=0.0)
):
    start_time = time.time()
    contents = await file.read()

    # Read frame as BGR
    frame = read_imagefile(contents)
    H, W = frame.shape[:2]

    # Require valid calibration for real cm
    if pixels_per_cm is None or pixels_per_cm <= 0:
        raise HTTPException(status_code=400, detail="Missing or invalid pixels_per_cm. Run calibration first.")

    # Run pipeline with calibration (no artificial offsets)
    detections, annotated = process_frame_pipeline(frame, pixels_per_cm=pixels_per_cm)

    summary = f"Image {W}x{H}, {len(detections)} detections"
    annotated_b64 = to_base64_jpeg(annotated)

    total_time = time.time() - start_time
    print(f"Total processing time: {total_time:.2f} seconds")

    return ClassificationResult(
        detections=detections,
        summary=summary,
        annotated_image=annotated_b64
    )

@app.post("/calibrate/")
async def calibrate(file: UploadFile = File(...), real_length_cm: float = Body(...)):
    # Read image
    contents = await file.read()
    bgr = read_imagefile(contents)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    # Adjust to your bar color; example for bright green
    lower = np.array([35, 80, 80], dtype=np.uint8)
    upper = np.array([85, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower, upper)

    # Morphology to clean mask
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Find largest contour as bar
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return {"error": "Calibration bar not detected"}

    cnt = max(cnts, key=cv2.contourArea)
    rect = cv2.minAreaRect(cnt)
    (cx, cy), (w, h), angle = rect
    pixel_length = max(w, h)  # long side in pixels
    if pixel_length < 10:
        return {"error": "Calibration object too small"}

    pixels_per_cm = float(pixel_length) / float(real_length_cm)
    return {"pixels_per_cm": pixels_per_cm}

# Optional: ArUco-based calibration (more robust under varied lighting)
@app.post("/calibrate-aruco/")
async def calibrate_aruco(file: UploadFile = File(...), marker_length_cm: float = Body(default=5.0)):
    contents = await file.read()
    bgr = read_imagefile(contents)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Requires opencv-contrib-python
    try:
        adict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_5X5_100)
        params = cv2.aruco.DetectorParameters()
        detector = cv2.aruco.ArucoDetector(adict, params)
        corners, ids, _ = detector.detectMarkers(gray)
    except Exception as e:
        return {"error": f"ArUco not available: {e}"}

    if ids is None or len(corners) == 0:
        return {"error": "No ArUco markers detected"}

    lengths = []
    for c in corners:
        pts = c[0]  # 4x2
        sides = [np.linalg.norm(pts[i]-pts[(i+1)%4]) for i in range(4)]
        lengths.append(float(np.mean(sides)))
    pixel_side = float(np.mean(lengths))
    if pixel_side < 10:
        return {"error": "Marker too small in image"}

    pixels_per_cm = pixel_side / float(marker_length_cm)
    return {"pixels_per_cm": pixels_per_cm}
