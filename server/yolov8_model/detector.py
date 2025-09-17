# yolov8_model/detector.py
from ultralytics import YOLO

# Change 'yolov8n.pt' to your custom model if needed
MODEL_PATH = 'yolov8n.pt'

# Model loads and caches weights automatically
model = YOLO(MODEL_PATH)

def run_inference(image_path):
    results = model(image_path)
    # Example: Just get the first bounding box (if any)
    boxes = results[0].boxes
    output = []
    for box in boxes:
        output.append({
            "bbox": box.xyxy.tolist(),
            "score": float(box.conf),
            "class_id": int(box.cls)
        })
    return output
