import cv2
import numpy as np
from ultralytics import YOLO
from backgroundremover.bg import remove
from PIL import Image
import io
import base64

# Load YOLOv8 model (ensure yolov8n.pt is in the same folder)
model = YOLO('yolov8n.pt')

def remove_background(frame):
    out = remove(frame, model_name='u2net')

    if isinstance(out, np.ndarray):
        h, w = frame.shape[:2]

        # If out is a mask (H,W) in float or uint8
        if out.ndim == 2:
            # Normalize to 0-255 uint8
            if out.dtype != np.uint8:
                out = (out * 255).clip(0,255).astype(np.uint8)
            # Ensure frame is RGB for masking
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.shape[2] == 3 else frame
            if out.shape != (h, w):
                out = cv2.resize(out, (w, h), interpolation=cv2.INTER_NEAREST)
            mask3 = np.repeat(out[..., None], 3, axis=2) / 255.0
            comp = (frame_rgb.astype(np.float32) * mask3).astype(np.uint8)
            return comp

        # If out is H×W×C
        if out.ndim == 3:
            oh, ow = out.shape[:2]
            # Scale floats
            if out.dtype != np.uint8:
                out = (out * 255).clip(0,255).astype(np.uint8)
            # If channels=4 (RGBA), use alpha to composite with original
            if out.shape[2] == 4:
                rgb = out[..., :3]
                alpha = out[..., 3].astype(np.float32) / 255.0
                alpha = alpha[..., None]
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.shape[2] == 3 else frame
                if (oh, ow) != (h, w):
                    rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LINEAR)
                    alpha = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR)[..., None]
                    frame_rgb = cv2.resize(frame_rgb, (w, h), interpolation=cv2.INTER_LINEAR)
                comp = (rgb.astype(np.float32) * alpha + frame_rgb.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
                return comp
            # If channels=3, just resize to original if needed
            if out.shape[2] == 3:
                if (oh, ow) != (h, w):
                    out = cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR)
                return out

        # If 1D flattened array
        if out.ndim == 1:
            expected = h * w * 3
            if out.size == expected:
                out = out.reshape((h, w, 3))
                if out.dtype != np.uint8:
                    out = (out * 255).clip(0,255).astype(np.uint8)
                return out
            # Try assume mask flattened
            expected_mask = h * w
            if out.size == expected_mask:
                mask = out.reshape((h, w))
                if mask.dtype != np.uint8:
                    mask = (mask * 255).clip(0,255).astype(np.uint8)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.shape[2] == 3 else frame
                mask3 = np.repeat((mask/255.0)[..., None], 3, axis=2)
                comp = (frame_rgb.astype(np.float32) * mask3).astype(np.uint8)
                return comp

    # Fallback: return original frame as RGB to avoid crashing
    print("[WARN] Background removal output unexpected. Using original frame.")
    return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.shape[2] == 3 else frame



def detect_and_crop(frame):
    # Ensure frame is numpy ndarray
    if not isinstance(frame, np.ndarray):
        raise TypeError("Frame must be a numpy ndarray")

    # Convert float image to uint8 if needed
    if frame.dtype != np.uint8:
        frame = (frame * 255).astype(np.uint8)

    # Check dimensions safely
    if len(frame.shape) == 3 and frame.shape[2] == 3:
        # Convert RGB to BGR
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    elif len(frame.shape) == 2:
        # Grayscale image - convert to BGR by duplication
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
    else:
        # Unexpected shape
        raise ValueError("Unexpected image shape: {}".format(frame.shape))

    results = model(frame_bgr)
    crops = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        crop = frame_bgr[y1:y2, x1:x2]
        crops.append(crop)
    return crops, results[0]


def pose_estimation(crop_img):
    # Placeholder for pose estimation
    height, width = crop_img.shape[:2]
    keypoints = [
        (int(width*0.3), int(height*0.3)),
        (int(width*0.7), int(height*0.3)),
        (int(width*0.5), int(height*0.7))
    ]
    return keypoints

def measure_distances_and_angles(keypoints):
    p1, p2, p3 = keypoints[0], keypoints[1], keypoints[2]
    dist = np.linalg.norm(np.array(p1) - np.array(p2))
    a = np.array(p1) - np.array(p2)
    b = np.array(p3) - np.array(p2)
    angle = np.arccos(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return dist, np.degrees(angle)

def score_animal(measurements):
    dist, angle = measurements
    score = dist * 0.6 + angle * 0.4
    return score

def annotate_image(frame, boxes, keypoints):
    for box in boxes:
        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
    for point in keypoints:
        cv2.circle(frame, tuple(map(int, point)), 5, (255,0,0), -1)
    return frame

def process_frame_pipeline(frame):
    # Background removal
    bg_removed = remove_background(frame)

    # Detect and crop animals
    crops, detection_results = detect_and_crop(bg_removed)

    all_scores = []
    all_keypoints = []

    # Pose estimation, measurement, scoring
    for crop in crops:
        keypoints = pose_estimation(crop)
        measurements = measure_distances_and_angles(keypoints)
        score = score_animal(measurements)
        all_keypoints.append(keypoints)
        all_scores.append({
            'measurements': measurements,
            'score': score
        })

    # Annotate frame with detections and keypoints (first detected animal)
    if all_keypoints:
        annotated = annotate_image(frame, detection_results.boxes, all_keypoints[0])
    else:
        annotated = frame

    return all_scores, annotated
