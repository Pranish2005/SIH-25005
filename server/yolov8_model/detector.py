from ultralytics import YOLO

MODEL_PATH = 'yolov8n.pt'
model = YOLO(MODEL_PATH)

def run_inference(image_path: str, pixels_per_cm: float = 37.79):
    results = model(image_path)
    r = results[0]
    detections = []

    for box in r.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        width_px = x2 - x1
        height_px = y2 - y1

        width_cm = round(width_px / pixels_per_cm, 2) if pixels_per_cm else None
        height_cm = round(height_px / pixels_per_cm, 2) if pixels_per_cm else None

        detections.append({
            "bbox": [x1, y1, x2, y2],
            "score": float(box.conf),
            "class": r.names[int(box.cls)],
            "pixel_width": round(width_px, 2),
            "pixel_height": round(height_px, 2),
            "cm_width": width_cm,
            "cm_height": height_cm,
        })

    return {
        "detections": detections,
        "orig_shape": r.orig_shape,
        "speed": r.speed,
    }
