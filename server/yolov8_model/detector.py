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
    if img.dtype != np.float32 and img.dtype != np.float64:
        img = img.astype(np.float32)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)

# -------------------- Background Removal --------------------

def remove_background(frame_bgr):
    assert isinstance(frame_bgr, np.ndarray) and frame_bgr.ndim == 3 and frame_bgr.shape[2] == 3, \
        "Input frame must be BGR HxWx3 uint8"
    h, w = frame_bgr.shape[:2]
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    out = remove(frame_rgb, model_name='u2net')
    if isinstance(out, Image.Image):
        if out.mode != "RGBA":
            out = out.convert("RGBA")
        out_np = np.array(out)
        oh, ow = out_np.shape[:2]
        rgb = out_np[..., :3]
        a = out_np[..., 3].astype(np.float32) / 255.0
        if (oh, ow) != (h, w):
            rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LINEAR)
            a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
        comp = (rgb.astype(np.float32) * a[..., None] + frame_rgb.astype(np.float32) * (1.0 - a[..., None])).astype(np.uint8)
        return comp
    if isinstance(out, np.ndarray):
        out = np.array(out)
        if out.ndim == 2:
            mask = out
            if mask.dtype != np.uint8:
                mask = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
            if mask.shape != (h, w):
                mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
            comp = (frame_rgb.astype(np.float32) * (mask/255.0)[..., None]).astype(np.uint8)
            return comp
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

def derive_mask_from_rgb(rgb):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    thr = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    kernel = np.ones((3,3), np.uint8)
    thr = cv2.morphologyEx(thr, cv2.MORPH_OPEN, kernel, iterations=1)
    thr = cv2.morphologyEx(thr, cv2.MORPH_CLOSE, kernel, iterations=1)
    return thr  # 255=animal, 0=background

# -------------------- Detection --------------------

def detect_and_crop(rgb_img):
    if not isinstance(rgb_img, np.ndarray) or rgb_img.ndim != 3 or rgb_img.shape[2] != 3:
        raise TypeError("detect_and_crop expects RGB HxWx3 ndarray")
    bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
    results = model(bgr)
    full_mask = derive_mask_from_rgb(rgb_img)
    crops, masks = [], []
    det = results[0]
    for box in det.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1 = max(0, min(x1, bgr.shape[1]-1))
        x2 = max(0, min(x2, bgr.shape[1]-1))
        y1 = max(0, min(y1, bgr.shape[0]-1))
        y2 = max(0, min(y2, bgr.shape[0]-1))
        if x2 > x1 and y2 > y1:
            crop = bgr[y1:y2, x1:x2]
            mask_crop = full_mask[y1:y2, x1:x2]
            crops.append(crop)
            masks.append(mask_crop)
    return crops, masks, det

# -------------------- Traits (silhouette-based) --------------------

def chest_width_from_mask(mask, ppcm, band=(0.45, 0.55)):
    H, W = mask.shape
    y1 = int(H * band[0]); y2 = int(H * band[1])
    ys = range(max(0, y1), min(H, y2))
    widths = []
    for y in ys:
        xs = np.where(mask[y] > 0)[0]
        if xs.size:
            widths.append(xs.max() - xs.min())
    if not widths:
        return None
    px = float(np.median(widths))
    return {"px": px, "cm": round(px/ppcm, 2), "conf": 0.7}

def ground_line_y_from_mask(mask):
    ys = np.where(mask.sum(axis=1) > 0)[0]
    return int(ys.max()) if ys.size else None

def top_in_anterior(mask, left_frac=0.0, right_frac=0.35):
    H, W = mask.shape
    x1 = int(W*left_frac); x2 = int(W*right_frac)
    colsum = mask[:, x1:x2].sum(axis=1)
    ys = np.where(colsum > 0)[0]
    return int(ys.min()) if ys.size else None

def withers_height_from_mask(mask, ppcm):
    gy = ground_line_y_from_mask(mask)
    wy = top_in_anterior(mask)
    if gy is None or wy is None:
        return None
    px = max(0, gy - wy)
    return {"px": px, "cm": round(px/ppcm, 2), "conf": 0.7}

def leg_length_from_mask(mask, side, ppcm):
    H, W = mask.shape
    if side=="front":
        x1, x2 = 0, int(W*0.5)
    else:
        x1, x2 = int(W*0.5), W
    sub = mask[:, x1:x2]
    ys = np.where(sub.sum(axis=1) > 0)[0]
    if ys.size == 0:
        return None
    hoof_y = int(ys.max())
    top_y = int(ys.min())
    px = max(0, hoof_y - top_y)
    return {"px": float(px), "cm": round(px/ppcm, 2), "conf": 0.6}

# -------------------- BCS-like features (region-specific) --------------------

def torso_area_ratio(mask):
    ys, xs = np.where(mask > 0)
    if ys.size == 0: return None
    y1, y2 = ys.min(), ys.max()
    x1, x2 = xs.min(), xs.max()
    rect_area = float(max(1, (y2 - y1 + 1) * (x2 - x1 + 1)))
    area = float((mask > 0).sum())
    return area / rect_area

def belly_depth_proxy(mask):
    H, W = mask.shape
    mid_y1, mid_y2 = int(H*0.45), int(H*0.75)
    xs_mid = []
    for y in range(mid_y1, mid_y2):
        xs = np.where(mask[y] > 0)[0]
        if xs.size: xs_mid.append(xs.max() - xs.min())
    if not xs_mid: return None
    width_mid = float(np.median(xs_mid))
    ys = np.where(mask.sum(axis=1) > 0)[0]
    if ys.size == 0: return None
    height_px = float(ys.max() - ys.min() + 1)
    return width_mid / max(1.0, height_px)

def rump_region(mask):
    # Rightmost 35% width, central vertical band
    H, W = mask.shape
    x1 = int(W*0.65); x2 = W
    y1 = int(H*0.35); y2 = int(H*0.85)
    sub = mask[y1:y2, x1:x2]
    return sub

def loin_band(mask):
    # Upper central band to sense short-rib definition
    H, W = mask.shape
    y1 = int(H*0.20); y2 = int(H*0.40)
    x1 = int(W*0.30); x2 = int(W*0.75)
    return mask[y1:y2, x1:x2]

def edge_sharpness_score(gray_roi):
    # Higher when edges are sharp (thinner cows show sharper rib/edge contrast)
    # Use Laplacian variance as a simple sharpness/edge richness proxy
    lap = cv2.Laplacian(gray_roi, cv2.CV_64F)
    var = float(lap.var())
    # Normalize via soft mapping for stability
    return var

def hooks_pins_roundness(mask):
    """
    Approximate roundness near the rump by convexity: area / convexHullArea.
    Higher when edges are rounded (higher BCS).
    """
    roi = rump_region(mask)
    if roi.size == 0: return None
    cnts, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts: return None
    cnt = max(cnts, key=cv2.contourArea)
    area = float(cv2.contourArea(cnt))
    if area < 10: return None
    hull = cv2.convexHull(cnt)
    hull_area = float(cv2.contourArea(hull))
    if hull_area < 1: return None
    return area / hull_area  # 0..1; closer to 1 => more convex/rounded

def tailhead_fill(mask):
    """
    Estimate lateral fill near tailhead by measuring width near top-right rump region.
    Higher width implies more fat folds (higher BCS).
    """
    roi = rump_region(mask)
    if roi.size == 0: return None
    H, W = roi.shape
    # Take top band to focus near tailhead
    band = roi[0:int(H*0.25), :]
    widths = []
    for y in range(band.shape[0]):
        xs = np.where(band[y] > 0)[0]
        if xs.size: widths.append(xs.max() - xs.min())
    if not widths: return None
    wpx = float(np.median(widths))
    # Normalize by roi width
    return wpx / max(1.0, float(W))

def short_ribs_definition(mask, rgb_crop=None):
    """
    Use edge richness in the loin band: sharper edges -> lower BCS.
    """
    band = loin_band(mask)
    if band.size == 0: return None
    # If RGB available, compute on grayscale of same crop; else use mask edges
    # For simplicity, use mask edges which correlate with silhouette undulations.
    edges = cv2.Canny(band, 50, 150)
    score = float(edges.mean())  # 0..255; higher => more edges => lower BCS
    return score

def compute_bcs_like(mask):
    """
    Continuous score in [1,5] blending:
      - torso fill (r), belly depth ratio (d)
      - hooks/pins roundness (hp), tailhead fill (th)
      - short rib definition inverse (sr_inv)
    """
    r = torso_area_ratio(mask)           # 0.4..0.85+
    d = belly_depth_proxy(mask)          # 0.2..0.8+
    hp = hooks_pins_roundness(mask)      # 0.7..1.0 (rounded)
    th = tailhead_fill(mask)             # 0.05..0.6 normalized width
    sr = short_ribs_definition(mask)     # edges mean; higher => leaner

    # Normalize to 0..1 ranges (tune these with data)
    r_n = 0.0 if r is None else float(np.clip((r - 0.40) / (0.85 - 0.40), 0.0, 1.0))
    d_n = 0.0 if d is None else float(np.clip((d - 0.20) / (0.80 - 0.20), 0.0, 1.0))
    hp_n = 0.0 if hp is None else float(np.clip((hp - 0.70) / (1.00 - 0.70), 0.0, 1.0))
    th_n = 0.0 if th is None else float(np.clip((th - 0.08) / (0.50 - 0.08), 0.0, 1.0))
    # Map edge richness to "less edges => higher BCS"
    if sr is None:
        sr_inv = 0.5
    else:
        # Typical edges.mean in 0..120; map 0..120 -> 1..0
        sr_norm = float(np.clip(sr / 120.0, 0.0, 1.0))
        sr_inv = 1.0 - sr_norm

    # Blend weights (sum to 1)
    w_r, w_d, w_hp, w_th, w_sr = 0.25, 0.20, 0.20, 0.20, 0.15
    s01 = w_r*r_n + w_d*d_n + w_hp*hp_n + w_th*th_n + w_sr*sr_inv

    # Map to 1..5 and round to quarter steps
    bcs = 1.0 + 4.0 * float(np.clip(s01, 0.0, 1.0))
    return float(np.round(bcs * 4) / 4.0)

# -------------------- Scoring & Annotation --------------------

def score_animal(traits):
    s = 0.0; w = 0.0
    for k in ["chest_width", "withers_height", "front_leg", "rear_leg"]:
        v = traits.get(k)
        if v and "cm" in v and v["cm"] is not None:
            s += v["cm"]; w += 1.0
    return float(s/w) if w > 0 else 0.0

def annotate_image(bgr_img, boxes):
    img = bgr_img.copy()
    for box in boxes:
        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
        cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)
    return img

# -------------------- Main Pipeline --------------------

def process_frame_pipeline(frame_bgr, pixels_per_cm=37.79):
    if frame_bgr is None or not isinstance(frame_bgr, np.ndarray):
        raise ValueError("process_frame_pipeline: invalid frame")

    # 1) BG removal -> RGB
    rgb_clean = remove_background(frame_bgr)

    # 2) Detect and crop (+ mask crops)
    crops, masks, det = detect_and_crop(rgb_clean)

    detections = []

    # 3) Measure traits per crop
    for crop_bgr, mask in zip(crops, masks):
        traits = {}
        cw = chest_width_from_mask(mask, pixels_per_cm)
        wh = withers_height_from_mask(mask, pixels_per_cm)
        fl = leg_length_from_mask(mask, "front", pixels_per_cm)
        rl = leg_length_from_mask(mask, "rear", pixels_per_cm)

        if cw: traits["chest_width"] = cw
        if wh: traits["withers_height"] = wh
        if fl: traits["front_leg"] = fl
        if rl: traits["rear_leg"] = rl

        score = score_animal(traits)
        bcs = compute_bcs_like(mask)

        detections.append({
            "class_": "cattle",
            "score": score,
            "cm_width": traits.get("chest_width", {}).get("cm"),
            "cm_height": traits.get("withers_height", {}).get("cm"),
            "traits": traits,
            "bcs_score": bcs
        })

    # 4) Annotate (draw on original BGR)
    annotated = annotate_image(frame_bgr, det.boxes)

    return detections, annotated
