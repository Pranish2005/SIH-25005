// src/services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Node/Express app (history, auth, etc.)
const API = axios.create({ baseURL: "http://192.168.137.1:5000/api" });

// Attach token for Node backend
API.interceptors.request.use(async (req) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.log("Error reading token:", e);
  }
  return req;
});

// YOLOv8 FastAPI server
export const YOLO_API_URL = "http://192.168.137.1:8000"; // update if IP/port changes

// Upload photo to YOLOv8 server (fetch + FormData)
export const classifyPhoto = async (imageUri, pixelsPerCm) => {
  if (!pixelsPerCm || Number(pixelsPerCm) <= 0) {
    throw new Error("pixels_per_cm missing or invalid. Run calibration and pass its value.");
  }
  const formData = new FormData();
  formData.append("file", { uri: imageUri, type: "image/jpeg", name: "photo.jpg" });
  formData.append("pixels_per_cm", String(pixelsPerCm));

  const res = await fetch(`${YOLO_API_URL}/classify-photo/`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`classify failed: ${res.status} ${text}`);
  }
  return res.json();
};

// Optional: Calibration helper (color bar)
export const calibrate = async (imageUri, realLengthCm) => {
  const fd = new FormData();
  fd.append("file", { uri: imageUri, type: "image/jpeg", name: "calib.jpg" });
  fd.append("real_length_cm", String(realLengthCm));

  const res = await fetch(`${YOLO_API_URL}/calibrate/`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "multipart/form-data" },
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.pixels_per_cm;
};

// Optional: Calibration helper (ArUco marker)
export const calibrateAruco = async (imageUri, markerLengthCm = 5.0) => {
  const fd = new FormData();
  fd.append("file", { uri: imageUri, type: "image/jpeg", name: "aruco.jpg" });
  fd.append("marker_length_cm", String(markerLengthCm));

  const res = await fetch(`${YOLO_API_URL}/calibrate-aruco/`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "multipart/form-data" },
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.pixels_per_cm;
};

// Save classification data for current user (Node backend)
export const saveClassification = async (data) => {
  const response = await API.post("/history/save", data);
  return response.data;
};

// Fetch recent classification history for current user
export const getRecentHistory = async () => {
  const response = await API.get("/history/recent");
  return response.data;
};

export default API;
