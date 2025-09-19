# yolov8_model/detector.py
from ultralytics import YOLO

# Load model once
MODEL_PATH = 'yolov8n.pt'
model = YOLO(MODEL_PATH)

def run_inference(image_path):
    results = model(image_path)
    boxes = results[0].boxes
    output = []
    for box in boxes:
        class_id = int(box.cls)
        class_name = results[0].names[class_id]  # map id to name
        output.append({
            "bbox": box.xyxy.tolist(),
            "score": float(box.conf),
            "class_id": class_id,
            "class": class_name  # add class name string here
        })
    return output
