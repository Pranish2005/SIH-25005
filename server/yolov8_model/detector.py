import cv2
import numpy as np
from ultralytics import YOLO
from backgroundremover.bg import remove
from PIL import Image

# Load YOLOv8 model (ensure yolov8n.pt is in this folder)
model = YOLO('yolov8n.pt')

# -------------------- Utils --------------------

def _to_uint8(img):
    if img.dtype == np.uint8:
        return img
    # assume float 0..1 or general numeric; normalize/clamp
    if img.dtype != np.float32 and img.dtype != np.float64:
        img = img.astype(np.float32)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)

def _euclid(a, b):
    return float(np.hypot(a[0]-b[0], a[1]-b[1]))

def _angle(a, b, c):
    v1 = np.array([a[0]-b[0], a[1]-b[1]], dtype=float)
    v2 = np.array([c[0]-b[0], c[1]-b[1]], dtype=float)
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 < 1e-6 or n2 < 1e-6:
        return None
    cosang = np.clip(np.dot(v1, v2) / (n1*n2), -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def _vis(k):  # kp = (x,y,conf)
    return k is not None and len(k) >= 3 and k[2] >= 0.4

# -------------------- Background Removal --------------------

def remove_background(frame_bgr):
    """
    frame_bgr: numpy uint8 BGR image (H,W,3)
    Returns: numpy uint8 RGB image (H,W,3) with background attenuated/removed.
    Handles RGBA, RGB, mask, and flattened outputs.
    """
    assert isinstance(frame_bgr, np.ndarray) and frame_bgr.ndim == 3 and frame_bgr.shape[2] == 3, \
        "Input frame must be BGR HxWx3 uint8"

    h, w = frame_bgr.shape[:2]
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    out = remove(frame_rgb, model_name='u2net')

    # PIL Image
    if isinstance(out, Image.Image):
        if out.mode != "RGBA":
            out = out.convert("RGBA")
        out_np = np.array(out)  # H,W,4
        oh, ow = out_np.shape[:2]
        rgb = out_np[..., :3]
        a = out_np[..., 3].astype(np.float32) / 255.0
        if (oh, ow) != (h, w):
            rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LINEAR)
            a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
        comp = (rgb.astype(np.float32) * a[..., None] + frame_rgb.astype(np.float32) * (1.0 - a[..., None])).astype(np.uint8)
        return comp

    # numpy outputs
    if isinstance(out, np.ndarray):
        out = np.array(out)
        # mask HxW
        if out.ndim == 2:
            mask = out
            if mask.dtype != np.uint8:
                mask = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
            if mask.shape != (h, w):
                mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
            comp = (frame_rgb.astype(np.float32) * (mask/255.0)[..., None]).astype(np.uint8)
            return comp

        # color HxWxC
        if out.ndim == 3:
            oh, ow = out.shape[:2]
            if out.shape[2] == 4:
                rgba = _to_uint8(out)
                rgb = rgba[..., :3]
                a = rgba[..., 3].astype(np.float32) / 255.0
                if (oh, ow) != (h, w):
                    rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LINEAR)
                    a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
                comp = (rgb.astype(np.float32) * a[..., None] + frame_rgb.astype(np.float32) * (1.0 - a[..., None])).astype(np.uint8)
                return comp
            if out.shape[2] == 3:
                rgb = _to_uint8(out)
                if (oh, ow) != (h, w):
                    rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LINEAR)
                return rgb

        # flattened
        if out.ndim == 1:
            expected_color = h * w * 3
            expected_mask = h * w
            if out.size == expected_color:
                arr = out.reshape((h, w, 3))
                return _to_uint8(arr)
            if out.size == expected_mask:
                mask = out.reshape((h, w))
                if mask.dtype != np.uint8:
                    mask = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
                comp = (frame_rgb.astype(np.float32) * (mask/255.0)[..., None]).astype(np.uint8)
                return comp

    print("[WARN] Background removal output unexpected. Using original frame.")
    return frame_rgb

# -------------------- Detection & Pose --------------------

def detect_and_crop(rgb_img):
    """
    rgb_img: uint8 RGB HxWx3
    Returns: list of crops (BGR), and YOLO result object
    """
    if not isinstance(rgb_img, np.ndarray) or rgb_img.ndim != 3 or rgb_img.shape[2] != 3:
        raise TypeError("detect_and_crop expects RGB HxWx3 ndarray")
    bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
    results = model(bgr)
    crops = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1 = max(0, min(x1, bgr.shape[1]-1))
        x2 = max(0, min(x2, bgr.shape[1]-1))
        y1 = max(0, min(y1, bgr.shape[0]-1))
        y2 = max(0, min(y2, bgr.shape[0]-1))
        if x2 > x1 and y2 > y1:
            crop = bgr[y1:y2, x1:x2]
            crops.append(crop)
    return crops, results[0]

def pose_estimation(crop_bgr):
    # Placeholder; replace with a real pose model and a consistent schema
    h, w = crop_bgr.shape[:2]
    # Example 15 points to map into names later:
    kps = [
        (int(w*0.55), int(h*0.35), 0.9),  # shoulder
        (int(w*0.40), int(h*0.50), 0.8),  # chest_left
        (int(w*0.70), int(h*0.50), 0.8),  # chest_right
        (int(w*0.55), int(h*0.50), 0.8),  # elbow
        (int(w*0.70), int(h*0.55), 0.8),  # hip
        (int(w*0.75), int(h*0.70), 0.8),  # hock
        (int(w*0.35), int(h*0.85), 0.8),  # hoof_fl
        (int(w*0.55), int(h*0.85), 0.8),  # hoof_fr
        (int(w*0.70), int(h*0.90), 0.8),  # hoof_rl
        (int(w*0.82), int(h*0.90), 0.8),  # hoof_rr
        (int(w*0.73), int(h*0.62), 0.8),  # upper_leg_rear
        (int(w*0.78), int(h*0.80), 0.8),  # lower_leg_rear
        (int(w*0.55), int(h*0.70), 0.8),  # lower_leg_front
        (int(w*0.54), int(h*0.78), 0.8),  # fetlock_front
        (int(w*0.77), int(h*0.85), 0.8),  # fetlock_rear
    ]
    return kps

def make_kp_dict(kps_list):
    names = [
        "shoulder","chest_left","chest_right","elbow","hip","hock",
        "hoof_fl","hoof_fr","hoof_rl","hoof_rr",
        "upper_leg_rear","lower_leg_rear","lower_leg_front",
        "fetlock_front","fetlock_rear"
    ]
    d = {}
    for i, name in enumerate(names):
        if i < len(kps_list):
            d[name] = kps_list[i]
    return d

# -------------------- Measurements --------------------

def measure_distances_and_angles(keypoints):
    # using first 3 as placeholder
    (x1,y1,_), (x2,y2,_), (x3,y3,_) = keypoints[:3]
    dist = float(np.hypot(x1-x2, y1-y2))
    a = np.array([x1-x2, y1-y2], dtype=float)
    b = np.array([x3-x2, y3-y2], dtype=float)
    na = np.linalg.norm(a); nb = np.linalg.norm(b)
    if na < 1e-6 or nb < 1e-6:
        ang = 0.0
    else:
        cosang = float(np.clip(np.dot(a,b)/(na*nb), -1.0, 1.0))
        ang = float(np.degrees(np.arccos(cosang)))
    return dist, ang

def measure_chest_width(kps, pixels_per_cm, mask=None):
    L = kps.get("chest_left"); R = kps.get("chest_right")
    if _vis(L) and _vis(R):
        px = abs(R[0] - L[0])
        return {"px": px, "cm": px / pixels_per_cm, "conf": (L[2] + R[2]) / 2}
    if mask is not None:
        rows = np.any(mask > 0, axis=1)
        idx = np.where(rows)[0]
        if idx.size:
            mid = int(np.median(idx))
            cols = np.where(mask[mid] > 0)[0]
            if cols.size:
                px = float(cols.max() - cols.min())
                return {"px": px, "cm": px / pixels_per_cm, "conf": 0.5}
    return None

def measure_front_leg_length(kps, pixels_per_cm):
    shoulder = kps.get("shoulder")
    elbow = kps.get("elbow")
    hoof_fl = kps.get("hoof_fl"); hoof_fr = kps.get("hoof_fr")
    hoof = hoof_fl if _vis(hoof_fl) else hoof_fr if _vis(hoof_fr) else None
    if _vis(shoulder) and _vis(hoof):
        px = _euclid(shoulder, hoof)
        out = {"px": px, "cm": px / pixels_per_cm, "conf": (shoulder[2] + hoof[2]) / 2}
        if _vis(elbow):
            upper = _euclid(shoulder, elbow); lower = _euclid(elbow, hoof)
            out["upper_cm"] = upper / pixels_per_cm
            out["lower_cm"] = lower / pixels_per_cm
        return out
    return None

def measure_rear_leg_length(kps, pixels_per_cm):
    hip = kps.get("hip")
    hock = kps.get("hock")
    hoof_rl = kps.get("hoof_rl"); hoof_rr = kps.get("hoof_rr")
    hoof = hoof_rl if _vis(hoof_rl) else hoof_rr if _vis(hoof_rr) else None
    if _vis(hip) and _vis(hoof):
        px = _euclid(hip, hoof)
        out = {"px": px, "cm": px / pixels_per_cm, "conf": (hip[2] + hoof[2]) / 2}
        if _vis(hock):
            upper = _euclid(hip, hock); lower = _euclid(hock, hoof)
            out["upper_cm"] = upper / pixels_per_cm
            out["lower_cm"] = lower / pixels_per_cm
        return out
    return None

def measure_hock_angle(kps):
    upper = kps.get("upper_leg_rear")
    hock = kps.get("hock")
    lower = kps.get("lower_leg_rear")
    if _vis(upper) and _vis(hock) and _vis(lower):
        ang = _angle(upper, hock, lower)
        if ang is not None:
            return {"deg": ang, "conf": min(upper[2], hock[2], lower[2])}
    return None

def measure_pastern_angle(kps, side="front"):
    if side == "front":
        lower = kps.get("lower_leg_front")
        fetlock = kps.get("fetlock_front")
        hoof = kps.get("hoof_fl") if _vis(kps.get("hoof_fl")) else kps.get("hoof_fr")
    else:
        lower = kps.get("lower_leg_rear")
        fetlock = kps.get("fetlock_rear")
        hoof = kps.get("hoof_rl") if _vis(kps.get("hoof_rl")) else kps.get("hoof_rr")
    if _vis(lower) and _vis(fetlock) and _vis(hoof):
        ang = _angle(lower, fetlock, hoof)
        if ang is not None:
            return {"deg": ang, "conf": min(lower[2], fetlock[2], hoof[2])}
    return None

# -------------------- Scoring & Annotation --------------------

def score_animal(measurements):
    dist, ang = measurements
    return 0.6*dist + 0.4*ang

def annotate_image(bgr_img, boxes, keypoints):
    img = bgr_img.copy()
    for box in boxes:
        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
        cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)
    for (x,y,_) in keypoints:
        cv2.circle(img, (int(x),int(y)), 5, (255,0,0), -1)
    return img

# -------------------- Main Pipeline --------------------

def process_frame_pipeline(frame_bgr, pixels_per_cm=37.79, mask=None):
    """
    frame_bgr: uint8 BGR image from cv2.imread or video frame.
    pixels_per_cm: calibration for cm conversion.
    mask: optional segmentation mask HxW for trait fallbacks.
    Returns: list of detections with traits and annotated BGR image.
    """
    if frame_bgr is None or not isinstance(frame_bgr, np.ndarray):
        raise ValueError("process_frame_pipeline: invalid frame")

    # 1) BG removal -> RGB
    rgb_clean = remove_background(frame_bgr)

    # 2) Detect and crop
    crops, det = detect_and_crop(rgb_clean)

    detections = []
    all_keypoints = []

    # 3) Pose, measure, score per crop
    for crop_bgr in crops:
        kps = pose_estimation(crop_bgr)
        kpdict = make_kp_dict(kps)

        base_meas = measure_distances_and_angles(kps)  # placeholder pair
        sc = score_animal(base_meas)

        # Traits
        t_chest = measure_chest_width(kpdict, pixels_per_cm, mask=None)  # pass mask if available
        t_fleg  = measure_front_leg_length(kpdict, pixels_per_cm)
        t_rleg  = measure_rear_leg_length(kpdict, pixels_per_cm)
        t_hock  = measure_hock_angle(kpdict)
        t_pf    = measure_pastern_angle(kpdict, side="front")
        t_pr    = measure_pastern_angle(kpdict, side="rear")

        traits = {}
        if t_chest: traits["chest_width"] = t_chest
        if t_fleg:  traits["front_leg"] = t_fleg
        if t_rleg:  traits["rear_leg"]  = t_rleg
        if t_hock:  traits["hock_angle"] = t_hock
        if t_pf:    traits["pastern_front"] = t_pf
        if t_pr:    traits["pastern_rear"]  = t_pr

        detections.append({
            "class_": "cattle",
            "score": sc,                    # generic score; replace with your classifier
            "pixel_width": base_meas[0],    # using placeholder pair
            "pixel_height": base_meas[1],   # using placeholder pair
            "cm_width": round(base_meas[0] / pixels_per_cm, 2),
            "cm_height": round(base_meas[1] / pixels_per_cm, 2),
            "traits": traits
        })
        all_keypoints.append(kps)

    # 4) Annotate (draw on original BGR)
    if all_keypoints:
        annotated = annotate_image(frame_bgr, det.boxes, all_keypoints[0])
    else:
        annotated = frame_bgr

    return detections, annotated
